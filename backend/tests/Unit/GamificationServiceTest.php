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
}
