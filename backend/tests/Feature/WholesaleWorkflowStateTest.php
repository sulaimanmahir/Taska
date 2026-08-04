<?php

namespace Tests\Feature;

use App\Models\InventoryItem;
use App\Models\Product;
use App\Models\Warehouse;
use App\Models\WholesaleRouteRun;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class WholesaleWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_wholesale_business_can_update_route_runs_and_record_stock_transfers(): void
    {
        $tenant = $this->createTenantContext('distributor_wholesale', 'wholesale-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $secondaryWarehouse = Warehouse::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Transit Hub',
            'slug' => 'transit-hub',
            'is_default' => false,
            'is_active' => true,
        ]);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => '25kg Rice Bag',
            'sku' => 'WHO-RICE-25',
            'product_type' => 'stocked',
            'cost_price' => 28000,
            'selling_price' => 32000,
            'track_inventory' => true,
            'is_active' => true,
        ]);

        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 30,
            'reserved_quantity' => 0,
        ]);

        $routeRun = WholesaleRouteRun::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'route_name' => 'Kano Metro Monday',
            'status' => 'planned',
            'route_date' => now()->toDateString(),
            'vehicle_reference' => 'TRK-17',
            'target_amount' => 500000,
        ]);

        $this->patchJson("/api/wholesale/route-runs/{$routeRun->id}", [
            'status' => 'completed',
            'actual_amount' => 455000,
            'notes' => 'Completed after afternoon collections',
        ])->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.actual_amount', '455000.00')
            ->assertJsonPath('data.notes', 'Completed after afternoon collections');

        $this->postJson('/api/wholesale/transfers', [
            'from_warehouse_id' => $tenant['warehouse']->id,
            'to_warehouse_id' => $secondaryWarehouse->id,
            'product_id' => $product->id,
            'quantity' => 5,
            'notes' => 'Rebalancing stock for route dispatch',
        ])->assertCreated()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.quantity', '5.000')
            ->assertJsonPath('data.from_warehouse.name', 'Main Warehouse')
            ->assertJsonPath('data.to_warehouse.name', 'Transit Hub');

        $this->assertSame('25.000', InventoryItem::where('warehouse_id', $tenant['warehouse']->id)->firstOrFail()->quantity);
        $this->assertSame('5.000', InventoryItem::where('warehouse_id', $secondaryWarehouse->id)->firstOrFail()->quantity);
    }

    public function test_wholesale_route_updates_are_hidden_from_other_businesses(): void
    {
        $tenant = $this->createTenantContext('distributor_wholesale', 'primary-wholesale@example.com');
        $otherTenant = $this->createTenantContext('distributor_wholesale', 'secondary-wholesale@example.com');

        $routeRun = WholesaleRouteRun::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'route_name' => 'Kaduna Outer Ring',
            'status' => 'in_progress',
            'route_date' => now()->toDateString(),
            'target_amount' => 250000,
        ]);

        Sanctum::actingAs($otherTenant['user']);

        $this->patchJson("/api/wholesale/route-runs/{$routeRun->id}", [
            'status' => 'cancelled',
        ])->assertForbidden();
    }
}
