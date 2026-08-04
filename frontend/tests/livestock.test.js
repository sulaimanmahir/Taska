import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildLivestockBreedingPayload,
  buildLivestockDeskMetrics,
  buildLivestockDiseasePayload,
  buildLivestockGroupCard,
  buildLivestockGroupPayload,
  buildLivestockMedicationPayload,
  buildLivestockMilkPayload,
  buildLivestockOutbreakCard,
  buildLivestockOverviewMetrics,
  buildLivestockPenPayload,
  buildLivestockSaleCard,
  buildLivestockSalePayload,
  buildLivestockWeightPayload,
  createLivestockFormState,
  filterLivestockGroups,
  filterLivestockOutbreaks,
  filterLivestockSales,
} from '../src/lib/livestock.js';
import { formatCurrencyNGN } from '../src/lib/financeFormatters.js';

test('livestock quick-form state helper preserves field defaults', () => {
  assert.deepEqual(
    createLivestockFormState([
      { name: 'name' },
      { name: 'capacity', defaultValue: 0 },
      { name: 'sold_on', defaultValue: '2026-05-26' },
    ]),
    {
      name: '',
      capacity: 0,
      sold_on: '2026-05-26',
    }
  );
});

test('livestock overview metrics keep farm operations cards aligned', () => {
  const metrics = buildLivestockOverviewMetrics(
    {
      total_animals: 48,
      average_weight_kg: 212.5,
      milk_today_litres: 84.75,
      open_outbreaks: 2,
      pens: 6,
      medication_cost_today: 28000,
      sales_today: 450000,
      breeding_cycles_open: 3,
    },
    formatCurrencyNGN
  );

  assert.deepEqual(metrics[0], {
    label: 'Animals',
    value: 48,
    helper: 'Registered livestock currently tracked in the system.',
    tone: 'sky',
  });
  assert.equal(metrics[1].value, '212.50');
  assert.equal(metrics[2].value, '84.75');
  assert.equal(metrics[5].value, formatCurrencyNGN(28000));
  assert.equal(metrics[6].value, formatCurrencyNGN(450000));

  const deskMetrics = buildLivestockDeskMetrics(
    { sales_today: 450000, medication_cost_today: 28000 },
    [{ status: 'active', production_type: 'milk' }, { status: 'sold_out', production_type: 'beef' }],
    [{ severity: 'high', status: 'open' }, { severity: 'low', status: 'resolved' }],
    [{ quantity: 3 }, { quantity: 2 }],
    formatCurrencyNGN,
  );

  assert.deepEqual(deskMetrics[2], {
    label: 'Critical Alerts',
    value: 1,
    helper: 'High-severity disease alerts still needing urgent intervention.',
    tone: 'rose',
  });
});

test('livestock payload helpers normalize pen, group, sale, and daily logs consistently', () => {
  assert.deepEqual(buildLivestockPenPayload({
    name: 'North Pen A',
    section: 'Dairy Wing',
    capacity: '40',
  }), {
    name: 'North Pen A',
    section: 'Dairy Wing',
    capacity: 40,
  });

  assert.deepEqual(buildLivestockGroupPayload({
    name: 'Milking Herd 1',
    species: 'Cattle',
    breed: 'Friesian',
    animal_count: '18',
    average_weight_kg: '210',
    pen_id: '',
  }), {
    name: 'Milking Herd 1',
    species: 'Cattle',
    breed: 'Friesian',
    animal_count: 18,
    average_weight_kg: 210,
    pen_id: null,
  });

  assert.deepEqual(buildLivestockSalePayload({
    animal_group_id: '4',
    sale_type: 'slaughter_sale',
    quantity: '3',
    revenue: '450000',
    sold_on: '2026-05-26',
  }), {
    animal_group_id: 4,
    sale_type: 'slaughter_sale',
    quantity: 3,
    revenue: 450000,
    sold_on: '2026-05-26',
  });

  assert.deepEqual(buildLivestockWeightPayload({
    animal_group_id: '2',
    weight_kg: '245',
    sample_size: '',
  }), {
    animal_group_id: 2,
    weight_kg: 245,
    sample_size: 1,
  });

  assert.deepEqual(buildLivestockMilkPayload({
    animal_group_id: '2',
    litres: '85',
    recorded_on: '2026-05-26',
  }), {
    animal_group_id: 2,
    litres: 85,
    recorded_on: '2026-05-26',
  });

  assert.deepEqual(buildLivestockDiseasePayload({
    animal_group_id: '',
    disease_name: 'Foot and Mouth',
    affected_count: '6',
    recorded_on: '2026-05-26',
  }), {
    animal_group_id: null,
    disease_name: 'Foot and Mouth',
    affected_count: 6,
    recorded_on: '2026-05-26',
  });
});

