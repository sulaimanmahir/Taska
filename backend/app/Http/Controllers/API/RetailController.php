<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Retail\CloseRetailShiftRequest;
use App\Http\Requests\Retail\OpenRetailShiftRequest;
use App\Http\Requests\Retail\RefundRetailOrderRequest;
use App\Http\Resources\RetailCashierShiftResource;
use App\Http\Resources\RetailRefundResource;
use App\Models\Order;
use App\Models\RetailCashierShift;
use App\Services\RetailService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class RetailController extends Controller
{
    public function __construct(
        private RetailService $service,
    ) {
    }

    public function overview(Request $request)
    {
        return response()->json($this->service->overview($request->user()->current_business_id));
    }

    public function openShift(OpenRetailShiftRequest $request)
    {
        $validated = $request->validated();

        return response()->json(
            (new RetailCashierShiftResource($this->service->openShift(
                $validated,
                $request->user()->current_business_id,
                $request->user()->current_branch_id,
                $request->user()->id
            )))->resolve(),
            201
        );
    }

    public function closeShift(CloseRetailShiftRequest $request, RetailCashierShift $shift)
    {
        $this->authorize('update', $shift);
        $validated = $request->validated();

        return response()->json(
            (new RetailCashierShiftResource($this->service->closeShift(
                $shift,
                $validated,
                $request->user()->current_business_id,
                $request->user()->id
            )))->resolve()
        );
    }

    public function storeLoyaltyCustomer(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'tier' => 'nullable|in:standard,silver,gold',
        ]);

        return response()->json($this->service->registerLoyaltyCustomer(
            $validated,
            $request->user()->current_business_id,
            $request->user()->current_branch_id
        ), 201);
    }

    public function storePettyCash(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'shift_id' => [
                'nullable',
                'integer',
                Rule::exists('retail_cashier_shifts', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'entry_type' => 'required|in:funding,spend',
            'category' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string',
            'recorded_at' => 'nullable|date',
        ]);

        return response()->json($this->service->recordPettyCash(
            $validated,
            $request->user()->current_business_id,
            $request->user()->current_branch_id,
            $request->user()->id
        ), 201);
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
            'loyalty_profile_id' => [
                'nullable',
                'integer',
                Rule::exists('retail_loyalty_profiles', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'loyalty_phone' => 'nullable|string|max:255',
            'warehouse_id' => [
                'nullable',
                'integer',
                Rule::exists('warehouses', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
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
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.total' => 'required|numeric|min:0',
            'subtotal' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'total' => 'required|numeric|min:0',
            'paid' => 'required|numeric|min:0',
            'change' => 'nullable|numeric',
            'payment_method' => 'nullable|in:cash,transfer,credit,card,wallet',
            'payment_splits' => 'nullable|array|min:1',
            'payment_splits.*.payment_method' => 'required_with:payment_splits|in:cash,transfer,credit,card,wallet',
            'payment_splits.*.amount' => 'required_with:payment_splits|numeric|min:0.01',
            'payment_splits.*.reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        try {
            $sale = $this->service->recordSale(
                $validated,
                $request->user()->current_business_id,
                $request->user()->current_branch_id,
                $request->user()->id
            );
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
                'errors' => $exception->errors(),
            ], 422);
        }

        return response()->json($sale, 201);
    }

    public function refund(RefundRetailOrderRequest $request, Order $order)
    {
        $this->authorize('update', $order);
        $validated = $request->validated();

        return response()->json(
            (new RetailRefundResource($this->service->processRefund(
                $order,
                $validated,
                $request->user()->current_business_id,
                $request->user()->current_branch_id,
                $request->user()->id
            )->load('order')))->resolve(),
            201
        );
    }
}
