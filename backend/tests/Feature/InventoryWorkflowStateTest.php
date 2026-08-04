<?php

namespace Tests\Feature;

use App\Models\InventoryItem;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class InventoryWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_it_adjusts_inventory_and_records_movement_with_structured_payload(): void
    {
        $tenant = $this->createTenantContext('retail', 'inventory-workflow@example.com');
        Sanctum::actingAs($tenant['user']);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Bulk Rice',
            'selling_price' => 45000,
            'cost_price' => 38000,
            'track_inventory' => true,
            'is_active' => true,
        ]);

        $item = InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 12,
            'reserved_quantity' => 0,
            'reorder_point' => 5,
        ]);

        $this->postJson('/api/inventory/adjust', [
            'inventory_item_id' => $item->id,
            'quantity' => 3,
            'type' => 'remove',
            'reason' => 'Damaged stock write-off',
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Inventory adjusted')
            ->assertJsonPath('item.quantity', '9.000')
            ->assertJsonPath('movement.movement_type', 'remove')
            ->assertJsonPath('movement.previous_quantity', '12.000')
            ->assertJsonPath('movement.new_quantity', '9.000');

        $this->assertDatabaseHas('inventory_items', [
            'id' => $item->id,
            'quantity' => 9,
        ]);

        $this->assertDatabaseHas('inventory_movements', [
            'business_id' => $tenant['business']->id,
            'product_id' => $product->id,
            'movement_type' => 'remove',
            'quantity' => 3,
            'previous_quantity' => 12,
            'new_quantity' => 9,
            'notes' => 'Damaged stock write-off',
        ]);
    }

    public function test_it_rejects_negative_inventory_adjustments(): void
    {
        $tenant = $this->createTenantContext('retail', 'inventory-negative@example.com');
        Sanctum::actingAs($tenant['user']);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Fragile Bottles',
            'selling_price' => 1500,
            'cost_price' => 1200,
            'track_inventory' => true,
            'is_active' => true,
        ]);

        $item = InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'reserved_quantity' => 0,
            'reorder_point' => 1,
        ]);

        $this->postJson('/api/inventory/adjust', [
            'inventory_item_id' => $item->id,
            'quantity' => 3,
            'type' => 'remove',
            'reason' => 'Over-removal attempt',
        ])
            ->assertStatus(422)
            ->assertJsonPath('errors.quantity.0', 'Inventory cannot go below zero.');
    }

    public function test_it_rejects_foreign_tenant_inventory_adjustments(): void
    {
        $tenant = $this->createTenantContext('retail', 'inventory-scope@example.com');
        $otherTenant = $this->createTenantContext('retail', 'inventory-scope-other@example.com');

        $foreignProduct = Product::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Flour',
            'selling_price' => 28000,
            'cost_price' => 22000,
            'track_inventory' => true,
            'is_active' => true,
        ]);

        $foreignItem = InventoryItem::create([
            'business_id' => $otherTenant['business']->id,
            'warehouse_id' => $otherTenant['warehouse']->id,
            'product_id' => $foreignProduct->id,
            'quantity' => 15,
            'reserved_quantity' => 0,
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/inventory/adjust', [
            'inventory_item_id' => $foreignItem->id,
            'quantity' => 2,
            'type' => 'remove',
            'reason' => 'Invalid adjustment',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['inventory_item_id']);
    }
}
