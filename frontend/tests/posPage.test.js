import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/POS.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

test('pos delegates business-specific types to their richer operational desks', () => {
  assert.match(source, /if \(hasActiveType\('restaurant'\)\) \{\s+return <RestaurantPOS \/>;/);
  assert.match(source, /if \(hasActiveType\('retail'\) \|\| hasActiveType\('supermarket'\)\) \{\s+return <RetailOps \/>;/);
  assert.match(source, /if \(hasActiveType\('wholesale'\)\) \{\s+return <WholesaleOps \/>;/);
  assert.match(source, /if \(hasActiveType\('pure_water_retail'\)\) \{\s+return <PureWaterRetailOps \/>;/);
  assert.match(source, /if \(hasActiveType\('mixed'\) \|\| hasActiveType\('general'\)\) \{\s+return <SMEOps \/>;/);
});

test('pos fallback checkout uses query-backed loading and the shared retail helpers', () => {
  assert.match(source, /useQuery\(\{/);
  assert.match(source, /api\.get\('\/products'\)/);
  assert.match(source, /api\.get\('\/customers'\)/);
  assert.match(source, /filterRetailProducts/);
  assert.match(source, /addRetailCartItem/);
  assert.match(source, /updateRetailCartQuantity/);
  assert.match(source, /calculateRetailCartTotal/);
  assert.match(source, /buildRetailSalePayload/);
  assert.match(source, /api\.post\('\/orders', payload\)/);
});
