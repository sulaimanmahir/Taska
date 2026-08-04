import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/TextileOps.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('TextileOps keeps its live desk on a query-backed workspace object', () => {
  assert.match(source, /const \{ data, error, refetch \} = useQuery\(/);
  assert.match(source, /queryKey: \['textile-desk'\]/);
  assert.match(source, /Promise\.all\(\[/);
  assert.match(source, /api\.get\('\/textile\/overview'\)/);
  assert.match(source, /api\.get\('\/customers'\)/);
  assert.match(source, /api\.get\('\/products'\)/);
  assert.match(source, /api\.get\('\/textile\/measurements'\)/);
  assert.match(source, /api\.get\('\/textile\/variants'\)/);
  assert.match(source, /api\.get\('\/textile\/style-orders'\)/);
  assert.match(source, /api\.get\('\/textile\/jobs'\)/);
  assert.match(source, /api\.get\('\/textile\/consignments'\)/);
});

test('TextileOps exposes the shared retry panel for desk loading failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /getErrorMessage\(error, 'We could not load textile operations right now\.'\)/);
  assert.match(source, /void refetch\(\)/);
});

test('TextileOps keeps its operational write flows on live API endpoints', () => {
  assert.match(source, /api\.post\('\/textile\/measurements'/);
  assert.match(source, /api\.post\('\/textile\/variants'/);
  assert.match(source, /api\.post\('\/textile\/style-orders'/);
  assert.match(source, /api\.patch\(`\/textile\/jobs\/\$\{id\}`/);
  assert.match(source, /api\.post\('\/textile\/consignments'/);
  assert.match(source, /api\.post\('\/textile\/invoices'/);
});
