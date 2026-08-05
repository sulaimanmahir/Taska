<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Fuel\StoreFuelNozzleReadingRequest;
use App\Http\Requests\Fuel\StoreFuelShiftRequest;
use App\Http\Resources\FuelNozzleReadingResource;
use App\Http\Resources\FuelShiftLogResource;
use App\Models\FuelNozzleReading;
use App\Models\FuelPriceChangeLog;
use App\Models\FuelPump;
use App\Models\FuelShiftLog;
use App\Models\FuelTank;
use App\Models\FuelTankDip;
use App\Models\FuelVarianceAlert;
use App\Services\FuelService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

class FuelController extends Controller
{
    public function overview(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $sales = FuelNozzleReading::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN date(reading_date) = date('now') THEN expected_sales_amount ELSE 0 END), 0) as sales_today,
                COALESCE(SUM(CASE WHEN date(reading_date) = date('now') THEN litres_sold ELSE 0 END), 0) as litres_today
            ")
            ->first();

        $tankSummary = FuelTank::where('business_id', $businessId)
            ->selectRaw("
                COUNT(*) as tanks_count,
                COALESCE(SUM(current_stock_litres), 0) as current_stock_litres,
                COALESCE(SUM(CASE WHEN current_stock_litres <= reorder_level_litres THEN 1 ELSE 0 END), 0) as low_stock_tanks
            ")
            ->first();

        $shiftSummary = FuelShiftLog::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END), 0) as open_shifts,
                COALESCE(SUM(CASE WHEN date(created_at) = date('now') THEN shortage_amount ELSE 0 END), 0) as shortage_today,
                COALESCE(SUM(CASE WHEN date(created_at) = date('now') THEN recovery_amount ELSE 0 END), 0) as recovery_today
            ")
            ->first();

        $dips = FuelTankDip::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN date(dipped_at) = date('now') THEN variance_litres ELSE 0 END), 0) as dip_variance_today
            ")
            ->first();

        return response()->json([
            'summary' => [
                'sales_today' => (float) ($sales?->sales_today ?? 0),
                'litres_today' => (float) ($sales?->litres_today ?? 0),
                'tanks_count' => (int) ($tankSummary?->tanks_count ?? 0),
                'current_stock_litres' => (float) ($tankSummary?->current_stock_litres ?? 0),
                'low_stock_tanks' => (int) ($tankSummary?->low_stock_tanks ?? 0),
                'open_shifts' => (int) ($shiftSummary?->open_shifts ?? 0),
                'shortage_today' => (float) ($shiftSummary?->shortage_today ?? 0),
                'recovery_today' => (float) ($shiftSummary?->recovery_today ?? 0),
                'dip_variance_today' => (float) ($dips?->dip_variance_today ?? 0),
                'anomaly_alerts' => FuelVarianceAlert::where('business_id', $businessId)->where('is_resolved', false)->count(),
            ],
        ]);
    }

    public function tanks(Request $request)
    {
        return response()->json(
            FuelTank::where('business_id', $request->user()->current_business_id)->latest()->get()
        );
    }

    public function storeTank(Request $request, FuelService $service)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'branch_id' => ['nullable', $this->businessOwnedRule('branches', $businessId)],
            'name' => 'required|string|max:255',
            'fuel_type' => 'required|in:petrol,diesel,kerosene,cooking_gas',
            'capacity_litres' => 'required|numeric|min:0',
            'current_stock_litres' => 'nullable|numeric|min:0',
            'reorder_level_litres' => 'nullable|numeric|min:0',
            'price_per_litre' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:active,inactive,out_of_service',
        ]);

        return response()->json($service->createTank($validated, $businessId), 201);
    }

    public function pumps(Request $request)
    {
        return response()->json(
            FuelPump::where('business_id', $request->user()->current_business_id)->with('tank')->latest()->get()
        );
    }

    public function storePump(Request $request, FuelService $service)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'branch_id' => ['nullable', $this->businessOwnedRule('branches', $businessId)],
            'fuel_tank_id' => ['nullable', $this->businessOwnedRule('fuel_tanks', $businessId)],
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:100',
            'attendant_name' => 'nullable|string|max:255',
            'nozzle_count' => 'nullable|integer|min:1',
            'meter_reading_start' => 'nullable|numeric|min:0',
            'meter_reading_current' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:active,inactive,out_of_service',
        ]);

        return response()->json($service->createPump($validated, $businessId), 201);
    }

    public function nozzleReadings(Request $request)
    {
        return response()->json(
            FuelNozzleReading::where('business_id', $request->user()->current_business_id)
                ->with('pump.tank')
                ->latest('reading_date')
                ->get()
        );
    }

    public function storeNozzleReading(StoreFuelNozzleReadingRequest $request, FuelService $service)
    {
        $businessId = $request->user()->current_business_id;

        return response()->json((new FuelNozzleReadingResource(
            $service->createNozzleReading($request->validated(), $businessId)
        ))->resolve(), 201);
    }

    public function tankDips(Request $request)
    {
        return response()->json(
            FuelTankDip::where('business_id', $request->user()->current_business_id)->with('tank')->latest('dipped_at')->get()
        );
    }

    public function storeTankDip(Request $request, FuelService $service)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'branch_id' => ['nullable', $this->businessOwnedRule('branches', $businessId)],
            'fuel_tank_id' => ['required', $this->businessOwnedRule('fuel_tanks', $businessId)],
            'dipped_at' => 'required|date',
            'opening_stock_litres' => 'nullable|numeric|min:0',
            'deliveries_received_litres' => 'nullable|numeric|min:0',
            'closing_stock_litres' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        return response()->json($service->createTankDip($validated, $businessId), 201);
    }

    public function shifts(Request $request)
    {
        return response()->json(
            FuelShiftLog::where('business_id', $request->user()->current_business_id)->latest('opened_at')->get()
        );
    }

    public function storeShift(StoreFuelShiftRequest $request, FuelService $service)
    {
        $businessId = $request->user()->current_business_id;

        return response()->json((new FuelShiftLogResource(
            $service->createShiftLog($request->validated(), $businessId)
        ))->resolve(), 201);
    }

    public function priceChanges(Request $request)
    {
        return response()->json(
            FuelPriceChangeLog::where('business_id', $request->user()->current_business_id)->latest('effective_at')->get()
        );
    }

    public function storePriceChange(Request $request, FuelService $service)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'branch_id' => ['nullable', $this->businessOwnedRule('branches', $businessId)],
            'fuel_type' => 'required|in:petrol,diesel,kerosene,cooking_gas',
            'old_price' => 'nullable|numeric|min:0',
            'new_price' => 'required|numeric|min:0',
            'effective_at' => 'nullable|date',
            'changed_by_name' => 'nullable|string|max:255',
            'reason' => 'nullable|string|max:255',
        ]);

        return response()->json($service->createPriceChange($validated, $businessId), 201);
    }

    public function alerts(Request $request)
    {
        return response()->json(
            FuelVarianceAlert::where('business_id', $request->user()->current_business_id)->with(['tank', 'pump'])->latest('detected_at')->get()
        );
    }

    private function businessOwnedRule(string $table, int $businessId): Exists
    {
        return Rule::exists($table, 'id')->where(
            fn ($query) => $query->where('business_id', $businessId)
        );
    }
}
