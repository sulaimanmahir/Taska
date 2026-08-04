import test from 'node:test';
import assert from 'node:assert/strict';

import {
  extractInsightHighlights,
  formatInsightMetricValue,
  formatInsightType,
  getInsightAction,
  getInsightTypeColor,
  getInsightTypeIcon,
} from '../src/lib/aiInsights/index.js';
import { getDashboardVerticalSection } from '../src/lib/dashboardVerticalSections.js';
import { getDashboardQuickActions } from '../src/lib/dashboardQuickActions.js';
import { getDashboardOwnerFocusSections } from '../src/lib/dashboardOwnerFocus.js';
import { formatDashboardCurrency, formatDashboardDate, getDashboardActivityActionLabel } from '../src/lib/dashboardFormatters.js';
import { formatCurrencyNGN, formatDateTimeLocal, formatShortDate } from '../src/lib/financeFormatters.js';
import { getAdasheDashboardState, getCooperativeDashboardState } from '../src/lib/dashboardFinanceSummaries.js';

test('cooperative and adashe insights resolve to the right workflow actions', () => {
  assert.deepEqual(
    getInsightAction({ type: 'cooperative_financing_approval_drag' }),
    { to: '/cooperative?section=financing', label: 'Open financing' },
  );

  assert.deepEqual(
    getInsightAction({ type: 'cooperative_profit_distribution_readiness' }),
    { to: '/cooperative?section=profits', label: 'Review profit cycle' },
  );

  assert.deepEqual(
    getInsightAction({ type: 'adashe_due_collection_pressure' }),
    { to: '/adashe', label: 'Open adashe' },
  );
});

test('industry insight actions still deep-link to their operational modules', () => {
  assert.deepEqual(
    getInsightAction({ type: 'delivery_cod_exposure_forecast' }),
    { to: '/deliveries', label: 'Open deliveries' },
  );

  assert.deepEqual(
    getInsightAction({ type: 'production_cost_spike_forecast' }),
    { to: '/production', label: 'Open production' },
  );

  assert.deepEqual(
    getInsightAction({ type: 'hotel_occupancy_pacing' }),
    { to: '/bookings', label: 'Open bookings' },
  );
});

test('presentation helpers preserve insight styling and readable labels', () => {
  assert.equal(getInsightTypeColor('delivery_cod_exposure_forecast'), 'from-sky-500 to-indigo-500');
  assert.equal(
    getInsightTypeIcon('adashe_due_collection_pressure'),
    'M12 9v2m0 4h.01m-7.938 4h15.876c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L2.33 16c-.77 1.333.192 3 1.732 3z',
  );
  assert.equal(formatInsightType('cooperative_profit_distribution_readiness'), 'cooperative profit distribution readiness');
  assert.equal(formatInsightMetricValue(12850), '12,850');
  assert.equal(formatInsightMetricValue(12.36), '12.4');
});

test('highlight extraction keeps domain-specific summary chips intact', () => {
  assert.deepEqual(
    extractInsightHighlights({
      type: 'delivery_cod_exposure_forecast',
      data: { outstanding_cod: 45500, exposure_ratio_percent: 32.4 },
    }),
    [
      { label: 'Outstanding COD', value: 'NGN 45,500' },
      { label: 'Exposure', value: '32.4%'},
    ],
  );

  assert.deepEqual(
    extractInsightHighlights({
      type: 'wholesale_route_profitability_forecast',
      data: { route_runs_below_target: 3, weak_stops: 7 },
    }),
    [
      { label: 'Weak routes', value: '3' },
      { label: 'Weak stops', value: '7' },
    ],
  );
});

test('adashe dashboard state reflects collection pressure correctly', () => {
  const urgentState = getAdasheDashboardState({ due_now: 2 });
  assert.equal(urgentState.statusLabel, 'Collections need attention');
  assert.equal(urgentState.statusClass, 'bg-amber-100 text-amber-700');
  assert.equal(urgentState.whatMatters, 'You have 2 due cycles that can affect payout confidence if collections slip.');
  assert.equal(urgentState.nextMove, 'Call the due member, log the collection, and confirm the next route before new payout promises are made.');
  assert.deepEqual(urgentState.nextMoveAction, {
    label: 'Review due cycles',
    to: '/adashe?view=due_now',
    tone: 'amber',
  });

  const steadyState = getAdasheDashboardState({ due_now: 0 });
  assert.equal(steadyState.statusLabel, 'Cycle is on track');
  assert.equal(steadyState.statusClass, 'bg-emerald-100 text-emerald-700');
  assert.equal(steadyState.whatMatters, 'Contribution cycles are moving well. Keep the next collection date visible and protect the payout schedule.');
  assert.equal(steadyState.nextMove, 'Review the next due member, confirm the route plan, and keep weekly collection discipline visible to the team.');
  assert.deepEqual(steadyState.overviewAction, {
    label: 'Open adashe desk',
    to: '/adashe',
    tone: 'violet',
  });
});

