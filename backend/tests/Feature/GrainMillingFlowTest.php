<?php

namespace Tests\Feature;

use App\Models\GrainMillingBatch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class GrainMillingFlowTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_business_can_create_a_milling_batch_and_see_it_in_overview_and_index(): void
    {
        $tenant = $this->createTenantContext('grain_milling', 'grainmill-owner@example.com');
        Sanctum::actingAs($tenant['user']);

        $response = $this->postJson('/api/grain-milling/batches', [
            'milling_date' => today()->toDateString(),
            'grain_type' => 'maize',
            'input_quantity_kg' => 1000,
            'output_quantity_kg' => 780,
            'byproduct_quantity_kg' => 180,
            'wastage_quantity_kg' => 40,
            'labour_cost' => 5000,
            'electricity_cost' => 3000,
            'packaging_cost' => 1500,
            'notes' => 'Morning batch',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('grain_type', 'maize');
        $response->assertJsonPath('total_cost', 9500);
        $response->assertJsonPath('yield_percent', 78);
        $this->assertNotEmpty($response->json('batch_number'));

        $overview = $this->getJson('/api/grain-milling/overview');
        $overview->assertOk();
        $overview->assertJsonPath('summary.batches_today', 1);
        $overview->assertJsonPath('summary.input_today_kg', 1000);
        $overview->assertJsonPath('summary.output_today_kg', 780);
        $overview->assertJsonPath('summary.processing_cost_today', 9500);
        // Regression guard: SQLite gives NUMERIC-affinity decimal columns
        // storing "clean" values (780.00, 1000.00) INTEGER storage class, so a
        // bare `/` in the overview's AVG() query silently did integer division
        // and truncated every yield ratio to 0 - caught only via live
        // verification, not by this test suite, since this assertion was
        // originally missing. Never regress it back to 0.
        $overview->assertJsonPath('summary.average_yield_percent', 78);

        $index = $this->getJson('/api/grain-milling/batches');
        $index->assertOk();
        $index->assertJsonCount(1);
        $index->assertJsonPath('0.grain_type', 'maize');
    }

    public function test_it_rejects_an_invalid_grain_type(): void
    {
        $tenant = $this->createTenantContext('grain_milling', 'grainmill-owner-2@example.com');
        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/grain-milling/batches', [
            'milling_date' => today()->toDateString(),
            'grain_type' => 'not_a_real_grain',
            'input_quantity_kg' => 100,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['grain_type']);
    }

    public function test_milling_batches_are_hidden_from_other_businesses(): void
    {
        $tenant = $this->createTenantContext('grain_milling', 'grainmill-owner-3@example.com');
        $other = $this->createTenantContext('grain_milling', 'grainmill-other@example.com');

        GrainMillingBatch::create([
            'business_id' => $other['business']->id,
            'batch_number' => GrainMillingBatch::generateBatchNumber(),
            'milling_date' => today(),
            'grain_type' => 'rice',
            'input_quantity_kg' => 500,
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->getJson('/api/grain-milling/batches')->assertOk()->assertJsonCount(0);

        // Deliberately unscoped query - proves the global scope, not controller
        // code, is what keeps the other tenant's batch out.
        $this->assertCount(0, GrainMillingBatch::all());
    }
}
