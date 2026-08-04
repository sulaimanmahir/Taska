import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/PureWaterRetailOps.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('PureWaterRetailOps keeps its live desk on a query-backed workspace object', () => {
  assert.match(source, /const retailQuery = useQuery\(/);
  assert.match(source, /queryKey: \['pure-water-retail-desk'\]/);
  assert.match(source, /Promise\.all\(\[/);
  assert.match(source, /api\.get\('\/pure-water-retail\/overview'\)/);
  assert.match(source, /api\.get\('\/products'\)/);
  assert.match(source, /api\.get\('\/customers'\)/);
  assert.match(source, /api\.get\('\/warehouses'\)/);
});

test('PureWaterRetailOps exposes the shared retry panel for desk loading failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /We could not load pure water retail operations right now\. Please try again\./);
  assert.match(source, /void retailQuery\.refetch\(\)/);
});

test('PureWaterRetailOps keeps its operational write flows on live API endpoints', () => {
  assert.match(source, /api\.post\('\/pure-water-retail\/price-tiers'/);
  assert.match(source, /api\.post\('\/pure-water-retail\/sales'/);
  assert.match(source, /api\.post\('\/pure-water-retail\/package-movements'/);
  assert.match(source, /api\.post\('\/pure-water-retail\/crates'/);
  assert.match(source, /api\.post\('\/pure-water-retail\/transfers'/);
});
