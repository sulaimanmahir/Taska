import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/Customers.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

test('customers page keeps query-backed loading for customers and customer groups', () => {
  assert.match(source, /const customersQuery = useQuery\(/);
  assert.match(source, /const customerGroupsQuery = useQuery\(/);
  assert.match(source, /const customerQueries = \[customersQuery, customerGroupsQuery\]/);
  assert.match(source, /api\.get\('\/customers'\)/);
  assert.match(source, /api\.get\('\/customer-groups'\)/);
});

test('customers page uses the shared retry panel for customer loading failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /message=\{loadError\}/);
  assert.match(source, /customerQueries\.find\(\(query\) => query\.isError\)\?\.error/);
  assert.match(source, /customerQueries\.forEach\(\(query\) => \{/);
  assert.match(source, /void query\.refetch\(\)/);
  assert.match(source, /QueryErrorPanel/);
});
