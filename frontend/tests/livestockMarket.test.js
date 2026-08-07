import test from 'node:test';
import assert from 'node:assert/strict';

import {
  animalTypeOptions,
  buildLivestockMarketOverviewMetrics,
  buildLivestockMarketTransactionCard,
  buildLivestockMarketTransactionPayload,
  createLivestockMarketTransactionForm,
  formatAnimalType,
  transactionTypeOptions,
} from '../src/lib/livestockMarket.js';

test('animalTypeOptions and transactionTypeOptions cover the sets validated on the backend', () => {
  assert.deepEqual(animalTypeOptions.map((o) => o.value), ['cattle', 'goat', 'sheep', 'camel', 'poultry', 'other']);
  assert.deepEqual(transactionTypeOptions.map((o) => o.value), ['intake', 'sale']);
});

test('formatAnimalType humanizes known types and falls back safely', () => {
  assert.equal(formatAnimalType('cattle'), 'Cattle');
  assert.equal(formatAnimalType('goat'), 'Goat');
  assert.equal(formatAnimalType(null), '');
});

test('createLivestockMarketTransactionForm returns clean defaults', () => {
  const form = createLivestockMarketTransactionForm();
  assert.equal(form.transaction_type, 'intake');
  assert.equal(form.animal_type, 'cattle');
  assert.equal(form.head_count, '');
  assert.match(form.market_date, /^\d{4}-\d{2}-\d{2}$/);
});

test('buildLivestockMarketTransactionPayload coerces numeric fields and nulls optional ones', () => {
  const payload = buildLivestockMarketTransactionPayload({
    transaction_type: 'sale',
    animal_type: 'cattle',
    head_count: '8',
    total_weight_kg: '2400',
    unit_price_per_kg: '2200',
    total_amount: '5280000',
    counterparty_name: 'Sani Buyer',
    counterparty_phone: '',
    market_date: '2026-08-07',
    notes: '',
  });

  assert.deepEqual(payload, {
    transaction_type: 'sale',
    animal_type: 'cattle',
    head_count: 8,
    total_weight_kg: 2400,
    unit_price_per_kg: 2200,
    total_amount: 5280000,
    counterparty_name: 'Sani Buyer',
    counterparty_phone: null,
    market_date: '2026-08-07',
    notes: null,
  });
});

test('buildLivestockMarketTransactionPayload nulls weight/price when omitted entirely', () => {
  const payload = buildLivestockMarketTransactionPayload({
    transaction_type: 'intake',
    animal_type: 'goat',
    head_count: '10',
    total_amount: '500000',
    counterparty_name: 'Musa Herder',
    market_date: '2026-08-07',
  });

  assert.equal(payload.total_weight_kg, null);
  assert.equal(payload.unit_price_per_kg, null);
});

test('buildLivestockMarketOverviewMetrics reads summary fields with safe fallbacks', () => {
  const metrics = buildLivestockMarketOverviewMetrics({
    animals_in_holding: 12,
    intake_head_count_today: 20,
    sale_head_count_today: 8,
    revenue_today: 5280000,
    intake_cost_today: 4000000,
    average_sale_price_per_kg: 2200,
  }, (value) => `₦${value}`);

  assert.deepEqual(metrics.map((m) => m.value), ['12', '20', '8', '₦5280000', '₦4000000', '₦2200']);
});

test('buildLivestockMarketOverviewMetrics tolerates an empty summary', () => {
  const metrics = buildLivestockMarketOverviewMetrics();
  assert.equal(metrics.length, 6);
  assert.equal(metrics[0].value, '0');
});

test('buildLivestockMarketTransactionCard formats intake and sale transactions distinctly', () => {
  const saleCard = buildLivestockMarketTransactionCard({
    id: 2,
    transaction_number: 'LMS-20260807-ABCD',
    transaction_type: 'sale',
    animal_type: 'cattle',
    market_date: '2026-08-07',
    head_count: 8,
    total_weight_kg: 2400,
    counterparty_name: 'Sani Buyer',
    total_amount: 5280000,
  }, (value) => `₦${value}`);

  assert.equal(saleCard.isSale, true);
  assert.equal(saleCard.typeLabel, 'Sale');
  assert.equal(saleCard.counterpartyLabel, 'Sold to Sani Buyer');
  assert.equal(saleCard.headCountLabel, '8 head');
  assert.equal(saleCard.weightLabel, '2400 kg');
  assert.equal(saleCard.totalAmountLabel, '₦5280000');

  const intakeCard = buildLivestockMarketTransactionCard({
    id: 1,
    transaction_number: 'LMI-20260807-WXYZ',
    transaction_type: 'intake',
    animal_type: 'cattle',
    market_date: '2026-08-07',
    head_count: 20,
    counterparty_name: 'Musa Herder',
    total_amount: 4000000,
  }, (value) => `₦${value}`);

  assert.equal(intakeCard.isSale, false);
  assert.equal(intakeCard.typeLabel, 'Intake');
  assert.equal(intakeCard.counterpartyLabel, 'Bought from Musa Herder');
  assert.equal(intakeCard.weightLabel, null);
});
