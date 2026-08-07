import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const consultationsSource = readFileSync(new URL('../src/pages/Consultations.jsx', import.meta.url), 'utf8');
const labRequestsSource = readFileSync(new URL('../src/pages/LabRequests.jsx', import.meta.url), 'utf8');
const resultsSource = readFileSync(new URL('../src/pages/Results.jsx', import.meta.url), 'utf8');

test('consultations, lab requests, and results routes point to dedicated screens', () => {
  assert.match(appSource, /const Consultations = lazy\(\(\) => import\('\.\/pages\/Consultations'\)\);/);
  assert.match(appSource, /const LabRequests = lazy\(\(\) => import\('\.\/pages\/LabRequests'\)\);/);
  assert.match(appSource, /const Results = lazy\(\(\) => import\('\.\/pages\/Results'\)\);/);
  assert.match(appSource, /<Route path="consultations" element={<Consultations \/>} \/>/);
  assert.match(appSource, /<Route path="lab-requests" element={<LabRequests \/>} \/>/);
  assert.match(appSource, /<Route path="results" element={<Results \/>} \/>/);
});

test('consultations page uses the consultation workflow endpoints', () => {
  assert.match(consultationsSource, /api\.get\('\/health\/consultations'\)/);
  assert.match(consultationsSource, /api\.post\('\/health\/consultations', payload\)/);
});

test('lab requests page uses the diagnostics intake and queue endpoints', () => {
  assert.match(labRequestsSource, /api\.get\('\/health\/lab-requests'\)/);
  assert.match(labRequestsSource, /api\.post\('\/health\/lab-requests', payload\)/);
  assert.match(labRequestsSource, /api\.post\(`\/health\/lab-requests\/\$\{labRequestId\}\/collect-sample`/);
});

test('results page branches between school and laboratory workflows', () => {
  assert.match(resultsSource, /if \(hasActiveType\('school'\)\)/);
  assert.match(resultsSource, /api\.post\('\/school\/results', payload\)/);
  assert.match(resultsSource, /api\.post\(`\/health\/lab-requests\/\$\{labRequestId\}\/approve`/);
});
