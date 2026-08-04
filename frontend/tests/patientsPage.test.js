import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/Patients.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

test('patients page keeps query-backed loading for overview, patients, and consultations', () => {
  assert.match(source, /useQuery\(\{/);
  assert.match(source, /api\.get\('\/health\/overview'/);
  assert.match(source, /api\.get\('\/health\/patients'/);
  assert.match(source, /api\.get\('\/health\/consultations'/);
});

test('patients page uses the shared retry panel for workspace query failures', () => {
  assert.match(source, /function QueryErrorPanel/);
  assert.match(source, /patientQueries = \[healthOverviewQuery, patientsQuery, consultationsQuery\]/);
  assert.match(source, /query\.isError/);
  assert.match(source, /query\.refetch\(\)/);
  assert.match(source, /We could not load part of the patient workspace right now\. Please try again\./);
});
