<?php

namespace App\Services;

use App\Models\SubscriptionPlan;
use App\Models\SubscriptionPlanFeature;
use App\Models\BillingNotification;
use App\Models\BusinessSubscription;
use App\Models\Business;
use App\Models\Invoice;
use App\Models\PaymentAttempt;
use App\Models\PaymentMethod;
use App\Models\SubscriptionUsage;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BillingService
{
    public function getPlans(): \Illuminate\Database\Eloquent\Collection
    {
        return SubscriptionPlan::where('is_active', true)
            ->with('features')
            ->orderBy('display_order')
            ->get();
    }

    public function getPlanBySlug(string $slug): ?SubscriptionPlan
    {
        return SubscriptionPlan::where('slug', $slug)
            ->with('features')
            ->first();
    }

    public function createTrialSubscription(Business $business): BusinessSubscription
    {
        $freePlan = SubscriptionPlan::where('slug', 'free')->first();
        if (!$freePlan) {
            throw new \RuntimeException('Free plan not found');
        }

        return DB::transaction(function () use ($business, $freePlan) {
            $subscription = BusinessSubscription::create([
                'business_id' => $business->id,
                'plan_id' => $freePlan->id,
                'status' => BusinessSubscription::STATUS_TRIAL,
                'starts_at' => now(),
                'ends_at' => now()->addDays(14),
                'billing_cycle' => 'monthly',
            ]);

            foreach ($freePlan->features as $feature) {
                SubscriptionUsage::create([
                    'subscription_id' => $subscription->id,
                    'feature_key' => $feature->feature_key,
                    'current_usage' => 0,
                    'limit_value' => $feature->getIntValue(),
                ]);
            }

            return $subscription;
        });
    }

    public function subscribe(Business $business, int $planId, string $billingCycle = 'monthly'): BusinessSubscription
    {
        $plan = SubscriptionPlan::findOrFail($planId);
        $price = $billingCycle === 'yearly' ? $plan->yearly_price : $plan->monthly_price;

        return DB::transaction(function () use ($business, $plan, $billingCycle, $price) {
            $existing = $business->subscription;
            if ($existing && $existing->isActive()) {
                $existing->status = BusinessSubscription::STATUS_EXPIRED;
                $existing->save();
            }

            $subscription = BusinessSubscription::create([
                'business_id' => $business->id,
                'plan_id' => $plan->id,
                'status' => BusinessSubscription::STATUS_ACTIVE,
                'starts_at' => now(),
                'ends_at' => $billingCycle === 'yearly' 
                    ? now()->addYear() 
                    : now()->addMonth(),
                'billing_cycle' => $billingCycle,
                'amount_paid' => $price,
            ]);

            foreach ($plan->features as $feature) {
                SubscriptionUsage::create([
                    'subscription_id' => $subscription->id,
                    'feature_key' => $feature->feature_key,
                    'current_usage' => 0,
                    'limit_value' => $feature->getIntValue(),
                ]);
            }

            $invoice = $this->createInvoice($business, $subscription, $price, 'subscription');

            return $subscription;
        });
    }

    public function createInvoice(Business $business, BusinessSubscription $subscription, float $amount, string $type): Invoice
    {
        return Invoice::create([
            'business_id' => $business->id,
            'subscription_id' => $subscription->id,
            'invoice_number' => $this->generateInvoiceNumber($business->id),
            'type' => $type,
            'subtotal' => $amount,
            'tax' => 0,
            'total' => $amount,
            'currency' => $business->currency ?? 'NGN',
            'status' => Invoice::STATUS_PENDING,
            'due_date' => now()->addDays(7),
        ]);
    }

    public function processPayment(Invoice $invoice, PaymentMethod $method, string $gateway): bool
    {
        $paymentService = app($this->getGatewayClass($gateway));
        $result = $paymentService->charge($method->gateway_token, $invoice->total, $invoice->currency);

        if ($result['success']) {
            $invoice->markAsPaid($gateway, $result['reference']);
            $subscription = $invoice->subscription;
            $subscription->status = BusinessSubscription::STATUS_ACTIVE;
            $subscription->is_auto_renew = true;
            $subscription->save();
            return true;
        }

        $invoice->paymentAttempts()->create([
            'payment_method_id' => $method->id,
            'gateway' => $gateway,
            'reference' => $result['reference'] ?? Str::random(16),
            'status' => PaymentAttempt::STATUS_FAILED,
            'amount' => $invoice->total,
            'failure_reason' => $result['error'] ?? 'Payment failed',
            'attempt_number' => $invoice->paymentAttempts()->count() + 1,
        ]);

        return false;
    }

    public function handleAutoRenewal(BusinessSubscription $subscription): bool
    {
        if (!$subscription->is_auto_renew) {
            return false;
        }

        $consent = $subscription->business->autoRenewConsent()->first();
        if (!$consent || !$consent->isActive()) {
            return false;
        }

        $method = $consent->paymentMethod;
        if (!$method || $method->isExpired()) {
            return false;
        }

        $price = $subscription->billing_cycle === 'yearly'
            ? $subscription->plan->yearly_price
            : $subscription->plan->monthly_price;

        $invoice = $this->createInvoice($subscription->business, $subscription, $price, 'renewal');

        return $this->processPayment($invoice, $method, $method->provider);
    }

    public function checkAndExpireSubscriptions(): void
    {
        BusinessSubscription::where('status', BusinessSubscription::STATUS_ACTIVE)
            ->where('ends_at', '<', now())
            ->each(function ($subscription) {
                $subscription->status = BusinessSubscription::STATUS_EXPIRED;
                $subscription->save();

                $subscription->business->billingNotifications()->create([
                    'type' => BillingNotification::TYPE_EXPIRY,
                    'channel' => BillingNotification::CHANNEL_IN_APP,
                    'subject' => 'Subscription Expired',
                    'message' => 'Your subscription has expired. Please renew to continue using premium features.',
                ]);
            });
    }

    public function sendRenewalReminders(): void
    {
        $reminderDays = [7, 3, 1];

        foreach ($reminderDays as $days) {
            $targetDate = Carbon::today()->addDays($days)->toDateString();

            BusinessSubscription::where('status', BusinessSubscription::STATUS_ACTIVE)
                ->whereDate('ends_at', $targetDate)
                ->each(function ($subscription) use ($days) {
                    $subscription->business->billingNotifications()->firstOrCreate([
                        'type' => BillingNotification::TYPE_RENEWAL_REMINDER,
                        'channel' => BillingNotification::CHANNEL_IN_APP,
                    ], [
                        'subject' => 'Subscription Renewal Reminder',
                        'message' => "Your subscription renews in {$days} day(s).",
                        'is_sent' => true,
                        'sent_at' => now(),
                    ]);
                });
        }
    }

    public function incrementUsage(Business $business, string $featureKey, int $amount = 1): bool
    {
        $subscription = $business->activeSubscription()->first();
        if (!$subscription) {
            return false;
        }

        $usage = $subscription->usage()->where('feature_key', $featureKey)->first();
        if (!$usage) {
            return false;
        }

        $usage->incrementUsage($amount);
        return true;
    }

    public function checkLimit(Business $business, string $featureKey): array
    {
        $subscription = $business->activeSubscription()->first();
        if (!$subscription) {
            return ['allowed' => true, 'remaining' => 999];
        }

        $usage = $subscription->usage()->where('feature_key', $featureKey)->first();
        if (!$usage) {
            return ['allowed' => true, 'remaining' => 999];
        }

        return [
            'allowed' => !$usage->isAtLimit(),
            'remaining' => $usage->remaining(),
            'current' => $usage->current_usage,
            'limit' => $usage->limit_value,
        ];
    }

    private function generateInvoiceNumber(int $businessId): string
    {
        $prefix = 'INV';
        $date = now()->format('Ymd');
        $sequence = str_pad(Invoice::where('business_id', $businessId)->count() + 1, 5, '0', STR_PAD_LEFT);
        return "{$prefix}-{$date}-{$sequence}";
    }

    private function getGatewayClass(string $gateway): string
    {
        return match ($gateway) {
            'paystack' => PaystackService::class,
            'flutterwave' => FlutterwaveService::class,
            default => throw new \InvalidArgumentException("Unknown gateway: {$gateway}"),
        };
    }
}
