import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTrustFundLedgerAccountPresentation,
  buildTrustFundLedgerLensItems,
  buildTrustFundOverdueAccountPresentation,
  buildTrustFundStatementPrintSummary,
  createTrustFundStatementSummary,
  getTrustFundTransactionState,
  mapTrustFundStatementExportRow,
  sortTrustAccounts,
} from '../src/lib/trustFund.js';

const accounts = [
  {
    id: 1,
    created_at: '2026-05-20T09:00:00.000Z',
    limit: 20000,
    balance: 5000,
    recommendation: {
      risk_level: 'medium',
      next_review_date: '2026-05-29',
    },
  },
  {
    id: 2,
    created_at: '2026-05-25T09:00:00.000Z',
    limit: 15000,
    balance: 9000,
    recommendation: {
      risk_level: 'high',
      next_review_date: '2026-05-27',
      tone: 'rose',
      message: 'Collect repayment before the next release.',
      why: 'This customer is already carrying too much exposure.',
    },
  },
  {
    id: 3,
    created_at: '2026-05-18T09:00:00.000Z',
    limit: 30000,
    balance: 1000,
    recommendation: {
      risk_level: 'low',
      next_review_date: '2026-06-10',
    },
  },
];

test('trust fund account sorter supports priority, newest, balance, and limit views', () => {
  assert.deepEqual(sortTrustAccounts(accounts, 'priority').map((account) => account.id), [2, 1, 3]);
  assert.deepEqual(sortTrustAccounts(accounts, 'newest').map((account) => account.id), [2, 1, 3]);
  assert.deepEqual(sortTrustAccounts(accounts, 'largest_balance').map((account) => account.id), [2, 1, 3]);
  assert.deepEqual(sortTrustAccounts(accounts, 'largest_limit').map((account) => account.id), [3, 1, 2]);
});

test('trust fund ledger lenses summarize scope, ordering, and selected focus clearly', () => {
  const items = buildTrustFundLedgerLensItems({
    pagination: { total: 12, currentPage: 2, lastPage: 3 },
    orderedAccountsList: [accounts[0], accounts[1]],
    activeViewLabel: 'Overdue',
    activeSortLabel: 'Priority',
    activeSortDescription: 'Highest risk accounts first.',
    searchScopeSummary: 'Matches for "musa"',
    selectedLedgerAccount: {
      customer: { name: 'Musa Traders' },
      recommendation: { risk_level: 'high' },
    },
    focusActions: [{ label: 'Open repayment' }],
  });

  assert.equal(items[0].label, 'Ledger scope');
  assert.equal(items[0].helper, 'Viewing page 2 of 3.');
  assert.equal(items[1].value, 'Overdue');
  assert.equal(items[2].helper, 'Highest risk accounts first.');
  assert.equal(items[3].value, 'Selected account');
  assert.equal(items[3].helper, 'Musa Traders • high risk');
  assert.deepEqual(items[3].actions, [{ label: 'Open repayment' }]);
});

test('trust fund ledger account presentation keeps recommendation, status, and CTA copy aligned', () => {
  const presentation = buildTrustFundLedgerAccountPresentation(accounts[1]);

  assert.equal(presentation.outstanding, 9000);
  assert.equal(presentation.utilization, 60);
  assert.equal(presentation.statusLabel, 'Active');
  assert.equal(presentation.statusClassName, 'bg-amber-50 text-amber-700');
  assert.equal(presentation.drawLabel, 'Open draw');
  assert.equal(presentation.repayLabel, 'Open repayment');
  assert.equal(presentation.drawAriaLabel, 'Open draw for customer');
  assert.equal(presentation.repayAriaLabel, 'Open repayment for customer');
  assert.equal(presentation.recommendationPresentation.summaryLabel, 'Risk reduction');
});

