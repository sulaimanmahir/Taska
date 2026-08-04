import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildInsightSearchParams,
  captureResetFiltersState,
  captureSortAndFilterState,
} from '../src/lib/aiInsights/index.js';

test('AI insights view-state helper captures the current filter and sort pair', () => {
  assert.deepEqual(
    captureSortAndFilterState({
      activeVisibilityFilter: 'critical',
      activeSort: 'actionable',
    }),
    {
      filter: 'critical',
      sort: 'actionable',
    },
  );
});

test('AI insights view-state helper captures reset-filter restore state cleanly', () => {
  assert.deepEqual(
    captureResetFiltersState({
      searchTerm: 'cash flow',
      activeVisibilityFilter: 'unread',
      activeSort: 'priority',
      requestedGroupKey: 'finance',
      requestedInsightId: '42',
      preset: 'needs_review',
    }),
    {
      searchTerm: 'cash flow',
      activeVisibilityFilter: 'unread',
      activeSort: 'priority',
      groupKey: 'finance',
      insightId: '42',
      preset: 'needs_review',
    },
  );
});

test('AI insights view-state helper builds compact search params from active view fragments', () => {
  const params = buildInsightSearchParams({
    preset: 'high_risk',
    groupKey: 'inventory',
    insightId: '17',
  });

  assert.equal(params.get('preset'), 'high_risk');
  assert.equal(params.get('group'), 'inventory');
  assert.equal(params.get('insight'), '17');
});

test('AI insights view-state helper skips empty search param values', () => {
  const params = buildInsightSearchParams({
    preset: '',
    groupKey: null,
    insightId: undefined,
  });

  assert.equal(params.toString(), '');
});
