<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\LivestockMarket\StoreLivestockMarketTransactionRequest;
use App\Http\Resources\LivestockMarketTransactionResource;
use App\Models\LivestockMarketTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LivestockMarketController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $businessId = $request->user()->current_business_id;
        $today = today()->toDateString();

        $intakeHeadCount = LivestockMarketTransaction::query()
            ->where('business_id', $businessId)
            ->where('transaction_type', LivestockMarketTransaction::TYPE_INTAKE)
            ->sum('head_count');

        $saleHeadCount = LivestockMarketTransaction::query()
            ->where('business_id', $businessId)
            ->where('transaction_type', LivestockMarketTransaction::TYPE_SALE)
            ->sum('head_count');

        $todaySummary = LivestockMarketTransaction::query()
            ->where('business_id', $businessId)
            ->whereDate('market_date', $today)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN transaction_type = 'intake' THEN head_count ELSE 0 END), 0) as intake_head_count_today,
                COALESCE(SUM(CASE WHEN transaction_type = 'sale' THEN head_count ELSE 0 END), 0) as sale_head_count_today,
                COALESCE(SUM(CASE WHEN transaction_type = 'sale' THEN total_amount ELSE 0 END), 0) as revenue_today,
                COALESCE(SUM(CASE WHEN transaction_type = 'intake' THEN total_amount ELSE 0 END), 0) as intake_cost_today
            ")
            ->first();

        $averageSalePricePerKg = LivestockMarketTransaction::query()
            ->where('business_id', $businessId)
            ->where('transaction_type', LivestockMarketTransaction::TYPE_SALE)
            ->whereNotNull('unit_price_per_kg')
            ->avg('unit_price_per_kg');

        return response()->json([
            'summary' => [
                'animals_in_holding' => (int) $intakeHeadCount - (int) $saleHeadCount,
                'intake_head_count_today' => (int) ($todaySummary?->intake_head_count_today ?? 0),
                'sale_head_count_today' => (int) ($todaySummary?->sale_head_count_today ?? 0),
                'revenue_today' => (float) ($todaySummary?->revenue_today ?? 0),
                'intake_cost_today' => (float) ($todaySummary?->intake_cost_today ?? 0),
                'average_sale_price_per_kg' => round((float) ($averageSalePricePerKg ?? 0), 2),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $transactions = LivestockMarketTransaction::query()
            ->where('business_id', $request->user()->current_business_id)
            ->orderByDesc('market_date')
            ->orderByDesc('id')
            ->limit(100)
            ->get();

        return response()->json(LivestockMarketTransactionResource::collection($transactions)->resolve());
    }

    public function store(StoreLivestockMarketTransactionRequest $request): JsonResponse
    {
        $businessId = $request->user()->current_business_id;
        $validated = $request->validated();

        $transaction = LivestockMarketTransaction::create([
            ...$validated,
            'business_id' => $businessId,
            'transaction_number' => LivestockMarketTransaction::generateTransactionNumber($validated['transaction_type']),
            'created_by' => $request->user()->id,
        ]);

        return response()->json((new LivestockMarketTransactionResource($transaction))->resolve(), 201);
    }
}
