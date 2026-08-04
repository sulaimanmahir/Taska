import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/Debtors.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

test('debtors page now uses query-backed customer loading with retry support', () => {
  assert.match(source, /useQuery\(\{/);
  assert.match(source, /api\.get\('\/customers'\)/);
  assert.match(source, /customersQuery\.refetch\(\)/);
  assert.match(source, /QueryErrorPanel/);
  assert.match(source, /getDebtorAccounts/);
  assert.match(source, /filterDebtorAccounts/);
});
