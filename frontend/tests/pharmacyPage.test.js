import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/Pharmacy.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('Pharmacy keeps desk dependencies on named query objects', () => {
  assert.match(source, /const overviewQuery = useQuery\(/);
  assert.match(source, /const batchesQuery = useQuery\(/);
  assert.match(source, /const productsQuery = useQuery\(/);
  assert.match(source, /const customersQuery = useQuery\(/);
  assert.match(source, /const substitutionsQuery = useQuery\(/);
  assert.match(source, /const controlledLogsQuery = useQuery\(/);
  assert.match(source, /const remindersQuery = useQuery\(/);
  assert.match(source, /const purchaseHistoryQuery = useQuery\(/);
  assert.match(source, /const pharmacyQueries = \[/);
});

test('Pharmacy uses grouped refetch through the shared retry panel', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /const hasPageError = pharmacyQueries\.some\(\(query\) => query\.isError\)/);
  assert.match(source, /pharmacyQueries\.find\(\(query\) => query\.isError\)\?\.error/);
  assert.match(source, /pharmacyQueries\.forEach\(\(query\) => \{/);
  assert.match(source, /void query\.refetch\(\)/);
  assert.match(source, /We could not load the pharmacy desk right now\./);
});

test('Pharmacy keeps its desk endpoints query-backed', () => {
  assert.match(source, /api\.get\('\/pharmacy\/overview'\)/);
  assert.match(source, /api\.get\('\/batches'\)/);
  assert.match(source, /api\.get\('\/products\?limit=100'\)/);
  assert.match(source, /api\.get\('\/customers\?limit=100'\)/);
  assert.match(source, /api\.get\('\/pharmacy\/substitutions'\)/);
  assert.match(source, /api\.get\('\/pharmacy\/controlled-logs'\)/);
  assert.match(source, /api\.get\('\/pharmacy\/refill-reminders'\)/);
  assert.match(source, /api\.get\('\/pharmacy\/purchase-history'\)/);
});
