import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAgroAdvisoryCard,
  buildAgroAdvisoryPayload,
  buildAgroDeskMetrics,
  buildAgroForecastCard,
  buildAgroForecastPayload,
  buildAgroOverviewMetrics,
  buildAgroPressureMetrics,
  buildAgroProgrammeSaleCard,
  buildAgroRecoveryCard,
  buildAgroRecoveryCompletionPayload,
  buildAgroRecoveryPayload,
  buildAgroSubsidySalePayload,
  createAgroAdvisoryForm,
  createAgroForecastForm,
  createAgroRecoveryForm,
  createAgroSubsidyForm,
  filterAgroAdvisories,
  filterAgroForecasts,
  filterAgroRecoveries,
  filterAgroSubsidySales,
  getAgroCurrentDate,
} from '../src/lib/agro.js';
import { formatCurrencyNGN } from '../src/lib/financeFormatters.js';

test('agro date helper and form factories return stable defaults', () => {
  const fixedDate = new Date('2026-05-25T12:30:45.000Z');

  assert.equal(getAgroCurrentDate(fixedDate), '2026-05-25');
  assert.deepEqual(createAgroForecastForm(), {
    product_id: '',
    season_name: '',
    region_name: '',
    forecast_quantity: '',
    reserved_quantity: '',
    confidence_score: '',
  });
  assert.deepEqual(createAgroSubsidyForm(fixedDate), {
    customer_id: '',
    product_id: '',
    programme_name: '',
    agency_name: '',
    region_name: '',
    season_name: '',
    input_category: 'fertilizer',
    quantity: '',
    unit_price: '',
    amount_received: '',
    sale_date: '2026-05-25',
  });
  assert.deepEqual(createAgroRecoveryForm(), {
    customer_id: '',
    region_name: '',
    credit_amount: '',
    recovered_amount: '',
    due_date: '',
  });
  assert.deepEqual(createAgroAdvisoryForm(fixedDate), {
    customer_id: '',
    farmer_name: '',
    region_name: '',
    advisory_type: '',
    crop_or_input: '',
    recommendation: '',
    advised_on: '2026-05-25',
    follow_up_date: '',
  });
});

test('agro overview and owner pressure helpers keep agro metrics aligned', () => {
  const overviewMetrics = buildAgroOverviewMetrics({
    forecast_quantity: 1200,
    programme_sales_total: 450000,
    subsidy_receivable: 180000,
    open_recoveries: 6,
  });
  const pressureMetrics = buildAgroPressureMetrics({
    subsidy_receivable: 180000,
    outstanding_credit: 95000,
    avg_confidence: 72,
  });

  assert.deepEqual(overviewMetrics[0], {
    label: 'Forecast Quantity',
    value: 1200,
    helper: 'Projected seasonal demand currently captured across active regional plans.',
    tone: 'sky',
  });
  assert.equal(overviewMetrics[1].value, formatCurrencyNGN(450000));
  assert.deepEqual(pressureMetrics[2], {
    label: 'Forecast Confidence',
    value: '72%',
    tone: 'sky',
  });

  const deskMetrics = buildAgroDeskMetrics(
    {
      forecast_quantity: 1200,
      programme_sales_total: 450000,
      subsidy_receivable: 180000,
      open_recoveries: 6,
    },
    [{ id: 1, region_name: 'Kano' }],
    [{ id: 2, region_name: 'Kaduna' }],
    [{ id: 3, region_name: 'Zaria', due_date: '2026-05-20', status: 'open' }],
    [{ id: 4, region_name: 'Katsina' }],
  );

  assert.equal(deskMetrics[4].value, 4);
  assert.equal(deskMetrics[6].value, 1);
  assert.equal(deskMetrics[8].value, 1);
});

