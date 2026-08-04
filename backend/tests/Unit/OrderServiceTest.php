<?php

namespace Tests\Unit;

use App\Models\Customer;
use App\Models\InventoryItem;
use App\Models\Order;
use App\Models\Product;
use App\Services\OrderService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class OrderServiceTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_create_return_rejects_orders_outside_the_business_scope(): void
    {
        $tenant = $this->createTenantContext('retail', 'order-service-local@example.com');
        $foreignTenant = $this->createTenantContext('retail', 'order-service-foreign@example.com');

        $foreignOrder = Order::create([
            'business_id' => $foreignTenant['business']->id,
            'branch_id' => $foreignTenant['branch']->id,
            'created_by' => $foreignTenant['user']->id,
            'order_number' => 'ORD-FOREIGN-1',
            'order_type' => 'sale',
            'status' => 'completed',
            'subtotal' => 5000,
            'total' => 5000,
            'paid' => 5000,
            'payment_method' => 'cash',
        ]);

        $this->expectException(ModelNotFoundException::class);

        app(OrderService::class)->createReturn(
            $foreignOrder->id,
            $tenant['business']->id,
            $tenant['user']->id
        );
    }

    public function test_create_order_rejects_credit_customers_outside_the_business_scope(): void
    {
        $tenant = $this->createTenantContext('retail', 'order-service-create@example.com');
        $foreignTenant = $this->createTenantContext('retail', 'order-service-create-foreign@example.com');

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Scoped Sachet Water',
            'selling_price' => 250,
            'track_inventory' => 'yes',
            'product_type' => 'good',
        ]);

        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 10,
            'reorder_point' => 1,
            'reorder_quantity' => 5,
        ]);

        $foreignCustomer = Customer::create([
            'business_id' => $foreignTenant['business']->id,
            'branch_id' => $foreignTenant['branch']->id,
            'name' => 'Foreign Credit Customer',
            'customer_type' => 'individual',
            'balance' => 0,
            'is_active' => true,
        ]);

        try {
            app(OrderService::class)->createOrder([
                'business_id' => $tenant['business']->id,
                'branch_id' => $tenant['branch']->id,
                'warehouse_id' => $tenant['warehouse']->id,
                'customer_id' => $foreignCustomer->id,
                'items' => [[
                    'product_id' => $product->id,
                    'quantity' => 1,
                    'unit_price' => 250,
                    'total' => 250,
                ]],
                'subtotal' => 250,
                'total' => 250,
                'paid' => 0,
                'payment_method' => 'credit',
            ], $tenant['user']->id);

            $this->fail('Expected cross-tenant credit customer lookup to fail.');
        } catch (ModelNotFoundException $exception) {
            $this->assertDatabaseCount('orders', 0);
        }
    }

    public function test_create_order_rejects_sales_when_inventory_is_insufficient(): void
    {
        $tenant = $this->createTenantContext('retail', 'order-service-stock@example.com');

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Low Stock Water',
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

        $this->expectException(ValidationException::class);

        app(OrderService::class)->createOrder([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'warehouse_id' => $tenant['warehouse']->id,
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
        ], $tenant['user']->id);
    }

    public function test_order_controller_returns_validation_error_for_insufficient_stock_payload(): void
    {
        $tenant = $this->createTenantContext('retail', 'order-controller-stock@example.com');

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Controller Stock Water',
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

        $this->actingAs($tenant['user'], 'sanctum')
            ->postJson('/api/orders', [
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
    }
}
