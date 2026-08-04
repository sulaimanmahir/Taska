<?php

namespace Tests\Feature;

use App\Models\DeliveryOrder;
use App\Models\DeliverySettlement;
use App\Models\DeliveryVehicle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class DeliveryOverviewTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_delivery_overview_returns_operational_summary(): void
    {
        $tenant = $this->createTenantContext('delivery_company', 'overview@example.com');
        $rider = User::factory()->create(['email' => 'rider-two@example.com', 'role' => 'rider']);

        $vehicle = DeliveryVehicle::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'assigned_user_id' => $rider->id,
            'vehicle_type' => 'motorcycle',
            'ownership_model' => 'investor_owned',
            'owner_name' => 'Investor One',
            'purchase_value' => 700000,
            'fuel_responsibility' => 'company',
            'maintenance_responsibility' => 'company',
            'is_active' => true,
        ]);

        $delivery = DeliveryOrder::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'sender_contact_id' => \App\Models\DeliveryContact::create([
                'business_id' => $tenant['business']->id,
                'name' => 'Sender',
                'phone' => '08040000000',
            ])->id,
            'recipient_contact_id' => \App\Models\DeliveryContact::create([
                'business_id' => $tenant['business']->id,
                'name' => 'Recipient',
                'phone' => '08040000001',
            ])->id,
            'assigned_rider_id' => $rider->id,
            'vehicle_id' => $vehicle->id,
            'tracking_code' => 'TSK-TEST-001',
            'status' => 'delivered',
            'parcel_category' => 'Parcel',
            'pricing_model' => 'flat',
            'base_fee' => 5000,
            'distance_fee' => 0,
            'urgent_fee' => 0,
            'total_fee' => 5000,
            'cod_amount' => 6000,
            'amount_remitted' => 2000,
            'pickup_address' => 'Pickup',
            'dropoff_address' => 'Dropoff',
            'delivered_at' => now(),
        ]);

        DeliverySettlement::create([
            'business_id' => $tenant['business']->id,
            'delivery_order_id' => $delivery->id,
            'vehicle_id' => $vehicle->id,
            'rider_id' => $rider->id,
            'total_delivery_fee' => 5000,
            'rider_share' => 1750,
            'owner_share' => 1250,
            'company_share' => 2000,
            'fuel_deduction' => 250,
            'maintenance_deduction' => 150,
            'net_rider_payout' => 1350,
            'net_owner_payout' => 1250,
            'company_retained_earnings' => 2400,
            'status' => 'approved',
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->getJson('/api/deliveries/overview')
            ->assertOk()
            ->assertJsonPath('summary.delivered_total', 1)
            ->assertJsonPath('summary.pending_remittance', 4000)
            ->assertJsonPath('summary.investor_payouts_pending', 1250)
            ->assertJsonPath('rider_scorecards.0.rider_name', $rider->name)
            ->assertJsonPath('investor_payouts.0.owner_name', 'Investor One');
    }
}
