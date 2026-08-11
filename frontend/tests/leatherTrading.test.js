import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildLeatherProcessingBatchCard,
  buildLeatherProcessingBatchPayload,
  buildLeatherTradingOverviewMetrics,
  createLeatherProcessingBatchForm,
  formatHideType,
  hideTypeOptions,
} from '../src/lib/leatherTrading.js';

test('hideTypeOptions covers the same set validated on the backend', () => {
  assert.deepEqual(hideTypeOptions.map((option) => option.value), ['cattle', 'goat', 'sheep', 'camel', 'other']);
});

test('formatHideType humanizes known types and falls back safely', () => {
  assert.equal(formatHideType('cattle'), 'Cattle');
  assert.equal(formatHideType('camel'), 'Camel');
  assert.equal(formatHideType(null), '');
});

test('createLeatherProcessingBatchForm returns clean defaults with today as the processing date', () => {
  const form = createLeatherProcessingBatchForm();
  assert.equal(form.hide_type, 'cattle');
  assert.equal(form.input_hide_count, '');
  assert.match(form.processing_date, /^\d{4}-\d{2}-\d{2}$/);
});

test('buildLeatherProcessingBatchPayload coerces numeric fields and defaults notes/weight to null', () => {
  const payload = buildLeatherProcessingBatchPayload({
    processing_date: '2026-08-07',
    hide_type: 'cattle',
    input_hide_count: '100',
    input_weight_kg: '1500',
    output_sqft: '850',
    reject_count: '10',
    tanning_chemical_cost: '60000',
    labour_cost: '40000',
    other_cost: '15000',
    notes: '',
  });

  assert.deepEqual(payload, {
    processing_date: '2026-08-07',
    hide_type: 'cattle',
    input_hide_count: 100,
    input_weight_kg: 1500,
    output_sqft: 850,
    reject_count: 10,
    tanning_chemical_cost: 60000,
    labour_cost: 40000,
    other_cost: 15000,
    notes: null,
  });
});

test('buildLeatherProcessingBatchPayload nulls weight when omitted entirely', () => {
  const payload = buildLeatherProcessingBatchPayload({
    processing_date: '2026-08-07',
    hide_type: 'goat',
    input_hide_count: '50',
  });

  assert.equal(payload.input_weight_kg, null);
});

test('buildLeatherTradingOverviewMetrics reads summary fields with safe fallbacks', () => {
  const metrics = buildLeatherTradingOverviewMetrics({
    batches_today: 1,
    hides_processed_today: 100,
    output_sqft_today: 850,
    rejects_today: 10,
    average_reject_rate_percent: 10,
    processing_cost_today: 115000,
  }, (value) => `₦${value}`);

  assert.deepEqual(metrics.map((m) => m.value), [
    '1',
    '100',
    '850 sqft',
    '10',
    '10%',
    '₦115000',
  ]);
});

test('buildLeatherTradingOverviewMetrics tolerates an empty summary', () => {
  const metrics = buildLeatherTradingOverviewMetrics();
  assert.equal(metrics.length, 6);
  assert.equal(metrics[0].value, '0');
});

test('buildLeatherProcessingBatchCard formats a batch into display-ready labels', () => {
  const card = buildLeatherProcessingBatchCard({
    id: 3,
    batch_number: 'LPB-20260807-ABCD',
    hide_type: 'cattle',
    processing_date: '2026-08-07',
    status: 'completed',
    input_hide_count: 100,
    output_sqft: 850,
    reject_count: 10,
    reject_rate_percent: 10,
    total_cost: 115000,
  }, (value) => `₦${value}`);

  assert.equal(card.batchNumber, 'LPB-20260807-ABCD');
  assert.equal(card.hideTypeLabel, 'Cattle');
  assert.equal(card.inputLabel, '100 hides in');
  assert.equal(card.outputLabel, '850 sqft out');
  assert.equal(card.rejectLabel, '10 rejects');
  assert.equal(card.rejectRateLabel, '10% reject rate');
  assert.equal(card.totalCostLabel, '₦115000');
});
