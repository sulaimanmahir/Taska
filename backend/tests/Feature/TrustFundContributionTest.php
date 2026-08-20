<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\TrustAccount;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class TrustFundContributionTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_can_create_contribution_account_with_schedule_fields(): void
    {
        $tenant = $this->createTenantContext('general', 'adashe-create@example.com');

        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Hauwa Member',
            'phone' => '08030001111',
            'customer_type' => 'individual',
            'credit_limit' => 0,
            'balance' => 0,
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/trust-accounts', [
            'customer_id' => $customer->id,
            'account_type' => 'contribution',
            'cycle_name' => 'Friday Adashe',
            'limit' => 50000,
            'installment_amount' => 5000,
            'contribution_frequency_days' => 7,
            'next_due_date' => now()->addDay()->toDateString(),
        ])->assertCreated();

        $response
            ->assertJsonPath('cycle_name', 'Friday Adashe')
            ->assertJsonPath('installment_amount', '5000.00')
            ->assertJsonPath('contribution_frequency_days', 7);
    }

    public function test_collecting_contribution_advances_next_due_date(): void
    {
        $tenant = $this->createTenantContext('general', 'adashe-collect@example.com');

        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Binta Member',
            'phone' => '08030002222',
            'customer_type' => 'individual',
            'credit_limit' => 0,
            'balance' => 0,
            'is_active' => true,
        ]);

        $account = TrustAccount::create([
            'business_id' => $tenant['business']->id,
            'customer_id' => $customer->id,
            'account_type' => 'contribution',
            'cycle_name' => 'Tuesday Circle',
            'limit' => 40000,
            'installment_amount' => 5000,
            'contribution_frequency_days' => 7,
            'balance' => 10000,
            'next_due_date' => now()->subDay()->toDateString(),
            'status' => 'active',
        ]);

        $this->postJson("/api/trust-accounts/{$account->id}/draw", [
            'amount' => 5000,
            'reference' => 'Weekly collection',
        ])->assertOk();

        $account->refresh();

        $this->assertEquals('15000.00', $account->balance);
        $this->assertNotNull($account->last_payment_date);
        $this->assertTrue($account->next_due_date->isSameDay(now()->addDays(7)));
    }

    public function test_contribution_collection_cannot_exceed_cycle_target(): void
    {
        $tenant = $this->createTenantContext('general', 'adashe-cap@example.com');

        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Rabi Member',
            'phone' => '08030003333',
            'customer_type' => 'individual',
            'credit_limit' => 0,
            'balance' => 0,
            'is_active' => true,
        ]);

        $account = TrustAccount::create([
            'business_id' => $tenant['business']->id,
            'customer_id' => $customer->id,
            'account_type' => 'contribution',
            'cycle_name' => 'Cap Check Circle',
            'limit' => 20000,
            'installment_amount' => 5000,
            'contribution_frequency_days' => 7,
            'balance' => 18000,
            'next_due_date' => now()->toDateString(),
            'status' => 'active',
        ]);

        $this->postJson("/api/trust-accounts/{$account->id}/draw", [
            'amount' => 5000,
            'reference' => 'Overflow collection',
        ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Contribution exceeds the remaining cycle target')
            // This used to be a raw \Exception caught broadly in the
            // controller and reported as {message} only - a real
            // ValidationException gives the frontend an `errors.amount`
            // entry for field-level highlighting, like every other
            // validation failure in the API.
            ->assertJsonPath('errors.amount.0', 'Contribution exceeds the remaining cycle target');

        $account->refresh();

        $this->assertEquals('18000.00', $account->balance);
    }

    public function test_overdue_endpoint_returns_credit_accounts_instead_of_hitting_show_route(): void
    {
        $tenant = $this->createTenantContext('general', 'trust-overdue@example.com');
        $foreignTenant = $this->createTenantContext('general', 'trust-overdue-foreign@example.com');

        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Bashir Customer',
            'phone' => '08030004444',
            'customer_type' => 'individual',
            'credit_limit' => 0,
            'balance' => 15000,
            'is_active' => true,
        ]);

        TrustAccount::create([
            'business_id' => $tenant['business']->id,
            'customer_id' => $customer->id,
            'account_type' => 'credit',
            'limit' => 50000,
            'balance' => 15000,
            'last_payment_date' => now()->subDays(45)->toDateString(),
            'status' => 'active',
        ]);

        $foreignCustomer = Customer::create([
            'business_id' => $foreignTenant['business']->id,
            'branch_id' => $foreignTenant['branch']->id,
            'name' => 'Foreign Borrower',
            'phone' => '08030009999',
            'customer_type' => 'individual',
            'balance' => 12000,
            'is_active' => true,
        ]);

        TrustAccount::create([
            'business_id' => $foreignTenant['business']->id,
            'customer_id' => $foreignCustomer->id,
            'account_type' => 'credit',
            'limit' => 40000,
            'balance' => 12000,
            'last_payment_date' => now()->subDays(50)->toDateString(),
            'status' => 'active',
        ]);

        $this->getJson('/api/trust-accounts/overdue')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.account_type', 'credit')
            ->assertJsonPath('0.customer.name', 'Bashir Customer')
            ->assertJsonPath('0.recommendation.action', 'draw_within_limit')
            ->assertJsonPath('0.recommendation.risk_level', 'high')
            ->assertJsonPath('0.recommendation.next_review_date', now()->subDays(15)->toDateString());
    }

    public function test_contribution_index_includes_filtered_summary_totals(): void
    {
        $tenant = $this->createTenantContext('general', 'adashe-summary@example.com');

        Sanctum::actingAs($tenant['user']);

        $firstCustomer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Amina Member',
            'phone' => '08030005555',
            'customer_type' => 'individual',
            'credit_limit' => 0,
            'balance' => 0,
            'is_active' => true,
        ]);

        $secondCustomer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Khadija Member',
            'phone' => '08030006666',
            'customer_type' => 'individual',
            'credit_limit' => 0,
            'balance' => 0,
            'is_active' => true,
        ]);

        TrustAccount::create([
            'business_id' => $tenant['business']->id,
            'customer_id' => $firstCustomer->id,
            'account_type' => 'contribution',
            'limit' => 30000,
            'balance' => 15000,
            'total_repaid' => 2000,
            'contribution_frequency_days' => 7,
            'next_due_date' => now()->subDay()->toDateString(),
            'status' => 'active',
        ]);

        TrustAccount::create([
            'business_id' => $tenant['business']->id,
            'customer_id' => $secondCustomer->id,
            'account_type' => 'contribution',
            'limit' => 20000,
            'balance' => 5000,
            'total_repaid' => 1000,
            'contribution_frequency_days' => 14,
            'next_due_date' => now()->addDays(4)->toDateString(),
            'status' => 'active',
        ]);

        $this->getJson('/api/trust-accounts?type=contribution')
            ->assertOk()
            ->assertJsonPath('summary.member_accounts', 2)
            ->assertJsonPath('summary.total_target', 50000)
            ->assertJsonPath('summary.total_collected', 20000)
            ->assertJsonPath('summary.total_paid_out', 3000)
            ->assertJsonPath('summary.active_cycles', 2)
            ->assertJsonPath('summary.due_now', 1);
    }

    public function test_credit_index_includes_filtered_summary_totals(): void
    {
        $tenant = $this->createTenantContext('general', 'trust-summary@example.com');

        Sanctum::actingAs($tenant['user']);

        $firstCustomer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Nasiru Customer',
            'phone' => '08030007777',
            'customer_type' => 'individual',
            'credit_limit' => 0,
            'balance' => 0,
            'is_active' => true,
        ]);

        $secondCustomer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Lami Customer',
            'phone' => '08030008888',
            'customer_type' => 'individual',
            'credit_limit' => 0,
            'balance' => 0,
            'is_active' => true,
        ]);

        TrustAccount::create([
            'business_id' => $tenant['business']->id,
            'customer_id' => $firstCustomer->id,
            'account_type' => 'credit',
            'limit' => 60000,
            'balance' => 25000,
            'total_repaid' => 5000,
            'status' => 'active',
        ]);

        TrustAccount::create([
            'business_id' => $tenant['business']->id,
            'customer_id' => $secondCustomer->id,
            'account_type' => 'credit',
            'limit' => 40000,
            'balance' => 10000,
            'total_repaid' => 7000,
            'status' => 'active',
        ]);

        $this->getJson('/api/trust-accounts?type=credit')
            ->assertOk()
            ->assertJsonPath('summary.account_count', 2)
            ->assertJsonPath('summary.total_extended', 100000)
            ->assertJsonPath('summary.total_outstanding', 35000)
            ->assertJsonPath('summary.total_collected', 12000);
    }

    public function test_trust_account_index_search_filters_records_and_summary(): void
    {
        $tenant = $this->createTenantContext('general', 'trust-search@example.com');

        Sanctum::actingAs($tenant['user']);

        $matchingCustomer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Mariya Cooperative',
            'phone' => '08031112222',
            'customer_type' => 'individual',
            'credit_limit' => 0,
            'balance' => 0,
            'is_active' => true,
        ]);

        $otherCustomer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Usman Stores',
            'phone' => '08032223333',
            'customer_type' => 'individual',
            'credit_limit' => 0,
            'balance' => 0,
            'is_active' => true,
        ]);

        TrustAccount::create([
            'business_id' => $tenant['business']->id,
            'customer_id' => $matchingCustomer->id,
            'account_type' => 'credit',
            'limit' => 80000,
            'balance' => 22000,
            'total_repaid' => 6000,
            'status' => 'active',
        ]);

        TrustAccount::create([
            'business_id' => $tenant['business']->id,
            'customer_id' => $otherCustomer->id,
            'account_type' => 'credit',
            'limit' => 45000,
            'balance' => 12000,
            'total_repaid' => 3000,
            'status' => 'active',
        ]);

        $this->getJson('/api/trust-accounts?type=credit&search=Mariya')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.customer.name', 'Mariya Cooperative')
            ->assertJsonPath('summary.account_count', 1)
            ->assertJsonPath('summary.total_extended', 80000)
            ->assertJsonPath('summary.total_outstanding', 22000)
            ->assertJsonPath('summary.total_collected', 6000);
    }

    public function test_contribution_index_view_filter_returns_due_now_cycles_only(): void
    {
        $tenant = $this->createTenantContext('general', 'adashe-view@example.com');

        Sanctum::actingAs($tenant['user']);

        $dueCustomer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Safiya Due',
            'phone' => '08033334444',
            'customer_type' => 'individual',
            'credit_limit' => 0,
            'balance' => 0,
            'is_active' => true,
        ]);

        $futureCustomer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Zainab Future',
            'phone' => '08034445555',
            'customer_type' => 'individual',
            'credit_limit' => 0,
            'balance' => 0,
            'is_active' => true,
        ]);

        TrustAccount::create([
            'business_id' => $tenant['business']->id,
            'customer_id' => $dueCustomer->id,
            'account_type' => 'contribution',
            'limit' => 25000,
            'balance' => 10000,
            'next_due_date' => now()->subDay()->toDateString(),
            'status' => 'active',
        ]);

        TrustAccount::create([
            'business_id' => $tenant['business']->id,
            'customer_id' => $futureCustomer->id,
            'account_type' => 'contribution',
            'limit' => 25000,
            'balance' => 10000,
            'next_due_date' => now()->addDays(5)->toDateString(),
            'status' => 'active',
        ]);

        $this->getJson('/api/trust-accounts?type=contribution&view=due_now')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.customer.name', 'Safiya Due')
            ->assertJsonPath('summary.member_accounts', 1)
            ->assertJsonPath('summary.due_now', 1);
    }

    public function test_contribution_accounts_include_recommendation_metadata(): void
    {
        $tenant = $this->createTenantContext('general', 'adashe-recommendation@example.com');

        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Safiya Member',
            'phone' => '08039990001',
            'customer_type' => 'individual',
            'credit_limit' => 0,
            'balance' => 0,
            'is_active' => true,
        ]);

        TrustAccount::create([
            'business_id' => $tenant['business']->id,
            'customer_id' => $customer->id,
            'account_type' => 'contribution',
            'cycle_name' => 'Market Women Circle',
            'limit' => 30000,
            'installment_amount' => 5000,
            'balance' => 10000,
            'status' => 'active',
        ]);

        $this->getJson('/api/trust-accounts?type=contribution')
            ->assertOk()
            ->assertJsonPath('data.0.recommendation.action', 'collect_installment')
            ->assertJsonPath('data.0.recommendation.tone', 'violet')
            ->assertJsonPath('data.0.recommendation.risk_level', 'low')
            ->assertJsonPath('data.0.recommendation.recommended_amount', 5000)
            ->assertJsonPath('data.0.recommendation.why', 'The regular installment fits within the remaining target and keeps the collection cadence predictable.')
            ->assertJsonPath('data.0.recommendation.next_review_date', now()->toDateString())
            ->assertJsonPath('data.0.recommendation.meta.remaining_target', 20000);
    }

    public function test_trust_account_statement_includes_recommendation_metadata(): void
    {
        $tenant = $this->createTenantContext('general', 'trust-statement-recommendation@example.com');

        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Auwal Customer',
            'phone' => '08039990002',
            'customer_type' => 'individual',
            'credit_limit' => 0,
            'balance' => 25000,
            'is_active' => true,
        ]);

        $account = TrustAccount::create([
            'business_id' => $tenant['business']->id,
            'customer_id' => $customer->id,
            'account_type' => 'credit',
            'limit' => 50000,
            'balance' => 25000,
            'total_repaid' => 5000,
            'status' => 'active',
        ]);

        $this->getJson("/api/trust-accounts/{$account->id}")
            ->assertOk()
            ->assertJsonPath('account.recommendation.action', 'draw_within_limit')
            ->assertJsonPath('account.recommendation.tone', 'violet')
            ->assertJsonPath('account.recommendation.risk_level', 'low')
            ->assertJsonPath('account.recommendation.recommended_amount', 25000)
            ->assertJsonPath('account.recommendation.why', 'There is still approved headroom available, but keeping the draw within that range protects the account from limit overrun.')
            ->assertJsonPath('account.recommendation.next_review_date', now()->addDays(30)->toDateString())
            ->assertJsonPath('account.recommendation.meta.available_to_draw', 25000);
    }
}
