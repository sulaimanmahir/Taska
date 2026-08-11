<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\LeatherTrading\StoreLeatherProcessingBatchRequest;
use App\Http\Resources\LeatherProcessingBatchResource;
use App\Models\LeatherProcessingBatch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeatherTradingController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $businessId = $request->user()->current_business_id;
        $today = today()->toDateString();

        $todaySummary = LeatherProcessingBatch::query()
            ->where('business_id', $businessId)
            ->whereDate('processing_date', $today)
            ->selectRaw('
                COALESCE(SUM(input_hide_count), 0) as hides_processed_today,
                COALESCE(SUM(output_sqft), 0) as output_sqft_today,
                COALESCE(SUM(reject_count), 0) as rejects_today,
                COALESCE(SUM(tanning_chemical_cost + labour_cost + other_cost), 0) as processing_cost_today,
                COUNT(*) as batches_today
            ')
            ->first();

        // Average reject rate is computed in PHP across each batch's own
        // ratio rather than via a raw SQL division between two columns -
        // SQLite gives NUMERIC-affinity decimal/integer columns storing
        // "clean" values INTEGER storage class, which silently truncates a
        // bare `/` to 0 (the exact bug hit and fixed in GrainMillingController
        // earlier). Computing per-row in PHP sidesteps that entirely.
        $batches = LeatherProcessingBatch::query()
            ->where('business_id', $businessId)
            ->where('input_hide_count', '>', 0)
            ->get(['input_hide_count', 'reject_count']);

        $averageRejectRate = $batches->isNotEmpty()
            ? round($batches->avg(fn (LeatherProcessingBatch $batch) => $batch->rejectRatePercent()), 1)
            : 0.0;

        return response()->json([
            'summary' => [
                'hides_processed_today' => (int) ($todaySummary?->hides_processed_today ?? 0),
                'output_sqft_today' => (float) ($todaySummary?->output_sqft_today ?? 0),
                'rejects_today' => (int) ($todaySummary?->rejects_today ?? 0),
                'processing_cost_today' => (float) ($todaySummary?->processing_cost_today ?? 0),
                'batches_today' => (int) ($todaySummary?->batches_today ?? 0),
                'average_reject_rate_percent' => $averageRejectRate,
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $batches = LeatherProcessingBatch::query()
            ->where('business_id', $request->user()->current_business_id)
            ->orderByDesc('processing_date')
            ->orderByDesc('id')
            ->limit(100)
            ->get();

        return response()->json(LeatherProcessingBatchResource::collection($batches)->resolve());
    }

    public function store(StoreLeatherProcessingBatchRequest $request): JsonResponse
    {
        $businessId = $request->user()->current_business_id;
        $validated = $request->validated();

        $batch = LeatherProcessingBatch::create([
            ...$validated,
            'business_id' => $businessId,
            'batch_number' => LeatherProcessingBatch::generateBatchNumber(),
            'status' => $validated['status'] ?? 'completed',
            'created_by' => $request->user()->id,
        ]);

        return response()->json((new LeatherProcessingBatchResource($batch))->resolve(), 201);
    }
}
