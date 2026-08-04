<?php

namespace App\Services;

use App\Models\AiInsight;
use App\Models\Branch;
use App\Models\Business;
use App\Models\CommodityLot;
use App\Models\Cooperative;
use App\Models\CooperativeFinancing;
use App\Models\CooperativeProfitCycle;
use App\Models\ConstructionQuotationItem;
use App\Models\DeliveryComplaint;
use App\Models\DeliveryOrder;
use App\Models\FuelVarianceAlert;
use App\Models\HotelBooking;
use App\Models\HotelRoom;
use App\Models\InventoryItem;
use App\Models\LivestockAnimalGroup;
use App\Models\LivestockDiseaseLog;
use App\Models\LivestockMilkLog;
use App\Models\LivestockWeightLog;
use App\Models\LogisticsMaintenanceLog;
use App\Models\MobileAgentFraudAlert;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductionBatch;
use App\Models\RestaurantTicket;
use App\Models\TrustAccount;
use App\Models\AgroSeasonalForecast;
use App\Models\WholesaleRouteRun;
use App\Models\WholesaleRouteStop;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

class AiService
{
    public function generateInsights(int $businessId): void
    {
        $business = Business::find($businessId);

        if (! $business) {
            return;
        }

        $this->checkLowStock($businessId);
        $this->checkOverdueCredits($businessId);
        $this->checkSlowMovingProducts($businessId);
        $this->checkSalesDecline($businessId);
        $this->checkBranchPerformance($businessId);
        $this->checkStockoutForecast($businessId);
        $this->checkReorderWindowForecast($businessId);
        $this->checkCustomerConcentrationRisk($businessId);
        $this->checkWholesaleRouteProfitabilityForecast($business);
        $this->checkTrustRepaymentRisk($businessId);
        $this->checkAdasheCollectionSlippage($businessId);
        $this->checkAdasheDueCollectionPressure($businessId);
        $this->checkCooperativeFinancingApprovalDrag($businessId);
        $this->checkCooperativeProfitDistributionReadiness($businessId);
        $this->checkDebtorFollowupPriority($businessId);
        $this->checkCreditDefaultForecast($businessId);
        $this->checkPharmacyExpiryPressure($business);
        $this->checkPharmacyDemandExpiryImbalance($business);
        $this->checkPharmacyDemandForecast($business);
        $this->checkDeliveryRisk($business);
        $this->checkDeliverySlowdownForecast($business);
        $this->checkDeliveryCodExposureForecast($business);
        $this->checkProductionEfficiency($business);
        $this->checkProductionMarginErosion($business);
        $this->checkCommodityQualityPressure($business);
        $this->checkHotelRoomReadiness($business);
        $this->checkHotelOccupancyPacing($business);
        $this->checkFuelVariancePressure($business);
        $this->checkFuelShrinkageRiskScore($business);
        $this->checkSchoolFeeDefaultWarning($business);
        $this->checkAgroSeasonalStockPlanning($business);
        $this->checkLivestockHealthProductivityWarning($business);
        $this->checkMobileAgentFraudPressure($business);
        $this->checkLogisticsMaintenancePressure($business);
        $this->checkProductionCostSpikeForecast($business);
        $this->checkConstructionMarginPressure($business);
        $this->checkRestaurantMarginWasteForecast($business);
    }

    public function getInsights(int $businessId, bool $unreadOnly = false): Collection
    {
        $this->generateInsights($businessId);

        $query = AiInsight::where('business_id', $businessId)
            ->where('is_dismissed', false)
            ->orderByRaw("case severity when 'critical' then 1 when 'warning' then 2 else 3 end")
            ->orderByDesc('updated_at');

        if ($unreadOnly) {
            $query->where('is_read', false);
        }

        return $query->limit(20)->get();
    }

    public function getInsightSummary(int $businessId): array
    {
        $insights = $this->getInsights($businessId);
        $grouped = $this->buildInsightGroups($insights);
        $groupLabels = collect($grouped)
            ->mapWithKeys(fn (array $group) => [$group['key'] => $group['label']]);

        return [
            'total' => $insights->count(),
            'unread' => $insights->where('is_read', false)->count(),
            'critical' => $insights->where('severity', 'critical')->count(),
            'warning' => $insights->where('severity', 'warning')->count(),
            'top' => $insights->take(3)->values()->map(fn (AiInsight $insight) => [
                'id' => $insight->id,
                'type' => $insight->type,
                'severity' => $insight->severity,
                'title' => $insight->title,
                'description' => $insight->description,
                'recommendation' => $insight->recommendation,
                'is_read' => $insight->is_read,
                'updated_at' => $insight->updated_at,
            ])->all(),
            'groups' => $grouped,
            'daily_actions' => $insights
                ->groupBy(fn (AiInsight $insight) => $this->groupKeyForInsight($insight->type))
                ->flatMap(fn (Collection $groupInsights, string $groupKey) => $groupInsights
                    ->filter(fn (AiInsight $insight) => ! empty($insight->recommendation))
                    ->take(2)
                    ->map(fn (AiInsight $insight) => [
                        'id' => $insight->id,
                        'group' => $groupKey,
                        'group_label' => $groupLabels->get($groupKey, ucfirst($groupKey)),
                        'title' => $insight->title,
                        'recommendation' => $insight->recommendation,
                        'severity' => $insight->severity,
                        'is_read' => $insight->is_read,
                        'updated_at' => $insight->updated_at,
                    ]))
                ->take(6)
                ->values()
                ->all(),
        ];
    }

    public function getGroupedInsights(int $businessId, bool $unreadOnly = false): array
    {
        $insights = $this->getInsights($businessId, $unreadOnly);

        return $this->buildInsightGroups($insights);
    }

    public function markAsRead(int $businessId, int $insightId): AiInsight
    {
        $insight = $this->findInsightOrFail($businessId, $insightId);
        $insight->update(['is_read' => true]);

        return $insight->fresh();
    }

    public function dismiss(int $businessId, int $insightId): AiInsight
    {
        $insight = $this->findInsightOrFail($businessId, $insightId);
        $insight->update(['is_dismissed' => true]);

        return $insight->fresh();
    }

    public function restore(int $businessId, int $insightId): AiInsight
    {
        $insight = $this->findInsightOrFail($businessId, $insightId);
        $insight->update(['is_dismissed' => false]);

        return $insight->fresh();
    }

    private function checkLowStock(int $businessId): void
    {
        $lowStockItems = DB::table('inventory_items')
            ->join('products', 'inventory_items.product_id', '=', 'products.id')
            ->where('inventory_items.business_id', $businessId)
            ->whereRaw('inventory_items.quantity <= COALESCE(products.low_stock_alert, 10)')
            ->select('products.name', 'inventory_items.quantity', 'products.low_stock_alert')
            ->orderBy('inventory_items.quantity')
            ->limit(5)
            ->get();

        $active = $lowStockItems->isNotEmpty();

        $this->syncInsight(
            $businessId,
            'low_stock_watch',
            $active,
            [
                'severity' => 'warning',
                'title' => 'Low stock is building up',
                'description' => $active
                    ? sprintf('%d products are at or below reorder level, which can trigger lost sales and emergency buying.', $lowStockItems->count())
                    : null,
                'recommendation' => $active
                    ? 'Review the low-stock list, raise replenishment orders, and prioritize fast movers before they stock out.'
                    : null,
                'data' => ['items' => $lowStockItems->toArray()],
            ]
        );
    }

    private function checkOverdueCredits(int $businessId): void
    {
        $overdueAccounts = TrustAccount::where('business_id', $businessId)
            ->where('account_type', 'credit')
            ->where('balance', '>', 0)
            ->whereDate('last_payment_date', '<', now()->subDays(30))
            ->count();

        $this->syncInsight(
            $businessId,
            'credit_collection_pressure',
            $overdueAccounts > 0,
            [
                'severity' => 'critical',
                'title' => 'Credit collections need attention',
                'description' => "{$overdueAccounts} credit accounts are more than 30 days overdue, which can silently tighten cash flow.",
                'recommendation' => 'Prioritize collections today, tighten new credit issuance, and review repeat defaulters before approving more exposure.',
                'data' => ['overdue_accounts' => $overdueAccounts],
            ]
        );
    }

    private function checkSlowMovingProducts(int $businessId): void
    {
        $thirtyDaysAgo = now()->subDays(30);

        $soldProducts = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.business_id', $businessId)
            ->where('orders.created_at', '>=', $thirtyDaysAgo)
            ->groupBy('order_items.product_id')
            ->pluck('order_items.product_id')
            ->toArray();

        $slowMovers = Product::where('business_id', $businessId)
            ->where('is_active', true)
            ->when($soldProducts !== [], fn ($query) => $query->whereNotIn('id', $soldProducts))
            ->limit(5)
            ->get(['id', 'name']);

        $active = $slowMovers->isNotEmpty();

        $this->syncInsight(
            $businessId,
            'slow_moving_stock',
            $active,
            [
                'severity' => 'info',
                'title' => 'Dead stock may be tying down cash',
                'description' => $active
                    ? sprintf('%d active products have not moved in the last 30 days, increasing holding cost and pricing pressure.', $slowMovers->count())
                    : null,
                'recommendation' => $active
                    ? 'Consider a targeted promotion, bundle, return-to-supplier review, or a decision to stop reordering these items.'
                    : null,
                'data' => ['products' => $slowMovers->toArray()],
            ]
        );
    }

