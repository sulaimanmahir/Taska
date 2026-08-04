<?php

namespace Tests\Feature;

use App\Models\AiInsight;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class AIInsightResourceContractTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_ai_insight_endpoints_return_structured_resource_payloads(): void
    {
        $tenant = $this->createTenantContext('retail', 'ai-resource@example.com');

        $insight = AiInsight::create([
            'business_id' => $tenant['business']->id,
            'type' => 'custom_contract_alert',
            'severity' => 'warning',
            'title' => 'Contract signal',
            'description' => 'Resource payload should stay stable.',
            'recommendation' => 'Review the signal.',
            'data' => ['score' => 3],
            'is_read' => false,
            'is_dismissed' => false,
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->getJson('/api/ai/insights')
            ->assertOk()
            ->assertJsonPath('0.type', 'custom_contract_alert')
            ->assertJsonPath('0.business_id', $tenant['business']->id)
            ->assertJsonPath('0.data.score', 3);

        $this->postJson("/api/ai/insights/{$insight->id}/read")
            ->assertOk()
            ->assertJsonPath('id', $insight->id)
            ->assertJsonPath('is_read', true)
            ->assertJsonPath('recommendation', 'Review the signal.');

        $this->postJson("/api/ai/insights/{$insight->id}/dismiss")
            ->assertOk()
            ->assertJsonPath('is_dismissed', true);

        $this->postJson("/api/ai/insights/{$insight->id}/restore")
            ->assertOk()
            ->assertJsonPath('is_dismissed', false);
    }
}
