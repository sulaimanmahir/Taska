<?php

namespace Tests\Feature;

use App\Models\InventoryItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\RetailCashierShift;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class RetailWorkflowTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_retail_business_can_open_close_shift_and_refund_sale_orders(): void
    {
        $tenant = $this->createTenantContext('retail', 'retail-workflow@example.com');

        Sanctum::actingAs($tenant['user']);

        $shift = $this->postJson('/api/retail/shifts/open', [
            'opening_float' => 10000,
        ])->assertCreated()
            ->assertJsonPath('status', 'open')
            ->assertJsonPath('opening_float', '10000.00')
            ->json();

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Cooking Oil',
            'selling_price' => 5000,
            'cost_price' => 3500,
            'track_inventory' => 'yes',
            'is_active' => true,
        ]);

        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 10,
            'reserved_quantity' => 0,
        ]);

        $sale = Order::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'created_by' => $tenant['user']->id,
            'order_number' => Order::generateOrderNumber($tenant['business']->id),
            'order_type' => 'sale',
            'status' => 'completed',
            'subtotal' => 10000,
            'discount' => 0,
            'tax' => 0,
            'total' => 10000,
            'paid' => 10000,
            'change' => 0,
            'payment_method' => 'cash',
        ]);

        OrderItem::create([
            'order_id' => $sale->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 5000,
            'discount' => 0,
            'total' => 10000,
        ]);

        $this->postJson("/api/retail/orders/{$sale->id}/refund", [
            'refund_amount' => 10000,
            'payment_method' => 'cash',
            'reason' => 'Customer changed mind',
            'notes' => 'Full same-day refund',
        ])->assertCreated()
            ->assertJsonPath('status', 'completed')
            ->assertJsonPath('refund_amount', '10000.00')
            ->assertJsonPath('order.order_type', 'sale');

        $this->postJson("/api/retail/shifts/{$shift['id']}/close", [
            'actual_cash' => 10000,
        ])->assertOk()
            ->assertJsonPath('status', 'closed')
            ->assertJsonPath('refund_total', '10000.00')
            ->assertJsonPath('actual_cash', '10000.00');
    }

    public function test_retail_workflow_rejects_foreign_shift_and_order_access(): void
    {
        $tenant = $this->createTenantContext('retail', 'retail-scope@example.com');
        $otherTenant = $this->createTenantContext('retail', 'retail-scope-other@example.com');

        $foreignShift = RetailCashierShift::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'opened_by' => $otherTenant['user']->id,
            'shift_code' => 'SHIFT-FOREIGN-001',
            'status' => 'open',
            'opening_float' => 5000,
            'expected_cash' => 5000,
            'opened_at' => now(),
        ]);

        $foreignOrder = Order::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'created_by' => $otherTenant['user']->id,
            'order_number' => 'ORD-FOREIGN-001',
            'order_type' => 'sale',
            'status' => 'completed',
            'subtotal' => 5000,
            'discount' => 0,
            'tax' => 0,
            'total' => 5000,
            'paid' => 5000,
            'change' => 0,
            'payment_method' => 'cash',
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson("/api/retail/shifts/{$foreignShift->id}/close", [
            'actual_cash' => 5000,
        ])->assertForbidden();

        $this->postJson("/api/retail/orders/{$foreignOrder->id}/refund", [
            'reason' => 'Unauthorized refund attempt',
        ])->assertForbidden();
    }
}
