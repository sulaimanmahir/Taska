import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/DemoIndustry.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('DemoIndustry keeps its industry fallback and register CTA routing intact', () => {
  assert.match(source, /const config = industryConfig\[industry\] \|\| industryConfig\.retail;/);
  assert.match(source, /primaryTo=\{`\/register\?business_type=\$\{config\.id\}`\}/);
  assert.match(source, /to=\{`\/register\?business_type=\$\{config\.id\}`\}/);
  assert.match(source, /Start Free Trial/);
  assert.match(source, /View All Industries/);
});

test('DemoIndustry preserves the core seeded industry configurations', () => {
  assert.match(source, /retail: \{/);
  assert.match(source, /pharmacy: \{/);
  assert.match(source, /school: \{/);
  assert.match(source, /pure_water_factory: \{/);
  assert.match(source, /quote: 'Taska reduced our checkout time by 60% and gave us cleaner daily visibility\.'/);
});

test('DemoIndustry keeps operational proof sections and demo navigation visible', () => {
  assert.match(source, /title="Problems Taska solves"/);
  assert.match(source, /title="Key features for this workflow"/);
  assert.match(source, /heading=\{`Trusted by \$\{config\.name\} teams across Nigeria`\}/);
  assert.match(source, /primaryLabel=\{`Start Free Trial for \$\{config\.name\}`\}/);
  assert.match(source, /secondaryLabel="Explore Other Demos"/);
});
