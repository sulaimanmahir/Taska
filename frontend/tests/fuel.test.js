import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildFuelAlertItem,
  buildFuelDeskMetrics,
  buildFuelDipPayload,
  buildFuelLossMetrics,
  buildFuelOverviewMetrics,
  buildFuelPumpCard,
  buildFuelPriceChangePayload,
  buildFuelPumpPayload,
  buildFuelReadingPayload,
  buildFuelShiftPayload,
  buildFuelTankCard,
  buildFuelTankPayload,
  createFuelDipForm,
  createFuelPriceForm,
  createFuelPumpForm,
  createFuelReadingForm,
  createFuelShiftForm,
  createFuelTankForm,
  fuelTypes,
  filterFuelAlerts,
  getFuelCurrentDate,
  getFuelCurrentDateTime,
  getFuelShiftOpenedAt,
} from '../src/lib/fuel.js';
import { formatCurrencyNGN } from '../src/lib/financeFormatters.js';

test('fuel date helpers and form factories return stable default values', () => {
  const fixedDate = new Date('2026-05-25T12:30:45.000Z');

  assert.equal(getFuelCurrentDate(fixedDate), '2026-05-25');
  assert.equal(getFuelCurrentDateTime(fixedDate), '2026-05-25T12:30');
  assert.equal(getFuelShiftOpenedAt(fixedDate), '2026-05-25T06:30');
  assert.deepEqual(fuelTypes, ['petrol', 'diesel', 'kerosene', 'cooking_gas']);
  assert.deepEqual(createFuelTankForm(), {
    name: '',
    fuel_type: 'petrol',
    capacity_litres: '',
    current_stock_litres: '',
    reorder_level_litres: '',
    price_per_litre: '',
  });
  assert.deepEqual(createFuelPumpForm(), {
    fuel_tank_id: '',
    name: '',
    code: '',
    attendant_name: '',
    nozzle_count: '1',
    meter_reading_start: '',
    meter_reading_current: '',
  });
  assert.deepEqual(createFuelReadingForm(fixedDate), {
    fuel_pump_id: '',
    attendant_name: '',
    shift_name: 'Morning',
    reading_date: '2026-05-25',
    opening_reading: '',
    closing_reading: '',
    unit_price: '',
    cash_reported: '',
  });
  assert.deepEqual(createFuelDipForm(fixedDate), {
    fuel_tank_id: '',
    dipped_at: '2026-05-25T12:30',
    opening_stock_litres: '',
    deliveries_received_litres: '0',
    closing_stock_litres: '',
    notes: '',
  });
  assert.deepEqual(createFuelShiftForm(fixedDate), {
    attendant_name: '',
    shift_name: 'Morning',
    opened_at: '2026-05-25T06:30',
    closed_at: '2026-05-25T12:30',
    cash_expected: '',
    cash_reported: '',
    recovery_amount: '0',
  });
  assert.deepEqual(createFuelPriceForm(), {
    fuel_type: 'petrol',
    new_price: '',
    changed_by_name: '',
    reason: '',
  });
});

test('fuel overview and loss metrics keep station finance and variance labels aligned', () => {
  const overviewMetrics = buildFuelOverviewMetrics({
    sales_today: 980000,
    litres_today: 4200,
    low_stock_tanks: 2,
    anomaly_alerts: 3,
  });
  const lossMetrics = buildFuelLossMetrics({
    shortage_today: 18500,
    recovery_today: 9000,
    dip_variance_today: 12.3456,
  });

  assert.deepEqual(overviewMetrics[0], {
    label: 'Sales Today',
    value: formatCurrencyNGN(980000),
    helper: 'Pump revenue already captured in the current operating day.',
    tone: 'emerald',
  });
  assert.equal(overviewMetrics[1].value, 4200);
  assert.equal(lossMetrics[0].value, formatCurrencyNGN(18500));
  assert.equal(lossMetrics[2].value, '12.35 L');

  const deskMetrics = buildFuelDeskMetrics(
    { sales_today: 980000, litres_today: 4200, low_stock_tanks: 2, anomaly_alerts: 3 },
    [{ id: 1, current_stock_litres: 1000, reorder_level_litres: 1200 }],
    [{ id: 2, is_active: true }],
    [{ id: 3 }],
  );

  assert.equal(deskMetrics[4].value, 1);
  assert.equal(deskMetrics[5].value, 1);
  assert.equal(deskMetrics[6].value, 1);
  assert.equal(deskMetrics[7].value, 1);
});

