import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildGrainMillingBatchCard,
  buildGrainMillingBatchPayload,
  buildGrainMillingOverviewMetrics,
  createGrainMillingBatchForm,
  formatGrainType,
  grainTypeOptions,
} from '../src/lib/grainMilling.js';

test('grainTypeOptions covers the same set validated on the backend', () => {
  const values = grainTypeOptions.map((option) => option.value);
  assert.deepEqual(values, ['maize', 'rice', 'sorghum', 'millet', 'wheat', 'groundnut', 'other']);
});

test('formatGrainType humanizes known types and falls back safely', () => {
  assert.equal(formatGrainType('maize'), 'Maize');
  assert.equal(formatGrainType('groundnut'), 'Groundnut');
  assert.equal(formatGrainType('unknown_type'), 'unknown_type');
  assert.equal(formatGrainType(null), '');
});

test('createGrainMillingBatchForm returns clean defaults with today as the milling date', () => {
  const form = createGrainMillingBatchForm();
  assert.equal(form.grain_type, 'maize');
  assert.equal(form.input_quantity_kg, '');
  assert.match(form.milling_date, /^\d{4}-\d{2}-\d{2}$/);
});

test('buildGrainMillingBatchPayload coerces numeric fields and defaults notes to null', () => {
  const payload = buildGrainMillingBatchPayload({
    milling_date: '2026-08-07',
    grain_type: 'rice',
    input_quantity_kg: '500',
    output_quantity_kg: '390',
    byproduct_quantity_kg: '90',
    wastage_quantity_kg: '20',
    labour_cost: '2000',
    electricity_cost: '1000',
    packaging_cost: '500',
    notes: '',
  });

  assert.deepEqual(payload, {
    milling_date: '2026-08-07',
    grain_type: 'rice',
    input_quantity_kg: 500,
    output_quantity_kg: 390,
    byproduct_quantity_kg: 90,
    wastage_quantity_kg: 20,
    labour_cost: 2000,
    electricity_cost: 1000,
    packaging_cost: 500,
    notes: null,
  });
});

test('buildGrainMillingOverviewMetrics reads summary fields with safe fallbacks', () => {
  const metrics = buildGrainMillingOverviewMetrics({
    batches_today: 3,
    input_today_kg: 1500,
    output_today_kg: 1170,
    average_yield_percent: 78,
    byproduct_today_kg: 270,
    processing_cost_today: 15000,
  }, (value) => `₦${value}`);

  assert.deepEqual(metrics.map((m) => m.value), [
    '3',
    '1500 kg',
    '1170 kg',
    '78%',
    '270 kg',
    '₦15000',
  ]);
});

test('buildGrainMillingOverviewMetrics tolerates an empty summary', () => {
  const metrics = buildGrainMillingOverviewMetrics();
  assert.equal(metrics.length, 6);
  assert.equal(metrics[0].value, '0');
});

test('buildGrainMillingBatchCard formats a batch into display-ready labels', () => {
  const card = buildGrainMillingBatchCard({
    id: 5,
    batch_number: 'GMB-20260807-ABCD',
    grain_type: 'sorghum',
    milling_date: '2026-08-07',
    status: 'completed',
    input_quantity_kg: 1000,
    output_quantity_kg: 780,
    byproduct_quantity_kg: 180,
    wastage_quantity_kg: 40,
    yield_percent: 78,
    total_cost: 9500,
  }, (value) => `₦${value}`);

  assert.equal(card.batchNumber, 'GMB-20260807-ABCD');
  assert.equal(card.grainTypeLabel, 'Sorghum');
  assert.equal(card.inputLabel, '1000 kg in');
  assert.equal(card.outputLabel, '780 kg out');
  assert.equal(card.yieldLabel, '78% yield');
  assert.equal(card.totalCostLabel, '₦9500');
});
