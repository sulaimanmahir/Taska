import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/Pricing.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

test('pricing page uses query-backed loading for plan retrieval', () => {
  assert.match(source, /useQuery\(\{/);
  assert.match(source, /api\.get\('\/billing\/plans'\)/);
  assert.match(source, /plansQuery\.refetch\(\)/);
  assert.match(source, /QueryErrorPanel/);
});

test('pricing page keeps subscribe flow on a dedicated mutation', () => {
  assert.match(source, /useMutation\(\{/);
  assert.match(source, /api\.post\('\/billing\/subscribe'/);
  assert.match(source, /billing_cycle: cycle/);
  assert.match(source, /window\.location\.reload\(\)/);
  assert.match(source, /subscribeMutation\.variables\?\.planId/);
});
