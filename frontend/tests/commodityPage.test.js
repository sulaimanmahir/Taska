import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/CommodityOps.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('CommodityOps keeps its live desk on a query-backed workspace object', () => {
  assert.match(source, /const \{ data, error, refetch \} = useQuery\(/);
  assert.match(source, /queryKey: \['commodity-desk'\]/);
  assert.match(source, /Promise\.all\(\[/);
  assert.match(source, /api\.get\('\/commodity\/overview'\)/);
  assert.match(source, /api\.get\('\/products'\)/);
  assert.match(source, /api\.get\('\/customers'\)/);
  assert.match(source, /api\.get\('\/suppliers'\)/);
  assert.match(source, /api\.get\('\/warehouses'\)/);
});

test('CommodityOps exposes the shared retry panel for desk loading failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /getErrorMessage\(error, 'We could not load commodity operations right now\.'\)/);
  assert.match(source, /void refetch\(\)/);
});

test('CommodityOps keeps its operational write flows on live API endpoints', () => {
  assert.match(source, /api\.post\('\/commodity\/lots'/);
  assert.match(source, /api\.post\('\/commodity\/price-board'/);
  assert.match(source, /api\.post\('\/commodity\/trades'/);
  assert.match(source, /api\.post\(`\/commodity\/trades\/\$\{tradeId\}\/settlements`/);
  assert.match(source, /api\.patch\(`\/commodity\/trades\/\$\{tradeId\}`/);
});
