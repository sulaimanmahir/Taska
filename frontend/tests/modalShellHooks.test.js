import test, { after } from 'node:test';
import assert from 'node:assert/strict';

import {
  shouldDismissStaleCloseGuardRequest,
  shouldFocusModalCloseGuard,
  shouldRestoreDialogFocusAfterCloseGuard,
  shouldRestoreModalTriggerFocus,
  shouldScheduleModalOpenFocus,
  shouldTrackModalDialogFocus,
} from '../src/components/modalShellHooks.js';

const previousHTMLElement = globalThis.HTMLElement;
const previousWindow = globalThis.window;

class FakeHTMLElement {
  constructor({
    attributes = {},
    children = [],
    connected = true,
    hiddenAncestor = null,
    rectCount = 1,
    style = {},
  } = {}) {
    this.attributes = new Map(Object.entries(attributes));
    this.children = children;
    this.isConnected = connected;
    this.hiddenAncestor = hiddenAncestor;
    this.rectCount = rectCount;
    this.computedStyle = {
      visibility: style.visibility ?? 'visible',
      display: style.display ?? 'block',
    };
    this.parentElement = {
      closest: () => this.hiddenAncestor,
    };
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  getClientRects() {
    return Array.from({ length: this.rectCount }, () => ({}));
  }
}

globalThis.HTMLElement = FakeHTMLElement;
globalThis.window = {
  getComputedStyle(element) {
    return element.computedStyle;
  },
};

after(() => {
  globalThis.HTMLElement = previousHTMLElement;
  globalThis.window = previousWindow;
});

test('modal hooks helper restores trigger focus only for visible elements when no other modals remain', () => {
  const visibleButton = new FakeHTMLElement();
  const hiddenButton = new FakeHTMLElement({ style: { display: 'none' } });

  assert.equal(shouldRestoreModalTriggerFocus({
    hasActiveModals: false,
    previouslyFocusedElement: visibleButton,
  }), true);
  assert.equal(shouldRestoreModalTriggerFocus({
    hasActiveModals: true,
    previouslyFocusedElement: visibleButton,
  }), false);
  assert.equal(shouldRestoreModalTriggerFocus({
    hasActiveModals: false,
    previouslyFocusedElement: hiddenButton,
  }), false);
});

test('modal hooks helper only tracks dialog focus for top-modal dialog elements', () => {
  const dialog = new FakeHTMLElement();

  assert.equal(shouldTrackModalDialogFocus({
    isTopModal: true,
    dialog,
  }), true);
  assert.equal(shouldTrackModalDialogFocus({
    isTopModal: false,
    dialog,
  }), false);
  assert.equal(shouldTrackModalDialogFocus({
    isTopModal: true,
    dialog: null,
  }), false);
});

test('modal hooks helper keeps close-guard request and focus gates aligned', () => {
  assert.equal(shouldDismissStaleCloseGuardRequest({
    closeGuardRequested: true,
    shouldGuardClose: false,
  }), true);
  assert.equal(shouldDismissStaleCloseGuardRequest({
    closeGuardRequested: true,
    shouldGuardClose: true,
  }), false);
  assert.equal(shouldFocusModalCloseGuard({
    isCloseGuardActive: true,
    isTopModal: true,
  }), true);
  assert.equal(shouldFocusModalCloseGuard({
    isCloseGuardActive: true,
    isTopModal: false,
  }), false);
});

test('modal hooks helper only restores dialog focus after a top-modal guard actually closes', () => {
  const dialog = new FakeHTMLElement();

  assert.equal(shouldRestoreDialogFocusAfterCloseGuard({
    wasCloseGuardOpen: true,
    isCloseGuardActive: false,
    isTopModal: true,
    dialog,
  }), true);
  assert.equal(shouldRestoreDialogFocusAfterCloseGuard({
    wasCloseGuardOpen: false,
    isCloseGuardActive: false,
    isTopModal: true,
    dialog,
  }), false);
  assert.equal(shouldRestoreDialogFocusAfterCloseGuard({
    wasCloseGuardOpen: true,
    isCloseGuardActive: true,
    isTopModal: true,
    dialog,
  }), false);
});

test('modal hooks helper only schedules modal open focus when a portal-backed top modal is active', () => {
  assert.equal(shouldScheduleModalOpenFocus({
    portalRoot: { id: 'modal-root' },
    isTopModal: true,
  }), true);
  assert.equal(shouldScheduleModalOpenFocus({
    portalRoot: null,
    isTopModal: true,
  }), false);
  assert.equal(shouldScheduleModalOpenFocus({
    portalRoot: { id: 'modal-root' },
    isTopModal: false,
  }), false);
});
