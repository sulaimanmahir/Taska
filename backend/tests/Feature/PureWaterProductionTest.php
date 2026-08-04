<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductionBatch;
use App\Models\RawMaterial;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class PureWaterProductionTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_pure_water_factory_can_track_batch_costs_energy_and_wastage(): void
    {
        $tenant = $this->createTenantContext('pure_water_factory', 'factory-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Taska Premium Sachet Water',
            'sku' => 'TPSW-50CL',
            'cost_price' => 120,
            'selling_price' => 220,
        ]);

        $packagingMaterialId = $this->postJson('/api/raw-materials', [
            'warehouse_id' => $tenant['warehouse']->id,
            'name' => 'Printed Sachet Nylon',
            'unit' => 'roll',
            'material_category' => 'packaging',
            'quantity' => 20,
            'cost_per_unit' => 15000,
            'supplier_name' => 'Kano Packaging Hub',
            'low_stock_threshold' => 5,
        ])->assertCreated()
            ->json('material.id');

        $chemicalMaterialId = $this->postJson('/api/raw-materials', [
            'warehouse_id' => $tenant['warehouse']->id,
            'name' => 'Treatment Chemical',
            'unit' => 'drum',
            'material_category' => 'chemical',
            'quantity' => 5,
            'cost_per_unit' => 12000,
            'supplier_name' => 'Aqua Care Suppliers',
        ])->assertCreated()
            ->json('material.id');

        $this->postJson('/api/production/purchases', [
            'branch_id' => $tenant['branch']->id,
            'raw_material_id' => $packagingMaterialId,
            'supplier_name' => 'Kano Packaging Hub',
            'quantity' => 10,
            'unit_cost' => 16000,
            'amount_paid' => 120000,
        ])->assertCreated()
            ->assertJsonPath('purchase.balance_due', '40000.00');

        $batchId = $this->postJson('/api/production/batches', [
            'production_date' => now()->toDateString(),
            'machine_runtime_hours' => 6,
            'downtime_minutes' => 45,
            'public_power_hours' => 3,
            'electricity_cost' => 8500,
            'generator_runtime_hours' => 3,
            'generator_fuel_cost' => 12500,
            'labour_cost' => 9000,
            'loading_cost' => 3000,
            'maintenance_allocation' => 2500,
            'sachets_per_bag' => 20,
            'leakage_losses' => 4,
            'torn_sacks' => 2,
            'damaged_nylon' => 1,
            'materials' => [
                [
                    'raw_material_id' => $packagingMaterialId,
                    'quantity_used' => 4,
                    'cost_per_unit' => 16000,
                ],
                [
                    'raw_material_id' => $chemicalMaterialId,
                    'quantity_used' => 1,
                    'cost_per_unit' => 12000,
                ],
            ],
            'outputs' => [
                [
                    'product_id' => $product->id,
                    'quantity_produced' => 100,
                    'selling_price' => 220,
                ],
            ],
        ])->assertCreated()
            ->assertJsonPath('batch.packaging_cost_total', '64000.00')
            ->assertJsonPath('batch.treatment_chemical_cost', '12000.00')
            ->json('batch.id');

        $this->postJson("/api/production/batches/{$batchId}/start")
            ->assertOk()
            ->assertJsonPath('batch.status', 'in_progress');

        $this->postJson('/api/production/energy-logs', [
            'branch_id' => $tenant['branch']->id,
            'production_batch_id' => $batchId,
            'energy_source' => 'generator',
            'runtime_hours' => 3,
            'cost' => 12500,
            'fuel_litres' => 18,
            'outage_minutes' => 45,
        ])->assertCreated()
            ->assertJsonPath('log.energy_source', 'generator');

        $this->postJson('/api/production/wastage-logs', [
            'production_batch_id' => $batchId,
            'raw_material_id' => $packagingMaterialId,
            'loss_type' => 'torn_sacks',
            'quantity' => 2,
            'estimated_cost' => 1800,
        ])->assertCreated()
            ->assertJsonPath('log.loss_type', 'torn_sacks');

        $this->postJson("/api/production/batches/{$batchId}/complete", [
            'warehouse_id' => $tenant['warehouse']->id,
            'damaged_quantity' => 3,
            'wastage_quantity' => 2,
        ])->assertOk()
            ->assertJsonPath('batch.status', 'completed')
            ->assertJsonPath('batch.total_output_quantity', '100.00');

        $this->getJson('/api/production/overview')
            ->assertOk()
            ->assertJsonPath('summary.units_produced_today', 100)
            ->assertJsonPath('summary.electricity_cost_today', 8500)
            ->assertJsonPath('summary.packaging_cost_today', 64000)
            ->assertJsonPath('summary.generator_fuel_today', 12500)
            ->assertJsonCount(1, 'low_stock_materials')
            ->assertJsonPath('low_stock_materials.0.material_category', 'chemical');
    }

    public function test_production_endpoints_reject_foreign_tenant_relations(): void
    {
        $tenant = $this->createTenantContext('pure_water_factory', 'factory-scope@example.com');
        $otherTenant = $this->createTenantContext('pure_water_factory', 'factory-other@example.com');

        Sanctum::actingAs($tenant['user']);

        $localBatch = ProductionBatch::create([
            'business_id' => $tenant['business']->id,
            'batch_number' => ProductionBatch::generateBatchNumber(),
            'production_date' => now()->toDateString(),
            'status' => 'pending',
        ]);

        $foreignProduct = Product::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Output Product',
            'selling_price' => 250,
        ]);

        $foreignMaterial = RawMaterial::create([
            'business_id' => $otherTenant['business']->id,
            'warehouse_id' => $otherTenant['warehouse']->id,
            'name' => 'Foreign Chemical',
            'material_category' => 'chemical',
            'quantity' => 5,
            'cost_per_unit' => 12000,
        ]);

        $foreignBatch = ProductionBatch::create([
            'business_id' => $otherTenant['business']->id,
            'batch_number' => ProductionBatch::generateBatchNumber(),
            'production_date' => now()->toDateString(),
            'status' => 'pending',
        ]);

        $this->postJson('/api/raw-materials', [
            'warehouse_id' => $otherTenant['warehouse']->id,
            'name' => 'Invalid Warehouse Material',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['warehouse_id']);

        $this->postJson('/api/production/batches', [
            'materials' => [[
                'raw_material_id' => $foreignMaterial->id,
                'quantity_used' => 1,
            ]],
            'outputs' => [[
                'product_id' => $foreignProduct->id,
                'quantity_produced' => 10,
            ]],
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['materials.0.raw_material_id', 'outputs.0.product_id']);

        $this->postJson('/api/production/purchases', [
            'branch_id' => $otherTenant['branch']->id,
            'raw_material_id' => $foreignMaterial->id,
            'supplier_name' => 'Foreign Supplier',
            'quantity' => 2,
            'unit_cost' => 10000,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id', 'raw_material_id']);

        $this->postJson('/api/production/energy-logs', [
            'branch_id' => $otherTenant['branch']->id,
            'production_batch_id' => $foreignBatch->id,
            'energy_source' => 'generator',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id', 'production_batch_id']);

        $this->postJson('/api/production/wastage-logs', [
            'production_batch_id' => $foreignBatch->id,
            'raw_material_id' => $foreignMaterial->id,
            'loss_type' => 'leakage',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['production_batch_id', 'raw_material_id']);

        $this->postJson("/api/production/batches/{$localBatch->id}/complete", [
            'warehouse_id' => $otherTenant['warehouse']->id,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['warehouse_id']);
    }
}
