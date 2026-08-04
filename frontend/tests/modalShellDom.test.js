import test, { after } from 'node:test';
import assert from 'node:assert/strict';

import {
  getCloseGuardFocusTarget,
  getFocusableElements,
  getPreferredDialogFocusTarget,
  isActiveCloseGuardFocus,
  isElementVisiblyFocusable,
  isModalDismissControl,
  shouldRememberDialogFocusTarget,
} from '../src/components/modalShellDom.js';

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

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }

  getClientRects() {
    return Array.from({ length: this.rectCount }, () => ({}));
  }

  querySelectorAll() {
    if (arguments[0] === '[data-autofocus="true"]') {
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

test('modal dom helper filters out hidden, disconnected, and inert focus targets', () => {
  const visibleButton = new FakeHTMLElement();
  const disconnectedButton = new FakeHTMLElement({ connected: false });
  const hiddenButton = new FakeHTMLElement({ style: { display: 'none' } });
  const inertButton = new FakeHTMLElement({ attributes: { inert: '' } });
  const parentHiddenButton = new FakeHTMLElement({ hiddenAncestor: { id: 'hidden' } });
  const zeroRectButton = new FakeHTMLElement({ rectCount: 0 });

  assert.equal(isElementVisiblyFocusable(visibleButton), true);
  assert.equal(isElementVisiblyFocusable(disconnectedButton), false);
  assert.equal(isElementVisiblyFocusable(hiddenButton), false);
  assert.equal(isElementVisiblyFocusable(inertButton), false);
  assert.equal(isElementVisiblyFocusable(parentHiddenButton), false);
  assert.equal(isElementVisiblyFocusable(zeroRectButton), false);
});

test('modal dom helper returns only focusable descendants from a dialog scope', () => {
  const focusable = new FakeHTMLElement();
  const disabled = new FakeHTMLElement({ attributes: { disabled: '' } });
  const hidden = new FakeHTMLElement({ attributes: { 'aria-hidden': 'true' } });
  const dialog = new FakeHTMLElement({ children: [focusable, disabled, hidden] });

  assert.deepEqual(getFocusableElements(dialog), [focusable]);
});

test('modal dom helper recognizes dismiss controls and skips them for remembered focus', () => {
  const dismissButton = new FakeHTMLElement({ attributes: { 'data-modal-dismiss': 'true' } });
  const workingField = new FakeHTMLElement();
  const closeGuard = new FakeHTMLElement({ children: [dismissButton] });
  const dialog = new FakeHTMLElement({ children: [dismissButton, workingField] });

  assert.equal(isModalDismissControl(dismissButton), true);
  assert.equal(shouldRememberDialogFocusTarget(dismissButton, dialog), false);
  assert.equal(shouldRememberDialogFocusTarget(workingField, dialog), true);
  assert.equal(shouldRememberDialogFocusTarget(dismissButton, dialog, closeGuard), false);
});

test('modal dom helper keeps close-guard focus and dialog focus separated', () => {
  const guardButton = new FakeHTMLElement();
  const formField = new FakeHTMLElement();
  const closeGuard = new FakeHTMLElement({ children: [guardButton] });
  const dialog = new FakeHTMLElement({ children: [formField, closeGuard] });

  assert.equal(isActiveCloseGuardFocus(guardButton, closeGuard), true);
  assert.equal(isActiveCloseGuardFocus(formField, closeGuard), false);
  assert.equal(shouldRememberDialogFocusTarget(guardButton, dialog, closeGuard), false);
  assert.equal(shouldRememberDialogFocusTarget(formField, dialog, closeGuard), true);
});

test('modal dom helper prefers remembered dialog focus and otherwise falls back to the first working target', () => {
  const dismissButton = new FakeHTMLElement({ attributes: { 'data-modal-dismiss': 'true' } });
  const formField = new FakeHTMLElement();
  const dialog = new FakeHTMLElement({ children: [dismissButton, formField] });

  assert.equal(getPreferredDialogFocusTarget(dialog, formField), formField);
  assert.equal(getPreferredDialogFocusTarget(dialog, dismissButton), formField);
});

test('modal dom helper resolves close-guard focus from autofocus, then cancel button, then scope fallback', () => {
  const autoFocusField = new FakeHTMLElement({ attributes: { 'data-autofocus': 'true' } });
  const secondaryField = new FakeHTMLElement();
  const cancelButton = new FakeHTMLElement();
  const guardWithAutofocus = new FakeHTMLElement({ children: [autoFocusField, secondaryField] });
  const guardWithoutAutofocus = new FakeHTMLElement({ children: [secondaryField] });
  const emptyGuard = new FakeHTMLElement({ children: [] });

  assert.equal(getCloseGuardFocusTarget(guardWithAutofocus, cancelButton), autoFocusField);
  assert.equal(getCloseGuardFocusTarget(guardWithoutAutofocus, cancelButton), cancelButton);
  assert.equal(getCloseGuardFocusTarget(emptyGuard, null), emptyGuard);
});
