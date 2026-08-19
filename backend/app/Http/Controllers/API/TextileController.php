<?php

namespace App\Http\Controllers\API;

use App\Concerns\ValidatesBusinessOwnership;
use App\Http\Controllers\Controller;
use App\Http\Requests\Textile\UpdateTailoringJobRequest;
use App\Http\Resources\TailoringJobResource;
use App\Models\TailoringJob;
use App\Models\TextileColorVariant;
use App\Models\TextileConsignmentStock;
use App\Models\TextileCustomerMeasurement;
use App\Models\TextileInvoice;
use App\Models\TextileStyleOrder;
use App\Services\TextileService;
use Illuminate\Http\Request;

class TextileController extends Controller
{
    use ValidatesBusinessOwnership;

    public function overview(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $summary = TextileStyleOrder::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN status NOT IN ('ready', 'delivered') THEN 1 ELSE 0 END), 0) as active_jobs,
                COALESCE(SUM(CASE WHEN due_date < date('now') AND status NOT IN ('ready', 'delivered') THEN 1 ELSE 0 END), 0) as overdue_jobs,
                COALESCE(SUM(total_amount - amount_paid), 0) as debtor_exposure
            ")
            ->first();

        return response()->json([
            'summary' => [
                'active_jobs' => (int) ($summary?->active_jobs ?? 0),
                'overdue_jobs' => (int) ($summary?->overdue_jobs ?? 0),
                'debtor_exposure' => (float) ($summary?->debtor_exposure ?? 0),
                'consignment_open' => TextileConsignmentStock::where('business_id', $businessId)->where('status', 'open')->count(),
                'measurements_saved' => TextileCustomerMeasurement::where('business_id', $businessId)->count(),
                'color_variants' => TextileColorVariant::where('business_id', $businessId)->count(),
            ],
        ]);
    }

    public function measurements(Request $request)
    {
        return response()->json(
            TextileCustomerMeasurement::where('business_id', $request->user()->current_business_id)
                ->with('customer')
                ->latest()
                ->get()
        );
    }

    public function storeMeasurement(Request $request, TextileService $service)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'customer_id' => ['required', $this->businessOwnedRule('customers', $businessId)],
            'measurement_profile' => 'required|string|max:100',
            'chest' => 'nullable|numeric|min:0',
            'waist' => 'nullable|numeric|min:0',
            'hip' => 'nullable|numeric|min:0',
            'shoulder' => 'nullable|numeric|min:0',
            'sleeve' => 'nullable|numeric|min:0',
            'length' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        return response()->json($service->createMeasurement($validated, $request->user()->current_business_id), 201);
    }

    public function variants(Request $request)
    {
        return response()->json(
            TextileColorVariant::where('business_id', $request->user()->current_business_id)
                ->with('product')
                ->latest()
                ->get()
        );
    }

    public function storeVariant(Request $request, TextileService $service)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'product_id' => ['required', $this->businessOwnedRule('products', $businessId)],
            'color_name' => 'required|string|max:100',
            'shade_code' => 'nullable|string|max:50',
            'unit_type' => 'nullable|in:yard,meter,roll,piece',
            'available_quantity' => 'nullable|numeric|min:0',
            'consignment_quantity' => 'nullable|numeric|min:0',
            'wholesale_price' => 'nullable|numeric|min:0',
            'retail_price' => 'nullable|numeric|min:0',
        ]);

        return response()->json($service->createVariant($validated, $request->user()->current_business_id), 201);
    }

    public function styleOrders(Request $request)
    {
        return response()->json(
            TextileStyleOrder::where('business_id', $request->user()->current_business_id)
                ->with(['customer', 'measurement', 'variant.product', 'tailoringJob'])
                ->latest()
                ->get()
        );
    }

    public function storeStyleOrder(Request $request, TextileService $service)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'branch_id' => ['nullable', $this->businessOwnedRule('branches', $businessId)],
            'customer_id' => ['required', $this->businessOwnedRule('customers', $businessId)],
            'measurement_id' => ['nullable', $this->businessOwnedRule('textile_customer_measurements', $businessId)],
            'variant_id' => ['nullable', $this->businessOwnedRule('textile_color_variants', $businessId)],
            'style_name' => 'required|string|max:255',
            'garment_type' => 'nullable|string|max:100',
            'status' => 'nullable|in:intake,cutting,stitching,fitting,ready,delivered',
            'fabric_quantity' => 'nullable|numeric|min:0',
            'fabric_unit' => 'nullable|in:yard,meter,roll,piece',
            'labour_charge' => 'nullable|numeric|min:0',
            'fabric_charge' => 'nullable|numeric|min:0',
            'amount_paid' => 'nullable|numeric|min:0',
            'due_date' => 'nullable|date',
            'design_notes' => 'nullable|string',
            'assigned_tailor' => 'nullable|string|max:255',
            'tailoring_stage' => 'nullable|in:cutting,stitching,fitting,finishing,completed',
            'priority' => 'nullable|in:normal,urgent',
            'job_notes' => 'nullable|string',
        ]);

        return response()->json($service->createStyleOrder($validated, $request->user()->current_business_id), 201);
    }

    public function jobs(Request $request)
    {
        return response()->json(
            TailoringJob::where('business_id', $request->user()->current_business_id)
                ->with('styleOrder.customer')
                ->latest()
                ->get()
        );
    }

    public function updateJob(UpdateTailoringJobRequest $request, TailoringJob $job, TextileService $service)
    {
        $this->authorize('update', $job);

        return (new TailoringJobResource(
            $service->updateTailoringJob($job, $request->validated())
        ))->resolve();
    }

    public function consignments(Request $request)
    {
        return response()->json(
            TextileConsignmentStock::where('business_id', $request->user()->current_business_id)
                ->with(['product', 'variant'])
                ->latest('sent_date')
                ->get()
        );
    }

    public function storeConsignment(Request $request, TextileService $service)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'product_id' => ['required', $this->businessOwnedRule('products', $businessId)],
            'variant_id' => ['nullable', $this->businessOwnedRule('textile_color_variants', $businessId)],
            'partner_name' => 'required|string|max:255',
            'quantity_sent' => 'required|numeric|min:0',
            'quantity_returned' => 'nullable|numeric|min:0',
            'quantity_sold' => 'nullable|numeric|min:0',
            'settlement_due' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:open,settled,returned',
            'sent_date' => 'required|date',
            'due_back_date' => 'nullable|date',
        ]);

        return response()->json($service->createConsignment($validated, $request->user()->current_business_id), 201);
    }

    public function invoices(Request $request)
    {
        return response()->json(
            TextileInvoice::where('business_id', $request->user()->current_business_id)
                ->with(['customer', 'styleOrder'])
                ->latest()
                ->get()
        );
    }

    public function storeInvoice(Request $request, TextileService $service)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'customer_id' => ['required', $this->businessOwnedRule('customers', $businessId)],
            'style_order_id' => ['nullable', $this->businessOwnedRule('textile_style_orders', $businessId)],
            'unit_type' => 'nullable|in:yard,meter,roll,piece',
            'quantity' => 'required|numeric|min:0',
            'rate' => 'required|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
            'amount_paid' => 'nullable|numeric|min:0',
        ]);

        return response()->json($service->createInvoice($validated, $request->user()->current_business_id), 201);
    }
}
