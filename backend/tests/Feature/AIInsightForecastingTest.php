<?php

namespace Tests\Feature;

use App\Models\InventoryItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class AIInsightForecastingTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_ai_engine_flags_stockout_forecast_and_customer_concentration(): void
    {
        $tenant = $this->createTenantContext('retail', 'forecast-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Peak Milk Sachet',
            'selling_price' => 1200,
            'cost_price' => 900,
            'low_stock_alert' => 8,
            'track_inventory' => 'yes',
            'is_active' => true,
        ]);

        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 9,
            'reserved_quantity' => 0,
            'reorder_point' => 8,
            'reorder_quantity' => 40,
        ]);

        $majorCustomer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'City Hostel',
            'phone' => '08030000001',
            'customer_type' => 'wholesaler',
            'credit_limit' => 0,
            'balance' => 0,
            'is_active' => true,
        ]);

        $minorCustomer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Walk-in Group',
            'phone' => '08030000002',
            'customer_type' => 'individual',
            'credit_limit' => 0,
            'balance' => 0,
            'is_active' => true,
        ]);

        foreach (range(1, 7) as $dayOffset) {
            $order = Order::create([
                'business_id' => $tenant['business']->id,
                'branch_id' => $tenant['branch']->id,
                'customer_id' => $majorCustomer->id,
                'order_number' => 'ORD-FORECAST-' . $dayOffset,
                'order_type' => 'sale',
                'status' => 'completed',
                'subtotal' => 12000,
                'discount' => 0,
                'tax' => 0,
                'total' => 12000,
                'paid' => 12000,
                'change' => 0,
                'payment_method' => 'transfer',
                'created_at' => now()->subDays($dayOffset),
                'updated_at' => now()->subDays($dayOffset),
            ]);

            DB::table('order_items')->insert([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'variant_id' => null,
                'quantity' => 3,
                'unit_price' => 4000,
                'discount' => 0,
                'total' => 12000,
                'created_at' => now()->subDays($dayOffset),
                'updated_at' => now()->subDays($dayOffset),
            ]);
        }

        $minorOrder = Order::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'customer_id' => $minorCustomer->id,
            'order_number' => 'ORD-FORECAST-MINOR',
            'order_type' => 'sale',
            'status' => 'completed',
            'subtotal' => 6000,
            'discount' => 0,
            'tax' => 0,
            'total' => 6000,
            'paid' => 6000,
            'change' => 0,
            'payment_method' => 'cash',
            'created_at' => now()->subDays(2),
            'updated_at' => now()->subDays(2),
        ]);

        DB::table('order_items')->insert([
            'order_id' => $minorOrder->id,
            'product_id' => $product->id,
            'variant_id' => null,
            'quantity' => 1,
            'unit_price' => 6000,
            'discount' => 0,
            'total' => 6000,
            'created_at' => now()->subDays(2),
            'updated_at' => now()->subDays(2),
        ]);

        $insights = $this->getJson('/api/ai/insights')
            ->assertOk()
            ->json();

        $types = collect($insights)->pluck('type')->all();

        $this->assertContains('stockout_forecast', $types);
        $this->assertContains('customer_concentration_risk', $types);

        $dashboard = $this->getJson('/api/dashboard')
            ->assertOk()
            ->json();

        $this->assertGreaterThanOrEqual(2, $dashboard['ai']['total']);
        $this->assertGreaterThanOrEqual(1, $dashboard['ai']['critical']);
    }
}
