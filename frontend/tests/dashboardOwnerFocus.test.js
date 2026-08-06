import test from 'node:test';
import assert from 'node:assert/strict';

import { getDashboardOwnerFocusSections } from '../src/lib/dashboardOwnerFocus.js';

test('getDashboardOwnerFocusSections returns null when there is no profit driver', () => {
  assert.equal(getDashboardOwnerFocusSections(null), null);
  assert.equal(getDashboardOwnerFocusSections({}), null);
  assert.equal(getDashboardOwnerFocusSections({ profit_killers: ['x'] }), null);
});

test('getDashboardOwnerFocusSections builds summary cards capped to three lines each', () => {
  const ownerFocus = {
    profit_driver: 'Selling fast-moving stock at healthy margin.',
    profit_killers: ['Shrinkage', 'Discount abuse', 'Idle stock', 'Late reordering'],
    fraud_losses: ['Till skimming'],
    daily_decisions: ['Check cash', 'Review debtors'],
    monthly_reports: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    feature_highlights: ['AI insights', 'Reports', 'Debtors', 'Reminders', 'Extra'],
  };

  const sections = getDashboardOwnerFocusSections(ownerFocus);

  assert.equal(sections.summaryCards.length, 4);
  assert.equal(sections.summaryCards[0].body, ownerFocus.profit_driver);
  assert.deepEqual(sections.summaryCards[1].lines, ['Shrinkage', 'Discount abuse', 'Idle stock']);
  assert.deepEqual(sections.summaryCards[2].lines, ['Till skimming']);
  assert.deepEqual(sections.summaryCards[3].lines, ['Check cash', 'Review debtors']);

  assert.deepEqual(sections.monthlyReports, ['Jan', 'Feb', 'Mar', 'Apr', 'May']);
  assert.deepEqual(sections.featureHighlights, ['AI insights', 'Reports', 'Debtors', 'Reminders']);
});

test('getDashboardOwnerFocusSections defaults missing list fields to empty arrays', () => {
  const sections = getDashboardOwnerFocusSections({ profit_driver: 'Driver text' });

  assert.deepEqual(sections.summaryCards[1].lines, []);
  assert.deepEqual(sections.summaryCards[2].lines, []);
  assert.deepEqual(sections.summaryCards[3].lines, []);
  assert.deepEqual(sections.monthlyReports, []);
  assert.deepEqual(sections.featureHighlights, []);
});
