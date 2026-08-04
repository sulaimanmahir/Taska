import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTextileConsignmentCard,
  buildTextileConsignmentPayload,
  buildTextileDeskMetrics,
  buildTextileExposureMetrics,
  buildTextileInvoicePayload,
  buildTextileJobCard,
  buildTextileJobCompletionPayload,
  buildTextileMeasurementPayload,
  buildTextileOverviewMetrics,
  buildTextileStyleOrderCard,
  buildTextileStyleOrderPayload,
  buildTextileVariantPayload,
  createTextileConsignmentForm,
  createTextileInvoiceForm,
  createTextileMeasurementForm,
  createTextileStyleForm,
  createTextileVariantForm,
  filterTextileConsignments,
  filterTextileJobs,
  filterTextileStyleOrders,
  getTextileTailorQueue,
} from '../src/lib/textile.js';
import { formatCurrencyNGN } from '../src/lib/financeFormatters.js';

test('textile form factories keep tailoring defaults stable', () => {
  assert.deepEqual(createTextileMeasurementForm(), {
    customer_id: '',
    measurement_profile: '',
    chest: '',
    waist: '',
    hip: '',
    shoulder: '',
    sleeve: '',
    length: '',
  });
  assert.deepEqual(createTextileVariantForm(), {
    product_id: '',
    color_name: '',
    shade_code: '',
    unit_type: 'yard',
    available_quantity: '',
    retail_price: '',
    wholesale_price: '',
  });
  assert.deepEqual(createTextileStyleForm(), {
    customer_id: '',
    measurement_id: '',
    variant_id: '',
    style_name: '',
    garment_type: '',
    fabric_quantity: '',
    fabric_unit: 'yard',
    labour_charge: '',
    due_date: '',
    assigned_tailor: '',
  });
  assert.deepEqual(createTextileConsignmentForm(), {
    product_id: '',
    variant_id: '',
    partner_name: '',
    quantity_sent: '',
    settlement_due: '',
    sent_date: '',
  });
  assert.deepEqual(createTextileInvoiceForm(), {
    customer_id: '',
    style_order_id: '',
    quantity: '',
    rate: '',
    amount_paid: '',
    unit_type: 'yard',
  });
});

test('textile overview and exposure helpers keep command cards readable', () => {
  const metrics = buildTextileOverviewMetrics({
    active_jobs: 7,
    overdue_jobs: 2,
    consignment_open: 4,
    debtor_exposure: 96000,
  }, formatCurrencyNGN);
  const loadingMetrics = buildTextileOverviewMetrics({}, formatCurrencyNGN, true);
  const exposureMetrics = buildTextileExposureMetrics();
  const deskMetrics = buildTextileDeskMetrics(
    { debtor_exposure: 96000 },
    [{ stage: 'cutting', assigned_tailor: 'Aisha' }, { stage: 'completed', assigned_tailor: '' }],
    [{ status: 'pending' }, { status: 'collected' }],
    [{ settlement_due: 4000 }, { settlement_due: 0 }],
    [{ available_quantity: 3 }, { available_quantity: 8 }],
    formatCurrencyNGN,
  );

  assert.deepEqual(metrics[0], {
    label: 'Active Jobs',
    value: 7,
    tone: 'fuchsia',
  });
  assert.equal(metrics[3].value, formatCurrencyNGN(96000));
  assert.equal(loadingMetrics[1].value, '...');
  assert.equal(exposureMetrics[0].value, 'Margin leaks');
  assert.equal(exposureMetrics[1].tone, 'amber');
  assert.deepEqual(deskMetrics[3], {
    label: 'Receivable Risk',
    value: formatCurrencyNGN(96000),
    helper: 'Open customer balances still waiting for invoice recovery or delivery closeout.',
    tone: 'rose',
  });
});

