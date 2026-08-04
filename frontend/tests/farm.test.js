import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildFarmCycleCard,
  buildFarmCycleOptionLabel,
  buildFarmCyclePayload,
  buildFarmDeskMetrics,
  buildFarmFieldPulseMetrics,
  buildFarmHarvestCard,
  buildFarmHarvestPayload,
  buildFarmInputPayload,
  buildFarmOverviewMetrics,
  buildFarmPlotCard,
  buildFarmPlotPayload,
  createFarmCycleForm,
  createFarmHarvestForm,
  createFarmInputForm,
  createFarmPlotForm,
  filterFarmCycles,
  filterFarmHarvests,
  filterFarmPlots,
} from '../src/lib/farm.js';
import { formatCurrencyNGN } from '../src/lib/financeFormatters.js';

test('farm form factories return stable crop workflow defaults', () => {
  assert.deepEqual(createFarmPlotForm(), {
    name: '',
    location: '',
    size_hectares: '',
    soil_type: '',
  });
  assert.deepEqual(createFarmCycleForm(), {
    plot_id: '',
    crop_name: '',
    season_name: '',
    planting_date: '',
    expected_harvest_date: '',
    planted_area_hectares: '',
    status: 'planned',
  });
  assert.deepEqual(createFarmInputForm(), {
    planting_cycle_id: '',
    input_type: 'fertilizer',
    input_name: '',
    quantity: '',
    unit: 'kg',
    cost: '',
    applied_on: '',
  });
  assert.deepEqual(createFarmHarvestForm(), {
    planting_cycle_id: '',
    quantity_harvested: '',
    unit: 'kg',
    estimated_revenue: '',
    loss_quantity: '',
    harvested_on: '',
  });
});

test('farm overview and field pulse helpers keep owner metrics aligned', () => {
  assert.deepEqual(buildFarmOverviewMetrics({
    active_plots: 4,
    hectares_under_cultivation: 18,
    input_cost_today: 250000,
    harvest_revenue_today: 640000,
  }, formatCurrencyNGN), [
    ['Active Plots', 4, 'emerald'],
    ['Hectares Cultivated', 18, 'lime'],
    ['Input Cost Today', formatCurrencyNGN(250000), 'amber'],
    ['Harvest Revenue', formatCurrencyNGN(640000), 'sky'],
  ]);

  assert.deepEqual(buildFarmFieldPulseMetrics({
    harvest_today: 12,
    losses_today: 2,
  }), [
    { label: 'Harvest Today', value: 12, tone: 'emerald' },
    { label: 'Losses Today', value: 2, tone: 'rose' },
  ]);

  assert.deepEqual(
    buildFarmDeskMetrics(
      { harvest_revenue_today: 640000 },
      [{}, {}],
      [{ status: 'planned' }, { status: 'harvested' }],
      [{ cost: 15000 }, { cost: 5000 }],
      [{ loss_quantity: 2 }, { loss_quantity: 0 }],
      formatCurrencyNGN,
    )[2],
    {
      label: 'Input Spend Logged',
      value: formatCurrencyNGN(20000),
      helper: 'Captured fertilizer, chemical, seed, and field-input cost already posted to the desk.',
      tone: 'amber',
    },
  );
});

