<?php

namespace Tests\Feature;

use App\Models\InventoryItem;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Supplier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class PurchaseFlowTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_supply_business_can_create_receive_and_pay_purchase_orders(): void
    {
        $tenant = $this->createTenantContext('general', 'purchases@example.com');

        Sanctum::actingAs($tenant['user']);

        $supplier = Supplier::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Grace Supply',
            'phone' => '08031112222',
            'is_active' => true,
        ]);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Rice 50kg',
            'selling_price' => 48000,
            'cost_price' => 41000,
            'track_inventory' => 'yes',
            'low_stock_alert' => 5,
            'is_active' => true,
        ]);

        $purchase = $this->postJson('/api/purchases', [
            'supplier_id' => $supplier->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'discount' => 1000,
            'notes' => 'Restock before market day',
            'items' => [[
                'product_id' => $product->id,
                'quantity_ordered' => 10,
                'unit_cost' => 42000,
            ]],
        ])->assertCreated()
            ->assertJsonPath('status', 'pending')
            ->assertJsonPath('subtotal', '420000.00')
            ->assertJsonPath('total', '419000.00')
            ->json();

        $purchaseId = $purchase['id'];
        $purchaseItemId = $purchase['items'][0]['id'];

        $this->postJson("/api/purchases/{$purchaseId}/receive", [
            'notes' => 'First truck arrived',
            'items' => [[
                'purchase_item_id' => $purchaseItemId,
                'quantity_received' => 6,
            ]],
        ])->assertOk()
            ->assertJsonPath('status', 'partial')
            ->assertJsonPath('items.0.quantity_received', '6.000');

        $this->assertDatabaseHas('inventory_items', [
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 6,
        ]);

        $this->postJson("/api/purchases/{$purchaseId}/payments", [
            'amount' => 200000,
            'payment_method' => 'transfer',
            'reference' => 'TX-2000',
            'notes' => 'Initial supplier settlement',
        ])->assertCreated()
            ->assertJsonPath('purchase.paid', '200000.00');

        $this->assertDatabaseHas('purchase_payments', [
            'purchase_id' => $purchaseId,
            'amount' => 200000,
            'payment_method' => 'transfer',
            'reference' => 'TX-2000',
        ]);

        $this->assertDatabaseHas('suppliers', [
            'id' => $supplier->id,
            'balance' => 219000,
        ]);

        $this->getJson('/api/purchases')
            ->assertOk()
            ->assertJsonPath('summary.pending_count', 0)
            ->assertJsonPath('summary.partial_count', 1)
            ->assertJsonPath('summary.outstanding_balance', 219000);
    }

    public function test_purchase_endpoints_reject_foreign_supplier_product_and_warehouse_relations(): void
    {
        $tenant = $this->createTenantContext('general', 'purchase-scope@example.com');
        $otherTenant = $this->createTenantContext('general', 'purchase-other@example.com');

        Sanctum::actingAs($tenant['user']);

        $foreignSupplier = Supplier::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Supply',
            'is_active' => true,
        ]);

        $foreignProduct = Product::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Rice',
            'selling_price' => 40000,
            'track_inventory' => 'yes',
            'is_active' => true,
        ]);

        $this->postJson('/api/purchases', [
            'supplier_id' => $foreignSupplier->id,
            'warehouse_id' => $otherTenant['warehouse']->id,
            'items' => [[
                'product_id' => $foreignProduct->id,
                'quantity_ordered' => 2,
                'unit_cost' => 20000,
            ]],
        ])->assertStatus(422)
            ->assertJsonValidationErrors([
                'supplier_id',
                'warehouse_id',
                'items.0.product_id',
            ]);
    }

    public function test_purchase_records_are_hidden_from_other_businesses(): void
    {
        $tenant = $this->createTenantContext('general', 'purchase-policy-owner@example.com');
        $otherTenant = $this->createTenantContext('general', 'purchase-policy-guest@example.com');

        $purchase = Purchase::create([
            'business_id' => $tenant['business']->id,
            'supplier_id' => Supplier::create([
                'business_id' => $tenant['business']->id,
                'name' => 'Policy Supplier',
                'is_active' => true,
            ])->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'created_by' => $tenant['user']->id,
            'purchase_number' => Purchase::generatePurchaseNumber($tenant['business']->id),
            'status' => 'pending',
            'subtotal' => 10000,
            'discount' => 0,
            'total' => 10000,
            'paid' => 0,
        ]);

        Sanctum::actingAs($otherTenant['user']);

        $this->getJson("/api/purchases/{$purchase->id}")
            ->assertForbidden();

        $this->postJson("/api/purchases/{$purchase->id}/payments", [
            'amount' => 1000,
        ])->assertForbidden();
    }
}
