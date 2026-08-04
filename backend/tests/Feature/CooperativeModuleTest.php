<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Cooperative;
use App\Models\CooperativeFinancing;
use App\Models\CooperativeMember;
use App\Models\CooperativeProfitCycle;
use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\SubscriptionPlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class CooperativeModuleTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_seeded_general_demo_account_exposes_populated_cooperative_workspace(): void
    {
        $this->seed(DatabaseSeeder::class);

        $user = User::where('email', 'general@taska.local')->firstOrFail();
        Sanctum::actingAs($user);

        $dashboard = $this->getJson('/api/cooperative/dashboard')
            ->assertOk()
            ->assertJsonPath('configured', true)
            ->assertJsonPath('summary.members', 4)
            ->assertJsonPath('summary.total_shares', 35)
            ->assertJsonPath('summary.active_financing', 3)
            ->assertJsonPath('summary.wallet_balance', 226500)
            ->assertJsonPath('summary.profit_distributed', 41500)
            ->assertJsonPath('summary.active_investments', 1)
            ->json();

        $this->assertSame('Taska General SME Cooperative', data_get($dashboard, 'cooperative.name'));

        $this->getJson('/api/cooperative/members')
            ->assertOk()
            ->assertJsonCount(4);

        $this->getJson('/api/cooperative/financing')
            ->assertOk()
            ->assertJsonCount(3)
            ->assertJsonFragment(['financing_type' => 'qard_hasan'])
            ->assertJsonFragment(['financing_type' => 'mudarabah'])
            ->assertJsonFragment(['financing_type' => 'musharakah']);

        $this->getJson('/api/cooperative/profit-cycles')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.status', 'distributed');

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('cooperative.members', 4)
            ->assertJsonPath('cooperative.pending_approvals', 0)
            ->assertJsonPath('cooperative.distributed_cycles', 1)
            ->assertJsonPath('cooperative.last_distribution_label', 'Ramadan cycle distribution');
    }

    public function test_seeded_cooperative_demo_account_exposes_populated_cooperative_workspace(): void
    {
        $this->seed(DatabaseSeeder::class);

        $user = User::where('email', 'cooperative@taska.local')->firstOrFail();
        Sanctum::actingAs($user);

        $this->getJson('/api/cooperative/dashboard')
            ->assertOk()
            ->assertJsonPath('configured', true)
            ->assertJsonPath('summary.members', 4)
            ->assertJsonPath('summary.total_shares', 35)
            ->assertJsonPath('summary.active_financing', 3)
            ->assertJsonPath('summary.wallet_balance', 226500)
            ->assertJsonPath('summary.profit_distributed', 41500);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('cooperative.members', 4)
            ->assertJsonPath('cooperative.pending_approvals', 0)
            ->assertJsonPath('cooperative.distributed_cycles', 1);
    }

    public function test_can_set_up_members_shares_and_qard_hasan_financing(): void
    {
        $this->seed([
            PermissionSeeder::class,
            SubscriptionPlanSeeder::class,
        ]);

        $user = User::create([
            'name' => 'Cooperative Tester',
            'email' => 'cooptester@taska.local',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        $business = Business::create([
            'name' => 'Taska Cooperative Test Business',
            'slug' => 'taska-coop-test-business',
            'email' => 'coopbiz@taska.local',
            'phone' => '+2348000000011',
            'address' => '1 Cooperative Close',
            'city' => 'Lagos',
            'state' => 'Lagos',
            'country' => 'Nigeria',
            'business_type' => 'general',
            'modules' => ['sales', 'inventory', 'finance', 'reports'],
            'is_active' => true,
        ]);

        $branch = Branch::create([
            'business_id' => $business->id,
            'name' => 'Main Branch',
            'slug' => 'main-branch',
            'address' => '1 Cooperative Close',
            'is_primary' => true,
            'is_active' => true,
        ]);

        $user->forceFill([
            'current_business_id' => $business->id,
            'current_branch_id' => $branch->id,
        ])->save();

        $customers = collect([
            ['name' => 'Amina Bello', 'email' => 'coop.member1@taska.local'],
            ['name' => 'Chidi Okafor', 'email' => 'coop.member2@taska.local'],
            ['name' => 'Fatima Yusuf', 'email' => 'coop.member3@taska.local'],
        ])->map(function (array $payload, int $index) use ($business, $branch) {
            return Customer::create([
                'business_id' => $business->id,
                'branch_id' => $branch->id,
                'name' => $payload['name'],
                'email' => $payload['email'],
                'phone' => '+23481000000' . $index,
                'customer_type' => 'retailer',
                'is_active' => true,
            ]);
        })->values();

        Sanctum::actingAs($user);

        $this->postJson('/api/cooperative/setup', [
            'name' => 'Taska Test Cooperative',
            'share_price' => 1000,
            'minimum_member_shares' => 2,
            'profit_cycle' => 'monthly',
            'loan_settings' => [
                'required_guarantors' => 2,
                'min_shares_per_guarantor' => 2,
                'min_combined_guarantor_shares' => 6,
                'borrower_min_shares' => 3,
                'loan_limit_mode' => 'multiplier',
                'loan_limit_value' => 2,
                'lock_borrower_shares' => true,
                'lock_guarantor_shares' => true,
                'liability_mode' => 'proportional',
                'allow_admin_override' => true,
            ],
            'branding' => [
                'branding_tier' => 'standard',
            ],
        ])
            ->assertOk()
            ->assertJsonPath('name', 'Taska Test Cooperative');

        $memberIds = $customers->map(function (Customer $customer, int $index) {
            $response = $this->postJson('/api/cooperative/members', [
                'customer_id' => $customer->id,
                'role' => $index === 0 ? 'admin' : 'member',
            ])->assertCreated();

            return (int) $response->json('id');
        })->all();

        $this->postJson('/api/cooperative/shares/purchase', [
            'member_id' => $memberIds[0],
            'units' => 5,
        ])->assertCreated();

        $this->postJson('/api/cooperative/shares/purchase', [
            'member_id' => $memberIds[1],
            'units' => 4,
        ])->assertCreated();

        $this->postJson('/api/cooperative/shares/purchase', [
            'member_id' => $memberIds[2],
            'units' => 3,
        ])->assertCreated();

        $this->postJson('/api/cooperative/financing', [
            'member_id' => $memberIds[2],
            'financing_type' => 'qard_hasan',
            'amount_requested' => 4000,
            'duration_months' => 3,
            'repayment_due_date' => now()->addMonths(3)->toDateString(),
            'business_description' => 'Short-term restock support.',
            'guarantor_member_ids' => [$memberIds[0], $memberIds[1]],
        ])
            ->assertCreated()
            ->assertJsonPath('status', 'pending_guarantor_approval')
            ->assertJsonCount(2, 'guarantors');
    }

    public function test_cooperative_endpoints_reject_foreign_tenant_members_users_products_and_records(): void
    {
        $tenant = $this->createTenantContext('general', 'coop-scope@example.com');
        $otherTenant = $this->createTenantContext('general', 'coop-other@example.com');

        Cooperative::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Local Coop',
            'slug' => 'local-coop',
            'share_price' => 1000,
            'minimum_member_shares' => 1,
            'profit_cycle' => 'monthly',
            'status' => 'active',
        ]);

        $foreignCooperative = Cooperative::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Coop',
            'slug' => 'foreign-coop',
            'share_price' => 1000,
            'minimum_member_shares' => 1,
            'profit_cycle' => 'monthly',
            'status' => 'active',
        ]);

        $foreignUser = User::factory()->create([
            'email' => 'foreign-coop-user@example.com',
            'role' => 'member',
        ]);
        $this->attachActiveMember($foreignUser, $otherTenant['business']->id);

        $foreignCustomer = Customer::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Member',
            'email' => 'foreign-member@example.com',
            'phone' => '08030005551',
            'customer_type' => 'retailer',
            'is_active' => true,
        ]);

        $foreignMember = CooperativeMember::create([
            'cooperative_id' => $foreignCooperative->id,
            'business_id' => $otherTenant['business']->id,
            'customer_id' => $foreignCustomer->id,
            'user_id' => $foreignUser->id,
            'member_number' => 'FRN-0001',
            'role' => 'member',
            'joined_at' => today()->toDateString(),
            'status' => 'active',
        ]);

        $foreignProduct = Product::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Cooperative Goods',
            'selling_price' => 10000,
            'cost_price' => 8000,
            'track_inventory' => true,
            'is_active' => true,
        ]);

        $foreignFinancing = CooperativeFinancing::create([
            'cooperative_id' => $foreignCooperative->id,
            'business_id' => $otherTenant['business']->id,
            'member_id' => $foreignMember->id,
            'financing_type' => 'qard_hasan',
            'status' => 'pending_admin_approval',
            'amount_requested' => 5000,
            'submitted_at' => now(),
        ]);

        $foreignProfitCycle = CooperativeProfitCycle::create([
            'cooperative_id' => $foreignCooperative->id,
            'business_id' => $otherTenant['business']->id,
            'label' => 'Foreign Cycle',
            'cycle_start' => now()->subMonth()->toDateString(),
            'cycle_end' => now()->toDateString(),
            'total_profit' => 12000,
            'distributable_profit' => 10000,
            'reserve_allocation' => 1000,
            'charity_allocation' => 1000,
            'status' => 'approved',
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/cooperative/members', [
            'customer_id' => $foreignCustomer->id,
            'user_id' => $foreignUser->id,
            'role' => 'member',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['customer_id', 'user_id']);

        $this->postJson('/api/cooperative/shares/purchase', [
            'member_id' => $foreignMember->id,
            'units' => 2,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['member_id']);

        $this->postJson('/api/cooperative/financing', [
            'member_id' => $foreignMember->id,
            'financing_type' => 'qard_hasan',
            'amount_requested' => 2000,
            'guarantor_member_ids' => [$foreignMember->id],
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['member_id', 'guarantor_member_ids.0']);

        $this->postJson('/api/cooperative/investments', [
            'product_id' => $foreignProduct->id,
            'name' => 'Invalid Investment',
            'amount' => 1000,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['product_id']);

        $this->postJson('/api/cooperative/withdrawals', [
            'member_id' => $foreignMember->id,
            'withdrawal_type' => 'profit_withdrawal',
            'amount' => 500,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['member_id']);

        $this->patchJson("/api/cooperative/financing/{$foreignFinancing->id}/status", [
            'status' => 'approved',
        ])->assertStatus(403);

        $this->postJson("/api/cooperative/profit-cycles/{$foreignProfitCycle->id}/distribute")
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
