import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildExpenseCategoryCard,
  buildExpenseCategoryPayload,
  buildExpenseLedgerRow,
  buildExpenseOverviewMetrics,
  buildExpensePayload,
  createExpenseCategoryForm,
  createExpenseForm,
  filterExpenseLedger,
  getExpenseDatePresets,
} from '../src/lib/expenses.js';

test('expense form helpers return API-aligned defaults and payloads', () => {
  const seededDate = new Date('2026-06-04T10:30:00.000Z');

  assert.deepEqual(createExpenseForm(seededDate), {
    description: '',
    amount: '',
    expense_category_id: '',
    payment_method: 'cash',
    reference: '',
    expense_date: '2026-06-04',
  });

  assert.deepEqual(createExpenseCategoryForm(), {
    name: '',
    description: '',
  });

  assert.deepEqual(buildExpensePayload({
    description: ' Diesel for generator ',
    amount: '35000',
    expense_category_id: '8',
    payment_method: 'transfer',
    reference: ' TRX-9 ',
    expense_date: '2026-06-04',
  }), {
    description: 'Diesel for generator',
    amount: 35000,
    expense_category_id: 8,
    payment_method: 'transfer',
    reference: 'TRX-9',
    expense_date: '2026-06-04',
  });

  assert.deepEqual(buildExpenseCategoryPayload({
    name: ' Transport ',
    description: ' Vehicle runs and rider payouts ',
  }), {
    name: 'Transport',
    description: 'Vehicle runs and rider payouts',
  });
});

test('expense date presets calculate today, week start, and month start safely', () => {
  const presets = getExpenseDatePresets(new Date('2026-06-04T10:30:00.000Z'));

  assert.deepEqual(presets, {
    today: '2026-06-04',
    weekStart: '2026-06-01',
    monthStart: '2026-06-01',
  });
});

test('expense overview metrics summarize spend windows and category pressure', () => {
  const metrics = buildExpenseOverviewMetrics({
    todaySummary: {
      total_today: 120000,
      by_category: [
        { name: 'Transport', total: 70000 },
        { name: 'Fuel', total: 50000 },
      ],
    },
    weekTotal: 340000,
    monthTotal: 980000,
    categories: [
      { id: 1, is_active: true },
      { id: 2, is_active: false },
      { id: 3, is_active: true },
    ],
  }, (value) => `NGN ${value}`);

  assert.equal(metrics[0].value, 'NGN 120000');
  assert.equal(metrics[1].value, 'NGN 340000');
  assert.equal(metrics[2].value, 'NGN 980000');
  assert.equal(metrics[3].value, '2');
  assert.equal(metrics[4].value, 'Transport');
  assert.equal(metrics[4].helper, "NGN 70000 is leading today's spend concentration.");
});

test('expense category and ledger helpers keep reporting context readable', () => {
  const categoryCard = buildExpenseCategoryCard({
    id: 7,
    name: 'Transport',
    description: 'Dispatch and vehicle movement',
    expenses_count: 12,
    is_active: true,
  }, {
    Transport: 45000,
  }, (value) => `NGN ${value}`);

  assert.deepEqual(categoryCard, {
    id: 7,
    title: 'Transport',
    descriptionLabel: 'Dispatch and vehicle movement',
    todayAmountLabel: 'NGN 45000',
    statusLabel: 'Active',
    usageLabel: '12 logged',
  });

  const ledgerRow = buildExpenseLedgerRow({
    id: 11,
    description: 'Diesel for generator',
    amount: 35000,
    expense_date: '2026-06-04',
    payment_method: 'transfer',
    reference: 'TRX-9',
    is_approved: false,
    category: { name: 'Utilities' },
  }, (value) => `NGN ${value}`, (value) => `DATE ${value}`);

  assert.deepEqual(ledgerRow, {
    id: 11,
    title: 'Diesel for generator',
    categoryLabel: 'Utilities',
    dateLabel: 'DATE 2026-06-04',
    amountLabel: 'NGN 35000',
    paymentMethodLabel: 'transfer',
    referenceLabel: 'TRX-9',
    approvalLabel: 'Awaiting review',
  });
});

test('expense ledger filtering matches description, category, method, and reference safely', () => {
  const entries = [
    {
      id: 1,
      description: 'Diesel for generator',
      payment_method: 'transfer',
      reference: 'TRX-1',
      expense_date: '2026-06-04',
      amount: 12000,
      category: { name: 'Utilities' },
    },
    {
      id: 2,
      description: 'Water for staff',
      payment_method: 'cash',
      reference: '',
      expense_date: '2026-06-03',
      amount: 5000,
      category: { name: 'Welfare' },
    },
  ];

  assert.deepEqual(filterExpenseLedger(entries, 'diesel').map((entry) => entry.id), [1]);
  assert.deepEqual(filterExpenseLedger(entries, 'welfare').map((entry) => entry.id), [2]);
  assert.deepEqual(filterExpenseLedger(entries, 'transfer').map((entry) => entry.id), [1]);
  assert.deepEqual(filterExpenseLedger(entries, 'TRX-1').map((entry) => entry.id), [1]);
});
