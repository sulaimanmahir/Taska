function healthTone(score) {
  if (score >= 75) return 'emerald';
  if (score >= 50) return 'amber';
  return 'rose';
}

function healthLabel(score) {
  if (score >= 85) return 'Thriving';
  if (score >= 70) return 'Healthy';
  if (score >= 50) return 'Needs attention';
  return 'At risk';
}

export function buildHealthOverview(health) {
  const score = health?.health_score ?? 0;

  return {
    score,
    tone: healthTone(score),
    label: healthLabel(score),
    components: [
      { key: 'revenue_trend_score', label: 'Revenue trend', value: health?.revenue_trend_score ?? 0 },
      { key: 'expense_control_score', label: 'Expense control', value: health?.expense_control_score ?? 0 },
      { key: 'stock_health_score', label: 'Stock health', value: health?.stock_health_score ?? 0 },
      { key: 'receivables_health_score', label: 'Receivables health', value: health?.receivables_health_score ?? 0 },
    ],
  };
}

export function buildLevelOverview(level) {
  const pointsIntoLevel = level?.points_into_level ?? 0;
  const pointsToNextLevel = level?.points_to_next_level ?? 100;

  return {
    level: level?.level ?? 1,
    points: level?.points ?? 0,
    pointsIntoLevel,
    pointsToNextLevel,
    progressPercent: Math.max(0, Math.min(100, pointsIntoLevel)),
  };
}

export function buildStreakCard(streak) {
  const current = streak.current_count ?? 0;

  return {
    key: streak.type,
    title: streak.name || streak.type,
    currentLabel: current === 1 ? '1 day' : `${current} days`,
    bestLabel: `Best: ${streak.best_count ?? 0} days`,
    isActive: current > 0,
  };
}

const CATEGORY_LABELS = {
  achievement: 'Achievement',
  milestone: 'Milestone',
};

export function formatGamificationCategory(category) {
  return CATEGORY_LABELS[category] || category;
}

export function buildUnlockedCard(unlock) {
  return {
    key: unlock.key,
    title: unlock.name || unlock.key,
    categoryLabel: formatGamificationCategory(unlock.category),
    dateLabel: unlock.unlocked_at
      ? new Date(unlock.unlocked_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
      : '',
  };
}

export function buildInProgressCard(item) {
  return {
    key: item.key,
    title: item.name,
    description: item.description,
    categoryLabel: formatGamificationCategory(item.category),
    progressPercent: Math.max(0, Math.min(100, item.progress_percent ?? 0)),
  };
}

export function sortInProgressByClosest(items = []) {
  return [...items].sort((a, b) => (b.progress_percent ?? 0) - (a.progress_percent ?? 0));
}
