<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Expense;
use App\Models\Order;
use App\Models\SMECashEntry;
use App\Models\SMEDailyTarget;
use App\Models\SMEFollowUp;

class GeneralSMEService
{
    public function overview(int $businessId): array
    {
        $today = today()->toDateString();

        $salesToday = (float) Order::where('business_id', $businessId)
            ->whereDate('created_at', $today)
            ->sum('total');

        $expensesToday = (float) Expense::where('business_id', $businessId)
            ->whereDate('expense_date', $today)
            ->sum('amount');

        $cashInToday = (float) SMECashEntry::where('business_id', $businessId)
            ->whereDate('entry_date', $today)
            ->where('entry_type', 'cash_in')
            ->sum('amount');

        $cashOutToday = (float) SMECashEntry::where('business_id', $businessId)
            ->whereDate('entry_date', $today)
            ->where('entry_type', 'cash_out')
            ->sum('amount');

        $target = SMEDailyTarget::where('business_id', $businessId)
            ->whereDate('target_date', $today)
            ->latest()
            ->first();

        return [
            'summary' => [
                'sales_today' => $salesToday,
                'expenses_today' => $expensesToday,
                'cash_in_today' => $cashInToday,
                'cash_out_today' => $cashOutToday,
                'net_cash_today' => $cashInToday - $cashOutToday,
                'debtor_exposure' => (float) Customer::where('business_id', $businessId)->sum('balance'),
                'followups_due' => SMEFollowUp::where('business_id', $businessId)->where('status', 'open')->whereDate('due_on', '<=', $today)->count(),
                'followups_open' => SMEFollowUp::where('business_id', $businessId)->where('status', 'open')->count(),
                'sales_target' => (float) ($target?->sales_target ?? 0),
                'collection_target' => (float) ($target?->collection_target ?? 0),
                'expense_limit' => (float) ($target?->expense_limit ?? 0),
                'target_attainment' => ($target && (float) $target->sales_target > 0)
                    ? round(($salesToday / (float) $target->sales_target) * 100, 1)
                    : 0,
            ],
            'cash_entries' => SMECashEntry::with('customer')->where('business_id', $businessId)->latest('entry_date')->latest()->get(),
            'followups' => SMEFollowUp::with('customer')->where('business_id', $businessId)->latest('due_on')->get(),
            'targets' => SMEDailyTarget::where('business_id', $businessId)->latest('target_date')->get(),
        ];
    }

    public function createCashEntry(array $payload, int $businessId, ?int $branchId, ?int $userId): SMECashEntry
    {
        return SMECashEntry::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'customer_id' => $payload['customer_id'] ?? null,
            'recorded_by' => $userId,
            'entry_type' => $payload['entry_type'],
            'source' => $payload['source'],
            'amount' => $payload['amount'],
            'payment_method' => $payload['payment_method'] ?? 'cash',
            'reference' => $payload['reference'] ?? null,
            'entry_date' => $payload['entry_date'],
            'notes' => $payload['notes'] ?? null,
        ]);
    }

    public function createFollowUp(array $payload, int $businessId, ?int $branchId): SMEFollowUp
    {
        return SMEFollowUp::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'customer_id' => $payload['customer_id'] ?? null,
            'assigned_to' => $payload['assigned_to'] ?? null,
            'category' => $payload['category'] ?? 'debtor_collection',
            'status' => $payload['status'] ?? 'open',
            'title' => $payload['title'],
            'notes' => $payload['notes'] ?? null,
            'amount_in_focus' => $payload['amount_in_focus'] ?? 0,
            'due_on' => $payload['due_on'],
            'completed_at' => ($payload['status'] ?? 'open') === 'completed' ? now() : null,
        ]);
    }

    public function createDailyTarget(array $payload, int $businessId, ?int $branchId): SMEDailyTarget
    {
        return SMEDailyTarget::updateOrCreate(
            [
                'business_id' => $businessId,
                'branch_id' => $branchId,
                'target_date' => $payload['target_date'],
            ],
            [
                'sales_target' => $payload['sales_target'] ?? 0,
                'collection_target' => $payload['collection_target'] ?? 0,
                'expense_limit' => $payload['expense_limit'] ?? 0,
                'actual_sales' => $payload['actual_sales'] ?? 0,
                'actual_collections' => $payload['actual_collections'] ?? 0,
                'actual_expenses' => $payload['actual_expenses'] ?? 0,
                'status' => $payload['status'] ?? 'open',
                'notes' => $payload['notes'] ?? null,
            ]
        );
    }
}
