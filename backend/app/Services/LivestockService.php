<?php

namespace App\Services;

use App\Models\LivestockAnimalGroup;
use App\Models\LivestockBreedingRecord;
use App\Models\LivestockDiseaseLog;
use App\Models\LivestockMedicationRecord;
use App\Models\LivestockMilkLog;
use App\Models\LivestockPen;
use App\Models\LivestockSale;
use App\Models\LivestockWeightLog;
use Illuminate\Support\Facades\DB;

class LivestockService
{
    public function overview(int $businessId): array
    {
        $today = today()->toDateString();

        $summary = LivestockAnimalGroup::query()
            ->where('business_id', $businessId)
            ->selectRaw('
                COALESCE(SUM(animal_count), 0) as total_animals,
                COALESCE(AVG(average_weight_kg), 0) as average_weight_kg
            ')
            ->first();

        $milkToday = LivestockMilkLog::where('business_id', $businessId)
            ->whereDate('recorded_on', $today)
            ->sum('litres');

        $medicationToday = LivestockMedicationRecord::where('business_id', $businessId)
            ->whereDate('administered_on', $today)
            ->sum('cost');

        $salesToday = LivestockSale::where('business_id', $businessId)
            ->whereDate('sold_on', $today)
            ->sum('revenue');

        $breedingSummary = LivestockBreedingRecord::query()
            ->where('business_id', $businessId)
            ->selectRaw('COALESCE(SUM(successful_births), 0) as successful_births, COALESCE(SUM(paired_count), 0) as paired_count')
            ->first();

        return [
            'totals' => [
                'animals' => (int) ($summary?->total_animals ?? 0),
                'pens' => LivestockPen::where('business_id', $businessId)->count(),
                'average_weight_kg' => round((float) ($summary?->average_weight_kg ?? 0), 2),
                'milk_today_litres' => (float) $milkToday,
                'open_outbreaks' => LivestockDiseaseLog::where('business_id', $businessId)->where('status', 'open')->count(),
                'medication_cost_today' => (float) $medicationToday,
                'slaughter_revenue_today' => (float) $salesToday,
                'sales_today' => (float) $salesToday,
                'breeding_success_rate' => ($breedingSummary?->paired_count ?? 0) > 0
                    ? round(((int) $breedingSummary->successful_births / (int) $breedingSummary->paired_count) * 100, 1)
                    : 0,
            ],
            'pens' => LivestockPen::where('business_id', $businessId)
                ->latest()
                ->take(6)
                ->get(),
            'groups' => LivestockAnimalGroup::with('pen')
                ->where('business_id', $businessId)
                ->latest()
                ->take(8)
                ->get(),
            'outbreaks' => LivestockDiseaseLog::where('business_id', $businessId)
                ->latest('recorded_on')
                ->take(6)
                ->get(),
            'sales' => LivestockSale::where('business_id', $businessId)
                ->latest('sold_on')
                ->take(6)
                ->get(),
        ];
    }

    public function createPen(int $businessId, ?int $branchId, array $data): LivestockPen
    {
        return LivestockPen::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'name' => $data['name'],
            'section' => $data['section'] ?? null,
            'capacity' => $data['capacity'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
        ]);
    }

    public function createGroup(int $businessId, ?int $branchId, array $data): LivestockAnimalGroup
    {
        return LivestockAnimalGroup::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'pen_id' => $data['pen_id'] ?? null,
            'name' => $data['name'],
            'species' => $data['species'],
            'breed' => $data['breed'] ?? null,
            'animal_count' => $data['animal_count'] ?? 0,
            'average_weight_kg' => $data['average_weight_kg'] ?? 0,
            'status' => $data['status'] ?? 'active',
            'acquired_on' => $data['acquired_on'] ?? null,
        ]);
    }

    public function recordWeight(int $businessId, array $data): LivestockWeightLog
    {
        return DB::transaction(function () use ($businessId, $data) {
            $log = LivestockWeightLog::create([
                'business_id' => $businessId,
                'animal_group_id' => $data['animal_group_id'],
                'weight_kg' => $data['weight_kg'],
                'sample_size' => $data['sample_size'] ?? 1,
                'weighed_at' => $data['weighed_at'] ?? now(),
            ]);

            LivestockAnimalGroup::where('id', $data['animal_group_id'])->update([
                'average_weight_kg' => $data['weight_kg'],
            ]);

            return $log->fresh(['group.pen']);
        });
    }

    public function recordMilk(int $businessId, array $data): LivestockMilkLog
    {
        return LivestockMilkLog::create([
            'business_id' => $businessId,
            'animal_group_id' => $data['animal_group_id'],
            'litres' => $data['litres'],
            'recorded_on' => $data['recorded_on'],
        ])->fresh('group');
    }

    public function logDisease(int $businessId, array $data): LivestockDiseaseLog
    {
        return LivestockDiseaseLog::create([
            'business_id' => $businessId,
            'animal_group_id' => $data['animal_group_id'] ?? null,
            'disease_name' => $data['disease_name'],
            'severity' => $data['severity'] ?? 'moderate',
            'affected_count' => $data['affected_count'] ?? 0,
            'recorded_on' => $data['recorded_on'],
            'status' => $data['status'] ?? 'open',
        ]);
    }

    public function recordMedication(int $businessId, array $data): LivestockMedicationRecord
    {
        return LivestockMedicationRecord::create([
            'business_id' => $businessId,
            'animal_group_id' => $data['animal_group_id'] ?? null,
            'medication_name' => $data['medication_name'],
            'dosage' => $data['dosage'] ?? null,
            'treated_count' => $data['treated_count'] ?? 0,
            'cost' => $data['cost'] ?? 0,
            'administered_on' => $data['administered_on'],
        ]);
    }

    public function recordBreeding(int $businessId, array $data): LivestockBreedingRecord
    {
        return LivestockBreedingRecord::create([
            'business_id' => $businessId,
            'animal_group_id' => $data['animal_group_id'],
            'cycle_name' => $data['cycle_name'],
            'paired_count' => $data['paired_count'] ?? 0,
            'successful_births' => $data['successful_births'] ?? 0,
            'expected_delivery_date' => $data['expected_delivery_date'] ?? null,
            'actual_delivery_date' => $data['actual_delivery_date'] ?? null,
            'status' => $data['status'] ?? 'planned',
        ])->fresh('group');
    }

    public function recordSale(int $businessId, array $data): LivestockSale
    {
        return LivestockSale::create([
            'business_id' => $businessId,
            'animal_group_id' => $data['animal_group_id'] ?? null,
            'sale_type' => $data['sale_type'] ?? 'live_sale',
            'quantity' => $data['quantity'] ?? 0,
            'revenue' => $data['revenue'] ?? 0,
            'sold_on' => $data['sold_on'],
        ]);
    }
}
