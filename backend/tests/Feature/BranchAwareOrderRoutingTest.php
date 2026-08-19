<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\InventoryItem;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class BranchAwareOrderRoutingTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_a_sale_routes_through_the_one_warehouse_assigned_to_its_branch(): void
    {
        $tenant = $this->createTenantContext('retail', 'routing-single@example.com');
        // createTenantContext already gives the tenant's branch a default
        // warehouse - add a second, unrelated branch+warehouse so a mistake
        // here (falling back to the business-wide default instead of the
        // branch's own warehouse) would be visible as a wrong quantity.
        $otherBranch = Branch::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Annex',
            'slug' => 'annex-routing',
            'is_primary' => false,
            'is_active' => true,
        ]);
        $otherWarehouse = Warehouse::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $otherBranch->id,
            'name' => 'Annex Store',
            'slug' => 'annex-store',
            'is_default' => false,
            'is_active' => true,
        ]);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Branch Routed Item',
            'selling_price' => 1000,
            'track_inventory' => true,
        ]);

        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 10,
        ]);
        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $otherWarehouse->id,
            'product_id' => $product->id,
            'quantity' => 50,
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/orders', [
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 2,
                'unit_price' => 1000,
                'total' => 2000,
            ]],
            'subtotal' => 2000,
            'total' => 2000,
            'paid' => 2000,
            'payment_method' => 'cash',
        ])->assertCreated();

        // The acting user's current_branch_id is $tenant['branch'], whose
        // only assigned warehouse is $tenant['warehouse'] - stock must come
        // from there, not the higher-stock warehouse on the other branch.
        $this->assertDatabaseHas('inventory_items', [
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 8,
        ]);
        $this->assertDatabaseHas('inventory_items', [
            'warehouse_id' => $otherWarehouse->id,
            'product_id' => $product->id,
            'quantity' => 50,
        ]);
    }

    public function test_a_branch_with_two_warehouses_routes_to_whichever_has_more_stock_of_that_item(): void
    {
        $tenant = $this->createTenantContext('retail', 'routing-multi@example.com');

        $secondWarehouse = Warehouse::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Overflow Store',
            'slug' => 'overflow-store',
            'is_default' => false,
            'is_active' => true,
        ]);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Multi Warehouse Item',
            'selling_price' => 1000,
            'track_inventory' => true,
        ]);

        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 3,
        ]);
        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $secondWarehouse->id,
            'product_id' => $product->id,
            'quantity' => 40,
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/orders', [
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 5,
                'unit_price' => 1000,
                'total' => 5000,
            ]],
            'subtotal' => 5000,
            'total' => 5000,
            'paid' => 5000,
            'payment_method' => 'cash',
        ])->assertCreated();

        // 3 units in $tenant['warehouse'] isn't enough for a 5-unit sale, but
        // routing to the higher-stock sibling warehouse on the same branch
        // makes it succeed instead of failing on insufficient stock.
        $this->assertDatabaseHas('inventory_items', [
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 3,
        ]);
        $this->assertDatabaseHas('inventory_items', [
            'warehouse_id' => $secondWarehouse->id,
            'product_id' => $product->id,
            'quantity' => 35,
        ]);
    }

    public function test_a_branch_with_no_assigned_warehouse_falls_back_to_the_business_default(): void
    {
        $tenant = $this->createTenantContext('retail', 'routing-fallback@example.com');

        $unassignedBranch = Branch::create([
            'business_id' => $tenant['business']->id,
            'name' => 'No Warehouse Branch',
            'slug' => 'no-warehouse-branch',
            'is_primary' => false,
            'is_active' => true,
        ]);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Fallback Item',
            'selling_price' => 1000,
            'track_inventory' => true,
        ]);

        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 10,
        ]);

        $tenant['user']->forceFill(['current_branch_id' => $unassignedBranch->id])->save();
        Sanctum::actingAs($tenant['user']->fresh());

        $this->postJson('/api/orders', [
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 4,
                'unit_price' => 1000,
                'total' => 4000,
            ]],
            'subtotal' => 4000,
            'total' => 4000,
            'paid' => 4000,
            'payment_method' => 'cash',
        ])->assertCreated();

        $this->assertDatabaseHas('inventory_items', [
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 6,
        ]);
    }

    public function test_a_return_restocks_the_warehouse_the_original_sale_actually_drew_from(): void
    {
        $tenant = $this->createTenantContext('retail', 'routing-return@example.com');

        $secondWarehouse = Warehouse::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Return Overflow',
            'slug' => 'return-overflow',
            'is_default' => false,
            'is_active' => true,
        ]);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Returned Item',
            'selling_price' => 1000,
            'track_inventory' => true,
        ]);

        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 1,
        ]);
        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $secondWarehouse->id,
            'product_id' => $product->id,
            'quantity' => 20,
        ]);

        Sanctum::actingAs($tenant['user']);

        $orderId = $this->postJson('/api/orders', [
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 3,
                'unit_price' => 1000,
                'total' => 3000,
            ]],
            'subtotal' => 3000,
            'total' => 3000,
            'paid' => 3000,
            'payment_method' => 'cash',
        ])->assertCreated()->json('id');

        // Confirm the sale actually drew from the higher-stock warehouse.
        $this->assertDatabaseHas('inventory_items', [
            'warehouse_id' => $secondWarehouse->id,
            'product_id' => $product->id,
            'quantity' => 17,
        ]);

        $this->postJson("/api/orders/{$orderId}/return", [])->assertCreated();

        // The return must restock $secondWarehouse (where it left from),
        // not re-resolve to whichever warehouse now looks "best".
        $this->assertDatabaseHas('inventory_items', [
            'warehouse_id' => $secondWarehouse->id,
            'product_id' => $product->id,
            'quantity' => 20,
        ]);
        $this->assertDatabaseHas('inventory_items', [
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 1,
        ]);
    }
}
