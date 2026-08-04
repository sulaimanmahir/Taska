import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/BillingSettings.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

test('billing settings uses query-backed loading for invoices and payment methods', () => {
  assert.match(source, /useQuery\(\{/);
  assert.match(source, /api\.get\('\/billing\/invoices'\)/);
  assert.match(source, /api\.get\('\/billing\/payment-methods'\)/);
  assert.match(source, /billingQuery\.refetch\(\)/);
  assert.match(source, /QueryErrorPanel/);
});

test('billing settings keeps live mutations for cancel, default-method, and remove-method actions', () => {
  assert.match(source, /useMutation\(\{/);
  assert.match(source, /api\.post\('\/billing\/cancel'\)/);
  assert.match(source, /api\.post\(`\/billing\/payment-methods\/\$\{methodId\}\/default`\)/);
  assert.match(source, /api\.delete\(`\/billing\/payment-methods\/\$\{methodId\}`\)/);
  assert.match(source, /fetchProfile\(\)/);
  assert.match(source, /ConfirmDialog/);
});
