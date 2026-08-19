<?php

namespace App\Http\Controllers\API;

use App\Concerns\ValidatesBusinessOwnership;
use App\Http\Controllers\Controller;
use App\Http\Requests\Construction\RecordConstructionCreditPaymentRequest;
use App\Http\Requests\Construction\UpdateConstructionDeliveryRequest;
use App\Http\Resources\ConstructionCreditPaymentResource;
use App\Http\Resources\ConstructionDeliveryResource;
use App\Models\ConstructionCreditAccount;
use App\Models\ConstructionDelivery;
use App\Models\ConstructionQuotation;
use App\Services\ConstructionMaterialsService;
use Illuminate\Http\Request;

class ConstructionMaterialsController extends Controller
{
    use ValidatesBusinessOwnership;

    public function __construct(
        private ConstructionMaterialsService $service,
    ) {
    }

    public function overview(Request $request)
    {
        return response()->json(
            $this->service->overview($request->user()->current_business_id, $request->user()->current_branch_id)
        );
    }

    public function storeItem(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:255',
            'barcode' => 'nullable|string|max:255',
            'category_id' => ['nullable', $this->businessOwnedRule('product_categories', $businessId)],
            'subcategory' => 'nullable|string|max:255',
            'brand' => 'nullable|string|max:255',
            'unit_type' => 'required|string|max:50',
            'cost_price' => 'nullable|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'wholesale_price' => 'nullable|numeric|min:0',
            'contractor_price' => 'nullable|numeric|min:0',
            'quantity' => 'nullable|numeric|min:0',
            'reorder_level' => 'nullable|numeric|min:0',
            'supplier_id' => ['nullable', $this->businessOwnedRule('suppliers', $businessId)],
            'warehouse_id' => ['nullable', $this->businessOwnedRule('warehouses', $businessId)],
            'stock_location_type' => 'nullable|in:warehouse,shop,yard,damaged',
            'weight_kg' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'scarcity_pricing_allowed' => 'nullable|boolean',
        ]);

        return response()->json($this->service->createItem($validated, $request->user()), 201);
    }

    public function storeCustomer(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:255',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'credit_limit' => 'nullable|numeric|min:0',
            'customer_role' => 'required|in:walk_in_customer,contractor,engineer,site_foreman,developer,government_buyer,repeat_customer',
            'site_location' => 'nullable|string|max:255',
            'project_name' => 'nullable|string|max:255',
            'pricing_tier' => 'nullable|in:retail,wholesale,contractor',
            'guarantor_notes' => 'nullable|string',
            'is_blocked_defaulter' => 'nullable|boolean',
        ]);

        return response()->json($this->service->createCustomerProfile($validated, $request->user()), 201);
    }

    public function storeQuotation(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'customer_id' => ['nullable', $this->businessOwnedRule('customers', $businessId)],
            'pricing_tier' => 'nullable|in:retail,wholesale,contractor',
            'valid_until' => 'nullable|date',
            'delivery_fee' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => ['nullable', $this->businessOwnedRule('products', $businessId)],
            'items.*.item_name' => 'nullable|string|max:255',
            'items.*.unit_type' => 'nullable|string|max:50',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'nullable|numeric|min:0',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
        ]);

        return response()->json($this->service->createQuotation($validated, $request->user()), 201);
    }

    public function convertQuotation(Request $request, ConstructionQuotation $quotation)
    {
        $this->authorizeBusiness($quotation->business_id, $request->user()->current_business_id);

        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'paid' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|in:cash,transfer,credit,card,wallet',
            'due_date' => 'nullable|date',
            'installment_notes' => 'nullable|string',
            'warehouse_id' => ['nullable', $this->businessOwnedRule('warehouses', $businessId)],
        ]);

        return response()->json($this->service->convertQuotation($quotation, $validated, $request->user()));
    }

    public function storeDelivery(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'order_id' => ['nullable', $this->businessOwnedRule('orders', $businessId)],
            'quotation_id' => ['nullable', $this->businessOwnedRule('construction_quotations', $businessId)],
            'customer_id' => ['nullable', $this->businessOwnedRule('customers', $businessId)],
            'delivery_mode' => 'nullable|in:truck_dispatch,pickup_by_customer,delivery_to_site',
            'destination_type' => 'nullable|in:site,warehouse,customer_pickup',
            'driver_name' => 'nullable|string|max:255',
            'loader_name' => 'nullable|string|max:255',
            'vehicle_reference' => 'nullable|string|max:255',
            'status' => 'nullable|in:pending_dispatch,dispatched,in_transit,delivered,failed,cancelled',
            'failure_reason' => 'nullable|string|max:255',
            'delivery_address' => 'nullable|string',
            'confirmed_by' => 'nullable|string|max:255',
        ]);

        return response()->json($this->service->createDelivery($validated, $request->user()), 201);
    }

    public function updateDelivery(UpdateConstructionDeliveryRequest $request, ConstructionDelivery $delivery)
    {
        $this->authorize('update', $delivery);

        return (new ConstructionDeliveryResource(
            $this->service->updateDelivery($delivery, $request->validated())
        ))->resolve();
    }

    public function recordCreditPayment(RecordConstructionCreditPaymentRequest $request, ConstructionCreditAccount $account)
    {
        $this->authorize('update', $account);

        return response()->json((new ConstructionCreditPaymentResource(
            $this->service->recordCreditPayment($account, $request->validated(), $request->user())
        ))->resolve(), 201);
    }

    public function storePriceChange(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'product_id' => ['required', $this->businessOwnedRule('products', $businessId)],
            'price_type' => 'required|in:selling,wholesale,contractor',
            'new_price' => 'required|numeric|min:0',
            'reason' => 'nullable|string|max:255',
            'effective_date' => 'nullable|date',
        ]);

        return response()->json($this->service->storePriceChange($validated, $request->user()), 201);
    }

    public function storeTransfer(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'product_id' => ['required', $this->businessOwnedRule('products', $businessId)],
            'source_warehouse_id' => ['required', $this->businessOwnedRule('warehouses', $businessId)],
            'destination_warehouse_id' => ['required', $this->businessOwnedRule('warehouses', $businessId), 'different:source_warehouse_id'],
            'unit_of_measure_id' => ['nullable', $this->businessOwnedRule('units_of_measure', $businessId)],
            'quantity' => 'required|numeric|min:0.001',
            'notes' => 'nullable|string',
        ]);

        return response()->json($this->service->storeTransfer($validated, $request->user()), 201);
    }

    private function authorizeBusiness(int $resourceBusinessId, int $currentBusinessId): void
    {
        abort_if($resourceBusinessId !== $currentBusinessId, 403);
    }
}
