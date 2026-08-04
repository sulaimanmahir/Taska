import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/Consultations.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('Consultations keeps clinical desk queries on named query objects', () => {
  assert.match(source, /const overviewQuery = useQuery\(/);
  assert.match(source, /const patientsQuery = useQuery\(/);
  assert.match(source, /const consultationsQuery = useQuery\(/);
  assert.match(source, /const consultationQueries = \[overviewQuery, patientsQuery, consultationsQuery\]/);
});

test('Consultations uses the shared retry panel with grouped refetch', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /const hasPageError = consultationQueries\.some\(\(query\) => query\.isError\)/);
  assert.match(source, /consultationQueries\.forEach\(\(query\) => \{/);
  assert.match(source, /void query\.refetch\(\)/);
  assert.match(source, /We could not load the consultation desk right now\./);
});

test('Consultations keeps its clinical endpoints query-backed', () => {
  assert.match(source, /api\.get\('\/health\/overview'\)/);
  assert.match(source, /api\.get\('\/health\/patients'\)/);
  assert.match(source, /api\.get\('\/health\/consultations'\)/);
});
