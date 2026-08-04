<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Livestock\StoreLivestockBreedingRequest;
use App\Http\Requests\Livestock\StoreLivestockMilkRequest;
use App\Http\Requests\Livestock\StoreLivestockWeightRequest;
use App\Http\Resources\LivestockBreedingRecordResource;
use App\Http\Resources\LivestockMilkLogResource;
use App\Http\Resources\LivestockWeightLogResource;
use App\Services\LivestockService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

class LivestockController extends Controller
{
    public function __construct(private LivestockService $livestockService)
    {
    }

    public function overview(Request $request)
    {
        return response()->json(
            $this->livestockService->overview($request->user()->current_business_id)
        );
    }

    public function storePen(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'section' => 'nullable|string|max:255',
            'capacity' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        return response()->json([
            'pen' => $this->livestockService->createPen(
                $request->user()->current_business_id,
                $request->user()->current_branch_id,
                $validated
            ),
        ], 201);
    }

    public function storeGroup(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'pen_id' => ['nullable', $this->businessOwnedRule('livestock_pens', $businessId)],
            'name' => 'required|string|max:255',
            'species' => 'required|string|max:255',
            'breed' => 'nullable|string|max:255',
            'animal_count' => 'nullable|integer|min:0',
            'average_weight_kg' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|max:50',
            'acquired_on' => 'nullable|date',
        ]);

        return response()->json([
            'group' => $this->livestockService->createGroup(
                $businessId,
                $request->user()->current_branch_id,
                $validated
            ),
        ], 201);
    }

    public function storeWeight(StoreLivestockWeightRequest $request)
    {
        $businessId = $request->user()->current_business_id;

        return (new LivestockWeightLogResource(
            $this->livestockService->recordWeight($businessId, $request->validated())
        ))->response()->setStatusCode(201);
    }

    public function storeMilk(StoreLivestockMilkRequest $request)
    {
        $businessId = $request->user()->current_business_id;

        return (new LivestockMilkLogResource(
            $this->livestockService->recordMilk($businessId, $request->validated())
        ))->response()->setStatusCode(201);
    }

    public function storeDisease(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'animal_group_id' => ['nullable', $this->businessOwnedRule('livestock_animal_groups', $businessId)],
            'disease_name' => 'required|string|max:255',
            'severity' => 'nullable|string|max:50',
            'affected_count' => 'nullable|integer|min:0',
            'recorded_on' => 'required|date',
            'status' => 'nullable|string|max:50',
        ]);

        return response()->json([
            'disease_log' => $this->livestockService->logDisease($businessId, $validated),
        ], 201);
    }

    public function storeMedication(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'animal_group_id' => ['nullable', $this->businessOwnedRule('livestock_animal_groups', $businessId)],
            'medication_name' => 'required|string|max:255',
            'dosage' => 'nullable|string|max:255',
            'treated_count' => 'nullable|integer|min:0',
            'cost' => 'nullable|numeric|min:0',
            'administered_on' => 'required|date',
        ]);

        return response()->json([
            'medication_record' => $this->livestockService->recordMedication($businessId, $validated),
        ], 201);
    }

    public function storeBreeding(StoreLivestockBreedingRequest $request)
    {
        $businessId = $request->user()->current_business_id;

        return (new LivestockBreedingRecordResource(
            $this->livestockService->recordBreeding($businessId, $request->validated())
        ))->response()->setStatusCode(201);
    }

    public function storeSale(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'animal_group_id' => ['nullable', $this->businessOwnedRule('livestock_animal_groups', $businessId)],
            'sale_type' => 'nullable|string|max:50',
            'quantity' => 'nullable|integer|min:0',
            'revenue' => 'nullable|numeric|min:0',
            'sold_on' => 'required|date',
        ]);

        return response()->json([
            'sale' => $this->livestockService->recordSale($businessId, $validated),
        ], 201);
    }

    private function businessOwnedRule(string $table, int $businessId): Exists
    {
        return Rule::exists($table, 'id')->where(
            fn ($query) => $query->where('business_id', $businessId)
        );
    }
}
