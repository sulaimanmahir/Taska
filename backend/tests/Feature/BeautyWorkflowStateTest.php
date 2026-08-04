<?php

namespace Tests\Feature;

use App\Models\BeautyAppointment;
use App\Models\BeautyService;
use App\Models\BeautyStaffProfile;
use App\Models\Customer;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class BeautyWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_beauty_business_can_complete_appointment_with_product_usage_and_commission(): void
    {
        $tenant = $this->createTenantContext('beauty_salon', 'beauty-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Halima Lawal',
            'phone' => '08056666666',
            'customer_type' => 'individual',
            'is_active' => true,
        ]);

        $service = BeautyService::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Bridal Makeup',
            'category' => 'Makeup',
            'duration_minutes' => 90,
            'price' => 25000,
            'commission_rate' => 20,
            'is_active' => true,
        ]);

        $staffProfile = BeautyStaffProfile::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Aisha Stylist',
            'specialty' => 'Makeup',
            'phone' => '08057777777',
            'commission_wallet' => 0,
            'is_active' => true,
        ]);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Fixing Spray',
            'sku' => 'BEAUTY-SPRAY-1',
            'product_type' => 'good',
            'cost_price' => 1500,
            'selling_price' => 3000,
            'track_inventory' => true,
            'is_active' => true,
        ]);

        $appointment = BeautyAppointment::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'customer_id' => $customer->id,
            'service_id' => $service->id,
            'staff_profile_id' => $staffProfile->id,
            'appointment_at' => now(),
            'status' => 'in_service',
            'service_price' => 25000,
        ]);

        $this->postJson("/api/beauty/appointments/{$appointment->id}/complete", [
            'service_price' => 26000,
            'commission_rate' => 25,
            'notes' => 'Client requested premium finish',
            'product_usages' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2,
                    'unit_cost' => 1500,
                ],
            ],
        ])->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.service_price', 26000)
            ->assertJsonPath('data.commission_amount', 6500)
            ->assertJsonPath('data.product_cost', 3000)
            ->assertJsonPath('data.staff_profile.commission_wallet', 6500)
            ->assertJsonPath('data.product_usages.0.product_name', 'Fixing Spray');
    }

    public function test_beauty_appointment_completion_is_hidden_from_other_businesses(): void
    {
        $tenant = $this->createTenantContext('beauty_salon', 'beauty-primary@example.com');
        $otherTenant = $this->createTenantContext('beauty_salon', 'beauty-secondary@example.com');

        $service = BeautyService::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Hair Styling',
            'price' => 12000,
            'commission_rate' => 15,
            'is_active' => true,
        ]);

        $appointment = BeautyAppointment::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'service_id' => $service->id,
            'appointment_at' => now(),
            'status' => 'scheduled',
            'service_price' => 12000,
        ]);

        Sanctum::actingAs($otherTenant['user']);

        $this->postJson("/api/beauty/appointments/{$appointment->id}/complete", [
            'service_price' => 12000,
        ])->assertForbidden();
    }
}
