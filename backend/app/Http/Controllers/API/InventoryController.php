<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\AdjustInventoryRequest;
use App\Http\Resources\InventoryAdjustmentResource;
use App\Models\ApprovalRequest;
use App\Models\Inventory;
use App\Models\InventoryItem;
use App\Services\ApprovalService;
use App\Services\InventoryAdjustmentService;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function __construct(
        private ApprovalService $approvalService,
        private InventoryAdjustmentService $inventoryAdjustmentService,
    ) {
    }

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

        $business = $request->user()->currentBusiness;

        if ($this->approvalService->inventoryAdjustmentRequiresApproval($business, $request->user()->current_branch_id)) {
            $approval = $this->approvalService->createRequest(
                $business,
                $request->user(),
                ApprovalRequest::TYPE_INVENTORY_ADJUSTMENT,
                $validated,
                "Inventory {$validated['type']} of {$validated['quantity']} on {$item->product?->name} pending approval",
                $request->user()->current_branch_id,
            );

            return response()->json([
                'message' => 'This business requires approval for manual inventory adjustments. Your request is pending review by a business owner.',
                'approval_pending' => true,
                'approval' => $approval,
            ], 202);
        }

        $result = $this->inventoryAdjustmentService->adjust($validated, $business->id, $request->user()->id);

        return response()->json((new InventoryAdjustmentResource($result))->resolve());
    }

    public function movements(Request $request)
    {
        return \App\Models\InventoryMovement::with(['product', 'warehouse'])
            ->where('business_id', $request->user()->current_business_id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);
    }
}
