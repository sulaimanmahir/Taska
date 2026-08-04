import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/TrustFund.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('TrustFund defines a shared query error panel', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /We could not load part of the trust fund workspace right now\. Please try again\./);
  assert.match(source, /trustDeskQueries\.some\(\(query\) => query\.isError\)/);
});

test('TrustFund keeps top-level workspace queries grouped for retry', () => {
  assert.match(source, /const trustDeskQueries = \[accountsQuery, overdueQuery, customersQuery\]/);
  assert.match(source, /trustDeskQueries\.forEach\(\(query\) => query\.refetch\(\)\)/);
});

test('TrustFund keeps desk and statement endpoints query-backed', () => {
  assert.match(source, /api\.get\('\/trust-accounts'/);
  assert.match(source, /api\.get\('\/trust-accounts\/overdue'\)/);
  assert.match(source, /api\.get\('\/customers'\)/);
  assert.match(source, /api\.get\(`\/trust-accounts\/\$\{selectedLedgerAccountId\}`\)/);
});
