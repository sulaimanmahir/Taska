<?php

namespace Tests\Feature;

use App\Models\InventoryItem;
use App\Models\Product;
use App\Models\ProductionBatch;
use App\Models\ProductionMaterial;
use App\Models\ProductionOutput;
use App\Models\RawMaterial;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class ProductionWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_manufacturing_business_can_start_complete_batches_and_adjust_materials(): void
    {
        $tenant = $this->createTenantContext('pure_water_factory', 'production-workflow@example.com');

        Sanctum::actingAs($tenant['user']);

        $rawMaterial = RawMaterial::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'name' => 'Packaging Nylon',
            'unit' => 'roll',
            'material_category' => 'packaging',
            'quantity' => 100,
            'cost_per_unit' => 2500,
            'reorder_level' => 10,
        ]);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Sachet Water Bag',
            'selling_price' => 350,
            'cost_price' => 200,
            'track_inventory' => 'yes',
            'is_active' => true,
        ]);

        $batch = ProductionBatch::create([
            'business_id' => $tenant['business']->id,
            'batch_number' => ProductionBatch::generateBatchNumber(),
            'production_date' => now()->toDateString(),
            'status' => 'pending',
            'created_by' => $tenant['user']->id,
        ]);

        ProductionMaterial::create([
            'production_batch_id' => $batch->id,
            'raw_material_id' => $rawMaterial->id,
            'quantity_used' => 15,
            'cost' => 37500,
        ]);

        ProductionOutput::create([
            'production_batch_id' => $batch->id,
            'product_id' => $product->id,
            'quantity_produced' => 120,
            'damaged_quantity' => 5,
            'selling_price' => 350,
        ]);

        $this->postJson("/api/production/batches/{$batch->id}/start")
            ->assertOk()
            ->assertJsonPath('batch.status', 'in_progress');

        $this->assertDatabaseHas('raw_materials', [
            'id' => $rawMaterial->id,
            'quantity' => 85,
        ]);

        $this->postJson("/api/production/batches/{$batch->id}/complete", [
            'warehouse_id' => $tenant['warehouse']->id,
            'damaged_quantity' => 5,
            'wastage_quantity' => 2,
            'leakage_losses' => 1,
            'torn_sacks' => 1,
            'damaged_nylon' => 0.5,
        ])->assertOk()
            ->assertJsonPath('batch.status', 'completed')
            ->assertJsonPath('batch.total_output_quantity', '120.00');

        $this->assertDatabaseHas('inventory_items', [
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 120,
        ]);

        $this->postJson("/api/raw-materials/{$rawMaterial->id}/adjust", [
            'quantity' => 10,
            'type' => 'add',
        ])->assertOk()
            ->assertJsonPath('new_quantity', '95.00')
            ->assertJsonPath('material.name', 'Packaging Nylon');
    }

    public function test_manufacturing_state_actions_are_hidden_from_other_businesses(): void
    {
        $tenant = $this->createTenantContext('pure_water_factory', 'production-owner@example.com');
        $otherTenant = $this->createTenantContext('pure_water_factory', 'production-guest@example.com');

        $rawMaterial = RawMaterial::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'name' => 'Chemical Additive',
            'quantity' => 25,
            'cost_per_unit' => 1000,
        ]);

        $batch = ProductionBatch::create([
            'business_id' => $tenant['business']->id,
            'batch_number' => 'BATCH-OWNER-001',
            'production_date' => now()->toDateString(),
            'status' => 'pending',
            'created_by' => $tenant['user']->id,
        ]);

        Sanctum::actingAs($otherTenant['user']);

        $this->postJson("/api/production/batches/{$batch->id}/start")
            ->assertForbidden();

        $this->postJson("/api/raw-materials/{$rawMaterial->id}/adjust", [
            'quantity' => 5,
            'type' => 'remove',
        ])->assertForbidden();
    }
}
