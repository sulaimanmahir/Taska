<?php

namespace App\Services;

use App\Models\FarmHarvestLog;
use App\Models\FarmInputLog;
use App\Models\FarmPlantingCycle;
use App\Models\FarmPlot;

class FarmService
{
    public function overview(int $businessId): array
    {
        $today = today()->toDateString();

        $plots = FarmPlot::where('business_id', $businessId)->latest()->get();
        $cycles = FarmPlantingCycle::with('plot')->where('business_id', $businessId)->latest('planting_date')->get();
        $inputLogs = FarmInputLog::with('plantingCycle.plot')->where('business_id', $businessId)->latest('applied_on')->get();
        $harvestLogs = FarmHarvestLog::with('plantingCycle.plot')->where('business_id', $businessId)->latest('harvested_on')->get();

        return [
            'summary' => [
                'active_plots' => FarmPlot::where('business_id', $businessId)->where('status', 'active')->count(),
                'hectares_under_cultivation' => (float) FarmPlantingCycle::where('business_id', $businessId)
                    ->whereIn('status', ['planned', 'planted', 'growing'])
                    ->sum('planted_area_hectares'),
                'input_cost_today' => (float) FarmInputLog::where('business_id', $businessId)->whereDate('applied_on', $today)->sum('cost'),
                'harvest_today' => (float) FarmHarvestLog::where('business_id', $businessId)->whereDate('harvested_on', $today)->sum('quantity_harvested'),
                'harvest_revenue_today' => (float) FarmHarvestLog::where('business_id', $businessId)->whereDate('harvested_on', $today)->sum('estimated_revenue'),
                'losses_today' => (float) FarmHarvestLog::where('business_id', $businessId)->whereDate('harvested_on', $today)->sum('loss_quantity'),
            ],
            'plots' => $plots,
            'planting_cycles' => $cycles,
            'input_logs' => $inputLogs,
            'harvest_logs' => $harvestLogs,
        ];
    }

    public function createPlot(array $payload, int $businessId, ?int $branchId): FarmPlot
    {
        return FarmPlot::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'name' => $payload['name'],
            'location' => $payload['location'] ?? null,
            'size_hectares' => $payload['size_hectares'] ?? 0,
            'soil_type' => $payload['soil_type'] ?? null,
            'status' => $payload['status'] ?? 'active',
        ]);
    }

    public function createPlantingCycle(array $payload, int $businessId): FarmPlantingCycle
    {
        return FarmPlantingCycle::create([
            'business_id' => $businessId,
            'plot_id' => $payload['plot_id'],
            'crop_name' => $payload['crop_name'],
            'season_name' => $payload['season_name'] ?? null,
            'planting_date' => $payload['planting_date'],
            'expected_harvest_date' => $payload['expected_harvest_date'] ?? null,
            'planted_area_hectares' => $payload['planted_area_hectares'] ?? 0,
            'status' => $payload['status'] ?? 'planned',
            'notes' => $payload['notes'] ?? null,
        ])->fresh('plot');
    }

    public function createInputLog(array $payload, int $businessId): FarmInputLog
    {
        return FarmInputLog::create([
            'business_id' => $businessId,
            'planting_cycle_id' => $payload['planting_cycle_id'],
            'input_type' => $payload['input_type'],
            'input_name' => $payload['input_name'],
            'quantity' => $payload['quantity'],
            'unit' => $payload['unit'] ?? 'kg',
            'cost' => $payload['cost'] ?? 0,
            'applied_on' => $payload['applied_on'],
            'notes' => $payload['notes'] ?? null,
        ])->fresh('plantingCycle.plot');
    }

    public function createHarvestLog(array $payload, int $businessId): FarmHarvestLog
    {
        $log = FarmHarvestLog::create([
            'business_id' => $businessId,
            'planting_cycle_id' => $payload['planting_cycle_id'],
            'quantity_harvested' => $payload['quantity_harvested'],
            'unit' => $payload['unit'] ?? 'kg',
            'estimated_revenue' => $payload['estimated_revenue'] ?? 0,
            'loss_quantity' => $payload['loss_quantity'] ?? 0,
            'harvested_on' => $payload['harvested_on'],
            'notes' => $payload['notes'] ?? null,
        ])->fresh('plantingCycle.plot');

        $log->plantingCycle?->update([
            'status' => 'harvested',
            'actual_harvest_date' => $payload['harvested_on'],
        ]);

        return $log->fresh('plantingCycle.plot');
    }
}
