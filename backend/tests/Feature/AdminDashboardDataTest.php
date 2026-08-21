<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Invoice;
use App\Models\ReferralAgent;
use App\Models\ReferralCommission;
use App\Models\ReferralPayout;
use App\Models\SubscriptionPlan;
use App\Models\SupportTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

/**
 * AdminController used to reference App\Models\Transaction/Subscription/
 * SupportTicket/Referral and a Business::owner() relation, none of which
 * existed - every endpoint fatal-errored. These tests exercise the rewired
 * version against real models (BusinessSubscription/Invoice/
 * ReferralCommission/ReferralPayout) to prove it actually returns real
 * data now, not just that it doesn't crash.
 */
class AdminDashboardDataTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    private function actingAsPlatformAdmin(): array
    {
        $tenant = $this->createTenantContext('retail', 'platform-admin-dashboard@example.com');
        $tenant['user']->forceFill(['is_platform_admin' => true])->save();
        Sanctum::actingAs($tenant['user']);

        return $tenant;
    }

    public function test_business_owner_resolves_to_the_earliest_joined_admin_role_member(): void
    {
        $tenant = $this->createTenantContext('retail', 'owner-resolution@example.com');

        $owner = $tenant['business']->owner();

        $this->assertNotNull($owner);
        $this->assertSame($tenant['user']->id, $owner->id);
    }

    public function test_stats_reports_real_invoice_revenue_and_pending_payouts(): void
    {
        $tenant = $this->actingAsPlatformAdmin();

        Invoice::create([
            'business_id' => $tenant['business']->id,
            'invoice_number' => 'INV-STATS-001',
            'type' => 'subscription',
            'total' => 15000,
            'status' => Invoice::STATUS_PAID,
            'paid_at' => now(),
        ]);
        // A pending (unpaid) invoice must not count toward monthly revenue.
        Invoice::create([
            'business_id' => $tenant['business']->id,
            'invoice_number' => 'INV-STATS-002',
            'type' => 'subscription',
            'total' => 9000,
            'status' => Invoice::STATUS_PENDING,
        ]);

        $agent = ReferralAgent::create([
            'business_id' => $tenant['business']->id,
            'referral_code' => 'STATS-AGENT',
            'first_name' => 'Amina',
            'last_name' => 'Bello',
            'agent_type' => 'affiliate',
            'tier' => 'bronze',
        ]);
        ReferralPayout::create([
            'agent_id' => $agent->id,
            'payout_number' => 'PAYOUT-STATS-001',
            'amount' => 5000,
            'net_amount' => 5000,
            'status' => 'pending',
            'payment_method' => 'bank_transfer',
        ]);

        $response = $this->getJson('/api/admin/stats')->assertOk();

        $response->assertJsonPath('data.monthlyRevenue', 15000)
            ->assertJsonPath('data.pendingPayouts', 1);
    }

    public function test_users_endpoint_shows_real_business_and_plan_data(): void
    {
        $tenant = $this->actingAsPlatformAdmin();

        $plan = SubscriptionPlan::create([
            'name' => 'Growth',
            'slug' => 'growth',
            'monthly_price' => 25000,
        ]);

        \App\Models\BusinessSubscription::create([
            'business_id' => $tenant['business']->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now(),
        ]);

        $response = $this->getJson('/api/admin/users')->assertOk();

        $row = collect($response->json('data'))->firstWhere('id', $tenant['user']->id);
        $this->assertSame($tenant['business']->name, $row['business_name']);
        $this->assertSame('growth', $row['plan']);
    }

    public function test_businesses_endpoint_shows_the_real_owner(): void
    {
        $tenant = $this->actingAsPlatformAdmin();

        $response = $this->getJson('/api/admin/businesses')->assertOk();

        $row = collect($response->json('data'))->firstWhere('id', $tenant['business']->id);
        $this->assertSame($tenant['user']->name, $row['owner_name']);
        $this->assertSame($tenant['user']->email, $row['owner_email']);
    }

    public function test_plans_endpoint_returns_real_subscription_plans(): void
    {
        $tenant = $this->actingAsPlatformAdmin();

        SubscriptionPlan::create([
            'name' => 'Starter',
            'slug' => 'starter',
            'monthly_price' => 5000,
            'display_order' => 1,
        ]);

        $this->getJson('/api/admin/plans')
            ->assertOk()
            ->assertJsonPath('data.0.slug', 'starter');
    }

    public function test_transactions_endpoint_shows_real_invoices_with_the_paying_businesss_owner(): void
    {
        $tenant = $this->actingAsPlatformAdmin();

        Invoice::create([
            'business_id' => $tenant['business']->id,
            'invoice_number' => 'INV-TX-001',
            'type' => 'subscription',
            'total' => 12000,
            'status' => Invoice::STATUS_PAID,
            'gateway_reference' => 'ref-123',
            'paid_at' => now(),
        ]);

        $response = $this->getJson('/api/admin/transactions')->assertOk();

        $row = collect($response->json('data'))->firstWhere('reference', 'ref-123');
        $this->assertNotNull($row);
        $this->assertSame($tenant['user']->name, $row['user_name']);
        $this->assertSame('12000.00', $row['amount']);
    }

    public function test_referrals_endpoint_shows_real_commission_data(): void
    {
        $tenant = $this->actingAsPlatformAdmin();
        $referredBusiness = $this->createTenantContext('retail', 'referred-business@example.com')['business'];

        $agent = ReferralAgent::create([
            'business_id' => $tenant['business']->id,
            'referral_code' => 'REF-AGENT-001',
            'first_name' => 'Chidi',
            'last_name' => 'Okoro',
            'agent_type' => 'affiliate',
            'tier' => 'gold',
        ]);

        ReferralCommission::create([
            'agent_id' => $agent->id,
            'referred_business_id' => $referredBusiness->id,
            'type' => 'first_purchase',
            'status' => 'approved',
            'amount' => 3000,
            'rate_applied' => 20,
        ]);

        $response = $this->getJson('/api/admin/referrals')->assertOk();

        $row = collect($response->json('data'))->first();
        $this->assertSame('Chidi Okoro', $row['referrer_name']);
        $this->assertSame($referredBusiness->name, $row['referred_name']);
        $this->assertSame('3000.00', $row['commission']);
    }

    public function test_support_tickets_endpoint_shows_real_tickets_across_every_business(): void
    {
        $tenant = $this->actingAsPlatformAdmin();

        SupportTicket::create([
            'business_id' => $tenant['business']->id,
            'created_by' => $tenant['user']->id,
            'subject' => 'Cannot print receipts',
            'message' => 'The receipt printer stopped responding after the last update.',
            'status' => SupportTicket::STATUS_OPEN,
        ]);

        $response = $this->getJson('/api/admin/support-tickets')->assertOk();

        $row = collect($response->json('data'))->firstWhere('subject', 'Cannot print receipts');
        $this->assertNotNull($row);
        $this->assertSame($tenant['business']->name, $row['business_name']);
        $this->assertSame($tenant['user']->name, $row['user_name']);
        $this->assertSame('open', $row['status']);
    }

    public function test_resolve_ticket_endpoint_actually_resolves_a_real_ticket(): void
    {
        $tenant = $this->actingAsPlatformAdmin();

        $ticket = SupportTicket::create([
            'business_id' => $tenant['business']->id,
            'created_by' => $tenant['user']->id,
            'subject' => 'Billing question',
            'message' => 'Why was I charged twice this month?',
            'status' => SupportTicket::STATUS_OPEN,
        ]);

        $this->postJson('/api/admin/resolve-ticket', ['id' => $ticket->id])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('support_tickets', [
            'id' => $ticket->id,
            'status' => SupportTicket::STATUS_RESOLVED,
            'resolved_by' => $tenant['user']->id,
        ]);
    }
}
