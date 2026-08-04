import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/Deliveries.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

test('deliveries page keeps query-backed loading for overview, deliveries, vehicles, and operations', () => {
  assert.match(source, /useQuery\(\{/);
  assert.match(source, /api\.get\('\/deliveries\/overview'\)/);
  assert.match(source, /api\.get\('\/deliveries'\)/);
  assert.match(source, /api\.get\('\/delivery-vehicles'\)/);
  assert.match(source, /api\.get\('\/deliveries\/operations'\)/);
});

test('deliveries page exposes a shared retry panel for workspace query failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /deliveryQueries = \[overviewQuery, deliveriesQuery, vehiclesQuery, operationsQuery\]/);
  assert.match(source, /query\.isError/);
  assert.match(source, /query\.refetch\(\)/);
  assert.match(source, /We could not load part of the delivery workspace right now/);
});
