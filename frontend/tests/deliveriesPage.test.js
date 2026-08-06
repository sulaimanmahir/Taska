import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve('src/pages/Deliveries.jsx');
const pageSource = fs.readFileSync(pagePath, 'utf8');

const hookPath = path.resolve('src/hooks/useDeliveryCompanyDesk.js');
const hookSource = fs.readFileSync(hookPath, 'utf8');

test('useDeliveryCompanyDesk keeps query-backed loading for overview, deliveries, vehicles, and operations', () => {
  assert.match(hookSource, /useQuery\(\{/);
  assert.match(hookSource, /api\.get\('\/deliveries\/overview'\)/);
  assert.match(hookSource, /api\.get\('\/deliveries'\)/);
  assert.match(hookSource, /api\.get\('\/delivery-vehicles'\)/);
  assert.match(hookSource, /api\.get\('\/deliveries\/operations'\)/);
});

test('deliveries page exposes a shared retry panel for workspace query failures', () => {
  assert.match(pageSource, /function QueryErrorPanel/);
  assert.match(hookSource, /deliveryQueries = \[overviewQuery, deliveriesQuery, vehiclesQuery, operationsQuery\]/);
  assert.match(hookSource, /query\.isError/);
  assert.match(hookSource, /query\.refetch\(\)/);
  assert.match(pageSource, /We could not load part of the delivery workspace right now/);
});
