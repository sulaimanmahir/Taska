import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/ServiceOps.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('ServiceOps keeps its live desk on a query-backed workspace object', () => {
  assert.match(source, /const \{ data, isLoading, error, refetch \} = useQuery\(/);
  assert.match(source, /queryKey: \['service-business-overview'\]/);
  assert.match(source, /api\.get\('\/service-business\/overview'\)/);
});

test('ServiceOps exposes the shared retry panel for desk loading failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /getErrorMessage\(error, 'We could not load the service operations desk right now\.'\)/);
  assert.match(source, /void refetch\(\)/);
});

test('ServiceOps keeps its operational write flows on live API endpoints', () => {
  assert.match(source, /api\.post\('\/service-business\/offerings'/);
  assert.match(source, /api\.post\('\/service-business\/staff'/);
  assert.match(source, /api\.post\('\/service-business\/bookings'/);
  assert.match(source, /api\.post\('\/service-business\/jobs'/);
  assert.match(source, /api\.patch\(`\/service-business\/jobs\/\$\{id\}`/);
});
