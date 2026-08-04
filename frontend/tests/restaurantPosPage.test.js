import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/RestaurantPOS.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('RestaurantPOS defines a shared query error panel', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /We could not load part of restaurant operations right now\. Please try again\./);
  assert.match(source, /restaurantQueries\.some\(\(query\) => query\.isError\)/);
});

test('RestaurantPOS keeps restaurant workspace queries grouped for retry', () => {
  assert.match(source, /const restaurantQueries = \[/);
  assert.match(source, /overviewQuery/);
  assert.match(source, /tablesQuery/);
  assert.match(source, /shiftsQuery/);
  assert.match(source, /reservationsQuery/);
  assert.match(source, /recipesQuery/);
  assert.match(source, /ticketsQuery/);
  assert.match(source, /kitchenBoardQuery/);
  assert.match(source, /wasteLogsQuery/);
  assert.match(source, /productsQuery/);
  assert.match(source, /restaurantQueries\.forEach\(\(query\) => query\.refetch\(\)\)/);
});

test('RestaurantPOS keeps live restaurant endpoints query-backed', () => {
  assert.match(source, /api\.get\('\/restaurant\/overview'\)/);
  assert.match(source, /api\.get\('\/restaurant\/tables'\)/);
  assert.match(source, /api\.get\('\/restaurant\/shifts'\)/);
  assert.match(source, /api\.get\('\/restaurant\/reservations'\)/);
  assert.match(source, /api\.get\('\/restaurant\/recipes'\)/);
  assert.match(source, /api\.get\('\/restaurant\/tickets'\)/);
  assert.match(source, /api\.get\('\/restaurant\/kitchen-board'\)/);
  assert.match(source, /api\.get\('\/restaurant\/waste-logs'\)/);
  assert.match(source, /api\.get\('\/products'\)/);
});
