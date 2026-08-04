<?php

namespace Tests\Feature;

use App\Models\DeliveryContact;
use App\Models\DeliveryOrder;
use App\Models\DeliveryVehicle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class DeliveryOperationsWorkflowTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_it_creates_manifests_disputes_and_complaints_with_structured_payloads(): void
    {
        $tenant = $this->createTenantContext('delivery', 'delivery-ops@example.com');

        $rider = User::factory()->create([
            'email' => 'manifest-rider@example.com',
            'role' => 'staff',
        ]);

        DB::table('business_user')->insert([
            'business_id' => $tenant['business']->id,
            'user_id' => $rider->id,
            'role_id' => null,
            'branch_id' => $tenant['branch']->id,
            'status' => 'active',
            'joined_at' => now(),
            'created_by' => null,
        ]);

        $vehicle = DeliveryVehicle::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'assigned_user_id' => $rider->id,
            'vehicle_type' => 'Bike',
            'ownership_model' => 'company_owned',
            'owner_name' => 'Taska Fleet',
            'fuel_responsibility' => 'company',
            'maintenance_responsibility' => 'company',
            'is_active' => true,
        ]);

        $sender = DeliveryContact::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Sender One',
            'phone' => '08030081111',
        ]);

        $recipient = DeliveryContact::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Recipient One',
            'phone' => '08030082222',
        ]);

        $order = DeliveryOrder::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'sender_contact_id' => $sender->id,
            'recipient_contact_id' => $recipient->id,
            'tracking_code' => 'TSK-DEL-001',
            'delivery_otp_code' => '123456',
            'status' => 'pending_pickup',
            'parcel_category' => 'documents',
            'pricing_model' => 'flat',
            'base_fee' => 2500,
            'distance_fee' => 0,
            'urgent_fee' => 0,
            'total_fee' => 2500,
            'cod_amount' => 0,
            'amount_remitted' => 0,
            'pickup_address' => '12 Broad Street',
            'dropoff_address' => '9 Allen Avenue',
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/deliveries/manifests', [
            'branch_id' => $tenant['branch']->id,
            'vehicle_id' => $vehicle->id,
            'rider_id' => $rider->id,
            'title' => 'Morning Dispatch',
            'status' => 'dispatched',
            'delivery_order_ids' => [$order->id],
        ])
            ->assertCreated()
            ->assertJsonPath('title', 'Morning Dispatch')
            ->assertJsonPath('vehicle.id', $vehicle->id)
            ->assertJsonPath('rider.email', 'manifest-rider@example.com')
            ->assertJsonPath('orders.0.tracking_code', 'TSK-DEL-001');

        $this->postJson("/api/deliveries/{$order->id}/disputes", [
            'category' => 'parcel_condition',
            'summary' => 'Package arrived wet.',
        ])
            ->assertCreated()
            ->assertJsonPath('category', 'parcel_condition')
            ->assertJsonPath('order.tracking_code', 'TSK-DEL-001');

        $this->postJson("/api/deliveries/{$order->id}/complaints", [
            'source' => 'customer',
            'category' => 'delay',
            'summary' => 'Rider came late to pickup.',
        ])
            ->assertCreated()
            ->assertJsonPath('source', 'customer')
            ->assertJsonPath('order.tracking_code', 'TSK-DEL-001');
    }

    public function test_it_rejects_foreign_tenant_delivery_order_and_linked_manifest_inputs(): void
    {
        $tenant = $this->createTenantContext('delivery', 'delivery-ops-scope@example.com');
        $otherTenant = $this->createTenantContext('delivery', 'delivery-ops-scope-other@example.com');

        $foreignSender = DeliveryContact::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Sender',
            'phone' => '08030083333',
        ]);

        $foreignRecipient = DeliveryContact::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Recipient',
            'phone' => '08030084444',
        ]);

        $foreignOrder = DeliveryOrder::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'sender_contact_id' => $foreignSender->id,
            'recipient_contact_id' => $foreignRecipient->id,
            'tracking_code' => 'TSK-DEL-FOREIGN',
            'delivery_otp_code' => '654321',
            'status' => 'pending_pickup',
            'parcel_category' => 'documents',
            'pricing_model' => 'flat',
            'base_fee' => 2000,
            'distance_fee' => 0,
            'urgent_fee' => 0,
            'total_fee' => 2000,
            'cod_amount' => 0,
            'amount_remitted' => 0,
            'pickup_address' => '10 Foreign Road',
            'dropoff_address' => '11 Foreign Road',
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/deliveries/manifests', [
            'title' => 'Invalid Dispatch',
            'delivery_order_ids' => [$foreignOrder->id],
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['delivery_order_ids.0']);

        $this->postJson("/api/deliveries/{$foreignOrder->id}/disputes", [
            'category' => 'loss',
            'summary' => 'Invalid dispute',
        ])->assertStatus(403);

        $this->postJson("/api/deliveries/{$foreignOrder->id}/complaints", [
            'category' => 'delay',
            'summary' => 'Invalid complaint',
        ])->assertStatus(403);
    }
}
