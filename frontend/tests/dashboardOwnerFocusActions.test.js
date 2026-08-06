import test from 'node:test';
import assert from 'node:assert/strict';

import { getDashboardOwnerFocusActions } from '../src/lib/dashboardOwnerFocusActions.js';

test('getDashboardOwnerFocusActions returns the mapped actions for a known business type', () => {
  assert.deepEqual(getDashboardOwnerFocusActions('retail'), [
    { label: 'Open sales', to: '/pos', tone: 'violet' },
    { label: 'Open reports', to: '/reports', tone: 'slate' },
  ]);

  assert.deepEqual(getDashboardOwnerFocusActions('pharmacy'), [
    { label: 'Open pharmacy', to: '/pharmacy', tone: 'violet' },
    { label: 'Open stock', to: '/inventory', tone: 'sky' },
  ]);
});

test('getDashboardOwnerFocusActions resolves the ngo_warehouse alias to warehouse actions', () => {
  assert.deepEqual(
    getDashboardOwnerFocusActions('ngo_warehouse'),
    getDashboardOwnerFocusActions('warehouse'),
  );
});

test('getDashboardOwnerFocusActions returns an empty array for an unknown business type', () => {
  assert.deepEqual(getDashboardOwnerFocusActions('unknown_type'), []);
  assert.deepEqual(getDashboardOwnerFocusActions(undefined), []);
  assert.deepEqual(getDashboardOwnerFocusActions(null), []);
});
