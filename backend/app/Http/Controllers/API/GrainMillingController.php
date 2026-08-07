<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\GrainMilling\StoreGrainMillingBatchRequest;
use App\Http\Resources\GrainMillingBatchResource;
use App\Models\GrainMillingBatch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GrainMillingController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $businessId = $request->user()->current_business_id;
        $today = today()->toDateString();

        $summary = GrainMillingBatch::query()
            ->where('business_id', $businessId)
            ->whereDate('milling_date', $today)
            ->selectRaw('
                COALESCE(SUM(input_quantity_kg), 0) as input_today_kg,
                COALESCE(SUM(output_quantity_kg), 0) as output_today_kg,
                COALESCE(SUM(byproduct_quantity_kg), 0) as byproduct_today_kg,
                COALESCE(SUM(wastage_quantity_kg), 0) as wastage_today_kg,
                COALESCE(SUM(labour_cost + electricity_cost + packaging_cost), 0) as processing_cost_today,
                COUNT(*) as batches_today
            ')
            ->first();

        // SQLite gives NUMERIC-affinity decimal columns storing "clean" values
        // (e.g. 780.00, 1000.00) INTEGER storage class, so a bare `/` here
        // silently does integer division and truncates every ratio to 0.
        // Multiplying by 1.0 first forces floating-point division.
        $averageYield = GrainMillingBatch::query()
            ->where('business_id', $businessId)
            ->where('input_quantity_kg', '>', 0)
            ->selectRaw('COALESCE(AVG((output_quantity_kg * 1.0) / input_quantity_kg) * 100, 0) as avg_yield_percent')
            ->value('avg_yield_percent');

        return response()->json([
            'summary' => [
                'input_today_kg' => (float) ($summary?->input_today_kg ?? 0),
                'output_today_kg' => (float) ($summary?->output_today_kg ?? 0),
                'byproduct_today_kg' => (float) ($summary?->byproduct_today_kg ?? 0),
                'wastage_today_kg' => (float) ($summary?->wastage_today_kg ?? 0),
                'processing_cost_today' => (float) ($summary?->processing_cost_today ?? 0),
                'batches_today' => (int) ($summary?->batches_today ?? 0),
                'average_yield_percent' => round((float) ($averageYield ?? 0), 1),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $batches = GrainMillingBatch::query()
            ->where('business_id', $request->user()->current_business_id)
            ->orderByDesc('milling_date')
            ->orderByDesc('id')
            ->limit(100)
            ->get();

        return response()->json(GrainMillingBatchResource::collection($batches)->resolve());
    }

    public function store(StoreGrainMillingBatchRequest $request): JsonResponse
    {
        $businessId = $request->user()->current_business_id;
        $validated = $request->validated();

        $batch = GrainMillingBatch::create([
            ...$validated,
            'business_id' => $businessId,
            'batch_number' => GrainMillingBatch::generateBatchNumber(),
            'status' => $validated['status'] ?? 'completed',
            'created_by' => $request->user()->id,
        ]);

        return response()->json((new GrainMillingBatchResource($batch))->resolve(), 201);
    }
}
