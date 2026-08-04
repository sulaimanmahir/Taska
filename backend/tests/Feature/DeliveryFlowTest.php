<?php

namespace Tests\Feature;

use App\Models\DeliveryVehicle;
use App\Models\DeliveryWalletTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class DeliveryFlowTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_delivery_can_be_created_completed_reconciled_and_settled(): void
    {
        $tenant = $this->createTenantContext('delivery_company', 'delivery@example.com');
        $rider = User::factory()->create([
            'email' => 'rider@example.com',
            'role' => 'rider',
        ]);
        $this->attachActiveMember($rider, $tenant['business']->id);

        $vehicle = DeliveryVehicle::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'assigned_user_id' => $rider->id,
            'vehicle_type' => 'motorcycle',
            'ownership_model' => 'company_owned',
            'owner_name' => 'Taska Fleet',
            'purchase_value' => 950000,
            'fuel_responsibility' => 'company',
            'maintenance_responsibility' => 'company',
            'is_active' => true,
        ]);

        Sanctum::actingAs($tenant['user']);

        $createResponse = $this->postJson('/api/deliveries', [
            'branch_id' => $tenant['branch']->id,
            'assigned_rider_id' => $rider->id,
            'vehicle_id' => $vehicle->id,
            'parcel_category' => 'Documents',
            'parcel_description' => 'Legal documents',
            'pricing_model' => 'distance',
            'distance_km' => 12.5,
            'base_fee' => 3500,
            'distance_fee' => 1500,
            'urgent_fee' => 1000,
            'cod_amount' => 5000,
            'is_urgent' => true,
            'pickup_address' => '1 Ahmadu Bello Way, Kaduna',
            'dropoff_address' => '12 Independence Road, Kaduna',
            'sender' => [
                'name' => 'Sender One',
                'phone' => '08036666666',
                'address' => 'Kaduna',
            ],
            'recipient' => [
                'name' => 'Recipient One',
                'phone' => '08037777777',
                'address' => 'Kaduna',
            ],
            'offline' => [
                'created_offline' => true,
                'device_id' => 'android-kaduna-1',
                'local_timestamp' => now()->subMinute()->toISOString(),
            ],
        ]);

        $deliveryId = $createResponse->assertCreated()
            ->assertJsonPath('status', 'pending_pickup')
            ->json('id');

        $this->postJson("/api/deliveries/{$deliveryId}/pickup", [
            'proof_url' => 'https://example.com/pickup.jpg',
            'notes' => 'Package collected from sender.',
        ])->assertOk()->assertJsonPath('status', 'picked_up');

        $this->postJson("/api/deliveries/{$deliveryId}/deliver", [
            'proof_url' => 'https://example.com/delivery.jpg',
            'notes' => 'Delivered successfully.',
            'amount_remitted' => 3000,
        ])->assertOk()
            ->assertJsonPath('status', 'delivered')
            ->assertJsonPath('cod_fraud_flagged', true);

        $delivery = \App\Models\DeliveryOrder::findOrFail($deliveryId);

        $this->postJson("/api/deliveries/{$deliveryId}/confirm-otp", [
            'otp_code' => $delivery->delivery_otp_code,
        ])->assertOk()
            ->assertJsonPath('delivery_otp_verified_at', fn ($value) => filled($value));

        $this->postJson("/api/deliveries/{$deliveryId}/remittance", [
            'amount_remitted' => 5000,
            'notes' => 'Rider remitted outstanding COD balance.',
            'proof_url' => 'https://example.com/remittance.jpg',
        ])->assertOk()->assertJsonPath('amount_remitted', '5000.00');

        $this->postJson("/api/deliveries/{$deliveryId}/settle", [
            'fuel_deduction' => 250,
            'maintenance_deduction' => 100,
            'status' => 'approved',
        ])->assertOk()
            ->assertJsonPath('status', 'approved')
            ->assertJsonPath('total_delivery_fee', '6000.00');

        $this->postJson("/api/deliveries/{$deliveryId}/settlement-paid")
            ->assertOk()
            ->assertJsonPath('status', 'paid');

        $this->assertDatabaseHas('delivery_wallet_transactions', [
            'delivery_order_id' => $deliveryId,
            'rider_id' => $rider->id,
            'direction' => 'credit',
        ]);

        $this->assertGreaterThan(0, DeliveryWalletTransaction::count());
    }

    public function test_delivery_endpoints_reject_foreign_relations_and_vehicle_assignment(): void
    {
        $tenant = $this->createTenantContext('delivery_company', 'delivery-scope@example.com');
        $otherTenant = $this->createTenantContext('delivery_company', 'delivery-other@example.com');

        $foreignRider = User::factory()->create([
            'email' => 'foreign-rider@example.com',
            'role' => 'rider',
        ]);
        $this->attachActiveMember($foreignRider, $otherTenant['business']->id);

        $foreignVehicle = DeliveryVehicle::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'assigned_user_id' => $foreignRider->id,
            'vehicle_type' => 'motorcycle',
            'ownership_model' => 'company_owned',
            'owner_name' => 'Foreign Fleet',
            'purchase_value' => 900000,
            'fuel_responsibility' => 'company',
            'maintenance_responsibility' => 'company',
            'is_active' => true,
        ]);

        $foreignDelivery = \App\Models\DeliveryOrder::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'sender_contact_id' => \App\Models\DeliveryContact::create([
                'business_id' => $otherTenant['business']->id,
                'name' => 'Foreign Sender',
                'phone' => '08050000010',
            ])->id,
            'recipient_contact_id' => \App\Models\DeliveryContact::create([
                'business_id' => $otherTenant['business']->id,
                'name' => 'Foreign Recipient',
                'phone' => '08050000011',
            ])->id,
            'assigned_rider_id' => $foreignRider->id,
            'vehicle_id' => $foreignVehicle->id,
            'tracking_code' => 'TSK-FOREIGN-001',
            'status' => 'pending_pickup',
            'parcel_category' => 'Foreign Parcel',
            'pricing_model' => 'flat',
            'base_fee' => 3500,
            'distance_fee' => 0,
            'urgent_fee' => 0,
            'total_fee' => 3500,
            'cod_amount' => 0,
            'amount_remitted' => 0,
            'pickup_address' => 'Foreign Pickup',
            'dropoff_address' => 'Foreign Dropoff',
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/delivery-vehicles', [
            'branch_id' => $otherTenant['branch']->id,
            'assigned_user_id' => $foreignRider->id,
            'vehicle_type' => 'motorcycle',
            'ownership_model' => 'company_owned',
            'owner_name' => 'Invalid Fleet',
            'purchase_value' => 650000,
            'fuel_responsibility' => 'company',
            'maintenance_responsibility' => 'company',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id', 'assigned_user_id']);

        $this->postJson('/api/deliveries', [
            'branch_id' => $otherTenant['branch']->id,
            'pickup_branch_id' => $otherTenant['branch']->id,
            'dropoff_branch_id' => $otherTenant['branch']->id,
            'assigned_rider_id' => $foreignRider->id,
            'vehicle_id' => $foreignVehicle->id,
            'parcel_category' => 'Documents',
            'pricing_model' => 'flat',
            'base_fee' => 3000,
            'pickup_address' => 'Main Pickup',
            'dropoff_address' => 'Main Dropoff',
            'sender' => [
                'name' => 'Sender',
                'phone' => '08036661111',
            ],
            'recipient' => [
                'name' => 'Recipient',
                'phone' => '08037772222',
            ],
        ])->assertStatus(422)
            ->assertJsonValidationErrors([
                'branch_id',
                'pickup_branch_id',
                'dropoff_branch_id',
                'assigned_rider_id',
                'vehicle_id',
            ]);

        $this->getJson("/api/deliveries/{$foreignDelivery->id}")
            ->assertStatus(403);

        $this->postJson("/api/deliveries/{$foreignDelivery->id}/pickup", [
            'notes' => 'Unauthorized pickup attempt',
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
