<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\TrustFund\DrawTrustAccountRequest;
use App\Http\Requests\TrustFund\RepayTrustAccountRequest;
use App\Http\Requests\TrustFund\StoreTrustAccountRequest;
use App\Http\Resources\TrustAccountResource;
use App\Models\TrustAccount;
use App\Services\TrustFundService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class TrustFundController extends Controller
{
    public function __construct(private TrustFundService $trustFund)
    {
    }

    public function index(Request $request)
    {
        $baseQuery = TrustAccount::query()
            ->where('business_id', $request->user()->current_business_id);

        if ($request->type) {
            $baseQuery->where('account_type', $request->type);
        }

        if ($request->status) {
            $baseQuery->where('status', $request->status);
        }

        if ($request->search) {
            $search = trim((string) $request->search);

            $baseQuery->where(function (Builder $query) use ($search) {
                $query->where('cycle_name', 'like', "%{$search}%")
                    ->orWhereHas('customer', function (Builder $customerQuery) use ($search) {
                        $customerQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                });
            });
        }

        if ($request->view) {
            $this->applyViewFilter($baseQuery, (string) $request->view, $request->type);
        }

        $summary = $this->buildSummary(clone $baseQuery, $request->type);
        $accounts = (clone $baseQuery)
            ->with('customer')
            ->orderByDesc('created_at')
            ->paginate(20);
        $accounts->appends($request->query());
        $accounts->setCollection(
            $accounts->getCollection()->map(fn (TrustAccount $account) => $this->appendRecommendation($account))
        );

        return response()->json([
            ...$accounts->toArray(),
            'summary' => $summary,
        ]);
    }

    public function createAccount(StoreTrustAccountRequest $request)
    {
        $businessId = $request->user()->current_business_id;
        $validated = $request->validated();

        $validated['business_id'] = $businessId;

        $account = $this->trustFund->createAccount(
            $validated['customer_id'],
            $validated['account_type'],
            $validated['limit'],
            $validated['business_id'],
            [
                'cycle_name' => $validated['cycle_name'] ?? null,
                'installment_amount' => $validated['installment_amount'] ?? null,
                'contribution_frequency_days' => $validated['contribution_frequency_days'] ?? null,
                'next_due_date' => $validated['next_due_date'] ?? null,
            ]
        );

        return response()->json(
            (new TrustAccountResource($account->load('customer')))->resolve(),
            201
        );
    }

    public function show(TrustAccount $trustAccount)
    {
        $this->authorize('view', $trustAccount);

        $statement = $this->trustFund->getStatement($trustAccount->id, request()->user()->current_business_id);
        $statement['account'] = $this->appendRecommendation($statement['account']);

        return response()->json($statement);
    }

    public function draw(DrawTrustAccountRequest $request, TrustAccount $trustAccount)
    {
        $this->authorize('update', $trustAccount);
        $validated = $request->validated();

        // TrustFundService::draw() throws ValidationException for a real
        // business-rule violation (limit/cycle target exceeded) - Laravel's
        // default exception handler already formats that as the standard
        // {message, errors} 422 shape, so no catch is needed here. A raw
        // \Exception used to be caught broadly and misreported as 422,
        // which also silently masked genuine 500-level bugs as user error.
        $account = $this->trustFund->draw(
            $trustAccount->id,
            $request->user()->current_business_id,
            $validated['amount'],
            $validated['reference'] ?? null,
            $request->user()->id
        );

        return response()->json(
            (new TrustAccountResource($account->load('customer')))->resolve()
        );
    }

    public function repay(RepayTrustAccountRequest $request, TrustAccount $trustAccount)
    {
        $this->authorize('update', $trustAccount);
        $validated = $request->validated();

        $account = $this->trustFund->repay(
            $trustAccount->id,
            $request->user()->current_business_id,
            $validated['amount'],
            $validated['reference'] ?? null,
            $request->user()->id
        );

        return response()->json(
            (new TrustAccountResource($account->load('customer')))->resolve()
        );
    }

    public function overdue()
    {
        $accounts = $this->trustFund->getOverdueAccounts(request()->user()->current_business_id);
        $accounts = $accounts->map(fn (TrustAccount $account) => $this->appendRecommendation($account));

        return response()->json($accounts);
    }

    public function transactionHistory(TrustAccount $trustAccount)
    {
        $this->authorize('view', $trustAccount);

        $transactions = $trustAccount->transactions()
            ->orderByDesc('transaction_date')
            ->paginate(30);

        return response()->json($transactions);
    }

    private function buildSummary(Builder $query, ?string $type): array
    {
        if ($type === 'contribution') {
            $today = now()->startOfDay()->toDateString();

            $summary = $query->selectRaw("
                COUNT(*) as member_accounts,
                COALESCE(SUM(\"limit\"), 0) as total_target,
                COALESCE(SUM(balance), 0) as total_collected,
                COALESCE(SUM(total_repaid), 0) as total_paid_out,
                COALESCE(SUM(CASE WHEN balance > 0 THEN 1 ELSE 0 END), 0) as active_cycles,
                COALESCE(SUM(CASE WHEN next_due_date <= ? AND balance < \"limit\" THEN 1 ELSE 0 END), 0) as due_now
            ", [$today])->first();

            return [
                'member_accounts' => (int) ($summary?->member_accounts ?? 0),
                'total_target' => (float) ($summary?->total_target ?? 0),
                'total_collected' => (float) ($summary?->total_collected ?? 0),
                'total_paid_out' => (float) ($summary?->total_paid_out ?? 0),
                'active_cycles' => (int) ($summary?->active_cycles ?? 0),
                'due_now' => (int) ($summary?->due_now ?? 0),
            ];
        }

        $summary = $query->selectRaw('
            COUNT(*) as account_count,
            COALESCE(SUM("limit"), 0) as total_extended,
            COALESCE(SUM(balance), 0) as total_outstanding,
            COALESCE(SUM(total_repaid), 0) as total_collected
        ')->first();

        return [
            'account_count' => (int) ($summary?->account_count ?? 0),
            'total_extended' => (float) ($summary?->total_extended ?? 0),
            'total_outstanding' => (float) ($summary?->total_outstanding ?? 0),
            'total_collected' => (float) ($summary?->total_collected ?? 0),
        ];
    }

    private function applyViewFilter(Builder $query, string $view, ?string $type): void
    {
        if ($type === 'contribution') {
            $today = now()->startOfDay()->toDateString();

            match ($view) {
                'due_now' => $query
                    ->whereDate('next_due_date', '<=', $today)
                    ->whereColumn('balance', '<', 'limit'),
                'collecting' => $query
                    ->where('balance', '>', 0)
                    ->whereColumn('balance', '<', 'limit'),
                'funded' => $query->whereColumn('balance', '>=', 'limit'),
                'untouched' => $query->where('balance', '<=', 0),
                'paid_out' => $query->where('total_repaid', '>', 0),
                default => null,
            };

            return;
        }

        $overdueThreshold = now()->subDays(30)->toDateString();

        match ($view) {
            'active_balance' => $query->where('balance', '>', 0),
            'clear' => $query->where('balance', '<=', 0),
            'overdue' => $query
                ->where('balance', '>', 0)
                ->whereDate('last_payment_date', '<', $overdueThreshold),
            default => null,
        };
    }

    private function appendRecommendation(TrustAccount $account): TrustAccount
    {
        $account->setAttribute(
            'recommendation',
            $account->account_type === 'contribution'
                ? $this->buildContributionRecommendation($account)
                : $this->buildCreditRecommendation($account)
        );

        return $account;
    }

    private function buildContributionRecommendation(TrustAccount $account): array
    {
        $target = (float) $account->limit;
        $collected = (float) $account->balance;
        $installment = (float) ($account->installment_amount ?? 0);
        $remaining = max(0, $target - $collected);
        $recommendedAmount = $installment > 0 && $installment <= $remaining
            ? $installment
            : $remaining;
        $progressPercent = $target > 0
            ? round(min(100, ($collected / $target) * 100), 2)
            : 0;
        $nextReviewDate = $account->next_due_date?->toDateString() ?? now()->toDateString();

        if ($remaining <= 0) {
            return [
                'tone' => 'emerald',
                'risk_level' => 'low',
                'action' => 'cycle_funded',
                'recommended_amount' => 0,
                'message' => 'This cycle has reached its target, so no further collection is needed right now.',
                'why' => 'Collected balance already matches or exceeds the cycle target.',
                'next_review_date' => $nextReviewDate,
                'meta' => [
                    'remaining_target' => $remaining,
                    'available_payout_balance' => $collected,
                    'progress_percent' => $progressPercent,
                ],
            ];
        }

        if ($installment > 0 && $installment <= $remaining) {
            return [
                'tone' => 'violet',
                'risk_level' => $this->isContributionDueNow($account) ? 'medium' : 'low',
                'action' => 'collect_installment',
                'recommended_amount' => $recommendedAmount,
                'message' => "Collect the regular installment of {$recommendedAmount} to keep this cycle on schedule.",
                'why' => 'The regular installment fits within the remaining target and keeps the collection cadence predictable.',
                'next_review_date' => $nextReviewDate,
                'meta' => [
                    'remaining_target' => $remaining,
                    'available_payout_balance' => $collected,
                    'progress_percent' => $progressPercent,
                ],
            ];
        }

        return [
            'tone' => 'violet',
            'risk_level' => $this->isContributionDueNow($account) ? 'medium' : 'low',
            'action' => 'complete_cycle',
            'recommended_amount' => $recommendedAmount,
            'message' => "Collect the remaining {$remaining} to complete this cycle.",
            'why' => 'The cycle is close enough to target that one final collection can complete it cleanly.',
            'next_review_date' => $nextReviewDate,
            'meta' => [
                'remaining_target' => $remaining,
                'available_payout_balance' => $collected,
                'progress_percent' => $progressPercent,
            ],
        ];
    }

    private function buildCreditRecommendation(TrustAccount $account): array
    {
        $limit = (float) $account->limit;
        $outstanding = (float) $account->balance;
        $availableToDraw = max(0, $limit - $outstanding);
        $utilizationPercent = $limit > 0
            ? round(min(100, ($outstanding / $limit) * 100), 2)
            : 0;
        $nextReviewDate = $account->last_payment_date?->addDays(30)?->toDateString() ?? now()->addDays(30)->toDateString();

        if ($outstanding <= 0) {
            return [
                'tone' => 'emerald',
                'risk_level' => 'low',
                'action' => 'account_clear',
                'recommended_amount' => 0,
                'message' => 'This account is already clear, so no repayment is needed right now.',
                'why' => 'There is no outstanding balance left on the account.',
                'next_review_date' => $nextReviewDate,
                'meta' => [
                    'available_to_draw' => $availableToDraw,
                    'outstanding_balance' => $outstanding,
                    'utilization_percent' => $utilizationPercent,
                ],
            ];
        }

        if ($availableToDraw <= 0) {
            return [
                'tone' => 'amber',
                'risk_level' => $this->isCreditOverdue($account) ? 'high' : 'medium',
                'action' => 'collect_repayment_first',
                'recommended_amount' => $outstanding,
                'message' => 'Collect a repayment before releasing more credit because this account has no remaining headroom.',
                'why' => 'The current balance has fully consumed the approved limit, so more credit would breach the cap.',
                'next_review_date' => $nextReviewDate,
                'meta' => [
                    'available_to_draw' => $availableToDraw,
                    'outstanding_balance' => $outstanding,
                    'utilization_percent' => $utilizationPercent,
                ],
            ];
        }

        return [
            'tone' => 'violet',
            'risk_level' => $this->isCreditOverdue($account) ? 'high' : 'low',
            'action' => 'draw_within_limit',
            'recommended_amount' => $availableToDraw,
            'message' => "Release only what fits within the remaining headroom of {$availableToDraw}.",
            'why' => 'There is still approved headroom available, but keeping the draw within that range protects the account from limit overrun.',
            'next_review_date' => $nextReviewDate,
            'meta' => [
                'available_to_draw' => $availableToDraw,
                'outstanding_balance' => $outstanding,
                'utilization_percent' => $utilizationPercent,
            ],
        ];
    }

    private function isContributionDueNow(TrustAccount $account): bool
    {
        return $account->next_due_date !== null
            && $account->next_due_date->startOfDay()->lte(now()->startOfDay())
            && (float) $account->balance < (float) $account->limit;
    }

    private function isCreditOverdue(TrustAccount $account): bool
    {
        return (float) $account->balance > 0
            && $account->last_payment_date !== null
            && $account->last_payment_date->startOfDay()->lt(now()->subDays(30)->startOfDay());
    }
}
