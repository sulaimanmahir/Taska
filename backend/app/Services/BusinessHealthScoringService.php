<?php

namespace App\Services;

use App\Models\Business;
use App\Models\BusinessHealthSnapshot;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\InventoryItem;
use App\Models\Order;
use Illuminate\Support\Carbon;

/**
 * Computes a business's 0-100 health score from real operational data -
 * never a fabricated number. See docs/TASKA_DESIGN_CONSTITUTION.md's
 * gamification section for the full design rationale.
 *
 * The exact weighting/formula below are reasonable, documented defaults,
 * not a settled product decision - they're intentionally simple and
 * explainable (each component is independently a 0-100 score, the
 * composite is a plain average) so they're easy to review and adjust
 * rather than a black box. Flag any change here in the design doc.
 */
class BusinessHealthScoringService
{
    public function computeFor(Business $business, ?Carbon $asOf = null): array
    {
        $asOf = ($asOf ?? now())->endOfDay();
        $periodEnd = $asOf->copy();
        $periodStart = $asOf->copy()->subDays(30)->startOfDay();
        $priorPeriodStart = $periodStart->copy()->subDays(30);

        $currentRevenue = (float) Order::where('business_id', $business->id)
            ->whereBetween('created_at', [$periodStart, $periodEnd])
            ->sum('total');

        $priorRevenue = (float) Order::where('business_id', $business->id)
            ->whereBetween('created_at', [$priorPeriodStart, $periodStart])
            ->sum('total');

        $currentExpenses = (float) Expense::where('business_id', $business->id)
            ->whereBetween('expense_date', [$periodStart->toDateString(), $periodEnd->toDateString()])
            ->sum('amount');

        $outstandingBalance = (float) Customer::where('business_id', $business->id)
            ->where('balance', '>', 0)
            ->sum('balance');

        $revenueTrendScore = $this->scoreRevenueTrend($currentRevenue, $priorRevenue);
        $expenseControlScore = $this->scoreExpenseControl($currentExpenses, $currentRevenue);
        $stockHealthScore = $this->scoreStockHealth($business);
        $receivablesHealthScore = $this->scoreReceivablesHealth($outstandingBalance, $currentRevenue);

        $healthScore = (int) round(($revenueTrendScore + $expenseControlScore + $stockHealthScore + $receivablesHealthScore) / 4);

        return [
            'health_score' => $healthScore,
            'revenue_trend_score' => $revenueTrendScore,
            'expense_control_score' => $expenseControlScore,
            'stock_health_score' => $stockHealthScore,
            'receivables_health_score' => $receivablesHealthScore,
            'signals' => [
                'revenue_last_30_days' => $currentRevenue,
                'revenue_prior_30_days' => $priorRevenue,
                'expenses_last_30_days' => $currentExpenses,
                'outstanding_customer_balance' => $outstandingBalance,
            ],
        ];
    }

    public function computeAndStoreFor(Business $business, ?Carbon $asOf = null): BusinessHealthSnapshot
    {
        $asOf = $asOf ?? now();
        $result = $this->computeFor($business, $asOf);

        // Deliberately not updateOrCreate(): its WHERE-clause lookup compares
        // the raw search value against the stored column without passing it
        // through the 'date' cast's serialization, while the insert path
        // does - so a plain 'Y-m-d' search string never matches an existing
        // row (stored as a full datetime by the cast), and every call tries
        // to insert a fresh row, hitting the unique constraint on retries.
        $existing = BusinessHealthSnapshot::where('business_id', $business->id)
            ->whereDate('snapshot_date', $asOf->toDateString())
            ->first();

        if ($existing) {
            $existing->fill($result);
            $existing->save();

            return $existing;
        }

        return BusinessHealthSnapshot::create(array_merge($result, [
            'business_id' => $business->id,
            'snapshot_date' => $asOf->toDateString(),
        ]));
    }

    private function scoreRevenueTrend(float $current, float $prior): int
    {
        if ($prior <= 0) {
            return $current > 0 ? 100 : 50;
        }

        $ratio = $current / $prior;

        // Flat (ratio 1.0) scores 50; doubling scores 100; halving scores 0.
        return (int) max(0, min(100, round(50 + (($ratio - 1) * 50))));
    }

    private function scoreExpenseControl(float $expenses, float $revenue): int
    {
        if ($revenue <= 0) {
            return $expenses > 0 ? 40 : 100;
        }

        $ratio = $expenses / $revenue;

        return (int) max(0, min(100, round(100 - ($ratio * 100))));
    }

    private function scoreStockHealth(Business $business): int
    {
        $trackedItems = InventoryItem::where('business_id', $business->id)
            ->where('reorder_point', '>', 0)
            ->get(['quantity', 'reorder_point']);

        if ($trackedItems->isEmpty()) {
            return 100;
        }

        $healthy = $trackedItems->filter(fn ($item) => $item->quantity > $item->reorder_point)->count();

        return (int) round(($healthy / $trackedItems->count()) * 100);
    }

    private function scoreReceivablesHealth(float $outstandingBalance, float $revenue): int
    {
        if ($outstandingBalance <= 0) {
            return 100;
        }

        if ($revenue <= 0) {
            return 0;
        }

        $ratio = $outstandingBalance / $revenue;

        return (int) max(0, min(100, round(100 - ($ratio * 100))));
    }
}
