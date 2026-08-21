import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildHealthOverview,
  buildInProgressCard,
  buildLevelOverview,
  buildStreakCard,
  buildUnlockedCard,
  formatGamificationCategory,
  sortInProgressByClosest,
} from '../src/lib/gamification.js';

test('buildHealthOverview maps score to tone and label bands', () => {
  assert.equal(buildHealthOverview({ health_score: 90 }).tone, 'emerald');
  assert.equal(buildHealthOverview({ health_score: 90 }).label, 'Thriving');
  assert.equal(buildHealthOverview({ health_score: 72 }).label, 'Healthy');
  assert.equal(buildHealthOverview({ health_score: 55 }).tone, 'amber');
  assert.equal(buildHealthOverview({ health_score: 55 }).label, 'Needs attention');
  assert.equal(buildHealthOverview({ health_score: 20 }).tone, 'rose');
  assert.equal(buildHealthOverview({ health_score: 20 }).label, 'At risk');
});

test('buildHealthOverview tolerates a missing health object', () => {
  const overview = buildHealthOverview(undefined);
  assert.equal(overview.score, 0);
  assert.equal(overview.components.length, 4);
});

test('buildHealthOverview exposes the four component scores with safe fallbacks', () => {
  const overview = buildHealthOverview({
    health_score: 80,
    revenue_trend_score: 90,
    expense_control_score: 70,
    stock_health_score: 85,
    receivables_health_score: 75,
  });

  assert.deepEqual(overview.components.map((c) => c.value), [90, 70, 85, 75]);
});

test('buildLevelOverview exposes level, points, and a clamped progress percent', () => {
  const overview = buildLevelOverview({ level: 2, points: 165, points_into_level: 65, points_to_next_level: 35 });
  assert.equal(overview.level, 2);
  assert.equal(overview.points, 165);
  assert.equal(overview.pointsToNextLevel, 35);
  assert.equal(overview.progressPercent, 65);
});

test('buildLevelOverview tolerates a missing level object', () => {
  const overview = buildLevelOverview(undefined);
  assert.equal(overview.level, 1);
  assert.equal(overview.points, 0);
  assert.equal(overview.progressPercent, 0);
});

test('buildStreakCard formats singular vs. plural day counts', () => {
  const single = buildStreakCard({ type: 'daily_sales_logged', name: 'Daily Sales Streak', current_count: 1, best_count: 3 });
  assert.equal(single.currentLabel, '1 day');
  assert.equal(single.isActive, true);

  const zero = buildStreakCard({ type: 'daily_sales_logged', current_count: 0, best_count: 3 });
  assert.equal(zero.currentLabel, '0 days');
  assert.equal(zero.isActive, false);
});

test('formatGamificationCategory humanizes known categories and falls back safely', () => {
  assert.equal(formatGamificationCategory('achievement'), 'Achievement');
  assert.equal(formatGamificationCategory('milestone'), 'Milestone');
  assert.equal(formatGamificationCategory('other'), 'other');
});

test('buildUnlockedCard formats the unlock date', () => {
  const card = buildUnlockedCard({ key: 'first_sale', name: 'First Sale', category: 'achievement', unlocked_at: '2026-08-12T10:00:00Z' });
  assert.equal(card.title, 'First Sale');
  assert.equal(card.categoryLabel, 'Achievement');
  assert.match(card.dateLabel, /2026/);
});

test('buildInProgressCard clamps progress percent into 0-100', () => {
  assert.equal(buildInProgressCard({ key: 'x', progress_percent: 150 }).progressPercent, 100);
  assert.equal(buildInProgressCard({ key: 'x', progress_percent: -10 }).progressPercent, 0);
  assert.equal(buildInProgressCard({ key: 'x', progress_percent: 42 }).progressPercent, 42);
});

test('sortInProgressByClosest orders items by descending progress without mutating the input', () => {
  const items = [
    { key: 'a', progress_percent: 10 },
    { key: 'b', progress_percent: 90 },
    { key: 'c', progress_percent: 50 },
  ];

  const sorted = sortInProgressByClosest(items);

  assert.deepEqual(sorted.map((i) => i.key), ['b', 'c', 'a']);
  assert.deepEqual(items.map((i) => i.key), ['a', 'b', 'c']);
});
