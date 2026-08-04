import test from 'node:test';
import assert from 'node:assert/strict';

import { observeModalScrollArea } from '../src/components/modalShellScroll.js';

class FakeResizeObserver {
  static instances = [];

  constructor(callback) {
    this.callback = callback;
    this.observed = [];
    this.disconnected = false;
    FakeResizeObserver.instances.push(this);
  }

  observe(target) {
    this.observed.push(target);
  }

  disconnect() {
    this.disconnected = true;
  }
}

class FakeMutationObserver {
  static instances = [];

  constructor(callback) {
    this.callback = callback;
    this.observed = [];
    this.disconnected = false;
    FakeMutationObserver.instances.push(this);
  }

  observe(target, options) {
    this.observed.push({ target, options });
  }

  disconnect() {
    this.disconnected = true;
  }
}

function createFakeScrollArea({
  scrollTop = 0,
  clientHeight = 200,
  scrollHeight = 200,
  firstElementChild = { id: 'child' },
} = {}) {
  const listeners = new Map();

  return {
    clientHeight,
    firstElementChild,
    listeners,
    scrollHeight,
    scrollTop,
    addEventListener(name, callback, options) {
      listeners.set(name, { callback, options });
    },
    removeEventListener(name, callback) {
      const current = listeners.get(name);

      if (current?.callback === callback) {
        listeners.delete(name);
      }
    },
  };
}

function createWindowStub() {
  const listeners = new Map();

  return {
    listeners,
    addEventListener(name, callback) {
      listeners.set(name, callback);
    },
    removeEventListener(name, callback) {
      if (listeners.get(name) === callback) {
        listeners.delete(name);
      }
    },
  };
}

test('modal scroll observer seeds state and registers listeners plus observers', () => {
  const updates = [];
  const scrollArea = createFakeScrollArea({ scrollHeight: 620 });
  const windowRef = createWindowStub();
  FakeResizeObserver.instances = [];
  FakeMutationObserver.instances = [];

  const cleanup = observeModalScrollArea({
    scrollArea,
    setScrollState(updater) {
      const current = updates.length ? updates[updates.length - 1] : { top: false, bottom: false };
      updates.push(updater(current));
    },
    windowRef,
    ResizeObserverRef: FakeResizeObserver,
    MutationObserverRef: FakeMutationObserver,
  });

  assert.deepEqual(updates[0], { top: false, bottom: true });
  assert.equal(scrollArea.listeners.get('scroll')?.options?.passive, true);
  assert.equal(typeof windowRef.listeners.get('resize'), 'function');
  assert.deepEqual(FakeResizeObserver.instances[0].observed, [scrollArea, scrollArea.firstElementChild]);
  assert.deepEqual(FakeMutationObserver.instances[0].observed[0], {
    target: scrollArea,
    options: {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'inert'],
    },
  });

  cleanup();
  assert.equal(FakeResizeObserver.instances[0].disconnected, true);
  assert.equal(FakeMutationObserver.instances[0].disconnected, true);
  assert.equal(scrollArea.listeners.has('scroll'), false);
  assert.equal(windowRef.listeners.has('resize'), false);
});

test('modal scroll observer is a no-op when no scroll area is available', () => {
  const cleanup = observeModalScrollArea({
    scrollArea: null,
    setScrollState() {
      throw new Error('setScrollState should not run without a scroll area');
    },
    windowRef: createWindowStub(),
    ResizeObserverRef: FakeResizeObserver,
    MutationObserverRef: FakeMutationObserver,
  });

  assert.equal(typeof cleanup, 'function');
  cleanup();
});

test('modal scroll observer recomputes state on scroll, resize, resize-observer, and mutation events', () => {
  const updates = [];
  const scrollArea = createFakeScrollArea({ scrollHeight: 620 });
  const windowRef = createWindowStub();
  FakeResizeObserver.instances = [];
  FakeMutationObserver.instances = [];

  observeModalScrollArea({
    scrollArea,
    setScrollState(updater) {
      const current = updates.length ? updates[updates.length - 1] : { top: false, bottom: false };
      updates.push(updater(current));
    },
    windowRef,
    ResizeObserverRef: FakeResizeObserver,
    MutationObserverRef: FakeMutationObserver,
  });

  scrollArea.scrollTop = 120;
  scrollArea.listeners.get('scroll').callback();
  assert.deepEqual(updates.at(-1), { top: true, bottom: true });

  scrollArea.scrollTop = 425;
  windowRef.listeners.get('resize')();
  assert.deepEqual(updates.at(-1), { top: true, bottom: false });

  scrollArea.scrollTop = 0;
  scrollArea.scrollHeight = 200;
  FakeResizeObserver.instances[0].callback();
  assert.deepEqual(updates.at(-1), { top: false, bottom: false });

  scrollArea.scrollHeight = 620;
  FakeMutationObserver.instances[0].callback();
  assert.deepEqual(updates.at(-1), { top: false, bottom: true });
});
