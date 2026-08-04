import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/RetailOps.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('RetailOps keeps its live desk on a query-backed workspace object', () => {
  assert.match(source, /const \{ data, error, refetch \} = useQuery\(/);
  assert.match(source, /queryKey: \['retail-desk'\]/);
  assert.match(source, /Promise\.all\(\[/);
  assert.match(source, /api\.get\('\/retail\/overview'\)/);
  assert.match(source, /api\.get\('\/products'\)/);
});

test('RetailOps exposes the shared retry panel for desk loading failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /getErrorMessage\(error, 'We could not load retail operations right now\.'\)/);
  assert.match(source, /void refetch\(\)/);
});

test('RetailOps keeps its operational write flows on live API endpoints', () => {
  assert.match(source, /endpoint: '\/retail\/shifts\/open'/);
  assert.match(source, /endpoint: `\/retail\/shifts\/\$\{data\.overview\.open_shift\.id\}\/close`/);
  assert.match(source, /endpoint: '\/retail\/loyalty-customers'/);
  assert.match(source, /endpoint: '\/retail\/petty-cash'/);
  assert.match(source, /endpoint: '\/retail\/sales'/);
  assert.match(source, /endpoint: `\/retail\/orders\/\$\{orderId\}\/refund`/);
});
