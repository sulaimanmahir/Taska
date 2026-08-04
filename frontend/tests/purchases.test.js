import test from 'node:test';
import assert from 'node:assert/strict';

import {
  appendPurchaseLine,
  buildPurchaseCard,
  buildPurchaseOverviewMetrics,
  buildPurchasePayload,
  buildPurchasePaymentPayload,
  buildPurchaseReceivePayload,
  buildPurchaseItemCard,
  createPurchaseForm,
  createPurchaseLine,
  createPurchasePaymentDraft,
  createPurchaseReceiveDraft,
  getPurchaseOutstandingBalance,
  removePurchaseLine,
  resolvePurchaseStatusTone,
  updatePurchaseLine,
} from '../src/lib/purchases.js';
import { formatCurrencyNGN } from '../src/lib/financeFormatters.js';

test('purchase form helpers return stable defaults and line editing behavior', () => {
  assert.deepEqual(createPurchaseLine(), {
    product_id: '',
    quantity_ordered: '1',
    unit_cost: '',
  });

  assert.deepEqual(createPurchaseForm(), {
    supplier_id: '',
    warehouse_id: '',
    discount: '0',
    notes: '',
    items: [createPurchaseLine()],
  });

  assert.equal(appendPurchaseLine([]).length, 1);
  assert.equal(appendPurchaseLine([createPurchaseLine()]).length, 2);
  assert.deepEqual(updatePurchaseLine([createPurchaseLine()], 0, { product_id: '4' }), [{
    product_id: '4',
    quantity_ordered: '1',
    unit_cost: '',
  }]);
  assert.deepEqual(removePurchaseLine([createPurchaseLine()], 0), [createPurchaseLine()]);
});

test('purchase payload helpers normalize order, receive, and payment forms consistently', () => {
  assert.deepEqual(buildPurchasePayload({
    supplier_id: '2',
    warehouse_id: '7',
    discount: '500',
    notes: 'Urgent refill',
    items: [{
      product_id: '9',
      quantity_ordered: '4',
      unit_cost: '2500',
    }],
  }), {
    supplier_id: 2,
    warehouse_id: 7,
    discount: 500,
    notes: 'Urgent refill',
    items: [{
      product_id: 9,
      quantity_ordered: 4,
      unit_cost: 2500,
    }],
  });

  const purchase = {
    total: 10000,
    paid: 2500,
    items: [{
      id: 1,
      quantity_ordered: 8,
      quantity_received: 3,
    }],
  };

  assert.equal(getPurchaseOutstandingBalance(purchase), 7500);
  assert.deepEqual(createPurchaseReceiveDraft(purchase), {
    notes: '',
    items: [{
      purchase_item_id: 1,
      quantity_received: '5',
    }],
  });
  assert.deepEqual(buildPurchaseReceivePayload({
    notes: 'Received by warehouse',
    items: [{ purchase_item_id: '1', quantity_received: '2' }],
  }), {
    notes: 'Received by warehouse',
    items: [{ purchase_item_id: 1, quantity_received: 2 }],
  });
  assert.deepEqual(createPurchasePaymentDraft(purchase), {
    amount: '7500',
    payment_method: 'transfer',
    reference: '',
    notes: '',
  });
  assert.deepEqual(buildPurchasePaymentPayload({
    amount: '3000',
    payment_method: 'cash',
    reference: 'RCPT-1',
    notes: 'Part payment',
  }), {
    amount: 3000,
    payment_method: 'cash',
    reference: 'RCPT-1',
    notes: 'Part payment',
  });
});

test('purchase presentation helpers keep payables and receipt context readable', () => {
  assert.deepEqual(buildPurchaseOverviewMetrics({
    pending_count: 2,
    partial_count: 1,
    outstanding_balance: 22000,
    received_count: 4,
    total_value: 150000,
  }, formatCurrencyNGN), [
    {
      label: 'Open Purchases',
      value: '3',
      helper: 'Purchase orders still waiting for full receipt into stock.',
      tone: 'amber',
    },
    {
      label: 'Outstanding Payables',
      value: formatCurrencyNGN(22000),
      helper: 'Supplier balances still waiting to be settled.',
      tone: 'rose',
    },
    {
      label: 'Received Orders',
      value: '4',
      helper: 'Purchase orders already fully received into inventory.',
      tone: 'emerald',
    },
    {
      label: 'Purchase Value',
      value: formatCurrencyNGN(150000),
      helper: 'Committed spend across the tracked purchase ledger.',
      tone: 'violet',
    },
  ]);

  assert.equal(resolvePurchaseStatusTone('received'), 'emerald');
  assert.equal(resolvePurchaseStatusTone('partial'), 'sky');
  assert.equal(resolvePurchaseStatusTone('pending'), 'amber');

  assert.deepEqual(buildPurchaseCard({
    id: 3,
    purchase_number: 'PO-20260531-ABCD',
    supplier: { name: 'Grace Supply' },
    warehouse: { name: 'Main Warehouse' },
    total: 8000,
    paid: 3000,
    status: 'partial',
    items: [{ id: 1 }, { id: 2 }],
  }, formatCurrencyNGN), {
    id: 3,
    title: 'PO-20260531-ABCD',
    supplierLabel: 'Grace Supply',
    warehouseLabel: 'Main Warehouse',
    totalLabel: formatCurrencyNGN(8000),
    paidLabel: formatCurrencyNGN(3000),
    outstandingLabel: formatCurrencyNGN(5000),
    status: 'partial',
    statusTone: 'sky',
    itemCountLabel: '2 lines',
  });

  assert.deepEqual(buildPurchaseItemCard({
    id: 9,
    product: { name: 'Rice 50kg' },
    quantity_ordered: 12,
    quantity_received: 7,
    unit_cost: 42000,
  }, formatCurrencyNGN), {
    id: 9,
    title: 'Rice 50kg',
    quantityLabel: '7/12 received',
    amountLabel: `${formatCurrencyNGN(42000)} each`,
    remainingQuantity: 5,
  });
});
