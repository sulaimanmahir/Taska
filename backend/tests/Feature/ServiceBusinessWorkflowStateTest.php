<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\ServiceJob;
use App\Models\ServiceOffering;
use App\Models\ServiceStaffProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class ServiceBusinessWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_service_business_can_progress_and_reassign_jobs(): void
    {
        $tenant = $this->createTenantContext('service_business', 'service-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Amina Yusuf',
            'phone' => '08020000000',
            'balance' => 0,
            'customer_type' => 'individual',
            'is_active' => true,
        ]);

        $offering = ServiceOffering::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Home AC Repair',
            'category' => 'Maintenance',
            'duration_minutes' => 120,
            'base_price' => 35000,
            'is_active' => true,
        ]);

        $staffProfile = ServiceStaffProfile::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Usman Engineer',
            'specialty' => 'Cooling systems',
            'phone' => '08031111111',
            'is_active' => true,
        ]);

        $job = ServiceJob::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'customer_id' => $customer->id,
            'offering_id' => $offering->id,
            'status' => 'open',
            'quoted_amount' => 35000,
            'invoice_amount' => 35000,
            'amount_paid' => 0,
            'notes' => 'Initial assessment booked',
        ]);

        $this->patchJson("/api/service-business/jobs/{$job->id}", [
            'staff_profile_id' => $staffProfile->id,
            'status' => 'completed',
            'amount_paid' => 35000,
            'notes' => 'Resolved and collected on-site',
        ])->assertOk()
            ->assertJsonPath('data.staff_profile.name', 'Usman Engineer')
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.amount_paid', 35000)
            ->assertJsonPath('data.notes', 'Resolved and collected on-site');
    }

    public function test_service_job_updates_are_hidden_from_other_businesses(): void
    {
        $tenant = $this->createTenantContext('service_business', 'service-primary@example.com');
        $otherTenant = $this->createTenantContext('service_business', 'service-secondary@example.com');

        $offering = ServiceOffering::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Generator Fix',
            'base_price' => 20000,
            'is_active' => true,
        ]);

        $job = ServiceJob::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'offering_id' => $offering->id,
            'status' => 'open',
            'quoted_amount' => 20000,
            'invoice_amount' => 20000,
            'amount_paid' => 0,
        ]);

        Sanctum::actingAs($otherTenant['user']);

        $this->patchJson("/api/service-business/jobs/{$job->id}", [
            'status' => 'cancelled',
        ])->assertForbidden();
    }
}
