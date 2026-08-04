<?php

namespace Tests\Feature;

use App\Models\LogisticsFleetAsset;
use App\Models\LogisticsTripSheet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class LogisticsWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_logistics_business_can_update_and_settle_trip_sheets(): void
    {
        $tenant = $this->createTenantContext('logistics', 'logistics-workflow@example.com');

        Sanctum::actingAs($tenant['user']);

        $asset = LogisticsFleetAsset::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'assigned_driver_id' => $tenant['user']->id,
            'asset_type' => 'truck',
            'name' => 'Fleet One',
            'plate_number' => 'ABC-123LG',
            'ownership_model' => 'company_owned',
            'status' => 'active',
        ]);

        $trip = LogisticsTripSheet::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'fleet_asset_id' => $asset->id,
            'driver_id' => $tenant['user']->id,
            'trip_code' => 'TRP-LOG-001',
            'job_type' => 'haulage',
            'customer_name' => 'Northern Depot',
            'route_name' => 'Kano to Abuja',
            'origin' => 'Kano',
            'destination' => 'Abuja',
            'trip_date' => now()->toDateString(),
            'status' => 'planned',
            'expected_revenue' => 150000,
            'actual_revenue' => 0,
            'distance_km' => 420,
            'expected_fuel_cost' => 30000,
            'payment_status' => 'pending',
        ]);

        $this->patchJson("/api/logistics/trip-sheets/{$trip->id}", [
            'status' => 'completed',
            'actual_revenue' => 165000,
            'actual_fuel_cost' => 32000,
            'loading_cost' => 5000,
            'driver_allowance' => 8000,
            'maintenance_cost' => 4000,
            'other_cost' => 1000,
            'payment_status' => 'partial',
            'notes' => 'Delivered all consignments',
        ])->assertOk()
            ->assertJsonPath('status', 'completed')
            ->assertJsonPath('actual_revenue', 165000)
            ->assertJsonPath('payment_status', 'partial');

        $this->postJson("/api/logistics/trip-sheets/{$trip->id}/settle", [
            'gross_revenue' => 165000,
            'trip_cost' => 50000,
            'driver_payout' => 25000,
            'company_retained' => 90000,
            'fuel_deduction' => 2000,
            'maintenance_deduction' => 1000,
            'status' => 'approved',
        ])->assertOk()
            ->assertJsonPath('status', 'approved')
            ->assertJsonPath('trip.trip_code', 'TRP-LOG-001')
            ->assertJsonPath('driver_payout', 25000);
    }

    public function test_logistics_trip_actions_are_hidden_from_other_businesses(): void
    {
        $tenant = $this->createTenantContext('logistics', 'logistics-owner@example.com');
        $otherTenant = $this->createTenantContext('logistics', 'logistics-guest@example.com');

        $trip = LogisticsTripSheet::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'trip_code' => 'TRP-OWNER-001',
            'route_name' => 'Owner Route',
            'origin' => 'Jos',
            'destination' => 'Kaduna',
            'trip_date' => now()->toDateString(),
            'status' => 'planned',
        ]);

        Sanctum::actingAs($otherTenant['user']);

        $this->patchJson("/api/logistics/trip-sheets/{$trip->id}", [
            'status' => 'cancelled',
        ])->assertForbidden();

        $this->postJson("/api/logistics/trip-sheets/{$trip->id}/settle", [
            'status' => 'approved',
        ])->assertForbidden();
    }
}