    private function checkSalesDecline(int $businessId): void
    {
        $thisMonth = (float) Order::where('business_id', $businessId)
            ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
            ->sum('total');

        $lastMonth = (float) Order::where('business_id', $businessId)
            ->whereBetween('created_at', [now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()])
            ->sum('total');

        $active = $lastMonth > 0 && $thisMonth < ($lastMonth * 0.7);
        $decline = $active ? round((1 - ($thisMonth / $lastMonth)) * 100) : 0;

        $this->syncInsight(
            $businessId,
            'sales_decline',
            $active,
            [
                'severity' => 'warning',
                'title' => 'Sales momentum has dropped',
                'description' => "Sales are down {$decline}% compared to last month, which can become a cash-flow problem if not explained quickly.",
                'recommendation' => 'Check stock availability, recent price changes, top-customer activity, and channel performance before the month closes.',
                'data' => [
                    'this_month' => $thisMonth,
                    'last_month' => $lastMonth,
                    'decline_percent' => $decline,
                ],
            ]
        );
    }

    private function checkBranchPerformance(int $businessId): void
    {
        $branches = Branch::where('business_id', $businessId)->count();

        if ($branches <= 1) {
            $this->clearInsight($businessId, 'branch_performance_gap');

            return;
        }

        $branchPerformance = DB::table('orders')
            ->where('business_id', $businessId)
            ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
            ->whereNotNull('branch_id')
            ->groupBy('branch_id')
            ->selectRaw('branch_id, SUM(total) as revenue')
            ->orderByDesc('revenue')
            ->get();

        $topBranch = $branchPerformance->first();
        $lowBranch = $branchPerformance->last();
        $active = $topBranch && $lowBranch && (float) $lowBranch->revenue > 0 && (float) $topBranch->revenue > ((float) $lowBranch->revenue * 2);

        $this->syncInsight(
            $businessId,
            'branch_performance_gap',
            $active,
            [
                'severity' => 'info',
                'title' => 'Branch performance gap detected',
                'description' => 'The best-performing branch is generating at least double the revenue of the weakest branch this month.',
                'recommendation' => 'Compare staffing, stock availability, pricing discipline, and customer mix at the lower-performing branch this week.',
                'data' => [
                    'top_branch_revenue' => (float) ($topBranch->revenue ?? 0),
                    'low_branch_revenue' => (float) ($lowBranch->revenue ?? 0),
                ],
            ]
        );
    }

