import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildInventorySummaryByProduct,
  buildProductOverviewMetrics,
  buildProductPayload,
  buildProductRow,
  createProductForm,
} from '../src/lib/products.js';

test('product form helpers return API-aligned defaults and payloads', () => {
  assert.deepEqual(createProductForm(), {
    name: '',
    sku: '',
    category_id: '',
    cost_price: '',
    selling_price: '',
    low_stock_alert: '10',
    track_inventory: 'yes',
    product_type: 'good',
  });

  assert.deepEqual(buildProductPayload({
    name: ' Sachet Water ',
    sku: ' SWT-01 ',
    category_id: '3',
    cost_price: '120',
    selling_price: '180',
    low_stock_alert: '15',
    track_inventory: 'yes',
    product_type: 'good',
  }), {
    name: 'Sachet Water',
    sku: 'SWT-01',
    category_id: 3,
    cost_price: 120,
    selling_price: 180,
    low_stock_alert: 15,
    track_inventory: 'yes',
    product_type: 'good',
  });
});

test('inventory summary groups quantity, reserves, locations, and stock value by product', () => {
  const summary = buildInventorySummaryByProduct([
    {
      product_id: 1,
      quantity: 12,
      reserved_quantity: 2,
      reorder_point: 5,
      product: { cost_price: 100 },
    },
    {
      product_id: 1,
      quantity: 8,
      reserved_quantity: 1,
      reorder_point: 3,
      product: { cost_price: 100 },
    },
    {
      product_id: 2,
      quantity: 4,
      reserved_quantity: 0,
      reorder_point: 2,
      product: { cost_price: 250 },
    },
  ]);

  assert.deepEqual(summary, {
    1: {
      quantity: 20,
      reservedQuantity: 3,
      reorderPoint: 8,
      warehouseCount: 2,
      stockValue: 2000,
    },
    2: {
      quantity: 4,
      reservedQuantity: 0,
      reorderPoint: 2,
      warehouseCount: 1,
      stockValue: 1000,
    },
  });
});

test('product overview metrics summarize catalog size, low-stock pressure, and stock value', () => {
  const metrics = buildProductOverviewMetrics({
    products: [
      {
        id: 1,
        name: 'Sachet Water',
        is_active: true,
        track_inventory: 'yes',
        created_at: '2026-06-03T10:00:00.000000Z',
      },
      {
        id: 2,
        name: 'Bottle Water',
        is_active: false,
        track_inventory: 'no',
        created_at: '2026-06-01T10:00:00.000000Z',
      },
    ],
    totalProducts: 26,
    lowStockTotal: 4,
    inventorySummary: {
      1: { stockValue: 3000 },
      2: { stockValue: 2000 },
    },
  }, (value) => `NGN ${value}`);

  assert.equal(metrics[0].value, '26');
  assert.equal(metrics[1].value, '1');
  assert.equal(metrics[2].value, '1');
  assert.equal(metrics[3].value, '4');
  assert.equal(metrics[4].value, 'NGN 5000');
  assert.equal(metrics[4].helper, 'Latest catalog item: Sachet Water.');
});

test('product rows expose category, inventory, stock, and price posture cleanly', () => {
  const row = buildProductRow({
    id: 7,
    name: 'Bottle Water',
    sku: 'BTW-02',
    category: { name: 'Finished Goods' },
    product_type: 'good',
    track_inventory: 'yes',
    cost_price: 150,
    selling_price: 250,
    low_stock_alert: 10,
    is_active: false,
  }, {
    7: {
      quantity: 9,
      reservedQuantity: 2,
      reorderPoint: 10,
      warehouseCount: 2,
    },
  }, (value) => `NGN ${value}`);

  assert.deepEqual(row, {
    id: 7,
    title: 'Bottle Water',
    skuLabel: 'BTW-02',
    categoryLabel: 'Finished Goods',
    typeLabel: 'good',
    trackInventoryLabel: 'Tracked',
    stockLabel: '9 on hand',
    stockHelper: '7 available across 2 locations',
    pricingLabel: 'NGN 150 / NGN 250',
    statusLabel: 'Inactive',
    stockTone: 'amber',
  });
});

test('product rows respect explicit stock status from product resources', () => {
  const lowStockRow = buildProductRow({
    id: 8,
    name: 'Low Stock Item',
    stock_status: 'low_stock',
    available_quantity: 3,
    track_inventory: 'yes',
  }, {}, (value) => `NGN ${value}`);

  const outOfStockRow = buildProductRow({
    id: 9,
    name: 'Out of Stock Item',
    stock_status: 'out_of_stock',
    available_quantity: 0,
    track_inventory: 'yes',
  }, {}, (value) => `NGN ${value}`);

  assert.equal(lowStockRow.stockLabel, 'Low stock');
  assert.equal(lowStockRow.stockTone, 'amber');
  assert.equal(outOfStockRow.stockLabel, 'Out of stock');
  assert.equal(outOfStockRow.stockTone, 'rose');
});
