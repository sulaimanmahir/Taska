import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/Bookings.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

test('bookings page keeps query-backed loading for overview, rooms, bookings, and reservation calendar', () => {
  assert.match(source, /useQuery\(\{/);
  assert.match(source, /api\.get\('\/hotel\/overview'/);
  assert.match(source, /api\.get\('\/hotel\/rooms'/);
  assert.match(source, /api\.get\('\/hotel\/bookings'/);
  assert.match(source, /api\.get\('\/hotel\/reservation-calendar'/);
});

test('bookings page uses the shared retry panel for workspace query failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /bookingQueries = \[overviewQuery, roomsQuery, bookingsQuery, reservationCalendarQuery\]/);
  assert.match(source, /query\.isError/);
  assert.match(source, /query\.refetch\(\)/);
  assert.match(source, /We could not load part of the booking workspace right now\. Please try again\./);
});
