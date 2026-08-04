import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/Fees.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

test('fees page keeps query-backed loading for overview, sessions, terms, classes, students, structures, payments, and debtors', () => {
  assert.match(source, /useQuery\(\{/);
  assert.match(source, /api\.get\('\/school\/overview'/);
  assert.match(source, /api\.get\('\/school\/sessions'/);
  assert.match(source, /api\.get\('\/school\/terms'/);
  assert.match(source, /api\.get\('\/school\/classes'/);
  assert.match(source, /api\.get\('\/school\/students'/);
  assert.match(source, /api\.get\('\/school\/fee-structures'/);
  assert.match(source, /api\.get\('\/school\/fee-payments'/);
  assert.match(source, /api\.get\('\/school\/debtors'/);
});

test('fees page uses the shared retry panel for workspace query failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /feeQueries = \[/);
  assert.match(source, /overviewQuery/);
  assert.match(source, /sessionsQuery/);
  assert.match(source, /termsQuery/);
  assert.match(source, /classroomsQuery/);
  assert.match(source, /studentsQuery/);
  assert.match(source, /structuresQuery/);
  assert.match(source, /paymentsQuery/);
  assert.match(source, /debtorsQuery/);
  assert.match(source, /query\.isError/);
  assert.match(source, /query\.refetch\(\)/);
  assert.match(source, /We could not load part of the fees workspace right now\. Please try again\./);
});