test('livestock breeding and medication payload helpers keep optional values aligned', () => {
  assert.deepEqual(buildLivestockBreedingPayload({
    animal_group_id: '7',
    cycle_name: 'Cycle Q2',
    paired_count: '8',
    successful_births: '6',
    expected_delivery_date: '',
  }), {
    animal_group_id: 7,
    cycle_name: 'Cycle Q2',
    paired_count: 8,
    successful_births: 6,
    expected_delivery_date: null,
  });

  assert.deepEqual(buildLivestockMedicationPayload({
    animal_group_id: '',
    medication_name: 'Oxytetracycline',
    treated_count: '12',
    cost: '28000',
    administered_on: '2026-05-26',
  }), {
    animal_group_id: null,
    medication_name: 'Oxytetracycline',
    treated_count: 12,
    cost: 28000,
    administered_on: '2026-05-26',
  });
});

test('livestock presenter helpers keep group, outbreak, and sale cards readable', () => {
  assert.deepEqual(buildLivestockGroupCard({
    id: 3,
    name: 'Milking Herd 1',
    species: 'Cattle',
    breed: 'Friesian',
    status: 'active',
    animal_count: 18,
    average_weight_kg: 210,
    production_type: 'milk',
    pen: { name: 'North Pen A' },
  }), {
    id: 3,
    title: 'Milking Herd 1',
    speciesLabel: 'Cattle | Friesian',
    status: 'active',
    countLabel: 18,
    weightLabel: '210 kg',
    penLabel: 'North Pen A',
    productionLabel: 'milk',
  });

  assert.deepEqual(buildLivestockOutbreakCard({
    id: 5,
    disease_name: 'Foot and Mouth',
    severity: 'high',
    affected_count: 6,
    status: 'open',
    animal_group: { name: 'Milking Herd 1' },
  }), {
    id: 5,
    title: 'Foot and Mouth',
    detailLabel: 'Severity: high | Affected: 6 | Status: open',
    groupLabel: 'Milking Herd 1',
  });

  assert.deepEqual(buildLivestockSaleCard({
    id: 6,
    sale_type: 'slaughter_sale',
    quantity: 3,
    revenue: 450000,
    animal_group: { name: 'Milking Herd 1' },
  }, formatCurrencyNGN), {
    id: 6,
    title: 'slaughter_sale',
    detailLabel: `Quantity: 3 | Revenue: ${formatCurrencyNGN(450000)}`,
    groupLabel: 'Milking Herd 1',
  });
});

test('livestock filters keep stronger live search surfaces stable', () => {
  assert.deepEqual(
    filterLivestockGroups(
      [
        { id: 1, name: 'Milking Herd 1', species: 'Cattle', breed: 'Friesian' },
        { id: 2, name: 'Broiler Batch', species: 'Poultry', breed: 'Broiler' },
      ],
      'friesian',
    ).map((item) => item.id),
    [1],
  );

  assert.deepEqual(
    filterLivestockOutbreaks(
      [
        { id: 3, disease_name: 'Foot and Mouth', severity: 'high', status: 'open' },
        { id: 4, disease_name: 'Coccidiosis', severity: 'low', status: 'resolved' },
      ],
      'resolved',
    ).map((item) => item.id),
    [4],
  );

  assert.deepEqual(
    filterLivestockSales(
      [
        { id: 5, sale_type: 'slaughter_sale', sold_on: '2026-05-26', customer_name: 'Abattoir One' },
        { id: 6, sale_type: 'live_sale', sold_on: '2026-05-27', customer_name: 'Market Buyer' },
      ],
      'market',
    ).map((item) => item.id),
    [6],
  );
});
