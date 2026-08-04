<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\LogisticsFleetAsset;
use App\Models\LogisticsTripSheet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class LogisticsOperationsTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_logistics_business_can_manage_trips_fuel_maintenance_and_settlements(): void
    {
        $tenant = $this->createTenantContext('logistics', 'logistics-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $driver = User::factory()->create([
            'email' => 'driver@example.com',
            'password' => Hash::make('password123'),
            'current_business_id' => $tenant['business']->id,
            'current_branch_id' => $tenant['branch']->id,
        ]);
        $this->attachActiveMember($driver, $tenant['business']->id);

        $assetId = $this->postJson('/api/logistics/fleet-assets', [
            'assigned_driver_id' => $driver->id,
            'asset_type' => 'truck',
            'name' => '40ft Flatbed',
            'plate_number' => 'KAD-445-TR',
            'ownership_model' => 'company_owned',
            'capacity_unit' => 'ton',
            'capacity_value' => 35,
            'purchase_value' => 32000000,
            'target_km_per_litre' => 2.5,
            'fuel_responsibility' => 'company',
            'maintenance_responsibility' => 'company',
        ])->assertCreated()->json('id');

        $tripId = $this->postJson('/api/logistics/trip-sheets', [
            'fleet_asset_id' => $assetId,
            'driver_id' => $driver->id,
            'job_type' => 'haulage',
            'customer_name' => 'Northline Projects',
            'route_name' => 'Kaduna to Abuja Steel Run',
            'origin' => 'Kaduna Yard',
            'destination' => 'Gwarinpa Site',
            'trip_date' => now()->toDateString(),
            'status' => 'dispatched',
            'expected_revenue' => 780000,
            'distance_km' => 240,
            'expected_fuel_cost' => 165000,
            'loading_cost' => 30000,
            'driver_allowance' => 25000,
            'other_cost' => 15000,
            'stops' => [
                [
                    'stop_name' => 'Gwarinpa Site Gate',
                    'location' => 'Abuja',
                    'expected_revenue' => 780000,
                ],
            ],
        ])->assertCreated()
            ->assertJsonPath('stops.0.stop_name', 'Gwarinpa Site Gate')
            ->json('id');

        $this->postJson('/api/logistics/fuel-logs', [
            'trip_sheet_id' => $tripId,
            'fleet_asset_id' => $assetId,
            'log_date' => now()->toDateString(),
            'litres' => 300,
            'unit_cost' => 990,
            'odometer_km' => 126500,
            'source' => 'cash',
        ])->assertCreated()
            ->assertJsonPath('amount', 297000);

        $this->postJson('/api/logistics/maintenance-logs', [
            'trip_sheet_id' => $tripId,
            'fleet_asset_id' => $assetId,
            'logged_on' => now()->toDateString(),
            'category' => 'tyre',
            'status' => 'open',
            'cost' => 45000,
            'summary' => 'Rear tyre replacement scheduled after Abuja run.',
        ])->assertCreated();

        $this->patchJson("/api/logistics/trip-sheets/{$tripId}", [
            'status' => 'completed',
            'actual_revenue' => 820000,
            'payment_status' => 'partial',
        ])->assertOk()
            ->assertJsonPath('status', 'completed');

        $this->postJson("/api/logistics/trip-sheets/{$tripId}/settle", [
            'status' => 'approved',
        ])->assertOk()
            ->assertJsonPath('status', 'approved');

        $this->getJson('/api/logistics/overview')
            ->assertOk()
            ->assertJsonPath('summary.trips_today', 1)
            ->assertJsonPath('summary.completed_today', 1)
            ->assertJsonPath('summary.active_trips', 0)
            ->assertJsonPath('summary.fuel_cost_today', 297000)
            ->assertJsonPath('summary.open_maintenance', 1);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('business_type', 'logistics')
            ->assertJsonPath('logistics.trips_today', 1)
            ->assertJsonPath('logistics.maintenance_open', 1);
    }

    public function test_logistics_endpoints_reject_foreign_tenant_drivers_assets_trips_and_stops(): void
    {
        $tenant = $this->createTenantContext('logistics', 'logistics-scope@example.com');
        $otherTenant = $this->createTenantContext('logistics', 'logistics-other@example.com');

        $foreignDriver = User::factory()->create([
            'email' => 'foreign-driver@example.com',
            'password' => Hash::make('password123'),
            'current_business_id' => $otherTenant['business']->id,
            'current_branch_id' => $otherTenant['branch']->id,
        ]);
        $this->attachActiveMember($foreignDriver, $otherTenant['business']->id);

        $foreignCustomer = Customer::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Delivery Client',
            'phone' => '08030002221',
            'customer_type' => 'retailer',
        ]);

        $foreignAsset = LogisticsFleetAsset::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'assigned_driver_id' => $foreignDriver->id,
            'asset_type' => 'truck',
            'name' => 'Foreign Flatbed',
            'status' => 'active',
            'fuel_responsibility' => 'company',
            'maintenance_responsibility' => 'company',
        ]);

        $foreignTrip = LogisticsTripSheet::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'fleet_asset_id' => $foreignAsset->id,
            'driver_id' => $foreignDriver->id,
            'trip_code' => 'TRP-FOREIGN-001',
            'route_name' => 'Foreign Route',
            'origin' => 'Origin',
            'destination' => 'Destination',
            'trip_date' => now()->toDateString(),
            'status' => 'planned',
            'payment_status' => 'pending',
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/logistics/fleet-assets', [
            'assigned_driver_id' => $foreignDriver->id,
            'asset_type' => 'truck',
            'name' => 'Invalid Asset',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['assigned_driver_id']);

        $this->postJson('/api/logistics/trip-sheets', [
            'fleet_asset_id' => $foreignAsset->id,
            'driver_id' => $foreignDriver->id,
            'route_name' => 'Invalid Trip',
            'origin' => 'Yard',
            'destination' => 'Site',
            'trip_date' => now()->toDateString(),
            'stops' => [[
                'customer_id' => $foreignCustomer->id,
                'stop_name' => 'Invalid Stop',
            ]],
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['fleet_asset_id', 'driver_id', 'stops.0.customer_id']);

        $this->postJson('/api/logistics/fuel-logs', [
            'trip_sheet_id' => $foreignTrip->id,
            'fleet_asset_id' => $foreignAsset->id,
            'log_date' => now()->toDateString(),
            'litres' => 100,
            'unit_cost' => 950,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['trip_sheet_id', 'fleet_asset_id']);

        $this->postJson('/api/logistics/maintenance-logs', [
            'trip_sheet_id' => $foreignTrip->id,
            'fleet_asset_id' => $foreignAsset->id,
            'logged_on' => now()->toDateString(),
            'summary' => 'Invalid maintenance',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['trip_sheet_id', 'fleet_asset_id']);

        $this->patchJson("/api/logistics/trip-sheets/{$foreignTrip->id}", [
            'status' => 'completed',
        ])->assertStatus(403);

        $this->postJson("/api/logistics/trip-sheets/{$foreignTrip->id}/settle", [
            'status' => 'approved',
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
