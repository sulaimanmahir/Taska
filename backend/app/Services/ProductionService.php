<?php

namespace App\Services;

use App\Models\InventoryItem;
use App\Models\ProductionBatch;
use App\Models\ProductionEnergyLog;
use App\Models\ProductionInputPurchase;
use App\Models\ProductionMaterial;
use App\Models\ProductionOutput;
use App\Models\ProductionWastageLog;
use App\Models\Product;
use App\Models\RawMaterial;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductionService
{
    public function createBatch(array $payload, int $businessId, int $userId): ProductionBatch
    {
        return DB::transaction(function () use ($payload, $businessId, $userId) {
            $materialsPayload = collect($payload['materials'] ?? []);
            $outputsPayload = collect($payload['outputs'] ?? []);

            $materials = $materialsPayload->map(function (array $material) use ($businessId) {
                $rawMaterial = $this->resolveRawMaterial($businessId, $material['raw_material_id']);
                $quantityUsed = (float) $material['quantity_used'];
                $costPerUnit = (float) ($material['cost_per_unit'] ?? $rawMaterial->cost_per_unit ?? 0);
                $cost = $quantityUsed * $costPerUnit;

                return [
                    'raw_material' => $rawMaterial,
                    'quantity_used' => $quantityUsed,
                    'cost_per_unit' => $costPerUnit,
                    'cost' => $cost,
                ];
            });

            $outputs = $outputsPayload->map(function (array $output) use ($businessId) {
                $product = $this->resolveProduct($businessId, $output['product_id']);

                return [
                    'product' => $product,
                    'quantity_produced' => (float) $output['quantity_produced'],
                    'damaged_quantity' => (float) ($output['damaged_quantity'] ?? 0),
                    'selling_price' => (float) ($output['selling_price'] ?? 0),
                ];
            });

            $materialCost = $materials->sum('cost');
            $packagingCost = $materials->filter(fn ($item) => $item['raw_material']->material_category === 'packaging')->sum('cost');
            $chemicalCost = $materials->filter(fn ($item) => $item['raw_material']->material_category === 'chemical')->sum('cost');

            $electricityCost = (float) ($payload['electricity_cost'] ?? 0);
            $generatorFuelCost = (float) ($payload['generator_fuel_cost'] ?? 0);
            $solarBackupCost = (float) ($payload['solar_backup_cost'] ?? 0);
            $labourCost = (float) ($payload['labour_cost'] ?? 0);
            $loadingCost = (float) ($payload['loading_cost'] ?? 0);
            $maintenanceAllocation = (float) ($payload['maintenance_allocation'] ?? 0);

            $directUtilityCost = $materialCost + $electricityCost + $generatorFuelCost + $solarBackupCost;
            $totalBatchCost = $directUtilityCost + $labourCost + $loadingCost + $maintenanceAllocation;
            $estimatedRevenue = $outputs->sum(fn (array $output) => $output['quantity_produced'] * $output['selling_price']);
            $totalOutputQuantity = $outputs->sum('quantity_produced');
            $sachetsPerBag = max((float) ($payload['sachets_per_bag'] ?? 20), 1);

            $batch = ProductionBatch::create([
                'business_id' => $businessId,
                'batch_number' => ProductionBatch::generateBatchNumber(),
                'production_date' => $payload['production_date'] ?? now()->toDateString(),
                'status' => 'pending',
                'notes' => $payload['notes'] ?? null,
                'created_by' => $userId,
                'power_source_mix' => [
                    'public_power_hours' => (float) ($payload['public_power_hours'] ?? 0),
                    'generator_runtime_hours' => (float) ($payload['generator_runtime_hours'] ?? 0),
                    'solar_backup_cost' => $solarBackupCost,
                ],
                'machine_runtime_hours' => (float) ($payload['machine_runtime_hours'] ?? 0),
                'downtime_minutes' => (int) ($payload['downtime_minutes'] ?? 0),
                'public_power_hours' => (float) ($payload['public_power_hours'] ?? 0),
                'electricity_cost' => $electricityCost,
                'generator_runtime_hours' => (float) ($payload['generator_runtime_hours'] ?? 0),
                'generator_fuel_cost' => $generatorFuelCost,
                'solar_backup_cost' => $solarBackupCost,
                'labour_cost' => $labourCost,
                'treatment_chemical_cost' => $chemicalCost,
                'loading_cost' => $loadingCost,
                'maintenance_allocation' => $maintenanceAllocation,
                'packaging_cost_total' => $packagingCost,
                'total_batch_cost' => $totalBatchCost,
                'estimated_revenue' => $estimatedRevenue,
                'gross_margin' => $estimatedRevenue - $directUtilityCost,
                'net_margin' => $estimatedRevenue - $totalBatchCost,
                'cost_per_bag' => $totalOutputQuantity > 0 ? $totalBatchCost / $totalOutputQuantity : 0,
                'cost_per_sachet' => $totalOutputQuantity > 0 ? $totalBatchCost / ($totalOutputQuantity * $sachetsPerBag) : 0,
                'leakage_losses' => (float) ($payload['leakage_losses'] ?? 0),
                'torn_sacks' => (float) ($payload['torn_sacks'] ?? 0),
                'damaged_nylon' => (float) ($payload['damaged_nylon'] ?? 0),
            ]);

            foreach ($materials as $material) {
                ProductionMaterial::create([
                    'production_batch_id' => $batch->id,
                    'raw_material_id' => $material['raw_material']->id,
                    'quantity_used' => $material['quantity_used'],
                    'cost' => $material['cost'],
                ]);
            }

            foreach ($outputs as $output) {
                ProductionOutput::create([
                    'production_batch_id' => $batch->id,
                    'product_id' => $output['product']->id,
                    'quantity_produced' => $output['quantity_produced'],
                    'damaged_quantity' => $output['damaged_quantity'],
                    'selling_price' => $output['selling_price'],
                ]);
            }

            return $batch->fresh(['materials.rawMaterial', 'outputs.product']);
        });
    }

    public function startBatch(ProductionBatch $batch): ProductionBatch
    {
        return DB::transaction(function () use ($batch) {
            $batch->loadMissing('materials.rawMaterial');
            $batch->update(['status' => 'in_progress']);

            foreach ($batch->materials as $material) {
                $material->rawMaterial->decrement('quantity', $material->quantity_used);
            }

            return $batch->fresh(['materials.rawMaterial', 'outputs.product']);
        });
    }

    public function completeBatch(ProductionBatch $batch, array $payload, int $businessId): ProductionBatch
    {
        return DB::transaction(function () use ($batch, $payload, $businessId) {
            $batch->loadMissing(['materials', 'outputs']);

            $batch->update([
                'status' => 'completed',
                'total_output_quantity' => $batch->outputs->sum('quantity_produced'),
                'total_input_quantity' => $batch->materials->sum('quantity_used'),
                'damaged_quantity' => (float) ($payload['damaged_quantity'] ?? 0),
                'wastage_quantity' => (float) ($payload['wastage_quantity'] ?? 0),
                'leakage_losses' => (float) ($payload['leakage_losses'] ?? $batch->leakage_losses),
                'torn_sacks' => (float) ($payload['torn_sacks'] ?? $batch->torn_sacks),
                'damaged_nylon' => (float) ($payload['damaged_nylon'] ?? $batch->damaged_nylon),
            ]);

            foreach ($batch->outputs as $output) {
                $inventory = InventoryItem::firstOrNew([
                    'business_id' => $businessId,
                    'product_id' => $output->product_id,
                    'warehouse_id' => $payload['warehouse_id'] ?? 1,
                ]);

                $inventory->quantity = (float) ($inventory->quantity ?? 0) + (float) $output->quantity_produced;
                $inventory->save();
            }

            return $batch->fresh(['materials.rawMaterial', 'outputs.product']);
        });
    }

    public function createRawMaterial(array $payload, int $businessId): RawMaterial
    {
        return RawMaterial::create([
            'business_id' => $businessId,
            'warehouse_id' => $payload['warehouse_id'] ?? null,
            'name' => $payload['name'],
            'sku' => $payload['sku'] ?? null,
            'unit' => $payload['unit'] ?? 'pcs',
            'material_category' => $payload['material_category'] ?? 'other',
            'quantity' => $payload['quantity'] ?? 0,
            'cost_per_unit' => $payload['cost_per_unit'] ?? 0,
            'reorder_level' => $payload['reorder_level'] ?? 10,
            'description' => $payload['description'] ?? null,
            'supplier_name' => $payload['supplier_name'] ?? null,
            'supplier_phone' => $payload['supplier_phone'] ?? null,
            'supplier_balance' => $payload['supplier_balance'] ?? 0,
            'last_purchase_cost' => $payload['last_purchase_cost'] ?? ($payload['cost_per_unit'] ?? 0),
            'low_stock_threshold' => $payload['low_stock_threshold'] ?? null,
        ])->fresh();
    }

    public function adjustRawMaterial(RawMaterial $material, array $payload): RawMaterial
    {
        $quantity = (float) $payload['quantity'];

        $nextQuantity = match ($payload['type']) {
            'add' => $material->quantity + $quantity,
            'remove' => $material->quantity - $quantity,
            'set' => $quantity,
        };

        if ($nextQuantity < 0) {
            throw ValidationException::withMessages([
                'quantity' => ['Raw material quantity cannot go below zero.'],
            ]);
        }

        $material->quantity = $nextQuantity;
        $material->save();

        return $material->fresh();
    }

    public function recordPurchase(array $payload, int $businessId): ProductionInputPurchase
    {
        return DB::transaction(function () use ($payload, $businessId) {
            $material = $this->resolveRawMaterial($businessId, $payload['raw_material_id']);
            $quantity = (float) $payload['quantity'];
            $unitCost = (float) $payload['unit_cost'];
            $totalCost = $quantity * $unitCost;
            $amountPaid = (float) ($payload['amount_paid'] ?? $totalCost);
            $balanceDue = max($totalCost - $amountPaid, 0);

            $purchase = ProductionInputPurchase::create([
                'business_id' => $businessId,
                'branch_id' => $payload['branch_id'] ?? null,
                'raw_material_id' => $material->id,
                'supplier_name' => $payload['supplier_name'],
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'total_cost' => $totalCost,
                'amount_paid' => $amountPaid,
                'balance_due' => $balanceDue,
                'purchased_at' => $payload['purchased_at'] ?? now(),
                'notes' => $payload['notes'] ?? null,
            ]);

            $material->increment('quantity', $quantity);
            $material->update([
                'supplier_name' => $payload['supplier_name'],
                'supplier_phone' => $payload['supplier_phone'] ?? $material->supplier_phone,
                'supplier_balance' => (float) $material->supplier_balance + $balanceDue,
                'last_purchase_cost' => $unitCost,
                'cost_per_unit' => $unitCost,
            ]);

            return $purchase->fresh('rawMaterial');
        });
    }

    public function recordEnergyLog(array $payload, int $businessId): ProductionEnergyLog
    {
        return ProductionEnergyLog::create([
            'business_id' => $businessId,
            'branch_id' => $payload['branch_id'] ?? null,
            'production_batch_id' => $payload['production_batch_id'] ?? null,
            'energy_source' => $payload['energy_source'],
            'runtime_hours' => $payload['runtime_hours'] ?? 0,
            'cost' => $payload['cost'] ?? 0,
            'fuel_litres' => $payload['fuel_litres'] ?? 0,
            'outage_minutes' => $payload['outage_minutes'] ?? 0,
            'notes' => $payload['notes'] ?? null,
            'logged_at' => $payload['logged_at'] ?? now(),
        ])->fresh('batch');
    }

    public function recordWastageLog(array $payload, int $businessId): ProductionWastageLog
    {
        return ProductionWastageLog::create([
            'business_id' => $businessId,
            'production_batch_id' => $payload['production_batch_id'] ?? null,
            'raw_material_id' => $payload['raw_material_id'] ?? null,
            'loss_type' => $payload['loss_type'],
            'quantity' => $payload['quantity'] ?? 0,
            'estimated_cost' => $payload['estimated_cost'] ?? 0,
            'notes' => $payload['notes'] ?? null,
            'logged_at' => $payload['logged_at'] ?? now(),
        ])->fresh(['batch', 'rawMaterial']);
    }

    private function resolveRawMaterial(int $businessId, int $rawMaterialId): RawMaterial
    {
        return RawMaterial::where('business_id', $businessId)->findOrFail($rawMaterialId);
    }

    private function resolveProduct(int $businessId, int $productId): Product
    {
        return Product::where('business_id', $businessId)->findOrFail($productId);
    }
}
