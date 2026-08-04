<?php

namespace Tests\Feature;

use App\Models\InventoryItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\RetailCashierShift;
use App\Models\RetailLoyaltyProfile;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class RetailOperationsTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_retail_business_can_run_shift_loyalty_sale_and_refund_flow(): void
    {
        $tenant = $this->createTenantContext('retail', 'retail-ops@example.com');

        Sanctum::actingAs($tenant['user']);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Indomie Super Pack',
            'barcode' => '1234567890123',
            'selling_price' => 1200,
            'cost_price' => 900,
            'track_inventory' => 'yes',
            'low_stock_alert' => 5,
            'is_active' => true,
        ]);

        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 30,
            'reorder_point' => 5,
        ]);

        $shiftId = $this->postJson('/api/retail/shifts/open', [
            'opening_float' => 15000,
        ])->assertCreated()->json('id');

        $loyaltyId = $this->postJson('/api/retail/loyalty-customers', [
            'name' => 'Grace Shopper',
            'phone' => '08030000001',
            'tier' => 'standard',
        ])->assertCreated()->json('id');

        $this->postJson('/api/retail/petty-cash', [
            'shift_id' => $shiftId,
            'entry_type' => 'spend',
            'category' => 'Cashier nylon bags',
            'amount' => 500,
        ])->assertCreated();

        $orderId = $this->postJson('/api/retail/sales', [
            'loyalty_profile_id' => $loyaltyId,
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 2,
                'unit_price' => 1200,
                'total' => 2400,
            ]],
            'subtotal' => 2400,
            'total' => 2400,
            'paid' => 2400,
            'payment_splits' => [
                ['payment_method' => 'cash', 'amount' => 1000],
                ['payment_method' => 'transfer', 'amount' => 1400, 'reference' => 'TX-1001'],
            ],
        ])->assertCreated()
            ->assertJsonPath('payments.0.payment_method', 'cash')
            ->json('id');

        $this->postJson("/api/retail/orders/{$orderId}/refund", [
            'reason' => 'Customer changed mind',
        ])->assertCreated();

        $this->postJson("/api/retail/shifts/{$shiftId}/close", [
            'actual_cash' => 15500,
        ])->assertOk();

        $this->getJson('/api/retail/overview')
            ->assertOk()
            ->assertJsonPath('summary.loyalty_customers', 1)
            ->assertJsonPath('summary.open_shift_count', 0)
            ->assertJsonPath('refunds.0.reason', 'Customer changed mind');

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('business_type', 'retail')
            ->assertJsonPath('retail.loyalty_customers', 1);
    }

    public function test_retail_endpoint_rejects_sales_with_insufficient_stock(): void
    {
        $tenant = $this->createTenantContext('retail', 'retail-stock@example.com');
        Sanctum::actingAs($tenant['user']);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Retail Stock Water',
            'selling_price' => 180,
            'track_inventory' => 'yes',
            'product_type' => 'good',
        ]);

        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'reorder_point' => 1,
            'reorder_quantity' => 2,
        ]);

        $this->postJson('/api/retail/sales', [
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 2,
                'unit_price' => 180,
                'total' => 360,
            ]],
            'subtotal' => 360,
            'total' => 360,
            'paid' => 360,
            'payment_method' => 'cash',
        ])
            ->assertStatus(422)
            ->assertJsonPath('errors.items.0', 'Insufficient stock for this product.');

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_retail_endpoints_reject_foreign_shift_sale_and_inventory_relations(): void
    {
        $tenant = $this->createTenantContext('retail', 'retail-scope@example.com');
        $otherTenant = $this->createTenantContext('retail', 'retail-other@example.com');

        Sanctum::actingAs($tenant['user']);

        $localProduct = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Local Noodles',
            'selling_price' => 1200,
            'track_inventory' => 'yes',
            'is_active' => true,
        ]);

        $foreignShift = RetailCashierShift::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'opened_by' => $otherTenant['user']->id,
            'shift_code' => 'SHIFT-FOREIGN',
            'status' => 'open',
            'opening_float' => 10000,
            'expected_cash' => 10000,
            'opened_at' => now(),
        ]);

        $foreignCustomer = \App\Models\Customer::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Shopper',
            'phone' => '08030009991',
            'customer_type' => 'individual',
            'is_active' => true,
        ]);

        $foreignLoyalty = RetailLoyaltyProfile::create([
            'business_id' => $otherTenant['business']->id,
            'customer_id' => $foreignCustomer->id,
            'phone' => '08030009991',
            'tier' => 'gold',
        ]);

        $foreignWarehouse = Warehouse::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Warehouse',
            'slug' => 'foreign-warehouse-retail',
            'is_default' => false,
            'is_active' => true,
        ]);

        $foreignProduct = Product::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Product',
            'selling_price' => 900,
            'track_inventory' => 'yes',
            'is_active' => true,
        ]);

        $foreignVariant = ProductVariant::create([
            'product_id' => $foreignProduct->id,
            'name' => 'Foreign Variant',
            'selling_price' => 900,
        ]);

        $this->postJson('/api/retail/petty-cash', [
            'shift_id' => $foreignShift->id,
            'entry_type' => 'spend',
            'category' => 'Foreign shift spend',
            'amount' => 500,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['shift_id']);

        $this->postJson('/api/retail/sales', [
            'customer_id' => $foreignCustomer->id,
            'loyalty_profile_id' => $foreignLoyalty->id,
            'warehouse_id' => $foreignWarehouse->id,
            'items' => [
                [
                    'product_id' => $localProduct->id,
                    'variant_id' => $foreignVariant->id,
                    'quantity' => 1,
                    'unit_price' => 1200,
                    'total' => 1200,
                ],
                [
                    'product_id' => $foreignProduct->id,
                    'quantity' => 1,
                    'unit_price' => 900,
                    'total' => 900,
                ],
            ],
            'subtotal' => 2100,
            'total' => 2100,
            'paid' => 2100,
        ])->assertStatus(422)
            ->assertJsonValidationErrors([
                'customer_id',
                'loyalty_profile_id',
                'warehouse_id',
                'items.0.variant_id',
                'items.1.product_id',
            ]);
    }
}
