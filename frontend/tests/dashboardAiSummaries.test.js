import test from 'node:test';
import assert from 'node:assert/strict';

import { getDashboardAiAlertSummary } from '../src/lib/dashboardAiSummaries.js';

test('getDashboardAiAlertSummary builds metrics, lenses, and quick links from counts', () => {
  const summary = getDashboardAiAlertSummary({
    totalInsights: 10,
    unreadCount: 4,
    criticalCount: 2,
    activeGroupCount: 3,
    dailyActionCount: 1,
  });

  assert.deepEqual(summary.metrics, [
    { label: 'Visible Insights', value: 10, tone: 'violet' },
    { label: 'Unread', value: 4, tone: 'amber' },
    { label: 'Critical', value: 2, tone: 'rose' },
    { label: 'Action Groups', value: 3, tone: 'sky' },
  ]);

  assert.equal(summary.lenses[0].value, '4 unread');
  assert.equal(summary.lenses[1].value, '2 critical');
  assert.equal(summary.lenses[2].value, '1 owner action');
  assert.match(summary.lenses[3].description, /spread across 10 visible insights/);

  assert.equal(summary.quickLinks.length, 3);
  assert.equal(summary.quickLinks[0].label, 'Needs review');
  assert.match(summary.quickLinks[0].to, /preset=needs_review/);
  assert.match(summary.quickLinks[1].to, /preset=high_risk/);
  assert.match(summary.quickLinks[2].to, /preset=recommended_actions/);
});

test('getDashboardAiAlertSummary uses singular phrasing for count-of-one values', () => {
  const summary = getDashboardAiAlertSummary({
    totalInsights: 1,
    activeGroupCount: 1,
    dailyActionCount: 1,
  });

  assert.match(summary.lenses[2].value, /^1 owner action$/);
  assert.match(summary.lenses[3].value, /^1 active group$/);
  assert.match(summary.lenses[3].description, /1 visible insight\./);
});

test('getDashboardAiAlertSummary defaults every count to zero when no args are given', () => {
  const summary = getDashboardAiAlertSummary();

  assert.equal(summary.metrics[0].value, 0);
  assert.equal(summary.lenses[0].value, '0 unread');
  assert.match(summary.lenses[3].description, /0 visible insights/);
});
