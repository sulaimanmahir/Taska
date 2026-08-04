import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/Adashe.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('Adashe defines a shared query error panel', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /We could not load part of the adashe workspace right now\. Please try again\./);
  assert.match(source, /adasheDeskQueries\.some\(\(query\) => query\.isError\)/);
});

test('Adashe keeps top-level workspace queries grouped for retry', () => {
  assert.match(source, /const adasheDeskQueries = \[accountsQuery, customersQuery, insightsQuery\]/);
  assert.match(source, /adasheDeskQueries\.forEach\(\(query\) => query\.refetch\(\)\)/);
});

test('Adashe keeps desk and statement endpoints query-backed', () => {
  assert.match(source, /api\.get\('\/trust-accounts'/);
  assert.match(source, /api\.get\('\/customers'\)/);
  assert.match(source, /api\.get\('\/ai\/insights'\)/);
  assert.match(source, /api\.get\(`\/trust-accounts\/\$\{selectedAccountId\}`\)/);
});
