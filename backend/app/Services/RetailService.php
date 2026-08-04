<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\InventoryItem;
use App\Models\Order;
use App\Models\RetailCashierShift;
use App\Models\RetailLoyaltyProfile;
use App\Models\RetailOrderPayment;
use App\Models\RetailPettyCashEntry;
use App\Models\RetailRefund;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class RetailService
{
    public function __construct(
        private OrderService $orderService,
    ) {
    }

    public function overview(int $businessId): array
    {
        $today = today()->toDateString();
        $todaySales = Order::where('business_id', $businessId)
            ->where('order_type', 'sale')
            ->whereDate('created_at', $today)
            ->sum('total');

        $cashBalance = RetailCashierShift::where('business_id', $businessId)
            ->where('status', 'open')
            ->sum('opening_float');

        $pettyCashNet = RetailPettyCashEntry::where('business_id', $businessId)
            ->whereDate('recorded_at', $today)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN entry_type = 'funding' THEN amount ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN entry_type = 'spend' THEN amount ELSE 0 END), 0) as balance
            ")
            ->value('balance');

        return [
            'summary' => [
                'today_sales' => (float) $todaySales,
                'cash_balance' => (float) $cashBalance + (float) $pettyCashNet,
                'debtors' => (float) Customer::where('business_id', $businessId)->sum('balance'),
                'stock_alerts' => InventoryItem::query()
                    ->join('products', 'products.id', '=', 'inventory_items.product_id')
                    ->where('inventory_items.business_id', $businessId)
                    ->whereColumn('inventory_items.quantity', '<=', 'products.low_stock_alert')
                    ->count(),
                'open_shift_count' => RetailCashierShift::where('business_id', $businessId)->where('status', 'open')->count(),
                'loyalty_customers' => RetailLoyaltyProfile::where('business_id', $businessId)->count(),
                'pending_refunds' => RetailRefund::where('business_id', $businessId)->whereDate('refunded_at', $today)->count(),
            ],
            'open_shift' => RetailCashierShift::where('business_id', $businessId)->where('status', 'open')->latest('opened_at')->first(),
            'loyalty_customers' => RetailLoyaltyProfile::with('customer')->where('business_id', $businessId)->latest()->limit(8)->get(),
            'petty_cash_entries' => RetailPettyCashEntry::where('business_id', $businessId)->latest('recorded_at')->limit(8)->get(),
            'refunds' => RetailRefund::with('order')->where('business_id', $businessId)->latest('refunded_at')->limit(8)->get(),
            'recent_orders' => Order::with(['customer', 'payments'])->where('business_id', $businessId)->latest()->limit(10)->get(),
        ];
    }

    public function openShift(array $payload, int $businessId, ?int $branchId, int $userId): RetailCashierShift
    {
        return RetailCashierShift::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'opened_by' => $userId,
            'shift_code' => 'SHIFT-' . now()->format('YmdHis') . '-' . str()->upper(str()->random(3)),
            'status' => 'open',
            'opening_float' => $payload['opening_float'],
            'expected_cash' => $payload['opening_float'],
            'opened_at' => now(),
        ]);
    }

    public function closeShift(RetailCashierShift $shift, array $payload, int $businessId, int $userId): RetailCashierShift
    {
        abort_if($shift->business_id !== $businessId, 403);
        abort_if($shift->status !== 'open', 422, 'Shift is already closed.');

        $cashSales = $this->sumCashCollections($businessId, $shift->opened_at, now(), $shift->branch_id);
        $pettyCashNet = RetailPettyCashEntry::where('business_id', $businessId)
            ->whereBetween('recorded_at', [$shift->opened_at, now()])
            ->selectRaw("
                COALESCE(SUM(CASE WHEN entry_type = 'funding' THEN amount ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN entry_type = 'spend' THEN amount ELSE 0 END), 0) as balance
            ")
            ->value('balance');

        $refundTotal = RetailRefund::where('business_id', $businessId)
            ->whereBetween('refunded_at', [$shift->opened_at, now()])
            ->sum('refund_amount');

        $expectedCash = (float) $shift->opening_float + (float) $cashSales + (float) $pettyCashNet - (float) $refundTotal;
        $actualCash = (float) $payload['actual_cash'];

        $shift->update([
            'closed_by' => $userId,
            'status' => 'closed',
            'cash_sales_total' => $cashSales,
            'petty_cash_total' => $pettyCashNet,
            'refund_total' => $refundTotal,
            'expected_cash' => $expectedCash,
            'actual_cash' => $actualCash,
            'variance_amount' => $actualCash - $expectedCash,
            'closed_at' => now(),
        ]);

        return $shift->fresh();
    }

    public function registerLoyaltyCustomer(array $payload, int $businessId, ?int $branchId): RetailLoyaltyProfile
    {
        return DB::transaction(function () use ($payload, $businessId, $branchId) {
            $customer = Customer::firstOrCreate(
                ['business_id' => $businessId, 'phone' => $payload['phone']],
                [
                    'branch_id' => $branchId,
                    'name' => $payload['name'],
                    'customer_type' => 'individual',
                    'is_active' => true,
                ]
            );

            return RetailLoyaltyProfile::updateOrCreate(
                ['business_id' => $businessId, 'phone' => $payload['phone']],
                [
                    'customer_id' => $customer->id,
                    'tier' => $payload['tier'] ?? 'standard',
                ]
            );
        });
    }

    public function recordPettyCash(array $payload, int $businessId, ?int $branchId, int $userId): RetailPettyCashEntry
    {
        return RetailPettyCashEntry::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'shift_id' => $payload['shift_id'] ?? null,
            'recorded_by' => $userId,
            'entry_type' => $payload['entry_type'],
            'category' => $payload['category'],
            'amount' => $payload['amount'],
            'notes' => $payload['notes'] ?? null,
            'recorded_at' => $payload['recorded_at'] ?? now(),
        ]);
    }

    public function recordSale(array $payload, int $businessId, ?int $branchId, int $userId): Order
    {
        return DB::transaction(function () use ($payload, $businessId, $branchId, $userId) {
            $paymentSplits = collect($payload['payment_splits'] ?? []);

            if ($paymentSplits->isEmpty()) {
                $paymentSplits = collect([[
                    'payment_method' => $payload['payment_method'] ?? 'cash',
                    'amount' => $payload['paid'],
                    'reference' => null,
                ]]);
            }

            $order = $this->orderService->createOrder([
                'business_id' => $businessId,
                'branch_id' => $branchId,
                'customer_id' => $payload['customer_id'] ?? null,
                'items' => $payload['items'],
                'subtotal' => $payload['subtotal'],
                'discount' => $payload['discount'] ?? 0,
                'tax' => $payload['tax'] ?? 0,
                'total' => $payload['total'],
                'paid' => $payload['paid'],
                'change' => $payload['change'] ?? 0,
                'payment_method' => $paymentSplits->first()['payment_method'] ?? 'cash',
                'notes' => $payload['notes'] ?? null,
                'warehouse_id' => $payload['warehouse_id'] ?? null,
            ], $userId);

            foreach ($paymentSplits as $split) {
                RetailOrderPayment::create([
                    'business_id' => $businessId,
                    'order_id' => $order->id,
                    'payment_method' => $split['payment_method'],
                    'amount' => $split['amount'],
                    'reference' => $split['reference'] ?? null,
                ]);
            }

            $this->updateLoyaltyAfterSale($businessId, $payload, $order);

            return $order->load(['items.product', 'customer', 'payments']);
        });
    }

    public function processRefund(Order $order, array $payload, int $businessId, ?int $branchId, int $userId): RetailRefund
    {
        abort_if($order->business_id !== $businessId, 403);
        abort_if($order->order_type !== 'sale', 422, 'Only sale orders can be refunded.');

        return DB::transaction(function () use ($order, $payload, $businessId, $branchId, $userId) {
            $this->orderService->createReturn($order->id, $businessId, $userId);

            return RetailRefund::create([
                'business_id' => $businessId,
                'branch_id' => $branchId,
                'order_id' => $order->id,
                'customer_id' => $order->customer_id,
                'processed_by' => $userId,
                'refund_number' => 'RFD-' . now()->format('YmdHis') . '-' . str()->upper(str()->random(3)),
                'status' => 'completed',
                'refund_amount' => $payload['refund_amount'] ?? $order->total,
                'payment_method' => $payload['payment_method'] ?? 'cash',
                'reason' => $payload['reason'] ?? null,
                'notes' => $payload['notes'] ?? null,
                'refunded_at' => now(),
            ]);
        });
    }

    private function updateLoyaltyAfterSale(int $businessId, array $payload, Order $order): void
    {
        $profile = null;

        if (!empty($payload['loyalty_profile_id'])) {
            $profile = RetailLoyaltyProfile::where('business_id', $businessId)->find($payload['loyalty_profile_id']);
        } elseif (!empty($payload['loyalty_phone'])) {
            $profile = RetailLoyaltyProfile::where('business_id', $businessId)
                ->where('phone', $payload['loyalty_phone'])
                ->first();
        } elseif ($order->customer?->phone) {
            $profile = RetailLoyaltyProfile::firstOrCreate(
                ['business_id' => $businessId, 'phone' => $order->customer->phone],
                ['customer_id' => $order->customer_id]
            );
        }

        if (!$profile) {
            return;
        }

        $spend = (float) $order->total;
        $pointsEarned = floor($spend / 1000) * 10;

        $profile->update([
            'customer_id' => $profile->customer_id ?: $order->customer_id,
            'points_balance' => (float) $profile->points_balance + $pointsEarned,
            'lifetime_spend' => (float) $profile->lifetime_spend + $spend,
            'last_purchase_at' => now(),
            'tier' => $this->resolveTier((float) $profile->lifetime_spend + $spend),
        ]);
    }

    private function resolveTier(float $lifetimeSpend): string
    {
        return match (true) {
            $lifetimeSpend >= 1000000 => 'gold',
            $lifetimeSpend >= 250000 => 'silver',
            default => 'standard',
        };
    }

    private function sumCashCollections(int $businessId, $openedAt, $closedAt, ?int $branchId): float
    {
        $directCash = Order::where('business_id', $businessId)
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->whereBetween('created_at', [$openedAt, $closedAt])
            ->where('payment_method', 'cash')
            ->sum('paid');

        $splitCash = RetailOrderPayment::query()
            ->join('orders', 'orders.id', '=', 'retail_order_payments.order_id')
            ->where('retail_order_payments.business_id', $businessId)
            ->where('retail_order_payments.payment_method', 'cash')
            ->when($branchId, fn ($query) => $query->where('orders.branch_id', $branchId))
            ->whereBetween('orders.created_at', [$openedAt, $closedAt])
            ->sum('retail_order_payments.amount');

        return max((float) $directCash, (float) $splitCash);
    }
}
