import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/Results.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('Results keeps school desk queries on named query objects', () => {
  assert.match(source, /const overviewQuery = useQuery\(/);
  assert.match(source, /const studentsQuery = useQuery\(/);
  assert.match(source, /const termsQuery = useQuery\(/);
  assert.match(source, /const subjectsQuery = useQuery\(/);
  assert.match(source, /const resultsQuery = useQuery\(/);
  assert.match(source, /const schoolResultQueries = \[overviewQuery, studentsQuery, termsQuery, subjectsQuery, resultsQuery\]/);
});

test('Results keeps laboratory desk queries on named query objects', () => {
  assert.match(source, /const laboratoryResultQueries = \[overviewQuery, labRequestsQuery\]/);
  assert.match(source, /const hasPageError = laboratoryResultQueries\.some\(\(query\) => query\.isError\)/);
});

test('Results uses grouped refetch on both desk variants', () => {
  assert.match(source, /schoolResultQueries\.forEach\(\(query\) => \{/);
  assert.match(source, /laboratoryResultQueries\.forEach\(\(query\) => \{/);
  assert.match(source, /We could not load the academic results desk right now\./);
  assert.match(source, /We could not load the laboratory results desk right now\./);
});

test('Results keeps school and laboratory endpoints query-backed', () => {
  assert.match(source, /api\.get\('\/school\/overview'\)/);
  assert.match(source, /api\.get\('\/school\/students'\)/);
  assert.match(source, /api\.get\('\/school\/terms'\)/);
  assert.match(source, /api\.get\('\/school\/subjects'\)/);
  assert.match(source, /api\.get\('\/school\/results'\)/);
  assert.match(source, /api\.get\('\/health\/overview'\)/);
  assert.match(source, /api\.get\('\/health\/lab-requests'\)/);
});
