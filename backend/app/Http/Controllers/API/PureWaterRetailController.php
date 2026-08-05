<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\PureWaterRetail\StorePureWaterCrateMovementRequest;
use App\Http\Requests\PureWaterRetail\StorePureWaterPackageMovementRequest;
use App\Http\Requests\PureWaterRetail\StorePureWaterTransferRequest;
use App\Http\Resources\PureWaterRetailCrateLedgerResource;
use App\Http\Resources\PureWaterRetailPackageMovementResource;
use App\Http\Resources\PureWaterRetailTransferResource;
use App\Services\PureWaterRetailService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PureWaterRetailController extends Controller
{
    public function __construct(
        private PureWaterRetailService $service,
    ) {
    }

    public function overview(Request $request)
    {
        return response()->json($this->service->overview($request->user()->current_business_id));
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
            'pricing_scope' => 'nullable|in:retail,wholesale,all',
            'package_type' => 'required|string|max:255',
            'minimum_quantity' => 'required|numeric|min:0.001',
            'unit_price' => 'required|numeric|min:0',
            'crate_deposit' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:255',
        ]);

        return response()->json(
            $this->service->createPriceTier($validated, $businessId),
            201
        );
    }

    public function storeSale(Request $request)
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
            'sales_channel' => 'nullable|in:retail,wholesale',
            'delivery_mode' => 'nullable|in:counter,dispatch,route_drop',
            'items' => 'required|array|min:1',
            'items.*.product_id' => [
                'required',
                'integer',
                Rule::exists('products', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'nullable|numeric|min:0',
            'items.*.package_type' => 'required|string|max:255',
            'items.*.units_per_package' => 'nullable|numeric|min:0.001',
            'discount' => 'nullable|numeric|min:0',
            'paid' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|in:cash,transfer,credit,card,wallet',
            'notes' => 'nullable|string',
        ]);

        return response()->json(
            $this->service->createSale(
                $validated,
                $businessId,
                $request->user()->current_branch_id,
                $request->user()->id
            ),
            201
        );
    }

    public function storePackageMovement(StorePureWaterPackageMovementRequest $request)
    {
        $businessId = $request->user()->current_business_id;

        return response()->json((new PureWaterRetailPackageMovementResource(
            $this->service->recordPackageMovement(
                $request->validated(),
                $businessId,
                $request->user()->current_branch_id,
                $request->user()->id
            )
        ))->resolve(), 201);
    }

    public function storeCrateMovement(StorePureWaterCrateMovementRequest $request)
    {
        $businessId = $request->user()->current_business_id;

        return response()->json((new PureWaterRetailCrateLedgerResource(
            $this->service->recordCrateMovement(
                $request->validated(),
                $businessId,
                $request->user()->current_branch_id,
                $request->user()->id
            )
        ))->resolve(), 201);
    }

    public function transfer(StorePureWaterTransferRequest $request)
    {
        $businessId = $request->user()->current_business_id;

        return response()->json((new PureWaterRetailTransferResource(
            $this->service->transferStock($request->validated(), $businessId, $request->user()->id)
        ))->resolve(), 201);
    }
}
