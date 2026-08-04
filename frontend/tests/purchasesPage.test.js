import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/Purchases.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

test('purchases page keeps query-backed loading for purchases, suppliers, products, and warehouses', () => {
  assert.match(source, /useQuery\(\{/);
  assert.match(source, /api\.get\('\/purchases'\)/);
  assert.match(source, /api\.get\('\/suppliers'\)/);
  assert.match(source, /api\.get\('\/products'\)/);
  assert.match(source, /api\.get\('\/warehouses'\)/);
});

test('purchases page exposes a shared retry panel for workspace query failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /purchaseQueries = \[purchasesQuery, suppliersQuery, productsQuery, warehousesQuery\]/);
  assert.match(source, /query\.isError/);
  assert.match(source, /query\.refetch\(\)/);
  assert.match(source, /We could not load part of the purchase workspace right now/);
});
