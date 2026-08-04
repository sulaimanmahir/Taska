<?php

namespace Tests\Feature;

use App\Models\BusinessSubscription;
use App\Models\Invoice;
use App\Models\PaymentAttempt;
use App\Models\PaymentMethod;
use App\Models\SubscriptionPlan;
use App\Models\SubscriptionPlanFeature;
use App\Models\SubscriptionUsage;
use App\Services\PaystackService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class BillingWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_it_subscribes_initializes_payments_and_manages_payment_methods_with_structured_payloads(): void
    {
        $tenant = $this->createTenantContext('general', 'billing-workflow@example.com');
        Sanctum::actingAs($tenant['user']);

        $plan = SubscriptionPlan::create([
            'name' => 'Growth',
            'slug' => 'growth',
            'monthly_price' => 12000,
            'yearly_price' => 120000,
            'is_active' => true,
            'is_featured' => true,
        ]);

        SubscriptionPlanFeature::create([
            'plan_id' => $plan->id,
            'feature_key' => 'staff_limit',
            'feature_name' => 'Staff Limit',
            'value_type' => 'integer',
            'value' => '5',
            'sort_order' => 1,
        ]);

        $subscribeResponse = $this->postJson('/api/billing/subscribe', [
            'plan_id' => $plan->id,
            'billing_cycle' => 'monthly',
        ])->assertCreated();

        $subscriptionId = $subscribeResponse->json('data.id');

        $subscribeResponse
            ->assertJsonPath('data.status', BusinessSubscription::STATUS_ACTIVE)
            ->assertJsonPath('data.plan.slug', 'growth')
            ->assertJsonPath('data.usage.0.feature_key', 'staff_limit');

        $subscription = BusinessSubscription::findOrFail($subscriptionId);
        SubscriptionUsage::where('subscription_id', $subscription->id)
            ->where('feature_key', 'staff_limit')
            ->update(['current_usage' => 2]);

        $invoice = Invoice::where('business_id', $tenant['business']->id)->latest('id')->firstOrFail();

        $this->app->instance(PaystackService::class, new class
        {
            public function initializeTransaction($amount, $email): array
            {
                return [
                    'success' => true,
                    'reference' => 'PAY-INIT-001',
                    'authorization_url' => 'https://pay.example/authorize/PAY-INIT-001',
                ];
            }

            public function verifyTransaction($reference): array
            {
                return [
                    'success' => true,
                    'reference' => $reference,
                ];
            }
        });

        $this->postJson('/api/billing/init-payment', [
            'invoice_id' => $invoice->id,
            'gateway' => 'paystack',
        ])
            ->assertOk()
            ->assertJsonPath('data.reference', 'PAY-INIT-001');

        $attempt = PaymentAttempt::where('reference', 'PAY-INIT-001')->firstOrFail();

        $this->postJson('/api/billing/verify-payment', [
            'reference' => 'PAY-INIT-001',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Payment verified');

        $attempt->refresh();
        $invoice->refresh();

        $this->assertSame(PaymentAttempt::STATUS_SUCCESS, $attempt->status);
        $this->assertSame(Invoice::STATUS_PAID, $invoice->status);

        $this->postJson('/api/billing/payment-methods', [
            'type' => PaymentMethod::TYPE_CARD,
            'provider' => 'paystack',
            'gateway_token' => 'tok_live_123',
            'last_four' => '4242',
            'brand' => 'Visa',
            'expiry_month' => 12,
            'expiry_year' => now()->year + 2,
        ])
            ->assertCreated()
            ->assertJsonPath('data.provider', 'paystack')
            ->assertJsonPath('data.is_default', true);

        $this->getJson('/api/billing/subscription')
            ->assertOk()
            ->assertJsonPath('data.plan.slug', 'growth')
            ->assertJsonPath('data.usage.0.current', 2);

        $this->getJson("/api/billing/invoices/{$invoice->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $invoice->id)
            ->assertJsonPath('data.status', Invoice::STATUS_PAID);

        $this->getJson('/api/billing/check-limit?feature_key=staff_limit')
            ->assertOk()
            ->assertJsonPath('data.current', 2)
            ->assertJsonPath('data.limit', 5)
            ->assertJsonPath('data.remaining', 3);
    }

    public function test_it_denies_cross_tenant_invoice_and_payment_attempt_access(): void
    {
        $tenant = $this->createTenantContext('general', 'billing-scope@example.com');
        $otherTenant = $this->createTenantContext('general', 'billing-scope-other@example.com');

        $plan = SubscriptionPlan::create([
            'name' => 'Foreign Billing Plan',
            'slug' => 'foreign-billing-plan',
            'monthly_price' => 8000,
            'yearly_price' => 80000,
            'is_active' => true,
        ]);

        $foreignSubscription = BusinessSubscription::create([
            'business_id' => $otherTenant['business']->id,
            'plan_id' => $plan->id,
            'status' => BusinessSubscription::STATUS_ACTIVE,
            'starts_at' => now()->toDateString(),
            'ends_at' => now()->addMonth()->toDateString(),
            'billing_cycle' => 'monthly',
            'amount_paid' => 8000,
            'currency' => 'NGN',
        ]);

        $foreignInvoice = Invoice::create([
            'business_id' => $otherTenant['business']->id,
            'subscription_id' => $foreignSubscription->id,
            'invoice_number' => 'INV-FOREIGN-00001',
            'type' => Invoice::TYPE_SUBSCRIPTION,
            'subtotal' => 8000,
            'tax' => 0,
            'total' => 8000,
            'currency' => 'NGN',
            'status' => Invoice::STATUS_PENDING,
            'due_date' => now()->addDays(7)->toDateString(),
        ]);

        $foreignAttempt = PaymentAttempt::create([
            'invoice_id' => $foreignInvoice->id,
            'gateway' => 'paystack',
            'reference' => 'FOREIGN-PAY-001',
            'status' => PaymentAttempt::STATUS_PENDING,
            'amount' => 8000,
            'currency' => 'NGN',
            'attempt_number' => 1,
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->getJson("/api/billing/invoices/{$foreignInvoice->id}")
            ->assertStatus(403);

        $this->postJson('/api/billing/init-payment', [
            'invoice_id' => $foreignInvoice->id,
            'gateway' => 'paystack',
        ])->assertStatus(422);

        $this->postJson('/api/billing/verify-payment', [
            'reference' => $foreignAttempt->reference,
        ])->assertStatus(403);
    }
}
