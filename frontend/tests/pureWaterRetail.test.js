import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPureWaterRetailCrateLedgerCard,
  buildPureWaterRetailCratePayload,
  buildPureWaterRetailDeskMetrics,
  buildPureWaterRetailMovementCard,
  buildPureWaterRetailMovementPayload,
  buildPureWaterRetailMovementReset,
  buildPureWaterRetailOverviewMetrics,
  buildPureWaterRetailOwnerBoardCards,
  buildPureWaterRetailPriceTierPayload,
  buildPureWaterRetailSalePayload,
  buildPureWaterRetailSaleReset,
  buildPureWaterRetailTransferPayload,
  createPureWaterRetailCrateForm,
  createPureWaterRetailMovementForm,
  createPureWaterRetailPriceTierForm,
  createPureWaterRetailSaleForm,
  createPureWaterRetailTransferForm,
  filterPureWaterRetailCrateLedger,
  filterPureWaterRetailMovements,
  getPureWaterRetailPredictedRevenue,
  getPureWaterRetailSelectedProduct,
  pureWaterRetailPackageTypes,
} from '../src/lib/pureWaterRetail.js';
import { formatCurrencyNGN } from '../src/lib/financeFormatters.js';

test('pure water retail package types and form factories return stable defaults', () => {
  assert.deepEqual(pureWaterRetailPackageTypes, ['sachet', 'bag', 'bottle', 'crate', 'pack']);
  assert.deepEqual(createPureWaterRetailPriceTierForm(), {
    customer_id: '',
    product_id: '',
    pricing_scope: 'wholesale',
    package_type: 'bag',
    minimum_quantity: '10',
    unit_price: '',
    crate_deposit: '0',
  });
  assert.deepEqual(createPureWaterRetailSaleForm(), {
    customer_id: '',
    warehouse_id: '',
    sales_channel: 'retail',
    delivery_mode: 'counter',
    product_id: '',
    quantity: '',
    package_type: 'bag',
    units_per_package: '20',
    paid: '',
    payment_method: 'cash',
    notes: '',
  });
  assert.deepEqual(createPureWaterRetailMovementForm(), {
    warehouse_id: '',
    product_id: '',
    movement_type: 'restock',
    package_type: 'bag',
    quantity: '',
    units_per_package: '20',
    notes: '',
  });
  assert.deepEqual(createPureWaterRetailCrateForm(), {
    customer_id: '',
    product_id: '',
    movement_type: 'issue',
    crate_count: '',
    deposit_amount: '',
    notes: '',
  });
  assert.deepEqual(createPureWaterRetailTransferForm(), {
    from_warehouse_id: '',
    to_warehouse_id: '',
    product_id: '',
    package_type: 'bag',
    quantity: '',
    units_per_package: '20',
    notes: '',
  });
});

test('pure water retail metrics and owner board helpers keep command cards aligned', () => {
  const overviewMetrics = buildPureWaterRetailOverviewMetrics({
    revenue_today: 420000,
    packages_sold_today: 180,
    crates_outstanding: 24,
    customer_debt: 95000,
  }, formatCurrencyNGN);
  const ownerCards = buildPureWaterRetailOwnerBoardCards({
    wholesale_revenue_today: 260000,
    retail_revenue_today: 160000,
    low_stock_products: 3,
    transfers_out_today: 7,
  }, formatCurrencyNGN);

  assert.deepEqual(overviewMetrics[0], {
    label: 'Revenue Today',
    value: formatCurrencyNGN(420000),
    tone: 'sky',
  });
  assert.equal(overviewMetrics[2].value, 24);
  assert.deepEqual(ownerCards[1], {
    label: 'Owner Watchlist',
    value: 3,
    helper: 'Transfers out today: 7.',
    tone: 'amber',
  });
});

