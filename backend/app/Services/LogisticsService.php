<?php

namespace App\Services;

use App\Models\LogisticsDriverSettlement;
use App\Models\LogisticsFleetAsset;
use App\Models\LogisticsFuelLog;
use App\Models\LogisticsMaintenanceLog;
use App\Models\LogisticsTripSheet;
use App\Models\LogisticsTripStop;
use Illuminate\Support\Facades\DB;

class LogisticsService
{
    public function overview(int $businessId): array
    {
        $today = today()->toDateString();

        $fuelSummary = LogisticsFuelLog::query()
            ->where('business_id', $businessId)
            ->whereDate('log_date', $today)
            ->selectRaw("
                COALESCE(SUM(amount), 0) as fuel_cost_today,
                COALESCE(SUM(litres), 0) as litres_today
            ")
            ->first();

        $maintenanceSummary = LogisticsMaintenanceLog::query()
            ->where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN status != 'resolved' THEN 1 ELSE 0 END), 0) as open_maintenance,
                COALESCE(SUM(CASE WHEN logged_on = date('now') THEN cost ELSE 0 END), 0) as maintenance_today
            ")
            ->first();

        $stopSummary = LogisticsTripStop::query()
            ->join('logistics_trip_sheets', 'logistics_trip_sheets.id', '=', 'logistics_trip_stops.trip_sheet_id')
            ->where('logistics_trip_sheets.business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN logistics_trip_stops.status = 'delayed' THEN 1 ELSE 0 END), 0) as delayed_stops,
                COALESCE(SUM(CASE WHEN logistics_trip_stops.status = 'completed' THEN 1 ELSE 0 END), 0) as completed_stops
            ")
            ->first();

        $settlementSummary = LogisticsDriverSettlement::query()
            ->where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN status != 'paid' THEN driver_payout ELSE 0 END), 0) as payout_pending,
                COALESCE(SUM(company_retained), 0) as company_retained
            ")
            ->first();

        $tripBase = LogisticsTripSheet::query()->where('business_id', $businessId);
        $todayTrips = (clone $tripBase)->whereDate('trip_date', $today);

        return [
            'summary' => [
                'trips_today' => (clone $todayTrips)->count(),
                'active_trips' => (clone $tripBase)->whereIn('status', ['dispatched', 'in_transit'])->count(),
                'completed_today' => (clone $todayTrips)->where('status', 'completed')->count(),
                'receivables_outstanding' => (float) (clone $tripBase)->where('payment_status', '!=', 'paid')->sum('actual_revenue'),
                'revenue_today' => (float) (clone $todayTrips)->sum('actual_revenue'),
                'profit_today' => (float) (clone $todayTrips)->sum('profit_estimate'),
                'fuel_cost_today' => (float) ($fuelSummary?->fuel_cost_today ?? 0),
                'litres_today' => (float) ($fuelSummary?->litres_today ?? 0),
                'open_maintenance' => (int) ($maintenanceSummary?->open_maintenance ?? 0),
                'maintenance_today' => (float) ($maintenanceSummary?->maintenance_today ?? 0),
                'delayed_stops' => (int) ($stopSummary?->delayed_stops ?? 0),
                'payout_pending' => (float) ($settlementSummary?->payout_pending ?? 0),
                'company_retained' => (float) ($settlementSummary?->company_retained ?? 0),
            ],
            'fleet_assets' => LogisticsFleetAsset::with('driver')->where('business_id', $businessId)->latest()->get(),
            'trip_sheets' => LogisticsTripSheet::with(['asset', 'driver', 'stops.customer'])->where('business_id', $businessId)->latest('trip_date')->get(),
            'fuel_logs' => LogisticsFuelLog::with(['asset', 'trip'])->where('business_id', $businessId)->latest('log_date')->get(),
            'maintenance_logs' => LogisticsMaintenanceLog::with(['asset', 'trip'])->where('business_id', $businessId)->latest('logged_on')->get(),
            'settlements' => LogisticsDriverSettlement::with(['trip', 'driver'])->where('business_id', $businessId)->latest()->get(),
        ];
    }

    public function createFleetAsset(array $payload, int $businessId, ?int $branchId): LogisticsFleetAsset
    {
        return LogisticsFleetAsset::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'assigned_driver_id' => $payload['assigned_driver_id'] ?? null,
            'asset_type' => $payload['asset_type'],
            'name' => $payload['name'],
            'plate_number' => $payload['plate_number'] ?? null,
            'ownership_model' => $payload['ownership_model'] ?? 'company_owned',
            'capacity_unit' => $payload['capacity_unit'] ?? null,
            'capacity_value' => $payload['capacity_value'] ?? 0,
            'purchase_value' => $payload['purchase_value'] ?? 0,
            'target_km_per_litre' => $payload['target_km_per_litre'] ?? 0,
            'status' => $payload['status'] ?? 'active',
            'fuel_responsibility' => $payload['fuel_responsibility'] ?? 'company',
            'maintenance_responsibility' => $payload['maintenance_responsibility'] ?? 'company',
            'notes' => $payload['notes'] ?? null,
        ]);
    }

    public function createTripSheet(array $payload, int $businessId, ?int $branchId): LogisticsTripSheet
    {
        return DB::transaction(function () use ($payload, $businessId, $branchId) {
            $trip = LogisticsTripSheet::create([
                'business_id' => $businessId,
                'branch_id' => $branchId,
                'fleet_asset_id' => $payload['fleet_asset_id'] ?? null,
                'driver_id' => $payload['driver_id'] ?? null,
                'trip_code' => $this->generateTripCode($businessId),
                'job_type' => $payload['job_type'] ?? 'haulage',
                'customer_name' => $payload['customer_name'] ?? null,
                'route_name' => $payload['route_name'],
                'origin' => $payload['origin'],
                'destination' => $payload['destination'],
                'trip_date' => $payload['trip_date'],
                'status' => $payload['status'] ?? 'planned',
                'expected_revenue' => $payload['expected_revenue'] ?? 0,
                'actual_revenue' => $payload['actual_revenue'] ?? 0,
                'distance_km' => $payload['distance_km'] ?? 0,
                'expected_fuel_cost' => $payload['expected_fuel_cost'] ?? 0,
                'actual_fuel_cost' => $payload['actual_fuel_cost'] ?? 0,
                'loading_cost' => $payload['loading_cost'] ?? 0,
                'driver_allowance' => $payload['driver_allowance'] ?? 0,
                'maintenance_cost' => $payload['maintenance_cost'] ?? 0,
                'other_cost' => $payload['other_cost'] ?? 0,
                'profit_estimate' => $this->calculateProfitEstimate($payload),
                'payment_status' => $payload['payment_status'] ?? 'pending',
                'notes' => $payload['notes'] ?? null,
                'departed_at' => in_array($payload['status'] ?? 'planned', ['dispatched', 'in_transit'], true) ? now() : null,
            ]);

            foreach ($payload['stops'] ?? [] as $index => $stop) {
                LogisticsTripStop::create([
                    'trip_sheet_id' => $trip->id,
                    'customer_id' => $stop['customer_id'] ?? null,
                    'stop_order' => $stop['stop_order'] ?? ($index + 1),
                    'stop_name' => $stop['stop_name'],
                    'location' => $stop['location'] ?? null,
                    'status' => $stop['status'] ?? 'planned',
                    'expected_revenue' => $stop['expected_revenue'] ?? 0,
                    'actual_revenue' => $stop['actual_revenue'] ?? 0,
                    'notes' => $stop['notes'] ?? null,
                ]);
            }

            return $trip->load(['asset', 'driver', 'stops.customer']);
        });
    }

    public function updateTripSheet(LogisticsTripSheet $trip, array $payload, int $businessId): LogisticsTripSheet
    {
        abort_if($trip->business_id !== $businessId, 403);

        $attributes = [
            'status' => $payload['status'] ?? $trip->status,
            'actual_revenue' => $payload['actual_revenue'] ?? $trip->actual_revenue,
            'actual_fuel_cost' => $payload['actual_fuel_cost'] ?? $trip->actual_fuel_cost,
            'loading_cost' => $payload['loading_cost'] ?? $trip->loading_cost,
            'driver_allowance' => $payload['driver_allowance'] ?? $trip->driver_allowance,
            'maintenance_cost' => $payload['maintenance_cost'] ?? $trip->maintenance_cost,
            'other_cost' => $payload['other_cost'] ?? $trip->other_cost,
            'payment_status' => $payload['payment_status'] ?? $trip->payment_status,
            'notes' => $payload['notes'] ?? $trip->notes,
        ];

        $attributes['profit_estimate'] = $this->calculateProfitEstimate($attributes + [
            'expected_revenue' => $trip->expected_revenue,
            'actual_revenue' => $attributes['actual_revenue'],
        ]);

        if (($payload['status'] ?? null) === 'completed' && !$trip->arrived_at) {
            $attributes['arrived_at'] = now();
        }

        if (in_array($payload['status'] ?? '', ['dispatched', 'in_transit'], true) && !$trip->departed_at) {
            $attributes['departed_at'] = now();
        }

        $trip->update($attributes);

        return $trip->fresh(['asset', 'driver', 'stops.customer']);
    }

    public function createFuelLog(array $payload, int $businessId, ?int $userId): LogisticsFuelLog
    {
        $trip = !empty($payload['trip_sheet_id'])
            ? $this->resolveTrip($businessId, $payload['trip_sheet_id'])
            : null;
        $asset = !empty($payload['fleet_asset_id'])
            ? $this->resolveAsset($businessId, $payload['fleet_asset_id'])
            : null;

        $log = LogisticsFuelLog::create([
            'business_id' => $businessId,
            'trip_sheet_id' => $trip?->id,
            'fleet_asset_id' => $asset?->id,
            'recorded_by' => $userId,
            'log_date' => $payload['log_date'],
            'litres' => $payload['litres'],
            'unit_cost' => $payload['unit_cost'],
            'amount' => $payload['amount'] ?? round((float) $payload['litres'] * (float) $payload['unit_cost'], 2),
            'odometer_km' => $payload['odometer_km'] ?? 0,
            'source' => $payload['source'] ?? 'cash',
            'notes' => $payload['notes'] ?? null,
        ]);

        if ($trip) {
            $trip->update([
                'actual_fuel_cost' => (float) LogisticsFuelLog::where('trip_sheet_id', $trip->id)->sum('amount'),
                'profit_estimate' => $this->calculateProfitEstimate([
                    'actual_revenue' => $trip->actual_revenue,
                    'expected_revenue' => $trip->expected_revenue,
                    'actual_fuel_cost' => (float) LogisticsFuelLog::where('trip_sheet_id', $trip->id)->sum('amount'),
                    'loading_cost' => $trip->loading_cost,
                    'driver_allowance' => $trip->driver_allowance,
                    'maintenance_cost' => $trip->maintenance_cost,
                    'other_cost' => $trip->other_cost,
                ]),
            ]);
        }

        return $log->load(['asset', 'trip']);
    }

    public function createMaintenanceLog(array $payload, int $businessId): LogisticsMaintenanceLog
    {
        $trip = !empty($payload['trip_sheet_id'])
            ? $this->resolveTrip($businessId, $payload['trip_sheet_id'])
            : null;
        $asset = !empty($payload['fleet_asset_id'])
            ? $this->resolveAsset($businessId, $payload['fleet_asset_id'])
            : null;

        $log = LogisticsMaintenanceLog::create([
            'business_id' => $businessId,
            'fleet_asset_id' => $asset?->id,
            'trip_sheet_id' => $trip?->id,
            'logged_on' => $payload['logged_on'],
            'category' => $payload['category'] ?? 'routine_service',
            'status' => $payload['status'] ?? 'open',
            'cost' => $payload['cost'] ?? 0,
            'summary' => $payload['summary'],
            'notes' => $payload['notes'] ?? null,
        ]);

        if ($trip) {
            $trip->update([
                'maintenance_cost' => (float) LogisticsMaintenanceLog::where('trip_sheet_id', $trip->id)->sum('cost'),
                'profit_estimate' => $this->calculateProfitEstimate([
                    'actual_revenue' => $trip->actual_revenue,
                    'expected_revenue' => $trip->expected_revenue,
                    'actual_fuel_cost' => $trip->actual_fuel_cost,
                    'loading_cost' => $trip->loading_cost,
                    'driver_allowance' => $trip->driver_allowance,
                    'maintenance_cost' => (float) LogisticsMaintenanceLog::where('trip_sheet_id', $trip->id)->sum('cost'),
                    'other_cost' => $trip->other_cost,
                ]),
            ]);
        }

        return $log->load(['asset', 'trip']);
    }

    public function settleTrip(LogisticsTripSheet $trip, array $payload, int $businessId): LogisticsDriverSettlement
    {
        abort_if($trip->business_id !== $businessId, 403);

        return LogisticsDriverSettlement::updateOrCreate(
            ['trip_sheet_id' => $trip->id],
            [
                'business_id' => $businessId,
                'driver_id' => $trip->driver_id,
                'gross_revenue' => $payload['gross_revenue'] ?? ($trip->actual_revenue ?: $trip->expected_revenue),
                'trip_cost' => $payload['trip_cost'] ?? ($trip->actual_fuel_cost + $trip->loading_cost + $trip->driver_allowance + $trip->maintenance_cost + $trip->other_cost),
                'driver_payout' => $payload['driver_payout'] ?? round(($trip->actual_revenue ?: $trip->expected_revenue) * 0.2, 2),
                'company_retained' => $payload['company_retained'] ?? max(($trip->actual_revenue ?: $trip->expected_revenue) - (($payload['trip_cost'] ?? ($trip->actual_fuel_cost + $trip->loading_cost + $trip->driver_allowance + $trip->maintenance_cost + $trip->other_cost)) + ($payload['driver_payout'] ?? round(($trip->actual_revenue ?: $trip->expected_revenue) * 0.2, 2))), 0),
                'fuel_deduction' => $payload['fuel_deduction'] ?? 0,
                'maintenance_deduction' => $payload['maintenance_deduction'] ?? 0,
                'status' => $payload['status'] ?? 'approved',
                'settled_at' => in_array($payload['status'] ?? 'approved', ['approved', 'paid'], true) ? now() : null,
            ]
        );
    }

    private function calculateProfitEstimate(array $payload): float
    {
        $revenue = (float) ($payload['actual_revenue'] ?? $payload['expected_revenue'] ?? 0);
        $costs = (float) ($payload['actual_fuel_cost'] ?? $payload['expected_fuel_cost'] ?? 0)
            + (float) ($payload['loading_cost'] ?? 0)
            + (float) ($payload['driver_allowance'] ?? 0)
            + (float) ($payload['maintenance_cost'] ?? 0)
            + (float) ($payload['other_cost'] ?? 0);

        return round($revenue - $costs, 2);
    }

    private function generateTripCode(int $businessId): string
    {
        return 'TRP-' . $businessId . '-' . strtoupper(str()->random(6));
    }

    private function resolveTrip(int $businessId, int $tripId): LogisticsTripSheet
    {
        return LogisticsTripSheet::where('business_id', $businessId)->findOrFail($tripId);
    }

    private function resolveAsset(int $businessId, int $assetId): LogisticsFleetAsset
    {
        return LogisticsFleetAsset::where('business_id', $businessId)->findOrFail($assetId);
    }
}
