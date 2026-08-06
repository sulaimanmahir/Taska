import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getAdasheDashboardState,
  getTrustFundDashboardState,
  getCooperativeDashboardState,
  getAdasheDashboardWatch,
  getTrustFundDashboardWatch,
  getCooperativeDashboardWatch,
} from '../src/lib/dashboardFinanceSummaries.js';

test('getAdasheDashboardState flags urgency when cycles are due now', () => {
  const state = getAdasheDashboardState({ due_now: 2, due_soon: 1, next_due_date: '2026-05-25' });

  assert.equal(state.statusLabel, 'Collections need attention');
  assert.equal(state.summaryLabel, 'Collection urgency');
  assert.match(state.whatMatters, /2 due cycles/);
  assert.equal(state.overviewAction.to, '/adashe');
  assert.equal(state.nextMoveAction.to, '/adashe?view=due_now');
  assert.deepEqual(state.overviewSecondaryBadges[0], { label: 'High urgency', tone: 'amber' });
  assert.equal(state.overviewSecondaryBadges[1].label, 'Review by 25 May');
});

test('getAdasheDashboardState uses singular phrasing for exactly one due cycle', () => {
  const state = getAdasheDashboardState({ due_now: 1 });
  assert.match(state.whatMatters, /1 due cycle that/);
});

test('getAdasheDashboardState reports a healthy rhythm when nothing is due', () => {
  const state = getAdasheDashboardState({});
  assert.equal(state.statusLabel, 'Cycle is on track');
  assert.equal(state.summaryTone, 'emerald');
  assert.equal(state.overviewSecondaryBadges.length, 1);
});

test('getAdasheDashboardState tolerates a missing summary', () => {
  const state = getAdasheDashboardState(undefined);
  assert.equal(state.statusLabel, 'Cycle is on track');
});

test('getTrustFundDashboardState flags overdue accounts as high risk', () => {
  const state = getTrustFundDashboardState({ overdue_accounts: 3, high_utilization_accounts: 1 });
  assert.equal(state.statusLabel, 'Recoveries need attention');
  assert.match(state.whatMatters, /3 overdue trust accounts/);
  assert.equal(state.overviewAction.to, '/trust-fund?view=overdue');
});

test('getTrustFundDashboardState flags high utilization when nothing is overdue', () => {
  const state = getTrustFundDashboardState({ overdue_accounts: 0, high_utilization_accounts: 2 });
  assert.equal(state.statusLabel, 'Repayments are moving');
  assert.match(state.whatMatters, /heavily utilized/);
});

test('getTrustFundDashboardState reports steady recovery with no risk signals', () => {
  const state = getTrustFundDashboardState({});
  assert.match(state.whatMatters, /steady pattern/);
  assert.equal(state.overviewSecondaryBadges[0].label, 'Low risk');
});

test('getCooperativeDashboardState prioritizes pending approvals', () => {
  const state = getCooperativeDashboardState({ pending_approvals: 4, pending_profit_cycles: 1 });
  assert.equal(state.summaryLabel, 'Approval queue');
  assert.equal(state.nextMoveAction.to, '/cooperative?section=financing');
});

test('getCooperativeDashboardState surfaces distribution review when no approvals are pending', () => {
  const state = getCooperativeDashboardState({ pending_profit_cycles: 2 });
  assert.equal(state.summaryLabel, 'Distribution review');
  assert.equal(state.nextMoveAction.to, '/cooperative?section=profits');
});

test('getCooperativeDashboardState includes a distributable amount badge when positive', () => {
  const state = getCooperativeDashboardState({ next_distribution_amount: 25000 });
  assert.deepEqual(state.nextMoveSecondaryBadges[1], { label: 'Distributable 25,000', tone: 'slate' });
});

test('getAdasheDashboardWatch builds metric tiles and a spotlight', () => {
  const watch = getAdasheDashboardWatch(
    {
      member_accounts: 12,
      average_frequency_days: 7,
      total_collected: 50000,
      completion_rate: 40,
      due_now: 2,
      due_soon: 3,
      total_paid_out: 20000,
      total_target: 100000,
      lead_cycle_name: 'Weekly cycle',
      next_due_member: 'Amaka',
      next_due_date: '2026-05-25',
    },
    { statusLabel: 'Collections need attention', statusClass: 'bg-amber-100 text-amber-700' },
  );

  assert.equal(watch.title, 'Adashe Watch');
  assert.equal(watch.metrics.length, 4);
  assert.equal(watch.metrics[0].label, 'Member Cycles');
  assert.equal(watch.metrics[1].value, '₦50,000');
  assert.equal(watch.spotlight.title, 'Weekly cycle');
  assert.match(watch.spotlight.description, /Amaka is next up on 25 May 2026/);
  assert.equal(watch.spotlight.statusLabel, 'Collections need attention');
});

test('getAdasheDashboardWatch tolerates missing summary and state', () => {
  const watch = getAdasheDashboardWatch(undefined, undefined);
  assert.equal(watch.metrics[0].value, 0);
  assert.match(watch.spotlight.description, /No member selected/);
});

test('getTrustFundDashboardWatch builds metric tiles and a spotlight around the lead customer', () => {
  const watch = getTrustFundDashboardWatch(
    {
      active_balance_accounts: 5,
      account_count: 8,
      total_outstanding: 30000,
      total_extended: 100000,
      overdue_accounts: 1,
      high_utilization_accounts: 2,
      total_collected: 15000,
      lead_customer_name: 'Chidi Stores',
      lead_balance: 8000,
      lead_last_payment_date: '2026-05-20',
    },
    { statusLabel: 'Recoveries need attention', statusClass: 'bg-amber-100 text-amber-700' },
  );

  assert.equal(watch.title, 'Trust Fund Watch');
  assert.equal(watch.metrics[1].value, '₦30,000');
  assert.match(watch.spotlight.description, /Chidi Stores currently carries ₦8,000 outstanding, last paid on 20 May 2026/);
});

test('getTrustFundDashboardWatch reports no review needed without a lead customer', () => {
  const watch = getTrustFundDashboardWatch({}, {});
  assert.equal(watch.spotlight.description, 'No outstanding trust balance needs review right now.');
});

test('getCooperativeDashboardWatch builds metrics and detail tiles', () => {
  const watch = getCooperativeDashboardWatch({
    members: 40,
    active_financing: 6,
    main_wallet_balance: 200000,
    reserve_wallet_balance: 50000,
    pending_approvals: 2,
    pending_profit_cycles: 1,
    charity_wallet_balance: 10000,
    distributed_cycles: 3,
    last_distribution_label: 'Q1 2026',
    last_distribution_date: '2026-04-01',
    next_distribution_label: 'Q2 2026',
    next_distribution_amount: 75000,
  });

  assert.equal(watch.title, 'Cooperative Watch');
  assert.equal(watch.metrics[1].value, '₦200,000');
  assert.equal(watch.detailTiles[0].title, 'Q1 2026');
  assert.match(watch.detailTiles[1].description, /₦75,000 waiting for review/);
});

test('getCooperativeDashboardWatch handles an empty summary', () => {
  const watch = getCooperativeDashboardWatch(undefined);
  assert.equal(watch.detailTiles[0].title, 'No distribution yet');
  assert.equal(watch.detailTiles[1].description, 'Create or approve a cycle to prepare member distributions.');
});
