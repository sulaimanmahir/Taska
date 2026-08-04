<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\TrustAccount;
use App\Models\TrustTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class TrustFundWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_it_creates_and_updates_trust_accounts_with_resource_payloads(): void
    {
        $tenant = $this->createTenantContext('general', 'trust-workflow@example.com');
        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Aisha Customer',
            'phone' => '08030011111',
            'customer_type' => 'individual',
            'credit_limit' => 0,
            'balance' => 0,
            'is_active' => true,
        ]);

        $createResponse = $this->postJson('/api/trust-accounts', [
            'customer_id' => $customer->id,
            'account_type' => 'credit',
            'limit' => 60000,
            'cycle_name' => 'Retail Top-up',
        ])->assertCreated();

        $accountId = $createResponse->json('id');

        $createResponse
            ->assertJsonPath('account_type', 'credit')
            ->assertJsonPath('available_credit', 60000)
            ->assertJsonPath('customer.name', 'Aisha Customer');

        $this->postJson("/api/trust-accounts/{$accountId}/draw", [
            'amount' => 15000,
            'reference' => 'Initial draw',
        ])
            ->assertOk()
            ->assertJsonPath('balance', '15000.00')
            ->assertJsonPath('available_credit', 45000)
            ->assertJsonPath('customer.balance', '15000.00');

        $this->postJson("/api/trust-accounts/{$accountId}/repay", [
            'amount' => 5000,
            'reference' => 'Part repayment',
        ])
            ->assertOk()
            ->assertJsonPath('balance', '10000.00')
            ->assertJsonPath('total_repaid', '5000.00')
            ->assertJsonPath('available_credit', 50000)
            ->assertJsonPath('customer.balance', '10000.00');

        $this->assertDatabaseHas('trust_accounts', [
            'id' => $accountId,
            'balance' => 10000,
            'total_repaid' => 5000,
        ]);

        $this->assertDatabaseHas('trust_transactions', [
            'trust_account_id' => $accountId,
            'type' => 'draw',
            'amount' => 15000,
            'balance_before' => 0,
            'balance_after' => 15000,
        ]);

        $this->assertDatabaseHas('trust_transactions', [
            'trust_account_id' => $accountId,
            'type' => 'repayment',
            'amount' => -5000,
            'balance_before' => 15000,
            'balance_after' => 10000,
        ]);
    }

    public function test_it_rejects_foreign_tenant_trust_account_actions(): void
    {
        $tenant = $this->createTenantContext('general', 'trust-scope@example.com');
        $otherTenant = $this->createTenantContext('general', 'trust-scope-other@example.com');

        $foreignCustomer = Customer::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Borrower',
            'phone' => '08030022222',
            'customer_type' => 'individual',
            'credit_limit' => 0,
            'balance' => 7000,
            'is_active' => true,
        ]);

        $foreignAccount = TrustAccount::create([
            'business_id' => $otherTenant['business']->id,
            'customer_id' => $foreignCustomer->id,
            'account_type' => 'credit',
            'limit' => 40000,
            'balance' => 7000,
            'status' => 'active',
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->getJson("/api/trust-accounts/{$foreignAccount->id}")
            ->assertStatus(403);

        $this->postJson("/api/trust-accounts/{$foreignAccount->id}/draw", [
            'amount' => 2000,
        ])->assertStatus(403);

        $this->postJson("/api/trust-accounts/{$foreignAccount->id}/repay", [
            'amount' => 1000,
        ])->assertStatus(403);
    }
}
