<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Services\BusinessContextService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class MultiBusinessContextTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_with_multiple_businesses_sees_business_selector_after_login(): void
    {
        $user = User::factory()->create([
            'email' => 'owner@example.com',
            'password' => Hash::make('password123'),
        ]);

        $this->attachMembership($user, $this->makeBusiness('Taska Hotel', 'hotel'), 'admin');
        $this->attachMembership($user, $this->makeBusiness('Taska Delivery', 'delivery_company'), 'manager');

        $response = $this->postJson('/api/auth/login', [
            'email' => 'owner@example.com',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonPath('requires_business_selection', true)
            ->assertJsonPath('needs_business_onboarding', false)
            ->assertJsonCount(2, 'businesses')
            ->assertJsonPath('businesses.0.role_name', 'Business Owner');
    }

    public function test_user_with_no_business_is_sent_to_business_onboarding(): void
    {
        User::factory()->create([
            'email' => 'nobiz@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'nobiz@example.com',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonPath('needs_business_onboarding', true)
            ->assertJsonPath('requires_business_selection', false)
            ->assertJsonCount(0, 'businesses');
    }

    public function test_user_with_one_business_can_login_directly_to_business_context(): void
    {
        $user = User::factory()->create([
            'email' => 'single@example.com',
            'password' => Hash::make('password123'),
        ]);

        $business = $this->makeBusiness('Taska Pharmacy', 'pharmacy');
        $this->attachMembership($user, $business, 'admin');

        $response = $this->postJson('/api/auth/login', [
            'email' => 'single@example.com',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonPath('requires_business_selection', false)
            ->assertJsonPath('current_business.id', $business->id)
            ->assertJsonPath('businesses.0.business_type', 'pharmacy');
    }

    public function test_user_can_switch_business_and_dashboard_context_and_permissions_change(): void
    {
        $user = User::factory()->create();
        $hotelBusiness = $this->makeBusiness('Taska Hotel', 'hotel');
        $deliveryBusiness = $this->makeBusiness('Taska Delivery', 'delivery_company');

        $dashboardPermission = Permission::create([
            'name' => 'View Dashboard',
            'slug' => 'dashboard.view',
            'module' => 'dashboard',
        ]);
        $reportsPermission = Permission::create([
            'name' => 'View Reports',
            'slug' => 'reports.view',
            'module' => 'reports',
        ]);

        $hotelRole = $this->attachMembership($user, $hotelBusiness, 'manager');
        $deliveryRole = $this->attachMembership($user, $deliveryBusiness, 'cashier');

        $hotelRole->permissions()->sync([$dashboardPermission->id, $reportsPermission->id]);
        $deliveryRole->permissions()->sync([$dashboardPermission->id]);

        $token = $user->createToken('test-token')->plainTextToken;

        $switchResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/switch-business', ['business_id' => $deliveryBusiness->id]);

        $switchResponse->assertOk()
            ->assertJsonPath('business.business_type', 'delivery_company')
            ->assertJsonPath('active_role', 'cashier')
            ->assertJsonCount(1, 'permissions')
            ->assertJsonPath('permissions.0', 'dashboard.view');

        $dashboardResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/dashboard');

        $dashboardResponse->assertOk()
            ->assertJsonPath('business_type', 'delivery_company')
            ->assertJsonPath('delivery.pickups_pending', 0);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'current_business_id' => $deliveryBusiness->id,
        ]);
    }

    public function test_user_cannot_switch_to_unlinked_business(): void
    {
        $user = User::factory()->create();
        $linkedBusiness = $this->makeBusiness('Taska Retail', 'retail');
        $otherBusiness = $this->makeBusiness('Taska Fuel', 'fuel_business');

        $this->attachMembership($user, $linkedBusiness, 'admin');

        $token = $user->createToken('test-token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/switch-business', ['business_id' => $otherBusiness->id])
            ->assertNotFound();
    }

    public function test_business_summary_ignores_foreign_role_when_role_user_assignment_is_missing(): void
    {
        $user = User::factory()->create(['role' => 'cashier']);
        $business = $this->makeBusiness('Taska Retail', 'retail');
        $foreignBusiness = $this->makeBusiness('Taska Hotel', 'hotel');

        $foreignRole = Role::create([
            'business_id' => $foreignBusiness->id,
            'name' => 'Foreign Manager',
            'slug' => 'manager',
            'description' => 'Foreign role that should never leak into another workspace.',
            'is_default' => false,
        ]);

        $branch = Branch::create([
            'business_id' => $business->id,
            'name' => 'Main Branch',
            'slug' => 'main-branch-' . str()->lower(str()->random(4)),
            'is_primary' => true,
            'is_active' => true,
        ]);

        DB::table('business_user')->insert([
            'business_id' => $business->id,
            'user_id' => $user->id,
            'role_id' => $foreignRole->id,
            'branch_id' => $branch->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);

        $summaries = app(BusinessContextService::class)->summarizeBusinessesForUser($user->fresh());

        $this->assertCount(1, $summaries);
        $this->assertSame('Cashier', $summaries[0]['role_name']);
        $this->assertSame('cashier', $summaries[0]['role_slug']);
    }

    public function test_switch_business_falls_back_to_an_active_branch_when_membership_branch_is_inactive(): void
    {
        $user = User::factory()->create();
        $business = $this->makeBusiness('Taska Retail', 'retail');

        $roleConfig = collect(config('business_types.roles', []))->firstWhere('slug', 'admin');
        $role = Role::create([
            'business_id' => $business->id,
            'name' => $roleConfig['name'],
            'slug' => $roleConfig['slug'],
            'description' => $roleConfig['description'],
            'is_default' => $roleConfig['is_default'] ?? false,
        ]);

        $inactivePrimaryBranch = Branch::create([
            'business_id' => $business->id,
            'name' => 'Old HQ',
            'slug' => 'old-hq-' . str()->lower(str()->random(4)),
            'is_primary' => true,
            'is_active' => false,
        ]);

        $activeBranch = Branch::create([
            'business_id' => $business->id,
            'name' => 'Live Branch',
            'slug' => 'live-branch-' . str()->lower(str()->random(4)),
            'is_primary' => false,
            'is_active' => true,
        ]);

        DB::table('business_user')->insert([
            'business_id' => $business->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'branch_id' => $inactivePrimaryBranch->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);

        DB::table('role_user')->insert([
            'role_id' => $role->id,
            'user_id' => $user->id,
            'business_id' => $business->id,
            'assigned_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/switch-business', ['business_id' => $business->id])
            ->assertOk()
            ->assertJsonPath('business.branch_id', $activeBranch->id);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'current_business_id' => $business->id,
            'current_branch_id' => $activeBranch->id,
        ]);
    }

    public function test_logged_in_user_can_create_another_business(): void
    {
        $user = User::factory()->create();
        $existingBusiness = $this->makeBusiness('Taska Retail', 'retail');
        $this->attachMembership($user, $existingBusiness, 'admin');

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/businesses', [
                'business_name' => 'Taska School',
                'business_email' => 'school-biz@example.com',
                'business_type' => 'school',
                'business_category' => 'services',
                'business_location' => 'Kano, Nigeria',
                'primary_branch_name' => 'School Main Branch',
                'contact_phone' => '08035551234',
            ]);

        $response->assertCreated()
            ->assertJsonPath('business.business_type', 'school')
            ->assertJsonPath('needs_business_onboarding', false)
            ->assertJsonCount(2, 'businesses');

        $newBusinessId = $response->json('business.id');

        $this->assertDatabaseHas('business_user', [
            'user_id' => $user->id,
            'business_id' => $newBusinessId,
            'status' => 'active',
        ]);

        $this->assertDatabaseHas('branches', [
            'business_id' => $newBusinessId,
            'name' => 'School Main Branch',
        ]);
    }

    private function makeBusiness(string $name, string $businessType): Business
    {
        return Business::create([
            'name' => $name,
            'slug' => str()->slug($name) . '-' . str()->lower(str()->random(4)),
            'email' => str()->slug($name) . '-' . str()->lower(str()->random(4)) . '@example.com',
            'business_type' => $businessType,
            'business_category' => config("business_types.types.{$businessType}.group", 'general'),
            'modules' => config("business_types.types.{$businessType}.modules", []),
        ]);
    }

    private function attachMembership(User $user, Business $business, string $roleSlug): Role
    {
        $roleConfig = collect(config('business_types.roles', []))->firstWhere('slug', $roleSlug);

        $role = Role::create([
            'business_id' => $business->id,
            'name' => $roleConfig['name'],
            'slug' => $roleConfig['slug'],
            'description' => $roleConfig['description'],
            'is_default' => $roleConfig['is_default'] ?? false,
        ]);

        $branch = Branch::create([
            'business_id' => $business->id,
            'name' => 'Main Branch',
            'slug' => 'main-branch-' . str()->lower(str()->random(4)),
            'is_primary' => true,
            'is_active' => true,
        ]);

        DB::table('business_user')->insert([
            'business_id' => $business->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'branch_id' => $branch->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);

        DB::table('role_user')->insert([
            'role_id' => $role->id,
            'user_id' => $user->id,
            'business_id' => $business->id,
            'assigned_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $role;
    }
}
