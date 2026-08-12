<?php

namespace Tests\Feature;

use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class GamificationOverviewTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_overview_returns_health_streaks_unlocks_and_in_progress_items(): void
    {
        $tenant = $this->createTenantContext('retail', 'gamification-overview@example.com');

        Order::create([
            'business_id' => $tenant['business']->id,
            'order_number' => 'ORD-1',
            'order_type' => 'sale',
            'status' => 'completed',
            'subtotal' => 1000,
            'total' => 1000,
            'paid' => 1000,
        ]);

        Sanctum::actingAs($tenant['user']);

        $response = $this->getJson('/api/gamification/overview');

        $response->assertOk();
        $response->assertJsonStructure([
            'health' => ['health_score', 'revenue_trend_score', 'expense_control_score', 'stock_health_score', 'receivables_health_score', 'signals'],
            'streaks',
            'unlocked',
            'in_progress',
        ]);

        // The Order created above already triggered GamificationObserver.
        $unlockedKeys = collect($response->json('unlocked'))->pluck('key');
        $this->assertTrue($unlockedKeys->contains('first_sale'));

        // Locked-but-in-progress items must not include anything already unlocked.
        $inProgressKeys = collect($response->json('in_progress'))->pluck('key');
        $this->assertFalse($inProgressKeys->contains('first_sale'));
        $this->assertTrue($inProgressKeys->contains('first_customer'));
    }

    public function test_overview_is_scoped_to_the_current_business(): void
    {
        $tenant = $this->createTenantContext('retail', 'gamification-scope-owner@example.com');
        $otherTenant = $this->createTenantContext('retail', 'gamification-scope-other@example.com');

        Order::create([
            'business_id' => $otherTenant['business']->id,
            'order_number' => 'ORD-OTHER',
            'order_type' => 'sale',
            'status' => 'completed',
            'subtotal' => 1000,
            'total' => 1000,
            'paid' => 1000,
        ]);

        Sanctum::actingAs($tenant['user']);

        $response = $this->getJson('/api/gamification/overview');

        $response->assertOk();
        $unlockedKeys = collect($response->json('unlocked'))->pluck('key');
        $this->assertFalse($unlockedKeys->contains('first_sale'));
    }
}
