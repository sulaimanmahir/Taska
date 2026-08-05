import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/TaskaCooperative.jsx');
const pageSource = fs.readFileSync(pagePath, 'utf8');

const hookPath = path.resolve(process.cwd(), 'src/hooks/useCooperativeDesk.js');
const hookSource = fs.readFileSync(hookPath, 'utf8');

test('TaskaCooperative defines a shared query error panel', () => {
  assert.match(pageSource, /function QueryErrorPanel/);
  assert.match(hookSource, /We could not load part of the cooperative workspace right now\. Please try again\./);
  assert.match(pageSource, /cooperativeQueries\.some\(\(query\) => query\.isError\)/);
});

test('useCooperativeDesk keeps finance workspace queries grouped for retry', () => {
  assert.match(hookSource, /const cooperativeQueries = \[/);
  assert.match(hookSource, /cooperativeDashboard/);
  assert.match(hookSource, /customersQuery/);
  assert.match(hookSource, /plansQuery/);
  assert.match(hookSource, /productsQuery/);
  assert.match(hookSource, /cooperativeQuery/);
  assert.match(hookSource, /membersQuery/);
  assert.match(hookSource, /sharesQuery/);
  assert.match(hookSource, /financingQuery/);
  assert.match(hookSource, /investmentsQuery/);
  assert.match(hookSource, /profitCyclesQuery/);
  assert.match(hookSource, /withdrawalsQuery/);
  assert.match(hookSource, /governanceQuery/);
  assert.match(hookSource, /reportsQuery/);
  assert.match(hookSource, /settingsQuery/);
  assert.match(pageSource, /cooperativeQueries\.forEach\(\(query\) => query\.refetch\(\)\)/);
});

test('useCooperativeDesk keeps live cooperative endpoints query-backed', () => {
  assert.match(hookSource, /api\.get\('\/cooperative\/dashboard'\)/);
  assert.match(hookSource, /api\.get\('\/customers'\)/);
  assert.match(hookSource, /api\.get\('\/billing\/plans'\)/);
  assert.match(hookSource, /api\.get\('\/products'\)/);
  assert.match(hookSource, /api\.get\('\/cooperative'\)/);
  assert.match(hookSource, /api\.get\('\/cooperative\/members'\)/);
  assert.match(hookSource, /api\.get\('\/cooperative\/shares'\)/);
  assert.match(hookSource, /api\.get\('\/cooperative\/financing'\)/);
  assert.match(hookSource, /api\.get\('\/cooperative\/investments'\)/);
  assert.match(hookSource, /api\.get\('\/cooperative\/profit-cycles'\)/);
  assert.match(hookSource, /api\.get\('\/cooperative\/withdrawals'\)/);
  assert.match(hookSource, /api\.get\('\/cooperative\/governance'\)/);
  assert.match(hookSource, /api\.get\('\/cooperative\/reports'\)/);
  assert.match(hookSource, /api\.get\('\/cooperative\/settings'\)/);
});
