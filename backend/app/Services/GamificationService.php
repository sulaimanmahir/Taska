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

    /**
     * "Level" is intentionally a *computed* value, never a stored column -
     * storing it risks drifting out of sync with the achievements/health
     * score it's supposed to represent. Like the health-score weighting in
     * BusinessHealthScoringService, this exact formula is a reasonable,
     * documented default, not a settled product decision: 100 points per
     * level, from unlocked achievements (15pts each) + unlocked milestones
     * (30pts each, since they represent bigger wins - ₦1M+ revenue, 100+
     * customers) + up to 30pts from the current health score + up to 20pts
     * from account age (1pt per 2 weeks, so a full year caps the age
     * contribution). Flag any change here in the design doc.
     *
     * @return array{level: int, points: int, points_into_level: int, points_to_next_level: int}
     */
    public function computeLevel(int $healthScore, int $achievementsUnlocked, int $milestonesUnlocked, int $accountAgeDays): array
    {
        $points = ($achievementsUnlocked * 15)
            + ($milestonesUnlocked * 30)
            + (int) round($healthScore * 0.3)
            + min(intdiv(max($accountAgeDays, 0), 14), 20);

        $pointsIntoLevel = $points % 100;

        return [
            'level' => intdiv($points, 100) + 1,
            'points' => $points,
            'points_into_level' => $pointsIntoLevel,
            'points_to_next_level' => 100 - $pointsIntoLevel,
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
