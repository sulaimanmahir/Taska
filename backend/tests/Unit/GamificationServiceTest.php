<?php

namespace Tests\Unit;

use App\Models\BusinessAchievementUnlock;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Services\BusinessHealthScoringService;
use App\Services\GamificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class GamificationServiceTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_unlocks_first_sale_achievement_after_one_order(): void
    {
        $tenant = $this->createTenantContext('retail', 'gamify-first-sale@example.com');
        $business = $tenant['business'];

        Order::create([
            'business_id' => $business->id,
            'order_number' => 'ORD-1',
            'order_type' => 'sale',
            'status' => 'completed',
            'subtotal' => 1000,
            'total' => 1000,
            'paid' => 1000,
        ]);

        // GamificationObserver (registered in AppServiceProvider) already
        // unlocked this the moment Order::create() ran above - proving the
        // event wiring works end to end, not just the service in isolation.
        $this->assertTrue(BusinessAchievementUnlock::where('business_id', $business->id)
            ->where('achievement_key', 'first_sale')
            ->exists());

        // Calling the service again explicitly must be a no-op, not a duplicate.
        $service = new GamificationService();
        $unlocked = $service->checkAndUnlock($business);

        $this->assertFalse($unlocked->pluck('achievement_key')->contains('first_sale'));
    }

    public function test_does_not_unlock_the_same_achievement_twice(): void
    {
        $tenant = $this->createTenantContext('retail', 'gamify-idempotent@example.com');
        $business = $tenant['business'];

        Order::create([
            'business_id' => $business->id,
            'order_number' => 'ORD-1',
            'order_type' => 'sale',
            'status' => 'completed',
            'subtotal' => 1000,
            'total' => 1000,
            'paid' => 1000,
        ]);

        $service = new GamificationService();
        $service->checkAndUnlock($business);
        $secondRun = $service->checkAndUnlock($business);

        $this->assertFalse($secondRun->pluck('achievement_key')->contains('first_sale'));
        $this->assertSame(1, BusinessAchievementUnlock::where('business_id', $business->id)
            ->where('achievement_key', 'first_sale')
            ->count());
    }

    public function test_debt_free_achievement_uses_lte_comparator_correctly(): void
    {
        $tenant = $this->createTenantContext('retail', 'gamify-debt-free@example.com');
        $business = $tenant['business'];

        Customer::create([
            'business_id' => $business->id,
            'name' => 'Owing Customer',
            'customer_type' => 'individual',
            'balance' => 500,
        ]);

        $service = new GamificationService();
        $firstCheck = $service->checkAndUnlock($business);
        $this->assertFalse($firstCheck->pluck('achievement_key')->contains('debt_free'));

        Customer::where('business_id', $business->id)->update(['balance' => 0]);

        $secondCheck = $service->checkAndUnlock($business);
        $this->assertTrue($secondCheck->pluck('achievement_key')->contains('debt_free'));
    }

    public function test_inventory_set_up_achievement_unlocks_at_ten_products(): void
    {
        $tenant = $this->createTenantContext('retail', 'gamify-inventory@example.com');
        $business = $tenant['business'];

        for ($i = 1; $i <= 9; $i++) {
            Product::create(['business_id' => $business->id, 'name' => "Product {$i}", 'selling_price' => 100]);
        }

        $service = new GamificationService();
        $this->assertFalse($service->checkAndUnlock($business)->pluck('achievement_key')->contains('inventory_set_up'));

        Product::create(['business_id' => $business->id, 'name' => 'Product 10', 'selling_price' => 100]);

        $this->assertTrue($service->checkAndUnlock($business)->pluck('achievement_key')->contains('inventory_set_up'));
    }

    public function test_health_scoring_service_rewards_revenue_growth_and_penalizes_debt(): void
    {
        $tenant = $this->createTenantContext('retail', 'gamify-health@example.com');
        $business = $tenant['business'];

        Order::create([
            'business_id' => $business->id,
            'order_number' => 'ORD-1',
            'order_type' => 'sale',
            'status' => 'completed',
            'subtotal' => 5000,
            'total' => 5000,
            'paid' => 5000,
        ]);

        Customer::create([
            'business_id' => $business->id,
            'name' => 'Owing Customer',
            'customer_type' => 'individual',
            'balance' => 5000,
        ]);

        $service = new BusinessHealthScoringService();
        $result = $service->computeFor($business);

        $this->assertSame(100, $result['revenue_trend_score']);
        // Outstanding balance equals the whole revenue period - receivables health should bottom out.
        $this->assertSame(0, $result['receivables_health_score']);
        $this->assertGreaterThanOrEqual(0, $result['health_score']);
        $this->assertLessThanOrEqual(100, $result['health_score']);
    }

    public function test_health_snapshot_can_be_computed_and_stored(): void
    {
        $tenant = $this->createTenantContext('retail', 'gamify-snapshot@example.com');
        $business = $tenant['business'];

        $service = new BusinessHealthScoringService();
        $snapshot = $service->computeAndStoreFor($business);

        $this->assertSame($business->id, $snapshot->business_id);
        $this->assertSame(now()->toDateString(), $snapshot->snapshot_date->toDateString());

        // Calling again the same day updates in place rather than duplicating.
        $service->computeAndStoreFor($business);
        $this->assertSame(1, $business->healthSnapshots()->count());
    }

    public function test_level_starts_at_one_for_a_brand_new_business_with_no_unlocks(): void
    {
        $service = new GamificationService();

        $result = $service->computeLevel(healthScore: 50, achievementsUnlocked: 0, milestonesUnlocked: 0, accountAgeDays: 0);

        $this->assertSame(1, $result['level']);
        $this->assertSame(15, $result['points']);
    }

    public function test_level_increases_with_unlocked_achievements_and_milestones(): void
    {
        $service = new GamificationService();

        $withAchievements = $service->computeLevel(healthScore: 50, achievementsUnlocked: 5, milestonesUnlocked: 0, accountAgeDays: 0);
        $withMilestones = $service->computeLevel(healthScore: 50, achievementsUnlocked: 0, milestonesUnlocked: 5, accountAgeDays: 0);

        // Milestones (30pts each) are deliberately worth more than achievements (15pts each).
        $this->assertGreaterThan($withAchievements['points'], $withMilestones['points']);
        $this->assertSame(2, $withMilestones['level']);
    }

    public function test_account_age_contribution_is_capped_at_twenty_points(): void
    {
        $service = new GamificationService();

        $oneYear = $service->computeLevel(healthScore: 0, achievementsUnlocked: 0, milestonesUnlocked: 0, accountAgeDays: 365);
        $tenYears = $service->computeLevel(healthScore: 0, achievementsUnlocked: 0, milestonesUnlocked: 0, accountAgeDays: 3650);

        $this->assertSame($oneYear['points'], $tenYears['points']);
        $this->assertSame(20, $oneYear['points']);
    }

    public function test_points_to_next_level_reflects_progress_within_the_current_level(): void
    {
        $service = new GamificationService();

        // 3 achievements (45) + health 100 * 0.3 = 30 -> 75 points, level 1, 25 to go.
        $result = $service->computeLevel(healthScore: 100, achievementsUnlocked: 3, milestonesUnlocked: 0, accountAgeDays: 0);

        $this->assertSame(75, $result['points']);
        $this->assertSame(1, $result['level']);
        $this->assertSame(75, $result['points_into_level']);
        $this->assertSame(25, $result['points_to_next_level']);
    }
}
