<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Explicit date_from/date_to always win. Otherwise resolves the
     * frontend's period selector (today/week/month/year - see
     * frontend/src/lib/reports.js's reportPeriodOptions) into a concrete
     * date range, defaulting to 'today' to match the page's initial state.
     * Every report endpoint funnels through this so switching periods on
     * the Reports page actually changes what's returned, instead of the
     * param being silently ignored.
     */
    private function resolvePeriodRange(Request $request): array
    {
        if ($request->date_from || $request->date_to) {
            return [
                $request->date_from ?? now()->subYears(5)->toDateString(),
                $request->date_to ?? now()->toDateString(),
            ];
        }

        $today = now();

        return match ($request->string('period')->toString()) {
            'week' => [$today->copy()->startOfWeek()->toDateString(), $today->copy()->toDateString()],
            'month' => [$today->copy()->startOfMonth()->toDateString(), $today->copy()->toDateString()],
            'year' => [$today->copy()->startOfYear()->toDateString(), $today->copy()->toDateString()],
            default => [$today->copy()->toDateString(), $today->copy()->toDateString()],
        };
    }

    public function sales(Request $request)
    {
        $businessId = $request->user()->current_business_id;
        [$startDate, $endDate] = $this->resolvePeriodRange($request);

        $query = DB::table('orders')
            ->where('business_id', $businessId)
            ->where('order_type', 'sale')
            ->where('status', 'completed')
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate);

        $summary = (clone $query)->selectRaw('
            COUNT(*) as total_orders,
            SUM(total) as revenue,
            SUM(paid) as collected,
            SUM(total - paid) as outstanding
        ')->first();

        $byDay = (clone $query)
            ->selectRaw('DATE(created_at) as date, COUNT(*) as orders, SUM(total) as revenue')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $byPayment = (clone $query)
            ->selectRaw('payment_method, COUNT(*) as count, SUM(total) as total')
            ->groupBy('payment_method')
            ->get();

        return response()->json([
            'summary' => $summary,
            'by_day' => $byDay,
            'by_payment_method' => $byPayment,
        ]);
    }

    public function inventory(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $lowStock = DB::table('inventory_items')
            ->join('products', 'inventory_items.product_id', '=', 'products.id')
            ->join('warehouses', 'inventory_items.warehouse_id', '=', 'warehouses.id')
            ->where('inventory_items.business_id', $businessId)
            ->whereRaw('inventory_items.quantity <= products.low_stock_alert')
            ->selectRaw('products.name as product, warehouses.name as warehouse, inventory_items.quantity')
            ->get();

        $byWarehouse = DB::table('inventory_items')
            ->join('warehouses', 'inventory_items.warehouse_id', '=', 'warehouses.id')
            ->where('inventory_items.business_id', $businessId)
            ->groupBy('warehouses.id')
            ->selectRaw('warehouses.name, SUM(inventory_items.quantity) as total_items')
            ->get();

        $movements = DB::table('inventory_movements')
            ->where('business_id', $businessId)
            ->whereDate('created_at', '>=', now()->subDays(30))
            ->selectRaw('movement_type, COUNT(*) as count, SUM(ABS(quantity)) as total_qty')
            ->groupBy('movement_type')
            ->get();

        return response()->json([
            'low_stock' => $lowStock,
            'by_warehouse' => $byWarehouse,
            'movements' => $movements,
        ]);
    }

    public function expenses(Request $request)
    {
        $businessId = $request->user()->current_business_id;
        [$startDate, $endDate] = $this->resolvePeriodRange($request);

        $query = DB::table('expenses')
            ->where('expenses.business_id', $businessId)
            ->whereDate('expense_date', '>=', $startDate)
            ->whereDate('expense_date', '<=', $endDate);

        $total = (clone $query)->sum('amount');

        $byCategory = (clone $query)
            ->join('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->groupBy('expense_categories.id')
            ->selectRaw('expense_categories.name, SUM(expenses.amount) as total')
            ->get();

        $byDay = (clone $query)
            ->selectRaw('expense_date as date, SUM(amount) as total')
            ->groupBy('expense_date')
            ->orderBy('expense_date')
            ->get();

        return response()->json([
            'total' => $total,
            'by_category' => $byCategory,
            'by_day' => $byDay,
        ]);
    }

    public function customers(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $topCustomers = DB::table('orders')
            ->join('customers', 'orders.customer_id', '=', 'customers.id')
            ->where('orders.business_id', $businessId)
            ->where('orders.order_type', 'sale')
            ->groupBy('customers.id')
            ->selectRaw('customers.name, COUNT(orders.id) as orders, SUM(orders.total) as total')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        $byType = DB::table('customers')
            ->where('business_id', $businessId)
            ->selectRaw('customer_type, COUNT(*) as count')
            ->groupBy('customer_type')
            ->get();

        return response()->json([
            'top_customers' => $topCustomers,
            'by_type' => $byType,
        ]);
    }

    public function profitLoss(Request $request)
    {
        $businessId = $request->user()->current_business_id;
        [$startDate, $endDate] = $this->resolvePeriodRange($request);

        $salesQuery = DB::table('orders')
            ->where('business_id', $businessId)
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->where('order_type', 'sale')
            ->where('status', 'completed');

        $sales = (clone $salesQuery)->sum('total');

        $cogs = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->leftJoin('product_variants', 'order_items.variant_id', '=', 'product_variants.id')
            ->where('orders.business_id', $businessId)
            ->whereDate('orders.created_at', '>=', $startDate)
            ->whereDate('orders.created_at', '<=', $endDate)
            ->where('orders.order_type', 'sale')
            ->where('orders.status', 'completed')
            ->sum(DB::raw('order_items.quantity * COALESCE(product_variants.cost_price, products.cost_price, 0)'));

        $expenses = DB::table('expenses')
            ->where('business_id', $businessId)
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->sum('amount');

        return response()->json([
            'period' => ['from' => $startDate, 'to' => $endDate],
            'revenue' => $sales,
            'cost_of_goods_sold' => $cogs,
            'expenses' => $expenses,
            'gross_profit' => $sales - $cogs,
            'net_profit' => $sales - $cogs - $expenses,
        ]);
    }
}
