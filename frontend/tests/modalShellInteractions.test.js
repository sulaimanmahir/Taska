import test, { after } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCloseGuardCancelUpdate,
  buildCloseGuardConfirmUpdate,
  buildCloseGuardRequestUpdate,
  useModalShellInteractionHandlers,
  resolveModalKeyDownAction,
  shouldAllowModalBackdropClose,
} from '../src/components/modalShellInteractions.js';

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
    this.focusCalls = 0;

    for (const child of children) {
      child.parentElement = {
        closest: () => child.hiddenAncestor ?? null,
      };
    }
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  focus() {
    this.focusCalls += 1;
  }

  getClientRects() {
    return Array.from({ length: this.rectCount }, () => ({}));
  }

  querySelectorAll(selector) {
    if (selector === '[data-autofocus="true"]') {
      return this.children.filter((child) => child.getAttribute('data-autofocus') === 'true');
    }

    return this.children;
  }

  contains(target) {
    if (target === this) {
      return true;
    }

    return this.children.some((child) => child.contains(target));
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

test('modal interaction helper only allows backdrop close for active top-level working dialogs', () => {
  assert.equal(shouldAllowModalBackdropClose({
    closeOnBackdrop: true,
    isTopModal: true,
    isCloseGuardActive: false,
  }), true);
  assert.equal(shouldAllowModalBackdropClose({
    closeOnBackdrop: false,
    isTopModal: true,
    isCloseGuardActive: false,
  }), false);
  assert.equal(shouldAllowModalBackdropClose({
    closeOnBackdrop: true,
    isTopModal: false,
    isCloseGuardActive: false,
  }), false);
  assert.equal(shouldAllowModalBackdropClose({
    closeOnBackdrop: true,
    isTopModal: true,
    isCloseGuardActive: true,
  }), false);
});

test('modal interaction helper resolves escape, tab, and ignored keydown actions predictably', () => {
  assert.deepEqual(resolveModalKeyDownAction({
    key: 'Escape',
    isTopModal: true,
    isCloseGuardActive: true,
    closeOnEscape: true,
  }), {
    type: 'dismiss-close-guard',
    shouldPreventDefault: true,
  });

  assert.deepEqual(resolveModalKeyDownAction({
    key: 'Escape',
    isTopModal: true,
    isCloseGuardActive: false,
    closeOnEscape: true,
  }), {
    type: 'request-close',
    closeSource: 'escape',
    shouldPreventDefault: true,
  });

  assert.deepEqual(resolveModalKeyDownAction({
    key: 'Tab',
    isTopModal: true,
    isCloseGuardActive: false,
    closeOnEscape: false,
  }), {
    type: 'trap-focus',
    shouldPreventDefault: false,
  });

  assert.deepEqual(resolveModalKeyDownAction({
    key: 'Escape',
    isTopModal: false,
    isCloseGuardActive: false,
    closeOnEscape: true,
  }), {
    type: 'ignore',
    shouldPreventDefault: false,
  });
});

test('modal interaction helper builds close-guard request updates with action-aware return focus', () => {
  const dismissButton = new FakeHTMLElement({ attributes: { 'data-modal-dismiss': 'true' } });
  const workingField = new FakeHTMLElement();
  const dialog = new FakeHTMLElement({ children: [dismissButton, workingField] });

  assert.deepEqual(buildCloseGuardRequestUpdate({
    source: 'action',
    activeElement: workingField,
    dialog,
  }), {
    closeGuardRequested: true,
    dismissIntent: 'return',
    returnFocusTarget: workingField,
  });

  assert.deepEqual(buildCloseGuardRequestUpdate({
    source: 'backdrop',
    activeElement: workingField,
    dialog,
  }), {
    closeGuardRequested: true,
    dismissIntent: 'return',
    returnFocusTarget: null,
  });

  assert.deepEqual(buildCloseGuardRequestUpdate({
    source: 'action',
    activeElement: dismissButton,
    dialog,
  }), {
    closeGuardRequested: true,
    dismissIntent: 'return',
    returnFocusTarget: null,
  });
});

test('modal interaction helper keeps cancel and confirm close-guard state transitions aligned', () => {
  assert.deepEqual(buildCloseGuardCancelUpdate(), {
    closeGuardRequested: false,
    dismissIntent: 'return',
  });

  assert.deepEqual(buildCloseGuardConfirmUpdate(), {
    closeGuardRequested: false,
    dismissIntent: 'suppress',
    returnFocusTarget: null,
    shouldClose: true,
  });
});

test('modal interaction handler factory routes guarded closes, guard dismissal, and tab trapping correctly', () => {
  const actionField = new FakeHTMLElement();
  const actionDialog = new FakeHTMLElement({ children: [actionField] });
  const closeGuardDismissIntentRef = { current: 'return' };
  const closeGuardReturnFocusRef = { current: null };
  const closeGuardRequestedUpdates = [];

  const guardedHandlers = useModalShellInteractionHandlers({
    closeGuardDismissIntentRef,
    closeGuardRef: { current: null },
    closeGuardReturnFocusRef,
    closeOnEscape: true,
    dialogRef: { current: actionDialog },
    getActiveElement: () => actionField,
    isCloseGuardActive: false,
    isTopModal: true,
    onClose() {
      throw new Error('onClose should not run before the guard confirms');
    },
    setCloseGuardRequested(value) {
      closeGuardRequestedUpdates.push(value);
    },
    shouldGuardClose: true,
  });

  guardedHandlers.requestClose('action');
  assert.equal(closeGuardDismissIntentRef.current, 'return');
  assert.equal(closeGuardReturnFocusRef.current, actionField);
  assert.deepEqual(closeGuardRequestedUpdates, [true]);

  const escapeUpdates = [];
  const activeGuardDismissIntentRef = { current: 'suppress' };
  const activeGuardHandlers = useModalShellInteractionHandlers({
    closeGuardDismissIntentRef: activeGuardDismissIntentRef,
    closeGuardRef: { current: null },
    closeGuardReturnFocusRef: { current: actionField },
    closeOnEscape: true,
    dialogRef: { current: actionDialog },
    getActiveElement: () => actionField,
    isCloseGuardActive: true,
    isTopModal: true,
    onClose() {
      throw new Error('onClose should not run when dismissing an active guard');
    },
    setCloseGuardRequested(value) {
      escapeUpdates.push(value);
    },
    shouldGuardClose: true,
  });

  const escapeEvent = {
    key: 'Escape',
    prevented: false,
    preventDefault() {
      this.prevented = true;
    },
  };

  activeGuardHandlers.handleDialogKeyDown(escapeEvent);
  assert.equal(escapeEvent.prevented, true);
  assert.equal(activeGuardDismissIntentRef.current, 'return');
  assert.deepEqual(escapeUpdates, [false]);

  const emptyDialog = new FakeHTMLElement({ children: [] });
  const trapHandlers = useModalShellInteractionHandlers({
    closeGuardDismissIntentRef: { current: 'return' },
    closeGuardRef: { current: null },
    closeGuardReturnFocusRef: { current: null },
    closeOnEscape: false,
    dialogRef: { current: emptyDialog },
    getActiveElement: () => null,
    isCloseGuardActive: false,
    isTopModal: true,
    onClose() {},
    setCloseGuardRequested() {},
    shouldGuardClose: false,
  });

  const tabEvent = {
    key: 'Tab',
    shiftKey: false,
    prevented: false,
    preventDefault() {
      this.prevented = true;
    },
  };

  trapHandlers.handleDialogKeyDown(tabEvent);
  assert.equal(tabEvent.prevented, true);
  assert.equal(emptyDialog.focusCalls, 1);
});
