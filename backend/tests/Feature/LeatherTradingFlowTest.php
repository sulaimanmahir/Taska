<?php

namespace Tests\Feature;

use App\Models\LeatherProcessingBatch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class LeatherTradingFlowTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_business_can_create_a_processing_batch_and_see_it_in_overview_and_index(): void
    {
        $tenant = $this->createTenantContext('leather_trading', 'leather-owner@example.com');
        Sanctum::actingAs($tenant['user']);

        $response = $this->postJson('/api/leather-trading/batches', [
            'processing_date' => today()->toDateString(),
            'hide_type' => 'cattle',
            'input_hide_count' => 100,
            'input_weight_kg' => 1500,
            'output_sqft' => 850,
            'reject_count' => 10,
            'tanning_chemical_cost' => 60000,
            'labour_cost' => 40000,
            'other_cost' => 15000,
            'notes' => 'Morning tanning batch',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('hide_type', 'cattle');
        $response->assertJsonPath('total_cost', 115000);
        $response->assertJsonPath('reject_rate_percent', 10);
        $this->assertStringStartsWith('LPB-', $response->json('batch_number'));

        $overview = $this->getJson('/api/leather-trading/overview');
        $overview->assertOk();
        $overview->assertJsonPath('summary.batches_today', 1);
        $overview->assertJsonPath('summary.hides_processed_today', 100);
        $overview->assertJsonPath('summary.output_sqft_today', 850);
        $overview->assertJsonPath('summary.rejects_today', 10);
        $overview->assertJsonPath('summary.processing_cost_today', 115000);
        $overview->assertJsonPath('summary.average_reject_rate_percent', 10);

        $index = $this->getJson('/api/leather-trading/batches');
        $index->assertOk();
        $index->assertJsonCount(1);
        $index->assertJsonPath('0.hide_type', 'cattle');
    }

    public function test_it_rejects_an_invalid_hide_type(): void
    {
        $tenant = $this->createTenantContext('leather_trading', 'leather-owner-2@example.com');
        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/leather-trading/batches', [
            'processing_date' => today()->toDateString(),
            'hide_type' => 'dragon',
            'input_hide_count' => 10,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['hide_type']);
    }

    public function test_batches_are_hidden_from_other_businesses(): void
    {
        $tenant = $this->createTenantContext('leather_trading', 'leather-owner-3@example.com');
        $other = $this->createTenantContext('leather_trading', 'leather-other@example.com');

        LeatherProcessingBatch::create([
            'business_id' => $other['business']->id,
            'batch_number' => LeatherProcessingBatch::generateBatchNumber(),
            'processing_date' => today(),
            'hide_type' => 'goat',
            'input_hide_count' => 50,
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->getJson('/api/leather-trading/batches')->assertOk()->assertJsonCount(0);
        $this->assertCount(0, LeatherProcessingBatch::all());
    }
}
