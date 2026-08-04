<?php

namespace Tests\Unit;

use App\Models\BeautyAppointment;
use App\Models\BeautyService as BeautyServiceModel;
use App\Models\Product;
use App\Models\ServiceOffering;
use App\Models\ServiceStaffProfile;
use App\Services\BeautyService;
use App\Services\ServiceBusinessService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class ClientServicesBoundaryTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_beauty_service_rejects_appointments_for_foreign_services(): void
    {
        $tenant = $this->createTenantContext('beauty', 'beauty-service-local@example.com');
        $foreignTenant = $this->createTenantContext('beauty', 'beauty-service-foreign@example.com');

        $foreignService = BeautyServiceModel::create([
            'business_id' => $foreignTenant['business']->id,
            'branch_id' => $foreignTenant['branch']->id,
            'name' => 'Foreign Styling',
            'price' => 12000,
            'commission_rate' => 20,
            'is_active' => true,
        ]);

        try {
            app(BeautyService::class)->storeAppointment([
                'service_id' => $foreignService->id,
                'appointment_at' => now()->toDateTimeString(),
            ], $tenant['user']);

            $this->fail('Expected beauty service to reject a foreign appointment service.');
        } catch (ModelNotFoundException $exception) {
            $this->assertDatabaseCount('beauty_appointments', 0);
        }
    }

    public function test_beauty_service_rejects_product_usage_outside_the_business_scope(): void
    {
        $tenant = $this->createTenantContext('beauty', 'beauty-complete-local@example.com');
        $foreignTenant = $this->createTenantContext('beauty', 'beauty-complete-foreign@example.com');

        $localService = BeautyServiceModel::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Local Styling',
            'price' => 15000,
            'commission_rate' => 15,
            'is_active' => true,
        ]);

        $appointment = BeautyAppointment::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'service_id' => $localService->id,
            'appointment_at' => now(),
            'status' => 'scheduled',
            'service_price' => 15000,
        ]);

        $foreignProduct = Product::create([
            'business_id' => $foreignTenant['business']->id,
            'name' => 'Foreign Product',
            'product_type' => 'good',
            'track_inventory' => 'yes',
            'cost_price' => 1500,
            'selling_price' => 2500,
            'is_active' => true,
        ]);

        try {
            app(BeautyService::class)->completeAppointment($appointment, [
                'product_usages' => [[
                    'product_id' => $foreignProduct->id,
                    'quantity' => 1,
                    'unit_cost' => 1500,
                ]],
            ]);

            $this->fail('Expected beauty service to reject a foreign product usage.');
        } catch (ModelNotFoundException $exception) {
            $this->assertDatabaseCount('beauty_product_usages', 0);
        }
    }

    public function test_service_business_service_rejects_bookings_for_foreign_offerings(): void
    {
        $tenant = $this->createTenantContext('service', 'service-booking-local@example.com');
        $foreignTenant = $this->createTenantContext('service', 'service-booking-foreign@example.com');

        $foreignOffering = ServiceOffering::create([
            'business_id' => $foreignTenant['business']->id,
            'branch_id' => $foreignTenant['branch']->id,
            'name' => 'Foreign Offering',
            'base_price' => 40000,
            'is_active' => true,
        ]);

        try {
            app(ServiceBusinessService::class)->storeBooking([
                'offering_id' => $foreignOffering->id,
                'scheduled_for' => now()->toDateTimeString(),
            ], $tenant['user']);

            $this->fail('Expected service business service to reject a foreign offering.');
        } catch (ModelNotFoundException $exception) {
            $this->assertDatabaseCount('service_bookings', 0);
        }
    }

    public function test_service_business_service_rejects_foreign_staff_assignment_on_update(): void
    {
        $tenant = $this->createTenantContext('service', 'service-job-local@example.com');
        $foreignTenant = $this->createTenantContext('service', 'service-job-foreign@example.com');

        $localOffering = ServiceOffering::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Local Offering',
            'base_price' => 20000,
            'is_active' => true,
        ]);

        $job = \App\Models\ServiceJob::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'offering_id' => $localOffering->id,
            'status' => 'open',
            'quoted_amount' => 20000,
            'invoice_amount' => 20000,
            'amount_paid' => 0,
        ]);

        $foreignStaffProfile = ServiceStaffProfile::create([
            'business_id' => $foreignTenant['business']->id,
            'branch_id' => $foreignTenant['branch']->id,
            'name' => 'Foreign Technician',
            'is_active' => true,
        ]);

        try {
            app(ServiceBusinessService::class)->updateJob($job, [
                'staff_profile_id' => $foreignStaffProfile->id,
            ]);

            $this->fail('Expected service business service to reject a foreign staff profile.');
        } catch (ModelNotFoundException $exception) {
            $this->assertNull($job->fresh()->staff_profile_id);
        }
    }
}
