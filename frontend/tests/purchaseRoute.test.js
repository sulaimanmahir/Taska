import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const purchasesPageSource = readFileSync(new URL('../src/pages/Purchases.jsx', import.meta.url), 'utf8');
const navigationSource = readFileSync(new URL('../src/config/navigationPresets.js', import.meta.url), 'utf8');
const demoAccountsSource = readFileSync(new URL('../src/pages/DemoAccounts.jsx', import.meta.url), 'utf8');
const businessTypesSource = readFileSync(new URL('../src/config/businessTypes.js', import.meta.url), 'utf8');
const registerSource = readFileSync(new URL('../src/pages/Register.jsx', import.meta.url), 'utf8');
const createBusinessSource = readFileSync(new URL('../src/pages/CreateBusiness.jsx', import.meta.url), 'utf8');
const warehouseOpsSource = readFileSync(new URL('../src/pages/NGOWarehouseOps.jsx', import.meta.url), 'utf8');

test('purchases route is exposed through the app shell', () => {
  assert.match(appSource, /const Purchases = lazy\(\(\) => import\('\.\/pages\/Purchases'\)\);/);
  assert.match(appSource, /<Route path="purchases" element={<Purchases \/>} \/>/);
});

test('purchases page uses the purchase, receive, and payment endpoints', () => {
  assert.match(purchasesPageSource, /api\.get\('\/purchases'\)/);
  assert.match(purchasesPageSource, /api\.post\('\/purchases', payload\)/);
  assert.match(purchasesPageSource, /api\.post\(`\/purchases\/\$\{purchaseId\}\/receive`, payload\)/);
  assert.match(purchasesPageSource, /api\.post\(`\/purchases\/\$\{purchaseId\}\/payments`, payload\)/);
});

test('supply-oriented navigation presets expose purchases as a first-class destination', () => {
  assert.match(navigationSource, /path: '\/purchases'/);
});

test('warehouse route is exposed while navigation stays selective for stock-heavy presets', () => {
  assert.match(appSource, /<Route path="warehouse" element={<WarehouseOps \/>} \/>/);
  assert.match(navigationSource, /'warehouse',\s*'retail',\s*'wholesale',\s*'construction'/);
  assert.doesNotMatch(navigationSource, /'service',\s*'warehouse'/);
  assert.doesNotMatch(navigationSource, /'beauty',\s*'warehouse'/);
  assert.doesNotMatch(navigationSource, /'school',\s*'warehouse'/);
});

test('warehouse demo account stays aligned with the canonical backend seed email', () => {
  assert.match(demoAccountsSource, /type: 'warehouse', label: 'Warehouse', email: 'warehouse@taska\.local'/);
});

test('warehouse alias stays hidden and public creation flows canonicalize it to warehouse', () => {
  assert.match(businessTypesSource, /ngo_warehouse:[\s\S]*hidden: true,/);
  assert.match(businessTypesSource, /export const businessTypeAliases = \{\s*ngo_warehouse: 'warehouse',/);
  assert.match(registerSource, /canonicalizeBusinessType/);
  assert.match(registerSource, /isVisibleBusinessType/);
  assert.match(createBusinessSource, /canonicalizeBusinessType/);
  assert.match(createBusinessSource, /getBusinessTypeConfig/);
});

test('shared warehouse page uses canonical warehouse helper aliases at the page boundary', () => {
  assert.match(warehouseOpsSource, /buildNgoDistributionCard as buildWarehouseDistributionCard/);
  assert.match(warehouseOpsSource, /createNgoDonorForm as createWarehouseSourceForm/);
  assert.match(warehouseOpsSource, /buildWarehouseOverviewMetrics/);
});
