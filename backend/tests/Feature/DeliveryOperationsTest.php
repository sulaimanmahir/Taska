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

class DeliveryOperationsTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_manifest_dispute_and_operations_feed_work_for_delivery_business(): void
    {
        $tenant = $this->createTenantContext('delivery_company', 'ops@example.com');
        $rider = User::factory()->create(['email' => 'ops-rider@example.com', 'role' => 'rider']);
        $this->attachActiveMember($rider, $tenant['business']->id);

        $vehicle = DeliveryVehicle::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'assigned_user_id' => $rider->id,
            'vehicle_type' => 'motorcycle',
            'ownership_model' => 'company_owned',
            'owner_name' => 'Ops Fleet',
            'purchase_value' => 820000,
            'fuel_responsibility' => 'company',
            'maintenance_responsibility' => 'company',
            'is_active' => true,
        ]);

        $delivery = DeliveryOrder::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'sender_contact_id' => DeliveryContact::create([
                'business_id' => $tenant['business']->id,
                'name' => 'Manifest Sender',
                'phone' => '08050000000',
            ])->id,
            'recipient_contact_id' => DeliveryContact::create([
                'business_id' => $tenant['business']->id,
                'name' => 'Manifest Recipient',
                'phone' => '08050000001',
            ])->id,
            'tracking_code' => 'TSK-MANIFEST-001',
            'status' => 'pending_pickup',
            'parcel_category' => 'Electronics',
            'pricing_model' => 'flat',
            'base_fee' => 4500,
            'distance_fee' => 0,
            'urgent_fee' => 0,
            'total_fee' => 4500,
            'cod_amount' => 2000,
            'amount_remitted' => 0,
            'pickup_address' => 'Pickup Point',
            'dropoff_address' => 'Dropoff Point',
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/deliveries/manifests', [
            'branch_id' => $tenant['branch']->id,
            'vehicle_id' => $vehicle->id,
            'rider_id' => $rider->id,
            'title' => 'Kaduna Morning Run',
            'status' => 'dispatched',
            'delivery_order_ids' => [$delivery->id],
            'notes' => 'Prioritise fragile parcel handling.',
        ])->assertCreated()
            ->assertJsonPath('status', 'dispatched')
            ->assertJsonPath('orders.0.id', $delivery->id);

        $this->postJson("/api/deliveries/{$delivery->id}/disputes", [
            'category' => 'damaged_parcel',
            'summary' => 'Recipient reported outer packaging damage on arrival.',
        ])->assertCreated()
            ->assertJsonPath('status', 'open')
            ->assertJsonPath('order.id', $delivery->id);

        $this->postJson("/api/deliveries/{$delivery->id}/complaints", [
            'source' => 'customer_portal',
            'category' => 'late_delivery',
            'summary' => 'Customer complained that the parcel arrived later than promised.',
        ])->assertCreated()
            ->assertJsonPath('status', 'open')
            ->assertJsonPath('source', 'customer_portal');

        $this->getJson('/api/deliveries/operations')
            ->assertOk()
            ->assertJsonPath('manifests.0.title', 'Kaduna Morning Run')
            ->assertJsonPath('disputes.0.category', 'damaged_parcel')
            ->assertJsonPath('complaints.0.category', 'late_delivery')
            ->assertJsonPath('manifest_candidates.0.id', $delivery->id);

        $this->getJson('/api/tracking/TSK-MANIFEST-001')
            ->assertOk()
            ->assertJsonPath('tracking_code', 'TSK-MANIFEST-001')
            ->assertJsonPath('status', 'in_transit');
    }

    public function test_delivery_operations_reject_foreign_manifest_relations_and_foreign_order_actions(): void
    {
        $tenant = $this->createTenantContext('delivery_company', 'ops-scope@example.com');
        $otherTenant = $this->createTenantContext('delivery_company', 'ops-other@example.com');

        $foreignRider = User::factory()->create(['email' => 'foreign-ops-rider@example.com', 'role' => 'rider']);
        $this->attachActiveMember($foreignRider, $otherTenant['business']->id);

        $foreignVehicle = DeliveryVehicle::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'assigned_user_id' => $foreignRider->id,
            'vehicle_type' => 'motorcycle',
            'ownership_model' => 'company_owned',
            'owner_name' => 'Foreign Ops Fleet',
            'purchase_value' => 780000,
            'fuel_responsibility' => 'company',
            'maintenance_responsibility' => 'company',
            'is_active' => true,
        ]);

        $foreignDelivery = DeliveryOrder::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'sender_contact_id' => DeliveryContact::create([
                'business_id' => $otherTenant['business']->id,
                'name' => 'Foreign Manifest Sender',
                'phone' => '08050000012',
            ])->id,
            'recipient_contact_id' => DeliveryContact::create([
                'business_id' => $otherTenant['business']->id,
                'name' => 'Foreign Manifest Recipient',
                'phone' => '08050000013',
            ])->id,
            'assigned_rider_id' => $foreignRider->id,
            'vehicle_id' => $foreignVehicle->id,
            'tracking_code' => 'TSK-MANIFEST-FOREIGN',
            'status' => 'pending_pickup',
            'parcel_category' => 'Foreign Parcel',
            'pricing_model' => 'flat',
            'base_fee' => 4500,
            'distance_fee' => 0,
            'urgent_fee' => 0,
            'total_fee' => 4500,
            'cod_amount' => 0,
            'amount_remitted' => 0,
            'pickup_address' => 'Foreign Pickup',
            'dropoff_address' => 'Foreign Dropoff',
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/deliveries/manifests', [
            'branch_id' => $otherTenant['branch']->id,
            'vehicle_id' => $foreignVehicle->id,
            'rider_id' => $foreignRider->id,
            'title' => 'Foreign Route Manifest',
            'delivery_order_ids' => [$foreignDelivery->id],
        ])->assertStatus(422)
            ->assertJsonValidationErrors([
                'branch_id',
                'vehicle_id',
                'rider_id',
                'delivery_order_ids.0',
            ]);

        $this->postJson("/api/deliveries/{$foreignDelivery->id}/disputes", [
            'category' => 'damaged_parcel',
            'summary' => 'Unauthorized dispute',
        ])->assertStatus(403);

        $this->postJson("/api/deliveries/{$foreignDelivery->id}/complaints", [
            'category' => 'late_delivery',
            'summary' => 'Unauthorized complaint',
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
