import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/Appointments.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

test('appointments page keeps query-backed loading for overview, patients, appointments, consultations, lab tests, and lab requests', () => {
  assert.match(source, /useQuery\(\{/);
  assert.match(source, /api\.get\('\/health\/overview'/);
  assert.match(source, /api\.get\('\/health\/patients'/);
  assert.match(source, /api\.get\('\/health\/appointments'/);
  assert.match(source, /api\.get\('\/health\/consultations'/);
  assert.match(source, /api\.get\('\/health\/lab-tests'/);
  assert.match(source, /api\.get\('\/health\/lab-requests'/);
});

test('appointments page uses the shared retry panel for workspace query failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /appointmentQueries = \[/);
  assert.match(source, /overviewQuery/);
  assert.match(source, /patientsQuery/);
  assert.match(source, /appointmentsQuery/);
  assert.match(source, /consultationsQuery/);
  assert.match(source, /labTestsQuery/);
  assert.match(source, /labRequestsQuery/);
  assert.match(source, /query\.isError/);
  assert.match(source, /query\.refetch\(\)/);
  assert.match(source, /We could not load part of the appointments workspace right now\. Please try again\./);
});
