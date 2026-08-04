<?php

namespace Tests\Feature;

use App\Models\LivestockAnimalGroup;
use App\Models\LivestockPen;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class LivestockWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_livestock_business_can_record_weight_milk_and_breeding_metrics(): void
    {
        $tenant = $this->createTenantContext('livestock_farm', 'livestock-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $pen = LivestockPen::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Pen A',
            'section' => 'North wing',
            'capacity' => 40,
            'is_active' => true,
        ]);

        $group = LivestockAnimalGroup::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'pen_id' => $pen->id,
            'name' => 'Dairy Herd 1',
            'species' => 'cattle',
            'breed' => 'Friesian',
            'animal_count' => 18,
            'average_weight_kg' => 320,
            'status' => 'active',
            'acquired_on' => now()->subMonths(4)->toDateString(),
        ]);

        $this->postJson('/api/livestock/weights', [
            'animal_group_id' => $group->id,
            'weight_kg' => 345.5,
            'sample_size' => 5,
            'weighed_at' => now()->toJSON(),
        ])->assertCreated()
            ->assertJsonPath('data.weight_kg', 345.5)
            ->assertJsonPath('data.group.average_weight_kg', 345.5)
            ->assertJsonPath('data.group.pen.name', 'Pen A');

        $this->postJson('/api/livestock/milk-logs', [
            'animal_group_id' => $group->id,
            'litres' => 128.4,
            'recorded_on' => now()->toDateString(),
        ])->assertCreated()
            ->assertJsonPath('data.litres', 128.4)
            ->assertJsonPath('data.group.name', 'Dairy Herd 1');

        $this->postJson('/api/livestock/breeding-records', [
            'animal_group_id' => $group->id,
            'cycle_name' => 'Q2 breeding',
            'paired_count' => 10,
            'successful_births' => 8,
            'expected_delivery_date' => now()->addMonths(6)->toDateString(),
            'status' => 'confirmed',
        ])->assertCreated()
            ->assertJsonPath('data.cycle_name', 'Q2 breeding')
            ->assertJsonPath('data.successful_births', 8)
            ->assertJsonPath('data.group.name', 'Dairy Herd 1');
    }
}
