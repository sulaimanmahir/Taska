import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/LogisticsOps.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

test('logistics page keeps query-backed loading for the logistics overview workspace', () => {
  assert.match(source, /useQuery\(\{/);
  assert.match(source, /api\.get\('\/logistics\/overview'/);
});

test('logistics page uses the shared retry panel for workspace query failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /logisticsQuery\.isError/);
  assert.match(source, /logisticsQuery\.refetch\(\)/);
  assert.match(source, /We could not load logistics operations right now\. Please try again\./);
});
