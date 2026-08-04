<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Role;
use App\Models\User;
use App\Services\BusinessProvisioningService;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BranchControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PermissionSeeder::class);
    }

    public function test_admin_can_view_branch_management_context(): void
    {
        ['owner' => $owner, 'business' => $business, 'branch' => $branch] = $this->createProvisionedWorkspace();
        $secondaryBranch = Branch::create([
            'business_id' => $business->id,
            'name' => 'Annex',
            'slug' => 'annex',
            'city' => 'Kano',
            'state' => 'Kano',
            'is_primary' => false,
            'is_active' => true,
        ]);

        $manager = User::factory()->create([
            'name' => 'Manager Mary',
            'email' => 'manager@example.com',
            'role' => 'manager',
        ]);

        $this->attachMember($manager, $business, 'manager', $secondaryBranch, $owner);
        $token = $owner->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/branches');

        $response->assertOk()
            ->assertJsonPath('business.id', $business->id)
            ->assertJsonPath('summary.branch_count', 2)
            ->assertJsonPath('summary.active_branch_count', 2)
            ->assertJsonPath('summary.branch_coverage_count', 2)
            ->assertJsonPath('summary.warehouse_count', 1)
            ->assertJsonPath('branches.0.id', $branch->id)
            ->assertJsonPath('branches.1.active_member_count', 1);
    }

    public function test_admin_can_create_a_new_primary_branch(): void
    {
        ['owner' => $owner, 'business' => $business, 'branch' => $branch] = $this->createProvisionedWorkspace();
        $token = $owner->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/branches', [
                'name' => 'City Annex',
                'phone' => '08039998877',
                'address' => '22 Emir Road',
                'city' => 'Kano',
                'state' => 'Kano',
                'is_primary' => true,
            ]);

        $response->assertCreated()
            ->assertJsonPath('message', 'Branch created successfully.')
            ->assertJsonPath('summary.branch_count', 2)
            ->assertJsonPath('branches.0.name', 'City Annex')
            ->assertJsonPath('branches.0.is_primary', true);

        $newBranch = Branch::where('business_id', $business->id)
            ->where('name', 'City Annex')
            ->firstOrFail();

        $this->assertDatabaseHas('branches', [
            'id' => $newBranch->id,
            'business_id' => $business->id,
            'slug' => 'city-annex',
            'phone' => '08039998877',
            'is_primary' => true,
            'is_active' => true,
        ]);

        $this->assertDatabaseHas('branches', [
            'id' => $branch->id,
            'is_primary' => false,
        ]);
    }

    public function test_admin_can_update_branch_details_and_promote_it_to_primary(): void
    {
        ['owner' => $owner, 'business' => $business, 'branch' => $primaryBranch] = $this->createProvisionedWorkspace();
        $secondaryBranch = Branch::create([
            'business_id' => $business->id,
            'name' => 'Warehouse Annex',
            'slug' => 'warehouse-annex',
            'phone' => null,
            'address' => null,
            'city' => null,
            'state' => null,
            'is_primary' => false,
            'is_active' => true,
        ]);

        $token = $owner->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson("/api/branches/{$secondaryBranch->id}", [
                'name' => 'Warehouse Annex East',
                'phone' => '08034440000',
                'city' => 'Kaduna',
                'state' => 'Kaduna',
                'address' => '7 Depot Road',
                'is_primary' => true,
            ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Branch updated successfully.')
            ->assertJsonPath('branches.0.id', $secondaryBranch->id)
            ->assertJsonPath('branches.0.is_primary', true)
            ->assertJsonPath('branches.0.location', '7 Depot Road, Kaduna');

        $this->assertDatabaseHas('branches', [
            'id' => $secondaryBranch->id,
            'name' => 'Warehouse Annex East',
            'phone' => '08034440000',
            'city' => 'Kaduna',
            'state' => 'Kaduna',
            'address' => '7 Depot Road',
            'is_primary' => true,
        ]);

        $this->assertDatabaseHas('branches', [
            'id' => $primaryBranch->id,
            'is_primary' => false,
        ]);
    }

    public function test_admin_cannot_deactivate_branch_with_active_members(): void
    {
        ['owner' => $owner, 'business' => $business] = $this->createProvisionedWorkspace();
        $secondaryBranch = Branch::create([
            'business_id' => $business->id,
            'name' => 'Coverage Hub',
            'slug' => 'coverage-hub',
            'is_primary' => false,
            'is_active' => true,
        ]);

        $manager = User::factory()->create([
            'name' => 'Manager Mary',
            'email' => 'manager@example.com',
            'role' => 'manager',
        ]);

        $this->attachMember($manager, $business, 'manager', $secondaryBranch, $owner, true);
        $token = $owner->createToken('test-token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson("/api/branches/{$secondaryBranch->id}", [
                'is_active' => false,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['is_active']);
    }

    public function test_non_admin_cannot_access_branch_management_routes(): void
    {
        ['owner' => $owner, 'business' => $business, 'branch' => $branch] = $this->createProvisionedWorkspace();
        $manager = User::factory()->create([
            'name' => 'Manager Mary',
            'email' => 'manager@example.com',
            'role' => 'manager',
        ]);

        $this->attachMember($manager, $business, 'manager', $branch, $owner, true);
        $token = $manager->createToken('manager-token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/branches')
            ->assertForbidden()
            ->assertJsonPath('message', 'Unauthorized for this role.');
    }

    private function createProvisionedWorkspace(): array
    {
        $owner = User::factory()->create([
            'name' => 'Business Owner',
            'email' => 'owner@example.com',
            'phone' => '08030000000',
            'role' => 'admin',
        ]);

        /** @var BusinessProvisioningService $provisioning */
        $provisioning = app(BusinessProvisioningService::class);

        $result = $provisioning->createBusinessForUser($owner, [
            'business_name' => 'Taska Retail',
            'business_email' => 'retail@example.com',
            'business_type' => 'retail',
            'business_category' => 'commerce',
            'business_location' => '12 Market Road',
            'primary_branch_name' => 'HQ',
            'contact_phone' => '08030000000',
            'role' => 'admin',
        ]);

        return [
            'owner' => $owner->fresh(),
            'business' => $result['business']->fresh(),
            'branch' => $result['branch']->fresh(),
        ];
    }

    private function attachMember(User $member, Business $business, string $roleSlug, Branch $branch, User $owner, bool $setCurrentContext = false): void
    {
        $role = Role::where('business_id', $business->id)
            ->where('slug', $roleSlug)
            ->firstOrFail();

        /** @var BusinessProvisioningService $provisioning */
        $provisioning = app(BusinessProvisioningService::class);
        $provisioning->attachUserToBusiness($member, $business, $role, $branch, $owner->id);

        if ($setCurrentContext) {
            $member->forceFill([
                'current_business_id' => $business->id,
                'current_branch_id' => $branch->id,
                'role' => $roleSlug,
            ])->save();
        }
    }
}
