<?php

namespace Tests\Feature;

use App\Models\LivestockMarketTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class LivestockMarketFlowTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_business_can_record_intake_and_sale_transactions_and_see_holding_pen_count(): void
    {
        $tenant = $this->createTenantContext('livestock_market', 'livestockmarket-owner@example.com');
        Sanctum::actingAs($tenant['user']);

        $intake = $this->postJson('/api/livestock-market/transactions', [
            'transaction_type' => 'intake',
            'animal_type' => 'cattle',
            'head_count' => 20,
            'total_weight_kg' => 6000,
            'total_amount' => 4000000,
            'counterparty_name' => 'Musa Herder',
            'counterparty_phone' => '08031112222',
            'market_date' => today()->toDateString(),
        ]);

        $intake->assertCreated();
        $intake->assertJsonPath('transaction_type', 'intake');
        $intake->assertJsonPath('head_count', 20);
        $this->assertStringStartsWith('LMI-', $intake->json('transaction_number'));

        $sale = $this->postJson('/api/livestock-market/transactions', [
            'transaction_type' => 'sale',
            'animal_type' => 'cattle',
            'head_count' => 8,
            'total_weight_kg' => 2400,
            'unit_price_per_kg' => 2200,
            'total_amount' => 5280000,
            'counterparty_name' => 'Sani Buyer',
            'market_date' => today()->toDateString(),
        ]);

        $sale->assertCreated();
        $this->assertStringStartsWith('LMS-', $sale->json('transaction_number'));

        $overview = $this->getJson('/api/livestock-market/overview');
        $overview->assertOk();
        $overview->assertJsonPath('summary.animals_in_holding', 12); // 20 intake - 8 sold
        $overview->assertJsonPath('summary.intake_head_count_today', 20);
        $overview->assertJsonPath('summary.sale_head_count_today', 8);
        $overview->assertJsonPath('summary.revenue_today', 5280000);
        $overview->assertJsonPath('summary.intake_cost_today', 4000000);
        $overview->assertJsonPath('summary.average_sale_price_per_kg', 2200);

        $index = $this->getJson('/api/livestock-market/transactions');
        $index->assertOk();
        $index->assertJsonCount(2);
    }

    public function test_it_rejects_an_invalid_transaction_type(): void
    {
        $tenant = $this->createTenantContext('livestock_market', 'livestockmarket-owner-2@example.com');
        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/livestock-market/transactions', [
            'transaction_type' => 'donation',
            'animal_type' => 'cattle',
            'head_count' => 5,
            'total_amount' => 100000,
            'counterparty_name' => 'Someone',
            'market_date' => today()->toDateString(),
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['transaction_type']);
    }

    public function test_transactions_are_hidden_from_other_businesses(): void
    {
        $tenant = $this->createTenantContext('livestock_market', 'livestockmarket-owner-3@example.com');
        $other = $this->createTenantContext('livestock_market', 'livestockmarket-other@example.com');

        LivestockMarketTransaction::create([
            'business_id' => $other['business']->id,
            'transaction_number' => LivestockMarketTransaction::generateTransactionNumber('intake'),
            'transaction_type' => 'intake',
            'animal_type' => 'goat',
            'head_count' => 10,
            'total_amount' => 500000,
            'counterparty_name' => 'Foreign Herder',
            'market_date' => today(),
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->getJson('/api/livestock-market/transactions')->assertOk()->assertJsonCount(0);
        $this->assertCount(0, LivestockMarketTransaction::all());
    }
}
