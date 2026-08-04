<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Logistics\SettleTripRequest;
use App\Http\Requests\Logistics\UpdateTripSheetRequest;
use App\Http\Resources\LogisticsDriverSettlementResource;
use App\Http\Resources\LogisticsTripSheetResource;
use App\Models\LogisticsTripSheet;
use App\Services\LogisticsService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

class LogisticsController extends Controller
{
    public function __construct(
        private LogisticsService $service,
    ) {
    }

    public function overview(Request $request)
    {
        return response()->json($this->service->overview($request->user()->current_business_id));
    }

    public function storeFleetAsset(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'assigned_driver_id' => ['nullable', $this->activeBusinessUserRule($businessId)],
            'asset_type' => 'required|string|max:255',
            'name' => 'required|string|max:255',
            'plate_number' => 'nullable|string|max:255',
            'ownership_model' => 'nullable|in:company_owned,investor_owned,partner_owned,driver_owned,leased',
            'capacity_unit' => 'nullable|string|max:255',
            'capacity_value' => 'nullable|numeric|min:0',
            'purchase_value' => 'nullable|numeric|min:0',
            'target_km_per_litre' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:active,inactive,maintenance',
            'fuel_responsibility' => 'nullable|in:company,driver,shared',
            'maintenance_responsibility' => 'nullable|in:company,driver,shared',
            'notes' => 'nullable|string',
        ]);

        return response()->json(
            $this->service->createFleetAsset($validated, $businessId, $request->user()->current_branch_id),
            201
        );
    }

    public function storeTripSheet(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'fleet_asset_id' => ['nullable', $this->businessOwnedRule('logistics_fleet_assets', $businessId)],
            'driver_id' => ['nullable', $this->activeBusinessUserRule($businessId)],
            'job_type' => 'nullable|string|max:255',
            'customer_name' => 'nullable|string|max:255',
            'route_name' => 'required|string|max:255',
            'origin' => 'required|string|max:255',
            'destination' => 'required|string|max:255',
            'trip_date' => 'required|date',
            'status' => 'nullable|in:planned,dispatched,in_transit,completed,cancelled',
            'expected_revenue' => 'nullable|numeric|min:0',
            'actual_revenue' => 'nullable|numeric|min:0',
            'distance_km' => 'nullable|numeric|min:0',
            'expected_fuel_cost' => 'nullable|numeric|min:0',
            'actual_fuel_cost' => 'nullable|numeric|min:0',
            'loading_cost' => 'nullable|numeric|min:0',
            'driver_allowance' => 'nullable|numeric|min:0',
            'maintenance_cost' => 'nullable|numeric|min:0',
            'other_cost' => 'nullable|numeric|min:0',
            'payment_status' => 'nullable|in:pending,partial,paid',
            'notes' => 'nullable|string',
            'stops' => 'nullable|array',
            'stops.*.customer_id' => ['nullable', $this->businessOwnedRule('customers', $businessId)],
            'stops.*.stop_order' => 'nullable|integer|min:1',
            'stops.*.stop_name' => 'required_with:stops|string|max:255',
            'stops.*.location' => 'nullable|string|max:255',
            'stops.*.status' => 'nullable|in:planned,arrived,completed,delayed,failed',
            'stops.*.expected_revenue' => 'nullable|numeric|min:0',
            'stops.*.actual_revenue' => 'nullable|numeric|min:0',
            'stops.*.notes' => 'nullable|string',
        ]);

        return response()->json(
            $this->service->createTripSheet($validated, $businessId, $request->user()->current_branch_id),
            201
        );
    }

    public function updateTripSheet(UpdateTripSheetRequest $request, LogisticsTripSheet $tripSheet)
    {
        $this->authorize('update', $tripSheet);
        $validated = $request->validated();

        return response()->json(
            (new LogisticsTripSheetResource(
                $this->service->updateTripSheet($tripSheet, $validated, $request->user()->current_business_id)
            ))->resolve()
        );
    }

    public function storeFuelLog(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'trip_sheet_id' => ['nullable', $this->businessOwnedRule('logistics_trip_sheets', $businessId)],
            'fleet_asset_id' => ['nullable', $this->businessOwnedRule('logistics_fleet_assets', $businessId)],
            'log_date' => 'required|date',
            'litres' => 'required|numeric|min:0',
            'unit_cost' => 'required|numeric|min:0',
            'amount' => 'nullable|numeric|min:0',
            'odometer_km' => 'nullable|numeric|min:0',
            'source' => 'nullable|in:cash,account,card,transfer',
            'notes' => 'nullable|string',
        ]);

        return response()->json(
            $this->service->createFuelLog($validated, $businessId, $request->user()->id),
            201
        );
    }

    public function storeMaintenanceLog(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'fleet_asset_id' => ['nullable', $this->businessOwnedRule('logistics_fleet_assets', $businessId)],
            'trip_sheet_id' => ['nullable', $this->businessOwnedRule('logistics_trip_sheets', $businessId)],
            'logged_on' => 'required|date',
            'category' => 'nullable|string|max:255',
            'status' => 'nullable|in:open,in_progress,resolved',
            'cost' => 'nullable|numeric|min:0',
            'summary' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        return response()->json(
            $this->service->createMaintenanceLog($validated, $businessId),
            201
        );
    }

    public function settleTrip(SettleTripRequest $request, LogisticsTripSheet $tripSheet)
    {
        $this->authorize('update', $tripSheet);
        $validated = $request->validated();

        return response()->json(
            (new LogisticsDriverSettlementResource(
                $this->service->settleTrip($tripSheet, $validated, $request->user()->current_business_id)
                    ->load(['trip', 'driver'])
            ))->resolve()
        );
    }

    private function businessOwnedRule(string $table, int $businessId): Exists
    {
        return Rule::exists($table, 'id')->where(
            fn ($query) => $query->where('business_id', $businessId)
        );
    }

    private function activeBusinessUserRule(int $businessId): Exists
    {
        return Rule::exists('users', 'id')->where(function ($query) use ($businessId) {
            $query->whereExists(function ($membershipQuery) use ($businessId) {
                $membershipQuery
                    ->selectRaw('1')
                    ->from('business_user')
                    ->whereColumn('business_user.user_id', 'users.id')
                    ->where('business_user.business_id', $businessId)
                    ->where('business_user.status', 'active');
            });
        });
    }
}
