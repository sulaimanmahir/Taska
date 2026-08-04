<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\InventoryItem;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class OrderWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_it_creates_and_returns_orders_with_inventory_and_customer_balance_effects(): void
    {
        $tenant = $this->createTenantContext('retail', 'order-workflow@example.com');
        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Musa Retail Buyer',
            'phone' => '08030031111',
            'customer_type' => 'retailer',
            'credit_limit' => 0,
            'balance' => 0,
            'is_active' => true,
        ]);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Sachet Water Pack',
            'selling_price' => 2500,
            'cost_price' => 1500,
            'track_inventory' => true,
            'is_active' => true,
        ]);

        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 20,
            'reserved_quantity' => 0,
        ]);

        $createResponse = $this->postJson('/api/orders', [
            'customer_id' => $customer->id,
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 2,
                'unit_price' => 2500,
                'total' => 5000,
            ]],
            'subtotal' => 5000,
            'discount' => 0,
            'tax' => 0,
            'total' => 5000,
            'paid' => 3000,
            'payment_method' => 'credit',
            'notes' => 'Front counter sale',
        ])->assertCreated();

        $orderId = $createResponse->json('id');

        $createResponse
            ->assertJsonPath('order_type', 'sale')
            ->assertJsonPath('customer.name', 'Musa Retail Buyer')
            ->assertJsonPath('items.0.product.name', 'Sachet Water Pack');

        $this->assertDatabaseHas('inventory_items', [
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 18,
        ]);

        $this->assertDatabaseHas('customers', [
            'id' => $customer->id,
            'balance' => 2000,
        ]);

        $this->postJson("/api/orders/{$orderId}/return", [])
            ->assertCreated()
            ->assertJsonPath('order_type', 'return')
            ->assertJsonPath('items.0.product.name', 'Sachet Water Pack')
            ->assertJsonPath('total', '-5000.00');

        $this->assertDatabaseHas('inventory_items', [
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 20,
        ]);
    }

    public function test_it_rejects_sales_with_insufficient_stock_at_the_order_endpoint(): void
    {
        $tenant = $this->createTenantContext('retail', 'order-endpoint-stock@example.com');
        Sanctum::actingAs($tenant['user']);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Endpoint Stock Water',
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

        $this->postJson('/api/orders', [
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

    public function test_it_rejects_foreign_tenant_order_reads_and_returns(): void
    {
        $tenant = $this->createTenantContext('retail', 'order-scope@example.com');
        $otherTenant = $this->createTenantContext('retail', 'order-scope-other@example.com');

        $foreignOrder = Order::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'created_by' => $otherTenant['user']->id,
            'order_number' => 'ORD-FOREIGN-001',
            'order_type' => 'sale',
            'status' => 'completed',
            'subtotal' => 1000,
            'discount' => 0,
            'tax' => 0,
            'total' => 1000,
            'paid' => 1000,
            'change' => 0,
            'payment_method' => 'cash',
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->getJson("/api/orders/{$foreignOrder->id}")
            ->assertStatus(403);

        $this->postJson("/api/orders/{$foreignOrder->id}/return", [])
            ->assertStatus(403);
    }
}
