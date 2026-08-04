import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/CreateBusiness.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

test('create business page uses query-backed loading for subscription plans', () => {
  assert.match(source, /useQuery\(\{/);
  assert.match(source, /api\.get\('\/billing\/plans'\)/);
  assert.match(source, /plansQuery\.refetch\(\)/);
  assert.match(source, /QueryErrorPanel/);
  assert.match(source, /disabled=\{plansQuery\.isLoading\}/);
});

test('create business page keeps preview and canonical business type wiring intact', () => {
  assert.match(source, /import Logo from '\.\.\/components\/Logo';/);
  assert.match(source, /canonicalizeBusinessType/);
  assert.match(source, /getBusinessTypeConfig/);
  assert.match(source, /<Logo/);
});
