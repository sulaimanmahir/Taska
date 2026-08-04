import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/FuelOps.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('FuelOps keeps its live desk on a query-backed workspace object', () => {
  assert.match(source, /const \{ data, error, refetch \} = useQuery\(/);
  assert.match(source, /queryKey: \['fuel-desk'\]/);
  assert.match(source, /Promise\.all\(\[/);
  assert.match(source, /api\.get\('\/fuel\/overview'\)/);
  assert.match(source, /api\.get\('\/fuel\/tanks'\)/);
  assert.match(source, /api\.get\('\/fuel\/pumps'\)/);
  assert.match(source, /api\.get\('\/fuel\/nozzle-readings'\)/);
  assert.match(source, /api\.get\('\/fuel\/tank-dips'\)/);
  assert.match(source, /api\.get\('\/fuel\/shifts'\)/);
  assert.match(source, /api\.get\('\/fuel\/price-changes'\)/);
  assert.match(source, /api\.get\('\/fuel\/alerts'\)/);
});

test('FuelOps exposes the shared retry panel for desk loading failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /getErrorMessage\(error, 'We could not load the fuel operations desk right now\.'\)/);
  assert.match(source, /void refetch\(\)/);
});

test('FuelOps keeps its operational write flows on live API endpoints', () => {
  assert.match(source, /api\.post\('\/fuel\/tanks'/);
  assert.match(source, /api\.post\('\/fuel\/pumps'/);
  assert.match(source, /api\.post\('\/fuel\/nozzle-readings'/);
  assert.match(source, /api\.post\('\/fuel\/tank-dips'/);
  assert.match(source, /api\.post\('\/fuel\/shifts'/);
  assert.match(source, /api\.post\('\/fuel\/price-changes'/);
});
