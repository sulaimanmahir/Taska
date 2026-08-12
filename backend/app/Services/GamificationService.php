<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Business;
use App\Models\BusinessAchievementUnlock;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Collection;

/**
 * Checks a business's real operational data against the achievement and
 * milestone catalog (config/gamification.php) and unlocks anything newly
 * crossed. Idempotent - safe to call repeatedly (e.g. after every order
 * creation) since it only inserts an unlock the first time a threshold is
 * crossed, via the business_achievement_unlocks unique constraint.
 */
class GamificationService
{
    /**
     * @return Collection<int, BusinessAchievementUnlock> newly unlocked this call
     */
    public function checkAndUnlock(Business $business): Collection
    {
        $metrics = $this->computeMetrics($business);
        $alreadyUnlocked = BusinessAchievementUnlock::where('business_id', $business->id)
            ->pluck('achievement_key')
            ->all();

        $newlyUnlocked = collect();

        foreach (['achievements', 'milestones'] as $category) {
            foreach (config("gamification.{$category}", []) as $key => $definition) {
                if (in_array($key, $alreadyUnlocked, true)) {
                    continue;
                }

                $metricValue = $metrics[$definition['metric']] ?? null;

                if ($metricValue === null || !$this->crossesThreshold($metricValue, $definition)) {
                    continue;
                }

                $unlock = BusinessAchievementUnlock::create([
                    'business_id' => $business->id,
                    'achievement_key' => $key,
                    'category' => $category === 'milestones'
                        ? BusinessAchievementUnlock::CATEGORY_MILESTONE
                        : BusinessAchievementUnlock::CATEGORY_ACHIEVEMENT,
                    'unlocked_at' => now(),
                    'meta' => [$definition['metric'] => $metricValue],
                ]);

                $newlyUnlocked->push($unlock);
            }
        }

        return $newlyUnlocked;
    }

    /**
     * @return array<string, float|int>
     */
    public function computeMetrics(Business $business): array
    {
        $outstandingBalance = (float) Customer::where('business_id', $business->id)
            ->where('balance', '>', 0)
            ->sum('balance');

        return [
            'orders_count' => Order::where('business_id', $business->id)->count(),
            'customers_count' => Customer::where('business_id', $business->id)->count(),
            'expenses_count' => Expense::where('business_id', $business->id)->count(),
            'products_count' => Product::where('business_id', $business->id)->count(),
            'branches_count' => Branch::where('business_id', $business->id)->count(),
            'lifetime_revenue' => (float) Order::where('business_id', $business->id)->sum('total'),
            'account_age_days' => (int) $business->created_at?->diffInDays(now()),
            'outstanding_customer_balance' => $outstandingBalance,
        ];
    }

    private function crossesThreshold(float|int $value, array $definition): bool
    {
        $threshold = $definition['threshold'];
        $comparator = $definition['comparator'] ?? 'gte';

        return match ($comparator) {
            'lte' => $value <= $threshold,
            default => $value >= $threshold,
        };
    }
}
