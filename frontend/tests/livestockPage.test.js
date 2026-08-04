import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/LivestockOps.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('LivestockOps keeps its live desk on a query-backed workspace object', () => {
  assert.match(source, /const \{ data, isLoading, error, refetch \} = useQuery\(/);
  assert.match(source, /queryKey: \['livestock-overview'\]/);
  assert.match(source, /queryFn: fetchOverview/);
  assert.match(source, /api\.get\('\/livestock\/overview'\)/);
});

test('LivestockOps exposes the shared retry panel for desk loading failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /getErrorMessage\(error, 'We could not load livestock operations right now\.'\)/);
  assert.match(source, /void refetch\(\)/);
});

test('LivestockOps keeps its operational write flows on live API endpoints', () => {
  assert.match(source, /submit\('\/livestock\/pens'/);
  assert.match(source, /submit\('\/livestock\/groups'/);
  assert.match(source, /submit\('\/livestock\/sales'/);
  assert.match(source, /submit\('\/livestock\/weights'/);
  assert.match(source, /submit\('\/livestock\/milk-logs'/);
  assert.match(source, /submit\('\/livestock\/disease-logs'/);
  assert.match(source, /submit\('\/livestock\/breeding-records'/);
  assert.match(source, /submit\('\/livestock\/medications'/);
});
