import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/BeautyOps.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('BeautyOps keeps its live desk on a query-backed workspace object', () => {
  assert.match(source, /const \{ data, isLoading, error, refetch \} = useQuery\(/);
  assert.match(source, /queryKey: \['beauty-overview'\]/);
  assert.match(source, /api\.get\('\/beauty\/overview'\)/);
});

test('BeautyOps exposes the shared retry panel for desk loading failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /getErrorMessage\(error, 'We could not load the beauty operations desk right now\.'\)/);
  assert.match(source, /void refetch\(\)/);
});

test('BeautyOps keeps its operational write flows on live API endpoints', () => {
  assert.match(source, /api\.post\('\/beauty\/services'/);
  assert.match(source, /api\.post\('\/beauty\/staff'/);
  assert.match(source, /api\.post\('\/beauty\/appointments'/);
  assert.match(source, /api\.post\(`\/beauty\/appointments\/\$\{id\}\/complete`/);
});
