<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Staff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class StaffWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_it_creates_updates_and_shows_staff_with_structured_payloads(): void
    {
        $tenant = $this->createTenantContext('general', 'staff-workflow@example.com');
        Sanctum::actingAs($tenant['user']);

        $branch = Branch::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Field Branch',
            'slug' => 'field-branch',
            'is_primary' => false,
            'is_active' => true,
        ]);

        $createResponse = $this->postJson('/api/staff', [
            'name' => 'Mary James',
            'email' => 'mary.james@example.com',
            'phone' => '08030061111',
            'role' => 'Supervisor',
            'branch_id' => $branch->id,
            'employment_type' => 'full_time',
            'salary' => 95000,
            'hire_date' => today()->toDateString(),
        ])->assertCreated();

        $staffId = $createResponse->json('id');

        $createResponse
            ->assertJsonPath('name', 'Mary James')
            ->assertJsonPath('branch.name', 'Field Branch')
            ->assertJsonPath('salary', '95000.00');

        $this->patchJson("/api/staff/{$staffId}", [
            'salary' => 105000,
            'status' => 'active',
        ])
            ->assertOk()
            ->assertJsonPath('salary', '105000.00')
            ->assertJsonPath('status', 'active');

        $this->getJson("/api/staff/{$staffId}")
            ->assertOk()
            ->assertJsonPath('name', 'Mary James')
            ->assertJsonPath('branch.name', 'Field Branch');
    }

    public function test_it_rejects_foreign_tenant_staff_reads_and_updates(): void
    {
        $tenant = $this->createTenantContext('general', 'staff-scope@example.com');
        $otherTenant = $this->createTenantContext('general', 'staff-scope-other@example.com');

        $foreignStaff = Staff::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Staff',
            'email' => 'foreign.staff@example.com',
            'role' => 'Clerk',
            'status' => 'active',
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->getJson("/api/staff/{$foreignStaff->id}")
            ->assertStatus(403);

        $this->patchJson("/api/staff/{$foreignStaff->id}", [
            'status' => 'terminated',
        ])->assertStatus(403);
    }
}
