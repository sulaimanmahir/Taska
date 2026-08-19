<?php

namespace App\Services;

use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Extracted from InventoryController::adjust() so the same logic can be
 * reused by ApprovalService when a deferred (approval-required) adjustment
 * is approved, without duplicating it.
 */
class InventoryAdjustmentService
{
    public function adjust(array $validated, int $businessId, int $userId): array
    {
        $item = InventoryItem::findOrFail($validated['inventory_item_id']);
        $oldQty = $item->quantity;
        $quantity = (float) $validated['quantity'];

        if ($quantity < 0) {
            throw ValidationException::withMessages([
                'quantity' => ['Quantity cannot be negative.'],
            ]);
        }

        $nextQuantity = match ($validated['type']) {
            'add' => $oldQty + $quantity,
            'remove' => $oldQty - $quantity,
            'set' => $quantity,
            default => $oldQty,
        };

        if ($nextQuantity < 0) {
            throw ValidationException::withMessages([
                'quantity' => ['Inventory cannot go below zero.'],
            ]);
        }

        return DB::transaction(function () use ($item, $validated, $oldQty, $nextQuantity, $businessId, $userId) {
            $item->quantity = $nextQuantity;
            $item->save();

            $movement = InventoryMovement::create([
                'business_id' => $businessId,
                'warehouse_id' => $item->warehouse_id,
                'product_id' => $item->product_id,
                'variant_id' => $item->variant_id,
                'movement_type' => $validated['type'],
                'quantity' => $validated['quantity'],
                'previous_quantity' => $oldQty,
                'new_quantity' => $item->quantity,
                'notes' => $validated['reason'],
                'created_by' => $userId,
            ]);

            return [
                'item' => $item->fresh(),
                'movement' => $movement,
            ];
        });
    }
}
