<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\Order;
use App\Services\BusinessContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Aggregate, read-only view across every business the authenticated user
 * belongs to. Deliberately lightweight - unlike DashboardController, which
 * computes a deep per-vertical breakdown for one business, this fans out a
 * small set of universal metrics across all of the user's businesses, since
 * that shape has to stay cheap regardless of how many businesses a user has.
 *
 * Order/Customer queries below explicitly bypass the BelongsToBusiness global
 * scope (which only ever constrains to current_business_id) via an explicit
 * whereIn('business_id', ...) instead - this is safe because that id list
 * comes from BusinessContextService::summarizeBusinessesForUser(), which
 * already filters to businesses the user has an active membership on.
 */
class PortfolioController extends Controller
{
    public function __construct(private BusinessContextService $businessContextService)
    {
    }

    public function __invoke(Request $request)
    {
        $user = $request->user();
        $summaries = $this->businessContextService->summarizeBusinessesForUser($user);
        $businessIds = $summaries->pluck('id')->values();
        $today = today()->toDateString();

        if ($businessIds->isEmpty()) {
            return response()->json([
                'businesses' => [],
                'totals' => $this->emptyTotals(),
            ]);
        }

        $salesByBusiness = Order::query()
            ->withoutGlobalScope('business')
            ->whereIn('business_id', $businessIds)
            ->where('order_type', 'sale')
            ->whereDate('created_at', $today)
            ->selectRaw('business_id, COUNT(*) as order_count, COALESCE(SUM(total), 0) as total_sales')
            ->groupBy('business_id')
            ->get()
            ->keyBy('business_id');

        $customersByBusiness = Customer::query()
            ->withoutGlobalScope('business')
            ->whereIn('business_id', $businessIds)
            ->selectRaw('business_id, COUNT(*) as customers_count')
            ->groupBy('business_id')
            ->get()
            ->keyBy('business_id');

        $expensesByBusiness = Expense::query()
            ->whereIn('business_id', $businessIds)
            ->whereDate('expense_date', $today)
            ->selectRaw('business_id, COALESCE(SUM(amount), 0) as expenses_today')
            ->groupBy('business_id')
            ->get()
            ->keyBy('business_id');

        $staffByBusiness = DB::table('business_user')
            ->whereIn('business_id', $businessIds)
            ->selectRaw('business_id, COUNT(*) as staff_count')
            ->groupBy('business_id')
            ->get()
            ->keyBy('business_id');

        $lowStockByBusiness = DB::table('inventory_items')
            ->join('products', 'products.id', '=', 'inventory_items.product_id')
            ->whereIn('inventory_items.business_id', $businessIds)
            ->whereColumn('inventory_items.quantity', '<=', 'products.low_stock_alert')
            ->selectRaw('inventory_items.business_id as business_id, COUNT(*) as low_stock_count')
            ->groupBy('inventory_items.business_id')
            ->get()
            ->keyBy('business_id');

        $businesses = $summaries->map(function (array $summary) use (
            $salesByBusiness,
            $customersByBusiness,
            $expensesByBusiness,
            $staffByBusiness,
            $lowStockByBusiness,
        ) {
            $id = $summary['id'];

            $summary['stats'] = [
                'today_sales' => (float) ($salesByBusiness[$id]->total_sales ?? 0),
                'today_orders' => (int) ($salesByBusiness[$id]->order_count ?? 0),
                'customers_count' => (int) ($customersByBusiness[$id]->customers_count ?? 0),
                'expenses_today' => (float) ($expensesByBusiness[$id]->expenses_today ?? 0),
                'staff_count' => (int) ($staffByBusiness[$id]->staff_count ?? 0),
                'low_stock_count' => (int) ($lowStockByBusiness[$id]->low_stock_count ?? 0),
            ];

            return $summary;
        })->values();

        $totals = [
            'business_count' => $businesses->count(),
            'today_sales' => (float) $businesses->sum('stats.today_sales'),
            'today_orders' => (int) $businesses->sum('stats.today_orders'),
            'customers_count' => (int) $businesses->sum('stats.customers_count'),
            'expenses_today' => (float) $businesses->sum('stats.expenses_today'),
            'staff_count' => (int) $businesses->sum('stats.staff_count'),
            'low_stock_count' => (int) $businesses->sum('stats.low_stock_count'),
        ];

        return response()->json([
            'businesses' => $businesses,
            'totals' => $totals,
        ]);
    }

    private function emptyTotals(): array
    {
        return [
            'business_count' => 0,
            'today_sales' => 0,
            'today_orders' => 0,
            'customers_count' => 0,
            'expenses_today' => 0,
            'staff_count' => 0,
            'low_stock_count' => 0,
        ];
    }
}