test('pure water retail desk metrics summarize movement and crate pressure', () => {
  const metrics = buildPureWaterRetailDeskMetrics({
    summary: { transfers_out_today: 5 },
    package_movements: [
      { movement_type: 'restock' },
      { movement_type: 'wastage' },
      { movement_type: 'restock' },
    ],
    crate_ledgers: [
      { deposit_amount: 5000 },
      { deposit_amount: 2500 },
    ],
  }, formatCurrencyNGN);

  assert.equal(metrics.length, 6);
  assert.deepEqual(metrics[0], { label: 'Package Movements', value: 3, tone: 'sky' });
  assert.equal(metrics[1].value, 2);
  assert.equal(metrics[2].value, 1);
  assert.equal(metrics[4].value, formatCurrencyNGN(7500));
  assert.equal(metrics[5].value, 5);
});

test('pure water retail revenue helper prefers matching price tiers before product price fallback', () => {
  const products = [
    { id: 5, selling_price: 4500 },
    { id: 9, selling_price: 7000 },
  ];
  const selectedProduct = getPureWaterRetailSelectedProduct(products, '5');

  assert.equal(selectedProduct.id, 5);
  assert.equal(
    getPureWaterRetailPredictedRevenue([
      {
        product_id: 5,
        package_type: 'bag',
        pricing_scope: 'retail',
        minimum_quantity: 4,
        unit_price: 3800,
        customer_id: null,
      },
    ], {
      product_id: '5',
      package_type: 'bag',
      sales_channel: 'retail',
      quantity: '6',
      customer_id: '',
    }, selectedProduct),
    22800,
  );

  assert.equal(
    getPureWaterRetailPredictedRevenue([], {
      product_id: '9',
      package_type: 'crate',
      sales_channel: 'wholesale',
      quantity: '3',
      customer_id: '',
    }, getPureWaterRetailSelectedProduct(products, '9')),
    21000,
  );
});

test('pure water retail payload and reset helpers normalize outlet operations forms', () => {
  assert.deepEqual(buildPureWaterRetailPriceTierPayload({
    customer_id: '',
    product_id: '8',
    pricing_scope: 'wholesale',
    package_type: 'crate',
    minimum_quantity: '12',
    unit_price: '5200',
    crate_deposit: '1500',
  }), {
    customer_id: null,
    product_id: 8,
    pricing_scope: 'wholesale',
    package_type: 'crate',
    minimum_quantity: 12,
    unit_price: 5200,
    crate_deposit: 1500,
  });

  assert.deepEqual(buildPureWaterRetailSalePayload({
    customer_id: '',
    warehouse_id: '4',
    sales_channel: 'retail',
    delivery_mode: 'dispatch',
    product_id: '3',
    quantity: '20',
    package_type: 'bag',
    units_per_package: '20',
    paid: '48000',
    payment_method: 'transfer',
    notes: '',
  }), {
    customer_id: null,
    warehouse_id: '4',
    sales_channel: 'retail',
    delivery_mode: 'dispatch',
    items: [{
      product_id: 3,
      quantity: 20,
      package_type: 'bag',
      units_per_package: 20,
    }],
    paid: 48000,
    payment_method: 'transfer',
    notes: null,
  });

  assert.deepEqual(buildPureWaterRetailMovementPayload({
    warehouse_id: '',
    product_id: '7',
    movement_type: 'wastage',
    package_type: 'sachet',
    quantity: '5',
    units_per_package: '30',
    notes: 'Burst bags',
  }), {
    warehouse_id: null,
    product_id: 7,
    movement_type: 'wastage',
    package_type: 'sachet',
    quantity: 5,
    units_per_package: 30,
    notes: 'Burst bags',
  });

  assert.deepEqual(buildPureWaterRetailCratePayload({
    customer_id: '11',
    product_id: '',
    movement_type: 'return',
    crate_count: '6',
    deposit_amount: '9000',
    notes: '',
  }), {
    customer_id: '11',
    product_id: null,
    movement_type: 'return',
    crate_count: 6,
    deposit_amount: 9000,
    notes: null,
  });

  assert.deepEqual(buildPureWaterRetailTransferPayload({
    from_warehouse_id: '1',
    to_warehouse_id: '2',
    product_id: '7',
    package_type: 'pack',
    quantity: '15',
    units_per_package: '12',
    notes: 'Restock outlet',
  }), {
    from_warehouse_id: 1,
    to_warehouse_id: 2,
    product_id: 7,
    package_type: 'pack',
    quantity: 15,
    units_per_package: 12,
    notes: 'Restock outlet',
  });

  assert.deepEqual(buildPureWaterRetailSaleReset({
    customer_id: '3',
    warehouse_id: '2',
    sales_channel: 'retail',
    delivery_mode: 'counter',
    product_id: '6',
    quantity: '5',
    package_type: 'bag',
    units_per_package: '20',
    paid: '15000',
    payment_method: 'cash',
    notes: 'Repeat buyer',
  }), {
    customer_id: '',
    warehouse_id: '2',
    sales_channel: 'retail',
    delivery_mode: 'counter',
    product_id: '',
    quantity: '',
    package_type: 'bag',
    units_per_package: '20',
    paid: '',
    payment_method: 'cash',
    notes: '',
  });

  assert.deepEqual(buildPureWaterRetailMovementReset({
    warehouse_id: '2',
    product_id: '7',
    movement_type: 'restock',
    package_type: 'bag',
    quantity: '15',
    units_per_package: '20',
    notes: 'Top up',
  }), {
    warehouse_id: '2',
    product_id: '',
    movement_type: 'restock',
    package_type: 'bag',
    quantity: '',
    units_per_package: '20',
    notes: '',
  });
});

