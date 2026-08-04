<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\ServiceBooking;
use App\Models\ServiceJob;
use App\Models\ServiceOffering;
use App\Models\ServiceStaffProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class ServiceBusinessOperationsTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_service_business_can_run_bookings_jobs_and_invoice_flow(): void
    {
        $tenant = $this->createTenantContext('service', 'service-owner@example.com');
        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Peak Estates Ltd',
            'phone' => '08032223333',
            'customer_type' => 'individual',
        ]);

        $this->getJson('/api/service-business/overview')
            ->assertOk()
            ->assertJsonPath('summary.bookings_today', 0);

        $offeringId = $this->postJson('/api/service-business/offerings', [
            'name' => 'Air Conditioner Servicing',
            'category' => 'Facility Maintenance',
            'duration_minutes' => 180,
            'base_price' => 45000,
        ])->assertCreated()->json('id');

        $staffId = $this->postJson('/api/service-business/staff', [
            'name' => 'Tunde Technician',
            'specialty' => 'Cooling systems',
            'phone' => '08030009999',
        ])->assertCreated()->json('id');

        $bookingId = $this->postJson('/api/service-business/bookings', [
            'customer_id' => $customer->id,
            'offering_id' => $offeringId,
            'scheduled_for' => now()->toDateTimeString(),
            'referral_source' => 'Returning client',
            'notes' => 'Urgent office maintenance request.',
        ])->assertCreated()->json('id');

        $jobId = $this->postJson('/api/service-business/jobs', [
            'booking_id' => $bookingId,
            'offering_id' => $offeringId,
            'staff_profile_id' => $staffId,
            'quoted_amount' => 48000,
            'invoice_amount' => 50000,
            'amount_paid' => 10000,
            'due_date' => now()->addDays(7)->toDateString(),
            'notes' => 'Deposit received before site visit.',
        ])->assertCreated()
            ->assertJsonPath('status', 'open')
            ->json('id');

        $this->patchJson("/api/service-business/jobs/{$jobId}", [
            'status' => 'completed',
            'amount_paid' => 30000,
            'notes' => 'Work completed, balance awaiting finance approval.',
        ])->assertOk()
            ->assertJsonPath('status', 'completed')
            ->assertJsonPath('amount_paid', 30000);

        $this->getJson('/api/service-business/overview')
            ->assertOk()
            ->assertJsonPath('summary.bookings_today', 1)
            ->assertJsonPath('summary.revenue_today', 50000)
            ->assertJsonPath('summary.invoices_outstanding', 20000)
            ->assertJsonPath('summary.assigned_staff', 1);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('business_type', 'service')
            ->assertJsonPath('service.bookings_today', 1)
            ->assertJsonPath('service.revenue_today', 50000)
            ->assertJsonPath('service.invoices_outstanding', 20000);
    }

    public function test_service_business_endpoints_reject_foreign_tenant_relations_and_staff(): void
    {
        $tenant = $this->createTenantContext('service', 'service-scope@example.com');
        $otherTenant = $this->createTenantContext('service', 'service-other@example.com');

        $foreignUser = User::factory()->create([
            'email' => 'foreign-technician@example.com',
            'role' => 'staff',
        ]);
        $this->attachActiveMember($foreignUser, $otherTenant['business']->id);

        $foreignCustomer = Customer::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Client',
            'phone' => '08031118888',
            'customer_type' => 'individual',
        ]);

        $foreignOffering = ServiceOffering::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Offering',
            'base_price' => 40000,
            'is_active' => true,
        ]);

        $foreignStaffProfile = ServiceStaffProfile::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'user_id' => $foreignUser->id,
            'name' => 'Foreign Technician',
            'is_active' => true,
        ]);

        $foreignBooking = ServiceBooking::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'customer_id' => $foreignCustomer->id,
            'offering_id' => $foreignOffering->id,
            'scheduled_for' => now(),
            'status' => 'scheduled',
        ]);

        $foreignJob = ServiceJob::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'booking_id' => $foreignBooking->id,
            'customer_id' => $foreignCustomer->id,
            'offering_id' => $foreignOffering->id,
            'staff_profile_id' => $foreignStaffProfile->id,
            'status' => 'open',
            'quoted_amount' => 40000,
            'invoice_amount' => 42000,
            'amount_paid' => 0,
        ]);

        $localOffering = ServiceOffering::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Local Offering',
            'base_price' => 20000,
            'is_active' => true,
        ]);

        $localJob = ServiceJob::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'offering_id' => $localOffering->id,
            'status' => 'open',
            'quoted_amount' => 20000,
            'invoice_amount' => 20000,
            'amount_paid' => 0,
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/service-business/staff', [
            'user_id' => $foreignUser->id,
            'name' => 'Invalid Tech',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['user_id']);

        $this->postJson('/api/service-business/bookings', [
            'customer_id' => $foreignCustomer->id,
            'offering_id' => $foreignOffering->id,
            'scheduled_for' => now()->toDateTimeString(),
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['customer_id', 'offering_id']);

        $this->postJson('/api/service-business/jobs', [
            'booking_id' => $foreignBooking->id,
            'customer_id' => $foreignCustomer->id,
            'offering_id' => $foreignOffering->id,
            'staff_profile_id' => $foreignStaffProfile->id,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['booking_id', 'customer_id', 'offering_id', 'staff_profile_id']);

        $this->patchJson("/api/service-business/jobs/{$localJob->id}", [
            'staff_profile_id' => $foreignStaffProfile->id,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['staff_profile_id']);

        $this->patchJson("/api/service-business/jobs/{$foreignJob->id}", [
            'status' => 'completed',
        ])->assertStatus(403);
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
