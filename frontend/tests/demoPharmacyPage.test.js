import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/DemoPharmacy.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('DemoPharmacy keeps its pharmacy registration handoff and hero framing intact', () => {
  assert.match(source, /ctaLink="\/register\?business_type=pharmacy"/);
  assert.match(source, /industry="Pharmacy"/);
  assert.match(source, /Taska helps pharmacies across Africa track inventory, manage customers, and protect profits/);
  assert.match(source, /DemoNav \/>/);
});

test('DemoPharmacy preserves the seeded prescription preview and pharmacy-specific proof points', () => {
  assert.match(source, /const stats = \[/);
  assert.match(source, /label: "Today's Sales", value: 'NGN 156,000'/);
  assert.match(source, /const recentPrescriptions = \[/);
  assert.match(source, /Amoxicillin 500mg/);
  assert.match(source, /Expired medicines/);
  assert.match(source, /Everything you need to run your pharmacy/);
});

test('DemoPharmacy keeps social proof visible on the page boundary', () => {
  assert.match(source, /Trusted by pharmacies across Nigeria/);
  assert.match(source, /DemoDarkFooter/);
});
