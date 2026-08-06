import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getNavigationForBusinessType,
  getMergedNavigationForBusinessTypes,
} from '../src/config/navigationPresets.js';

test('getMergedNavigationForBusinessTypes returns the single preset unchanged for one active type', () => {
  const single = getNavigationForBusinessType('retail');
  const merged = getMergedNavigationForBusinessTypes(['retail']);

  assert.deepEqual(merged, single);
});

test('getMergedNavigationForBusinessTypes falls back to general when given no types', () => {
  const merged = getMergedNavigationForBusinessTypes([]);

  assert.deepEqual(merged, getNavigationForBusinessType('general'));
});

test('getMergedNavigationForBusinessTypes combines sections across two verticals', () => {
  const merged = getMergedNavigationForBusinessTypes(['retail', 'restaurant']);

  const sectionNames = merged.map((entry) => entry.section);
  assert.ok(sectionNames.includes('Overview'));

  const overviewSection = merged.find((entry) => entry.section === 'Overview');
  const overviewPaths = overviewSection.items.map((item) => item.path);
  assert.ok(overviewPaths.length > 0);
});

test('getMergedNavigationForBusinessTypes dedupes shared items by path across verticals', () => {
  const merged = getMergedNavigationForBusinessTypes(['retail', 'wholesale']);

  const overviewSection = merged.find((entry) => entry.section === 'Overview');
  const dashboardEntries = overviewSection.items.filter((item) => item.path === '/');

  assert.equal(dashboardEntries.length, 1);
});

test('getMergedNavigationForBusinessTypes preserves items unique to each active vertical', () => {
  const retailOnly = getNavigationForBusinessType('retail');
  const restaurantOnly = getNavigationForBusinessType('restaurant');
  const merged = getMergedNavigationForBusinessTypes(['retail', 'restaurant']);

  const mergedPaths = new Set(merged.flatMap((entry) => entry.items.map((item) => item.path)));
  const retailPaths = retailOnly.flatMap((entry) => entry.items.map((item) => item.path));
  const restaurantPaths = restaurantOnly.flatMap((entry) => entry.items.map((item) => item.path));

  for (const path of [...retailPaths, ...restaurantPaths]) {
    assert.ok(mergedPaths.has(path), `expected merged navigation to include ${path}`);
  }
});
