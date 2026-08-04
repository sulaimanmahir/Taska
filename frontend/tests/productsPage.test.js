import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/Products.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

test('products page keeps query-backed loading for categories, products, low stock, and inventory snapshot', () => {
  assert.match(source, /useQuery\(\{/);
  assert.match(source, /api\.get\('\/product-categories'/);
  assert.match(source, /api\.get\(`\/products\?\$\{params\}`\)/);
  assert.match(source, /api\.get\('\/products\?low_stock=1'/);
  assert.match(source, /api\.get\('\/inventory'/);
});

test('products page uses the shared retry panel for workspace query failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /productQueries = \[categoriesQuery, productsQuery, lowStockProductsQuery, inventoryDataQuery\]/);
  assert.match(source, /query\.isError/);
  assert.match(source, /query\.refetch\(\)/);
  assert.match(source, /We could not load part of the product workspace right now\. Please try again\./);
});
