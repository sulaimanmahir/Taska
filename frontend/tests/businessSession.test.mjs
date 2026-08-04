import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePostLoginPath } from '../src/lib/businessSession.js';
import { buildBusinessScopedKey, flattenPendingActions } from '../src/lib/offlineContext.js';

test('users with multiple businesses are routed to selector after login', () => {
  assert.equal(
    resolvePostLoginPath({
      requiresBusinessSelection: true,
      needsBusinessOnboarding: false,
    }),
    '/business-select'
  );
});

test('users with no business are routed to business creation after login', () => {
  assert.equal(
    resolvePostLoginPath({
      requiresBusinessSelection: false,
      needsBusinessOnboarding: true,
    }),
    '/businesses/new'
  );
});

test('offline keys are scoped by business id', () => {
  assert.equal(buildBusinessScopedKey(41, 'dashboard'), '41:dashboard');
  assert.equal(buildBusinessScopedKey(null, 'dashboard'), 'global:dashboard');
});

test('pending actions remain separable by business', () => {
  const actions = flattenPendingActions({
    12: [{ id: 'a-1', business_id: 12 }],
    19: [{ id: 'b-1', business_id: 19 }, { id: 'b-2', business_id: 19 }],
  });

  assert.equal(actions.length, 3);
  assert.deepEqual(actions.map((action) => action.business_id), [12, 19, 19]);
});
