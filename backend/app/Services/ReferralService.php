<?php

namespace App\Services;

use App\Models\ReferralAgent;
use App\Models\ReferralTier;
use App\Models\ReferralTracking;
use App\Models\ReferralCommission;
use App\Models\ReferralPayout;
use App\Models\ReferralFraudLog;
use App\Models\Business;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReferralService
{
    public function registerAgent(array $data, Business $business): ReferralAgent
    {
        return DB::transaction(function () use ($data, $business) {
            $agent = ReferralAgent::create([
                'business_id' => $business->id,
                'referral_code' => $this->generateReferralCode(),
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
                'status' => ReferralAgent::STATUS_PENDING,
                'agent_type' => $data['agent_type'],
                'tier' => ReferralAgent::TIER_BRONZE,
                'commission_rate' => 20.00,
                'recurring_rate' => 5.00,
            ]);

            $this->createOnboardingSteps($agent);

            return $agent;
        });
    }

    public function approveAgent(ReferralAgent $agent): void
    {
        $agent->update([
            'status' => ReferralAgent::STATUS_ACTIVE,
            'approved_at' => now(),
            'onboarded_at' => now(),
        ]);

        $tier = ReferralTier::where('slug', $agent->tier)->first();
        if ($tier) {
            $agent->update([
                'commission_rate' => $tier->commission_rate,
                'recurring_rate' => $tier->recurring_rate,
            ]);
        }
    }

    public function trackReferral(ReferralAgent $agent, Business $referredBusiness, array $trackingData = []): ReferralTracking
    {
        return ReferralTracking::create([
            'agent_id' => $agent->id,
            'referred_business_id' => $referredBusiness->id,
            'source_url' => $trackingData['source_url'] ?? null,
            'utm_source' => $trackingData['utm_source'] ?? null,
            'utm_medium' => $trackingData['utm_medium'] ?? null,
            'utm_campaign' => $trackingData['utm_campaign'] ?? null,
            'ip_address' => $trackingData['ip_address'] ?? null,
            'user_agent' => $trackingData['user_agent'] ?? null,
        ]);
    }

    public function convertReferral(ReferralAgent $agent, Business $referredBusiness): ReferralCommission
    {
        $tracking = ReferralTracking::where('agent_id', $agent->id)
            ->where('referred_business_id', $referredBusiness->id)
            ->first();

        if ($tracking && !$tracking->is_converted) {
            $tracking->markAsConverted();
        }

        $this->detectFraud($agent, $referredBusiness);

        $commissionAmount = $this->calculateFirstPurchaseCommission($referredBusiness);

        $commission = DB::transaction(function () use ($agent, $referredBusiness, $commissionAmount) {
            $commission = ReferralCommission::create([
                'agent_id' => $agent->id,
                'referred_business_id' => $referredBusiness->id,
                'type' => ReferralCommission::TYPE_FIRST_PURCHASE,
                'status' => ReferralCommission::STATUS_PENDING,
                'amount' => $commissionAmount,
                'rate_applied' => $agent->commission_rate,
                'currency' => $referredBusiness->currency ?? 'NGN',
                'description' => 'First purchase commission',
            ]);

            $agent->total_earnings += $commissionAmount;
            $agent->pending_payout += $commissionAmount;
            $agent->save();

            return $commission;
        });

        $this->checkTierUpgrade($agent);

        return $commission;
    }

    public function processRecurringCommission(ReferralAgent $agent, Business $referredBusiness, float $amount): ReferralCommission
    {
        $commissionAmount = ($amount * $agent->recurring_rate) / 100;

        return DB::transaction(function () use ($agent, $referredBusiness, $amount, $commissionAmount) {
            $commission = ReferralCommission::create([
                'agent_id' => $agent->id,
                'referred_business_id' => $referredBusiness->id,
                'type' => ReferralCommission::TYPE_RECURRING,
                'status' => ReferralCommission::STATUS_PENDING,
                'amount' => $commissionAmount,
                'rate_applied' => $agent->recurring_rate,
                'currency' => $referredBusiness->currency ?? 'NGN',
                'description' => "Recurring commission on ₦{$amount}",
            ]);

            $agent->total_earnings += $commissionAmount;
            $agent->pending_payout += $commissionAmount;
            $agent->save();

            return $commission;
        });
    }

    public function approveCommission(ReferralCommission $commission): void
    {
        $commission->approve();
    }

    public function createPayout(ReferralAgent $agent, float $amount): ReferralPayout
    {
        $fees = $this->calculatePayoutFees($amount);
        $netAmount = $amount - $fees;

        return DB::transaction(function () use ($agent, $amount, $fees, $netAmount) {
            $payout = ReferralPayout::create([
                'agent_id' => $agent->id,
                'payout_number' => $this->generatePayoutNumber(),
                'amount' => $amount,
                'fees' => $fees,
                'net_amount' => $netAmount,
                'currency' => $agent->business->currency ?? 'NGN',
                'status' => ReferralPayout::STATUS_PENDING,
                'payment_method' => $agent->payment_method,
                'bank_name' => $agent->bank_name,
                'account_number' => $agent->account_number,
                'account_name' => $agent->account_name,
            ]);

            $agent->pending_payout -= $amount;
            $agent->save();

            return $payout;
        });
    }

    public function processPayout(ReferralPayout $payout, string $gateway): bool
    {
        $service = $gateway === 'paystack'
            ? app(PaystackService::class)
            : app(FlutterwaveService::class);

        $result = $service->transfer(
            $payout->net_amount,
            $payout->agent->bank_code,
            $payout->account_number,
            $payout->agent->account_name
        );

        if ($result['success']) {
            $payout->markAsCompleted($result['reference'] ?? null);
            return true;
        }

        $payout->markAsFailed($result['error'] ?? 'Transfer failed');
        $payout->agent->pending_payout += $payout->net_amount;
        $payout->agent->save();

        return false;
    }

    public function detectFraud(ReferralAgent $agent, Business $referredBusiness): void
    {
        $tracking = ReferralTracking::where('agent_id', $agent->id)
            ->where('referred_business_id', $referredBusiness->id)
            ->first();

        if ($agent->business_id === $referredBusiness->id) {
            ReferralFraudLog::create([
                'agent_id' => $agent->id,
                'type' => ReferralFraudLog::TYPE_SELF_REFERRAL,
                'severity' => ReferralFraudLog::SEVERITY_CRITICAL,
                'description' => 'Agent referred their own business',
                'evidence' => [
                    'agent_business_id' => $agent->business_id,
                    'referred_business_id' => $referredBusiness->id,
                ],
            ]);
        }

        $duplicateIp = ReferralTracking::where('referred_business_id', $referredBusiness->id)
            ->where('ip_address', '!=', null)
            ->count() > 1;

        if ($duplicateIp) {
            ReferralFraudLog::create([
                'agent_id' => $agent->id,
                'type' => ReferralFraudLog::TYPE_DUPLICATE_IP,
                'severity' => ReferralFraudLog::SEVERITY_MEDIUM,
                'description' => 'Multiple referrals from same IP address',
                'evidence' => ['ip_address' => $tracking?->ip_address],
            ]);
        }
    }

    public function checkTierUpgrade(ReferralAgent $agent): void
    {
        $referralCount = ReferralCommission::where('agent_id', $agent->id)
            ->where('type', ReferralCommission::TYPE_FIRST_PURCHASE)
            ->count();

        $currentTier = ReferralTier::where('slug', $agent->tier)->first();
        if (!$currentTier) return;

        $nextTier = $currentTier->getNextTier();
        if (!$nextTier) return;

        if ($referralCount >= $nextTier->min_referrals) {
            $agent->update([
                'tier' => $nextTier->slug,
                'commission_rate' => $nextTier->commission_rate,
                'recurring_rate' => $nextTier->recurring_rate,
            ]);
        }
    }

    public function getAgentStats(ReferralAgent $agent): array
    {
        $totalReferrals = ReferralCommission::where('agent_id', $agent->id)
            ->where('type', ReferralCommission::TYPE_FIRST_PURCHASE)
            ->count();

        $pendingEarnings = ReferralCommission::where('agent_id', $agent->id)
            ->where('status', ReferralCommission::STATUS_PENDING)
            ->sum('amount');

        $paidEarnings = ReferralCommission::where('agent_id', $agent->id)
            ->where('status', ReferralCommission::STATUS_PAID)
            ->sum('amount');

        return [
            'total_referrals' => $totalReferrals,
            'pending_earnings' => $pendingEarnings,
            'paid_earnings' => $paidEarnings,
            'tier' => $agent->tier,
            'commission_rate' => $agent->commission_rate,
            'recurring_rate' => $agent->recurring_rate,
        ];
    }

    public function seedTiers(): void
    {
        $tiers = [
            ['name' => 'Bronze', 'slug' => 'bronze', 'min_referrals' => 0, 'max_referrals' => 4, 'commission_rate' => 20.00, 'recurring_rate' => 5.00, 'badge_color' => '#CD7F32'],
            ['name' => 'Silver', 'slug' => 'silver', 'min_referrals' => 5, 'max_referrals' => 14, 'commission_rate' => 25.00, 'recurring_rate' => 6.00, 'badge_color' => '#C0C0C0'],
            ['name' => 'Gold', 'slug' => 'gold', 'min_referrals' => 15, 'max_referrals' => 29, 'commission_rate' => 30.00, 'recurring_rate' => 7.50, 'badge_color' => '#FFD700'],
            ['name' => 'Platinum', 'slug' => 'platinum', 'min_referrals' => 30, 'max_referrals' => null, 'commission_rate' => 35.00, 'recurring_rate' => 10.00, 'badge_color' => '#E5E4E2'],
        ];

        foreach ($tiers as $tier) {
            ReferralTier::updateOrCreate(['slug' => $tier['slug']], $tier);
        }
    }

    private function generateReferralCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (ReferralAgent::where('referral_code', $code)->exists());

        return $code;
    }

    private function generatePayoutNumber(): string
    {
        $prefix = 'PYT';
        $date = now()->format('Ymd');
        $sequence = str_pad(ReferralPayout::count() + 1, 5, '0', STR_PAD_LEFT);
        return "{$prefix}-{$date}-{$sequence}";
    }

    private function createOnboardingSteps(ReferralAgent $agent): void
    {
        $steps = [
            ['step' => 1, 'step_name' => 'personal_info', 'data' => ['title' => 'Personal Information']],
            ['step' => 2, 'step_name' => 'documents', 'data' => ['title' => 'Verify Documents']],
            ['step' => 3, 'step_name' => 'payout_info', 'data' => ['title' => 'Payout Details']],
            ['step' => 4, 'step_name' => 'agreement', 'data' => ['title' => 'Partner Agreement']],
        ];

        foreach ($steps as $step) {
            $agent->onboardingSteps()->create($step);
        }
    }

    private function calculateFirstPurchaseCommission(Business $business): float
    {
        $subscription = $business->activeSubscription()->first();
        if (!$subscription) return 0;

        $price = $subscription->billing_cycle === 'yearly'
            ? $subscription->plan->yearly_price
            : $subscription->plan->monthly_price;

        return ($price * 20) / 100;
    }

    private function calculatePayoutFees(float $amount): float
    {
        return min(100, max(10, ($amount * 1.5) / 100));
    }
}