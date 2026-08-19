<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class PlatformAdminAccessTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_an_ordinary_business_owner_cannot_reach_platform_admin_routes(): void
    {
        // Every self-registered business owner gets the tenant-scoped
        // `role` column value "admin" by default (see
        // BusinessProvisioningService) - this must not be enough to reach
        // the platform-wide /api/admin/* routes.
        $tenant = $this->createTenantContext('retail', 'owner-not-platform-admin@example.com');
        $this->assertSame('admin', $tenant['user']->role);
        $this->assertFalse((bool) $tenant['user']->is_platform_admin);

        Sanctum::actingAs($tenant['user']);

        $this->getJson('/api/admin/stats')->assertForbidden();
        $this->getJson('/api/admin/users')->assertForbidden();
        $this->getJson('/api/admin/businesses')->assertForbidden();
        $this->postJson('/api/admin/suspend', ['id' => $tenant['user']->id])->assertForbidden();
    }

    public function test_a_platform_admin_can_reach_platform_admin_routes(): void
    {
        // suspendUser/activateUser/suspendBusiness are the only AdminController
        // actions that don't reference the nonexistent Subscription/
        // Transaction/SupportTicket/Referral models still imported at the top
        // of that controller (pre-existing dead code, out of scope here) - so
        // they're the ones worth asserting actually succeed end to end.
        $admin = $this->createTenantContext('retail', 'real-platform-admin@example.com');
        $admin['user']->forceFill(['is_platform_admin' => true])->save();
        $target = $this->createTenantContext('retail', 'suspend-target@example.com');

        Sanctum::actingAs($admin['user']);

        $this->postJson('/api/admin/suspend', ['id' => $target['user']->id])->assertOk();
        $this->assertFalse((bool) $target['user']->fresh()->is_active);

        $this->postJson('/api/admin/activate', ['id' => $target['user']->id])->assertOk();
        $this->assertTrue((bool) $target['user']->fresh()->is_active);

        $this->postJson('/api/admin/suspend-business', ['id' => $target['business']->id])->assertOk();
        $this->assertFalse((bool) $target['business']->fresh()->is_active);
    }

    public function test_tenant_scoped_team_routes_still_work_for_a_normal_business_owner(): void
    {
        // Regression guard: /auth/team must stay gated on the tenant-scoped
        // role check (hasRole('admin') within the current business), not on
        // is_platform_admin - platform admin status is unrelated to team
        // management within a business the owner actually owns.
        $tenant = $this->createTenantContext('retail', 'owner-team-access@example.com');
        Sanctum::actingAs($tenant['user']);

        $this->getJson('/api/auth/team')->assertOk();
    }

    public function test_grant_and_revoke_platform_admin_commands_toggle_the_flag(): void
    {
        $tenant = $this->createTenantContext('retail', 'grant-cli-target@example.com');
        $this->assertFalse((bool) $tenant['user']->is_platform_admin);

        $this->artisan('taska:grant-platform-admin', ['email' => 'grant-cli-target@example.com'])
            ->assertExitCode(0);
        $this->assertTrue((bool) $tenant['user']->fresh()->is_platform_admin);

        $this->artisan('taska:revoke-platform-admin', ['email' => 'grant-cli-target@example.com'])
            ->assertExitCode(0);
        $this->assertFalse((bool) $tenant['user']->fresh()->is_platform_admin);
    }
}
