<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\BusinessAchievementUnlock;
use App\Models\BusinessStreak;
use App\Services\BusinessHealthScoringService;
use App\Services\GamificationService;
use Illuminate\Http\Request;

class GamificationController extends Controller
{
    public function __construct(
        private BusinessHealthScoringService $healthScoringService,
        private GamificationService $gamificationService,
    ) {
    }

    /**
     * A single read model for the (not-yet-built) frontend progress centre:
     * current health score + its components, active streaks, unlocked
     * achievements/milestones, and locked-but-in-progress ones with a real
     * progress percentage - not just a name and a lock icon.
     */
    public function overview(Request $request)
    {
        $business = Business::findOrFail($request->user()->current_business_id);

        $health = $this->healthScoringService->computeFor($business);
        $metrics = $this->gamificationService->computeMetrics($business);

        $streaks = BusinessStreak::where('business_id', $business->id)->get();
        $unlocks = BusinessAchievementUnlock::where('business_id', $business->id)->get();
        $unlockedKeys = $unlocks->pluck('achievement_key')->all();

        $level = $this->gamificationService->computeLevel(
            $health['health_score'],
            $unlocks->where('category', BusinessAchievementUnlock::CATEGORY_ACHIEVEMENT)->count(),
            $unlocks->where('category', BusinessAchievementUnlock::CATEGORY_MILESTONE)->count(),
            $metrics['account_age_days'],
        );

        return response()->json([
            'health' => $health,
            'level' => $level,
            'streaks' => $streaks->map(fn (BusinessStreak $streak) => [
                'type' => $streak->streak_type,
                'name' => config("gamification.streaks.{$streak->streak_type}.name", $streak->streak_type),
                'current_count' => $streak->current_count,
                'best_count' => $streak->best_count,
                'last_active_date' => $streak->last_active_date?->toDateString(),
            ])->values(),
            'unlocked' => $unlocks->map(fn (BusinessAchievementUnlock $unlock) => [
                'key' => $unlock->achievement_key,
                'category' => $unlock->category,
                'name' => config("gamification.{$unlock->category}s.{$unlock->achievement_key}.name", $unlock->achievement_key),
                'unlocked_at' => $unlock->unlocked_at->toIso8601String(),
                'meta' => $unlock->meta,
            ])->values(),
            'in_progress' => $this->buildInProgress($metrics, $unlockedKeys),
        ]);
    }

    private function buildInProgress(array $metrics, array $unlockedKeys): array
    {
        $inProgress = [];

        foreach (['achievements' => 'achievement', 'milestones' => 'milestone'] as $configKey => $category) {
            foreach (config("gamification.{$configKey}", []) as $key => $definition) {
                if (in_array($key, $unlockedKeys, true)) {
                    continue;
                }

                $value = $metrics[$definition['metric']] ?? 0;
                $threshold = $definition['threshold'];
                $comparator = $definition['comparator'] ?? 'gte';

                $progressPercent = $comparator === 'lte'
                    ? ($threshold == 0 && $value == 0 ? 100 : 0)
                    : (int) min(100, $threshold > 0 ? round(($value / $threshold) * 100) : 0);

                $inProgress[] = [
                    'key' => $key,
                    'category' => $category,
                    'name' => $definition['name'],
                    'description' => $definition['description'],
                    'progress_percent' => $progressPercent,
                    'current_value' => $value,
                    'threshold' => $threshold,
                ];
            }
        }

        return $inProgress;
    }
}
