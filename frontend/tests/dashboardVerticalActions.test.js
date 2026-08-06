import test from 'node:test';
import assert from 'node:assert/strict';

import { getDashboardVerticalActions } from '../src/lib/dashboardVerticalActions.js';

test('getDashboardVerticalActions returns the mapped actions for a known business type', () => {
  assert.deepEqual(getDashboardVerticalActions('retail'), [
    { label: 'Open sales', to: '/pos', tone: 'violet' },
    { label: 'Open stock', to: '/inventory', tone: 'sky' },
  ]);

  assert.deepEqual(getDashboardVerticalActions('wholesale'), [
    { label: 'Open wholesale desk', to: '/wholesale', tone: 'violet' },
    { label: 'Open transfers', to: '/transfers', tone: 'sky' },
  ]);
});

test('getDashboardVerticalActions resolves the ngo_warehouse alias to warehouse actions', () => {
  assert.deepEqual(
    getDashboardVerticalActions('ngo_warehouse'),
    getDashboardVerticalActions('warehouse'),
  );
});

test('getDashboardVerticalActions returns an empty array for an unknown business type', () => {
  assert.deepEqual(getDashboardVerticalActions('unknown_type'), []);
  assert.deepEqual(getDashboardVerticalActions(undefined), []);
});

test('getDashboardVerticalActions differs from getDashboardOwnerFocusActions for construction', async () => {
  const { getDashboardOwnerFocusActions } = await import('../src/lib/dashboardOwnerFocusActions.js');

  assert.deepEqual(getDashboardVerticalActions('construction'), [
    { label: 'Open quotations', to: '/quotations', tone: 'violet' },
    { label: 'Open yard stock', to: '/yard-stock', tone: 'sky' },
  ]);
  assert.deepEqual(getDashboardOwnerFocusActions('construction'), [
    { label: 'Open quotations', to: '/quotations', tone: 'violet' },
    { label: 'Open reports', to: '/reports', tone: 'slate' },
  ]);
});