test('farm payload and option helpers normalize crop workflow forms consistently', () => {
  assert.equal(
    buildFarmCycleOptionLabel({ crop_name: 'Maize', plot: { name: 'North Plot' } }),
    'Maize | North Plot'
  );

  assert.deepEqual(buildFarmPlotPayload({
    name: 'North Plot',
    location: 'Kaduna',
    size_hectares: '12.5',
    soil_type: 'Loam',
  }), {
    name: 'North Plot',
    location: 'Kaduna',
    size_hectares: 12.5,
    soil_type: 'Loam',
  });

  assert.deepEqual(buildFarmCyclePayload({
    plot_id: '7',
    crop_name: 'Rice',
    season_name: 'Wet',
    planting_date: '2026-05-01',
    expected_harvest_date: '2026-09-01',
    planted_area_hectares: '8',
    status: 'planted',
  }), {
    plot_id: 7,
    crop_name: 'Rice',
    season_name: 'Wet',
    planting_date: '2026-05-01',
    expected_harvest_date: '2026-09-01',
    planted_area_hectares: 8,
    status: 'planted',
  });

  assert.deepEqual(buildFarmInputPayload({
    planting_cycle_id: '4',
    input_type: 'fertilizer',
    input_name: 'NPK',
    quantity: '12',
    unit: 'kg',
    cost: '15000',
    applied_on: '2026-05-10',
  }), {
    planting_cycle_id: 4,
    input_type: 'fertilizer',
    input_name: 'NPK',
    quantity: 12,
    unit: 'kg',
    cost: 15000,
    applied_on: '2026-05-10',
  });

  assert.deepEqual(buildFarmHarvestPayload({
    planting_cycle_id: '4',
    quantity_harvested: '220',
    unit: 'kg',
    estimated_revenue: '180000',
    loss_quantity: '9',
    harvested_on: '2026-08-20',
  }), {
    planting_cycle_id: 4,
    quantity_harvested: 220,
    unit: 'kg',
    estimated_revenue: 180000,
    loss_quantity: 9,
    harvested_on: '2026-08-20',
  });
});

test('farm presenters and filters keep the stronger desk readable', () => {
  assert.deepEqual(buildFarmPlotCard({
    id: 1,
    name: 'North Plot',
    location: 'Kaduna',
    size_hectares: 12.5,
    soil_type: 'Loam',
  }), {
    id: 1,
    title: 'North Plot',
    meta: 'Kaduna | 12.5 ha | Loam',
  });

  assert.deepEqual(buildFarmCycleCard({
    id: 2,
    crop_name: 'Maize',
    plot: { name: 'North Plot' },
    season_name: 'Wet',
    status: 'growing',
    planting_date: '2026-05-01',
    expected_harvest_date: '2026-09-01',
  }), {
    id: 2,
    title: 'Maize',
    meta: 'North Plot | Wet | growing',
    dateLabel: '2026-05-01 to 2026-09-01',
  });

  assert.deepEqual(buildFarmHarvestCard({
    id: 3,
    planting_cycle: {
      crop_name: 'Rice',
      plot: { name: 'South Plot' },
    },
    quantity_harvested: 220,
    unit: 'kg',
    estimated_revenue: 180000,
    loss_quantity: 9,
  }, formatCurrencyNGN), {
    id: 3,
    title: 'Rice',
    meta: 'South Plot | 220.0 kg',
    revenueLabel: formatCurrencyNGN(180000),
    lossLabel: '9.0 lost',
  });

  assert.deepEqual(
    filterFarmPlots(
      [
        { id: 1, name: 'North Plot', location: 'Kaduna' },
        { id: 2, name: 'South Plot', location: 'Kano' },
      ],
      'kano',
    ).map((item) => item.id),
    [2],
  );

  assert.deepEqual(
    filterFarmCycles(
      [
        { id: 4, crop_name: 'Maize', season_name: 'Wet', status: 'planned', plot: { name: 'North' } },
        { id: 5, crop_name: 'Rice', season_name: 'Dry', status: 'growing', plot: { name: 'South' } },
      ],
      'dry',
    ).map((item) => item.id),
    [5],
  );

  assert.deepEqual(
    filterFarmHarvests(
      [
        { id: 6, planting_cycle: { crop_name: 'Maize', plot: { name: 'North' } }, harvested_on: '2026-08-20' },
        { id: 7, planting_cycle: { crop_name: 'Rice', plot: { name: 'South' } }, harvested_on: '2026-09-15' },
      ],
      'south',
    ).map((item) => item.id),
    [7],
  );
});
