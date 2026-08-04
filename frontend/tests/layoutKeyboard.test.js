import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getFocusTrapWrapIndex,
  getInitialFocusTrapIndex,
  getCheckedMenuItemIndex,
  getInitialMenuItemIndex,
  getNextMenuItemIndex,
} from '../src/lib/layoutKeyboard.js';

test('switcher keyboard helper prefers the checked business for initial focus', () => {
  const items = [
    { checked: false },
    { checked: true },
    { checked: false },
  ];

  assert.equal(getCheckedMenuItemIndex(items), 1);
  assert.equal(getInitialMenuItemIndex(items), 1);
});

test('switcher keyboard helper falls back to the first item when nothing is checked', () => {
  assert.equal(getCheckedMenuItemIndex([{ checked: false }, { checked: false }]), -1);
  assert.equal(getInitialMenuItemIndex([{ checked: false }, { checked: false }]), 0);
  assert.equal(getInitialMenuItemIndex([]), 0);
});

test('switcher keyboard helper wraps correctly for arrow navigation', () => {
  assert.equal(getNextMenuItemIndex({ key: 'ArrowDown', itemCount: 3, currentIndex: 1 }), 2);
  assert.equal(getNextMenuItemIndex({ key: 'ArrowDown', itemCount: 3, currentIndex: 2 }), 0);
  assert.equal(getNextMenuItemIndex({ key: 'ArrowUp', itemCount: 3, currentIndex: 0 }), 2);
  assert.equal(getNextMenuItemIndex({ key: 'ArrowUp', itemCount: 3, currentIndex: -1 }), 2);
});

test('switcher keyboard helper handles Home, End, and unsupported keys safely', () => {
  assert.equal(getNextMenuItemIndex({ key: 'Home', itemCount: 4, currentIndex: 2 }), 0);
  assert.equal(getNextMenuItemIndex({ key: 'End', itemCount: 4, currentIndex: 0 }), 3);
  assert.equal(getNextMenuItemIndex({ key: 'Enter', itemCount: 4, currentIndex: 1 }), -1);
  assert.equal(getNextMenuItemIndex({ key: 'ArrowDown', itemCount: 0, currentIndex: 1 }), -1);
});

test('focus trap helper wraps from the first item on reverse tab', () => {
  assert.equal(
    getFocusTrapWrapIndex({ key: 'Tab', shiftKey: true, activeIndex: 0, itemCount: 4 }),
    3,
  );
  assert.equal(
    getFocusTrapWrapIndex({ key: 'Tab', shiftKey: true, activeIndex: 2, itemCount: 4 }),
    -1,
  );
});

test('focus trap helper wraps from the last item on forward tab', () => {
  assert.equal(
    getFocusTrapWrapIndex({ key: 'Tab', shiftKey: false, activeIndex: 3, itemCount: 4 }),
    0,
  );
  assert.equal(
    getFocusTrapWrapIndex({ key: 'Tab', shiftKey: false, activeIndex: 1, itemCount: 4 }),
    -1,
  );
});

test('focus trap helper ignores unsupported keys and empty collections', () => {
  assert.equal(
    getFocusTrapWrapIndex({ key: 'Escape', shiftKey: false, activeIndex: 0, itemCount: 4 }),
    -1,
  );
  assert.equal(
    getFocusTrapWrapIndex({ key: 'Tab', shiftKey: false, activeIndex: 0, itemCount: 0 }),
    -1,
  );
});

test('focus trap helper prefers an explicit initial focus target when available', () => {
  assert.equal(
    getInitialFocusTrapIndex({ itemCount: 4, preferredIndex: 2 }),
    2,
  );
  assert.equal(
    getInitialFocusTrapIndex({ itemCount: 4, preferredIndex: 0 }),
    0,
  );
});

test('focus trap helper falls back to the first item for missing or invalid preferred targets', () => {
  assert.equal(
    getInitialFocusTrapIndex({ itemCount: 4, preferredIndex: -1 }),
    0,
  );
  assert.equal(
    getInitialFocusTrapIndex({ itemCount: 4, preferredIndex: 9 }),
    0,
  );
  assert.equal(
    getInitialFocusTrapIndex({ itemCount: 0, preferredIndex: 0 }),
    -1,
  );
});
