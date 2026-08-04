<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\ReferralAgent;
use App\Models\ReferralCommission;
use App\Models\ReferralPayout;
use App\Services\PaystackService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class PartnerReferralWorkflowTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_it_registers_updates_and_processes_partner_referral_workflows_with_structured_payloads(): void
    {
        $tenant = $this->createTenantContext('general', 'partner-referral@example.com');
        Sanctum::actingAs($tenant['user']);

        $registerResponse = $this->postJson('/api/partners/register', [
            'first_name' => 'Amina',
            'last_name' => 'Sani',
            'email' => 'amina.agent@example.com',
            'phone' => '08030080001',
            'agent_type' => ReferralAgent::TYPE_AFFILIATE,
        ])->assertCreated();

        $agentId = $registerResponse->json('data.id');

        $registerResponse
            ->assertJsonPath('data.business_id', $tenant['business']->id)
            ->assertJsonPath('data.status', ReferralAgent::STATUS_PENDING)
            ->assertJsonPath('data.agent_type', ReferralAgent::TYPE_AFFILIATE);

        $this->patchJson("/api/partners/{$agentId}", [
            'bank_name' => 'First Bank',
            'account_number' => '1234567890',
            'account_name' => 'Amina Sani',
            'bank_code' => '011',
            'payment_method' => 'bank_transfer',
        ])
            ->assertOk()
            ->assertJsonPath('data.bank_name', 'First Bank')
            ->assertJsonPath('data.account_number', '****7890');

        $this->postJson("/api/partners/{$agentId}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', ReferralAgent::STATUS_ACTIVE);

        $agent = ReferralAgent::findOrFail($agentId);
        $agent->forceFill([
            'pending_payout' => 9000,
            'total_earnings' => 9000,
        ])->save();

        $payoutResponse = $this->postJson('/api/partners/payouts', [
            'agent_id' => $agent->id,
            'amount' => 4000,
        ])->assertCreated();

        $payoutId = $payoutResponse->json('data.id');

        $payoutResponse
            ->assertJsonPath('data.agent.id', $agent->id)
            ->assertJsonPath('data.status', ReferralPayout::STATUS_PENDING);

        $this->app->instance(PaystackService::class, new class
        {
            public function transfer($amount, $bankCode, $accountNumber, $accountName): array
            {
                return [
                    'success' => true,
                    'reference' => 'PAYSTACK-REF-001',
                ];
            }
        });

        $this->postJson("/api/partners/payouts/{$payoutId}/process", [
            'gateway' => 'paystack',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', ReferralPayout::STATUS_COMPLETED)
            ->assertJsonPath('data.gateway_reference', 'PAYSTACK-REF-001');
    }

    public function test_it_denies_cross_tenant_partner_referral_actions(): void
    {
        $tenant = $this->createTenantContext('general', 'partner-referral-scope@example.com');
        $otherTenant = $this->createTenantContext('general', 'partner-referral-foreign@example.com');

        $foreignAgent = ReferralAgent::create([
            'business_id' => $otherTenant['business']->id,
            'referral_code' => 'FOREIGN01',
            'first_name' => 'Foreign',
            'last_name' => 'Agent',
            'status' => ReferralAgent::STATUS_ACTIVE,
            'agent_type' => ReferralAgent::TYPE_RESELLER,
            'tier' => ReferralAgent::TIER_BRONZE,
            'commission_rate' => 20,
            'recurring_rate' => 5,
            'pending_payout' => 7000,
            'payment_method' => 'bank_transfer',
        ]);

        $foreignCommission = ReferralCommission::create([
            'agent_id' => $foreignAgent->id,
            'referred_business_id' => $otherTenant['business']->id,
            'type' => ReferralCommission::TYPE_BONUS,
            'status' => ReferralCommission::STATUS_PENDING,
            'amount' => 1200,
            'rate_applied' => 5,
            'currency' => 'NGN',
            'description' => 'Foreign tenant commission',
        ]);

        $foreignPayout = ReferralPayout::create([
            'agent_id' => $foreignAgent->id,
            'payout_number' => 'PYT-FOREIGN-00001',
            'amount' => 3000,
            'fees' => 45,
            'net_amount' => 2955,
            'currency' => 'NGN',
            'status' => ReferralPayout::STATUS_PENDING,
            'payment_method' => 'bank_transfer',
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->getJson("/api/partners/{$foreignAgent->id}")
            ->assertStatus(403);

        $this->patchJson("/api/partners/{$foreignAgent->id}", [
            'phone' => '08035550000',
        ])->assertStatus(403);

        $this->postJson("/api/partners/{$foreignAgent->id}/approve")
            ->assertStatus(403);

        $this->postJson('/api/partners/payouts', [
            'agent_id' => $foreignAgent->id,
            'amount' => 2000,
        ])->assertStatus(422);

        $this->getJson("/api/partners/commissions?agent_id={$foreignAgent->id}")
            ->assertStatus(422);

        $this->getJson("/api/partners/payouts?agent_id={$foreignAgent->id}")
            ->assertStatus(422);

        $this->postJson("/api/partners/commissions/{$foreignCommission->id}/approve")
            ->assertStatus(403);

        $this->postJson("/api/partners/payouts/{$foreignPayout->id}/process", [
            'gateway' => 'paystack',
        ])->assertStatus(403);
    }
}
