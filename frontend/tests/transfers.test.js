import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTransferMovementCard,
  buildTransferOverviewMetrics,
  buildTransferWarehouseCard,
} from '../src/lib/transfers.js';

test('transfer overview metrics summarize warehouse coverage and movement readiness', () => {
  const metrics = buildTransferOverviewMetrics({
    warehouses: [
      { id: 1, name: 'Main', is_active: true, is_default: true },
      { id: 2, name: 'Annex', is_active: true, is_default: false },
    ],
    inventoryItems: [
      { warehouse_id: 1, quantity: 5, reorder_point: 8 },
      { warehouse_id: 1, quantity: 12, reorder_point: 5 },
      { warehouse_id: 2, quantity: 9, reorder_point: 3 },
    ],
    movements: [{ id: 1 }, { id: 2 }, { id: 3 }],
  });

  assert.equal(metrics[0].value, 2);
  assert.equal(metrics[1].value, 2);
  assert.equal(metrics[2].value, 1);
  assert.equal(metrics[3].value, 3);
  assert.equal(metrics[4].value, 'Main');
});

test('transfer warehouse cards expose stock pressure per location', () => {
  const card = buildTransferWarehouseCard(
    { id: 8, name: 'North Hub', branch: { name: 'Branch A' }, is_active: true, is_default: false },
    [
      { warehouse_id: 8, quantity: 2, reorder_point: 5 },
      { warehouse_id: 8, quantity: 7, reorder_point: 3 },
    ]
  );

  assert.equal(card.title, 'North Hub');
  assert.equal(card.branchLabel, 'Branch A');
  assert.equal(card.statusLabel, 'Active');
  assert.equal(card.trackedSkus, 2);
  assert.equal(card.totalUnits, 9);
  assert.equal(card.lowStockCount, 1);
});

test('transfer movement cards keep movement context readable', () => {
  const card = buildTransferMovementCard({
    id: 11,
    product: { name: 'Sachet Water' },
    warehouse: { name: 'Central Depot' },
    movement_type: 'transfer_out',
    quantity: 48,
    notes: 'Redistributed to outlet',
  });

  assert.equal(card.title, 'Sachet Water');
  assert.equal(card.warehouseLabel, 'Central Depot');
  assert.equal(card.movementTypeLabel, 'transfer out');
  assert.equal(card.quantityLabel, 48);
  assert.equal(card.notesLabel, 'Redistributed to outlet');
});
