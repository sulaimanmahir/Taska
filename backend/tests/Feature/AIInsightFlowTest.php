<?php

namespace Tests\Feature;

use App\Models\AiInsight;
use App\Models\InventoryItem;
use App\Models\Product;
use App\Models\ProductBatch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class AIInsightFlowTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_ai_insights_are_generated_scoped_and_actionable(): void
    {
        $tenant = $this->createTenantContext('pharmacy', 'pharmacy-ai@example.com');
        $otherTenant = $this->createTenantContext('retail', 'retail-ai@example.com');

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Amoxicillin 500mg',
            'selling_price' => 3500,
            'cost_price' => 2200,
            'low_stock_alert' => 10,
            'track_inventory' => 'yes',
            'is_active' => true,
        ]);

        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 4,
            'reserved_quantity' => 0,
            'reorder_point' => 10,
            'reorder_quantity' => 20,
        ]);

        ProductBatch::create([
            'business_id' => $tenant['business']->id,
            'product_id' => $product->id,
            'batch_number' => 'AMX-NEAR-01',
            'manufacture_date' => now()->subMonths(10),
            'expiry_date' => now()->addDays(14),
            'quantity' => 40,
            'remaining_quantity' => 32,
            'cost_per_unit' => 2200,
        ]);

        Sanctum::actingAs($tenant['user']);

        $insights = $this->getJson('/api/ai/insights')
            ->assertOk()
            ->json();

        $types = collect($insights)->pluck('type')->all();

        $this->assertContains('low_stock_watch', $types);
        $this->assertContains('pharmacy_expiry_pressure', $types);

        $groupedInsights = $this->getJson('/api/ai/insights?grouped=1')
            ->assertOk()
            ->json();

        $stockGroup = collect($groupedInsights)->firstWhere('key', 'stock');

        $this->assertNotNull($stockGroup);
        $this->assertGreaterThanOrEqual(1, $stockGroup['count']);

        $firstInsightId = collect($insights)->first()['id'];

        $this->postJson("/api/ai/insights/{$firstInsightId}/read")
            ->assertOk()
            ->assertJsonPath('is_read', true);

        $secondInsightId = collect($insights)->skip(1)->first()['id'];

        $this->postJson("/api/ai/insights/{$secondInsightId}/dismiss")
            ->assertOk()
            ->assertJsonPath('is_dismissed', true);

        $this->postJson("/api/ai/insights/{$secondInsightId}/restore")
            ->assertOk()
            ->assertJsonPath('is_dismissed', false);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJson(fn ($json) => $json
                ->whereType('ai.unread', 'integer')
                ->where('ai.unread', fn ($unread) => $unread >= 1)
                ->whereType('ai.critical', 'integer')
                ->where('ai.critical', fn ($critical) => $critical >= 1)
                ->whereType('ai.total', 'integer')
                ->where('ai.total', fn ($total) => $total >= 2)
                ->whereType('ai.groups', 'array')
                ->whereType('ai.daily_actions', 'array')
                ->etc());

        $foreignInsight = AiInsight::create([
            'business_id' => $otherTenant['business']->id,
            'type' => 'foreign_alert',
            'severity' => 'critical',
            'title' => 'Foreign Business Alert',
            'description' => 'Should not be accessible',
            'recommendation' => 'No action',
        ]);

        $this->postJson("/api/ai/insights/{$foreignInsight->id}/read")
            ->assertNotFound();
    }

    public function test_grouped_insights_and_dashboard_actions_use_full_insight_set_not_only_preview_cards(): void
    {
        $tenant = $this->createTenantContext('retail', 'ai-summary-regression@example.com');

        $recommendedInsight = AiInsight::create([
            'business_id' => $tenant['business']->id,
            'type' => 'custom_hidden_action_risk',
            'severity' => 'info',
            'title' => 'Old actionable stock signal',
            'description' => 'This recommendation should still count even if it falls outside preview cards.',
            'recommendation' => 'Restock the hidden fast mover before it runs out.',
            'is_read' => false,
            'created_at' => now()->subDay(),
            'updated_at' => now()->subDay(),
        ]);

        foreach (range(1, 4) as $index) {
            AiInsight::create([
                'business_id' => $tenant['business']->id,
                'type' => 'custom_preview_risk',
                'severity' => 'warning',
                'title' => "Preview stock signal {$index}",
                'description' => 'This is a preview-only signal without a recommendation.',
                'recommendation' => null,
                'is_read' => false,
                'created_at' => now()->subMinutes(10 - $index),
                'updated_at' => now()->subMinutes(10 - $index),
            ]);
        }

        Sanctum::actingAs($tenant['user']);

        $groupedInsights = $this->getJson('/api/ai/insights?grouped=1')
            ->assertOk()
            ->json();

        $stockGroup = collect($groupedInsights)->firstWhere('key', 'risk');

        $this->assertNotNull($stockGroup);
        $this->assertSame(5, $stockGroup['count']);
        $this->assertSame(1, $stockGroup['actionable']);
        $this->assertCount(4, $stockGroup['items']);
        $this->assertFalse(
            collect($stockGroup['items'])->contains(fn (array $item) => ! empty($item['recommendation']))
        );

        $dashboard = $this->getJson('/api/dashboard')
            ->assertOk()
            ->json();

        $this->assertSame(1, collect($dashboard['ai']['daily_actions'])->count());
        $this->assertSame($recommendedInsight->id, $dashboard['ai']['daily_actions'][0]['id']);
        $this->assertSame('Old actionable stock signal', $dashboard['ai']['daily_actions'][0]['title']);
        $this->assertSame('Restock the hidden fast mover before it runs out.', $dashboard['ai']['daily_actions'][0]['recommendation']);
        $this->assertSame('Risk', $dashboard['ai']['daily_actions'][0]['group_label']);
        $this->assertFalse($dashboard['ai']['daily_actions'][0]['is_read']);
        $this->assertSame($recommendedInsight->type, 'custom_hidden_action_risk');
    }
}
