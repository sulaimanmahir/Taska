<?php

namespace Tests\Feature;

use App\Models\FuelPump;
use App\Models\FuelTank;
use App\Models\Staff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class FuelOperationsTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_fuel_business_can_track_tanks_nozzles_shifts_dips_and_price_changes(): void
    {
        $tenant = $this->createTenantContext('fuel_business', 'fuel-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $tankId = $this->postJson('/api/fuel/tanks', [
            'branch_id' => $tenant['branch']->id,
            'name' => 'PMS Tank 1',
            'fuel_type' => 'petrol',
            'capacity_litres' => 15000,
            'current_stock_litres' => 9000,
            'reorder_level_litres' => 3000,
            'price_per_litre' => 920,
        ])->assertCreated()->json('id');

        $pumpId = $this->postJson('/api/fuel/pumps', [
            'branch_id' => $tenant['branch']->id,
            'fuel_tank_id' => $tankId,
            'name' => 'Pump A',
            'code' => 'PMP-A',
            'attendant_name' => 'Aisha Bello',
            'nozzle_count' => 2,
            'meter_reading_start' => 12000,
            'meter_reading_current' => 12000,
        ])->assertCreated()->json('id');

        $this->postJson('/api/fuel/nozzle-readings', [
            'branch_id' => $tenant['branch']->id,
            'fuel_pump_id' => $pumpId,
            'attendant_name' => 'Aisha Bello',
            'shift_name' => 'Morning',
            'reading_date' => now()->toDateString(),
            'opening_reading' => 12000,
            'closing_reading' => 12120,
            'unit_price' => 920,
            'recorded_sales_amount' => 110400,
            'cash_reported' => 104000,
        ])->assertCreated()
            ->assertJsonPath('litres_sold', '120.00')
            ->assertJsonPath('status', 'variance_flagged');

        $this->postJson('/api/fuel/tank-dips', [
            'branch_id' => $tenant['branch']->id,
            'fuel_tank_id' => $tankId,
            'dipped_at' => now()->toDateTimeString(),
            'opening_stock_litres' => 8880,
            'deliveries_received_litres' => 0,
            'closing_stock_litres' => 8825,
            'notes' => 'Evening dip after rush hour.',
        ])->assertCreated()
            ->assertJsonPath('variance_litres', '-55.00');

        $this->postJson('/api/fuel/shifts', [
            'branch_id' => $tenant['branch']->id,
            'attendant_name' => 'Aisha Bello',
            'shift_name' => 'Morning',
            'opened_at' => now()->subHours(8)->toDateTimeString(),
            'closed_at' => now()->toDateTimeString(),
            'cash_expected' => 110400,
            'cash_reported' => 104000,
            'recovery_amount' => 1000,
        ])->assertCreated()
            ->assertJsonPath('shortage_amount', '5400.00');

        $this->postJson('/api/fuel/price-changes', [
            'branch_id' => $tenant['branch']->id,
            'fuel_type' => 'petrol',
            'new_price' => 935,
            'changed_by_name' => 'Manager Kabiru',
            'reason' => 'Depot landed cost increase',
        ])->assertCreated()
            ->assertJsonPath('old_price', '920.00')
            ->assertJsonPath('new_price', '935.00');

        $this->getJson('/api/fuel/overview')
            ->assertOk()
            ->assertJsonPath('summary.sales_today', 110400)
            ->assertJsonPath('summary.litres_today', 120)
            ->assertJsonPath('summary.open_shifts', 0)
            ->assertJsonPath('summary.shortage_today', 5400)
            ->assertJsonPath('summary.anomaly_alerts', 3);
    }

    public function test_fuel_endpoints_reject_foreign_tenant_branches_tanks_pumps_and_staff(): void
    {
        $tenant = $this->createTenantContext('fuel_business', 'fuel-scope@example.com');
        $otherTenant = $this->createTenantContext('fuel_business', 'fuel-other@example.com');

        $foreignTank = FuelTank::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Tank',
            'fuel_type' => 'petrol',
            'capacity_litres' => 10000,
            'current_stock_litres' => 5000,
            'price_per_litre' => 900,
            'status' => 'active',
        ]);

        $foreignPump = FuelPump::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'fuel_tank_id' => $foreignTank->id,
            'name' => 'Foreign Pump',
            'status' => 'active',
        ]);

        $foreignStaff = Staff::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Attendant',
            'role' => 'attendant',
            'status' => 'active',
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/fuel/tanks', [
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Invalid Tank',
            'fuel_type' => 'petrol',
            'capacity_litres' => 5000,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id']);

        $this->postJson('/api/fuel/pumps', [
            'branch_id' => $otherTenant['branch']->id,
            'fuel_tank_id' => $foreignTank->id,
            'name' => 'Invalid Pump',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id', 'fuel_tank_id']);

        $this->postJson('/api/fuel/nozzle-readings', [
            'branch_id' => $otherTenant['branch']->id,
            'fuel_pump_id' => $foreignPump->id,
            'attendant_name' => 'Invalid',
            'reading_date' => now()->toDateString(),
            'closing_reading' => 100,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id', 'fuel_pump_id']);

        $this->postJson('/api/fuel/tank-dips', [
            'branch_id' => $otherTenant['branch']->id,
            'fuel_tank_id' => $foreignTank->id,
            'dipped_at' => now()->toDateTimeString(),
            'closing_stock_litres' => 4500,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id', 'fuel_tank_id']);

        $this->postJson('/api/fuel/shifts', [
            'branch_id' => $otherTenant['branch']->id,
            'staff_id' => $foreignStaff->id,
            'attendant_name' => 'Invalid',
            'shift_name' => 'Night',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id', 'staff_id']);

        $this->postJson('/api/fuel/price-changes', [
            'branch_id' => $otherTenant['branch']->id,
            'fuel_type' => 'petrol',
            'new_price' => 950,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id']);
    }
}
