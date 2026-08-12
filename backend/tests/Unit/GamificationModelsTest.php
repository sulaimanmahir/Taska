<?php

namespace Tests\Unit;

use App\Models\BusinessAchievementUnlock;
use App\Models\BusinessHealthSnapshot;
use App\Models\BusinessStreak;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class GamificationModelsTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_streak_extends_on_consecutive_days_and_resets_after_a_gap(): void
    {
        $tenant = $this->createTenantContext('retail', 'streak-owner@example.com');
        $streak = BusinessStreak::create([
            'business_id' => $tenant['business']->id,
            'streak_type' => 'daily_sales_logged',
        ]);

        $streak->recordActivity(Carbon::parse('2026-08-10'));
        $streak->recordActivity(Carbon::parse('2026-08-11'));
        $streak->recordActivity(Carbon::parse('2026-08-12'));

        $this->assertSame(3, $streak->fresh()->current_count);
        $this->assertSame(3, $streak->fresh()->best_count);

        // Skips a day - streak resets to 1, but best_count remembers the peak.
        $streak->recordActivity(Carbon::parse('2026-08-14'));

        $this->assertSame(1, $streak->fresh()->current_count);
        $this->assertSame(3, $streak->fresh()->best_count);
    }

    public function test_streak_recording_twice_in_the_same_day_does_not_double_count(): void
    {
        $tenant = $this->createTenantContext('retail', 'streak-same-day@example.com');
        $streak = BusinessStreak::create([
            'business_id' => $tenant['business']->id,
            'streak_type' => 'daily_sales_logged',
        ]);

        $streak->recordActivity(Carbon::parse('2026-08-12 09:00:00'));
        $streak->recordActivity(Carbon::parse('2026-08-12 17:00:00'));

        $this->assertSame(1, $streak->fresh()->current_count);
    }

    public function test_achievement_unlocks_are_tenant_scoped_and_unique_per_business(): void
    {
        $tenant = $this->createTenantContext('retail', 'achievement-owner@example.com');
        $foreignTenant = $this->createTenantContext('retail', 'achievement-foreign@example.com');

        BusinessAchievementUnlock::create([
            'business_id' => $tenant['business']->id,
            'achievement_key' => 'first_sale',
            'category' => BusinessAchievementUnlock::CATEGORY_ACHIEVEMENT,
            'unlocked_at' => now(),
            'meta' => ['orders_count' => 1],
        ]);

        BusinessAchievementUnlock::create([
            'business_id' => $foreignTenant['business']->id,
            'achievement_key' => 'first_sale',
            'category' => BusinessAchievementUnlock::CATEGORY_ACHIEVEMENT,
            'unlocked_at' => now(),
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->assertCount(1, BusinessAchievementUnlock::all());
        $this->assertSame('first_sale', BusinessAchievementUnlock::first()->achievement_key);
    }

    public function test_health_snapshot_is_unique_per_business_per_day(): void
    {
        $tenant = $this->createTenantContext('retail', 'health-owner@example.com');

        BusinessHealthSnapshot::create([
            'business_id' => $tenant['business']->id,
            'snapshot_date' => '2026-08-12',
            'health_score' => 78,
            'signals' => ['orders_last_30_days' => 42],
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);

        BusinessHealthSnapshot::create([
            'business_id' => $tenant['business']->id,
            'snapshot_date' => '2026-08-12',
            'health_score' => 80,
        ]);
    }

    public function test_gamification_catalog_config_loads_and_covers_every_expected_key(): void
    {
        $catalog = config('gamification');

        $this->assertArrayHasKey('achievements', $catalog);
        $this->assertArrayHasKey('milestones', $catalog);
        $this->assertArrayHasKey('streaks', $catalog);
        $this->assertArrayHasKey('first_sale', $catalog['achievements']);
        $this->assertArrayHasKey('metric', $catalog['achievements']['first_sale']);
    }
}
