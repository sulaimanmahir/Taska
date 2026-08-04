import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/WholesaleOps.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('WholesaleOps keeps its live desk on a query-backed workspace object', () => {
  assert.match(source, /const wholesaleQuery = useQuery\(/);
  assert.match(source, /queryKey: \['wholesale-desk'\]/);
  assert.match(source, /Promise\.all\(\[/);
  assert.match(source, /api\.get\('\/wholesale\/overview'\)/);
  assert.match(source, /api\.get\('\/products'\)/);
  assert.match(source, /api\.get\('\/customers'\)/);
  assert.match(source, /api\.get\('\/warehouses'\)/);
});

test('WholesaleOps exposes the shared retry panel for desk loading failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /wholesaleQuery\.isError/);
  assert.match(source, /wholesaleQuery\.error/);
  assert.match(source, /void wholesaleQuery\.refetch\(\)/);
  assert.match(source, /We could not load wholesale operations right now\. Please try again\./);
});

test('WholesaleOps keeps its operational write flows on live API endpoints', () => {
  assert.match(source, /api\.post\('\/wholesale\/sales-reps'/);
  assert.match(source, /api\.post\('\/wholesale\/price-tiers'/);
  assert.match(source, /api\.post\('\/wholesale\/route-runs'/);
  assert.match(source, /api\.post\('\/wholesale\/orders'/);
  assert.match(source, /api\.post\('\/wholesale\/transfers'/);
  assert.match(source, /api\.patch\(`\/wholesale\/route-runs\/\$\{routeRunId\}`/);
});
