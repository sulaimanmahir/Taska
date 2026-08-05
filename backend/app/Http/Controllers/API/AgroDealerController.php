<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Agro\StoreAgroSubsidySaleRequest;
use App\Http\Requests\Agro\UpdateAgroRecoveryRequest;
use App\Http\Resources\AgroFarmerCreditRecoveryResource;
use App\Http\Resources\AgroSubsidySaleResource;
use App\Models\AgroAdvisoryRecord;
use App\Models\AgroFarmerCreditRecovery;
use App\Models\AgroRegionalSalesTrend;
use App\Models\AgroSeasonalForecast;
use App\Models\AgroSubsidySale;
use App\Services\AgroDealerService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

class AgroDealerController extends Controller
{
    public function overview(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $forecasts = AgroSeasonalForecast::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(forecast_quantity), 0) as forecast_quantity,
                COALESCE(SUM(reserved_quantity), 0) as reserved_quantity,
                COALESCE(AVG(confidence_score), 0) as avg_confidence
            ")
            ->first();

        $subsidies = AgroSubsidySale::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(amount_due), 0) as programme_sales_total,
                COALESCE(SUM(amount_due - amount_received), 0) as subsidy_receivable,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending_programmes
            ")
            ->first();

        $recoveries = AgroFarmerCreditRecovery::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(outstanding_amount), 0) as outstanding_credit,
                COALESCE(SUM(CASE WHEN status != 'recovered' THEN 1 ELSE 0 END), 0) as open_recoveries
            ")
            ->first();

        return response()->json([
            'summary' => [
                'forecast_quantity' => (float) ($forecasts?->forecast_quantity ?? 0),
                'reserved_quantity' => (float) ($forecasts?->reserved_quantity ?? 0),
                'avg_confidence' => round((float) ($forecasts?->avg_confidence ?? 0), 1),
                'programme_sales_total' => (float) ($subsidies?->programme_sales_total ?? 0),
                'subsidy_receivable' => (float) ($subsidies?->subsidy_receivable ?? 0),
                'pending_programmes' => (int) ($subsidies?->pending_programmes ?? 0),
                'outstanding_credit' => (float) ($recoveries?->outstanding_credit ?? 0),
                'open_recoveries' => (int) ($recoveries?->open_recoveries ?? 0),
                'advisories_pending' => AgroAdvisoryRecord::where('business_id', $businessId)->where('follow_up_status', '!=', 'completed')->count(),
            ],
        ]);
    }

    public function forecasts(Request $request)
    {
        return response()->json(
            AgroSeasonalForecast::where('business_id', $request->user()->current_business_id)
                ->with('product')
                ->latest()
                ->get()
        );
    }

    public function storeForecast(Request $request, AgroDealerService $service)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'branch_id' => ['nullable', $this->businessOwnedRule('branches', $businessId)],
            'product_id' => ['nullable', $this->businessOwnedRule('products', $businessId)],
            'season_name' => 'required|string|max:255',
            'region_name' => 'required|string|max:255',
            'forecast_quantity' => 'required|numeric|min:0',
            'reserved_quantity' => 'nullable|numeric|min:0',
            'confidence_score' => 'nullable|numeric|min:0|max:100',
            'forecast_start_date' => 'nullable|date',
            'forecast_end_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        return response()->json($service->createForecast($validated, $request->user()->current_business_id), 201);
    }

    public function subsidySales(Request $request)
    {
        return response()->json(
            AgroSubsidySale::where('business_id', $request->user()->current_business_id)
                ->with(['customer', 'product'])
                ->latest('sale_date')
                ->get()
        );
    }

    public function storeSubsidySale(StoreAgroSubsidySaleRequest $request, AgroDealerService $service)
    {
        return response()->json((new AgroSubsidySaleResource(
            $service->createSubsidySale($request->validated(), $request->user()->current_business_id)
        ))->resolve(), 201);
    }

    public function recoveries(Request $request)
    {
        return response()->json(
            AgroFarmerCreditRecovery::where('business_id', $request->user()->current_business_id)
                ->with('customer')
                ->latest()
                ->get()
        );
    }

    public function storeRecovery(Request $request, AgroDealerService $service)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'branch_id' => ['nullable', $this->businessOwnedRule('branches', $businessId)],
            'customer_id' => ['required', $this->businessOwnedRule('customers', $businessId)],
            'recovery_reference' => 'nullable|string|max:255',
            'region_name' => 'nullable|string|max:255',
            'credit_amount' => 'required|numeric|min:0',
            'recovered_amount' => 'nullable|numeric|min:0',
            'due_date' => 'nullable|date',
            'last_contacted_at' => 'nullable|date',
            'status' => 'nullable|in:open,under_review,recovered,defaulted',
            'notes' => 'nullable|string',
        ]);

        return response()->json($service->createCreditRecovery($validated, $request->user()->current_business_id), 201);
    }

    public function updateRecovery(UpdateAgroRecoveryRequest $request, AgroFarmerCreditRecovery $recovery, AgroDealerService $service)
    {
        $this->authorize('update', $recovery);

        return (new AgroFarmerCreditRecoveryResource(
            $service->updateRecovery($recovery, $request->validated())
        ))->resolve();
    }

    public function advisories(Request $request)
    {
        return response()->json(
            AgroAdvisoryRecord::where('business_id', $request->user()->current_business_id)
                ->with('customer')
                ->latest('advised_on')
                ->get()
        );
    }

    public function storeAdvisory(Request $request, AgroDealerService $service)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'branch_id' => ['nullable', $this->businessOwnedRule('branches', $businessId)],
            'customer_id' => ['nullable', $this->businessOwnedRule('customers', $businessId)],
            'farmer_name' => 'nullable|string|max:255',
            'region_name' => 'nullable|string|max:255',
            'advisory_type' => 'required|string|max:255',
            'crop_or_input' => 'nullable|string|max:255',
            'recommendation' => 'required|string',
            'follow_up_status' => 'nullable|in:pending,in_progress,completed',
            'advised_on' => 'required|date',
            'follow_up_date' => 'nullable|date',
        ]);

        return response()->json($service->createAdvisory($validated, $request->user()->current_business_id), 201);
    }

    public function trends(Request $request)
    {
        return response()->json(
            AgroRegionalSalesTrend::where('business_id', $request->user()->current_business_id)
                ->latest('trend_date')
                ->get()
        );
    }

    public function storeTrend(Request $request, AgroDealerService $service)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'branch_id' => ['nullable', $this->businessOwnedRule('branches', $businessId)],
            'region_name' => 'required|string|max:255',
            'season_name' => 'nullable|string|max:255',
            'input_category' => 'nullable|string|max:255',
            'sales_amount' => 'required|numeric|min:0',
            'quantity_sold' => 'required|numeric|min:0',
            'trend_date' => 'required|date',
        ]);

        return response()->json($service->createRegionalTrend($validated, $request->user()->current_business_id), 201);
    }

    private function businessOwnedRule(string $table, int $businessId): Exists
    {
        return Rule::exists($table, 'id')->where(
            fn ($query) => $query->where('business_id', $businessId)
        );
    }
}
