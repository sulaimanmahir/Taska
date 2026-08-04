import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/Production.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('Production keeps desk dependencies on named query objects', () => {
  assert.match(source, /const overviewQuery = useQuery\(/);
  assert.match(source, /const batchesQuery = useQuery\(/);
  assert.match(source, /const materialsQuery = useQuery\(/);
  assert.match(source, /const productsQuery = useQuery\(/);
  assert.match(source, /const productionQueries = \[overviewQuery, batchesQuery, materialsQuery, productsQuery\]/);
});

test('Production uses grouped refetch through the shared retry panel', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /const hasPageError = productionQueries\.some\(\(query\) => query\.isError\)/);
  assert.match(source, /productionQueries\.find\(\(query\) => query\.isError\)\?\.error/);
  assert.match(source, /productionQueries\.forEach\(\(query\) => \{/);
  assert.match(source, /void query\.refetch\(\)/);
  assert.match(source, /We could not load the production desk right now\./);
});

test('Production keeps its desk endpoints query-backed', () => {
  assert.match(source, /api\.get\('\/production\/overview'\)/);
  assert.match(source, /api\.get\('\/production\/batches'\)/);
  assert.match(source, /api\.get\('\/raw-materials'\)/);
  assert.match(source, /api\.get\('\/products\?limit=50'\)/);
});
