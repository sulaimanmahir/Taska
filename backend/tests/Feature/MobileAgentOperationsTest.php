<?php

namespace Tests\Feature;

use App\Models\MobileAgentCommissionTier;
use App\Models\MobileAgentFloatRequest;
use App\Models\MobileAgentTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class MobileAgentOperationsTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_mobile_agent_can_run_float_transaction_reversal_shortage_and_ranking_flow(): void
    {
        $tenant = $this->createTenantContext('mobile_agent', 'agent-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $tierId = $this->postJson('/api/mobile-agent/commission-tiers', [
            'name' => 'Transfer Tier 1',
            'service_type' => 'transfer',
            'minimum_volume' => 0,
            'maximum_volume' => 50000,
            'commission_rate' => 1.5,
            'flat_bonus' => 50,
        ])->assertCreated()->json('id');

        $floatRequestId = $this->postJson('/api/mobile-agent/float-requests', [
            'branch_id' => $tenant['branch']->id,
            'agent_name' => 'Aisha POS',
            'requested_amount' => 30000,
            'reason' => 'Morning float top-up',
        ])->assertCreated()
            ->assertJsonPath('status', 'pending')
            ->json('id');

        $this->postJson("/api/mobile-agent/float-requests/{$floatRequestId}/approve", [
            'approved_amount' => 25000,
        ])->assertOk()
            ->assertJsonPath('status', 'approved')
            ->assertJsonPath('approved_amount', '25000.00');

        $transactionId = $this->postJson('/api/mobile-agent/transactions', [
            'branch_id' => $tenant['branch']->id,
            'commission_tier_id' => $tierId,
            'agent_name' => 'Aisha POS',
            'service_type' => 'transfer',
            'transaction_amount' => 40000,
            'cash_delta' => 40000,
            'float_delta' => -40000,
            'notes' => 'Transfer payout for customer.',
        ])->assertCreated()
            ->assertJsonPath('commission_amount', '650.00')
            ->json('id');

        $this->postJson('/api/mobile-agent/transactions', [
            'branch_id' => $tenant['branch']->id,
            'agent_name' => 'Aisha POS',
            'service_type' => 'cash_in',
            'transaction_amount' => 120000,
            'cash_delta' => 120000,
            'float_delta' => -120000,
            'flag_fraud' => true,
        ])->assertCreated();

        $this->postJson('/api/mobile-agent/reversals', [
            'mobile_agent_transaction_id' => $transactionId,
            'reason' => 'Customer bank switch failed.',
        ])->assertCreated()
            ->assertJsonPath('status', 'pending');

        $this->postJson('/api/mobile-agent/shortages', [
            'branch_id' => $tenant['branch']->id,
            'agent_name' => 'Aisha POS',
            'shortage_amount' => 7000,
            'reason' => 'Cash short at close of day.',
        ])->assertCreated()
            ->assertJsonPath('status', 'open');

        $this->getJson('/api/mobile-agent/overview')
            ->assertOk()
            ->assertJsonPath('summary.float_requests_pending', 0)
            ->assertJsonPath('summary.reversals_pending', 1)
            ->assertJsonPath('summary.shortages_open', 1)
            ->assertJsonPath('summary.fraud_alerts_open', 3)
            ->assertJsonPath('agent_rankings.0.agent_name', 'Aisha POS');
    }

    public function test_mobile_agent_endpoints_reject_foreign_tenant_staff_tiers_and_transactions(): void
    {
        $tenant = $this->createTenantContext('mobile_agent', 'agent-scope@example.com');
        $otherTenant = $this->createTenantContext('mobile_agent', 'agent-other@example.com');

        $foreignStaff = User::factory()->create([
            'email' => 'foreign-agent-staff@example.com',
            'role' => 'staff',
        ]);
        $this->attachActiveMember($foreignStaff, $otherTenant['business']->id);

        $foreignTier = MobileAgentCommissionTier::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Tier',
            'service_type' => 'transfer',
            'minimum_volume' => 0,
            'maximum_volume' => 50000,
            'commission_rate' => 1,
            'flat_bonus' => 0,
            'is_active' => true,
        ]);

        $foreignFloatRequest = MobileAgentFloatRequest::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'staff_id' => $foreignStaff->id,
            'agent_name' => 'Foreign Agent',
            'requested_amount' => 20000,
            'status' => 'pending',
            'requested_at' => now(),
        ]);

        $foreignTransaction = MobileAgentTransaction::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'staff_id' => $foreignStaff->id,
            'commission_tier_id' => $foreignTier->id,
            'agent_name' => 'Foreign Agent',
            'service_type' => 'transfer',
            'transaction_reference' => 'AGT-FOREIGN-001',
            'transaction_amount' => 30000,
            'commission_amount' => 300,
            'cash_delta' => 30000,
            'float_delta' => -30000,
            'closing_float_balance' => 0,
            'status' => 'completed',
            'processed_at' => now(),
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/mobile-agent/float-requests', [
            'branch_id' => $otherTenant['branch']->id,
            'staff_id' => $foreignStaff->id,
            'agent_name' => 'Invalid Float',
            'requested_amount' => 10000,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id', 'staff_id']);

        $this->postJson('/api/mobile-agent/transactions', [
            'branch_id' => $otherTenant['branch']->id,
            'staff_id' => $foreignStaff->id,
            'commission_tier_id' => $foreignTier->id,
            'agent_name' => 'Invalid Txn',
            'service_type' => 'transfer',
            'transaction_amount' => 20000,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id', 'staff_id', 'commission_tier_id']);

        $this->postJson('/api/mobile-agent/reversals', [
            'mobile_agent_transaction_id' => $foreignTransaction->id,
            'reason' => 'Invalid reversal',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['mobile_agent_transaction_id']);

        $this->postJson('/api/mobile-agent/shortages', [
            'branch_id' => $otherTenant['branch']->id,
            'staff_id' => $foreignStaff->id,
            'agent_name' => 'Invalid Shortage',
            'shortage_amount' => 6000,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id', 'staff_id']);

        $this->postJson("/api/mobile-agent/float-requests/{$foreignFloatRequest->id}/approve")
            ->assertStatus(403);
    }

    private function attachActiveMember(User $user, int $businessId): void
    {
        DB::table('business_user')->insert([
            'business_id' => $businessId,
            'user_id' => $user->id,
            'role_id' => null,
            'branch_id' => null,
            'status' => 'active',
            'joined_at' => now(),
            'created_by' => null,
        ]);
    }
}
