import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/Transfers.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

test('transfers page keeps query-backed loading for warehouses, inventory, and movement history', () => {
  assert.match(source, /useQuery\(\{/);
  assert.match(source, /api\.get\('\/warehouses'/);
  assert.match(source, /api\.get\('\/inventory'/);
  assert.match(source, /api\.get\('\/inventory\/movements'/);
});

test('transfers page uses the shared retry panel for workspace query failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /transferQueries = \[warehousesQuery, inventoryQuery, movementQuery\]/);
  assert.match(source, /query\.isError/);
  assert.match(source, /query\.refetch\(\)/);
  assert.match(source, /We could not load part of the transfer workspace right now\. Please try again\./);
});
