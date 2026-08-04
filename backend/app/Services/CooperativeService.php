<?php

namespace App\Services;

use App\Models\Cooperative;
use App\Models\CooperativeBrandingSetting;
use App\Models\CooperativeFinancing;
use App\Models\CooperativeFinancingReport;
use App\Models\CooperativeGovernanceRecord;
use App\Models\CooperativeGuarantor;
use App\Models\CooperativeInvestment;
use App\Models\CooperativeLoanSetting;
use App\Models\CooperativeMember;
use App\Models\CooperativeProfitCycle;
use App\Models\CooperativeProfitDistribution;
use App\Models\CooperativeShare;
use App\Models\CooperativeWallet;
use App\Models\CooperativeWithdrawal;
use App\Models\Customer;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CooperativeService
{
    private const WALLET_TYPES = ['main', 'financing_fund', 'investment_fund', 'reserve_fund', 'charity_fund'];

    public function getContext(int $businessId): ?Cooperative
    {
        return Cooperative::with([
            'subscriptionPlan',
            'loanSettings',
            'brandingSettings',
            'wallets',
            'members.customer',
        ])->where('business_id', $businessId)->first();
    }

    public function ensureCooperative(int $businessId, array $payload): Cooperative
    {
        return DB::transaction(function () use ($businessId, $payload) {
            $cooperative = Cooperative::updateOrCreate(
                ['business_id' => $businessId],
                [
                    'subscription_plan_id' => $payload['subscription_plan_id'] ?? null,
                    'name' => $payload['name'],
                    'slug' => ($payload['slug'] ?? null) ?: Str::slug($payload['name']).'-'.$businessId,
                    'description' => $payload['description'] ?? null,
                    'share_price' => $payload['share_price'],
                    'minimum_member_shares' => $payload['minimum_member_shares'] ?? 1,
                    'contribution_rule' => $payload['contribution_rule'] ?? null,
                    'profit_cycle' => $payload['profit_cycle'] ?? 'monthly',
                    'status' => $payload['status'] ?? 'active',
                    'sharia_notes' => $payload['sharia_notes'] ?? null,
                ]
            );

            CooperativeLoanSetting::updateOrCreate(
                ['cooperative_id' => $cooperative->id],
                [
                    'required_guarantors' => $payload['loan_settings']['required_guarantors'] ?? 2,
                    'min_shares_per_guarantor' => $payload['loan_settings']['min_shares_per_guarantor'] ?? 1,
                    'min_combined_guarantor_shares' => $payload['loan_settings']['min_combined_guarantor_shares'] ?? 2,
                    'borrower_min_shares' => $payload['loan_settings']['borrower_min_shares'] ?? 1,
                    'loan_limit_mode' => $payload['loan_settings']['loan_limit_mode'] ?? 'multiplier',
                    'loan_limit_value' => $payload['loan_settings']['loan_limit_value'] ?? 2,
                    'lock_borrower_shares' => $payload['loan_settings']['lock_borrower_shares'] ?? true,
                    'lock_guarantor_shares' => $payload['loan_settings']['lock_guarantor_shares'] ?? true,
                    'liability_mode' => $payload['loan_settings']['liability_mode'] ?? 'proportional',
                    'allow_admin_override' => $payload['loan_settings']['allow_admin_override'] ?? false,
                    'custom_liability_notes' => $payload['loan_settings']['custom_liability_notes'] ?? null,
                ]
            );

            CooperativeBrandingSetting::updateOrCreate(
                ['cooperative_id' => $cooperative->id],
                [
                    'branding_tier' => $payload['branding']['branding_tier'] ?? 'basic',
                    'logo_url' => $payload['branding']['logo_url'] ?? null,
                    'primary_color' => $payload['branding']['primary_color'] ?? null,
                    'secondary_color' => $payload['branding']['secondary_color'] ?? null,
                    'remove_powered_by_taska' => $payload['branding']['remove_powered_by_taska'] ?? false,
                    'custom_domain' => $payload['branding']['custom_domain'] ?? null,
                    'custom_tagline' => $payload['branding']['custom_tagline'] ?? null,
                ]
            );

            $this->ensureWallets($cooperative);

            return $cooperative->fresh(['subscriptionPlan', 'loanSettings', 'brandingSettings', 'wallets']);
        });
    }

    public function addMember(Cooperative $cooperative, array $payload): CooperativeMember
    {
        return DB::transaction(function () use ($cooperative, $payload) {
            $customer = Customer::where('business_id', $cooperative->business_id)
                ->findOrFail($payload['customer_id']);

            return CooperativeMember::updateOrCreate(
                [
                    'cooperative_id' => $cooperative->id,
                    'customer_id' => $customer->id,
                ],
                [
                    'business_id' => $cooperative->business_id,
                    'user_id' => $payload['user_id'] ?? null,
                    'member_number' => $payload['member_number'] ?? $this->generateMemberNumber($cooperative),
                    'role' => $payload['role'] ?? 'member',
                    'joined_at' => $payload['joined_at'] ?? now()->toDateString(),
                    'status' => $payload['status'] ?? 'active',
                    'notes' => $payload['notes'] ?? null,
                ]
            );
        });
    }

    public function purchaseShares(Cooperative $cooperative, array $payload): CooperativeShare
    {
        return DB::transaction(function () use ($cooperative, $payload) {
            $member = $this->findMember($cooperative, $payload['member_id']);
            $units = (float) $payload['units'];
            $pricePerShare = (float) ($payload['price_per_share'] ?? $cooperative->share_price);
            $amountPaid = round($units * $pricePerShare, 2);

            $share = CooperativeShare::create([
                'cooperative_id' => $cooperative->id,
                'business_id' => $cooperative->business_id,
                'member_id' => $member->id,
                'transaction_type' => $payload['transaction_type'] ?? 'purchase',
                'units' => $units,
                'amount_paid' => $amountPaid,
                'price_per_share' => $pricePerShare,
                'issued_at' => $payload['issued_at'] ?? now()->toDateString(),
                'notes' => $payload['notes'] ?? null,
            ]);

            $this->adjustWallet($cooperative, 'main', $amountPaid);

            return $share->load('member.customer');
        });
    }

    public function createFinancing(Cooperative $cooperative, array $payload, int $userId): CooperativeFinancing
    {
        return DB::transaction(function () use ($cooperative, $payload, $userId) {
            $member = $this->findMember($cooperative, $payload['member_id']);
            $type = $payload['financing_type'];
            $loanSettings = $cooperative->loanSettings ?? CooperativeLoanSetting::create([
                'cooperative_id' => $cooperative->id,
            ]);

            if ($type === 'qard_hasan') {
                $this->validateQardHasan($cooperative, $loanSettings, $member, $payload);
            }

            $status = match ($type) {
                'qard_hasan' => 'pending_guarantor_approval',
                'mudarabah', 'musharakah' => 'pending_admin_approval',
                default => 'submitted',
            };

            $financing = CooperativeFinancing::create([
                'cooperative_id' => $cooperative->id,
                'business_id' => $cooperative->business_id,
                'member_id' => $member->id,
                'financing_type' => $type,
                'status' => $status,
                'amount_requested' => $payload['amount_requested'] ?? null,
                'capital_amount' => $payload['capital_amount'] ?? null,
                'cooperative_capital' => $payload['cooperative_capital'] ?? null,
                'member_capital' => $payload['member_capital'] ?? null,
                'profit_share_cooperative' => $payload['profit_share_cooperative'] ?? null,
                'profit_share_member' => $payload['profit_share_member'] ?? null,
                'profit_share_ratio' => $payload['profit_share_ratio'] ?? null,
                'business_description' => $payload['business_description'] ?? null,
                'duration_months' => $payload['duration_months'] ?? null,
                'repayment_due_date' => $payload['repayment_due_date'] ?? null,
                'late_penalty_destination' => 'charity',
                'submitted_at' => now(),
                'metadata' => [
                    'sharia_notes' => $payload['sharia_notes'] ?? null,
                    'created_by' => $userId,
                ],
            ]);

            if ($type === 'qard_hasan') {
                $guarantorIds = collect($payload['guarantor_member_ids'] ?? [])->unique()->values();
                $shareMap = $this->getMemberShareBalances($cooperative->id);

                foreach ($guarantorIds as $guarantorId) {
                    $guarantor = $this->findMember($cooperative, (int) $guarantorId);
                    CooperativeGuarantor::create([
                        'financing_id' => $financing->id,
                        'guarantor_member_id' => $guarantor->id,
                        'status' => 'pending',
                        'shares_committed' => (float) ($shareMap[$guarantor->id] ?? 0),
                        'liability_share_percent' => $loanSettings->liability_mode === 'equal'
                            ? round(100 / max(1, $loanSettings->required_guarantors), 2)
                            : null,
                    ]);
                }

                if ($loanSettings->lock_borrower_shares) {
                    $member->increment('shares_locked', (float) ($shareMap[$member->id] ?? 0));
                }
            }

            return $financing->load(['member.customer', 'guarantors.member.customer']);
        });
    }

    public function approveGuarantor(CooperativeFinancing $financing, int $guarantorMemberId): CooperativeFinancing
    {
        return DB::transaction(function () use ($financing, $guarantorMemberId) {
            $guarantor = CooperativeGuarantor::where('financing_id', $financing->id)
                ->where('guarantor_member_id', $guarantorMemberId)
                ->firstOrFail();

            $guarantor->update([
                'status' => 'approved',
                'approved_at' => now(),
            ]);

            if ($financing->guarantors()->where('status', 'approved')->count() === $financing->guarantors()->count()) {
                $financing->update(['status' => 'pending_admin_approval']);
            }

            return $financing->fresh(['member.customer', 'guarantors.member.customer']);
        });
    }

    public function updateFinancingStatus(CooperativeFinancing $financing, array $payload, int $userId): CooperativeFinancing
    {
        return DB::transaction(function () use ($financing, $payload, $userId) {
            $status = $payload['status'];
            $cooperative = $financing->cooperative;
            $update = ['status' => $status];

            if (!empty($payload['admin_override_reason'])) {
                $update['admin_override_reason'] = $payload['admin_override_reason'];
                $update['override_by_user_id'] = $userId;
            }

            if ($status === 'approved') {
                $update['approved_at'] = now();
            }

            if ($status === 'disbursed') {
                $amount = (float) ($payload['amount_disbursed'] ?? $financing->amount_requested ?? $financing->capital_amount ?? $financing->cooperative_capital ?? 0);
                $update['amount_disbursed'] = $amount;
                $update['disbursed_at'] = now();
                $this->adjustWallet($cooperative, 'financing_fund', -$amount);
                $this->adjustWallet($cooperative, 'main', -$amount);
            }

            if (in_array($status, ['repaid', 'closed'], true)) {
                $update['closed_at'] = now();
            }

            $financing->update($update);

            return $financing->fresh(['member.customer', 'guarantors.member.customer', 'reports']);
        });
    }

    public function storeFinancingReport(CooperativeFinancing $financing, array $payload): CooperativeFinancingReport
    {
        return CooperativeFinancingReport::create([
            'financing_id' => $financing->id,
            'reporting_period_start' => $payload['reporting_period_start'],
            'reporting_period_end' => $payload['reporting_period_end'],
            'revenue' => $payload['revenue'] ?? 0,
            'direct_cost' => $payload['direct_cost'] ?? 0,
            'net_profit' => $payload['net_profit'] ?? (($payload['revenue'] ?? 0) - ($payload['direct_cost'] ?? 0)),
            'cooperative_share_amount' => $payload['cooperative_share_amount'] ?? 0,
            'member_share_amount' => $payload['member_share_amount'] ?? 0,
            'status' => $payload['status'] ?? 'submitted',
            'report_notes' => $payload['report_notes'] ?? null,
            'submitted_at' => now(),
        ]);
    }

    public function createInvestment(Cooperative $cooperative, array $payload): CooperativeInvestment
    {
        return DB::transaction(function () use ($cooperative, $payload) {
            $investment = CooperativeInvestment::create([
                'cooperative_id' => $cooperative->id,
                'business_id' => $cooperative->business_id,
                'product_id' => $payload['product_id'] ?? null,
                'name' => $payload['name'],
                'category' => $payload['category'] ?? 'halal_trade',
                'status' => $payload['status'] ?? 'active',
                'amount' => $payload['amount'],
                'expected_return_rate' => $payload['expected_return_rate'] ?? null,
                'current_value' => $payload['current_value'] ?? null,
                'start_date' => $payload['start_date'] ?? now()->toDateString(),
                'end_date' => $payload['end_date'] ?? null,
                'linked_inventory' => $payload['linked_inventory'] ?? false,
                'notes' => $payload['notes'] ?? null,
            ]);

            $this->adjustWallet($cooperative, 'investment_fund', -((float) $payload['amount']));
            $this->adjustWallet($cooperative, 'main', -((float) $payload['amount']));

            return $investment;
        });
    }

    public function createProfitCycle(Cooperative $cooperative, array $payload): CooperativeProfitCycle
    {
        return DB::transaction(function () use ($cooperative, $payload) {
            $cycle = CooperativeProfitCycle::create([
                'cooperative_id' => $cooperative->id,
                'business_id' => $cooperative->business_id,
                'label' => $payload['label'],
                'cycle_start' => $payload['cycle_start'],
                'cycle_end' => $payload['cycle_end'],
                'total_profit' => $payload['total_profit'],
                'reserve_allocation' => $payload['reserve_allocation'] ?? 0,
                'charity_allocation' => $payload['charity_allocation'] ?? 0,
                'distributable_profit' => ($payload['total_profit'] ?? 0)
                    - ($payload['reserve_allocation'] ?? 0)
                    - ($payload['charity_allocation'] ?? 0),
                'status' => $payload['status'] ?? 'approved',
                'notes' => $payload['notes'] ?? null,
            ]);

            $shareMap = $this->getMemberShareBalances($cooperative->id);
            $totalShares = max(1, array_sum($shareMap));

            foreach ($shareMap as $memberId => $shares) {
                $ownershipPercent = round(($shares / $totalShares) * 100, 2);
                $amount = round(($shares / $totalShares) * (float) $cycle->distributable_profit, 2);

                CooperativeProfitDistribution::create([
                    'profit_cycle_id' => $cycle->id,
                    'member_id' => $memberId,
                    'shares_at_record' => $shares,
                    'ownership_percent' => $ownershipPercent,
                    'amount' => $amount,
                    'status' => 'pending',
                ]);
            }

            $cycle->update([
                'distribution_snapshot' => [
                    'total_members' => count($shareMap),
                    'total_shares' => $totalShares,
                ],
            ]);

            $this->adjustWallet($cooperative, 'reserve_fund', (float) ($payload['reserve_allocation'] ?? 0));
            $this->adjustWallet($cooperative, 'charity_fund', (float) ($payload['charity_allocation'] ?? 0));

            return $cycle->fresh('distributions.member.customer');
        });
    }

    public function distributeProfit(CooperativeProfitCycle $cycle): CooperativeProfitCycle
    {
        $cycle->update([
            'status' => 'distributed',
            'distributed_at' => now(),
        ]);

        return $cycle->fresh('distributions.member.customer');
    }

    public function requestWithdrawal(Cooperative $cooperative, array $payload): CooperativeWithdrawal
    {
        return CooperativeWithdrawal::create([
            'cooperative_id' => $cooperative->id,
            'business_id' => $cooperative->business_id,
            'member_id' => $payload['member_id'],
            'withdrawal_type' => $payload['withdrawal_type'],
            'status' => $payload['status'] ?? 'requested',
            'amount' => $payload['amount'],
            'reason' => $payload['reason'] ?? null,
            'requested_at' => now(),
            'notes' => $payload['notes'] ?? null,
        ]);
    }

    public function createGovernanceRecord(Cooperative $cooperative, array $payload): CooperativeGovernanceRecord
    {
        return CooperativeGovernanceRecord::create([
            'cooperative_id' => $cooperative->id,
            'business_id' => $cooperative->business_id,
            'record_type' => $payload['record_type'],
            'title' => $payload['title'],
            'record_date' => $payload['record_date'] ?? now()->toDateString(),
            'status' => $payload['status'] ?? 'scheduled',
            'summary' => $payload['summary'] ?? null,
            'decisions_json' => $payload['decisions_json'] ?? null,
            'attachment_url' => $payload['attachment_url'] ?? null,
        ]);
    }

    public function getReportSnapshot(Cooperative $cooperative): array
    {
        $shareMap = $this->getMemberShareBalances($cooperative->id);
        $totalShares = array_sum($shareMap);
        $profitDistributed = (float) $cooperative->profitCycles()->sum('distributable_profit');

        return [
            'members' => $cooperative->members()->count(),
            'active_financing' => $cooperative->financing()->whereNotIn('status', ['closed', 'repaid'])->count(),
            'wallet_balance' => (float) $cooperative->wallets()->sum('balance'),
            'total_shares' => $totalShares,
            'profit_distributed' => $profitDistributed,
            'investments_value' => (float) $cooperative->investments()->sum('current_value'),
            'charity_balance' => (float) $cooperative->wallets()->where('wallet_type', 'charity_fund')->value('balance'),
        ];
    }

    public function getMemberShareBalances(int $cooperativeId): array
    {
        return CooperativeShare::query()
            ->where('cooperative_id', $cooperativeId)
            ->selectRaw("
                member_id,
                COALESCE(SUM(CASE
                    WHEN transaction_type IN ('purchase', 'bonus') THEN units
                    WHEN transaction_type = 'redeem' THEN -units
                    ELSE 0
                END), 0) as owned_units
            ")
            ->groupBy('member_id')
            ->pluck('owned_units', 'member_id')
            ->map(fn ($value) => (float) $value)
            ->all();
    }

    public function ensureWallets(Cooperative $cooperative): void
    {
        foreach (self::WALLET_TYPES as $walletType) {
            CooperativeWallet::firstOrCreate(
                [
                    'cooperative_id' => $cooperative->id,
                    'wallet_type' => $walletType,
                ],
                [
                    'business_id' => $cooperative->business_id,
                    'currency' => 'NGN',
                ]
            );
        }
    }

    private function adjustWallet(Cooperative $cooperative, string $walletType, float $amount): void
    {
        $wallet = CooperativeWallet::firstOrCreate(
            [
                'cooperative_id' => $cooperative->id,
                'wallet_type' => $walletType,
            ],
            [
                'business_id' => $cooperative->business_id,
                'currency' => 'NGN',
            ]
        );

        $wallet->balance = round(((float) $wallet->balance) + $amount, 2);
        $wallet->save();
    }

    private function validateQardHasan(Cooperative $cooperative, CooperativeLoanSetting $settings, CooperativeMember $member, array $payload): void
    {
        $shareMap = $this->getMemberShareBalances($cooperative->id);
        $borrowerShares = (float) ($shareMap[$member->id] ?? 0);

        if ($borrowerShares < $settings->borrower_min_shares) {
            throw new \RuntimeException('Borrower does not meet the minimum share requirement.');
        }

        $amountRequested = (float) ($payload['amount_requested'] ?? 0);
        $borrowerShareValue = $borrowerShares * (float) $cooperative->share_price;

        $maximumAmount = match ($settings->loan_limit_mode) {
            'percentage' => $borrowerShareValue * ((float) $settings->loan_limit_value / 100),
            'fixed' => (float) $settings->loan_limit_value,
            default => $borrowerShareValue * (float) $settings->loan_limit_value,
        };

        if ($amountRequested > $maximumAmount) {
            throw new \RuntimeException('Loan request is above the cooperative limit for this member.');
        }

        $guarantorIds = collect($payload['guarantor_member_ids'] ?? [])->map(fn ($id) => (int) $id)->unique();

        if ($guarantorIds->count() < $settings->required_guarantors) {
            throw new \RuntimeException('Not enough guarantors have been assigned.');
        }

        $combinedShares = 0;

        foreach ($guarantorIds as $guarantorId) {
            if ($guarantorId === $member->id) {
                throw new \RuntimeException('Borrower cannot guarantee their own financing.');
            }

            $guarantorShares = (float) ($shareMap[$guarantorId] ?? 0);

            if ($guarantorShares < $settings->min_shares_per_guarantor) {
                throw new \RuntimeException('A guarantor does not meet the minimum share requirement.');
            }

            $combinedShares += $guarantorShares;
        }

        if ($combinedShares < $settings->min_combined_guarantor_shares) {
            throw new \RuntimeException('Combined guarantor shares are below the cooperative threshold.');
        }
    }

    private function findMember(Cooperative $cooperative, int $memberId): CooperativeMember
    {
        return CooperativeMember::where('cooperative_id', $cooperative->id)->findOrFail($memberId);
    }

    private function generateMemberNumber(Cooperative $cooperative): string
    {
        $count = CooperativeMember::where('cooperative_id', $cooperative->id)->count() + 1;

        return strtoupper(Str::padLeft((string) $count, 4, '0')).'-COOP-'.$cooperative->business_id;
    }
}
