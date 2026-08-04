<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\InventoryItem;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class PureWaterRetailOperationsTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_pure_water_retail_can_manage_pricing_sales_crates_and_transfers(): void
    {
        $tenant = $this->createTenantContext('pure_water_retail', 'water-retail@example.com');

        Sanctum::actingAs($tenant['user']);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Taska Sachet Water Bag',
            'sku' => 'TSWB-001',
            'cost_price' => 250,
            'selling_price' => 320,
            'low_stock_alert' => 10,
            'is_active' => true,
        ]);

        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 200,
            'reorder_point' => 10,
        ]);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Musa Provision Store',
            'phone' => '08038889999',
            'customer_type' => 'retailer',
            'is_active' => true,
        ]);

        $this->postJson('/api/pure-water-retail/price-tiers', [
            'customer_id' => $customer->id,
            'product_id' => $product->id,
            'pricing_scope' => 'wholesale',
            'package_type' => 'bag',
            'minimum_quantity' => 10,
            'unit_price' => 300,
            'crate_deposit' => 0,
        ])->assertCreated()
            ->assertJsonPath('unit_price', '300.00');

        $orderId = $this->postJson('/api/pure-water-retail/sales', [
            'customer_id' => $customer->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'sales_channel' => 'wholesale',
            'delivery_mode' => 'route_drop',
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 12,
                'package_type' => 'bag',
                'units_per_package' => 20,
            ]],
            'paid' => 2400,
            'payment_method' => 'transfer',
        ])->assertCreated()
            ->assertJsonPath('total', '3600.00')
            ->json('id');

        $this->assertDatabaseHas('pure_water_retail_package_movements', [
            'business_id' => $tenant['business']->id,
            'reference_order_id' => $orderId,
            'movement_type' => 'sale',
            'package_type' => 'bag',
        ]);

        $this->postJson('/api/pure-water-retail/crates', [
            'customer_id' => $customer->id,
            'product_id' => $product->id,
            'movement_type' => 'issue',
            'crate_count' => 8,
            'deposit_amount' => 12000,
        ])->assertCreated()
            ->assertJsonPath('balance_after', '8.000');

        $secondWarehouse = Warehouse::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Retail Outlet Stock',
            'slug' => 'retail-outlet-stock',
            'is_default' => false,
            'is_active' => true,
        ]);

        $this->postJson('/api/pure-water-retail/transfers', [
            'from_warehouse_id' => $tenant['warehouse']->id,
            'to_warehouse_id' => $secondWarehouse->id,
            'product_id' => $product->id,
            'package_type' => 'bag',
            'quantity' => 15,
            'units_per_package' => 20,
        ])->assertCreated()
            ->assertJsonPath('out.movement_type', 'transfer_out')
            ->assertJsonPath('in.movement_type', 'transfer_in');

        $this->getJson('/api/pure-water-retail/overview')
            ->assertOk()
            ->assertJsonPath('summary.wholesale_revenue_today', 3600)
            ->assertJsonPath('summary.packages_sold_today', 12)
            ->assertJsonPath('summary.crates_outstanding', 8)
            ->assertJsonCount(1, 'price_tiers');

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('business_type', 'pure_water_retail')
            ->assertJsonPath('pure_water_retail.packages_sold_today', 12)
            ->assertJsonPath('pure_water_retail.crates_outstanding', 8);
    }

    public function test_pure_water_retail_endpoints_reject_foreign_tenant_relations(): void
    {
        $tenant = $this->createTenantContext('pure_water_retail', 'water-retail-scope@example.com');
        $otherTenant = $this->createTenantContext('pure_water_retail', 'water-retail-other@example.com');

        Sanctum::actingAs($tenant['user']);

        $localProduct = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Local Water Bag',
            'selling_price' => 320,
            'is_active' => true,
        ]);

        $foreignCustomer = Customer::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Water Customer',
            'phone' => '08030009993',
            'customer_type' => 'retailer',
            'is_active' => true,
        ]);

        $foreignProduct = Product::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Water Product',
            'selling_price' => 280,
            'is_active' => true,
        ]);

        $foreignWarehouse = Warehouse::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Water Warehouse',
            'slug' => 'foreign-water-warehouse',
            'is_default' => false,
            'is_active' => true,
        ]);

        $this->postJson('/api/pure-water-retail/price-tiers', [
            'customer_id' => $foreignCustomer->id,
            'product_id' => $foreignProduct->id,
            'package_type' => 'bag',
            'minimum_quantity' => 10,
            'unit_price' => 300,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['customer_id', 'product_id']);

        $this->postJson('/api/pure-water-retail/sales', [
            'customer_id' => $foreignCustomer->id,
            'warehouse_id' => $foreignWarehouse->id,
            'items' => [
                [
                    'product_id' => $foreignProduct->id,
                    'quantity' => 3,
                    'package_type' => 'bag',
                ],
            ],
            'paid' => 900,
            'payment_method' => 'cash',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['customer_id', 'warehouse_id', 'items.0.product_id']);

        $this->postJson('/api/pure-water-retail/package-movements', [
            'warehouse_id' => $foreignWarehouse->id,
            'product_id' => $foreignProduct->id,
            'customer_id' => $foreignCustomer->id,
            'movement_type' => 'wastage',
            'package_type' => 'bag',
            'quantity' => 2,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['warehouse_id', 'product_id', 'customer_id']);

        $this->postJson('/api/pure-water-retail/crates', [
            'customer_id' => $foreignCustomer->id,
            'product_id' => $foreignProduct->id,
            'movement_type' => 'issue',
            'crate_count' => 6,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['customer_id', 'product_id']);

        $this->postJson('/api/pure-water-retail/transfers', [
            'from_warehouse_id' => $foreignWarehouse->id,
            'to_warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $foreignProduct->id,
            'package_type' => 'bag',
            'quantity' => 5,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['from_warehouse_id', 'product_id']);
    }
}
