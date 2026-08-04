<?php

namespace Tests\Unit;

use App\Models\Business;
use App\Models\BusinessSubscription;
use App\Models\Invoice;
use App\Models\PaymentAttempt;
use App\Models\PaymentMethod;
use App\Models\SubscriptionPlan;
use App\Services\BillingService;
use App\Services\PaystackService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BillingServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_process_payment_records_failed_attempts(): void
    {
        $business = $this->createBusiness();
        $plan = $this->createPlan();
        $subscription = BusinessSubscription::create([
            'business_id' => $business->id,
            'plan_id' => $plan->id,
            'status' => BusinessSubscription::STATUS_ACTIVE,
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
            'billing_cycle' => 'monthly',
            'amount_paid' => 0,
        ]);

        $invoice = Invoice::create([
            'business_id' => $business->id,
            'subscription_id' => $subscription->id,
            'invoice_number' => 'INV-TEST-001',
            'type' => Invoice::TYPE_SUBSCRIPTION,
            'subtotal' => 5000,
            'total' => 5000,
            'currency' => 'NGN',
            'status' => Invoice::STATUS_PENDING,
            'due_date' => now()->addDays(7),
        ]);

        $method = PaymentMethod::create([
            'business_id' => $business->id,
            'type' => PaymentMethod::TYPE_CARD,
            'provider' => 'paystack',
            'last_four' => '4242',
            'brand' => 'Visa',
            'expiry_month' => 12,
            'expiry_year' => now()->addYear()->year,
            'gateway_token' => 'tok_test_fail',
            'is_default' => true,
            'is_verified' => true,
        ]);

        $this->app->bind(PaystackService::class, fn () => new class {
            public function charge(string $token, $amount, string $currency): array
            {
                return [
                    'success' => false,
                    'reference' => 'FAIL-REF-001',
                    'error' => 'Gateway refused payment.',
                ];
            }
        });

        $result = app(BillingService::class)->processPayment($invoice, $method, 'paystack');

        $this->assertFalse($result);
        $this->assertDatabaseHas('payment_attempts', [
            'invoice_id' => $invoice->id,
            'payment_method_id' => $method->id,
            'gateway' => 'paystack',
            'reference' => 'FAIL-REF-001',
            'status' => PaymentAttempt::STATUS_FAILED,
            'failure_reason' => 'Gateway refused payment.',
        ]);
    }

    public function test_expired_subscriptions_are_marked_and_notified(): void
    {
        $business = $this->createBusiness();
        $plan = $this->createPlan();

        $subscription = BusinessSubscription::create([
            'business_id' => $business->id,
            'plan_id' => $plan->id,
            'status' => BusinessSubscription::STATUS_ACTIVE,
            'starts_at' => now()->subMonth(),
            'ends_at' => now()->subDay(),
            'billing_cycle' => 'monthly',
            'amount_paid' => 5000,
        ]);

        app(BillingService::class)->checkAndExpireSubscriptions();

        $this->assertSame(
            BusinessSubscription::STATUS_EXPIRED,
            $subscription->fresh()->status
        );
        $this->assertDatabaseHas('billing_notifications', [
            'business_id' => $business->id,
            'type' => 'expiry',
            'channel' => 'in_app',
            'subject' => 'Subscription Expired',
        ]);
    }

    public function test_send_renewal_reminders_uses_portable_date_matching(): void
    {
        $business = $this->createBusiness();
        $plan = $this->createPlan();

        BusinessSubscription::create([
            'business_id' => $business->id,
            'plan_id' => $plan->id,
            'status' => BusinessSubscription::STATUS_ACTIVE,
            'starts_at' => now()->subWeeks(3),
            'ends_at' => now()->addDays(7),
            'billing_cycle' => 'monthly',
            'amount_paid' => 5000,
        ]);

        app(BillingService::class)->sendRenewalReminders();

        $this->assertDatabaseHas('billing_notifications', [
            'business_id' => $business->id,
            'type' => 'renewal_reminder',
            'channel' => 'in_app',
            'subject' => 'Subscription Renewal Reminder',
        ]);
    }

    private function createBusiness(): Business
    {
        return Business::create([
            'name' => 'Billing Test Business',
            'slug' => 'billing-test-business-' . str()->lower(str()->random(4)),
            'email' => 'billing-' . str()->lower(str()->random(4)) . '@example.com',
            'business_type' => 'retail',
            'modules' => [],
            'currency' => 'NGN',
            'is_active' => true,
        ]);
    }

    private function createPlan(): SubscriptionPlan
    {
        return SubscriptionPlan::create([
            'name' => 'Starter',
            'slug' => 'starter-' . str()->lower(str()->random(4)),
            'monthly_price' => 5000,
            'yearly_price' => 50000,
            'display_order' => 1,
            'is_active' => true,
        ]);
    }
}
