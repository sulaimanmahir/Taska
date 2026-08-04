import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getHiddenSavedViewCount,
  getVisibleSavedViews,
  shouldCollapseSavedViews,
} from '../src/lib/aiInsights/index.js';

const savedViews = [
  { href: '/a', label: 'A' },
  { href: '/b', label: 'B' },
  { href: '/c', label: 'C' },
  { href: '/d', label: 'D' },
  { href: '/e', label: 'E' },
];

test('saved view helper collapses only when the list exceeds the compact limit', () => {
  assert.equal(shouldCollapseSavedViews(savedViews.slice(0, 4)), false);
  assert.equal(shouldCollapseSavedViews(savedViews), true);
});

test('saved view helper returns the compact list when show-all is disabled', () => {
  assert.deepEqual(
    getVisibleSavedViews({
      savedViews,
      showAll: false,
      currentViewHref: '/b',
    }).map((view) => view.href),
    ['/a', '/b', '/c', '/d'],
  );
});

test('saved view helper keeps the current saved view visible even when it falls outside the compact window', () => {
  assert.deepEqual(
    getVisibleSavedViews({
      savedViews,
      showAll: false,
      currentViewHref: '/e',
    }).map((view) => view.href),
    ['/a', '/b', '/c', '/e'],
  );
});

test('saved view helper returns the full list when expanded or when nothing needs collapsing', () => {
  assert.deepEqual(
    getVisibleSavedViews({
      savedViews,
      showAll: true,
      currentViewHref: '/e',
    }).map((view) => view.href),
    ['/a', '/b', '/c', '/d', '/e'],
  );
  assert.deepEqual(
    getVisibleSavedViews({
      savedViews: savedViews.slice(0, 3),
      showAll: false,
      currentViewHref: '/c',
    }).map((view) => view.href),
    ['/a', '/b', '/c'],
  );
});

test('saved view helper reports the correct hidden count', () => {
  const visibleSavedViews = getVisibleSavedViews({
    savedViews,
    showAll: false,
    currentViewHref: '/e',
  });

  assert.equal(
    getHiddenSavedViewCount({
      savedViews,
      visibleSavedViews,
    }),
    1,
  );
  assert.equal(
    getHiddenSavedViewCount({
      savedViews,
      visibleSavedViews: savedViews,
    }),
    0,
  );
});
