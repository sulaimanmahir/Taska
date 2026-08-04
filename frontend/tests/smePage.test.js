import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/SMEOps.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

test('sme page keeps query-backed loading for overview and customer follow-up context', () => {
  assert.match(source, /useQuery\(\{/);
  assert.match(source, /api\.get\('\/general-sme\/overview'\)/);
  assert.match(source, /api\.get\('\/customers'\)/);
});

test('sme page uses the shared retry panel for owner desk loading failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /message=\{loadError\}/);
  assert.match(source, /smeQueries\.forEach/);
  assert.match(source, /query\.refetch\(\)/);
  assert.match(source, /We could not load part of the SME control centre right now/);
});
