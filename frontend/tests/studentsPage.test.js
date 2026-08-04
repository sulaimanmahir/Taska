import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/Students.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

test('students page keeps query-backed loading for overview and student register data', () => {
  assert.match(source, /useQuery\(\{/);
  assert.match(source, /api\.get\('\/school\/overview'\)/);
  assert.match(source, /api\.get\('\/school\/students'\)/);
});

test('students page uses the shared retry panel for admissions loading failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /message=\{loadError\}/);
  assert.match(source, /schoolQueries\.forEach/);
  assert.match(source, /query\.refetch\(\)/);
  assert.match(source, /We could not load part of the admissions desk right now/);
});
