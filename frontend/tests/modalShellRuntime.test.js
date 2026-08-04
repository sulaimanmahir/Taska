import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createModalShellRuntime,
  createModalStackChangeEvent,
  getModalBodyLockSnapshot,
  getModalBodyLockStyles,
  isTopModalStackInstance,
  registerModalStackInstance,
  shouldCleanupModalRoot,
  shouldScheduleModalRootCleanup,
  unregisterModalStackInstance,
} from '../src/components/modalShellRuntime.js';

function createFakeModalRoot() {
  return {
    id: '',
    dataset: {},
    childElementCount: 0,
    isConnected: true,
    removed: false,
    remove() {
      this.removed = true;
      this.isConnected = false;
    },
  };
}

function createRuntimeEnvironment({ innerWidth = 1200, clientWidth = 1180 } = {}) {
  const elements = new Map();
  const body = {
    style: {
      overflow: 'auto',
      paddingRight: '2px',
    },
    append(node) {
      elements.set(node.id, node);
    },
  };
  const windowRef = {
    innerWidth,
    dispatchedEvents: [],
    dispatchEvent(event) {
      this.dispatchedEvents.push(event.type);
    },
    requestAnimationFrame(callback) {
      callback();
      return 1;
    },
    cancelAnimationFrame() {},
  };
  const documentRef = {
    body,
    documentElement: {
      clientWidth,
    },
    getElementById(id) {
      return elements.get(id) ?? null;
    },
    createElement() {
      return createFakeModalRoot();
    },
  };

  return { body, documentRef, elements, windowRef };
}

test('modal stack helpers keep instance ordering and top-modal checks stable', () => {
  const registered = registerModalStackInstance(['alpha', 'beta'], 'alpha');

  assert.deepEqual(registered, ['beta', 'alpha']);
  assert.equal(isTopModalStackInstance(registered, 'alpha'), true);
  assert.equal(isTopModalStackInstance(registered, 'beta'), false);
  assert.deepEqual(unregisterModalStackInstance(registered, 'alpha'), ['beta']);
});

test('modal body lock helpers preserve snapshots and scrollbar compensation', () => {
  assert.deepEqual(
    getModalBodyLockSnapshot({ overflow: 'scroll', paddingRight: '8px' }),
    { overflow: 'scroll', paddingRight: '8px' },
  );

  assert.deepEqual(
    getModalBodyLockStyles({ innerWidth: 1200, clientWidth: 1180 }),
    { overflow: 'hidden', paddingRight: '20px' },
  );

  assert.deepEqual(
    getModalBodyLockStyles({ innerWidth: 1200, clientWidth: 1200 }),
    { overflow: 'hidden', paddingRight: null },
  );
});

test('modal root cleanup helpers only remove owned empty roots', () => {
  const ownedRoot = {
    dataset: { owner: 'taska-modal-shell' },
    childElementCount: 0,
    isConnected: true,
  };
  const foreignRoot = {
    dataset: { owner: 'someone-else' },
    childElementCount: 0,
    isConnected: true,
  };

  assert.equal(shouldScheduleModalRootCleanup(ownedRoot), true);
  assert.equal(shouldCleanupModalRoot(ownedRoot), true);
  assert.equal(shouldScheduleModalRootCleanup(foreignRoot), false);
  assert.equal(shouldCleanupModalRoot({ ...ownedRoot, childElementCount: 1 }), false);
  assert.equal(shouldCleanupModalRoot({ ...ownedRoot, isConnected: false }), false);
});

test('modal stack change event helper keeps the shared event name', () => {
  assert.equal(createModalStackChangeEvent().type, 'taska:modal-stack-change');
});

test('modal runtime reuses the same root, tracks stack order, and restores body scroll', () => {
  const { body, documentRef, windowRef } = createRuntimeEnvironment();
  const runtime = createModalShellRuntime({ documentRef, windowRef });

  const root = runtime.ensureModalRoot();
  const sameRoot = runtime.ensureModalRoot();

  assert.equal(root, sameRoot);
  assert.equal(root.dataset.owner, 'taska-modal-shell');

  runtime.registerModalInstance('first');
  runtime.registerModalInstance('second');
  assert.equal(runtime.isTopModalInstance('second'), true);
  assert.equal(runtime.hasActiveModals(), true);
  assert.deepEqual(windowRef.dispatchedEvents, ['taska:modal-stack-change', 'taska:modal-stack-change']);

  runtime.lockBodyScroll();
  assert.equal(body.style.overflow, 'hidden');
  assert.equal(body.style.paddingRight, '20px');

  runtime.lockBodyScroll();
  runtime.unlockBodyScroll();
  assert.equal(body.style.overflow, 'hidden');
  assert.equal(body.style.paddingRight, '20px');

  runtime.unlockBodyScroll();
  assert.equal(body.style.overflow, 'auto');
  assert.equal(body.style.paddingRight, '2px');

  runtime.unregisterModalInstance('second');
  runtime.unregisterModalInstance('first');
  assert.equal(runtime.hasActiveModals(), false);

  runtime.scheduleModalRootCleanup(root);
  assert.equal(root.removed, true);
});
