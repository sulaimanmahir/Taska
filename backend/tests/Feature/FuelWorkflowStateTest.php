<?php

namespace Tests\Feature;

use App\Models\FuelPump;
use App\Models\FuelTank;
use App\Models\FuelVarianceAlert;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class FuelWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_fuel_business_can_record_nozzle_readings_and_shift_shortages(): void
    {
        $tenant = $this->createTenantContext('fuel_energy', 'fuel-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $tank = FuelTank::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'PMS Tank A',
            'fuel_type' => 'petrol',
            'capacity_litres' => 20000,
            'current_stock_litres' => 10000,
            'reorder_level_litres' => 2000,
            'price_per_litre' => 700,
            'status' => 'active',
        ]);

        $pump = FuelPump::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'fuel_tank_id' => $tank->id,
            'name' => 'Pump 1',
            'code' => 'P1',
            'attendant_name' => 'Rabi',
            'nozzle_count' => 1,
            'meter_reading_start' => 1000,
            'meter_reading_current' => 1000,
            'status' => 'active',
        ]);

        $this->postJson('/api/fuel/nozzle-readings', [
            'branch_id' => $tenant['branch']->id,
            'fuel_pump_id' => $pump->id,
            'attendant_name' => 'Rabi',
            'shift_name' => 'Morning',
            'reading_date' => now()->toDateString(),
            'closing_reading' => 1010,
            'cash_reported' => 5000,
        ])->assertCreated()
            ->assertJsonPath('litres_sold', '10.00')
            ->assertJsonPath('expected_sales_amount', '7000.00')
            ->assertJsonPath('variance_amount', '-2000.00')
            ->assertJsonPath('status', 'variance_flagged')
            ->assertJsonPath('pump.tank.current_stock_litres', '9990.00');

        $this->postJson('/api/fuel/shifts', [
            'branch_id' => $tenant['branch']->id,
            'attendant_name' => 'Rabi',
            'shift_name' => 'Morning',
            'cash_expected' => 7000,
            'cash_reported' => 5000,
            'recovery_amount' => 500,
            'closed_at' => now()->toJSON(),
        ])->assertCreated()
            ->assertJsonPath('shortage_amount', '1500.00')
            ->assertJsonPath('status', 'closed');

        $this->assertSame(2, FuelVarianceAlert::where('business_id', $tenant['business']->id)->count());
    }
}