test('trust fund overdue presentation keeps repayment CTA and recommendation summary aligned', () => {
  const presentation = buildTrustFundOverdueAccountPresentation(accounts[1]);

  assert.equal(presentation.customerName, 'customer');
  assert.equal(presentation.overdueAmountLabel, '₦9,000 overdue');
  assert.equal(presentation.ctaLabel, 'Open repayment');
  assert.equal(presentation.ariaLabel, 'Open repayment for overdue account customer');
  assert.equal(presentation.recommendationPresentation.summaryLabel, 'Risk reduction');
});

test('trust fund statement helpers summarize totals and export rows consistently', () => {
  const transactions = [
    {
      type: 'draw',
      amount: -5000,
      balance_after: 5000,
      transaction_date: '2026-05-25',
      reference: 'Opening release',
    },
    {
      type: 'repayment',
      amount: 1500,
      balance_after: 3500,
      transaction_date: '2026-05-26',
      reference: '',
    },
  ];

  const summary = createTrustFundStatementSummary(transactions);
  assert.deepEqual(summary, {
    totalDrawn: 5000,
    totalRecovered: 1500,
    lastActivityDate: '2026-05-25',
  });

  assert.deepEqual(mapTrustFundStatementExportRow(transactions[0]), {
    date: '25 May 2026',
    activity: 'Draw released',
    amount: '₦5,000',
    balance_after: '₦5,000',
    reference: 'Opening release',
  });

  assert.deepEqual(buildTrustFundStatementPrintSummary(summary), [
    { label: 'Drawn', value: '₦5,000' },
    { label: 'Recovered', value: '₦1,500' },
    { label: 'Last Activity', value: '25 May 2026' },
  ]);
});

test('trust fund transaction state flags missing or invalid draw input safely', () => {
  const missingAccountState = getTrustFundTransactionState({
    modalType: 'draw',
    selectedAccount: null,
    amount: '1000',
  });

  assert.equal(missingAccountState.transactionValidationMessage, 'Choose an account before saving this transaction.');

  const invalidAmountState = getTrustFundTransactionState({
    modalType: 'draw',
    selectedAccount: accounts[0],
    amount: '0',
  });

  assert.equal(invalidAmountState.transactionValidationMessage, 'Enter an amount greater than zero.');
});

test('trust fund transaction state blocks amounts above available draw headroom', () => {
  const state = getTrustFundTransactionState({
    modalType: 'draw',
    selectedAccount: accounts[0],
    amount: '18000',
  });

  assert.equal(state.availableToDraw, 15000);
  assert.equal(state.transactionValidationMessage, 'This draw exceeds the available limit of ₦15,000.');
  assert.equal(
    state.transactionRecommendation,
    'Best next step: release only what fits within the remaining headroom of ₦15,000.',
  );
});

test('trust fund transaction state reuses recommendation messaging for risky draw actions', () => {
  const state = getTrustFundTransactionState({
    modalType: 'draw',
    selectedAccount: accounts[1],
    amount: '5000',
    transactionAutoFillHint: 'Prefilled from recommendation.',
  });

  assert.equal(state.transactionRecommendationTone, 'rose');
  assert.equal(state.transactionRecommendation, 'Collect repayment before the next release.');
  assert.equal(state.transactionRecommendationWhy, 'This customer is already carrying too much exposure.');
  assert.equal(state.transactionRecommendationRiskLevel, 'high');
  assert.equal(state.transactionAutoFillPresentation?.badge?.label, 'Within headroom');
});

test('trust fund transaction state validates repayments against the outstanding balance', () => {
  const overpayState = getTrustFundTransactionState({
    modalType: 'repay',
    selectedAccount: accounts[0],
    amount: '7000',
  });

  assert.equal(overpayState.transactionValidationMessage, 'This repayment exceeds the outstanding balance of ₦5,000.');

  const validRepayState = getTrustFundTransactionState({
    modalType: 'repay',
    selectedAccount: accounts[0],
    amount: '3000',
  });

  assert.equal(validRepayState.transactionValidationMessage, null);
  assert.equal(validRepayState.transactionPositiveMessage, 'Within range. Up to ₦5,000 can be recovered on this repayment.');
  assert.equal(
    validRepayState.transactionRecommendation,
    'Best next step: recover up to ₦5,000 to clear the current balance.',
  );
});
