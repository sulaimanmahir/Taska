<?php

namespace Tests\Feature;

use App\Models\FarmPlot;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class FarmWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_farm_business_can_progress_planting_cycle_through_inputs_and_harvest(): void
    {
        $tenant = $this->createTenantContext('crop_farming', 'farm-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $plot = FarmPlot::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'North Field',
            'location' => 'Kaduna axis',
            'size_hectares' => 5,
            'soil_type' => 'Loam',
            'status' => 'active',
        ]);

        $plantingResponse = $this->postJson('/api/farm/planting-cycles', [
            'plot_id' => $plot->id,
            'crop_name' => 'Maize',
            'season_name' => 'Wet Season',
            'planting_date' => now()->subDays(30)->toDateString(),
            'expected_harvest_date' => now()->addDays(60)->toDateString(),
            'planted_area_hectares' => 3.5,
            'status' => 'growing',
        ])->assertCreated()
            ->assertJsonPath('crop_name', 'Maize')
            ->assertJsonPath('plot.name', 'North Field');

        $cycleId = $plantingResponse->json('id');

        $this->postJson('/api/farm/input-logs', [
            'planting_cycle_id' => $cycleId,
            'input_type' => 'fertilizer',
            'input_name' => 'NPK 15-15-15',
            'quantity' => 8,
            'unit' => 'bag',
            'cost' => 96000,
            'applied_on' => now()->subDays(10)->toDateString(),
        ])->assertCreated()
            ->assertJsonPath('input_name', 'NPK 15-15-15')
            ->assertJsonPath('planting_cycle.status', 'growing');

        $this->postJson('/api/farm/harvest-logs', [
            'planting_cycle_id' => $cycleId,
            'quantity_harvested' => 4200,
            'unit' => 'kg',
            'estimated_revenue' => 2100000,
            'loss_quantity' => 120,
            'harvested_on' => now()->toDateString(),
        ])->assertCreated()
            ->assertJsonPath('quantity_harvested', '4200.000')
            ->assertJsonPath('planting_cycle.status', 'harvested');
    }
}
