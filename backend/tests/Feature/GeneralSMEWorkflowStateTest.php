<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class GeneralSMEWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_it_creates_general_sme_operational_records_with_structured_payloads(): void
    {
        $tenant = $this->createTenantContext('mixed', 'general-sme-workflow@example.com');
        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Grace Debtor',
            'phone' => '08030041111',
            'customer_type' => 'retailer',
            'balance' => 12000,
            'is_active' => true,
        ]);

        $assignee = User::factory()->create([
            'email' => 'followup-owner@example.com',
            'role' => 'staff',
        ]);
        $this->attachActiveMember($assignee, $tenant['business']->id);

        $this->postJson('/api/general-sme/cash-entries', [
            'customer_id' => $customer->id,
            'entry_type' => 'cash_in',
            'source' => 'Debtor recovery',
            'amount' => 4000,
            'payment_method' => 'transfer',
            'entry_date' => today()->toDateString(),
            'notes' => 'Morning collection',
        ])
            ->assertCreated()
            ->assertJsonPath('customer.name', 'Grace Debtor')
            ->assertJsonPath('entry_type', 'cash_in')
            ->assertJsonPath('payment_method', 'transfer');

        $this->postJson('/api/general-sme/follow-ups', [
            'customer_id' => $customer->id,
            'assigned_to' => $assignee->id,
            'title' => 'Call Grace for remaining balance',
            'amount_in_focus' => 8000,
            'due_on' => today()->toDateString(),
            'status' => 'completed',
        ])
            ->assertCreated()
            ->assertJsonPath('customer.name', 'Grace Debtor')
            ->assertJsonPath('assigned_to', $assignee->id)
            ->assertJsonPath('status', 'completed');

        $this->postJson('/api/general-sme/daily-targets', [
            'target_date' => today()->toDateString(),
            'sales_target' => 50000,
            'collection_target' => 15000,
            'expense_limit' => 7000,
            'status' => 'open',
        ])
            ->assertCreated()
            ->assertJsonPath('sales_target', 50000)
            ->assertJsonPath('collection_target', 15000)
            ->assertJsonPath('status', 'open');
    }

    public function test_it_rejects_foreign_tenant_customers_and_assignees_in_general_sme_writes(): void
    {
        $tenant = $this->createTenantContext('mixed', 'general-sme-scope@example.com');
        $otherTenant = $this->createTenantContext('mixed', 'general-sme-other@example.com');

        $foreignAssignee = User::factory()->create([
            'email' => 'foreign-general-sme-owner@example.com',
            'role' => 'staff',
        ]);
        $this->attachActiveMember($foreignAssignee, $otherTenant['business']->id);

        $foreignCustomer = Customer::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Debtor',
            'phone' => '08030042222',
            'customer_type' => 'retailer',
            'is_active' => true,
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/general-sme/cash-entries', [
            'customer_id' => $foreignCustomer->id,
            'entry_type' => 'cash_in',
            'source' => 'Invalid recovery',
            'amount' => 5000,
            'entry_date' => today()->toDateString(),
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['customer_id']);

        $this->postJson('/api/general-sme/follow-ups', [
            'customer_id' => $foreignCustomer->id,
            'assigned_to' => $foreignAssignee->id,
            'title' => 'Invalid follow-up',
            'due_on' => today()->toDateString(),
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['customer_id', 'assigned_to']);
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
