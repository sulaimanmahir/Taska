<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Expense;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class GeneralSMEOperationsTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_mixed_business_can_run_cash_follow_up_target_and_dashboard_flow(): void
    {
        $tenant = $this->createTenantContext('mixed', 'mixed-ops@example.com');

        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Ade Collections',
            'phone' => '08035550001',
            'balance' => 18000,
            'customer_type' => 'retailer',
        ]);

        Order::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'customer_id' => $customer->id,
            'order_number' => 'MIX-1001',
            'order_type' => 'sale',
            'status' => 'completed',
            'subtotal' => 30000,
            'total' => 30000,
            'paid' => 12000,
            'balance' => 18000,
            'payment_method' => 'cash',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $expenseCategoryId = DB::table('expense_categories')->insertGetId([
            'business_id' => $tenant['business']->id,
            'name' => 'Operations',
            'slug' => 'operations',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Expense::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'expense_category_id' => $expenseCategoryId,
            'description' => 'Transport and loading',
            'amount' => 3500,
            'expense_date' => today(),
            'payment_method' => 'cash',
        ]);

        $this->postJson('/api/general-sme/cash-entries', [
            'customer_id' => $customer->id,
            'entry_type' => 'cash_in',
            'source' => 'Partial debtor collection',
            'amount' => 12000,
            'payment_method' => 'transfer',
            'entry_date' => today()->toDateString(),
        ])->assertCreated();

        $this->postJson('/api/general-sme/cash-entries', [
            'entry_type' => 'cash_out',
            'source' => 'Emergency diesel purchase',
            'amount' => 2500,
            'payment_method' => 'cash',
            'entry_date' => today()->toDateString(),
        ])->assertCreated();

        $this->postJson('/api/general-sme/follow-ups', [
            'customer_id' => $customer->id,
            'title' => 'Call Ade for balance recovery',
            'amount_in_focus' => 18000,
            'due_on' => today()->toDateString(),
            'notes' => 'Promise to pay after site meeting',
        ])->assertCreated();

        $this->postJson('/api/general-sme/daily-targets', [
            'target_date' => today()->toDateString(),
            'sales_target' => 50000,
            'collection_target' => 20000,
            'expense_limit' => 5000,
        ])->assertCreated();

        $overview = $this->getJson('/api/general-sme/overview')
            ->assertOk()
            ->assertJsonPath('summary.sales_today', 30000)
            ->assertJsonPath('summary.cash_in_today', 12000)
            ->assertJsonPath('summary.cash_out_today', 2500)
            ->assertJsonPath('summary.debtor_exposure', 18000)
            ->assertJsonPath('summary.followups_due', 1)
            ->assertJsonPath('summary.target_attainment', 60);

        $this->assertContains(
            'Emergency diesel purchase',
            array_column($overview->json('cash_entries'), 'source')
        );

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('business_type', 'mixed')
            ->assertJsonPath('general_sme.sales_today', 30000)
            ->assertJsonPath('general_sme.followups_due', 1)
            ->assertJsonPath('general_sme.target_attainment', 60);
    }

    public function test_general_sme_endpoints_reject_foreign_tenant_customers_and_assignees(): void
    {
        $tenant = $this->createTenantContext('mixed', 'mixed-scope@example.com');
        $otherTenant = $this->createTenantContext('mixed', 'mixed-other@example.com');

        $foreignAssignee = User::factory()->create([
            'email' => 'foreign-followup-owner@example.com',
            'role' => 'staff',
        ]);
        $this->attachActiveMember($foreignAssignee, $otherTenant['business']->id);

        $foreignCustomer = Customer::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Debtor',
            'phone' => '08034440000',
            'customer_type' => 'retailer',
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/general-sme/cash-entries', [
            'customer_id' => $foreignCustomer->id,
            'entry_type' => 'cash_in',
            'source' => 'Invalid collection',
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