test('textile payload helpers normalize measurement, stock, and invoice flows', () => {
  assert.deepEqual(buildTextileMeasurementPayload({
    customer_id: '5',
    measurement_profile: 'Kaftan Regular',
    chest: '42',
    waist: '',
    hip: '44',
    shoulder: '',
    sleeve: '25',
    length: '60',
  }), {
    customer_id: '5',
    measurement_profile: 'Kaftan Regular',
    chest: 42,
    waist: null,
    hip: 44,
    shoulder: null,
    sleeve: 25,
    length: 60,
  });

  assert.deepEqual(buildTextileVariantPayload({
    product_id: '2',
    color_name: 'Royal Blue',
    shade_code: 'RB-12',
    unit_type: 'yard',
    available_quantity: '24.5',
    retail_price: '6500',
    wholesale_price: '',
  }), {
    product_id: '2',
    color_name: 'Royal Blue',
    shade_code: 'RB-12',
    unit_type: 'yard',
    available_quantity: 24.5,
    retail_price: 6500,
    wholesale_price: 0,
  });

  assert.deepEqual(buildTextileStyleOrderPayload({
    customer_id: '3',
    measurement_id: '',
    variant_id: '9',
    style_name: 'Senator wear',
    garment_type: 'Kaftan',
    fabric_quantity: '4.5',
    fabric_unit: 'yard',
    labour_charge: '18000',
    due_date: '2026-05-31',
    assigned_tailor: 'Hauwa',
  }), {
    customer_id: '3',
    measurement_id: null,
    variant_id: '9',
    style_name: 'Senator wear',
    garment_type: 'Kaftan',
    fabric_quantity: 4.5,
    fabric_unit: 'yard',
    labour_charge: 18000,
    due_date: '2026-05-31',
    assigned_tailor: 'Hauwa',
  });

  assert.deepEqual(buildTextileConsignmentPayload({
    product_id: '4',
    variant_id: '',
    partner_name: 'Aisha Fabrics',
    quantity_sent: '8',
    settlement_due: '42000',
    sent_date: '2026-05-25',
  }), {
    product_id: '4',
    variant_id: null,
    partner_name: 'Aisha Fabrics',
    quantity_sent: 8,
    settlement_due: 42000,
    sent_date: '2026-05-25',
  });

  assert.deepEqual(buildTextileInvoicePayload({
    customer_id: '11',
    style_order_id: '',
    quantity: '6',
    rate: '7000',
    amount_paid: '15000',
    unit_type: 'yard',
  }), {
    customer_id: '11',
    style_order_id: null,
    quantity: 6,
    rate: 7000,
    amount_paid: 15000,
    unit_type: 'yard',
  });
});

test('textile queue and presentation helpers keep tailoring watchlists consistent', () => {
  const queue = getTextileTailorQueue([
    { id: 1, stage: 'cutting' },
    { id: 2, stage: 'completed' },
    { id: 3, stage: 'sewing' },
  ]);

  assert.deepEqual(queue.map((job) => job.id), [1, 3]);
  assert.deepEqual(buildTextileJobCompletionPayload(), { stage: 'completed' });
  assert.deepEqual(buildTextileJobCard({
    id: 4,
    stage: 'finishing',
    assigned_tailor: '',
    style_order: {
      style_name: 'Agbada',
      customer: { name: 'Musa Bello' },
      due_date: '2026-05-31',
    },
  }), {
    id: 4,
    customerLabel: 'Musa Bello',
    meta: 'Agbada | finishing | Unassigned',
    stageLabel: 'finishing',
    tailorLabel: 'Unassigned',
    dueLabel: '2026-05-31',
  });

  assert.deepEqual(buildTextileStyleOrderCard({
    id: 6,
    style_name: 'Bride gown',
    customer: { name: 'Amina' },
    fabric_quantity: 8,
    fabric_unit: 'yard',
    status: 'in_progress',
    garment_type: 'Gown',
    assigned_tailor: 'Ngozi',
    due_date: '2026-06-03',
    total_amount: 95000,
  }, formatCurrencyNGN), {
    id: 6,
    title: 'Bride gown',
    meta: 'Amina | 8 yard | in_progress',
    totalAmountLabel: formatCurrencyNGN(95000),
    garmentLabel: 'Gown',
    tailorLabel: 'Ngozi',
    dueLabel: '2026-06-03',
  });

  assert.deepEqual(buildTextileConsignmentCard({
    id: 9,
    partner_name: 'City Boutique',
    quantity_sent: 12,
    settlement_due: 83000,
    product: { name: 'Lace Deluxe' },
    variant: { color_name: 'Emerald' },
  }, formatCurrencyNGN), {
    id: 9,
    partnerLabel: 'City Boutique',
    meta: `12 sent | settlement ${formatCurrencyNGN(83000)}`,
    productLabel: 'Lace Deluxe',
    variantLabel: 'Emerald',
  });
});

test('textile desk filters keep live search surfaces stable', () => {
  assert.deepEqual(
    filterTextileStyleOrders(
      [
        { id: 1, style_name: 'Agbada', customer: { name: 'Musa' }, status: 'pending' },
        { id: 2, style_name: 'Gown', customer: { name: 'Amina' }, status: 'completed' },
      ],
      'amina',
    ).map((item) => item.id),
    [2],
  );

  assert.deepEqual(
    filterTextileJobs(
      [
        { id: 3, stage: 'cutting', assigned_tailor: 'Ngozi', style_order: { style_name: 'Kaftan', customer: { name: 'Musa' } } },
        { id: 4, stage: 'finishing', assigned_tailor: 'Hauwa', style_order: { style_name: 'Gown', customer: { name: 'Amina' } } },
      ],
      'hauwa',
    ).map((item) => item.id),
    [4],
  );

  assert.deepEqual(
    filterTextileConsignments(
      [
        { id: 5, partner_name: 'City Boutique', product: { name: 'Lace' } },
        { id: 6, partner_name: 'Royal Wardrobe', variant: { color_name: 'Wine' } },
      ],
      'wine',
    ).map((item) => item.id),
    [6],
  );
});
