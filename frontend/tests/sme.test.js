import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSmeCashEntryCard,
  buildSmeCashPayload,
  buildSmeFollowUpCard,
  buildSmeFollowUpPayload,
  buildSmeOverviewMetrics,
  buildSmeOwnerPulse,
  buildSmeTargetCard,
  buildSmeTargetPayload,
  createSmeCashForm,
  createSmeFollowUpForm,
  createSmeTargetForm,
  getSmeCurrentDate,
  getSmeDueFollowUps,
} from '../src/lib/sme.js';
import { formatCurrencyNGN } from '../src/lib/financeFormatters.js';

test('sme date helper and form factories return stable defaults', () => {
  const fixedDate = new Date('2026-05-25T12:30:45.000Z');

  assert.equal(getSmeCurrentDate(fixedDate), '2026-05-25');
  assert.deepEqual(createSmeCashForm(fixedDate), {
    entry_type: 'cash_in',
    source: '',
    amount: '',
    payment_method: 'cash',
    entry_date: '2026-05-25',
    notes: '',
  });
  assert.deepEqual(createSmeFollowUpForm(fixedDate), {
    title: '',
    due_on: '2026-05-25',
    amount_in_focus: '',
    notes: '',
  });
  assert.deepEqual(createSmeTargetForm(fixedDate), {
    target_date: '2026-05-25',
    sales_target: '',
    collection_target: '',
    expense_limit: '',
    notes: '',
  });
});

test('sme overview and owner pulse helpers keep owner metrics aligned', () => {
  const metrics = buildSmeOverviewMetrics({
    sales_today: 250000,
    cash_in_today: 210000,
    cash_out_today: 60000,
    expenses_today: 45000,
    debtor_exposure: 180000,
    followups_due: 4,
    target_attainment: 86.45,
    sales_target: 300000,
  });
  const pulse = buildSmeOwnerPulse({
    net_cash_today: 150000,
    collection_target: 125000,
    expense_limit: 50000,
  });

  assert.deepEqual(metrics[0], {
    label: 'Sales Today',
    value: formatCurrencyNGN(250000),
    helper: `Cash in: ${formatCurrencyNGN(210000)}`,
    tone: 'emerald',
  });
  assert.equal(metrics[2].helper, '4 follow-ups due today.');
  assert.equal(metrics[3].value, '86.5%');
  assert.deepEqual(pulse[0], {
    label: 'Net Cash Today',
    value: formatCurrencyNGN(150000),
  });
});

test('sme follow-up helpers keep due items and customer context readable', () => {
  const dueItems = getSmeDueFollowUps([
    { id: 1, status: 'open', title: 'Call Amina', due_on: '2026-05-26', customer: { name: 'Amina Stores' } },
    { id: 2, status: 'done', title: 'Closed item' },
    { id: 3, status: 'open', title: 'Visit Bala', due_on: '2026-05-27', customer: null },
  ]);

  assert.equal(dueItems.length, 2);
  assert.deepEqual(buildSmeFollowUpCard(dueItems[0]), {
    id: 1,
    title: 'Call Amina',
    customerLabel: 'Amina Stores',
    dueLabel: 'Due 2026-05-26',
  });
  assert.deepEqual(buildSmeFollowUpCard(dueItems[1]), {
    id: 3,
    title: 'Visit Bala',
    customerLabel: 'No customer linked',
    dueLabel: 'Due 2026-05-27',
  });
});

test('sme payload and card helpers normalize owner workflows consistently', () => {
  assert.deepEqual(buildSmeCashPayload({
    entry_type: 'cash_out',
    source: 'Fuel purchase',
    amount: '12000',
    payment_method: 'cash',
    entry_date: '2026-05-25',
    notes: 'Station run',
  }), {
    entry_type: 'cash_out',
    source: 'Fuel purchase',
    amount: 12000,
    payment_method: 'cash',
    entry_date: '2026-05-25',
    notes: 'Station run',
  });

  assert.deepEqual(buildSmeTargetPayload({
    target_date: '2026-05-25',
    sales_target: '300000',
    collection_target: '125000',
    expense_limit: '50000',
    notes: 'Push collections',
  }), {
    target_date: '2026-05-25',
    sales_target: 300000,
    collection_target: 125000,
    expense_limit: 50000,
    notes: 'Push collections',
  });

  assert.deepEqual(buildSmeFollowUpPayload({
    title: 'Call debtor',
    due_on: '2026-05-26',
    amount_in_focus: '45000',
    notes: 'Important',
    customer_id: '7',
  }), {
    title: 'Call debtor',
    due_on: '2026-05-26',
    amount_in_focus: 45000,
    notes: 'Important',
    customer_id: '7',
  });

  assert.deepEqual(buildSmeCashEntryCard({
    id: 8,
    source: 'Daily sales',
    entry_type: 'cash_in',
    payment_method: 'transfer',
    amount: 98000,
    entry_date: '2026-05-25',
  }), {
    id: 8,
    source: 'Daily sales',
    meta: 'cash in via transfer',
    amountLabel: formatCurrencyNGN(98000),
    amountTone: 'text-emerald-700',
    dateLabel: '2026-05-25',
  });

  assert.deepEqual(buildSmeTargetCard({
    id: 9,
    target_date: '2026-05-25',
    sales_target: 300000,
    collection_target: 125000,
  }), {
    id: 9,
    dateLabel: '2026-05-25',
    salesLabel: `Sales ${formatCurrencyNGN(300000)}`,
    collectionsLabel: `Collections ${formatCurrencyNGN(125000)}`,
  });
});
