import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getModalFocusTrapRedirectIndex,
  getModalScrollState,
  normalizeModalCloseRequestSource,
  shouldRestoreFocusForModalCloseSource,
} from '../src/lib/modalShell.js';

test('modal close helpers normalize sources and preserve focus for action-driven closes', () => {
  assert.equal(normalizeModalCloseRequestSource(undefined), 'action');
  assert.equal(normalizeModalCloseRequestSource('close-button'), 'close-button');

  assert.equal(shouldRestoreFocusForModalCloseSource('action'), true);
  assert.equal(shouldRestoreFocusForModalCloseSource(undefined), true);
  assert.equal(shouldRestoreFocusForModalCloseSource('backdrop'), false);
  assert.equal(shouldRestoreFocusForModalCloseSource('escape'), false);
  assert.equal(shouldRestoreFocusForModalCloseSource('close-button'), false);
});

test('modal scroll helper surfaces top and bottom shadow states consistently', () => {
  assert.deepEqual(
    getModalScrollState({ scrollTop: 0, clientHeight: 300, scrollHeight: 302 }),
    { top: false, bottom: false },
  );

  assert.deepEqual(
    getModalScrollState({ scrollTop: 0, clientHeight: 300, scrollHeight: 700 }),
    { top: false, bottom: true },
  );

  assert.deepEqual(
    getModalScrollState({ scrollTop: 120, clientHeight: 300, scrollHeight: 700 }),
    { top: true, bottom: true },
  );

  assert.deepEqual(
    getModalScrollState({ scrollTop: 395, clientHeight: 300, scrollHeight: 700 }),
    { top: true, bottom: false },
  );
});

test('modal focus trap helper wraps only when tab navigation reaches scope edges', () => {
  assert.equal(
    getModalFocusTrapRedirectIndex({
      key: 'Tab',
      shiftKey: false,
      activeIndex: 3,
      itemCount: 4,
      containsActiveElement: true,
    }),
    0,
  );

  assert.equal(
    getModalFocusTrapRedirectIndex({
      key: 'Tab',
      shiftKey: true,
      activeIndex: 0,
      itemCount: 4,
      containsActiveElement: true,
    }),
    3,
  );

  assert.equal(
    getModalFocusTrapRedirectIndex({
      key: 'Tab',
      shiftKey: false,
      activeIndex: 1,
      itemCount: 4,
      containsActiveElement: true,
    }),
    -1,
  );
});

test('modal focus trap helper redirects into scope when focus starts outside it', () => {
  assert.equal(
    getModalFocusTrapRedirectIndex({
      key: 'Tab',
      shiftKey: false,
      activeIndex: -1,
      itemCount: 4,
      containsActiveElement: false,
    }),
    0,
  );

  assert.equal(
    getModalFocusTrapRedirectIndex({
      key: 'Tab',
      shiftKey: true,
      activeIndex: -1,
      itemCount: 4,
      containsActiveElement: false,
    }),
    3,
  );

  assert.equal(
    getModalFocusTrapRedirectIndex({
      key: 'Escape',
      shiftKey: false,
      activeIndex: -1,
      itemCount: 4,
      containsActiveElement: false,
    }),
    -1,
  );
});
