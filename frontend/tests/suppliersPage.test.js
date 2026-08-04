import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/Suppliers.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

test('suppliers page keeps query-backed loading for supplier records', () => {
  assert.match(source, /useQuery\(/);
  assert.match(source, /api\.get\('\/suppliers'\)/);
});

test('suppliers page uses the shared retry panel for supplier loading failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /message=\{loadError\}/);
  assert.match(source, /suppliersQuery\.refetch\(\)/);
  assert.match(source, /We could not load suppliers right now/);
});
