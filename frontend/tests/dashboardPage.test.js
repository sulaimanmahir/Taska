import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/Dashboard.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

test('dashboard page keeps query-backed loading for stats, recent orders, and low stock', () => {
  assert.match(source, /useQuery\(\{/);
  assert.match(source, /api\.get\('\/dashboard'\)/);
  assert.match(source, /api\.get\('\/orders\?limit=5'\)/);
  assert.match(source, /api\.get\('\/products\?low_stock=true&limit=5'\)/);
});

test('dashboard page exposes a shared retry panel for dashboard query failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /dashboardQueries = \[statsQuery, recentOrdersQuery, lowStockProductsQuery\]/);
  assert.match(source, /query\.isError/);
  assert.match(source, /query\.refetch\(\)/);
  assert.match(source, /We could not load part of the dashboard right now/);
});
