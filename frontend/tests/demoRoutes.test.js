import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const demoLandingSource = readFileSync(new URL('../src/pages/DemoLanding.jsx', import.meta.url), 'utf8');

test('public demo router preserves canonical routes and compatibility aliases', () => {
  assert.match(appSource, /<Route path="\/demo\/accounts" element={<DemoAccounts \/>} \/>/);
  assert.match(appSource, /<Route path="\/demo-accounts" element={<Navigate to="\/demo\/accounts" replace \/>} \/>/);
  assert.match(appSource, /<Route path="\/demo\/pure-water" element={<DemoIndustry industry="pure_water_factory" \/>} \/>/);
  assert.match(appSource, /<Route path="\/demo\/pure_water_factory" element={<Navigate to="\/demo\/pure-water" replace \/>} \/>/);
});

test('demo landing links to the live public demo routes', () => {
  assert.match(demoLandingSource, /routePath: '\/demo\/pure-water'/);
  assert.match(demoLandingSource, /to=\{industry\.routePath \?\? `\/demo\/\$\{industry\.id\}`\}/);
  assert.match(demoLandingSource, /secondaryTo="\/demo\/accounts"/);
});
