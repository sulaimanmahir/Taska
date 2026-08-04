import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/Inventory.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

test('inventory page keeps query-backed loading for warehouses, inventory lines, and movement history', () => {
  assert.match(source, /useQuery\(\{/);
  assert.match(source, /api\.get\('\/warehouses'\)/);
  assert.match(source, /api\.get\(`\/inventory\$\{suffix\}`\)/);
  assert.match(source, /api\.get\('\/inventory\/movements'\)/);
});

test('inventory page uses the shared retry panel for inventory loading failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /message=\{loadError\}/);
  assert.match(source, /inventoryQueries\.forEach/);
  assert.match(source, /query\.refetch\(\)/);
  assert.match(source, /We could not load inventory right now\. Please try again\./);
});
