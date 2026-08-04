import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAdasheLedgerLensItems,
  buildAdasheStatementPanelSummaryItems,
  buildAdasheStatementPrintSummary,
  createAdasheStatementSummary,
  getAdasheStatementEntryMeta,
  getAdasheStatementEntryTitle,
  mapAdasheStatementExportRow,
  mapAdasheStatementPanelEntries,
  sortAdasheAccounts,
} from '../src/lib/adashe.js';
import { formatCurrencyNGN } from '../src/lib/financeFormatters.js';

const accounts = [
  {
    id: 1,
    created_at: '2026-05-20T09:00:00.000Z',
    cycle_name: 'Tuesday Savers',
    next_due_date: '2026-05-29',
    limit: 40000,
    balance: 15000,
    customer: { name: 'Aisha Stores' },
    recommendation: {
      risk_level: 'medium',
    },
  },
  {
    id: 2,
    created_at: '2026-05-25T09:00:00.000Z',
    cycle_name: 'Friday Circle',
    next_due_date: '2026-05-30',
    limit: 30000,
    balance: 9000,
    customer: { name: 'Bello Market' },
    recommendation: {
      risk_level: 'high',
    },
  },
  {
    id: 3,
    created_at: '2026-05-19T09:00:00.000Z',
    cycle_name: 'Market Women',
    next_due_date: '2026-05-24',
    limit: 25000,
    balance: 12000,
    customer: { name: 'Grace Foods' },
    recommendation: {
      risk_level: 'medium',
    },
  },
  {
    id: 4,
    created_at: '2026-05-18T09:00:00.000Z',
    cycle_name: 'Weekend Circle',
    next_due_date: '2026-06-10',
    limit: 50000,
    balance: 3000,
    customer: { name: 'Musa Farms' },
    recommendation: {
      risk_level: 'low',
    },
  },
];

test('adashe account sorter supports priority, newest, target, and balance views', () => {
  assert.deepEqual(sortAdasheAccounts(accounts, 'priority').map((account) => account.id), [2, 3, 1, 4]);
  assert.deepEqual(sortAdasheAccounts(accounts, 'newest').map((account) => account.id), [2, 1, 3, 4]);
  assert.deepEqual(sortAdasheAccounts(accounts, 'largest_target').map((account) => account.id), [4, 1, 2, 3]);
  assert.deepEqual(sortAdasheAccounts(accounts, 'largest_balance').map((account) => account.id), [1, 3, 2, 4]);
});

test('adashe ledger lenses summarize scope, ordering, and selected focus clearly', () => {
  const items = buildAdasheLedgerLensItems({
    pagination: { total: 18, from: 6, to: 10, currentPage: 2, lastPage: 4 },
    activeViewLabel: 'Due now',
    activeSortLabel: 'Priority',
    activeSortDescription: 'Highest risk cycles first.',
    searchScopeSummary: 'Matches for "aisha"',
    selectedAccount: accounts[0],
    focusActions: [{ label: 'Open collection desk' }],
  });

  assert.equal(items[0].label, 'Ledger scope');
  assert.equal(items[0].value, '18 cycles');
  assert.equal(items[0].helper, 'Showing 6-10 on page 2 of 4.');
  assert.equal(items[1].label, 'Active view');
  assert.equal(items[1].value, 'Due now');
  assert.equal(items[1].helper, 'Matches for "aisha"');
  assert.equal(items[2].label, 'Ordering');
  assert.equal(items[2].helper, 'Highest risk cycles first.');
  assert.equal(items[3].label, 'Selected cycle');
  assert.match(items[3].value, /Aisha Stores/);
  assert.match(items[3].value, /Tuesday Savers/);
  assert.equal(items[3].helper, 'Next due 29 May 2026');
  assert.deepEqual(items[3].actions, [{ label: 'Open collection desk' }]);
});

test('adashe statement helpers summarize totals and export rows consistently', () => {
  const transactions = [
    {
      type: 'draw',
      amount: -4000,
      balance_after: 14000,
      transaction_date: '2026-05-25',
      reference: 'Weekly contribution',
    },
    {
      type: 'repayment',
      amount: 2000,
      balance_after: 12000,
      transaction_date: '2026-05-26',
      reference: '',
    },
  ];

  const summary = createAdasheStatementSummary(transactions);
  assert.deepEqual(summary, {
    totalCollected: 4000,
    totalPaidOut: 2000,
    lastActivityDate: '2026-05-25',
  });

  const exportRow = mapAdasheStatementExportRow(transactions[0]);
  assert.equal(exportRow.date, '25 May 2026');
  assert.equal(exportRow.activity, 'Contribution collected');
  assert.match(exportRow.amount, /4,000/);
  assert.match(exportRow.balance_after, /14,000/);
  assert.equal(exportRow.reference, 'Weekly contribution');

  assert.deepEqual(buildAdasheStatementPanelSummaryItems(summary), [
    { label: 'Collected', value: exportRow.amount, tone: 'emerald' },
    { label: 'Paid Out', value: formatCurrencyNGN(2000), tone: 'amber' },
    { label: 'Last Activity', value: '25 May 2026', tone: 'slate' },
  ]);

  assert.deepEqual(buildAdasheStatementPrintSummary(summary), [
    { label: 'Collected', value: exportRow.amount },
    { label: 'Paid Out', value: formatCurrencyNGN(2000) },
    { label: 'Last Activity', value: '25 May 2026' },
  ]);
});

test('adashe statement entry helpers keep balance, title, and meta aligned', () => {
  const transactions = [
    {
      type: 'draw',
      amount: -4000,
      balance_after: 14000,
      transaction_date: '2026-05-25',
      reference: 'Weekly contribution',
    },
    {
      type: 'repayment',
      amount: 2000,
      balance_after: 12000,
      transaction_date: '2026-05-26',
      reference: '',
    },
  ];

  const entries = mapAdasheStatementPanelEntries(transactions);
  assert.equal(entries.length, 2);
  assert.match(entries[0].balanceAfter, /14,000/);
  assert.match(entries[1].balanceAfter, /12,000/);
  assert.equal(getAdasheStatementEntryTitle(transactions[0]), 'Contribution collected');
  assert.equal(getAdasheStatementEntryTitle(transactions[1]), 'Payout recorded');
  assert.equal(getAdasheStatementEntryMeta(transactions[0]), 'Weekly contribution - 25 May 2026');
  assert.equal(getAdasheStatementEntryMeta(transactions[1]), 'No narration - 26 May 2026');
});
