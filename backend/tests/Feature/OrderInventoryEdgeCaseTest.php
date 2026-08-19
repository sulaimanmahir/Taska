<?php

namespace Tests\Feature;

use App\Models\InventoryItem;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class OrderInventoryEdgeCaseTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_a_non_inventory_tracked_product_sells_with_no_inventory_row_at_all(): void
    {
        $tenant = $this->createTenantContext('retail', 'edge-no-track@example.com');
        Sanctum::actingAs($tenant['user']);

        $service = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Consulting Service',
            'selling_price' => 5000,
            'track_inventory' => 'no',
        ]);

        $this->postJson('/api/orders', [
            'items' => [[
                'product_id' => $service->id,
                'quantity' => 1,
                'unit_price' => 5000,
                'total' => 5000,
            ]],
            'subtotal' => 5000,
            'total' => 5000,
            'paid' => 5000,
            'payment_method' => 'cash',
        ])->assertCreated();

        $this->assertDatabaseCount('inventory_items', 0);
        $this->assertDatabaseCount('inventory_movements', 0);
    }

    public function test_returning_a_non_inventory_tracked_product_does_not_touch_inventory(): void
    {
        $tenant = $this->createTenantContext('retail', 'edge-no-track-return@example.com');
        Sanctum::actingAs($tenant['user']);

        $service = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Delivery Fee',
            'selling_price' => 1500,
            'track_inventory' => 'no',
        ]);

        $orderId = $this->postJson('/api/orders', [
            'items' => [[
                'product_id' => $service->id,
                'quantity' => 1,
                'unit_price' => 1500,
                'total' => 1500,
            ]],
            'subtotal' => 1500,
            'total' => 1500,
            'paid' => 1500,
            'payment_method' => 'cash',
        ])->assertCreated()->json('id');

        $this->postJson("/api/orders/{$orderId}/return", [])
            ->assertCreated()
            ->assertJsonPath('order_type', 'return');

        $this->assertDatabaseCount('inventory_items', 0);
        $this->assertDatabaseCount('inventory_movements', 0);
    }

    public function test_a_multi_item_sale_is_rejected_atomically_when_only_one_item_lacks_stock(): void
    {
        $tenant = $this->createTenantContext('retail', 'edge-atomic@example.com');
        Sanctum::actingAs($tenant['user']);

        $wellStocked = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Well Stocked Item',
            'selling_price' => 1000,
            'track_inventory' => 'yes',
        ]);
        $outOfStock = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Out Of Stock Item',
            'selling_price' => 2000,
            'track_inventory' => 'yes',
        ]);

        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $wellStocked->id,
            'quantity' => 10,
        ]);
        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $outOfStock->id,
            'quantity' => 1,
        ]);

        $this->postJson('/api/orders', [
            'items' => [
                ['product_id' => $wellStocked->id, 'quantity' => 2, 'unit_price' => 1000, 'total' => 2000],
                ['product_id' => $outOfStock->id, 'quantity' => 5, 'unit_price' => 2000, 'total' => 10000],
            ],
            'subtotal' => 12000,
            'total' => 12000,
            'paid' => 12000,
            'payment_method' => 'cash',
        ])->assertStatus(422);

        $this->assertDatabaseCount('orders', 0);
        // The well-stocked item's quantity must be untouched - nothing
        // should deduct before the whole order is confirmed valid.
        $this->assertDatabaseHas('inventory_items', [
            'product_id' => $wellStocked->id,
            'quantity' => 10,
        ]);
        $this->assertDatabaseHas('inventory_items', [
            'product_id' => $outOfStock->id,
            'quantity' => 1,
        ]);
    }

    public function test_selling_exactly_the_available_quantity_succeeds_and_leaves_zero_stock(): void
    {
        $tenant = $this->createTenantContext('retail', 'edge-boundary@example.com');
        Sanctum::actingAs($tenant['user']);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Last Units',
            'selling_price' => 750,
            'track_inventory' => 'yes',
        ]);

        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 4,
        ]);

        $this->postJson('/api/orders', [
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 4,
                'unit_price' => 750,
                'total' => 3000,
            ]],
            'subtotal' => 3000,
            'total' => 3000,
            'paid' => 3000,
            'payment_method' => 'cash',
        ])->assertCreated();

        $this->assertDatabaseHas('inventory_items', [
            'product_id' => $product->id,
            'quantity' => 0,
        ]);
    }

    public function test_selling_a_tracked_product_that_was_never_stocked_fails_with_insufficient_stock(): void
    {
        $tenant = $this->createTenantContext('retail', 'edge-never-stocked@example.com');
        Sanctum::actingAs($tenant['user']);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Never Stocked',
            'selling_price' => 500,
            'track_inventory' => 'yes',
        ]);

        $this->postJson('/api/orders', [
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 1,
                'unit_price' => 500,
                'total' => 500,
            ]],
            'subtotal' => 500,
            'total' => 500,
            'paid' => 500,
            'payment_method' => 'cash',
        ])
            ->assertStatus(422)
            ->assertJsonPath('errors.items.0', 'Insufficient stock for this product.');

        $this->assertDatabaseCount('orders', 0);
    }
}
