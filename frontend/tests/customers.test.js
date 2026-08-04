import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCustomerOverviewMetrics,
  buildCustomerPayload,
  buildCustomerRow,
  createCustomerForm,
  filterCustomers,
} from '../src/lib/customers.js';

test('customer form helpers return API-aligned defaults and payloads', () => {
  assert.deepEqual(createCustomerForm(), {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    customer_group_id: '',
    customer_type: 'individual',
    credit_limit: '',
    is_active: true,
  });

  assert.deepEqual(buildCustomerPayload({
    name: '  Amina Stores  ',
    email: '  amina@example.com  ',
    phone: ' 08030001111 ',
    address: ' 15 Market Road ',
    city: ' Kaduna ',
    state: ' Kaduna ',
    customer_group_id: '8',
    customer_type: 'retailer',
    credit_limit: '50000',
    is_active: false,
  }), {
    name: 'Amina Stores',
    email: 'amina@example.com',
    phone: '08030001111',
    address: '15 Market Road',
    city: 'Kaduna',
    state: 'Kaduna',
    customer_group_id: 8,
    customer_type: 'retailer',
    credit_limit: 50000,
    is_active: false,
  });
});

test('customer overview metrics summarize coverage, debt pressure, and latest customer context', () => {
  const metrics = buildCustomerOverviewMetrics([
    {
      id: 1,
      name: 'Amina Stores',
      balance: 45000,
      credit_limit: 120000,
      is_active: true,
      created_at: '2026-06-03T10:00:00.000000Z',
      group: { name: 'Retailers' },
    },
    {
      id: 2,
      name: 'North Hub',
      balance: 0,
      credit_limit: 0,
      is_active: false,
      created_at: '2026-06-01T10:00:00.000000Z',
      group: null,
    },
  ], (value) => `NGN ${value}`);

  assert.equal(metrics[0].value, 1);
  assert.equal(metrics[1].value, 1);
  assert.equal(metrics[2].value, 1);
  assert.equal(metrics[3].value, 'NGN 45000');
  assert.equal(metrics[4].value, 'Amina Stores');
  assert.equal(metrics[4].helper, 'Assigned to Retailers.');
});

test('customer rows expose readable commercial and location context', () => {
  const row = buildCustomerRow({
    id: 7,
    name: 'Amina Stores',
    customer_type: 'retailer',
    phone: '08030001111',
    balance: 45000,
    credit_limit: 120000,
    is_active: false,
    city: 'Kaduna',
    state: 'Kaduna',
    group: { name: 'Retailers' },
    email: 'amina@example.com',
  }, (value) => `NGN ${value}`);

  assert.deepEqual(row, {
    id: 7,
    title: 'Amina Stores',
    typeLabel: 'retailer',
    phoneLabel: '08030001111',
    balanceLabel: 'NGN 45000',
    creditLimitLabel: 'NGN 120000',
    statusLabel: 'Inactive',
    locationLabel: 'Kaduna, Kaduna',
    groupLabel: 'Retailers',
    emailLabel: 'amina@example.com',
  });
});

test('customer filtering matches name, contact, group, type, and location safely', () => {
  const customers = [
    {
      id: 1,
      name: 'Amina Stores',
      phone: '08030001111',
      email: 'amina@example.com',
      customer_type: 'retailer',
      city: 'Kaduna',
      state: 'Kaduna',
      group: { name: 'Retailers' },
    },
    {
      id: 2,
      name: 'North Hub',
      phone: '09040002222',
      email: 'north@example.com',
      customer_type: 'wholesaler',
      city: 'Zaria',
      state: 'Kaduna',
      group: { name: 'Wholesale' },
    },
  ];

  assert.deepEqual(filterCustomers(customers, 'amina').map((customer) => customer.id), [1]);
  assert.deepEqual(filterCustomers(customers, '0904').map((customer) => customer.id), [2]);
  assert.deepEqual(filterCustomers(customers, 'wholesale').map((customer) => customer.id), [2]);
  assert.deepEqual(filterCustomers(customers, 'zaria').map((customer) => customer.id), [2]);
});
