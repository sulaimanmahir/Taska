import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInventoryAdjustmentPayload, validateInventoryAdjustmentPayload } from './inventory.js';

test('validateInventoryAdjustmentPayload rejects negative and empty values', () => {
  const invalid = validateInventoryAdjustmentPayload({
    inventory_item_id: '',
    quantity: -1,
    type: 'remove',
    reason: ' ',
  });

  assert.equal(invalid.isValid, false);
  assert.equal(invalid.error, 'Quantity must be greater than or equal to 0.');

  const validPayload = validateInventoryAdjustmentPayload(
    buildInventoryAdjustmentPayload({ inventory_item_id: '4', quantity: '3', type: 'add', reason: 'Restock' })
  );

  assert.equal(validPayload.isValid, true);
});
