import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/Reports.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

test('reports page keeps query-backed loading for all shared report surfaces', () => {
  assert.match(source, /useQuery\(\{/);
  assert.match(source, /api\.get\(`\/reports\/sales\?period=\$\{period\}`\)/);
  assert.match(source, /api\.get\('\/reports\/inventory'\)/);
  assert.match(source, /api\.get\(`\/reports\/expenses\?period=\$\{period\}`\)/);
  assert.match(source, /api\.get\('\/reports\/customers'\)/);
  assert.match(source, /api\.get\(`\/reports\/profit-loss\?period=\$\{period\}`\)/);
});

test('reports page exposes a shared retry panel for query failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /reportQueries = \[salesQuery, inventoryQuery, expensesQuery, customersQuery, profitLossQuery\]/);
  assert.match(source, /query\.isError/);
  assert.match(source, /query\.refetch\(\)/);
  assert.match(source, /We could not load part of the reporting centre right now/);
});
