import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/TaskaCooperative.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('TaskaCooperative defines a shared query error panel', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /We could not load part of the cooperative workspace right now\. Please try again\./);
  assert.match(source, /cooperativeQueries\.some\(\(query\) => query\.isError\)/);
});

test('TaskaCooperative keeps finance workspace queries grouped for retry', () => {
  assert.match(source, /const cooperativeQueries = \[/);
  assert.match(source, /cooperativeDashboard/);
  assert.match(source, /customersQuery/);
  assert.match(source, /plansQuery/);
  assert.match(source, /productsQuery/);
  assert.match(source, /cooperativeQuery/);
  assert.match(source, /membersQuery/);
  assert.match(source, /sharesQuery/);
  assert.match(source, /financingQuery/);
  assert.match(source, /investmentsQuery/);
  assert.match(source, /profitCyclesQuery/);
  assert.match(source, /withdrawalsQuery/);
  assert.match(source, /governanceQuery/);
  assert.match(source, /reportsQuery/);
  assert.match(source, /settingsQuery/);
  assert.match(source, /cooperativeQueries\.forEach\(\(query\) => query\.refetch\(\)\)/);
});

test('TaskaCooperative keeps live cooperative endpoints query-backed', () => {
  assert.match(source, /api\.get\('\/cooperative\/dashboard'\)/);
  assert.match(source, /api\.get\('\/customers'\)/);
  assert.match(source, /api\.get\('\/billing\/plans'\)/);
  assert.match(source, /api\.get\('\/products'\)/);
  assert.match(source, /api\.get\('\/cooperative'\)/);
  assert.match(source, /api\.get\('\/cooperative\/members'\)/);
  assert.match(source, /api\.get\('\/cooperative\/shares'\)/);
  assert.match(source, /api\.get\('\/cooperative\/financing'\)/);
  assert.match(source, /api\.get\('\/cooperative\/investments'\)/);
  assert.match(source, /api\.get\('\/cooperative\/profit-cycles'\)/);
  assert.match(source, /api\.get\('\/cooperative\/withdrawals'\)/);
  assert.match(source, /api\.get\('\/cooperative\/governance'\)/);
  assert.match(source, /api\.get\('\/cooperative\/reports'\)/);
  assert.match(source, /api\.get\('\/cooperative\/settings'\)/);
});
