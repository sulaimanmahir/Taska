import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/FarmOps.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('FarmOps keeps its live desk on a query-backed workspace object', () => {
  assert.match(source, /const \{ data: overview, error, refetch \} = useQuery\(/);
  assert.match(source, /queryKey: \['farm-overview'\]/);
  assert.match(source, /api\.get\('\/farm\/overview'\)/);
});

test('FarmOps exposes the shared retry panel for desk loading failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /getErrorMessage\(error, 'We could not load farm operations right now\.'\)/);
  assert.match(source, /void refetch\(\)/);
});

test('FarmOps keeps its operational write flows on live API endpoints', () => {
  assert.match(source, /api\.post\('\/farm\/plots'/);
  assert.match(source, /api\.post\('\/farm\/planting-cycles'/);
  assert.match(source, /api\.post\('\/farm\/input-logs'/);
  assert.match(source, /api\.post\('\/farm\/harvest-logs'/);
});
