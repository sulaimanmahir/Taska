<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\AdjustInventoryRequest;
use App\Http\Resources\InventoryAdjustmentResource;
use App\Models\Inventory;
use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $query = \App\Models\InventoryItem::with(['product', 'warehouse'])
            ->where('business_id', $request->user()->current_business_id);
        
        if ($request->warehouse_id) {
            $query->where('warehouse_id', $request->warehouse_id);
        }
        
        if ($request->low_stock) {
            $query->whereRaw('quantity <= reorder_point');
        }
        
        return $query->paginate(20);
    }

    public function lowStock(Request $request)
    {
        return \App\Models\InventoryItem::with(['product', 'warehouse'])
            ->where('business_id', $request->user()->current_business_id)
            ->whereRaw('quantity <= reorder_point')
            ->paginate(20);
    }

    public function adjust(AdjustInventoryRequest $request)
    {
        $validated = $request->validated();

        $item = InventoryItem::findOrFail($validated['inventory_item_id']);
        $this->authorize('update', $item);
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

        return DB::transaction(function () use ($item, $validated, $oldQty, $nextQuantity) {
            $item->quantity = $nextQuantity;
            $item->save();

            $movement = InventoryMovement::create([
                'business_id' => auth()->user()->current_business_id,
                'warehouse_id' => $item->warehouse_id,
                'product_id' => $item->product_id,
                'variant_id' => $item->variant_id,
                'movement_type' => $validated['type'],
                'quantity' => $validated['quantity'],
                'previous_quantity' => $oldQty,
                'new_quantity' => $item->quantity,
                'notes' => $validated['reason'],
                'created_by' => auth()->id(),
            ]);

            return response()->json(
                (new InventoryAdjustmentResource([
                    'item' => $item->fresh(),
                    'movement' => $movement,
                ]))->resolve()
            );
        });
    }

    public function movements(Request $request)
    {
        return \App\Models\InventoryMovement::with(['product', 'warehouse'])
            ->where('business_id', $request->user()->current_business_id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);
    }
}