    private function checkStockoutForecast(int $businessId): void
    {
        $salesWindowStart = now()->subDays(7)->startOfDay();

        $salesVelocity = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->join('inventory_items', function ($join) use ($businessId) {
                $join->on('inventory_items.product_id', '=', 'products.id')
                    ->where('inventory_items.business_id', '=', $businessId);
            })
            ->where('orders.business_id', $businessId)
            ->where('orders.order_type', 'sale')
            ->where('orders.created_at', '>=', $salesWindowStart)
            ->groupBy('products.id', 'products.name', 'inventory_items.quantity')
            ->selectRaw('
                products.id,
                products.name,
                inventory_items.quantity as stock_quantity,
                COALESCE(SUM(order_items.quantity), 0) as seven_day_sales
            ')
            ->get()
            ->filter(function ($row) {
                $sevenDaySales = (float) $row->seven_day_sales;
                $stockQuantity = (float) $row->stock_quantity;

                if ($sevenDaySales <= 0) {
                    return false;
                }

                $avgDailySales = $sevenDaySales / 7;
                $daysOfCover = $stockQuantity / $avgDailySales;

                return $daysOfCover <= 7;
            })
            ->sortBy(function ($row) {
                $avgDailySales = ((float) $row->seven_day_sales) / 7;

                return (float) $row->stock_quantity / max($avgDailySales, 0.001);
            })
            ->take(5)
            ->values();

        $active = $salesVelocity->isNotEmpty();

        $this->syncInsight(
            $businessId,
            'stockout_forecast',
            $active,
            [
                'severity' => 'critical',
                'title' => 'Some fast movers may run out within 7 days',
                'description' => $active
                    ? sprintf('%d products are selling faster than their current stock cover can support for the next week.', $salesVelocity->count())
                    : null,
                'recommendation' => $active
                    ? 'Raise replenishment now for the listed items and compare forecast demand against inbound stock or supplier lead time.'
                    : null,
                'data' => [
                    'items' => $salesVelocity->map(function ($row) {
                        $avgDailySales = round(((float) $row->seven_day_sales) / 7, 2);
                        $stockQuantity = round((float) $row->stock_quantity, 2);

                        return [
                            'product_id' => (int) $row->id,
                            'name' => $row->name,
                            'stock_quantity' => $stockQuantity,
                            'avg_daily_sales' => $avgDailySales,
                            'seven_day_sales' => round((float) $row->seven_day_sales, 2),
                            'days_of_cover' => $avgDailySales > 0 ? round($stockQuantity / $avgDailySales, 1) : null,
                        ];
                    })->all(),
                ],
            ]
        );
    }

    private function checkReorderWindowForecast(int $businessId): void
    {
        $salesWindowStart = now()->subDays(7)->startOfDay();

        $reorderWindowItems = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->join('inventory_items', function ($join) use ($businessId) {
                $join->on('inventory_items.product_id', '=', 'products.id')
                    ->where('inventory_items.business_id', '=', $businessId);
            })
            ->where('orders.business_id', $businessId)
            ->where('orders.order_type', 'sale')
            ->where('orders.created_at', '>=', $salesWindowStart)
            ->groupBy('products.id', 'products.name', 'inventory_items.quantity', 'inventory_items.reorder_quantity')
            ->selectRaw('
                products.id,
                products.name,
                inventory_items.quantity as stock_quantity,
                inventory_items.reorder_quantity,
                COALESCE(SUM(order_items.quantity), 0) as seven_day_sales
            ')
            ->get()
            ->filter(function ($row) {
                $sevenDaySales = (float) $row->seven_day_sales;
                $stockQuantity = (float) $row->stock_quantity;

                if ($sevenDaySales <= 0) {
                    return false;
                }

                $avgDailySales = $sevenDaySales / 7;
                $daysOfCover = $stockQuantity / max($avgDailySales, 0.001);

                return $daysOfCover > 7 && $daysOfCover <= 14;
            })
            ->sortBy(function ($row) {
                $avgDailySales = ((float) $row->seven_day_sales) / 7;

                return (float) $row->stock_quantity / max($avgDailySales, 0.001);
            })
            ->take(5)
            ->values();

        $active = $reorderWindowItems->isNotEmpty();

        $this->syncInsight(
            $businessId,
            'reorder_window_forecast',
            $active,
            [
                'severity' => 'warning',
                'title' => 'Some products are entering the reorder window',
                'description' => $active
                    ? sprintf('%d products have about one to two weeks of stock cover left based on recent sales velocity.', $reorderWindowItems->count())
                    : null,
                'recommendation' => $active
                    ? 'Place replenishment before these items slide into emergency stockout territory, especially if supplier lead times are longer than a week.'
                    : null,
                'data' => [
                    'items' => $reorderWindowItems->map(function ($row) {
                        $avgDailySales = round(((float) $row->seven_day_sales) / 7, 2);
                        $stockQuantity = round((float) $row->stock_quantity, 2);

                        return [
                            'product_id' => (int) $row->id,
                            'name' => $row->name,
                            'stock_quantity' => $stockQuantity,
                            'avg_daily_sales' => $avgDailySales,
                            'reorder_quantity' => round((float) ($row->reorder_quantity ?? 0), 2),
                            'days_of_cover' => $avgDailySales > 0 ? round($stockQuantity / $avgDailySales, 1) : null,
                        ];
                    })->all(),
                ],
            ]
        );
    }

    private function checkCustomerConcentrationRisk(int $businessId): void
    {
        $monthStart = now()->startOfMonth();
        $monthEnd = now()->endOfMonth();

        $customerRevenue = Order::query()
            ->join('customers', 'customers.id', '=', 'orders.customer_id')
            ->where('orders.business_id', $businessId)
            ->whereBetween('orders.created_at', [$monthStart, $monthEnd])
            ->groupBy('customers.id', 'customers.name')
            ->selectRaw('customers.id, customers.name, COALESCE(SUM(orders.total), 0) as revenue')
            ->orderByDesc('revenue')
            ->get();

        $topCustomer = $customerRevenue->first();
        $totalRevenue = (float) $customerRevenue->sum('revenue');
        $share = $topCustomer && $totalRevenue > 0
            ? round((((float) $topCustomer->revenue) / $totalRevenue) * 100, 1)
            : 0;

        $active = $share >= 40;

        $this->syncInsight(
            $businessId,
            'customer_concentration_risk',
            $active,
            [
                'severity' => $share >= 60 ? 'critical' : 'warning',
                'title' => 'Revenue is concentrated in too few customers',
                'description' => $topCustomer
                    ? "{$topCustomer->name} is contributing {$share}% of this month's revenue, increasing exposure if their demand slows or payment delays."
                    : null,
                'recommendation' => $topCustomer
                    ? 'Protect the relationship, but grow secondary accounts now so one buyer cannot distort monthly cash flow.'
                    : null,
                'data' => [
                    'top_customer_id' => $topCustomer?->id,
                    'top_customer_name' => $topCustomer?->name,
                    'top_customer_revenue' => (float) ($topCustomer->revenue ?? 0),
                    'share_percent' => $share,
                    'month_revenue' => $totalRevenue,
                ],
            ]
        );
    }

    private function checkWholesaleRouteProfitabilityForecast(?Business $business): void
    {
        if (! $business || $business->business_type !== 'wholesale') {
            if ($business) {
                $this->clearInsight($business->id, 'wholesale_route_profitability_forecast');
            }

            return;
        }

        $recentRoutes = WholesaleRouteRun::query()
            ->where('business_id', $business->id)
            ->whereDate('route_date', '>=', now()->subDays(7))
            ->get();

        $activeRoutes = $recentRoutes->filter(function (WholesaleRouteRun $route) {
            $target = max((float) $route->target_amount, 1.0);
            $actual = (float) $route->actual_amount;

            return $actual > 0 && (($actual / $target) * 100) < 75;
        });

        $weakStops = WholesaleRouteStop::query()
            ->join('wholesale_route_runs', 'wholesale_route_runs.id', '=', 'wholesale_route_stops.route_run_id')
            ->where('wholesale_route_runs.business_id', $business->id)
            ->whereDate('wholesale_route_runs.route_date', '>=', now()->subDays(7))
            ->select('wholesale_route_stops.*')
            ->get()
            ->filter(function (WholesaleRouteStop $stop) {
                $expected = max((float) $stop->expected_amount, 1.0);
                $collected = (float) $stop->collected_amount;

                return $expected > 0 && (($collected / $expected) * 100) < 70;
            });

        $active = $activeRoutes->isNotEmpty() || $weakStops->isNotEmpty();

        $this->syncInsight(
            $business->id,
            'wholesale_route_profitability_forecast',
            $active,
            [
                'severity' => $activeRoutes->count() >= 2 || $weakStops->count() >= 2 ? 'warning' : 'info',
                'title' => 'Some wholesale routes are trending below target productivity',
                'description' => $active
                    ? "{$activeRoutes->count()} recent route runs and {$weakStops->count()} stops are converting below expected value, which can drag route-day profitability."
                    : null,
                'recommendation' => $active
                    ? 'Review underperforming territories, tighten stop planning, and rebalance reps or van stock before weak routes become recurring loss-makers.'
                    : null,
                'data' => [
                    'route_runs_below_target' => $activeRoutes->count(),
                    'weak_stops' => $weakStops->count(),
                ],
            ]
        );
    }

    private function checkDebtorFollowupPriority(int $businessId): void
    {
        $priorityAccounts = TrustAccount::query()
            ->with('customer:id,name')
            ->where('business_id', $businessId)
            ->where('account_type', 'credit')
            ->where('status', 'active')
            ->where('balance', '>', 0)
            ->get()
            ->map(function (TrustAccount $account) {
                $daysSincePayment = $account->last_payment_date?->diffInDays(now()) ?? 999;
                $priorityScore = round(((float) $account->balance / 1000) + ($daysSincePayment * 1.5), 1);

                return [
                    'id' => $account->id,
                    'customer_id' => $account->customer_id,
                    'customer_name' => $account->customer?->name,
                    'balance' => (float) $account->balance,
                    'days_since_payment' => $daysSincePayment,
                    'priority_score' => $priorityScore,
                ];
            })
            ->filter(fn (array $account) => $account['days_since_payment'] >= 10 && $account['balance'] >= 5000)
            ->sortByDesc('priority_score')
            ->take(5)
            ->values();

        $active = $priorityAccounts->isNotEmpty();

        $this->syncInsight(
            $businessId,
            'debtor_followup_priority',
            $active,
            [
                'severity' => $priorityAccounts->count() >= 3 ? 'critical' : 'warning',
                'title' => 'Today\'s debtor follow-up queue is forming',
                'description' => $active
                    ? sprintf('%d debtors now deserve same-day follow-up based on balance size and repayment silence.', $priorityAccounts->count())
                    : null,
                'recommendation' => $active
                    ? 'Start with the highest-score debtors first, log contact outcomes, and tighten fresh credit for anyone who avoids repayment discussions.'
                    : null,
                'data' => [
                    'accounts' => $priorityAccounts->all(),
                ],
            ]
        );
    }

    private function checkPharmacyExpiryPressure(Business $business): void
    {
        if ($business->business_type !== 'pharmacy') {
            $this->clearInsight($business->id, 'pharmacy_expiry_pressure');

            return;
        }

        $nearExpiry = ProductBatch::where('business_id', $business->id)
            ->whereDate('expiry_date', '>=', today())
            ->whereDate('expiry_date', '<=', now()->addDays(30))
            ->where('remaining_quantity', '>', 0)
            ->count();

        $this->syncInsight(
            $business->id,
            'pharmacy_expiry_pressure',
            $nearExpiry > 0,
            [
                'severity' => 'critical',
                'title' => 'Expiry pressure is building',
                'description' => "{$nearExpiry} medicine batches are within 30 days of expiry, creating margin risk and patient-safety pressure.",
                'recommendation' => 'Push near-expiry movement, activate discount rules where appropriate, and stop over-ordering the affected lines.',
                'data' => ['near_expiry_batches' => $nearExpiry],
            ]
        );
    }

    private function checkPharmacyDemandExpiryImbalance(Business $business): void
    {
        if ($business->business_type !== 'pharmacy') {
            $this->clearInsight($business->id, 'pharmacy_demand_expiry_imbalance');

            return;
        }

        $atRiskBatches = ProductBatch::query()
            ->where('business_id', $business->id)
            ->whereDate('expiry_date', '>=', today())
            ->whereDate('expiry_date', '<=', now()->addDays(30))
            ->where('remaining_quantity', '>', 0)
            ->get()
            ->filter(function (ProductBatch $batch) use ($business) {
                $recentSales = DB::table('order_items')
                    ->join('orders', 'orders.id', '=', 'order_items.order_id')
                    ->where('orders.business_id', $business->id)
                    ->where('order_items.product_id', $batch->product_id)
                    ->where('orders.created_at', '>=', now()->subDays(14))
                    ->sum('order_items.quantity');

                return (float) $recentSales <= 0;
            })
            ->take(5)
            ->values();

        $active = $atRiskBatches->isNotEmpty();

        $this->syncInsight(
            $business->id,
            'pharmacy_demand_expiry_imbalance',
            $active,
            [
                'severity' => 'critical',
                'title' => 'Expiry stock has weak demand support',
                'description' => $active
                    ? sprintf('%d near-expiry medicine batches have shown no sales in the last 14 days, increasing write-off risk.', $atRiskBatches->count())
                    : null,
                'recommendation' => $active
                    ? 'Review pricing, substitution guidance, and prescriber demand now so expiring stock does not become dead loss.'
                    : null,
                'data' => [
                    'batches' => $atRiskBatches->map(fn (ProductBatch $batch) => [
                        'batch_number' => $batch->batch_number,
                        'product_id' => $batch->product_id,
                        'remaining_quantity' => (float) $batch->remaining_quantity,
                        'expiry_date' => $batch->expiry_date?->toDateString(),
                    ])->all(),
                ],
            ]
        );
    }

    private function checkPharmacyDemandForecast(Business $business): void
    {
        if ($business->business_type !== 'pharmacy') {
            $this->clearInsight($business->id, 'pharmacy_demand_forecast');

            return;
        }

        $salesWindowStart = now()->subDays(14)->startOfDay();

        $salesByProduct = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->where('orders.business_id', $business->id)
            ->where('orders.order_type', 'sale')
            ->where('orders.created_at', '>=', $salesWindowStart)
            ->groupBy('products.id', 'products.name')
            ->selectRaw('
                products.id,
                products.name,
                COALESCE(SUM(order_items.quantity), 0) as fourteen_day_sales
            ')
            ->get();

        $safeStockByProduct = ProductBatch::query()
            ->where('business_id', $business->id)
            ->where('remaining_quantity', '>', 0)
            ->where(function ($query) {
                $query->whereNull('expiry_date')
                    ->orWhereDate('expiry_date', '>', now()->addDays(45));
            })
            ->get()
            ->groupBy('product_id')
            ->map(fn ($batches) => (float) $batches->sum('remaining_quantity'));

        $atRiskProducts = $salesByProduct
            ->map(function ($row) use ($safeStockByProduct) {
                $row->safe_stock = $safeStockByProduct->get($row->id, 0.0);

                return $row;
            })
            ->filter(function ($row) {
                $fourteenDaySales = (float) $row->fourteen_day_sales;

                if ($fourteenDaySales <= 0) {
                    return false;
                }

                $dailyDemand = $fourteenDaySales / 14;
                $daysOfSafeCover = ((float) $row->safe_stock) / max($dailyDemand, 0.001);

                return $daysOfSafeCover <= 21;
            })
            ->sortBy(function ($row) {
                $dailyDemand = ((float) $row->fourteen_day_sales) / 14;

                return ((float) $row->safe_stock) / max($dailyDemand, 0.001);
            })
            ->take(5)
            ->values();

        $active = $atRiskProducts->isNotEmpty();

        $this->syncInsight(
            $business->id,
            'pharmacy_demand_forecast',
            $active,
            [
                'severity' => 'warning',
                'title' => 'Some medicines may not cover coming demand safely',
                'description' => $active
                    ? sprintf('%d fast-moving medicine lines have less than 3 weeks of expiry-safe stock based on recent demand.', $atRiskProducts->count())
                    : null,
                'recommendation' => $active
                    ? 'Replenish these lines early and favor batches with stronger shelf life so demand does not push you into unsafe expiry exposure.'
                    : null,
                'data' => [
                    'items' => $atRiskProducts->map(function ($row) {
                        $dailyDemand = round(((float) $row->fourteen_day_sales) / 14, 2);
                        $safeStock = round((float) $row->safe_stock, 2);

                        return [
                            'product_id' => (int) $row->id,
                            'name' => $row->name,
                            'safe_stock' => $safeStock,
                            'avg_daily_demand' => $dailyDemand,
                            'days_of_safe_cover' => $dailyDemand > 0 ? round($safeStock / $dailyDemand, 1) : null,
                        ];
                    })->all(),
                ],
            ]
        );
    }

    private function checkDeliveryRisk(Business $business): void
    {
        if (! in_array($business->business_type, ['delivery_company', 'logistics'], true)) {
            $this->clearInsight($business->id, 'delivery_exception_pressure');

            return;
        }

        $openComplaints = DeliveryComplaint::where('business_id', $business->id)
            ->where('status', 'open')
            ->count();

        $unremittedCod = (float) DeliveryOrder::where('business_id', $business->id)
            ->sum(DB::raw('COALESCE(cod_amount, 0) - COALESCE(amount_remitted, 0)'));

        $active = $openComplaints > 0 || $unremittedCod > 0;

        $this->syncInsight(
            $business->id,
            'delivery_exception_pressure',
            $active,
            [
                'severity' => $openComplaints > 2 || $unremittedCod > 0 ? 'critical' : 'warning',
                'title' => 'Courier exceptions need same-day action',
                'description' => "There are {$openComplaints} open complaints and " . number_format($unremittedCod, 2) . ' NGN in COD still pending remittance.',
                'recommendation' => 'Escalate complaint resolution, follow up remittance gaps, and review riders or routes driving repeated exceptions.',
                'data' => [
                    'open_complaints' => $openComplaints,
                    'unremitted_cod' => $unremittedCod,
                ],
            ]
        );
    }

    private function checkDeliverySlowdownForecast(Business $business): void
    {
        if (! in_array($business->business_type, ['delivery_company', 'logistics'], true)) {
            $this->clearInsight($business->id, 'delivery_slowdown_forecast');

            return;
        }

        $delayedOrders = DeliveryOrder::query()
            ->where('business_id', $business->id)
            ->whereIn('status', ['pending_pickup', 'picked_up', 'in_transit'])
            ->where('created_at', '<=', now()->subDay())
            ->count();

        $active = $delayedOrders > 0;

        $this->syncInsight(
            $business->id,
            'delivery_slowdown_forecast',
            $active,
            [
                'severity' => $delayedOrders >= 5 ? 'critical' : 'warning',
                'title' => 'Delivery backlog may slow tomorrow\'s flow',
                'description' => "{$delayedOrders} active deliveries are already older than 24 hours, which suggests route congestion or execution drag.",
                'recommendation' => 'Re-balance riders, clear ageing jobs first, and inspect branches or routes where jobs are repeatedly stalling.',
                'data' => ['delayed_orders' => $delayedOrders],
            ]
        );
    }

    private function checkDeliveryCodExposureForecast(Business $business): void
    {
        if (! in_array($business->business_type, ['delivery_company', 'logistics'], true)) {
            $this->clearInsight($business->id, 'delivery_cod_exposure_forecast');

            return;
        }

        $outstandingCod = (float) DeliveryOrder::query()
            ->where('business_id', $business->id)
            ->sum(DB::raw('COALESCE(cod_amount, 0) - COALESCE(amount_remitted, 0)'));

        $ageingCodOrders = DeliveryOrder::query()
            ->where('business_id', $business->id)
            ->where('cod_amount', '>', DB::raw('COALESCE(amount_remitted, 0)'))
            ->where('created_at', '<=', now()->subDays(2))
            ->count();

        $recentDeliveryRevenue = (float) DeliveryOrder::query()
            ->where('business_id', $business->id)
            ->whereIn('status', ['delivered', 'in_transit', 'picked_up'])
            ->where('created_at', '>=', now()->subDays(7))
            ->sum('total_fee');

        $exposureRatio = $recentDeliveryRevenue > 0
            ? round(($outstandingCod / $recentDeliveryRevenue) * 100, 1)
            : ($outstandingCod > 0 ? 100.0 : 0.0);

        $active = $outstandingCod > 0 && ($exposureRatio >= 35 || $ageingCodOrders > 0);

        $this->syncInsight(
            $business->id,
            'delivery_cod_exposure_forecast',
            $active,
            [
                'severity' => $exposureRatio >= 60 || $ageingCodOrders >= 3 ? 'critical' : 'warning',
                'title' => 'COD exposure could distort courier cash flow',
                'description' => $active
                    ? "Outstanding COD is " . number_format($outstandingCod, 2) . " NGN across {$ageingCodOrders} ageing jobs, which is {$exposureRatio}% of recent delivery revenue."
                    : null,
                'recommendation' => $active
                    ? 'Reconcile ageing COD jobs immediately, escalate high-balance riders, and tighten remittance checks before exposure spreads.'
                    : null,
                'data' => [
                    'outstanding_cod' => $outstandingCod,
                    'ageing_cod_orders' => $ageingCodOrders,
                    'recent_delivery_revenue' => $recentDeliveryRevenue,
                    'exposure_ratio_percent' => $exposureRatio,
                ],
            ]
        );
    }

    private function checkProductionEfficiency(Business $business): void
    {
        if ($business->business_type !== 'pure_water_factory') {
            $this->clearInsight($business->id, 'production_efficiency_pressure');

            return;
        }

        $todayBatch = ProductionBatch::where('business_id', $business->id)
            ->whereDate('production_date', today())
            ->latest('production_date')
            ->first();

        $active = $todayBatch && (((int) $todayBatch->downtime_minutes > 0) || ((float) $todayBatch->net_margin < 0));

        $this->syncInsight(
            $business->id,
            'production_efficiency_pressure',
            $active,
            [
                'severity' => ((int) ($todayBatch->downtime_minutes ?? 0) > 60 || (float) ($todayBatch->net_margin ?? 0) < 0) ? 'critical' : 'warning',
                'title' => 'Factory efficiency is under pressure',
                'description' => 'Today\'s batch shows downtime or negative margin, which means energy, packaging, or waste may be eroding profit.',
                'recommendation' => 'Check power-source cost mix, packaging losses, and runtime efficiency before scheduling the next batch.',
                'data' => [
                    'downtime_minutes' => (int) ($todayBatch->downtime_minutes ?? 0),
                    'net_margin' => (float) ($todayBatch->net_margin ?? 0),
                ],
            ]
        );
    }

    private function checkProductionMarginErosion(Business $business): void
    {
        if ($business->business_type !== 'pure_water_factory') {
            $this->clearInsight($business->id, 'production_margin_erosion');

            return;
        }

        $recentBatches = ProductionBatch::query()
            ->where('business_id', $business->id)
            ->whereDate('production_date', '>=', now()->subDays(14))
            ->latest('production_date')
            ->take(3)
            ->get();

        if ($recentBatches->count() < 2) {
            $this->clearInsight($business->id, 'production_margin_erosion');

            return;
        }

        $averageMargin = (float) $recentBatches->avg(fn (ProductionBatch $batch) => (float) $batch->net_margin);
        $latestMargin = (float) $recentBatches->first()->net_margin;
        $oldestMargin = (float) $recentBatches->last()->net_margin;
        $active = $averageMargin < 0 || $latestMargin < $oldestMargin;

        $this->syncInsight(
            $business->id,
            'production_margin_erosion',
            $active,
            [
                'severity' => $averageMargin < 0 ? 'critical' : 'warning',
                'title' => 'Production margin is eroding',
                'description' => 'Recent factory batches show weakening net margin, which points to energy, packaging, labour, or waste pressure.',
                'recommendation' => 'Compare the last three batches line by line and correct the cost driver that is growing faster than output value.',
                'data' => [
                    'average_margin' => $averageMargin,
                    'latest_margin' => $latestMargin,
                    'oldest_margin' => $oldestMargin,
                ],
            ]
        );
    }

    private function checkCommodityQualityPressure(Business $business): void
    {
        if ($business->business_type !== 'commodity') {
            $this->clearInsight($business->id, 'commodity_quality_pressure');

            return;
        }

        $highMoistureLots = CommodityLot::where('business_id', $business->id)
            ->where('status', 'open')
            ->where('moisture_percent', '>', 12)
            ->count();

        $active = $highMoistureLots > 0;

        $this->syncInsight(
            $business->id,
            'commodity_quality_pressure',
            $active,
            [
                'severity' => $highMoistureLots > 2 ? 'critical' : 'warning',
                'title' => 'Commodity quality risk detected',
                'description' => "{$highMoistureLots} open lots are above safe moisture threshold, raising shrinkage and dispute risk.",
                'recommendation' => 'Inspect affected lots, re-grade where necessary, and avoid pricing them like top-quality stock until moisture risk is resolved.',
                'data' => ['high_moisture_lots' => $highMoistureLots],
            ]
        );
    }

    private function checkHotelRoomReadiness(Business $business): void
    {
        if ($business->business_type !== 'hotel') {
            $this->clearInsight($business->id, 'hotel_room_readiness');

            return;
        }

        $blockedOrDirty = HotelRoom::where('business_id', $business->id)
            ->where(function ($query) {
                $query->whereIn('status', ['blocked', 'out_of_service'])
                    ->orWhereIn('cleaning_status', ['dirty', 'in_progress']);
            })
            ->count();

        $active = $blockedOrDirty > 0;

        $this->syncInsight(
            $business->id,
            'hotel_room_readiness',
            $active,
            [
                'severity' => $blockedOrDirty > 3 ? 'warning' : 'info',
                'title' => 'Sellable room inventory is constrained',
                'description' => "{$blockedOrDirty} rooms are blocked or not ready for sale, which can reduce occupancy and revenue today.",
                'recommendation' => 'Prioritize cleaning, maintenance clearance, and room inspection closeout before peak check-in time.',
                'data' => ['rooms_unavailable' => $blockedOrDirty],
            ]
        );
    }

    private function checkHotelOccupancyPacing(Business $business): void
    {
        if ($business->business_type !== 'hotel') {
            $this->clearInsight($business->id, 'hotel_occupancy_pacing');

            return;
        }

        $sellableRooms = HotelRoom::query()
            ->where('business_id', $business->id)
            ->where('is_active', true)
            ->whereNotIn('status', ['blocked', 'out_of_service'])
            ->count();

        if ($sellableRooms === 0) {
            $this->clearInsight($business->id, 'hotel_occupancy_pacing');

            return;
        }

        $pastWindowStart = now()->subDays(3)->toDateString();
        $futureWindowEnd = now()->addDays(3)->toDateString();

        $recentArrivals = HotelBooking::query()
            ->where('business_id', $business->id)
            ->whereBetween('check_in_date', [$pastWindowStart, today()->subDay()->toDateString()])
            ->whereIn('status', ['reserved', 'checked_in', 'checked_out'])
            ->count();

        $upcomingArrivals = HotelBooking::query()
            ->where('business_id', $business->id)
            ->whereBetween('check_in_date', [today()->toDateString(), $futureWindowEnd])
            ->whereIn('status', ['reserved', 'checked_in'])
            ->count();

        $futureOccupancyRate = round(($upcomingArrivals / max($sellableRooms * 3, 1)) * 100, 1);
        $active = $recentArrivals >= 2 && $upcomingArrivals < $recentArrivals && $futureOccupancyRate < 45;

        $this->syncInsight(
            $business->id,
            'hotel_occupancy_pacing',
            $active,
            [
                'severity' => $futureOccupancyRate < 25 ? 'warning' : 'info',
                'title' => 'Upcoming occupancy is pacing below recent demand',
                'description' => $active
                    ? "Only {$upcomingArrivals} arrivals are booked for the next 3 days versus {$recentArrivals} in the last 3 days, with forward occupancy at {$futureOccupancyRate}%."
                    : null,
                'recommendation' => $active
                    ? 'Push direct bookings now, review OTA pricing, and unblock any sellable rooms before the next check-in cycle loses momentum.'
                    : null,
                'data' => [
                    'sellable_rooms' => $sellableRooms,
                    'recent_arrivals' => $recentArrivals,
                    'upcoming_arrivals' => $upcomingArrivals,
                    'future_occupancy_rate' => $futureOccupancyRate,
                ],
            ]
        );
    }

    private function checkFuelVariancePressure(Business $business): void
    {
        if ($business->business_type !== 'fuel_business') {
            $this->clearInsight($business->id, 'fuel_variance_pressure');

            return;
        }

        $openAlerts = FuelVarianceAlert::where('business_id', $business->id)
            ->where('is_resolved', false)
            ->count();

        $this->syncInsight(
            $business->id,
            'fuel_variance_pressure',
            $openAlerts > 0,
            [
                'severity' => $openAlerts > 1 ? 'critical' : 'warning',
                'title' => 'Wet-stock variance needs review',
                'description' => "{$openAlerts} open variance alerts may indicate nozzle leakage, dip errors, or possible theft exposure.",
                'recommendation' => 'Review meter readings, tank dips, and attendant shifts immediately before losses compound.',
                'data' => ['open_alerts' => $openAlerts],
            ]
        );
    }

    private function checkFuelShrinkageRiskScore(Business $business): void
    {
        if ($business->business_type !== 'fuel_business') {
            $this->clearInsight($business->id, 'fuel_shrinkage_risk_score');

            return;
        }

        $recentAlerts = FuelVarianceAlert::query()
            ->where('business_id', $business->id)
            ->where('is_resolved', false)
            ->where('detected_at', '>=', now()->subDays(7))
            ->get();

        $riskScore = round($recentAlerts->sum(function (FuelVarianceAlert $alert) {
            $severityWeight = match ($alert->severity) {
                'critical' => 30,
                'warning' => 18,
                default => 8,
            };

            $threshold = max((float) $alert->threshold_value, 1.0);
            $varianceRatio = abs((float) $alert->metric_value) / $threshold;

            return $severityWeight + min($varianceRatio * 15, 35);
        }), 1);

        $active = $riskScore >= 35;

        $this->syncInsight(
            $business->id,
            'fuel_shrinkage_risk_score',
            $active,
            [
                'severity' => $riskScore >= 70 ? 'critical' : 'warning',
                'title' => 'Fuel shrinkage risk is climbing',
                'description' => $active
                    ? "Unresolved variance patterns now score {$riskScore}, suggesting leakage, dip inconsistency, or theft exposure may be worsening."
                    : null,
                'recommendation' => $active
                    ? 'Audit the highest-variance pumps first, verify dip routines, and isolate shifts linked to repeated shortage patterns before losses compound.'
                    : null,
                'data' => [
                    'risk_score' => $riskScore,
                    'open_alerts' => $recentAlerts->count(),
                    'critical_alerts' => $recentAlerts->where('severity', 'critical')->count(),
                ],
            ]
        );
    }

    private function checkSchoolFeeDefaultWarning(Business $business): void
    {
        if ($business->business_type !== 'school') {
            $this->clearInsight($business->id, 'school_fee_default_warning');

            return;
        }

        $students = DB::table('student_records')
            ->where('business_id', $business->id)
            ->count();

        if ($students === 0) {
            $this->clearInsight($business->id, 'school_fee_default_warning');

            return;
        }

        $feeAssigned = (float) DB::table('student_enrollments')
            ->join('school_fee_structures', function ($join) {
                $join->on('school_fee_structures.school_classroom_id', '=', 'student_enrollments.school_classroom_id')
                    ->on('school_fee_structures.academic_term_id', '=', 'student_enrollments.academic_term_id');
            })
            ->where('student_enrollments.business_id', $business->id)
            ->selectRaw('SUM(COALESCE(school_fee_structures.amount, 0) - COALESCE(school_fee_structures.discount_amount, 0) - COALESCE(school_fee_structures.scholarship_amount, 0)) as assigned_total')
            ->value('assigned_total') ?? 0;

        $feeCollected = (float) DB::table('school_fee_payments')
            ->where('business_id', $business->id)
            ->sum('amount_paid');

        $outstanding = max($feeAssigned - $feeCollected, 0);
        $defaultRatio = $feeAssigned > 0 ? round(($outstanding / $feeAssigned) * 100, 1) : 0.0;
        $active = $outstanding > 0 && $defaultRatio >= 25;

        $this->syncInsight(
            $business->id,
            'school_fee_default_warning',
            $active,
            [
                'severity' => $defaultRatio >= 45 ? 'critical' : 'warning',
                'title' => 'Fee-default pressure is building',
                'description' => $active
                    ? "Outstanding school fees now stand at NGN " . number_format($outstanding, 2) . ", which is {$defaultRatio}% of expected fee value for current enrollments."
                    : null,
                'recommendation' => $active
                    ? 'Prioritize debtor follow-up by classroom, remind parents before the next assessment cycle, and tighten discretionary discounts until collections improve.'
                    : null,
                'data' => [
                    'students' => $students,
                    'assigned_total' => round($feeAssigned, 2),
                    'collected_total' => round($feeCollected, 2),
                    'outstanding_total' => round($outstanding, 2),
                    'default_ratio_percent' => $defaultRatio,
                ],
            ]
        );
    }

    private function checkAgroSeasonalStockPlanning(Business $business): void
    {
        if ($business->business_type !== 'agro_dealer') {
            $this->clearInsight($business->id, 'agro_seasonal_stock_planning');

            return;
        }

        $atRiskForecasts = AgroSeasonalForecast::query()
            ->where('business_id', $business->id)
            ->get()
            ->map(function (AgroSeasonalForecast $forecast) use ($business) {
                $currentStock = (float) InventoryItem::query()
                    ->where('business_id', $business->id)
                    ->where('product_id', $forecast->product_id)
                    ->sum('quantity');

                $required = max((float) $forecast->forecast_quantity - (float) $forecast->reserved_quantity, 0);
                $coverage = $required > 0 ? round(($currentStock / $required) * 100, 1) : 100.0;

                return [
                    'product_id' => $forecast->product_id,
                    'region_name' => $forecast->region_name,
                    'season_name' => $forecast->season_name,
                    'required_quantity' => round($required, 2),
                    'current_stock' => round($currentStock, 2),
                    'coverage_percent' => $coverage,
                ];
            })
            ->filter(fn (array $forecast) => $forecast['required_quantity'] > 0 && $forecast['coverage_percent'] < 80)
            ->sortBy('coverage_percent')
            ->take(5)
            ->values();

        $active = $atRiskForecasts->isNotEmpty();

        $this->syncInsight(
            $business->id,
            'agro_seasonal_stock_planning',
            $active,
            [
                'severity' => $atRiskForecasts->contains(fn (array $forecast) => $forecast['coverage_percent'] < 50) ? 'critical' : 'warning',
                'title' => 'Seasonal agro demand may outrun planned stock',
                'description' => $active
                    ? sprintf('%d regional seasonal forecasts show supply cover below 80%% after reserved allocations.', $atRiskForecasts->count())
                    : null,
                'recommendation' => $active
                    ? 'Lock supplier commitments early for the weakest-covered regions so subsidy and peak planting demand do not trigger avoidable stockouts.'
                    : null,
                'data' => [
                    'forecasts' => $atRiskForecasts->all(),
                ],
            ]
        );
    }

    private function checkLivestockHealthProductivityWarning(Business $business): void
    {
        if ($business->business_type !== 'livestock') {
            $this->clearInsight($business->id, 'livestock_health_productivity_warning');

            return;
        }

        $recentDiseaseBurden = (int) LivestockDiseaseLog::query()
            ->join('livestock_animal_groups', 'livestock_animal_groups.id', '=', 'livestock_disease_logs.animal_group_id')
            ->where('livestock_disease_logs.business_id', $business->id)
            ->whereDate('recorded_on', '>=', now()->subDays(14))
            ->sum('affected_count');

        $milkLogs = LivestockMilkLog::query()
            ->where('business_id', $business->id)
            ->orderByDesc('recorded_on')
            ->take(2)
            ->get()
            ->values();

        $milkDecline = false;
        if ($milkLogs->count() === 2) {
            $latestMilk = (float) $milkLogs[0]->litres;
            $priorMilk = max((float) $milkLogs[1]->litres, 0.01);
            $milkDecline = (($latestMilk - $priorMilk) / $priorMilk) <= -0.15;
        }

        $weightLogs = LivestockWeightLog::query()
            ->where('business_id', $business->id)
            ->orderByDesc('weighed_at')
            ->take(2)
            ->get()
            ->values();

        $weightDecline = false;
        if ($weightLogs->count() === 2) {
            $latestWeight = (float) $weightLogs[0]->weight_kg;
            $priorWeight = max((float) $weightLogs[1]->weight_kg, 0.01);
            $weightDecline = (($latestWeight - $priorWeight) / $priorWeight) <= -0.08;
        }

        $active = $recentDiseaseBurden > 0 || $milkDecline || $weightDecline;

        $this->syncInsight(
            $business->id,
            'livestock_health_productivity_warning',
            $active,
            [
                'severity' => $recentDiseaseBurden >= 3 || ($milkDecline && $weightDecline) ? 'critical' : 'warning',
                'title' => 'Livestock health issues may be eroding productivity',
                'description' => $active
                    ? "Recent disease burden is {$recentDiseaseBurden} affected animals, while milk or weight trend is showing early productivity weakness."
                    : null,
                'recommendation' => $active
                    ? 'Review treatment response, isolate affected groups where needed, and compare feed plus health costs against the recent drop in output.'
                    : null,
                'data' => [
                    'affected_animals' => $recentDiseaseBurden,
                    'milk_decline' => $milkDecline,
                    'weight_decline' => $weightDecline,
                ],
            ]
        );
    }

    private function checkMobileAgentFraudPressure(Business $business): void
    {
        if ($business->business_type !== 'mobile_agent') {
            $this->clearInsight($business->id, 'mobile_agent_fraud_pressure');

            return;
        }

        $openFraudAlerts = MobileAgentFraudAlert::where('business_id', $business->id)
            ->where('is_resolved', false)
            ->count();

        $this->syncInsight(
            $business->id,
            'mobile_agent_fraud_pressure',
            $openFraudAlerts > 0,
            [
                'severity' => $openFraudAlerts > 2 ? 'critical' : 'warning',
                'title' => 'Agent fraud signals need action',
                'description' => "{$openFraudAlerts} unresolved fraud alerts can turn into float loss, customer disputes, or reversals exposure.",
                'recommendation' => 'Investigate flagged transactions, lock repeat offenders where necessary, and reconcile float before close of business.',
                'data' => ['open_fraud_alerts' => $openFraudAlerts],
            ]
        );
    }

    private function checkLogisticsMaintenancePressure(Business $business): void
    {
        if ($business->business_type !== 'logistics') {
            $this->clearInsight($business->id, 'logistics_maintenance_pressure');

            return;
        }

        $openMaintenance = LogisticsMaintenanceLog::where('business_id', $business->id)
            ->where('status', '!=', 'resolved')
            ->count();

        $this->syncInsight(
            $business->id,
            'logistics_maintenance_pressure',
            $openMaintenance > 0,
            [
                'severity' => $openMaintenance > 2 ? 'warning' : 'info',
                'title' => 'Fleet maintenance backlog is growing',
                'description' => "{$openMaintenance} maintenance items remain unresolved, which can trigger trip delays and higher operating cost.",
                'recommendation' => 'Clear the most urgent vehicles first and compare downtime cost against immediate repair spend.',
                'data' => ['open_maintenance_logs' => $openMaintenance],
            ]
        );
    }

    private function checkProductionCostSpikeForecast(Business $business): void
    {
        if ($business->business_type !== 'pure_water_factory') {
            $this->clearInsight($business->id, 'production_cost_spike_forecast');

            return;
        }

        $recentBatches = ProductionBatch::query()
            ->where('business_id', $business->id)
            ->whereDate('production_date', '>=', now()->subDays(14))
            ->latest('production_date')
            ->take(4)
            ->get();

        if ($recentBatches->count() < 3) {
            $this->clearInsight($business->id, 'production_cost_spike_forecast');

            return;
        }

        $latestBatch = $recentBatches->first();
        $baselineBatches = $recentBatches->slice(1);

        $latestUnitCost = (float) $latestBatch->total_batch_cost / max((float) $latestBatch->total_output_quantity, 1);
        $baselineUnitCost = (float) $baselineBatches->avg(fn (ProductionBatch $batch) => (float) $batch->total_batch_cost / max((float) $batch->total_output_quantity, 1));
        $latestEnergyPackagingCost = (float) $latestBatch->electricity_cost + (float) $latestBatch->generator_fuel_cost + (float) $latestBatch->packaging_cost_total;
        $baselineEnergyPackagingCost = (float) $baselineBatches->avg(fn (ProductionBatch $batch) => (float) $batch->electricity_cost + (float) $batch->generator_fuel_cost + (float) $batch->packaging_cost_total);
        $unitCostChange = $baselineUnitCost > 0 ? round((($latestUnitCost - $baselineUnitCost) / $baselineUnitCost) * 100, 1) : 0.0;
        $energyPackagingChange = $baselineEnergyPackagingCost > 0 ? round((($latestEnergyPackagingCost - $baselineEnergyPackagingCost) / $baselineEnergyPackagingCost) * 100, 1) : 0.0;
        $active = $unitCostChange >= 15 || $energyPackagingChange >= 20;

        $this->syncInsight(
            $business->id,
            'production_cost_spike_forecast',
            $active,
            [
                'severity' => $unitCostChange >= 25 || $energyPackagingChange >= 30 ? 'critical' : 'warning',
                'title' => 'Factory cost pressure is spiking faster than normal',
                'description' => $active
                    ? "Latest batch unit cost is up {$unitCostChange}% and energy plus packaging spend is up {$energyPackagingChange}% against recent batches."
                    : null,
                'recommendation' => $active
                    ? 'Review generator runtime, packaging wastage, and electricity mix before the next batch locks in a weaker margin.'
                    : null,
                'data' => [
                    'latest_batch_number' => $latestBatch->batch_number,
                    'latest_unit_cost' => round($latestUnitCost, 2),
                    'baseline_unit_cost' => round($baselineUnitCost, 2),
                    'unit_cost_change_percent' => $unitCostChange,
                    'energy_packaging_change_percent' => $energyPackagingChange,
                ],
            ]
        );
    }

    private function checkConstructionMarginPressure(Business $business): void
    {
        if ($business->business_type !== 'construction') {
            $this->clearInsight($business->id, 'construction_margin_pressure');

            return;
        }

        $recentQuotedItems = ConstructionQuotationItem::query()
            ->join('construction_quotations', 'construction_quotations.id', '=', 'construction_quotation_items.quotation_id')
            ->join('products', 'products.id', '=', 'construction_quotation_items.product_id')
            ->where('construction_quotations.business_id', $business->id)
            ->where('construction_quotations.created_at', '>=', now()->subDays(14))
            ->selectRaw('
                construction_quotation_items.id,
                construction_quotation_items.item_name,
                construction_quotation_items.unit_price,
                products.cost_price
            ')
            ->get()
            ->map(function ($item) {
                $costPrice = max((float) $item->cost_price, 0.01);
                $unitPrice = (float) $item->unit_price;
                $marginPercent = round((($unitPrice - $costPrice) / $costPrice) * 100, 1);

                return [
                    'item_name' => $item->item_name,
                    'unit_price' => round($unitPrice, 2),
                    'cost_price' => round($costPrice, 2),
                    'margin_percent' => $marginPercent,
                ];
            })
            ->filter(fn (array $item) => $item['margin_percent'] <= 12)
            ->sortBy('margin_percent')
            ->take(5)
            ->values();

        $active = $recentQuotedItems->isNotEmpty();

        $this->syncInsight(
            $business->id,
            'construction_margin_pressure',
            $active,
            [
                'severity' => $recentQuotedItems->contains(fn (array $item) => $item['margin_percent'] <= 5) ? 'critical' : 'warning',
                'title' => 'Quoted building-material margins are getting thin',
                'description' => $active
                    ? sprintf('%d recently quoted building-material lines are running at margin levels that may not absorb haulage, breakage, or price movement.', $recentQuotedItems->count())
                    : null,
                'recommendation' => $active
                    ? 'Review contractor pricing, delivery charges, and current supplier landed cost before converting more low-margin quotes into orders.'
                    : null,
                'data' => [
                    'items' => $recentQuotedItems->all(),
                ],
            ]
        );
    }

    private function checkRestaurantMarginWasteForecast(Business $business): void
    {
        if ($business->business_type !== 'restaurant') {
            $this->clearInsight($business->id, 'restaurant_margin_waste_forecast');

            return;
        }

        $recentTickets = RestaurantTicket::query()
            ->where('business_id', $business->id)
            ->where('opened_at', '>=', now()->subDays(7))
            ->get();

        $atRiskTickets = $recentTickets->filter(function (RestaurantTicket $ticket) {
            $subtotal = max((float) $ticket->subtotal, 0.01);
            $wasteRatio = ((float) $ticket->waste_cost_total / $subtotal) * 100;
            $marginRatio = ((float) $ticket->gross_margin / $subtotal) * 100;

            return $wasteRatio >= 8 || $marginRatio <= 35;
        });

        $averageWasteRatio = round($atRiskTickets->avg(function (RestaurantTicket $ticket) {
            $subtotal = max((float) $ticket->subtotal, 0.01);

            return ((float) $ticket->waste_cost_total / $subtotal) * 100;
        }) ?? 0, 1);

        $active = $atRiskTickets->isNotEmpty();

        $this->syncInsight(
            $business->id,
            'restaurant_margin_waste_forecast',
            $active,
            [
                'severity' => $averageWasteRatio >= 12 ? 'warning' : 'info',
                'title' => 'Kitchen waste and menu margin are starting to squeeze profit',
                'description' => $active
                    ? "{$atRiskTickets->count()} recent tickets show weak gross margin or elevated waste cost, which can quietly erode daily kitchen profit."
                    : null,
                'recommendation' => $active
                    ? 'Review portion control, recipe costing, and the worst-performing menu lines before waste patterns harden into permanent margin loss.'
                    : null,
                'data' => [
                    'tickets_at_risk' => $atRiskTickets->count(),
                    'average_waste_ratio_percent' => $averageWasteRatio,
                ],
            ]
        );
    }

    private function checkTrustRepaymentRisk(int $businessId): void
    {
        $riskyAccounts = TrustAccount::query()
            ->where('business_id', $businessId)
            ->where('account_type', 'credit')
            ->where('status', 'active')
            ->where('balance', '>', 0)
            ->get()
            ->filter(function (TrustAccount $account) {
                $limit = max((float) $account->limit, 0.01);
                $utilization = ((float) $account->balance / $limit) * 100;

                return $utilization >= 70 && $account->last_payment_date && $account->last_payment_date->lt(now()->subDays(14));
            })
            ->take(5)
            ->values();

        $active = $riskyAccounts->isNotEmpty();

        $this->syncInsight(
            $businessId,
            'trust_repayment_risk',
            $active,
            [
                'severity' => 'warning',
                'title' => 'Some trust or credit accounts look repayment-risky',
                'description' => $active
                    ? sprintf('%d credit accounts are highly utilized and have not shown recent repayment activity.', $riskyAccounts->count())
                    : null,
                'recommendation' => $active
                    ? 'Pause new exposure for these accounts, push collections, and review repayment discipline before balances grow further.'
                    : null,
                'data' => [
                    'accounts' => $riskyAccounts->map(fn (TrustAccount $account) => [
                        'id' => $account->id,
                        'customer_id' => $account->customer_id,
                        'balance' => (float) $account->balance,
                        'limit' => (float) $account->limit,
                        'last_payment_date' => $account->last_payment_date?->toDateString(),
                    ])->all(),
                ],
            ]
        );
    }

    private function checkCreditDefaultForecast(int $businessId): void
    {
        $forecastAccounts = TrustAccount::query()
            ->where('business_id', $businessId)
            ->where('account_type', 'credit')
            ->where('status', 'active')
            ->where('balance', '>', 0)
            ->get()
            ->filter(function (TrustAccount $account) {
                $limit = max((float) $account->limit, 0.01);
                $utilization = ((float) $account->balance / $limit) * 100;

                return $utilization >= 80 && $account->last_payment_date && $account->last_payment_date->lt(now()->subDays(21));
            })
            ->take(5)
            ->values();

        $active = $forecastAccounts->isNotEmpty();

        $this->syncInsight(
            $businessId,
            'credit_default_forecast',
            $active,
            [
                'severity' => $forecastAccounts->count() >= 2 ? 'critical' : 'warning',
                'title' => 'Some credit accounts are drifting toward default',
                'description' => $active
                    ? sprintf('%d active credit accounts are highly utilized and have gone 21+ days without repayment activity.', $forecastAccounts->count())
                    : null,
                'recommendation' => $active
                    ? 'Push collections now, require part-payment before fresh supply, and review guarantor or escalation options for repeat offenders.'
                    : null,
                'data' => [
                    'accounts' => $forecastAccounts->map(fn (TrustAccount $account) => [
                        'id' => $account->id,
                        'customer_id' => $account->customer_id,
                        'balance' => (float) $account->balance,
                        'limit' => (float) $account->limit,
                        'last_payment_date' => $account->last_payment_date?->toDateString(),
                    ])->all(),
                ],
            ]
        );
    }

    private function checkAdasheCollectionSlippage(int $businessId): void
    {
        $slippingAccounts = TrustAccount::query()
            ->where('business_id', $businessId)
            ->where('account_type', 'contribution')
            ->where('status', 'active')
            ->where('balance', '>', 0)
            ->get()
            ->filter(function (TrustAccount $account) {
                $target = max((float) $account->limit, 0.01);
                $fundedPercent = ((float) $account->balance / $target) * 100;

                return $fundedPercent < 60
                    && $account->last_payment_date
                    && $account->last_payment_date->lt(now()->subDays(7));
            })
            ->take(5)
            ->values();

        $active = $slippingAccounts->isNotEmpty();

        $this->syncInsight(
            $businessId,
            'adashe_collection_slippage',
            $active,
            [
                'severity' => $slippingAccounts->count() >= 2 ? 'warning' : 'info',
                'title' => 'Some adashe members are falling behind on contributions',
                'description' => $active
                    ? sprintf('%d contribution accounts are still below 60%% funded and have gone more than 7 days without a fresh collection.', $slippingAccounts->count())
                    : null,
                'recommendation' => $active
                    ? 'Follow up these members today, confirm the next contribution date, and protect the payout cycle before collection gaps widen.'
                    : null,
                'data' => [
                    'accounts' => $slippingAccounts->map(fn (TrustAccount $account) => [
                        'id' => $account->id,
                        'customer_id' => $account->customer_id,
                        'balance' => (float) $account->balance,
                        'target' => (float) $account->limit,
                        'funded_percent' => round((((float) $account->balance / max((float) $account->limit, 0.01)) * 100), 1),
                        'last_payment_date' => $account->last_payment_date?->toDateString(),
                    ])->all(),
                ],
            ]
        );
    }

    private function checkAdasheDueCollectionPressure(int $businessId): void
    {
        $dueAccounts = TrustAccount::query()
            ->where('business_id', $businessId)
            ->where('account_type', 'contribution')
            ->where('status', 'active')
            ->whereNotNull('next_due_date')
            ->get()
            ->filter(function (TrustAccount $account) {
                return $account->next_due_date
                    && (float) $account->balance < (float) $account->limit
                    && $account->next_due_date->lte(now()->addDays(2)->startOfDay());
            })
            ->map(function (TrustAccount $account) {
                $isOverdue = $account->next_due_date && $account->next_due_date->lt(now()->startOfDay());

                return [
                    'id' => $account->id,
                    'customer_id' => $account->customer_id,
                    'cycle_name' => $account->cycle_name,
                    'balance' => (float) $account->balance,
                    'target' => (float) $account->limit,
                    'installment_amount' => (float) ($account->installment_amount ?? 0),
                    'next_due_date' => $account->next_due_date?->toDateString(),
                    'status' => $isOverdue ? 'overdue' : 'due_soon',
                ];
            })
            ->take(5)
            ->values();

        $active = $dueAccounts->isNotEmpty();
        $overdueCount = $dueAccounts->where('status', 'overdue')->count();

        $this->syncInsight(
            $businessId,
            'adashe_due_collection_pressure',
            $active,
            [
                'severity' => $overdueCount > 0 ? 'warning' : 'info',
                'title' => 'Some adashe contributions are due now',
                'description' => $active
                    ? $overdueCount > 0
                        ? sprintf('%d contribution accounts are already overdue for collection, which can disrupt payout timing for the cycle.', $overdueCount)
                        : sprintf('%d contribution accounts are due within the next 2 days and need collection planning.', $dueAccounts->count())
                    : null,
                'recommendation' => $active
                    ? 'Call the due members, schedule the collection route, and clear overdue collections before confirming the next payout window.'
                    : null,
                'data' => [
                    'accounts' => $dueAccounts->all(),
                    'overdue_count' => $overdueCount,
                ],
            ]
        );
    }

    private function checkCooperativeFinancingApprovalDrag(int $businessId): void
    {
        $pendingFinancing = CooperativeFinancing::query()
            ->where('business_id', $businessId)
            ->whereIn('status', ['pending_guarantor_approval', 'pending_admin_approval'])
            ->where('created_at', '<=', now()->subDays(2))
            ->with('member.customer')
            ->orderBy('created_at')
            ->take(5)
            ->get();

        $active = $pendingFinancing->isNotEmpty();

        $this->syncInsight(
            $businessId,
            'cooperative_financing_approval_drag',
            $active,
            [
                'severity' => $pendingFinancing->contains(fn (CooperativeFinancing $item) => $item->status === 'pending_admin_approval')
                    ? 'warning'
                    : 'info',
                'title' => 'Some cooperative financing requests are stuck in approval flow',
                'description' => $active
                    ? sprintf('%d cooperative financing requests have waited more than 2 days for guarantor or admin action.', $pendingFinancing->count())
                    : null,
                'recommendation' => $active
                    ? 'Clear the oldest approval items today so treasury commitments and member trust do not stall.'
                    : null,
                'data' => [
                    'requests' => $pendingFinancing->map(fn (CooperativeFinancing $item) => [
                        'id' => $item->id,
                        'member' => $item->member?->customer?->name,
                        'status' => $item->status,
                        'financing_type' => $item->financing_type,
                        'amount_requested' => (float) ($item->amount_requested ?? 0),
                        'submitted_at' => optional($item->submitted_at)->toDateString(),
                    ])->all(),
                ],
            ]
        );
    }

    private function checkCooperativeProfitDistributionReadiness(int $businessId): void
    {
        $cooperative = Cooperative::query()
            ->where('business_id', $businessId)
            ->first();

        if (! $cooperative) {
            $this->clearInsight($businessId, 'cooperative_profit_distribution_readiness');

            return;
        }

        $cycle = CooperativeProfitCycle::query()
            ->where('cooperative_id', $cooperative->id)
            ->whereIn('status', ['approved', 'draft'])
            ->where('distributable_profit', '>', 0)
            ->orderByDesc('cycle_end')
            ->first();

        $active = (bool) $cycle;

        $this->syncInsight(
            $businessId,
            'cooperative_profit_distribution_readiness',
            $active,
            [
                'severity' => $cycle && $cycle->cycle_end && $cycle->cycle_end->lt(now()->subDays(7))
                    ? 'warning'
                    : 'info',
                'title' => 'A cooperative profit cycle looks ready for distribution review',
                'description' => $active
                    ? sprintf(
                        'The %s cycle has %s ready for allocation and is still marked %s.',
                        $cycle->label,
                        number_format((float) $cycle->distributable_profit, 2),
                        $cycle->status
                    )
                    : null,
                'recommendation' => $active
                    ? 'Review the cycle, confirm reserve and charity allocations, and distribute member profit if governance approval is complete.'
                    : null,
                'data' => [
                    'cycle_id' => $cycle?->id,
                    'label' => $cycle?->label,
                    'cycle_end' => optional($cycle?->cycle_end)->toDateString(),
                    'distributable_profit' => (float) ($cycle?->distributable_profit ?? 0),
                    'status' => $cycle?->status,
                ],
            ]
        );
    }

    private function syncInsight(int $businessId, string $type, bool $active, array $payload): void
    {
        if (! $active) {
            $this->clearInsight($businessId, $type);

            return;
        }

        $insight = AiInsight::firstOrNew([
            'business_id' => $businessId,
            'type' => $type,
        ]);

        $insight->fill([
            'severity' => $payload['severity'],
            'title' => $payload['title'],
            'description' => $payload['description'],
            'recommendation' => $payload['recommendation'] ?? null,
            'data' => $payload['data'] ?? null,
        ]);

        if (! $insight->exists) {
            $insight->is_read = false;
            $insight->is_dismissed = false;
        }

        $insight->save();
    }

    private function clearInsight(int $businessId, string $type): void
    {
        AiInsight::where('business_id', $businessId)
            ->where('type', $type)
            ->delete();
    }

    private function findInsightOrFail(int $businessId, int $insightId): AiInsight
    {
        $insight = AiInsight::where('business_id', $businessId)
            ->where('id', $insightId)
            ->first();

        if (! $insight) {
            throw new ModelNotFoundException('Insight not found for current business.');
        }

        return $insight;
    }

    private function buildInsightGroups(Collection $insights): array
    {
        $definitions = [
            'cash' => 'Cash',
            'stock' => 'Stock',
            'operations' => 'Operations',
            'risk' => 'Risk',
        ];

        return collect($definitions)->map(function (string $label, string $key) use ($insights) {
            $items = $insights
                ->filter(fn (AiInsight $insight) => $this->groupKeyForInsight($insight->type) === $key)
                ->values();

            return [
                'key' => $key,
                'label' => $label,
                'count' => $items->count(),
                'unread' => $items->where('is_read', false)->count(),
                'critical' => $items->where('severity', 'critical')->count(),
                'actionable' => $items->filter(fn (AiInsight $insight) => ! empty($insight->recommendation))->count(),
                'items' => $items->take(4)->map(fn (AiInsight $insight) => [
                    'id' => $insight->id,
                    'type' => $insight->type,
                    'severity' => $insight->severity,
                    'title' => $insight->title,
                    'description' => $insight->description,
                    'recommendation' => $insight->recommendation,
                    'is_read' => $insight->is_read,
                    'updated_at' => $insight->updated_at,
                    'data' => $insight->data,
                ])->all(),
            ];
        })->values()->all();
    }

    private function groupKeyForInsight(string $type): string
    {
        if (str_starts_with($type, 'demo_cash_')) {
            return 'cash';
        }

        if (str_starts_with($type, 'demo_stock_')) {
            return 'stock';
        }

        if (str_starts_with($type, 'demo_operations_')) {
            return 'operations';
        }

        if (str_starts_with($type, 'demo_risk_')) {
            return 'risk';
        }

        $cashTypes = [
            'credit_collection_pressure',
            'customer_concentration_risk',
            'trust_repayment_risk',
            'adashe_collection_slippage',
            'adashe_due_collection_pressure',
            'credit_default_forecast',
            'debtor_followup_priority',
            'delivery_cod_exposure_forecast',
            'school_fee_default_warning',
            'construction_margin_pressure',
            'wholesale_route_profitability_forecast',
            'restaurant_margin_waste_forecast',
            'production_cost_spike_forecast',
            'production_margin_erosion',
            'cooperative_profit_distribution_readiness',
        ];

        $stockTypes = [
            'low_stock_watch',
            'slow_moving_stock',
            'stockout_forecast',
            'reorder_window_forecast',
            'pharmacy_expiry_pressure',
            'pharmacy_demand_expiry_imbalance',
            'pharmacy_demand_forecast',
            'agro_seasonal_stock_planning',
        ];

        $operationsTypes = [
            'branch_performance_gap',
            'delivery_slowdown_forecast',
            'hotel_room_readiness',
            'hotel_occupancy_pacing',
            'production_efficiency_pressure',
            'logistics_maintenance_pressure',
            'cooperative_financing_approval_drag',
        ];

        if (in_array($type, $cashTypes, true)) {
            return 'cash';
        }

        if (in_array($type, $stockTypes, true)) {
            return 'stock';
        }

        if (in_array($type, $operationsTypes, true)) {
            return 'operations';
        }

        return 'risk';
    }
}
