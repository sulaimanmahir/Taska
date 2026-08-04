import test from 'node:test';
import assert from 'node:assert/strict';
import { addRetailCartItem, canAddRetailCartItem, canUpdateRetailCartQuantity, getRetailProductStockMessage, getRetailProductStockState, updateRetailCartQuantity, validateRetailCartAgainstStock } from './retail.js';

test('addRetailCartItem ignores out-of-stock products', () => {
  const cart = [];
  const product = { id: 1, name: 'Water', available_quantity: 0, selling_price: 100 };

  const nextCart = addRetailCartItem(cart, product);

  assert.deepEqual(nextCart, []);
});

test('updateRetailCartQuantity refuses quantities above available stock', () => {
  const cart = [{ product_id: 1, quantity: 1, unit_price: 100, total: 100 }];
  const nextCart = updateRetailCartQuantity(cart, 1, 3, 2);

  assert.deepEqual(nextCart, cart);
});

test('updateRetailCartQuantity allows quantities within available stock', () => {
  const cart = [{ product_id: 1, quantity: 1, unit_price: 100, total: 100 }];
  const nextCart = updateRetailCartQuantity(cart, 1, 2, 3);

  assert.equal(nextCart[0].quantity, 2);
  assert.equal(nextCart[0].total, 200);
});

test('canAddRetailCartItem blocks a second unit when stock is already exhausted', () => {
  const cart = [{ product_id: 1, quantity: 1, unit_price: 100, total: 100 }];
  const product = { id: 1, name: 'Water', available_quantity: 1, selling_price: 100 };

  assert.equal(canAddRetailCartItem(cart, product), false);
});

test('canUpdateRetailCartQuantity blocks quantities beyond available stock', () => {
  const cart = [{ product_id: 1, quantity: 1, unit_price: 100, total: 100 }];

  assert.equal(canUpdateRetailCartQuantity(cart, 1, 3, 2), false);
});

test('getRetailProductStockState flags low-stock and out-of-stock products', () => {
  const lowStockState = getRetailProductStockState({ available_quantity: 3, low_stock_alert: 5 });
  const outOfStockState = getRetailProductStockState({ available_quantity: 0, stock_status: 'out_of_stock' });

  assert.equal(lowStockState.stockStatus, 'low_stock');
  assert.equal(outOfStockState.isOutOfStock, true);
  assert.equal(lowStockState.isLowStock, true);
});

test('getRetailProductStockMessage explains the available stock clearly', () => {
  assert.equal(getRetailProductStockMessage({ available_quantity: 0, stock_status: 'out_of_stock' }), 'Out of stock');
  assert.equal(getRetailProductStockMessage({ available_quantity: 3, low_stock_alert: 5 }), 'Only 3 left in stock');
  assert.equal(getRetailProductStockMessage({ available_quantity: 12 }), 'In stock');
});

test('validateRetailCartAgainstStock flags cart items that now exceed available stock', () => {
  const cart = [{ product_id: 1, name: 'Water', quantity: 5, unit_price: 100, total: 500 }];
  const products = [{ id: 1, name: 'Water', available_quantity: 2, selling_price: 100 }];

  const issues = validateRetailCartAgainstStock(cart, products);

  assert.equal(issues.length, 1);
  assert.equal(issues[0].productId, 1);
});

test('validateRetailCartAgainstStock passes when cart stays within available stock', () => {
  const cart = [{ product_id: 1, name: 'Water', quantity: 2, unit_price: 100, total: 200 }];
  const products = [{ id: 1, name: 'Water', available_quantity: 5, selling_price: 100 }];

  assert.deepEqual(validateRetailCartAgainstStock(cart, products), []);
});