test('agro payload helpers normalize seasonal, programme, recovery, and advisory forms', () => {
  assert.deepEqual(buildAgroForecastPayload({
    product_id: '7',
    season_name: 'Wet Season',
    region_name: 'Kano',
    forecast_quantity: '1200',
    reserved_quantity: '300',
    confidence_score: '75',
  }), {
    product_id: '7',
    season_name: 'Wet Season',
    region_name: 'Kano',
    forecast_quantity: 1200,
    reserved_quantity: 300,
    confidence_score: 75,
  });

  assert.deepEqual(buildAgroSubsidySalePayload({
    customer_id: '',
    product_id: '9',
    programme_name: 'Anchor Scheme',
    agency_name: 'State ADP',
    region_name: 'Kaduna',
    season_name: '2026 Wet',
    input_category: 'seed',
    quantity: '40',
    unit_price: '8500',
    amount_received: '120000',
    sale_date: '2026-05-25',
  }), {
    customer_id: null,
    product_id: '9',
    programme_name: 'Anchor Scheme',
    agency_name: 'State ADP',
    region_name: 'Kaduna',
    season_name: '2026 Wet',
    input_category: 'seed',
    quantity: 40,
    unit_price: 8500,
    amount_received: 120000,
    sale_date: '2026-05-25',
  });

  assert.deepEqual(buildAgroRecoveryPayload({
    customer_id: '4',
    region_name: 'Zaria',
    credit_amount: '50000',
    recovered_amount: '15000',
    due_date: '2026-06-10',
  }), {
    customer_id: '4',
    region_name: 'Zaria',
    credit_amount: 50000,
    recovered_amount: 15000,
    due_date: '2026-06-10',
  });

  assert.deepEqual(buildAgroAdvisoryPayload({
    customer_id: '',
    farmer_name: 'Bello',
    region_name: 'Kano',
    advisory_type: 'soil_test',
    crop_or_input: 'maize',
    recommendation: 'Apply basal fertilizer',
    advised_on: '2026-05-25',
    follow_up_date: '2026-06-01',
  }), {
    customer_id: null,
    farmer_name: 'Bello',
    region_name: 'Kano',
    advisory_type: 'soil_test',
    crop_or_input: 'maize',
    recommendation: 'Apply basal fertilizer',
    advised_on: '2026-05-25',
    follow_up_date: '2026-06-01',
  });

  assert.deepEqual(buildAgroRecoveryCompletionPayload({ credit_amount: 50000 }), {
    recovered_amount: 50000,
  });
});

test('agro presentation helpers keep sales, recoveries, forecasts, and advisories readable', () => {
  assert.deepEqual(buildAgroProgrammeSaleCard({
    id: 1,
    programme_name: 'Anchor Scheme',
    region_name: 'Kaduna',
    amount_due: 200000,
    amount_received: 120000,
    customer: { name: 'Bello Farms' },
    product: { name: 'Urea' },
  }), {
    id: 1,
    title: 'Anchor Scheme',
    meta: `Kaduna - due ${formatCurrencyNGN(80000)}`,
    detailLabel: 'Bello Farms - Urea',
  });

  assert.deepEqual(buildAgroRecoveryCard({
    id: 2,
    customer: { name: 'Bello Farms' },
    region_name: 'Zaria',
    outstanding_amount: 35000,
    status: 'open',
    due_date: '2026-06-10',
  }), {
    id: 2,
    title: 'Bello Farms',
    meta: `Zaria - due ${formatCurrencyNGN(35000)}`,
    dueLabel: '2026-06-10',
    isRecovered: false,
  });

  assert.deepEqual(buildAgroForecastCard({
    id: 3,
    region_name: 'Kano',
    season_name: 'Wet Season',
    product: { name: 'Urea' },
    forecast_quantity: 1000,
    reserved_quantity: 250,
    confidence_score: 75,
  }), {
    id: 3,
    title: 'Kano - Wet Season',
    meta: 'Urea - forecast 1000 / reserved 250',
    confidenceLabel: '75% confidence',
  });

  assert.deepEqual(buildAgroAdvisoryCard({
    id: 4,
    advisory_type: 'pest_control',
    region_name: 'Katsina',
    crop_or_input: 'tomato',
    customer: { name: 'Amina Bello' },
  }), {
    id: 4,
    title: 'pest_control',
    meta: 'Katsina - tomato',
    farmerLabel: 'Amina Bello',
  });

  assert.deepEqual(filterAgroForecasts([
    { id: 1, region_name: 'Kano', season_name: 'Wet Season' },
    { id: 2, region_name: 'Kaduna', season_name: 'Dry Season' },
  ], 'dry').map((entry) => entry.id), [2]);

  assert.deepEqual(filterAgroSubsidySales([
    { id: 3, programme_name: 'Anchor Scheme', agency_name: 'State ADP' },
    { id: 4, programme_name: 'Cluster Seed' },
  ], 'adp').map((entry) => entry.id), [3]);

  assert.deepEqual(filterAgroRecoveries([
    { id: 5, customer: { name: 'Bello Farms' }, status: 'open' },
    { id: 6, customer: { name: 'Amina Bello' }, status: 'recovered' },
  ], 'recovered').map((entry) => entry.id), [6]);

  assert.deepEqual(filterAgroAdvisories([
    { id: 7, advisory_type: 'pest_control', farmer_name: 'Bello' },
    { id: 8, advisory_type: 'soil_test', farmer_name: 'Amina' },
  ], 'soil').map((entry) => entry.id), [8]);
});
