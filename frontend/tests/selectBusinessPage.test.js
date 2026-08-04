import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/SelectBusiness.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('SelectBusiness keeps workspace sorting and filtering at the page boundary', () => {
  assert.match(source, /const normalizedSearch = search\.trim\(\)\.toLowerCase\(\);/);
  assert.match(source, /const visibleBusinesses = \[\.\.\.businesses\]/);
  assert.match(source, /if \(a\.id === activeBusiness\?\.id\) return -1;/);
  assert.match(source, /business\.business_type_label/);
  assert.match(source, /return haystack\.includes\(normalizedSearch\);/);
});

test('SelectBusiness keeps workspace switching on the auth-store contract', () => {
  assert.match(source, /const \{ businesses, switchBusiness, user, business: activeBusiness \} = useAuthStore\(\);/);
  assert.match(source, /await switchBusiness\(businessId\);/);
  assert.match(source, /navigate\('\/'\);/);
  assert.match(source, /setBusyId\(businessId\)/);
});

test('SelectBusiness preserves create-business actions and empty-state handoff', () => {
  assert.match(source, /to="\/businesses\/new"/);
  assert.match(source, /Create business/);
  assert.match(source, /No businesses found/);
  assert.match(source, /Choose a business to load the correct modules, dashboard, and permissions\./);
});
