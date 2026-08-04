<?php

namespace App\Services;

use App\Models\BatchMovement;
use App\Models\ControlledDrugLog;
use App\Models\MedicineSubstitutionRule;
use App\Models\PharmacyDispense;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\RefillReminder;
use Illuminate\Support\Facades\DB;

class PharmacyService
{
    public function createBatch(array $payload, int $businessId): ProductBatch
    {
        $product = $this->resolveProduct($businessId, $payload['product_id']);

        return ProductBatch::create([
            ...$payload,
            'business_id' => $businessId,
            'product_id' => $product->id,
            'remaining_quantity' => $payload['quantity'],
            'near_expiry_discount_percent' => $payload['near_expiry_discount_percent'] ?? 0,
            'discounted_price' => $payload['discounted_price'] ?? 0,
        ])->fresh(['product']);
    }

    public function createSubstitutionRule(array $payload, int $businessId): MedicineSubstitutionRule
    {
        $product = $this->resolveProduct($businessId, $payload['product_id']);
        $substitute = $this->resolveProduct($businessId, $payload['substitute_product_id']);

        return MedicineSubstitutionRule::create([
            ...$payload,
            'business_id' => $businessId,
            'product_id' => $product->id,
            'substitute_product_id' => $substitute->id,
            'is_active' => $payload['is_active'] ?? true,
        ])->fresh(['product', 'substitute']);
    }

    public function useBatch(ProductBatch $batch, array $payload, int $businessId, int $userId): ProductBatch
    {
        return DB::transaction(function () use ($batch, $payload, $businessId, $userId) {
            if ((float) $batch->remaining_quantity < (float) $payload['quantity']) {
                abort(422, 'Insufficient quantity in batch.');
            }

            $batch->decrement('remaining_quantity', (float) $payload['quantity']);

            BatchMovement::create([
                'business_id' => $businessId,
                'product_batch_id' => $batch->id,
                'movement_type' => 'sold',
                'quantity' => $payload['quantity'],
                'reference_type' => $payload['reference_type'] ?? null,
                'reference_id' => $payload['reference_id'] ?? null,
                'notes' => $payload['notes'] ?? null,
                'created_by' => $userId,
            ]);

            return $batch->fresh(['product', 'movements']);
        });
    }

    public function dispense(array $payload, int $businessId, int $userId): PharmacyDispense
    {
        return DB::transaction(function () use ($payload, $businessId, $userId) {
            $product = $this->resolveProduct($businessId, $payload['product_id']);
            $batch = $this->resolveBatch($businessId, $payload['product_batch_id'], $product->id);
            $substitutedFrom = !empty($payload['substituted_from_product_id'])
                ? $this->resolveProduct($businessId, $payload['substituted_from_product_id'])
                : null;

            if ((float) $batch->remaining_quantity < (float) $payload['quantity']) {
                abort(422, 'Insufficient quantity in selected batch.');
            }

            $batch->decrement('remaining_quantity', (float) $payload['quantity']);

            $dispense = PharmacyDispense::create([
                'business_id' => $businessId,
                'customer_id' => $payload['customer_id'] ?? null,
                'product_id' => $product->id,
                'product_batch_id' => $batch->id,
                'substituted_from_product_id' => $substitutedFrom?->id,
                'quantity' => $payload['quantity'],
                'unit_price' => $payload['unit_price'],
                'total_amount' => (float) $payload['quantity'] * (float) $payload['unit_price'],
                'prescription_reference' => $payload['prescription_reference'] ?? null,
                'refill_due' => !empty($payload['create_refill_reminder']),
                'dispensed_at' => $payload['dispensed_at'] ?? now(),
            ]);

            BatchMovement::create([
                'business_id' => $businessId,
                'product_batch_id' => $batch->id,
                'movement_type' => 'dispensed',
                'quantity' => $payload['quantity'],
                'reference_type' => PharmacyDispense::class,
                'reference_id' => $dispense->id,
                'notes' => $payload['notes'] ?? null,
                'created_by' => $userId,
            ]);

            if ($product->is_controlled_drug) {
                ControlledDrugLog::create([
                    'business_id' => $businessId,
                    'product_id' => $product->id,
                    'product_batch_id' => $batch->id,
                    'customer_id' => $payload['customer_id'] ?? null,
                    'movement_type' => 'dispensed',
                    'quantity' => $payload['quantity'],
                    'prescription_reference' => $payload['prescription_reference'] ?? null,
                    'notes' => $payload['notes'] ?? null,
                    'created_by' => $userId,
                ]);
            }

            if (!empty($payload['create_refill_reminder']) && $product->refill_cycle_days) {
                RefillReminder::create([
                    'business_id' => $businessId,
                    'customer_id' => $payload['customer_id'],
                    'product_id' => $product->id,
                    'pharmacy_dispense_id' => $dispense->id,
                    'due_on' => now()->addDays((int) $product->refill_cycle_days)->toDateString(),
                    'status' => 'pending',
                    'notes' => 'Auto-created from dispense flow.',
                ]);
            }

            return $dispense->fresh(['customer', 'product', 'batch', 'substitutedFrom']);
        });
    }

    public function applyNearExpiryDiscount(ProductBatch $batch, float $discountPercent, float $discountedPrice): ProductBatch
    {
        $batch->update([
            'near_expiry_discount_percent' => $discountPercent,
            'discounted_price' => $discountedPrice,
        ]);

        return $batch->fresh(['product']);
    }

    private function resolveProduct(int $businessId, int $productId): Product
    {
        return Product::where('business_id', $businessId)->findOrFail($productId);
    }

    private function resolveBatch(int $businessId, int $batchId, int $productId): ProductBatch
    {
        return ProductBatch::where('business_id', $businessId)
            ->where('product_id', $productId)
            ->findOrFail($batchId);
    }
}
