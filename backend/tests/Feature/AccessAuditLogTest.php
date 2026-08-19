<?php

namespace Tests\Feature;

use App\Models\AccessAuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class AccessAuditLogTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_adding_a_team_member_writes_an_audit_log_entry(): void
    {
        $tenant = $this->createTenantContext('retail', 'audit-owner@example.com');
        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/auth/team', [
            'name' => 'New Staff',
            'email' => 'new-staff@example.com',
            'password' => 'password123',
            'phone' => '',
            'role_slug' => 'admin',
            'branch_id' => $tenant['branch']->id,
        ])->assertCreated();

        $log = AccessAuditLog::where('business_id', $tenant['business']->id)
            ->where('action', 'member_added')
            ->first();

        $this->assertNotNull($log);
        $this->assertSame('user', $log->subject_type);
        $this->assertSame('New Staff', $log->subject_label);
        $this->assertSame($tenant['user']->id, $log->actor_id);
        $this->assertSame('admin', $log->changes['role_slug']['to']);
    }

    public function test_updating_a_member_logs_only_the_fields_that_actually_changed(): void
    {
        $tenant = $this->createTenantContext('retail', 'audit-owner-2@example.com');

        $staffRole = \App\Models\Role::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Staff',
            'slug' => 'staff',
            'description' => 'Limited access',
            'is_default' => false,
        ]);

        $member = User::factory()->create(['email' => 'member@example.com', 'password' => Hash::make('password123')]);
        DB::table('business_user')->insert([
            'business_id' => $tenant['business']->id,
            'user_id' => $member->id,
            'role_id' => $staffRole->id,
            'branch_id' => $tenant['branch']->id,
            'status' => 'active',
            'created_by' => $tenant['user']->id,
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->patchJson("/api/auth/team/{$member->id}", [
            'role_slug' => 'admin',
            'branch_id' => $tenant['branch']->id,
            'status' => 'active',
        ])->assertOk();

        $log = AccessAuditLog::where('business_id', $tenant['business']->id)
            ->where('action', 'member_updated')
            ->first();

        $this->assertNotNull($log);
        // branch_id and status didn't change, so only role_slug should appear.
        $this->assertArrayHasKey('role_slug', $log->changes);
        $this->assertArrayNotHasKey('branch_id', $log->changes);
        $this->assertArrayNotHasKey('status', $log->changes);
        $this->assertSame('staff', $log->changes['role_slug']['from']);
        $this->assertSame('admin', $log->changes['role_slug']['to']);
    }

    public function test_creating_and_updating_a_branch_writes_audit_log_entries(): void
    {
        $tenant = $this->createTenantContext('retail', 'audit-owner-3@example.com');
        Sanctum::actingAs($tenant['user']);

        $branchResponse = $this->postJson('/api/branches', [
            'name' => 'Kano Branch',
        ])->assertCreated();

        $createdLog = AccessAuditLog::where('business_id', $tenant['business']->id)
            ->where('action', 'branch_created')
            ->first();

        $this->assertNotNull($createdLog);
        $this->assertSame('Kano Branch', $createdLog->subject_label);

        $branchId = collect($branchResponse->json('branches'))->firstWhere('name', 'Kano Branch')['id'];

        $this->patchJson("/api/branches/{$branchId}", [
            'name' => 'Kano Branch (Renamed)',
        ])->assertOk();

        $updatedLog = AccessAuditLog::where('business_id', $tenant['business']->id)
            ->where('action', 'branch_updated')
            ->first();

        $this->assertNotNull($updatedLog);
        $this->assertSame('Kano Branch (Renamed)', $updatedLog->changes['name']['to']);
    }

    public function test_access_audit_log_endpoint_is_scoped_to_the_current_business(): void
    {
        $tenant = $this->createTenantContext('retail', 'audit-owner-4@example.com');
        $other = $this->createTenantContext('retail', 'audit-other@example.com');

        AccessAuditLog::create([
            'business_id' => $other['business']->id,
            'actor_id' => $other['user']->id,
            'action' => 'branch_created',
            'subject_type' => 'branch',
            'subject_id' => 1,
            'subject_label' => 'Foreign Branch',
            'changes' => [],
            'created_at' => now(),
        ]);

        Sanctum::actingAs($tenant['user']);

        $response = $this->getJson('/api/access-audit-log')->assertOk();

        $this->assertCount(0, $response->json());
    }

    public function test_non_admin_cannot_view_the_access_audit_log(): void
    {
        $tenant = $this->createTenantContext('retail', 'audit-owner-5@example.com');
        $staff = User::factory()->create(['role' => 'staff']);

        Sanctum::actingAs($staff);

        $this->getJson('/api/access-audit-log')->assertStatus(403);
    }
}
