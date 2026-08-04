<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Wholesale\StoreWholesaleTransferRequest;
use App\Http\Requests\Wholesale\UpdateWholesaleRouteRunRequest;
use App\Http\Resources\WholesaleRouteRunResource;
use App\Http\Resources\WholesaleStockTransferResource;
use App\Models\WholesaleRouteRun;
use App\Services\WholesaleService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class WholesaleController extends Controller
{
    public function __construct(
        private WholesaleService $service,
    ) {
    }

    public function overview(Request $request)
    {
        return response()->json($this->service->overview($request->user()->current_business_id));
    }

    public function storeSalesRep(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:255',
            'territory' => 'nullable|string|max:255',
            'target_amount' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:active,inactive',
        ]);

        return response()->json($this->service->createSalesRep($validated, $request->user()->current_business_id, $request->user()->current_branch_id), 201);
    }

    public function storePriceTier(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'customer_id' => [
                'nullable',
                'integer',
                Rule::exists('customers', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'product_id' => [
                'required',
                'integer',
                Rule::exists('products', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'tier_name' => 'required|string|max:255',
            'minimum_quantity' => 'required|numeric|min:0.001',
            'unit_price' => 'required|numeric|min:0',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
        ]);

        return response()->json($this->service->createPriceTier($validated, $businessId), 201);
    }

    public function storeRouteRun(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'sales_rep_id' => [
                'nullable',
                'integer',
                Rule::exists('wholesale_sales_reps', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'route_name' => 'required|string|max:255',
            'route_date' => 'required|date',
            'vehicle_reference' => 'nullable|string|max:255',
            'target_amount' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:planned,in_progress,completed,cancelled',
            'notes' => 'nullable|string',
            'stops' => 'nullable|array',
            'stops.*.customer_id' => [
                'nullable',
                'integer',
                Rule::exists('customers', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'stops.*.stop_name' => 'required_with:stops|string|max:255',
            'stops.*.expected_amount' => 'nullable|numeric|min:0',
            'stops.*.status' => 'nullable|in:planned,served,skipped',
            'stops.*.notes' => 'nullable|string',
        ]);

        return response()->json($this->service->createRouteRun($validated, $businessId, $request->user()->current_branch_id), 201);
    }

    public function updateRouteRun(UpdateWholesaleRouteRunRequest $request, WholesaleRouteRun $routeRun)
    {
        $this->authorize('update', $routeRun);

        return new WholesaleRouteRunResource(
            $this->service->updateRouteRun($routeRun, $request->validated())
        );
    }

    public function storeOrder(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'customer_id' => [
                'nullable',
                'integer',
                Rule::exists('customers', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'warehouse_id' => [
                'nullable',
                'integer',
                Rule::exists('warehouses', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'route_run_id' => [
                'nullable',
                'integer',
                Rule::exists('wholesale_route_runs', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'stop_name' => 'nullable|string|max:255',
            'items' => 'required|array|min:1',
            'items.*.product_id' => [
                'required',
                'integer',
                Rule::exists('products', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'items.*.variant_id' => [
                'nullable',
                'integer',
                Rule::exists('product_variants', 'id')->where(function ($query) use ($businessId) {
                    $query->whereIn('product_id', function ($subQuery) use ($businessId) {
                        $subQuery->select('id')
                            ->from('products')
                            ->where('business_id', $businessId);
                    });
                }),
            ],
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'paid' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|in:cash,transfer,credit,card,wallet',
            'notes' => 'nullable|string',
        ]);

        return response()->json($this->service->createWholesaleOrder($validated, $businessId, $request->user()->current_branch_id, $request->user()->id), 201);
    }

    public function storeTransfer(StoreWholesaleTransferRequest $request)
    {
        $businessId = $request->user()->current_business_id;

        return (new WholesaleStockTransferResource(
            $this->service->createStockTransfer($request->validated(), $businessId, $request->user()->id)
        ))->response()->setStatusCode(201);
    }
}
