import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/DemoRetail.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('DemoRetail keeps its retail registration handoff and hero framing intact', () => {
  assert.match(source, /ctaLink="\/register\?business_type=retail"/);
  assert.match(source, /industry="Retail Shop"/);
  assert.match(source, /Taska helps retail shops track sales, manage inventory, and grow customers/);
  assert.match(source, /DemoNav \/>/);
});

test('DemoRetail preserves the seeded stats, top products, and feature showcase contract', () => {
  assert.match(source, /const stats = \[/);
  assert.match(source, /label: "Today's Sales", value: 'NGN 84,500'/);
  assert.match(source, /const topProducts = \[/);
  assert.match(source, /Detergent 500ml/);
  assert.match(source, /DemoFeatureShowcase/);
  assert.match(source, /Everything you need to run your shop/);
});

test('DemoRetail keeps social proof and closing CTA visible', () => {
  assert.match(source, /Trusted by 500\+ shops across Nigeria/);
  assert.match(source, /Join hundreds of shops already using Taska to grow their business\./);
  assert.match(source, /Ready to transform your shop\?/);
});
