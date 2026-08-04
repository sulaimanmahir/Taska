<?php

namespace Tests\Feature;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class ReportControllerTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_profit_loss_report_uses_cost_of_goods_sold_for_completed_sales_in_date_range(): void
    {
        $tenant = $this->createTenantContext('retail', 'reports@example.com');

        Sanctum::actingAs($tenant['user']);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Premium Rice',
            'sku' => 'RICE-001',
            'cost_price' => 600,
            'selling_price' => 1000,
            'track_inventory' => 'yes',
            'low_stock_alert' => 5,
            'is_active' => true,
        ]);

        $expenseCategoryId = DB::table('expense_categories')->insertGetId([
            'business_id' => $tenant['business']->id,
            'name' => 'Operations',
            'slug' => 'operations',
            'description' => 'Operating costs',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $completedOrderId = DB::table('orders')->insertGetId([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'customer_id' => null,
            'created_by' => $tenant['user']->id,
            'order_number' => 'ORD-REPORT-1001',
            'order_type' => 'sale',
            'status' => 'completed',
            'subtotal' => 2000,
            'discount' => 0,
            'tax' => 0,
            'total' => 2000,
            'paid' => 2000,
            'change' => 0,
            'payment_method' => 'cash',
            'payment_reference' => null,
            'notes' => 'Included in report',
            'created_at' => '2026-05-20 14:30:00',
            'updated_at' => '2026-05-20 14:30:00',
        ]);

        DB::table('order_items')->insert([
            'order_id' => $completedOrderId,
            'product_id' => $product->id,
            'variant_id' => null,
            'quantity' => 2,
            'unit_price' => 1000,
            'discount' => 0,
            'total' => 2000,
            'created_at' => '2026-05-20 14:30:00',
            'updated_at' => '2026-05-20 14:30:00',
        ]);

        $pendingOrderId = DB::table('orders')->insertGetId([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'customer_id' => null,
            'created_by' => $tenant['user']->id,
            'order_number' => 'ORD-REPORT-1002',
            'order_type' => 'sale',
            'status' => 'pending',
            'subtotal' => 1000,
            'discount' => 0,
            'tax' => 0,
            'total' => 1000,
            'paid' => 0,
            'change' => 0,
            'payment_method' => 'cash',
            'payment_reference' => null,
            'notes' => 'Excluded because pending',
            'created_at' => '2026-05-20 16:00:00',
            'updated_at' => '2026-05-20 16:00:00',
        ]);

        DB::table('order_items')->insert([
            'order_id' => $pendingOrderId,
            'product_id' => $product->id,
            'variant_id' => null,
            'quantity' => 1,
            'unit_price' => 1000,
            'discount' => 0,
            'total' => 1000,
            'created_at' => '2026-05-20 16:00:00',
            'updated_at' => '2026-05-20 16:00:00',
        ]);

        $outsideRangeOrderId = DB::table('orders')->insertGetId([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'customer_id' => null,
            'created_by' => $tenant['user']->id,
            'order_number' => 'ORD-REPORT-1003',
            'order_type' => 'sale',
            'status' => 'completed',
            'subtotal' => 1000,
            'discount' => 0,
            'tax' => 0,
            'total' => 1000,
            'paid' => 1000,
            'change' => 0,
            'payment_method' => 'cash',
            'payment_reference' => null,
            'notes' => 'Excluded because out of range',
            'created_at' => '2026-05-19 10:00:00',
            'updated_at' => '2026-05-19 10:00:00',
        ]);

        DB::table('order_items')->insert([
            'order_id' => $outsideRangeOrderId,
            'product_id' => $product->id,
            'variant_id' => null,
            'quantity' => 1,
            'unit_price' => 1000,
            'discount' => 0,
            'total' => 1000,
            'created_at' => '2026-05-19 10:00:00',
            'updated_at' => '2026-05-19 10:00:00',
        ]);

        DB::table('expenses')->insert([
            [
                'business_id' => $tenant['business']->id,
                'branch_id' => $tenant['branch']->id,
                'expense_category_id' => $expenseCategoryId,
                'created_by' => $tenant['user']->id,
                'description' => 'Fuel for deliveries',
                'amount' => 300,
                'payment_method' => 'cash',
                'reference' => null,
                'expense_date' => '2026-05-20',
                'is_approved' => true,
                'created_at' => '2026-05-20 12:00:00',
                'updated_at' => '2026-05-20 12:00:00',
            ],
            [
                'business_id' => $tenant['business']->id,
                'branch_id' => $tenant['branch']->id,
                'expense_category_id' => $expenseCategoryId,
                'created_by' => $tenant['user']->id,
                'description' => 'Older expense',
                'amount' => 150,
                'payment_method' => 'cash',
                'reference' => null,
                'expense_date' => '2026-05-19',
                'is_approved' => true,
                'created_at' => '2026-05-19 12:00:00',
                'updated_at' => '2026-05-19 12:00:00',
            ],
        ]);

        $this->getJson('/api/reports/profit-loss?date_from=2026-05-20&date_to=2026-05-20')
            ->assertOk()
            ->assertJsonPath('period.from', '2026-05-20')
            ->assertJsonPath('period.to', '2026-05-20')
            ->assertJsonPath('revenue', 2000)
            ->assertJsonPath('cost_of_goods_sold', 1200)
            ->assertJsonPath('expenses', 300)
            ->assertJsonPath('gross_profit', 800)
            ->assertJsonPath('net_profit', 500);
    }
}
