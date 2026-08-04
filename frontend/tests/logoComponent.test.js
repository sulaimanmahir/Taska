import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const logoSource = readFileSync(new URL('../src/components/Logo.jsx', import.meta.url), 'utf8');
const pageShellSource = readFileSync(new URL('../src/components/PageShell.jsx', import.meta.url), 'utf8');
const layoutSource = readFileSync(new URL('../src/components/Layout.jsx', import.meta.url), 'utf8');
const loginSource = readFileSync(new URL('../src/pages/Login.jsx', import.meta.url), 'utf8');

test('logo component exposes a top-level decorative mode for repeated brand showcases', () => {
  assert.match(logoSource, /decorative = false/);
  assert.match(logoSource, /function getAccessibleLockupProps\(decorative, label\)/);
  assert.match(logoSource, /return \{ 'aria-hidden': true \};/);
  assert.match(logoSource, /'aria-label': resolveLogoLabel\(label\),/);
  assert.match(logoSource, /<span \{\.\.\.accessibleLockupProps\}>/);
  assert.match(logoSource, /<span className=\{lockupClassName\} \{\.\.\.accessibleLockupProps\}>/);
});

test('icon logos can opt into decorative rendering without losing the default label path', () => {
  assert.match(logoSource, /<BrandIcon size=\{palette\.icon\} className=\{iconOnlyClassName\} decorative=\{decorative\} label=\{label\} \/>/);
  assert.match(logoSource, /resolveLogoLabel\(label\)/);
});

test('shared marketing shells keep brand logos wired back to home', () => {
  assert.match(pageShellSource, /logoAriaLabel = 'Taska home'/);
  assert.match(pageShellSource, /<Link to=\{brandHref\} aria-label="Taska home" className="flex items-center gap-3">/);
  assert.match(pageShellSource, /<Link to="\/" aria-label="Taska home" className="inline-flex items-center">/);
});

test('workspace shell uses the same branded home link label', () => {
  assert.match(layoutSource, /<Link to="\/" aria-label="Taska home" className="flex items-center gap-3">/);
});

test('login topbar keeps the shared logo wired to the home route', () => {
  assert.match(loginSource, /<Link to="\/" aria-label="Taska home" className="inline-flex items-center">/);
});
