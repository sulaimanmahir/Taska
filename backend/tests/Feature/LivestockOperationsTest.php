<?php

namespace Tests\Feature;

use App\Models\LivestockAnimalGroup;
use App\Models\LivestockPen;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class LivestockOperationsTest extends TestCase
{
    use RefreshDatabase;
    use CreatesTenantContext;

    public function test_livestock_business_can_track_health_breeding_milk_and_sales(): void
    {
        $tenant = $this->createTenantContext('livestock', 'livestock-owner@example.com');
        $token = $tenant['user']->createToken('test-token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/livestock/pens', [
                'name' => 'North Pen',
                'section' => 'Dairy',
                'capacity' => 40,
            ])->assertCreated();

        $groupResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/livestock/groups', [
                'name' => 'Milking Herd 1',
                'species' => 'Cattle',
                'breed' => 'Friesian',
                'animal_count' => 18,
                'average_weight_kg' => 225,
            ])->assertCreated();

        $groupId = $groupResponse->json('group.id');

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/livestock/weights', [
                'animal_group_id' => $groupId,
                'weight_kg' => 240,
                'sample_size' => 4,
            ])->assertCreated();

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/livestock/milk-logs', [
                'animal_group_id' => $groupId,
                'litres' => 82.5,
                'recorded_on' => today()->toDateString(),
            ])->assertCreated();

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/livestock/disease-logs', [
                'animal_group_id' => $groupId,
                'disease_name' => 'Mastitis',
                'affected_count' => 2,
                'recorded_on' => today()->toDateString(),
            ])->assertCreated();

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/livestock/medications', [
                'animal_group_id' => $groupId,
                'medication_name' => 'Oxytetracycline',
                'treated_count' => 2,
                'cost' => 24000,
                'administered_on' => today()->toDateString(),
            ])->assertCreated();

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/livestock/breeding-records', [
                'animal_group_id' => $groupId,
                'cycle_name' => 'Cycle A',
                'paired_count' => 6,
                'successful_births' => 4,
                'status' => 'active',
            ])->assertCreated();

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/livestock/sales', [
                'animal_group_id' => $groupId,
                'sale_type' => 'slaughter_sale',
                'quantity' => 2,
                'revenue' => 360000,
                'sold_on' => today()->toDateString(),
            ])->assertCreated();

        $overview = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/livestock/overview');

        $overview->assertOk()
            ->assertJsonPath('totals.animals', 18)
            ->assertJsonPath('totals.open_outbreaks', 1)
            ->assertJsonPath('totals.milk_today_litres', 82.5)
            ->assertJsonPath('totals.sales_today', 360000);

        $dashboard = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/dashboard');

        $dashboard->assertOk()
            ->assertJsonPath('business_type', 'livestock')
            ->assertJsonPath('livestock.total_animals', 18)
            ->assertJsonPath('livestock.sales_today', 360000);
    }

    public function test_livestock_endpoints_reject_foreign_tenant_pens_and_groups(): void
    {
        $tenant = $this->createTenantContext('livestock', 'livestock-scope@example.com');
        $otherTenant = $this->createTenantContext('livestock', 'livestock-other@example.com');
        $token = $tenant['user']->createToken('scope-token')->plainTextToken;

        $foreignPen = LivestockPen::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Pen',
            'capacity' => 20,
            'is_active' => true,
        ]);

        $foreignGroup = LivestockAnimalGroup::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'pen_id' => $foreignPen->id,
            'name' => 'Foreign Herd',
            'species' => 'Goat',
            'animal_count' => 12,
            'average_weight_kg' => 40,
            'status' => 'active',
        ]);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/livestock/groups', [
                'pen_id' => $foreignPen->id,
                'name' => 'Invalid Group',
                'species' => 'Cattle',
            ])->assertStatus(422)
            ->assertJsonValidationErrors(['pen_id']);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/livestock/weights', [
                'animal_group_id' => $foreignGroup->id,
                'weight_kg' => 90,
            ])->assertStatus(422)
            ->assertJsonValidationErrors(['animal_group_id']);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/livestock/milk-logs', [
                'animal_group_id' => $foreignGroup->id,
                'litres' => 20,
                'recorded_on' => today()->toDateString(),
            ])->assertStatus(422)
            ->assertJsonValidationErrors(['animal_group_id']);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/livestock/disease-logs', [
                'animal_group_id' => $foreignGroup->id,
                'disease_name' => 'Invalid Disease',
                'recorded_on' => today()->toDateString(),
            ])->assertStatus(422)
            ->assertJsonValidationErrors(['animal_group_id']);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/livestock/medications', [
                'animal_group_id' => $foreignGroup->id,
                'medication_name' => 'Invalid Medication',
                'administered_on' => today()->toDateString(),
            ])->assertStatus(422)
            ->assertJsonValidationErrors(['animal_group_id']);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/livestock/breeding-records', [
                'animal_group_id' => $foreignGroup->id,
                'cycle_name' => 'Invalid Cycle',
            ])->assertStatus(422)
            ->assertJsonValidationErrors(['animal_group_id']);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/livestock/sales', [
                'animal_group_id' => $foreignGroup->id,
                'sold_on' => today()->toDateString(),
            ])->assertStatus(422)
            ->assertJsonValidationErrors(['animal_group_id']);
    }
}
