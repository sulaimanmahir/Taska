import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/WarehouseOps.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('WarehouseOps keeps its live desk on a query-backed workspace object', () => {
  assert.match(source, /const \{ data, isLoading, error, refetch \} = useQuery\(/);
  assert.match(source, /queryKey: \['warehouse-overview'\]/);
  assert.match(source, /api\.get\('\/warehouse\/overview'\)/);
});

test('WarehouseOps exposes the shared retry panel for desk loading failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /getErrorMessage\(error, 'We could not load the warehouse desk right now\.'\)/);
  assert.match(source, /void refetch\(\)/);
});

test('WarehouseOps keeps its operational write flows on live API endpoints', () => {
  assert.match(source, /api\.post\('\/warehouse\/donors'/);
  assert.match(source, /api\.post\('\/warehouse\/partner-requests'/);
  assert.match(source, /api\.post\('\/warehouse\/distributions'/);
  assert.match(source, /api\.post\(`\/warehouse\/distributions\/\$\{payload\.distribution_id\}\/signatures`/);
});
