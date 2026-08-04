<?php

namespace Tests\Feature;

use App\Models\BeautyAppointment;
use App\Models\BeautyService as BeautyServiceModel;
use App\Models\BeautyStaffProfile;
use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class BeautyOperationsTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_beauty_business_can_run_appointments_and_commissions_flow(): void
    {
        $tenant = $this->createTenantContext('beauty', 'salon-owner@example.com');
        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Ada Client',
            'phone' => '08038889999',
            'customer_type' => 'individual',
        ]);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Premium Hair Relaxer',
            'product_type' => 'good',
            'track_inventory' => 'yes',
            'cost_price' => 2200,
            'selling_price' => 3500,
            'low_stock_alert' => 4,
            'is_active' => true,
        ]);

        $this->getJson('/api/beauty/overview')
            ->assertOk()
            ->assertJsonPath('summary.appointments_today', 0);

        $serviceId = $this->postJson('/api/beauty/services', [
            'name' => 'Ghana Weaving',
            'category' => 'Hair',
            'duration_minutes' => 120,
            'price' => 18000,
            'commission_rate' => 25,
        ])->assertCreated()->json('id');

        $staffId = $this->postJson('/api/beauty/staff', [
            'name' => 'Chioma Stylist',
            'specialty' => 'Braids and treatment',
            'phone' => '08031112222',
        ])->assertCreated()->json('id');

        $appointmentId = $this->postJson('/api/beauty/appointments', [
            'customer_id' => $customer->id,
            'service_id' => $serviceId,
            'staff_profile_id' => $staffId,
            'appointment_at' => now()->toDateTimeString(),
            'notes' => 'Client wants neat center-part finishing.',
        ])->assertCreated()
            ->assertJsonPath('status', 'scheduled')
            ->json('id');

        $this->postJson("/api/beauty/appointments/{$appointmentId}/complete", [
            'service_price' => 19000,
            'commission_rate' => 30,
            'product_usages' => [[
                'product_id' => $product->id,
                'quantity' => 1,
                'unit_cost' => 2200,
            ]],
            'notes' => 'Paid and rebooked for treatment next month.',
        ])->assertOk()
            ->assertJsonPath('status', 'completed')
            ->assertJsonPath('commission_amount', 5700)
            ->assertJsonPath('product_cost', 2200);

        $this->getJson('/api/beauty/overview')
            ->assertOk()
            ->assertJsonPath('summary.completed_today', 1)
            ->assertJsonPath('summary.revenue_today', 19000)
            ->assertJsonPath('summary.commissions_due', 5700)
            ->assertJsonPath('summary.product_cost_today', 2200);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('business_type', 'beauty')
            ->assertJsonPath('beauty.appointments_today', 1)
            ->assertJsonPath('beauty.completed_today', 1)
            ->assertJsonPath('beauty.revenue_today', 19000)
            ->assertJsonPath('beauty.commissions_due', 5700);
    }

    public function test_beauty_endpoints_reject_foreign_tenant_relations_and_staff(): void
    {
        $tenant = $this->createTenantContext('beauty', 'beauty-scope@example.com');
        $otherTenant = $this->createTenantContext('beauty', 'beauty-other@example.com');

        $foreignUser = User::factory()->create([
            'email' => 'foreign-stylist@example.com',
            'role' => 'staff',
        ]);
        $this->attachActiveMember($foreignUser, $otherTenant['business']->id);

        $foreignCustomer = Customer::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Beauty Client',
            'phone' => '08030006661',
            'customer_type' => 'individual',
        ]);

        $foreignProduct = Product::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Hair Product',
            'product_type' => 'good',
            'track_inventory' => 'yes',
            'cost_price' => 1500,
            'selling_price' => 2500,
            'is_active' => true,
        ]);

        $foreignService = BeautyServiceModel::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Service',
            'price' => 12000,
            'commission_rate' => 20,
            'is_active' => true,
        ]);

        $foreignStaffProfile = BeautyStaffProfile::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'user_id' => $foreignUser->id,
            'name' => 'Foreign Stylist',
            'is_active' => true,
        ]);

        $foreignAppointment = BeautyAppointment::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'customer_id' => $foreignCustomer->id,
            'service_id' => $foreignService->id,
            'staff_profile_id' => $foreignStaffProfile->id,
            'appointment_at' => now(),
            'status' => 'scheduled',
            'service_price' => 12000,
        ]);

        $localService = BeautyServiceModel::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Local Service',
            'price' => 15000,
            'commission_rate' => 15,
            'is_active' => true,
        ]);

        $localAppointment = BeautyAppointment::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'service_id' => $localService->id,
            'appointment_at' => now(),
            'status' => 'scheduled',
            'service_price' => 15000,
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/beauty/staff', [
            'user_id' => $foreignUser->id,
            'name' => 'Invalid Stylist',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['user_id']);

        $this->postJson('/api/beauty/appointments', [
            'customer_id' => $foreignCustomer->id,
            'service_id' => $foreignService->id,
            'staff_profile_id' => $foreignStaffProfile->id,
            'appointment_at' => now()->toDateTimeString(),
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['customer_id', 'service_id', 'staff_profile_id']);

        $this->postJson("/api/beauty/appointments/{$localAppointment->id}/complete", [
            'product_usages' => [[
                'product_id' => $foreignProduct->id,
                'quantity' => 1,
                'unit_cost' => 1500,
            ]],
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['product_usages.0.product_id']);

        $this->postJson("/api/beauty/appointments/{$foreignAppointment->id}/complete")
            ->assertStatus(403);
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
