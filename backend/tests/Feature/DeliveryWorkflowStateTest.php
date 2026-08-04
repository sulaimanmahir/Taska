<?php

namespace Tests\Feature;

use App\Models\DeliveryContact;
use App\Models\DeliveryOrder;
use App\Models\DeliveryVehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class DeliveryWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_delivery_business_can_progress_pickup_delivery_remittance_and_otp(): void
    {
        $tenant = $this->createTenantContext('delivery', 'delivery-workflow@example.com');

        Sanctum::actingAs($tenant['user']);

        $vehicle = DeliveryVehicle::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'assigned_user_id' => $tenant['user']->id,
            'owner_name' => 'Taska Logistics Ltd',
            'registration_number' => 'DLV-001-AA',
            'vehicle_type' => 'bike',
            'capacity_description' => '1 bag',
            'ownership_model' => 'company_owned',
            'fuel_responsibility' => 'company',
            'maintenance_responsibility' => 'company',
            'is_active' => true,
        ]);

        $createResponse = $this->postJson('/api/deliveries', [
            'branch_id' => $tenant['branch']->id,
            'assigned_rider_id' => $tenant['user']->id,
            'vehicle_id' => $vehicle->id,
            'parcel_category' => 'documents',
            'parcel_description' => 'Signed originals',
            'pricing_model' => 'flat',
            'base_fee' => 2500,
            'pickup_address' => 'Market Road',
            'dropoff_address' => 'Hospital Road',
            'sender' => [
                'name' => 'Ibrahim Musa',
                'phone' => '08030000001',
                'address' => 'Market Road',
            ],
            'recipient' => [
                'name' => 'Zainab Aliyu',
                'phone' => '08030000002',
                'address' => 'Hospital Road',
            ],
        ])->assertCreated();

        $createResponse
            ->assertJsonPath('business_id', $tenant['business']->id)
            ->assertJsonPath('status', 'pending_pickup')
            ->assertJsonPath('vehicle.id', $vehicle->id);

        $sender = DeliveryContact::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Ibrahim Musa',
            'phone' => '08030000001',
            'address' => 'Market Road',
        ]);

        $recipient = DeliveryContact::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Zainab Aliyu',
            'phone' => '08030000002',
            'address' => 'Hospital Road',
        ]);

        $order = DeliveryOrder::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'sender_contact_id' => $sender->id,
            'recipient_contact_id' => $recipient->id,
            'assigned_rider_id' => $tenant['user']->id,
            'tracking_code' => 'TSK-STATE-001',
            'delivery_otp_code' => '123456',
            'status' => 'pending_pickup',
            'parcel_category' => 'documents',
            'pricing_model' => 'flat',
            'base_fee' => 2500,
            'distance_fee' => 0,
            'urgent_fee' => 0,
            'total_fee' => 2500,
            'cod_amount' => 8000,
            'amount_remitted' => 0,
            'is_urgent' => false,
            'pickup_address' => 'Market Road',
            'dropoff_address' => 'Hospital Road',
        ]);

        $this->postJson("/api/deliveries/{$order->id}/pickup", [
            'notes' => 'Parcel collected from sender',
            'proof_url' => 'https://example.com/pickup.jpg',
        ])->assertOk()
            ->assertJsonPath('status', 'picked_up')
            ->assertJsonPath('proof_of_pickup_url', 'https://example.com/pickup.jpg');

        $this->postJson("/api/deliveries/{$order->id}/deliver", [
            'notes' => 'Parcel handed to recipient',
            'proof_url' => 'https://example.com/delivery.jpg',
            'amount_remitted' => 5000,
        ])->assertOk()
            ->assertJsonPath('status', 'delivered')
            ->assertJsonPath('cod_fraud_flagged', true)
            ->assertJsonPath('amount_remitted', '5000.00');

        $this->postJson("/api/deliveries/{$order->id}/remittance", [
            'amount_remitted' => 8000,
            'notes' => 'Full COD remitted to office',
        ])->assertOk()
            ->assertJsonPath('amount_remitted', '8000.00');

        $this->postJson("/api/deliveries/{$order->id}/confirm-otp", [
            'otp_code' => '123456',
        ])->assertOk()
            ->assertJsonPath('tracking_code', 'TSK-STATE-001');

        $failedOrder = DeliveryOrder::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'sender_contact_id' => $sender->id,
            'recipient_contact_id' => $recipient->id,
            'assigned_rider_id' => $tenant['user']->id,
            'tracking_code' => 'TSK-STATE-003',
            'delivery_otp_code' => '888888',
            'status' => 'in_transit',
            'parcel_category' => 'electronics',
            'pricing_model' => 'flat',
            'base_fee' => 4000,
            'distance_fee' => 0,
            'urgent_fee' => 0,
            'total_fee' => 4000,
            'cod_amount' => 0,
            'amount_remitted' => 0,
            'is_urgent' => false,
            'pickup_address' => 'Central Market',
            'dropoff_address' => 'Barnawa',
        ]);

        $this->postJson("/api/deliveries/{$failedOrder->id}/fail", [
            'failed_delivery_reason' => 'Recipient unavailable',
            'rescheduled_for' => now()->addDay()->toDateString(),
        ])->assertOk()
            ->assertJsonPath('status', 'rescheduled')
            ->assertJsonPath('failed_delivery_reason', 'Recipient unavailable');

        $settlementOrder = DeliveryOrder::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'sender_contact_id' => $sender->id,
            'recipient_contact_id' => $recipient->id,
            'assigned_rider_id' => $tenant['user']->id,
            'tracking_code' => 'TSK-STATE-004',
            'delivery_otp_code' => '999999',
            'status' => 'delivered',
            'parcel_category' => 'fashion',
            'pricing_model' => 'flat',
            'base_fee' => 5000,
            'distance_fee' => 0,
            'urgent_fee' => 0,
            'total_fee' => 5000,
            'cod_amount' => 0,
            'amount_remitted' => 0,
            'is_urgent' => false,
            'pickup_address' => 'Sabo',
            'dropoff_address' => 'Ungwan Rimi',
        ]);

        $this->postJson("/api/deliveries/{$settlementOrder->id}/settle", [
            'fuel_deduction' => 200,
            'maintenance_deduction' => 100,
            'status' => 'approved',
        ])->assertOk()
            ->assertJsonPath('delivery_order_id', $settlementOrder->id)
            ->assertJsonPath('status', 'approved');

        $this->postJson("/api/deliveries/{$settlementOrder->id}/settlement-paid")
            ->assertOk()
            ->assertJsonPath('delivery_order_id', $settlementOrder->id)
            ->assertJsonPath('status', 'paid');
    }

    public function test_delivery_state_actions_are_hidden_from_other_businesses(): void
    {
        $tenant = $this->createTenantContext('delivery', 'delivery-owner@example.com');
        $otherTenant = $this->createTenantContext('delivery', 'delivery-guest@example.com');

        $sender = DeliveryContact::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Owner Sender',
            'phone' => '08031110001',
        ]);

        $recipient = DeliveryContact::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Owner Recipient',
            'phone' => '08031110002',
        ]);

        $foreignVehicle = DeliveryVehicle::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'owner_name' => 'Taska Logistics Ltd',
            'registration_number' => 'DLV-002-BB',
            'vehicle_type' => 'van',
            'capacity_description' => '5 boxes',
            'ownership_model' => 'company_owned',
            'fuel_responsibility' => 'company',
            'maintenance_responsibility' => 'company',
            'is_active' => true,
        ]);

        $order = DeliveryOrder::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'sender_contact_id' => $sender->id,
            'recipient_contact_id' => $recipient->id,
            'tracking_code' => 'TSK-STATE-002',
            'delivery_otp_code' => '654321',
            'status' => 'pending_pickup',
            'parcel_category' => 'box',
            'pricing_model' => 'flat',
            'base_fee' => 3000,
            'distance_fee' => 0,
            'urgent_fee' => 0,
            'total_fee' => 3000,
            'cod_amount' => 0,
            'amount_remitted' => 0,
            'is_urgent' => false,
            'pickup_address' => 'Owner Pickup',
            'dropoff_address' => 'Owner Dropoff',
        ]);

        Sanctum::actingAs($otherTenant['user']);

        $this->postJson('/api/deliveries', [
            'branch_id' => $tenant['branch']->id,
            'assigned_rider_id' => $tenant['user']->id,
            'vehicle_id' => $foreignVehicle->id,
            'parcel_category' => 'documents',
            'pricing_model' => 'flat',
            'base_fee' => 2000,
            'pickup_address' => 'Owner Pickup',
            'dropoff_address' => 'Owner Dropoff',
            'sender' => [
                'name' => 'Foreign Sender',
                'phone' => '08031110003',
            ],
            'recipient' => [
                'name' => 'Foreign Recipient',
                'phone' => '08031110004',
            ],
        ])->assertStatus(422);

        $this->postJson("/api/deliveries/{$order->id}/pickup", [])
            ->assertForbidden();

        $this->postJson("/api/deliveries/{$order->id}/confirm-otp", [
            'otp_code' => '654321',
        ])->assertForbidden();

        $this->postJson("/api/deliveries/{$order->id}/fail", [
            'failed_delivery_reason' => 'Blocked',
        ])->assertForbidden();

        $this->postJson("/api/deliveries/{$order->id}/settle", [
            'status' => 'approved',
        ])->assertForbidden();

        $this->postJson("/api/deliveries/{$order->id}/settlement-paid")
            ->assertForbidden();
    }
}
