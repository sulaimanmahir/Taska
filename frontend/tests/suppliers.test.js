import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSupplierCard,
  buildSupplierOverviewMetrics,
  buildSupplierPayload,
  createSupplierForm,
  filterSuppliers,
} from '../src/lib/suppliers.js';

test('supplier form helpers return API-aligned defaults and payloads', () => {
  assert.deepEqual(createSupplierForm(), {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    contact_person: '',
    is_active: true,
  });

  assert.deepEqual(buildSupplierPayload({
    name: ' Grace Supply ',
    email: ' grace@example.com ',
    phone: ' 08030001111 ',
    address: ' 15 Market Road ',
    city: ' Kaduna ',
    state: ' Kaduna ',
    contact_person: ' Musa Bello ',
    is_active: false,
  }), {
    name: 'Grace Supply',
    email: 'grace@example.com',
    phone: '08030001111',
    address: '15 Market Road',
    city: 'Kaduna',
    state: 'Kaduna',
    contact_person: 'Musa Bello',
    is_active: false,
  });
});

test('supplier overview metrics summarize procurement coverage and exposure', () => {
  const metrics = buildSupplierOverviewMetrics([
    {
      name: 'Grace Supply',
      email: 'grace@example.com',
      phone: '0803',
      balance: 15000,
      city: 'Kaduna',
      state: 'Kaduna',
      is_active: true,
      created_at: '2026-06-03T10:00:00.000000Z',
    },
    {
      name: 'North Traders',
      email: '',
      phone: '',
      balance: 0,
      city: 'Zaria',
      state: '',
      is_active: false,
      created_at: '2026-06-01T10:00:00.000000Z',
    },
  ], (value) => `NGN ${value}`);

  assert.equal(metrics[0].value, 1);
  assert.equal(metrics[1].value, 1);
  assert.equal(metrics[2].value, 1);
  assert.equal(metrics[3].value, 'NGN 15000');
  assert.equal(metrics[4].value, 'Grace Supply');
  assert.equal(metrics[4].helper, 'Kaduna, Kaduna');
});

test('supplier cards expose contact, status, and balance context cleanly', () => {
  const card = buildSupplierCard({
    id: 7,
    name: 'Grace Supply',
    email: 'grace@example.com',
    phone: '0803',
    address: '15 Market Road',
    city: 'Kaduna',
    state: 'Kaduna',
    contact_person: 'Musa Bello',
    balance: 25000,
    is_active: false,
  }, (value) => `NGN ${value}`);

  assert.deepEqual(card, {
    id: 7,
    title: 'Grace Supply',
    initial: 'G',
    phoneLabel: '0803',
    emailLabel: 'grace@example.com',
    addressLabel: '15 Market Road',
    locationLabel: 'Kaduna, Kaduna',
    contactPersonLabel: 'Musa Bello',
    balanceLabel: 'NGN 25000',
    statusLabel: 'Inactive',
  });
});

test('supplier filtering matches name, contact, and location safely', () => {
  const suppliers = [
    { id: 1, name: 'Grace Supply', email: 'grace@example.com', phone: '0803', city: 'Kaduna', state: 'Kaduna', contact_person: 'Musa Bello' },
    { id: 2, name: 'North Traders', email: 'north@example.com', phone: '0904', city: 'Zaria', state: 'Kaduna', contact_person: 'Amina Ali' },
  ];

  assert.deepEqual(filterSuppliers(suppliers, 'grace').map((supplier) => supplier.id), [1]);
  assert.deepEqual(filterSuppliers(suppliers, 'amina').map((supplier) => supplier.id), [2]);
  assert.deepEqual(filterSuppliers(suppliers, 'zaria').map((supplier) => supplier.id), [2]);
  assert.deepEqual(filterSuppliers(suppliers, '0904').map((supplier) => supplier.id), [2]);
});