test('pure water retail presenter helpers keep live board cards readable', () => {
  assert.deepEqual(buildPureWaterRetailMovementCard({
    id: 4,
    product: { name: 'Bottle Water 75cl', selling_price: 2500 },
    movement_type: 'restock',
    package_type: 'crate',
    quantity: 12,
    warehouse: { name: 'Wuse Outlet' },
    notes: 'Morning top-up',
  }, formatCurrencyNGN), {
    id: 4,
    title: 'Bottle Water 75cl',
    meta: 'restock | crate | 12',
    locationLabel: 'Wuse Outlet',
    noteLabel: 'Morning top-up',
    valueLabel: formatCurrencyNGN(30000),
  });

  assert.deepEqual(buildPureWaterRetailCrateLedgerCard({
    id: 9,
    customer: { name: 'Musa Ventures' },
    movement_type: 'issue',
    crate_count: 8,
    balance_after: 14,
    deposit_amount: 12000,
  }, formatCurrencyNGN), {
    id: 9,
    title: 'Musa Ventures',
    meta: 'issue | 8 crates',
    balanceLabel: 'Balance after: 14',
    depositLabel: formatCurrencyNGN(12000),
  });
});

test('pure water retail filters keep movement and crate searches stable', () => {
  const movements = [
    { id: 1, product: { name: 'Sachet Water' }, movement_type: 'restock', package_type: 'bag', warehouse: { name: 'Kubwa Outlet' }, notes: 'Truck delivery' },
    { id: 2, product: { name: 'Bottle Water' }, movement_type: 'wastage', package_type: 'crate', warehouse: { name: 'Wuse Outlet' }, notes: 'Burst seal' },
  ];
  const ledger = [
    { id: 1, customer: { name: 'Musa Ventures' }, movement_type: 'issue', notes: 'Weekend event', product: { name: 'Bottle Water' } },
    { id: 2, customer: { name: 'Aisha Stores' }, movement_type: 'return', notes: 'Returned empties', product: { name: 'Sachet Water' } },
  ];

  assert.deepEqual(filterPureWaterRetailMovements(movements, 'wuse'), [movements[1]]);
  assert.deepEqual(filterPureWaterRetailMovements(movements, 'truck'), [movements[0]]);
  assert.deepEqual(filterPureWaterRetailCrateLedger(ledger, 'musa'), [ledger[0]]);
  assert.deepEqual(filterPureWaterRetailCrateLedger(ledger, 'return'), [ledger[1]]);
});
