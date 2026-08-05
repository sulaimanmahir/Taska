<?php

namespace Tests\Feature;

use App\Models\MobileAgentFloatRequest;
use App\Models\MobileAgentFraudAlert;
use App\Models\MobileAgentTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class MobileAgentWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_mobile_agent_business_can_approve_float_requests_and_log_reversals(): void
    {
        $tenant = $this->createTenantContext('mobile_agent', 'agent-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $floatRequest = MobileAgentFloatRequest::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'staff_id' => $tenant['user']->id,
            'agent_name' => 'Sani Musa',
            'requested_amount' => 25000,
            'status' => 'pending',
            'reason' => 'Weekend liquidity top-up',
            'requested_at' => now()->subHour(),
        ]);

        $transaction = MobileAgentTransaction::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'staff_id' => $tenant['user']->id,
            'agent_name' => 'Sani Musa',
            'service_type' => 'cash_out',
            'transaction_reference' => 'AGT-001',
            'transaction_amount' => 12000,
            'commission_amount' => 240,
            'cash_delta' => 12000,
            'float_delta' => -12000,
            'closing_float_balance' => 8000,
            'status' => 'completed',
            'is_reversal_requested' => false,
            'processed_at' => now()->subMinutes(15),
        ]);

        $this->postJson("/api/mobile-agent/float-requests/{$floatRequest->id}/approve", [
            'approved_amount' => 20000,
        ])->assertOk()
            ->assertJsonPath('status', 'approved')
            ->assertJsonPath('approved_amount', '20000.00');

        $this->postJson('/api/mobile-agent/reversals', [
            'mobile_agent_transaction_id' => $transaction->id,
            'reason' => 'Customer account debit failed upstream',
            'amount' => 12000,
            'resolution_notes' => 'Awaiting switch confirmation',
        ])->assertCreated()
            ->assertJsonPath('status', 'pending')
            ->assertJsonPath('amount', '12000.00')
            ->assertJsonPath('transaction.status', 'reversal_pending')
            ->assertJsonPath('transaction.is_reversal_requested', true);
    }

    public function test_mobile_agent_business_can_record_transactions_and_shortages(): void
    {
        $tenant = $this->createTenantContext('mobile_agent', 'agent-ops@example.com');

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/mobile-agent/transactions', [
            'branch_id' => $tenant['branch']->id,
            'staff_id' => $tenant['user']->id,
            'agent_name' => 'Bashir Musa',
            'service_type' => 'cash_out',
            'transaction_amount' => 120000,
            'cash_delta' => 120000,
            'float_delta' => -120000,
            'flag_fraud' => true,
            'notes' => 'Large end-of-day withdrawal',
        ])->assertCreated()
            ->assertJsonPath('agent_name', 'Bashir Musa')
            ->assertJsonPath('status', 'completed')
            ->assertJsonPath('closing_float_balance', '-120000.00');

        $this->assertSame(1, MobileAgentFraudAlert::where('business_id', $tenant['business']->id)->count());

        $this->postJson('/api/mobile-agent/shortages', [
            'branch_id' => $tenant['branch']->id,
            'staff_id' => $tenant['user']->id,
            'agent_name' => 'Bashir Musa',
            'shortage_amount' => 7000,
            'recovered_amount' => 1000,
            'reason' => 'Till imbalance after reconciliation',
        ])->assertCreated()
            ->assertJsonPath('shortage_amount', '7000.00')
            ->assertJsonPath('recovered_amount', '1000.00')
            ->assertJsonPath('status', 'open');

        $this->assertSame(2, MobileAgentFraudAlert::where('business_id', $tenant['business']->id)->count());
    }

    public function test_mobile_agent_float_and_reversal_actions_are_hidden_from_other_businesses(): void
    {
        $tenant = $this->createTenantContext('mobile_agent', 'primary-agent@example.com');
        $otherTenant = $this->createTenantContext('mobile_agent', 'secondary-agent@example.com');

        $floatRequest = MobileAgentFloatRequest::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'staff_id' => $tenant['user']->id,
            'agent_name' => 'Sani Musa',
            'requested_amount' => 18000,
            'status' => 'pending',
            'requested_at' => now(),
        ]);

        $transaction = MobileAgentTransaction::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'staff_id' => $tenant['user']->id,
            'agent_name' => 'Sani Musa',
            'service_type' => 'transfer',
            'transaction_reference' => 'AGT-002',
            'transaction_amount' => 5000,
            'commission_amount' => 100,
            'cash_delta' => 0,
            'float_delta' => -5000,
            'closing_float_balance' => 15000,
            'status' => 'completed',
            'is_reversal_requested' => false,
            'processed_at' => now(),
        ]);

        Sanctum::actingAs($otherTenant['user']);

        $this->postJson("/api/mobile-agent/float-requests/{$floatRequest->id}/approve", [
            'approved_amount' => 18000,
        ])->assertForbidden();

        $this->postJson('/api/mobile-agent/reversals', [
            'mobile_agent_transaction_id' => $transaction->id,
            'reason' => 'Unauthorized reversal attempt',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['mobile_agent_transaction_id']);
    }
}
