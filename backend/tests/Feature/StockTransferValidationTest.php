<?php

namespace Tests\Feature;

use App\Models\ConstructionCreditAccount;
use App\Models\Customer;
use App\Models\InventoryItem;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

/**
 * These four write paths (wholesale/pure-water-retail/construction-materials
 * stock transfers and raw-material adjustment) each deducted from a source
 * quantity with no check that enough stock existed, unlike the shared
 * InventoryAdjustmentService used by the main Inventory page - a transfer
 * or adjustment could silently drive a quantity negative. Construction
 * credit payments had the same shape of gap for money instead of stock:
 * nothing stopped a payment larger than the outstanding balance.
 */
class StockTransferValidationTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_wholesale_transfer_rejects_moving_more_than_the_source_warehouse_holds(): void
    {
        $tenant = $this->createTenantContext('wholesale', 'transfer-wholesale@example.com');
        Sanctum::actingAs($tenant['user']);

        $secondWarehouse = Warehouse::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Overflow Depot',
            'slug' => 'overflow-depot-wholesale',
            'is_active' => true,
        ]);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Carton Stock',
            'selling_price' => 5000,
            'track_inventory' => 'yes',
        ]);

        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 5,
        ]);

        $this->postJson('/api/wholesale/transfers', [
            'from_warehouse_id' => $tenant['warehouse']->id,
            'to_warehouse_id' => $secondWarehouse->id,
            'product_id' => $product->id,
            'quantity' => 20,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['quantity']);

        $this->assertDatabaseHas('inventory_items', [
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 5,
        ]);
        $this->assertDatabaseMissing('inventory_items', [
            'warehouse_id' => $secondWarehouse->id,
            'product_id' => $product->id,
        ]);
    }

    public function test_pure_water_retail_transfer_rejects_moving_more_than_the_source_warehouse_holds(): void
    {
        $tenant = $this->createTenantContext('pure_water_retail', 'transfer-purewater@example.com');
        Sanctum::actingAs($tenant['user']);

        $secondWarehouse = Warehouse::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Depot Two',
            'slug' => 'depot-two-purewater',
            'is_active' => true,
        ]);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Sachet Bag',
            'selling_price' => 180,
            'track_inventory' => 'yes',
        ]);

        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 10,
        ]);

        $this->postJson('/api/pure-water-retail/transfers', [
            'from_warehouse_id' => $tenant['warehouse']->id,
            'to_warehouse_id' => $secondWarehouse->id,
            'product_id' => $product->id,
            'package_type' => 'bag',
            'quantity' => 25,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['quantity']);

        $this->assertDatabaseHas('inventory_items', [
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 10,
        ]);
    }

    public function test_construction_materials_transfer_rejects_moving_more_than_the_source_warehouse_holds(): void
    {
        $tenant = $this->createTenantContext('building_materials', 'transfer-construction@example.com');
        Sanctum::actingAs($tenant['user']);

        $secondWarehouse = Warehouse::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Site Store',
            'slug' => 'site-store-construction',
            'is_active' => true,
        ]);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Bag of Cement',
            'selling_price' => 8500,
            'track_inventory' => 'yes',
        ]);

        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 4,
        ]);

        $this->postJson('/api/building-materials/transfers', [
            'product_id' => $product->id,
            'source_warehouse_id' => $tenant['warehouse']->id,
            'destination_warehouse_id' => $secondWarehouse->id,
            'quantity' => 50,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['quantity']);

        $this->assertDatabaseHas('inventory_items', [
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 4,
        ]);
    }

    public function test_construction_credit_payment_cannot_exceed_the_outstanding_balance(): void
    {
        $tenant = $this->createTenantContext('building_materials', 'overpay-construction@example.com');
        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Overpay Testers Ltd',
            'balance' => 40000,
            'customer_type' => 'wholesaler',
            'is_active' => true,
        ]);

        $account = ConstructionCreditAccount::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'customer_id' => $customer->id,
            'due_date' => now()->addDays(7)->toDateString(),
            'total_amount' => 60000,
            'paid_amount' => 20000,
            'outstanding_amount' => 40000,
            'debt_age_bucket' => 'current',
            'status' => 'partial',
        ]);

        $this->postJson("/api/building-materials/credit-accounts/{$account->id}/payments", [
            'amount' => 55000,
            'payment_method' => 'transfer',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['amount']);

        $this->assertDatabaseHas('construction_credit_accounts', [
            'id' => $account->id,
            'paid_amount' => 20000,
            'outstanding_amount' => 40000,
        ]);
        $this->assertDatabaseCount('construction_credit_payments', 0);
    }

    public function test_raw_material_adjustment_cannot_go_below_zero(): void
    {
        $tenant = $this->createTenantContext('pure_water_factory', 'raw-material-floor@example.com');
        Sanctum::actingAs($tenant['user']);

        $rawMaterial = RawMaterial::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'name' => 'Packaging Nylon',
            'quantity' => 8,
            'cost_per_unit' => 500,
        ]);

        $this->postJson("/api/raw-materials/{$rawMaterial->id}/adjust", [
            'quantity' => 20,
            'type' => 'remove',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['quantity']);

        $this->assertDatabaseHas('raw_materials', [
            'id' => $rawMaterial->id,
            'quantity' => 8,
        ]);
    }
}
