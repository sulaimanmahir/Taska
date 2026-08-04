import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/Landing.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('Landing keeps the public navigation and branded auth handoffs intact', () => {
  assert.match(source, /<Link to="\/" aria-label="Taska home"/);
  assert.match(source, /<a href="#why"/);
  assert.match(source, /<a href="#modules"/);
  assert.match(source, /<a href="#pricing"/);
  assert.match(source, /<Link to="\/login"/);
  assert.match(source, /<Link[\s\S]*to="\/register"/);
});

test('Landing preserves the primary hero calls to action and proof points', () => {
  assert.match(source, /Create business account/);
  assert.match(source, /Sign in to workspace/);
  assert.match(source, /Explore 26 live demos/);
  assert.match(source, /Offline-first operations for unstable internet and power environments/);
  assert.match(source, /AI command center that explains what happened, why it matters, and what to do next/);
});

test('Landing keeps industry module coverage and pricing entry points visible', () => {
  assert.match(source, /Taska adapts to the business you actually run\./);
  assert.match(source, /Retail and Supermarket/);
  assert.match(source, /Pharmacy and Clinic/);
  assert.match(source, /Pure Water Factory/);
  assert.match(source, /Textile, Agro, Livestock/);
  assert.match(source, /Simple pricing/);
  assert.match(source, /Start free\. Upgrade when your operations demand more\./);
});