test('cooperative dashboard state reflects approvals and profit-cycle readiness', () => {
  const pressuredState = getCooperativeDashboardState({ pending_approvals: 1, pending_profit_cycles: 3 });
  assert.equal(pressuredState.whatMatters, 'You have 1 financing approval item slowing member decisions.');
  assert.equal(pressuredState.nextMove, 'Review the open profit cycle, confirm reserve and charity allocations, and prepare the next distribution resolution.');
  assert.deepEqual(pressuredState.nextMoveAction, {
    label: 'Open approvals',
    to: '/cooperative?section=financing',
    tone: 'amber',
  });

  const stableState = getCooperativeDashboardState({ pending_approvals: 0, pending_profit_cycles: 0 });
  assert.equal(stableState.whatMatters, 'Approval flow is clear right now. Keep treasury discipline and member communication visible.');
  assert.equal(stableState.nextMove, 'Track active financing performance, keep guarantor follow-up tidy, and maintain healthy reserve coverage.');
  assert.deepEqual(stableState.overviewAction, {
    label: 'Open cooperative',
    to: '/cooperative',
    tone: 'emerald',
  });
});

test('dashboard formatters preserve finance-friendly currency and safe date fallback', () => {
  assert.equal(formatDashboardCurrency(45200), '₦45,200');
  assert.equal(formatDashboardCurrency(null), 'NGN 0');
  assert.equal(formatDashboardDate(null), 'No due date set');
  assert.equal(formatDashboardDate('2026-05-02'), '2 May 2026');
});

test('shared finance formatters stay reusable across ops modules', () => {
  assert.equal(formatCurrencyNGN('12500'), '₦12,500');
  assert.equal(formatCurrencyNGN(null), '₦0');
  assert.equal(formatShortDate(null), 'Not set');
  assert.equal(formatShortDate(null, 'No activity yet'), 'No activity yet');
  assert.equal(formatShortDate('2026-05-02'), '2 May 2026');
  assert.equal(formatDateTimeLocal(null), 'Not scheduled');
});

test('dashboard vertical section resolver groups business types correctly', () => {
  assert.equal(getDashboardVerticalSection('supermarket')?.title, 'Retail Operations');
  assert.equal(getDashboardVerticalSection('general')?.focusTitle, 'SME Focus');
  assert.equal(
    getDashboardVerticalSection('school')?.metricsClassName,
    'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4',
  );
  assert.equal(getDashboardVerticalSection('unknown_type'), null);
});

test('warehouse dashboard helpers prefer the canonical warehouse summary and activity type', () => {
  const warehouseSection = getDashboardVerticalSection('warehouse');
  const aliasedWarehouseSection = getDashboardVerticalSection('ngo_warehouse');
  const metrics = warehouseSection.metrics({
    warehouse: {
      donor_sources: 3,
      partner_requests_pending: 4,
      distributions_today: 2,
      expiry_alerts: 1,
    },
  });

  assert.deepEqual(
    metrics.map((metric) => metric.value),
    [3, 4, 2, 1],
  );
  assert.equal(aliasedWarehouseSection?.title, 'Warehouse Control');

  assert.equal(
    getDashboardActivityActionLabel({ type: 'warehouse_distribution', action_path: '/warehouse' }),
    'Open warehouse',
  );
});

test('dashboard quick actions adapt by business type', () => {
  const beautyActions = getDashboardQuickActions({
    labels: { newSale: 'Book service', addProduct: 'Add product', addCustomer: 'Add customer', expenses: 'Expenses' },
    color: '#7c3aed',
    type: 'beauty',
  });
  const retailActions = getDashboardQuickActions({
    labels: { newSale: 'New sale', addProduct: 'Add product', addCustomer: 'Add customer', expenses: 'Expenses' },
    color: '#2563eb',
    type: 'retail',
  });

  assert.equal(beautyActions[0].path, '/appointments');
  assert.equal(retailActions[0].path, '/pos');
  assert.equal(retailActions[1].path, '/products');
});

test('dashboard owner focus helper shapes summary content safely', () => {
  assert.equal(getDashboardOwnerFocusSections(null), null);

  const ownerFocus = getDashboardOwnerFocusSections({
    profit_driver: 'Fast turns and clean collections',
    profit_killers: ['Leakage', 'Waste', 'Bad pricing'],
    fraud_losses: ['Cash theft'],
    daily_decisions: ['Review debtors', 'Restock top sellers', 'Close shifts'],
    monthly_reports: ['Profit report', 'Cash flow report'],
    feature_highlights: ['Inventory control', 'Branch comparison'],
  });

  assert.equal(ownerFocus.summaryCards[0].title, 'How this business makes money');
  assert.equal(ownerFocus.summaryCards[1].lines.length, 3);
  assert.equal(ownerFocus.monthlyReports.length, 2);
  assert.equal(ownerFocus.featureHighlights.length, 2);
});
