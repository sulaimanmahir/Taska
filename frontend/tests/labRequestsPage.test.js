import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/LabRequests.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('LabRequests keeps diagnostics queries on named query objects', () => {
  assert.match(source, /const overviewQuery = useQuery\(/);
  assert.match(source, /const patientsQuery = useQuery\(/);
  assert.match(source, /const consultationsQuery = useQuery\(/);
  assert.match(source, /const labTestsQuery = useQuery\(/);
  assert.match(source, /const labRequestsQuery = useQuery\(/);
  assert.match(source, /const diagnosticsQueries = \[overviewQuery, patientsQuery, consultationsQuery, labTestsQuery, labRequestsQuery\]/);
});

test('LabRequests uses grouped refetch through the shared retry panel', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /const hasPageError = diagnosticsQueries\.some\(\(query\) => query\.isError\)/);
  assert.match(source, /diagnosticsQueries\.forEach\(\(query\) => \{/);
  assert.match(source, /void query\.refetch\(\)/);
  assert.match(source, /We could not load the diagnostics desk right now\./);
});

test('LabRequests keeps diagnostics endpoints query-backed', () => {
  assert.match(source, /api\.get\('\/health\/overview'\)/);
  assert.match(source, /api\.get\('\/health\/patients'\)/);
  assert.match(source, /api\.get\('\/health\/consultations'\)/);
  assert.match(source, /api\.get\('\/health\/lab-tests'\)/);
  assert.match(source, /api\.get\('\/health\/lab-requests'\)/);
});
