<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class DeliveryVehicleWorkflowTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_it_creates_delivery_vehicles_with_structured_payloads(): void
    {
        $tenant = $this->createTenantContext('delivery', 'vehicle-workflow@example.com');

        $assignedUser = User::factory()->create([
            'email' => 'rider@example.com',
            'role' => 'staff',
        ]);

        DB::table('business_user')->insert([
            'business_id' => $tenant['business']->id,
            'user_id' => $assignedUser->id,
            'role_id' => null,
            'branch_id' => $tenant['branch']->id,
            'status' => 'active',
            'joined_at' => now(),
            'created_by' => null,
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/delivery-vehicles', [
            'branch_id' => $tenant['branch']->id,
            'assigned_user_id' => $assignedUser->id,
            'vehicle_type' => 'Motorbike',
            'ownership_model' => 'company_owned',
            'plate_number' => 'ABC-123XY',
            'owner_name' => 'Taska Logistics',
            'purchase_value' => 1200000,
            'fuel_responsibility' => 'company',
            'maintenance_responsibility' => 'company',
            'is_active' => true,
        ])
            ->assertCreated()
            ->assertJsonPath('vehicle_type', 'Motorbike')
            ->assertJsonPath('assigned_rider.email', 'rider@example.com')
            ->assertJsonPath('branch.id', $tenant['branch']->id)
            ->assertJsonPath('purchase_value', '1200000.00');
    }

    public function test_it_rejects_foreign_tenant_branch_and_assigned_user_links(): void
    {
        $tenant = $this->createTenantContext('delivery', 'vehicle-scope@example.com');
        $otherTenant = $this->createTenantContext('delivery', 'vehicle-scope-other@example.com');

        $foreignUser = User::factory()->create([
            'email' => 'foreign-rider@example.com',
            'role' => 'staff',
        ]);

        DB::table('business_user')->insert([
            'business_id' => $otherTenant['business']->id,
            'user_id' => $foreignUser->id,
            'role_id' => null,
            'branch_id' => $otherTenant['branch']->id,
            'status' => 'active',
            'joined_at' => now(),
            'created_by' => null,
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/delivery-vehicles', [
            'branch_id' => $otherTenant['branch']->id,
            'assigned_user_id' => $foreignUser->id,
            'vehicle_type' => 'Van',
            'ownership_model' => 'company_owned',
            'owner_name' => 'Invalid Fleet',
            'fuel_responsibility' => 'company',
            'maintenance_responsibility' => 'company',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id', 'assigned_user_id']);
    }
}
