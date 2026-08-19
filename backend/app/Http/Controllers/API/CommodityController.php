<?php

namespace App\Http\Controllers\API;

use App\Concerns\ValidatesBusinessOwnership;
use App\Http\Controllers\Controller;
use App\Http\Requests\Commodity\StoreCommoditySettlementRequest;
use App\Http\Requests\Commodity\UpdateCommodityTradeRequest;
use App\Http\Resources\CommoditySettlementResource;
use App\Http\Resources\CommodityTradeTicketResource;
use App\Models\CommodityTradeTicket;
use App\Services\CommodityService;
use Illuminate\Http\Request;

class CommodityController extends Controller
{
    use ValidatesBusinessOwnership;

    public function __construct(
        private CommodityService $service,
    ) {
    }

    public function overview(Request $request)
    {
        return response()->json($this->service->overview($request->user()->current_business_id));
    }

    public function storeLot(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'warehouse_id' => ['nullable', $this->businessOwnedRule('warehouses', $businessId)],
            'product_id' => ['nullable', $this->businessOwnedRule('products', $businessId)],
            'commodity_name' => 'required|string|max:255',
            'commodity_group' => 'nullable|string|max:255',
            'origin_region' => 'nullable|string|max:255',
            'quality_grade' => 'nullable|string|max:255',
            'moisture_percent' => 'nullable|numeric|min:0',
            'bag_count' => 'nullable|numeric|min:0',
            'weight_kg' => 'required|numeric|min:0',
            'cost_per_kg' => 'nullable|numeric|min:0',
            'selling_price_per_kg' => 'nullable|numeric|min:0',
            'shrinkage_allowance_percent' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:open,held,closed',
            'notes' => 'nullable|string',
        ]);

        return response()->json(
            $this->service->storeLot($validated, $request->user()->current_business_id, $request->user()->current_branch_id),
            201
        );
    }

    public function storePriceBoard(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'product_id' => ['nullable', $this->businessOwnedRule('products', $businessId)],
            'commodity_name' => 'required|string|max:255',
            'market_name' => 'nullable|string|max:255',
            'buying_price_per_kg' => 'nullable|numeric|min:0',
            'selling_price_per_kg' => 'nullable|numeric|min:0',
            'effective_date' => 'required|date',
            'reason' => 'nullable|string|max:255',
        ]);

        return response()->json(
            $this->service->storePriceBoard($validated, $request->user()->current_business_id, $request->user()->current_branch_id),
            201
        );
    }

    public function storeTrade(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'commodity_lot_id' => ['nullable', $this->businessOwnedRule('commodity_lots', $businessId)],
            'customer_id' => ['nullable', $this->businessOwnedRule('customers', $businessId)],
            'supplier_id' => ['nullable', $this->businessOwnedRule('suppliers', $businessId)],
            'ticket_type' => 'required|in:buy,sell',
            'commodity_name' => 'required|string|max:255',
            'quality_grade' => 'nullable|string|max:255',
            'bag_count' => 'nullable|numeric|min:0',
            'weight_kg' => 'required|numeric|min:0',
            'unit_price' => 'required|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'shrinkage_loss_kg' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:open,closed,cancelled',
            'trade_date' => 'required|date',
            'settlement_due_on' => 'nullable|date',
            'channel' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        return response()->json(
            $this->service->storeTrade($validated, $request->user()->current_business_id, $request->user()->current_branch_id),
            201
        );
    }

    public function updateTrade(UpdateCommodityTradeRequest $request, CommodityTradeTicket $trade)
    {
        $this->authorize('update', $trade);

        return new CommodityTradeTicketResource(
            $this->service->updateTradeStatus($trade, $request->validated())
        );
    }

    public function storeSettlement(StoreCommoditySettlementRequest $request, CommodityTradeTicket $trade)
    {
        $this->authorize('update', $trade);

        return (new CommoditySettlementResource(
            $this->service->storeSettlement($trade, $request->validated(), $request->user()->current_business_id, $request->user()->current_branch_id)
        ))->response()->setStatusCode(201);
    }
}
