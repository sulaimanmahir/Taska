import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/AgroOps.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('AgroOps keeps its live desk on a query-backed workspace object', () => {
  assert.match(source, /const \{ data, error, refetch \} = useQuery\(/);
  assert.match(source, /queryKey: \['agro-desk'\]/);
  assert.match(source, /Promise\.all\(\[/);
  assert.match(source, /api\.get\('\/agro\/overview'\)/);
  assert.match(source, /api\.get\('\/customers'\)/);
  assert.match(source, /api\.get\('\/products'\)/);
  assert.match(source, /api\.get\('\/agro\/forecasts'\)/);
  assert.match(source, /api\.get\('\/agro\/subsidy-sales'\)/);
  assert.match(source, /api\.get\('\/agro\/recoveries'\)/);
  assert.match(source, /api\.get\('\/agro\/advisories'\)/);
});

test('AgroOps exposes the shared retry panel for desk loading failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /getErrorMessage\(error, 'We could not load the agro operations desk right now\.'\)/);
  assert.match(source, /void refetch\(\)/);
});

test('AgroOps keeps its operational write flows on live API endpoints', () => {
  assert.match(source, /api\.post\('\/agro\/forecasts'/);
  assert.match(source, /api\.post\('\/agro\/subsidy-sales'/);
  assert.match(source, /api\.post\('\/agro\/recoveries'/);
  assert.match(source, /api\.patch\(`\/agro\/recoveries\/\$\{id\}`/);
  assert.match(source, /api\.post\('\/agro\/advisories'/);
});
