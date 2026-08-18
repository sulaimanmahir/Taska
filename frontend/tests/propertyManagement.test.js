import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildMaintenanceRequestCard,
  buildMaintenanceRequestPayload,
  buildPropertyLeaseCard,
  buildPropertyLeasePayload,
  buildPropertyOverviewMetrics,
  buildPropertyUnitCard,
  buildPropertyUnitPayload,
  createMaintenanceRequestForm,
  createPropertyLeaseForm,
  createPropertyUnitForm,
  formatUnitStatus,
  formatUnitType,
  unitStatusTone,
  unitTypeOptions,
} from '../src/lib/propertyManagement.js';

test('unitTypeOptions covers the same set validated on the backend', () => {
  assert.deepEqual(unitTypeOptions.map((option) => option.value), ['apartment', 'shop', 'office', 'duplex', 'warehouse', 'land', 'other']);
});

test('formatUnitType humanizes known types and falls back safely', () => {
  assert.equal(formatUnitType('apartment'), 'Apartment');
  assert.equal(formatUnitType('warehouse'), 'Warehouse');
  assert.equal(formatUnitType(null), '');
});

test('formatUnitStatus capitalizes and unitStatusTone maps known statuses', () => {
  assert.equal(formatUnitStatus('vacant'), 'Vacant');
  assert.equal(unitStatusTone('occupied'), 'emerald');
  assert.equal(unitStatusTone('vacant'), 'slate');
  assert.equal(unitStatusTone('maintenance'), 'amber');
  assert.equal(unitStatusTone('unknown'), 'slate');
});

test('createPropertyUnitForm returns clean defaults', () => {
  const form = createPropertyUnitForm();
  assert.equal(form.unit_type, 'apartment');
  assert.equal(form.rent_amount, '');
});

test('buildPropertyUnitPayload coerces numeric fields and nulls empty optionals', () => {
  const payload = buildPropertyUnitPayload({
    property_name: 'Sabon Gari Estate',
    unit_type: 'apartment',
    address: '',
    bedrooms: '',
    rent_amount: '600000',
    service_charge_amount: '',
    notes: '',
  });

  assert.deepEqual(payload, {
    property_name: 'Sabon Gari Estate',
    unit_type: 'apartment',
    address: null,
    bedrooms: null,
    rent_amount: 600000,
    service_charge_amount: null,
    notes: null,
  });
});

test('createPropertyLeaseForm defaults payment_frequency_days to annual and today as start date', () => {
  const form = createPropertyLeaseForm();
  assert.equal(form.payment_frequency_days, '365');
  assert.match(form.start_date, /^\d{4}-\d{2}-\d{2}$/);
});

test('buildPropertyLeasePayload coerces numeric fields', () => {
  const payload = buildPropertyLeasePayload({
    property_unit_id: '5',
    customer_id: '9',
    start_date: '2026-08-18',
    end_date: '',
    rent_amount: '600000',
    service_charge_amount: '50000',
    payment_frequency_days: '365',
    deposit_amount: '',
  });

  assert.equal(payload.rent_amount, 600000);
  assert.equal(payload.service_charge_amount, 50000);
  assert.equal(payload.deposit_amount, null);
  assert.equal(payload.end_date, null);
});

test('createMaintenanceRequestForm and buildMaintenanceRequestPayload round-trip cleanly', () => {
  const form = createMaintenanceRequestForm();
  assert.equal(form.priority, 'normal');

  const payload = buildMaintenanceRequestPayload({
    property_unit_id: '3',
    title: 'Leaking roof',
    details: '',
    priority: 'high',
  });

  assert.deepEqual(payload, {
    property_unit_id: '3',
    title: 'Leaking roof',
    details: null,
    priority: 'high',
  });
});

test('buildPropertyOverviewMetrics reads summary fields with safe fallbacks', () => {
  const metrics = buildPropertyOverviewMetrics({
    occupied_units: 4,
    vacant_units: 1,
    total_outstanding_balance: 250000,
    rent_collected_this_month: 400000,
    open_maintenance_requests: 2,
  }, (value) => `₦${value}`);

  assert.deepEqual(metrics.map((m) => m.value), ['4', '1', '₦250000', '₦400000', '2']);
});

test('buildPropertyOverviewMetrics tolerates an empty summary', () => {
  const metrics = buildPropertyOverviewMetrics();
  assert.equal(metrics.length, 5);
  assert.equal(metrics[0].value, '0');
});

test('buildPropertyUnitCard formats a unit into display-ready labels', () => {
  const card = buildPropertyUnitCard({
    id: 1,
    unit_code: 'UNIT-20260818-ABCD',
    property_name: 'Sabon Gari Estate',
    unit_type: 'apartment',
    address: 'Block 4, Flat 2',
    status: 'occupied',
  });

  assert.equal(card.unitTypeLabel, 'Apartment');
  assert.equal(card.statusLabel, 'Occupied');
  assert.equal(card.statusTone, 'emerald');
});

test('buildPropertyLeaseCard formats balance and highlights outstanding debt', () => {
  const card = buildPropertyLeaseCard({
    id: 1,
    customer_name: 'Amina Yusuf',
    property_name: 'Sabon Gari Estate',
    property_unit_code: 'UNIT-1',
    balance: 250000,
    status: 'active',
    next_due_date: '2027-08-18',
  }, (value) => `₦${value}`);

  assert.equal(card.customerName, 'Amina Yusuf');
  assert.equal(card.balanceLabel, '₦250000');
  assert.equal(card.hasBalance, true);
  assert.equal(card.nextDueLabel, 'Next due 2027-08-18');
});

test('buildMaintenanceRequestCard formats priority and status', () => {
  const card = buildMaintenanceRequestCard({
    id: 1,
    title: 'Leaking roof',
    property_unit_code: 'UNIT-1',
    priority: 'high',
    status: 'in_progress',
    details: 'Water coming through the ceiling',
  });

  assert.equal(card.priorityLabel, 'High');
  assert.equal(card.statusLabel, 'In progress');
});
