<?php

namespace Tests\Feature;

use App\Mail\TeamInviteMail;
use App\Models\Branch;
use App\Models\Business;
use App\Models\Role;
use App\Models\User;
use App\Services\BusinessProvisioningService;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BusinessTeamControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PermissionSeeder::class);
    }

    public function test_admin_can_view_workspace_team_context(): void
    {
        ['owner' => $owner, 'business' => $business, 'branch' => $branch] = $this->createProvisionedWorkspace();
        $manager = User::factory()->create([
            'name' => 'Manager Mary',
            'email' => 'manager@example.com',
        ]);

        $this->attachMember($manager, $business, 'manager', $branch, $owner);

        $token = $owner->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/team');

        $response->assertOk()
            ->assertJsonPath('business.id', $business->id)
            ->assertJsonPath('summary.member_count', 2)
            ->assertJsonPath('summary.active_member_count', 2)
            ->assertJsonPath('roles.0.slug', 'admin')
            ->assertJsonPath('branches.0.id', $branch->id)
            ->assertJsonPath('members.0.is_current_user', true);
    }

    public function test_admin_can_invite_a_brand_new_workspace_member(): void
    {
        Mail::fake();

        ['owner' => $owner, 'business' => $business, 'branch' => $branch] = $this->createProvisionedWorkspace();
        $token = $owner->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/team', [
                'name' => 'Cashier Grace',
                'email' => 'cashier@example.com',
                'phone' => '08031110000',
                'role_slug' => 'cashier',
                'branch_id' => $branch->id,
            ]);

        $response->assertCreated()
            ->assertJsonPath('created_new_user', true)
            ->assertJsonPath('summary.member_count', 2)
            ->assertJsonPath('summary.active_member_count', 1);

        $memberId = User::where('email', 'cashier@example.com')->value('id');
        $cashierRoleId = Role::where('business_id', $business->id)->where('slug', 'cashier')->value('id');

        $this->assertDatabaseHas('users', [
            'id' => $memberId,
            'name' => 'Cashier Grace',
            'phone' => '08031110000',
            'role' => 'cashier',
        ]);

        $this->assertDatabaseHas('business_user', [
            'business_id' => $business->id,
            'user_id' => $memberId,
            'role_id' => $cashierRoleId,
            'branch_id' => $branch->id,
            'status' => 'invited',
        ]);

        $this->assertDatabaseHas('role_user', [
            'business_id' => $business->id,
            'user_id' => $memberId,
            'role_id' => $cashierRoleId,
        ]);

        Mail::assertSent(TeamInviteMail::class, fn ($mail) => $mail->hasTo('cashier@example.com'));

        // The placeholder password is unusable - the invitee cannot sign in
        // until they accept the invite and choose their own password.
        $this->postJson('/api/auth/login', [
            'email' => 'cashier@example.com',
            'password' => 'securePass123',
        ])->assertStatus(422);
    }

    public function test_invited_member_can_accept_and_the_owner_can_resend_the_invite(): void
    {
        Mail::fake();

        ['owner' => $owner, 'business' => $business, 'branch' => $branch] = $this->createProvisionedWorkspace();
        $token = $owner->createToken('test-token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/team', [
                'name' => 'Cashier Grace',
                'email' => 'cashier@example.com',
                'role_slug' => 'cashier',
                'branch_id' => $branch->id,
            ])->assertCreated();

        $member = User::where('email', 'cashier@example.com')->firstOrFail();

        $capturedToken = null;
        Mail::assertSent(TeamInviteMail::class, function ($mail) use (&$capturedToken) {
            $capturedToken = Str::after($mail->acceptUrl, 'token=');
            return true;
        });

        $this->getJson("/api/team-invites/{$capturedToken}")
            ->assertOk()
            ->assertJsonPath('business_name', $business->name)
            ->assertJsonPath('role_name', 'Cashier');

        $acceptResponse = $this->postJson('/api/team-invites/accept', [
            'token' => $capturedToken,
            'password' => 'newSecurePass123',
            'password_confirmation' => 'newSecurePass123',
        ]);

        $acceptResponse->assertOk()
            ->assertJsonPath('current_business.id', $business->id);

        $this->assertDatabaseHas('business_user', [
            'business_id' => $business->id,
            'user_id' => $member->id,
            'status' => 'active',
            'invitation_token' => null,
        ]);

        // The token is single-use - accepting again must fail.
        $this->postJson('/api/team-invites/accept', [
            'token' => $capturedToken,
            'password' => 'anotherPass123',
            'password_confirmation' => 'anotherPass123',
        ])->assertStatus(404);

        // Now they can actually sign in with the password they chose.
        $this->postJson('/api/auth/login', [
            'email' => 'cashier@example.com',
            'password' => 'newSecurePass123',
        ])->assertOk();

        // A separate invite can still be resent for a still-pending member.
        $secondInvite = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/team', [
                'name' => 'Manager Musa',
                'email' => 'musa@example.com',
                'role_slug' => 'manager',
                'branch_id' => $branch->id,
            ]);
        $secondInvite->assertCreated();
        $pendingMember = User::where('email', 'musa@example.com')->firstOrFail();

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson("/api/auth/team/{$pendingMember->id}/resend-invite")
            ->assertOk();

        // cashier invite + musa invite + musa resend = 3 sends total.
        Mail::assertSent(TeamInviteMail::class, 3);
    }

    public function test_admin_can_attach_existing_taska_user_without_creating_another_login(): void
    {
        ['owner' => $owner, 'business' => $business, 'branch' => $branch] = $this->createProvisionedWorkspace();
        $existingUser = User::factory()->create([
            'name' => 'Existing User',
            'email' => 'existing@example.com',
            'phone' => '08035550000',
        ]);

        $token = $owner->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/team', [
                'name' => 'Existing User',
                'email' => 'existing@example.com',
                'phone' => '08035550000',
                'role_slug' => 'manager',
                'branch_id' => $branch->id,
            ]);

        $response->assertCreated()
            ->assertJsonPath('created_new_user', false)
            ->assertJsonPath('summary.member_count', 2);

        $managerRoleId = Role::where('business_id', $business->id)->where('slug', 'manager')->value('id');

        $this->assertDatabaseHas('business_user', [
            'business_id' => $business->id,
            'user_id' => $existingUser->id,
            'role_id' => $managerRoleId,
            'branch_id' => $branch->id,
            'status' => 'active',
        ]);
    }

    public function test_admin_can_update_member_role_branch_and_status_and_suspended_member_loses_context(): void
    {
        ['owner' => $owner, 'business' => $business, 'branch' => $branch] = $this->createProvisionedWorkspace();
        $secondaryBranch = Branch::create([
            'business_id' => $business->id,
            'name' => 'Annex',
            'slug' => 'annex',
            'is_primary' => false,
            'is_active' => true,
        ]);

        $manager = User::factory()->create([
            'name' => 'Manager Mary',
            'email' => 'manager@example.com',
            'role' => 'manager',
        ]);

        $this->attachMember($manager, $business, 'manager', $branch, $owner, true);

        $ownerToken = $owner->createToken('owner-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $ownerToken)
            ->patchJson("/api/auth/team/{$manager->id}", [
                'role_slug' => 'cashier',
                'branch_id' => $secondaryBranch->id,
                'status' => 'suspended',
            ]);

        $cashierRoleId = Role::where('business_id', $business->id)->where('slug', 'cashier')->value('id');

        $response->assertOk()
            ->assertJsonPath('summary.active_member_count', 1)
            ->assertJsonPath('summary.suspended_member_count', 1);

        $this->assertDatabaseHas('business_user', [
            'business_id' => $business->id,
            'user_id' => $manager->id,
            'role_id' => $cashierRoleId,
            'branch_id' => $secondaryBranch->id,
            'status' => 'suspended',
        ]);

        $this->assertDatabaseMissing('role_user', [
            'business_id' => $business->id,
            'user_id' => $manager->id,
            'role_id' => Role::where('business_id', $business->id)->where('slug', 'manager')->value('id'),
        ]);

        Sanctum::actingAs($manager->fresh());

        $this->getJson('/api/auth/profile')
            ->assertOk()
            ->assertJsonPath('current_business', null)
            ->assertJsonCount(0, 'businesses')
            ->assertJsonPath('needs_business_onboarding', true);
    }

    public function test_admin_cannot_change_the_last_active_admin_or_demote_self(): void
    {
        ['owner' => $owner, 'business' => $business, 'branch' => $branch] = $this->createProvisionedWorkspace();
        $token = $owner->createToken('test-token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson("/api/auth/team/{$owner->id}", [
                'role_slug' => 'manager',
                'branch_id' => $branch->id,
                'status' => 'active',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['member']);

        $secondAdmin = User::factory()->create([
            'name' => 'Second Owner',
            'email' => 'owner2@example.com',
            'role' => 'admin',
        ]);

        $this->attachMember($secondAdmin, $business, 'admin', $branch, $owner);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson("/api/auth/team/{$owner->id}", [
                'role_slug' => 'admin',
                'branch_id' => $branch->id,
                'status' => 'suspended',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['member']);
    }

    public function test_non_admin_cannot_access_team_management_routes(): void
    {
        ['owner' => $owner, 'business' => $business, 'branch' => $branch] = $this->createProvisionedWorkspace();
        $manager = User::factory()->create([
            'name' => 'Manager Mary',
            'email' => 'manager@example.com',
            'role' => 'manager',
        ]);

        $this->attachMember($manager, $business, 'manager', $branch, $owner, true);
        $managerToken = $manager->createToken('manager-token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $managerToken)
            ->getJson('/api/auth/team')
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
