import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildInsightGroupDismissSummary,
  buildInsightGroupReadSummary,
  getDismissibleInsightIds,
  getFilteredInsightGroups,
  getFocusedInsightGroups,
  getInsightGlobalFilterCounts,
  getInsightGroupFilterCounts,
  getInsightGroupsOverview,
  getInsightResultSummary,
  getInsightSearchMatch,
  getSortedInsightGroups,
  getUnreadInsightIds,
  getVisibleInsightGroupItems,
  getVisibleInsightsByGlobalFilter,
} from '../src/lib/aiInsights/index.js';

const sampleGroups = [
  {
    key: 'inventory',
    label: 'Inventory',
    count: 3,
    unread: 2,
    critical: 1,
    actionable: 2,
    items: [
      {
        id: 1,
        title: 'Reorder painkiller stock',
        description: 'Pharmacy shelf is thinning out.',
        recommendation: 'Raise a purchase order today.',
        type: 'pharmacy_demand_forecast',
        severity: 'critical',
        is_read: false,
        updated_at: '2026-05-24T10:00:00.000Z',
      },
      {
        id: 2,
        title: 'Review warehouse cover',
        description: 'Top sellers have seven days of cover left.',
        recommendation: '',
        type: 'stockout_forecast',
        severity: 'warning',
        is_read: true,
        updated_at: '2026-05-20T10:00:00.000Z',
      },
      {
        id: 3,
        title: 'Check damaged cartons',
        description: 'Packaging loss needs attention.',
        recommendation: 'Log wastage before close of day.',
        type: 'production_cost_spike_forecast',
        severity: 'info',
        is_read: false,
        updated_at: '2026-05-22T10:00:00.000Z',
      },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    count: 2,
    unread: 1,
    critical: 0,
    actionable: 1,
    items: [
      {
        id: 4,
        title: 'Follow up debtors',
        description: 'Three customers are drifting overdue.',
        recommendation: 'Call the oldest debtor first.',
        type: 'credit_default_forecast',
        severity: 'warning',
        is_read: false,
        updated_at: '2026-05-25T10:00:00.000Z',
      },
      {
        id: 5,
        title: 'Cash trend is stable',
        description: 'No unusual financing movement today.',
        recommendation: '',
        type: 'cooperative_profit_distribution_readiness',
        severity: 'info',
        is_read: true,
        updated_at: '2026-05-18T10:00:00.000Z',
      },
    ],
  },
];

test('group summary helpers keep their owner-facing wording intact', () => {
  assert.deepEqual(buildInsightGroupReadSummary(1), {
    tone: 'violet',
    message: '1 insight marked as handled for now.',
  });

  assert.deepEqual(buildInsightGroupDismissSummary(2), {
    tone: 'rose',
    message: '2 low-priority insights removed from this group.',
  });
});

test('group selector helpers derive unread, dismissible, and filter counts correctly', () => {
  assert.deepEqual(getUnreadInsightIds(sampleGroups[0]), [1, 3]);
  assert.deepEqual(getDismissibleInsightIds(sampleGroups[0]), [2, 3]);
  assert.deepEqual(getInsightGroupFilterCounts(sampleGroups[0]), {
    all: 3,
    unread: 2,
    actionable: 2,
  });
});

test('group item visibility helpers honor unread and actionable filters', () => {
  assert.deepEqual(
    getVisibleInsightGroupItems(sampleGroups[0], 'unread').map((item) => item.id),
    [1, 3],
  );

  assert.deepEqual(
    getVisibleInsightGroupItems(sampleGroups[0], 'actionable').map((item) => item.id),
    [1, 3],
  );

  assert.deepEqual(
    getVisibleInsightsByGlobalFilter(sampleGroups[1].items, 'critical').map((item) => item.id),
    [],
  );
});

test('search and global filter helpers match insight content and group labels', () => {
  assert.equal(getInsightSearchMatch(sampleGroups[0].items[0], 'pharmacy', sampleGroups[0].label), true);
  assert.equal(getInsightSearchMatch(sampleGroups[1].items[0], 'inventory', sampleGroups[1].label), false);

  assert.deepEqual(getInsightGlobalFilterCounts(sampleGroups, 'forecast'), {
    all: 4,
    unread: 3,
    actionable: 3,
    critical: 1,
  });
});

test('filtered insight groups keep only matching visible items and recalculate metrics', () => {
  const filteredGroups = getFilteredInsightGroups(sampleGroups, {
    searchQuery: 'today',
    activeFilter: 'actionable',
  });

  assert.equal(filteredGroups.length, 1);
  assert.equal(filteredGroups[0].count, 1);
  assert.equal(filteredGroups[0].items[0].id, 1);
  assert.equal(filteredGroups[0].key, 'inventory');
});

test('focused group and result summary helpers keep page counts accurate', () => {
  const focusedGroups = getFocusedInsightGroups(sampleGroups, 'finance');

  assert.equal(focusedGroups.length, 1);
  assert.equal(focusedGroups[0].key, 'finance');
  assert.deepEqual(getInsightResultSummary(focusedGroups), {
    groupCount: 1,
    insightCount: 2,
  });
});

test('overview and sort helpers prioritize the right groups for each mode', () => {
  const overview = getInsightGroupsOverview(sampleGroups);
  assert.equal(overview.activeGroups.length, 2);
  assert.equal(overview.unreadCount, 3);
  assert.equal(overview.criticalCount, 1);
  assert.equal(overview.recommendationCount, 3);
  assert.equal(overview.hasSignals, true);

  assert.deepEqual(
    getSortedInsightGroups(sampleGroups, 'priority').map((group) => group.key),
    ['inventory', 'finance'],
  );

  assert.deepEqual(
    getSortedInsightGroups(sampleGroups, 'newest').map((group) => group.key),
    ['finance', 'inventory'],
  );

  assert.deepEqual(
    getSortedInsightGroups(sampleGroups, 'actionable').map((group) => group.key),
    ['inventory', 'finance'],
  );
});
