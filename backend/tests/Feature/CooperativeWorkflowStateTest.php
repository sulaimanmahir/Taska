<?php

namespace Tests\Feature;

use App\Models\Cooperative;
use App\Models\CooperativeFinancing;
use App\Models\CooperativeMember;
use App\Models\CooperativeProfitCycle;
use App\Models\CooperativeProfitDistribution;
use App\Models\CooperativeWallet;
use App\Models\Customer;
use Laravel\Sanctum\Sanctum;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class CooperativeWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_it_updates_financing_status_with_resource_payload_and_wallet_effects(): void
    {
        $tenant = $this->createTenantContext('general', 'coop-workflow@example.com');
        [$cooperative, $member] = $this->createCooperativeMemberContext($tenant['business']->id, $tenant['branch']->id);

        CooperativeWallet::create([
            'cooperative_id' => $cooperative->id,
            'business_id' => $tenant['business']->id,
            'wallet_type' => 'main',
            'balance' => 10000,
            'currency' => 'NGN',
        ]);

        CooperativeWallet::create([
            'cooperative_id' => $cooperative->id,
            'business_id' => $tenant['business']->id,
            'wallet_type' => 'financing_fund',
            'balance' => 8000,
            'currency' => 'NGN',
        ]);

        $financing = CooperativeFinancing::create([
            'cooperative_id' => $cooperative->id,
            'business_id' => $tenant['business']->id,
            'member_id' => $member->id,
            'financing_type' => 'qard_hasan',
            'status' => 'pending_admin_approval',
            'amount_requested' => 5000,
            'submitted_at' => now(),
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->patchJson("/api/cooperative/financing/{$financing->id}/status", [
            'status' => 'disbursed',
            'amount_disbursed' => 4000,
            'admin_override_reason' => 'Committee approval confirmed.',
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'disbursed')
            ->assertJsonPath('data.amount_disbursed', '4000.00')
            ->assertJsonPath('data.override_by_user_id', $tenant['user']->id)
            ->assertJsonPath('data.member.customer.name', 'Amina Bello');

        $this->assertDatabaseHas('cooperative_financing', [
            'id' => $financing->id,
            'status' => 'disbursed',
            'amount_disbursed' => 4000,
            'override_by_user_id' => $tenant['user']->id,
        ]);

        $this->assertDatabaseHas('cooperative_wallets', [
            'cooperative_id' => $cooperative->id,
            'wallet_type' => 'main',
            'balance' => 6000,
        ]);

        $this->assertDatabaseHas('cooperative_wallets', [
            'cooperative_id' => $cooperative->id,
            'wallet_type' => 'financing_fund',
            'balance' => 4000,
        ]);
    }

    public function test_it_distributes_profit_and_rejects_foreign_tenant_state_actions(): void
    {
        $tenant = $this->createTenantContext('general', 'coop-state@example.com');
        $otherTenant = $this->createTenantContext('general', 'coop-state-other@example.com');

        [$cooperative, $member] = $this->createCooperativeMemberContext($tenant['business']->id, $tenant['branch']->id);
        [$foreignCooperative, $foreignMember] = $this->createCooperativeMemberContext($otherTenant['business']->id, $otherTenant['branch']->id, 'Foreign Member');

        $localCycle = CooperativeProfitCycle::create([
            'cooperative_id' => $cooperative->id,
            'business_id' => $tenant['business']->id,
            'label' => 'Q2 Surplus Cycle',
            'cycle_start' => now()->subMonth()->toDateString(),
            'cycle_end' => now()->toDateString(),
            'total_profit' => 12000,
            'distributable_profit' => 10000,
            'reserve_allocation' => 1000,
            'charity_allocation' => 1000,
            'status' => 'approved',
        ]);

        CooperativeProfitDistribution::create([
            'profit_cycle_id' => $localCycle->id,
            'member_id' => $member->id,
            'shares_at_record' => 5,
            'ownership_percent' => 100,
            'amount' => 10000,
            'status' => 'pending',
        ]);

        $foreignFinancing = CooperativeFinancing::create([
            'cooperative_id' => $foreignCooperative->id,
            'business_id' => $otherTenant['business']->id,
            'member_id' => $foreignMember->id,
            'financing_type' => 'qard_hasan',
            'status' => 'pending_admin_approval',
            'amount_requested' => 3000,
            'submitted_at' => now(),
        ]);

        $foreignCycle = CooperativeProfitCycle::create([
            'cooperative_id' => $foreignCooperative->id,
            'business_id' => $otherTenant['business']->id,
            'label' => 'Foreign Cycle',
            'cycle_start' => now()->subMonth()->toDateString(),
            'cycle_end' => now()->toDateString(),
            'total_profit' => 9000,
            'distributable_profit' => 7500,
            'reserve_allocation' => 1000,
            'charity_allocation' => 500,
            'status' => 'approved',
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson("/api/cooperative/profit-cycles/{$localCycle->id}/distribute")
            ->assertOk()
            ->assertJsonPath('data.status', 'distributed')
            ->assertJsonPath('data.distributions.0.member.customer.name', 'Amina Bello');

        $this->assertDatabaseHas('cooperative_profit_cycles', [
            'id' => $localCycle->id,
            'status' => 'distributed',
        ]);

        $this->patchJson("/api/cooperative/financing/{$foreignFinancing->id}/status", [
            'status' => 'approved',
        ])->assertStatus(403);

        $this->postJson("/api/cooperative/profit-cycles/{$foreignCycle->id}/distribute")
            ->assertStatus(403);
    }

    private function createCooperativeMemberContext(int $businessId, int $branchId, string $customerName = 'Amina Bello'): array
    {
        $cooperative = Cooperative::create([
            'business_id' => $businessId,
            'name' => 'Taska Cooperative',
            'slug' => 'taska-cooperative-'.$businessId,
            'share_price' => 1000,
            'minimum_member_shares' => 1,
            'profit_cycle' => 'monthly',
            'status' => 'active',
        ]);

        $customer = Customer::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'name' => $customerName,
            'email' => str()->slug($customerName).'-'.$businessId.'@example.com',
            'phone' => '080300000'.str_pad((string) random_int(0, 999), 3, '0', STR_PAD_LEFT),
            'customer_type' => 'retailer',
            'is_active' => true,
        ]);

        $member = CooperativeMember::create([
            'cooperative_id' => $cooperative->id,
            'business_id' => $businessId,
            'customer_id' => $customer->id,
            'member_number' => 'COOP-'.$businessId,
            'role' => 'member',
            'joined_at' => today()->toDateString(),
            'status' => 'active',
        ]);

        return [$cooperative, $member];
    }
}
