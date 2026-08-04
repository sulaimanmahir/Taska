import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addRetailCartItem,
  buildRetailDeskMetrics,
  buildRetailLoyaltyCard,
  buildRetailLoyaltyOptionLabel,
  buildRetailOverviewMetrics,
  buildRetailRecentOrderPresentation,
  buildRetailSalePayload,
  calculateRetailCartTotal,
  calculateRetailSplitTotal,
  createRetailPaymentSplits,
  createRetailSaleForm,
  filterRetailLoyaltyCustomers,
  filterRetailOrders,
  filterRetailProducts,
  updateRetailCartQuantity,
  updateRetailPaymentSplit,
} from '../src/lib/retail.js';
import { formatCurrencyNGN } from '../src/lib/financeFormatters.js';

test('retail product filtering matches product names and barcodes case-insensitively', () => {
  const products = [
    { id: 1, name: 'Peak Milk Sachet', barcode: 'MILK-001' },
    { id: 2, name: 'Golden Morn', barcode: 'BREAKFAST-200' },
    { id: 3, name: 'Sardine', barcode: 'FISH-300' },
  ];

  assert.deepEqual(filterRetailProducts(products, 'milk'), [products[0]]);
  assert.deepEqual(filterRetailProducts(products, 'breakfast'), [products[1]]);
  assert.equal(filterRetailProducts(products, '').length, 3);
});

test('retail cart helpers accumulate totals and update targeted quantities safely', () => {
  const product = { id: 4, name: 'Sugar', barcode: 'SUGAR-001', selling_price: '1800' };
  const firstCart = addRetailCartItem([], product);
  const expandedCart = addRetailCartItem(firstCart, product);

  assert.deepEqual(firstCart, [
    {
      product_id: 4,
      name: 'Sugar',
      barcode: 'SUGAR-001',
      quantity: 1,
      unit_price: 1800,
      total: 1800,
    },
  ]);
  assert.equal(expandedCart[0].quantity, 2);
  assert.equal(expandedCart[0].total, 3600);
  assert.equal(calculateRetailCartTotal(expandedCart), 3600);

  const updatedCart = updateRetailCartQuantity(expandedCart, 4, 3);
  assert.equal(updatedCart[0].quantity, 3);
  assert.equal(updatedCart[0].total, 5400);
  assert.deepEqual(updateRetailCartQuantity(updatedCart, 4, 0), []);
});

test('retail payment split helpers keep defaults isolated and totals numeric', () => {
  const firstSplits = createRetailPaymentSplits();
  const secondSplits = createRetailPaymentSplits();

  firstSplits[0].amount = '1200';
  assert.equal(secondSplits[0].amount, '');

  const updatedSplits = updateRetailPaymentSplit(secondSplits, 1, 'amount', '550');
  assert.equal(updatedSplits[1].amount, '550');
  assert.equal(calculateRetailSplitTotal(updatedSplits), 550);

  const saleForm = createRetailSaleForm();
  assert.deepEqual(saleForm, {
    customer_id: '',
    loyalty_profile_id: '',
    payment_splits: createRetailPaymentSplits(),
    notes: '',
  });
});

test('retail overview metrics preserve labels and formatted finance values', () => {
  const metrics = buildRetailOverviewMetrics({
    today_sales: 210000,
    cash_balance: 68000,
    debtors: 14000,
    stock_alerts: 5,
  });

  assert.deepEqual(metrics[0], {
    label: 'Today Sales',
    value: formatCurrencyNGN(210000),
    tone: 'violet',
  });
  assert.equal(metrics[1].value, formatCurrencyNGN(68000));
  assert.equal(metrics[3].value, 5);

  const deskMetrics = buildRetailDeskMetrics(
    { today_sales: 210000 },
    { opening_float: 10000 },
    [
      { payment_method: 'cash', status: 'completed' },
      { payment_method: 'credit', status: 'refunded', refunded_at: '2026-06-05' },
    ],
    [{ id: 1 }, { id: 2 }],
    formatCurrencyNGN,
  );

  assert.deepEqual(deskMetrics[2], {
    label: 'Refund Pressure',
    value: 1,
    helper: 'Refunded or reversed orders that need attention for margin protection.',
    tone: 'rose',
  });
});

test('retail sale payload helper keeps only active splits and calculates change', () => {
  const payload = buildRetailSalePayload(
    {
      customer_id: '',
      loyalty_profile_id: '7',
      payment_splits: [
        { payment_method: 'cash', amount: '5000', reference: '' },
        { payment_method: 'transfer', amount: '0', reference: 'ignore' },
        { payment_method: 'card', amount: '1500', reference: 'POS-01' },
      ],
      notes: 'Evening sale',
    },
    [
      { product_id: 1, quantity: 2, unit_price: 2000, total: 4000 },
      { product_id: 2, quantity: 1, unit_price: 1500, total: 1500 },
    ],
    5500,
    6500,
  );

  assert.deepEqual(payload, {
    customer_id: null,
    loyalty_profile_id: '7',
    items: [
      { product_id: 1, quantity: 2, unit_price: 2000, total: 4000 },
      { product_id: 2, quantity: 1, unit_price: 1500, total: 1500 },
    ],
    subtotal: 5500,
    total: 5500,
    paid: 6500,
    change: 1000,
    payment_splits: [
      { payment_method: 'cash', amount: '5000', reference: '' },
      { payment_method: 'card', amount: '1500', reference: 'POS-01' },
    ],
    payment_method: 'cash',
    notes: 'Evening sale',
  });
});

test('retail order and loyalty presenters keep labels readable with fallback context', () => {
  const order = buildRetailRecentOrderPresentation({
    id: 3,
    order_number: 'ORD-003',
    total: 12500,
    payment_method: 'transfer',
    cashier_name: 'Bala',
    status: 'completed',
    customer: { name: 'Amina Stores' },
  });
  const fallbackOrder = buildRetailRecentOrderPresentation({ id: 4, total: 0 });

  assert.equal(order.customerLabel, `Amina Stores - ${formatCurrencyNGN(12500)}`);
  assert.equal(order.paymentMethodLabel, 'transfer');
  assert.equal(order.totalLabel, formatCurrencyNGN(12500));
  assert.equal(order.cashierLabel, 'Bala');
  assert.equal(fallbackOrder.customerLabel, `Walk-in customer - ${formatCurrencyNGN(0)}`);
  assert.equal(buildRetailLoyaltyOptionLabel({ phone: '08030000000', tier: 'gold' }), '08030000000 - gold');
  assert.deepEqual(buildRetailLoyaltyCard({ id: 2, phone: '08030000000', tier: 'gold' }), {
    id: 2,
    title: '08030000000',
    meta: '08030000000 | gold',
  });
});

test('retail search helpers keep order and loyalty lookups stable', () => {
  assert.deepEqual(
    filterRetailOrders(
      [
        { id: 1, order_number: 'ORD-001', payment_method: 'cash', customer: { name: 'Amina' } },
        { id: 2, order_number: 'ORD-002', payment_method: 'credit', customer: { name: 'Bala' } },
      ],
      'credit',
    ).map((order) => order.id),
    [2],
  );

  assert.deepEqual(
    filterRetailLoyaltyCustomers(
      [
        { id: 3, phone: '0803', tier: 'silver', customer: { name: 'Amina' } },
        { id: 4, phone: '0901', tier: 'gold', customer: { name: 'Bala' } },
      ],
      'gold',
    ).map((profile) => profile.id),
    [4],
  );
});
