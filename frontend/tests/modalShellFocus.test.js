import test, { after } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCloseGuardRequestState,
  resolveCloseGuardFocusTarget,
  resolveCloseGuardReturnFocusState,
  resolveFocusTrapTarget,
  resolveModalOpenFocusTarget,
} from '../src/components/modalShellFocus.js';

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

  focus() {
    this.focusCalls += 1;
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
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

test('modal focus helper resolves dialog and close-guard focus targets without overriding valid active focus', () => {
  const dismissButton = new FakeHTMLElement({ attributes: { 'data-modal-dismiss': 'true' } });
  const workingField = new FakeHTMLElement();
  const guardButton = new FakeHTMLElement({ attributes: { 'data-autofocus': 'true' } });
  const closeGuard = new FakeHTMLElement({ children: [guardButton] });
  const dialog = new FakeHTMLElement({ children: [dismissButton, workingField, closeGuard] });

  assert.equal(resolveModalOpenFocusTarget({
    activeElement: null,
    closeGuard,
    closeGuardCancelButton: null,
    dialog,
    isCloseGuardActive: false,
    rememberedDialogTarget: workingField,
  }), workingField);
  assert.equal(resolveModalOpenFocusTarget({
    activeElement: workingField,
    closeGuard,
    closeGuardCancelButton: null,
    dialog,
    isCloseGuardActive: false,
    rememberedDialogTarget: null,
  }), null);
  assert.equal(resolveModalOpenFocusTarget({
    activeElement: guardButton,
    closeGuard,
    closeGuardCancelButton: null,
    dialog,
    isCloseGuardActive: true,
    rememberedDialogTarget: workingField,
  }), null);
  assert.equal(resolveCloseGuardFocusTarget({
    activeElement: workingField,
    closeGuard,
    closeGuardCancelButton: null,
  }), guardButton);
});

test('modal focus helper only stores close-guard return focus for working dialog actions', () => {
  const dismissButton = new FakeHTMLElement({ attributes: { 'data-modal-dismiss': 'true' } });
  const workingField = new FakeHTMLElement();
  const dialog = new FakeHTMLElement({ children: [dismissButton, workingField] });

  assert.equal(buildCloseGuardRequestState({
    source: 'action',
    activeElement: workingField,
    dialog,
  }).returnFocusTarget, workingField);
  assert.equal(buildCloseGuardRequestState({
    source: 'close-button',
    activeElement: workingField,
    dialog,
  }).returnFocusTarget, null);
  assert.equal(buildCloseGuardRequestState({
    source: 'action',
    activeElement: dismissButton,
    dialog,
  }).returnFocusTarget, null);
});

test('modal focus helper restores dialog focus after dismissing the close guard', () => {
  const primaryField = new FakeHTMLElement();
  const secondaryField = new FakeHTMLElement();
  const dialog = new FakeHTMLElement({ children: [primaryField, secondaryField] });

  assert.deepEqual(resolveCloseGuardReturnFocusState({
    activeElement: null,
    dialog,
    dismissIntent: 'suppress',
    rememberedDialogTarget: primaryField,
    returnFocusTarget: secondaryField,
  }), {
    focusTarget: dialog,
    nextDismissIntent: 'return',
    nextRememberedDialogTarget: null,
    nextReturnFocusTarget: null,
  });

  assert.deepEqual(resolveCloseGuardReturnFocusState({
    activeElement: null,
    dialog,
    dismissIntent: 'return',
    rememberedDialogTarget: primaryField,
    returnFocusTarget: secondaryField,
  }), {
    focusTarget: secondaryField,
    nextDismissIntent: 'return',
    nextRememberedDialogTarget: primaryField,
    nextReturnFocusTarget: null,
  });

  const detachedButton = new FakeHTMLElement({ connected: false });
  assert.deepEqual(resolveCloseGuardReturnFocusState({
    activeElement: null,
    dialog,
    dismissIntent: 'return',
    rememberedDialogTarget: primaryField,
    returnFocusTarget: detachedButton,
  }), {
    focusTarget: primaryField,
    nextDismissIntent: 'return',
    nextRememberedDialogTarget: primaryField,
    nextReturnFocusTarget: null,
  });
});

test('modal focus helper preserves active working focus and safely handles disconnected dialogs after closing the guard', () => {
  const workingField = new FakeHTMLElement();
  const dialog = new FakeHTMLElement({ children: [workingField] });

  assert.deepEqual(resolveCloseGuardReturnFocusState({
    activeElement: workingField,
    dialog,
    dismissIntent: 'return',
    rememberedDialogTarget: workingField,
    returnFocusTarget: null,
  }), {
    focusTarget: null,
    nextDismissIntent: 'return',
    nextRememberedDialogTarget: workingField,
    nextReturnFocusTarget: null,
  });

  dialog.isConnected = false;
  assert.deepEqual(resolveCloseGuardReturnFocusState({
    activeElement: null,
    dialog,
    dismissIntent: 'suppress',
    rememberedDialogTarget: workingField,
    returnFocusTarget: workingField,
  }), {
    focusTarget: null,
    nextDismissIntent: 'return',
    nextRememberedDialogTarget: workingField,
    nextReturnFocusTarget: null,
  });
});

test('modal focus helper resolves trap targets for empty scopes, off-scope focus, and wraparound tabbing', () => {
  const emptyScope = new FakeHTMLElement({ children: [] });
  const firstField = new FakeHTMLElement();
  const secondField = new FakeHTMLElement();
  const focusScope = new FakeHTMLElement({ children: [firstField, secondField] });
  const outsideField = new FakeHTMLElement();

  assert.deepEqual(resolveFocusTrapTarget({
    activeElement: null,
    focusScope: emptyScope,
  }), {
    focusTarget: emptyScope,
    shouldPreventDefault: true,
  });

  assert.deepEqual(resolveFocusTrapTarget({
    activeElement: outsideField,
    focusScope,
  }), {
    focusTarget: firstField,
    shouldPreventDefault: true,
  });

  assert.deepEqual(resolveFocusTrapTarget({
    activeElement: secondField,
    focusScope,
  }), {
    focusTarget: firstField,
    shouldPreventDefault: true,
  });

  assert.deepEqual(resolveFocusTrapTarget({
    activeElement: firstField,
    focusScope,
    shiftKey: true,
  }), {
    focusTarget: secondField,
    shouldPreventDefault: true,
  });
});
