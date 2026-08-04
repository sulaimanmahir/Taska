import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/Attendance.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

test('attendance page keeps query-backed loading for overview, students, terms, subjects, attendance, and results', () => {
  assert.match(source, /useQuery\(\{/);
  assert.match(source, /api\.get\('\/school\/overview'/);
  assert.match(source, /api\.get\('\/school\/students'/);
  assert.match(source, /api\.get\('\/school\/terms'/);
  assert.match(source, /api\.get\('\/school\/subjects'/);
  assert.match(source, /api\.get\('\/school\/attendance'/);
  assert.match(source, /api\.get\('\/school\/results'/);
});

test('attendance page uses the shared retry panel for workspace query failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /attendanceQueries = \[overviewQuery, studentsQuery, termsQuery, subjectsQuery, attendanceQuery, resultsQuery\]/);
  assert.match(source, /query\.isError/);
  assert.match(source, /query\.refetch\(\)/);
  assert.match(source, /We could not load part of the attendance workspace right now\. Please try again\./);
});