test('fuel payload helpers normalize reading, tank, pump, dip, shift, and price forms', () => {
  assert.deepEqual(buildFuelReadingPayload({
    fuel_pump_id: '4',
    opening_reading: '',
    closing_reading: '125.6',
    unit_price: '950',
    cash_reported: '',
  }), {
    fuel_pump_id: '4',
    opening_reading: null,
    closing_reading: 125.6,
    unit_price: 950,
    cash_reported: null,
  });

  assert.deepEqual(buildFuelTankPayload({
    name: 'Tank A',
    fuel_type: 'petrol',
    capacity_litres: '33000',
    current_stock_litres: '18500',
    reorder_level_litres: '5000',
    price_per_litre: '910',
  }), {
    name: 'Tank A',
    fuel_type: 'petrol',
    capacity_litres: 33000,
    current_stock_litres: 18500,
    reorder_level_litres: 5000,
    price_per_litre: 910,
  });

  assert.deepEqual(buildFuelPumpPayload({
    fuel_tank_id: '',
    name: 'Pump 1',
    code: 'P-01',
    attendant_name: 'Sani',
    nozzle_count: '2',
    meter_reading_start: '400',
    meter_reading_current: '',
  }), {
    fuel_tank_id: null,
    name: 'Pump 1',
    code: 'P-01',
    attendant_name: 'Sani',
    nozzle_count: 2,
    meter_reading_start: 400,
    meter_reading_current: 400,
  });

  assert.deepEqual(buildFuelDipPayload({
    fuel_tank_id: '3',
    dipped_at: '2026-05-25T12:30',
    opening_stock_litres: '',
    deliveries_received_litres: '12000',
    closing_stock_litres: '17500',
    notes: 'Normal dip',
  }), {
    fuel_tank_id: '3',
    dipped_at: '2026-05-25T12:30',
    opening_stock_litres: null,
    deliveries_received_litres: 12000,
    closing_stock_litres: 17500,
    notes: 'Normal dip',
  });

  assert.deepEqual(buildFuelShiftPayload({
    attendant_name: 'Sani',
    shift_name: 'Morning',
    opened_at: '2026-05-25T06:30',
    closed_at: '2026-05-25T12:30',
    cash_expected: '250000',
    cash_reported: '245000',
    recovery_amount: '3000',
  }), {
    attendant_name: 'Sani',
    shift_name: 'Morning',
    opened_at: '2026-05-25T06:30',
    closed_at: '2026-05-25T12:30',
    cash_expected: 250000,
    cash_reported: 245000,
    recovery_amount: 3000,
  });

  assert.deepEqual(buildFuelPriceChangePayload({
    fuel_type: 'diesel',
    new_price: '1250',
    changed_by_name: 'Manager',
    reason: 'Landing cost',
  }), {
    fuel_type: 'diesel',
    new_price: 1250,
    changed_by_name: 'Manager',
    reason: 'Landing cost',
  });
});

test('fuel alert presenter keeps anomaly copy readable', () => {
  assert.deepEqual(buildFuelAlertItem({
    id: 7,
    alert_type: 'tank_variance',
    details: 'Tank 2 closed 18L below expected stock',
    severity: 'high',
  }), {
    id: 7,
    title: 'tank variance',
    details: 'Tank 2 closed 18L below expected stock',
    severityLabel: 'high',
  });

  assert.deepEqual(buildFuelTankCard({
    id: 8,
    name: 'Tank A',
    fuel_type: 'diesel',
    current_stock_litres: 18500,
    reorder_level_litres: 5000,
    price_per_litre: 910,
  }), {
    id: 8,
    title: 'Tank A',
    fuelLabel: 'diesel',
    stockLabel: '18500.00 L in stock',
    reorderLabel: 'Reorder at 5000.00 L',
    priceLabel: formatCurrencyNGN(910),
  });

  assert.deepEqual(buildFuelPumpCard({
    id: 9,
    name: 'Pump 1',
    tank: { name: 'Tank A' },
    attendant_name: 'Sani',
    nozzle_count: 2,
  }), {
    id: 9,
    title: 'Pump 1',
    tankLabel: 'Tank A',
    attendantLabel: 'Sani',
    nozzleLabel: '2 nozzles',
  });

  assert.deepEqual(filterFuelAlerts([
    { id: 10, alert_type: 'tank_variance', details: 'Tank 2 closed 18L below expected stock', severity: 'high' },
    { id: 11, alert_type: 'negative_cash', details: 'Attendant mismatch', severity: 'medium' },
  ], 'mismatch').map((entry) => entry.id), [11]);
});
