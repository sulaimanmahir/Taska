import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/Adashe.jsx');
const pageSource = fs.readFileSync(pagePath, 'utf8');

const hookPath = path.resolve(process.cwd(), 'src/hooks/useAdasheDesk.js');
const hookSource = fs.readFileSync(hookPath, 'utf8');

test('Adashe defines a shared query error panel', () => {
  assert.match(pageSource, /function QueryErrorPanel/);
  assert.match(hookSource, /We could not load part of the adashe workspace right now\. Please try again\./);
  assert.match(pageSource, /adasheDeskQueries\.some\(\(query\) => query\.isError\)/);
});

test('useAdasheDesk keeps top-level workspace queries grouped for retry', () => {
  assert.match(hookSource, /const adasheDeskQueries = \[accountsQuery, customersQuery, insightsQuery\]/);
  assert.match(pageSource, /adasheDeskQueries\.forEach\(\(query\) => query\.refetch\(\)\)/);
});

test('useAdasheDesk keeps desk and statement endpoints query-backed', () => {
  assert.match(hookSource, /api\.get\('\/trust-accounts'/);
  assert.match(hookSource, /api\.get\('\/customers'\)/);
  assert.match(hookSource, /api\.get\('\/ai\/insights'\)/);
  assert.match(hookSource, /api\.get\(`\/trust-accounts\/\$\{selectedAccountId\}`\)/);
});
