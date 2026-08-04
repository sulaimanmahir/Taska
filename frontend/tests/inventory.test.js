import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildInventoryAdjustmentPayload,
  buildInventoryMovementRow,
  buildInventoryOverviewMetrics,
  buildInventoryRow,
  createInventoryAdjustmentForm,
  filterInventoryItems,
} from '../src/lib/inventory.js';

test('inventory adjustment helpers return API-aligned defaults and payloads', () => {
  assert.deepEqual(createInventoryAdjustmentForm(), {
    inventory_item_id: '',
    quantity: '',
    type: 'add',
    reason: 'Cycle count adjustment',
  });

  assert.deepEqual(buildInventoryAdjustmentPayload({
    inventory_item_id: '14',
    quantity: '22.5',
    type: 'set',
    reason: ' Physical count confirmed ',
  }), {
    inventory_item_id: 14,
    quantity: 22.5,
    type: 'set',
    reason: 'Physical count confirmed',
  });
});

test('inventory overview metrics summarize stock lines, reserves, and stock value', () => {
  const metrics = buildInventoryOverviewMetrics([
    {
      id: 1,
      quantity: 15,
      reserved_quantity: 2,
      reorder_point: 10,
      warehouse: { id: 5 },
      product: { cost_price: 100 },
    },
    {
      id: 2,
      quantity: 4,
      reserved_quantity: 1,
      reorder_point: 6,
      warehouse: { id: 7 },
      product: { cost_price: 200 },
    },
    {
      id: 3,
      quantity: 0,
      reserved_quantity: 0,
      reorder_point: 3,
      warehouse: { id: 7 },
      product: { cost_price: 300 },
    },
  ], (value) => `NGN ${value}`);

  assert.equal(metrics[0].value, '3');
  assert.equal(metrics[1].value, '2');
  assert.equal(metrics[2].value, '1');
  assert.equal(metrics[3].value, '3');
  assert.equal(metrics[4].value, 'NGN 2300');
  assert.equal(metrics[4].helper, '2 warehouse locations currently represented in this view.');
});

test('inventory rows expose warehouse, availability, reorder, and pricing posture cleanly', () => {
  const row = buildInventoryRow({
    id: 9,
    quantity: 6,
    reserved_quantity: 1,
    reorder_point: 8,
    warehouse: { name: 'Main Warehouse' },
    product: {
      name: 'Bottle Water',
      sku: 'BTW-09',
      category: { name: 'Finished Goods' },
      cost_price: 140,
      selling_price: 220,
    },
  }, (value) => `NGN ${value}`);

  assert.deepEqual(row, {
    id: 9,
    title: 'Bottle Water',
    skuLabel: 'BTW-09',
    categoryLabel: 'Finished Goods',
    warehouseLabel: 'Main Warehouse',
    quantityLabel: '6',
    reservedLabel: '1',
    availableLabel: '5',
    reorderPointLabel: '8',
    pricingLabel: 'NGN 140 / NGN 220',
    statusLabel: 'Low Stock',
    statusTone: 'amber',
  });
});

test('inventory filters and movement rows keep stock review context readable', () => {
  const items = [
    {
      id: 1,
      quantity: 0,
      reserved_quantity: 0,
      reorder_point: 4,
      warehouse: { name: 'Main Warehouse', code: 'MW-1' },
      product: { name: 'Sachet Water', sku: 'SWT-1', category: { name: 'Water' } },
    },
    {
      id: 2,
      quantity: 11,
      reserved_quantity: 2,
      reorder_point: 5,
      warehouse: { name: 'Branch Store', code: 'BS-1' },
      product: { name: 'Bottle Water', sku: 'BTW-1', category: { name: 'Water' } },
    },
  ];

  assert.deepEqual(filterInventoryItems(items, 'branch', 'all').map((item) => item.id), [2]);
  assert.deepEqual(filterInventoryItems(items, '', 'out').map((item) => item.id), [1]);

  assert.deepEqual(buildInventoryMovementRow({
    id: 17,
    movement_type: 'remove',
    quantity: 4,
    previous_quantity: 12,
    new_quantity: 8,
    notes: 'Damaged packs removed',
    warehouse: { name: 'Main Warehouse' },
    product: { name: 'Bottle Water', cost_price: 150 },
  }, (value) => `NGN ${value}`), {
    id: 17,
    title: 'Bottle Water',
    warehouseLabel: 'Main Warehouse',
    typeLabel: 'remove',
    quantityLabel: '4',
    beforeAfterLabel: '12 -> 8',
    valueHint: 'NGN 600',
    notesLabel: 'Damaged packs removed',
  });
});
