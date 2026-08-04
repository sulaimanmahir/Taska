import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDebtorCard,
  buildDebtorOverviewMetrics,
  filterDebtorAccounts,
  getDebtorAccounts,
} from '../src/lib/debtors.js';

test('debtor helpers keep only positive balances and sort by exposure', () => {
  const accounts = getDebtorAccounts([
    { id: 1, name: 'Calm Stores', balance: 0 },
    { id: 2, name: 'Apex Trade', balance: 45000 },
    { id: 3, name: 'North Point', balance: 125000 },
  ]);

  assert.deepEqual(accounts.map((account) => account.id), [3, 2]);
});

test('debtor search matches name, phone, email, and type safely', () => {
  const accounts = [
    { id: 1, name: 'Apex Trade', phone: '0800', email: 'apex@example.com', customer_type: 'wholesaler' },
    { id: 2, name: 'North Point', phone: '0900', email: 'north@example.com', customer_type: 'retailer' },
  ];

  assert.deepEqual(filterDebtorAccounts(accounts, 'apex').map((account) => account.id), [1]);
  assert.deepEqual(filterDebtorAccounts(accounts, '0900').map((account) => account.id), [2]);
  assert.deepEqual(filterDebtorAccounts(accounts, 'wholesaler').map((account) => account.id), [1]);
});

test('debtor metrics summarize exposure and follow-up pressure cleanly', () => {
  const metrics = buildDebtorOverviewMetrics([
    { balance: 120000, credit_limit: 250000 },
    { balance: 30000, credit_limit: 70000 },
  ], (value) => `NGN ${value}`);

  assert.equal(metrics[0].value, 2);
  assert.equal(metrics[1].value, 'NGN 150000');
  assert.equal(metrics[2].value, 'NGN 75000');
  assert.equal(metrics[3].value, 1);
  assert.equal(metrics[4].value, 'NGN 320000');
});

test('debtor cards expose readable collection context', () => {
  const card = buildDebtorCard({
    id: 4,
    name: 'North Point',
    balance: 125000,
    credit_limit: 200000,
    phone: '0803 000 0000',
    email: 'north@example.com',
    customer_type: 'wholesaler',
  }, (value) => `NGN ${value}`);

  assert.equal(card.title, 'North Point');
  assert.equal(card.balanceLabel, 'NGN 125000');
  assert.equal(card.creditLimitLabel, 'NGN 200000');
  assert.equal(card.headroomLabel, 'NGN 75000');
  assert.equal(card.collectionPriority, 'Immediate follow-up');
});
