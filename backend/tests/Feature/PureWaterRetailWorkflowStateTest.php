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

class PureWaterRetailWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_pure_water_retail_business_can_record_package_crate_and_transfer_movements(): void
    {
        $tenant = $this->createTenantContext('pure_water_retail', 'pwr-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Retail Outlet A',
            'phone' => '08069999999',
            'customer_type' => 'individual',
            'is_active' => true,
        ]);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Sachet Water',
            'sku' => 'PWR-SACHET-1',
            'product_type' => 'good',
            'cost_price' => 80,
            'selling_price' => 120,
            'track_inventory' => true,
            'is_active' => true,
        ]);

        $secondaryWarehouse = Warehouse::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Route Van Stock',
            'slug' => 'route-van-stock',
            'is_default' => false,
            'is_active' => true,
        ]);

        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 100,
            'reserved_quantity' => 0,
        ]);

        $this->postJson('/api/pure-water-retail/package-movements', [
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'customer_id' => $customer->id,
            'movement_type' => 'wastage',
            'package_type' => 'bag',
            'quantity' => 2,
            'units_per_package' => 20,
            'notes' => 'Damaged in transit',
        ])->assertCreated()
            ->assertJsonPath('data.movement_type', 'wastage')
            ->assertJsonPath('data.unit_equivalent_quantity', '40.000')
            ->assertJsonPath('data.customer.name', 'Retail Outlet A');

        $this->postJson('/api/pure-water-retail/crates', [
            'customer_id' => $customer->id,
            'product_id' => $product->id,
            'movement_type' => 'issue',
            'crate_count' => 15,
            'deposit_amount' => 7500,
            'notes' => 'Crates issued to outlet',
        ])->assertCreated()
            ->assertJsonPath('data.balance_after', '15.000')
            ->assertJsonPath('data.customer.name', 'Retail Outlet A');

        $this->postJson('/api/pure-water-retail/transfers', [
            'from_warehouse_id' => $tenant['warehouse']->id,
            'to_warehouse_id' => $secondaryWarehouse->id,
            'product_id' => $product->id,
            'package_type' => 'bag',
            'quantity' => 10,
            'units_per_package' => 20,
            'notes' => 'Dispatch to route van',
        ])->assertCreated()
            ->assertJsonPath('data.out.movement_type', 'transfer_out')
            ->assertJsonPath('data.in.movement_type', 'transfer_in')
            ->assertJsonPath('data.out.warehouse.name', 'Main Warehouse')
            ->assertJsonPath('data.in.warehouse.name', 'Route Van Stock');
    }
}
