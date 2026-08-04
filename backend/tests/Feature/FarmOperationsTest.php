<?php

namespace Tests\Feature;

use App\Models\FarmPlantingCycle;
use App\Models\FarmPlot;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class FarmOperationsTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_farm_business_can_track_plots_cycles_inputs_and_harvests(): void
    {
        $tenant = $this->createTenantContext('farm', 'farm-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $plotId = $this->postJson('/api/farm/plots', [
            'name' => 'North Field',
            'location' => 'Kaduna outer belt',
            'size_hectares' => 12.5,
            'soil_type' => 'Loam',
        ])->assertCreated()->json('id');

        $cycleId = $this->postJson('/api/farm/planting-cycles', [
            'plot_id' => $plotId,
            'crop_name' => 'Maize',
            'season_name' => 'Wet Season 2026',
            'planting_date' => now()->toDateString(),
            'expected_harvest_date' => now()->addMonths(4)->toDateString(),
            'planted_area_hectares' => 10,
            'status' => 'planted',
        ])->assertCreated()->json('id');

        $this->postJson('/api/farm/input-logs', [
            'planting_cycle_id' => $cycleId,
            'input_type' => 'fertilizer',
            'input_name' => 'NPK 15-15-15',
            'quantity' => 40,
            'unit' => 'bags',
            'cost' => 520000,
            'applied_on' => now()->toDateString(),
        ])->assertCreated();

        $this->postJson('/api/farm/harvest-logs', [
            'planting_cycle_id' => $cycleId,
            'quantity_harvested' => 6800,
            'unit' => 'kg',
            'estimated_revenue' => 3400000,
            'loss_quantity' => 150,
            'harvested_on' => now()->toDateString(),
        ])->assertCreated()
            ->assertJsonPath('planting_cycle.status', 'harvested');

        $this->getJson('/api/farm/overview')
            ->assertOk()
            ->assertJsonPath('summary.active_plots', 1)
            ->assertJsonPath('summary.input_cost_today', 520000)
            ->assertJsonPath('summary.harvest_today', 6800)
            ->assertJsonPath('summary.harvest_revenue_today', 3400000);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('business_type', 'farm')
            ->assertJsonPath('farm.active_plots', 1)
            ->assertJsonPath('farm.harvest_today', 6800);
    }

    public function test_farm_endpoints_reject_foreign_tenant_plots_and_cycles(): void
    {
        $tenant = $this->createTenantContext('farm', 'farm-scope@example.com');
        $otherTenant = $this->createTenantContext('farm', 'farm-other@example.com');

        $foreignPlot = FarmPlot::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Plot',
            'size_hectares' => 5,
            'status' => 'active',
        ]);

        $foreignCycle = FarmPlantingCycle::create([
            'business_id' => $otherTenant['business']->id,
            'plot_id' => $foreignPlot->id,
            'crop_name' => 'Rice',
            'planting_date' => now()->toDateString(),
            'status' => 'planted',
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/farm/planting-cycles', [
            'plot_id' => $foreignPlot->id,
            'crop_name' => 'Invalid Cycle',
            'planting_date' => now()->toDateString(),
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['plot_id']);

        $this->postJson('/api/farm/input-logs', [
            'planting_cycle_id' => $foreignCycle->id,
            'input_type' => 'seed',
            'input_name' => 'Hybrid Seed',
            'quantity' => 10,
            'applied_on' => now()->toDateString(),
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['planting_cycle_id']);

        $this->postJson('/api/farm/harvest-logs', [
            'planting_cycle_id' => $foreignCycle->id,
            'quantity_harvested' => 200,
            'harvested_on' => now()->toDateString(),
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['planting_cycle_id']);
    }
}
