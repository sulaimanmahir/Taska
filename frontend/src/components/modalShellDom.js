export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function isElementVisiblyFocusable(element) {
  if (!(element instanceof HTMLElement) || !element.isConnected) {
    return false;
  }

  if (element.hasAttribute('disabled') || element.getAttribute('aria-hidden') === 'true') {
    return false;
  }

  if (element.getAttribute('tabindex') === '-1') {
    return false;
  }

  const hiddenAncestor = element.parentElement?.closest('[aria-hidden="true"], [inert]');

  if (hiddenAncestor) {
    return false;
  }

  const computedStyle = window.getComputedStyle(element);

  if (computedStyle.visibility === 'hidden' || computedStyle.display === 'none') {
    return false;
  }

  return element.getClientRects().length > 0 && !element.hasAttribute('inert');
}

export function getFocusableElements(dialog) {
  if (!dialog) {
    return [];
  }

  return [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)].filter((element) => isElementVisiblyFocusable(element));
}

export function getAutoFocusTarget(dialog, predicate = isElementVisiblyFocusable) {
  if (!(dialog instanceof HTMLElement)) {
    return null;
  }

  return [...dialog.querySelectorAll('[data-autofocus="true"]')].find((element) => predicate(element)) ?? null;
}

export function isModalDismissControl(element) {
  return element instanceof HTMLElement
    && (element.getAttribute('data-modal-close') === 'true' || element.getAttribute('data-modal-dismiss') === 'true');
}

export function shouldRememberDialogFocusTarget(element, dialog, closeGuard = null) {
  if (!(element instanceof HTMLElement) || element === dialog || !dialog?.contains(element)) {
    return false;
  }

  if (closeGuard instanceof HTMLElement && closeGuard.contains(element)) {
    return false;
  }

  return !isModalDismissControl(element) && isElementVisiblyFocusable(element);
}

export function getFirstWorkingDialogTarget(dialog) {
  if (!(dialog instanceof HTMLElement)) {
    return null;
  }

  return getFocusableElements(dialog).find((element) => shouldRememberDialogFocusTarget(element, dialog)) ?? null;
}

export function getInitialFocusTarget(dialog) {
  if (!dialog) {
    return null;
  }

  return getAutoFocusTarget(dialog, (element) => shouldRememberDialogFocusTarget(element, dialog))
    ?? getFirstWorkingDialogTarget(dialog)
    ?? getFocusableElements(dialog)[0]
    ?? dialog;
}

export function getPreferredDialogFocusTarget(dialog, rememberedTarget) {
  if (!(dialog instanceof HTMLElement)) {
    return null;
  }

  return shouldRememberDialogFocusTarget(rememberedTarget, dialog)
    ? rememberedTarget
    : getInitialFocusTarget(dialog);
}

export function isActiveWorkingDialogFocus(element, dialog, closeGuard = null) {
  return shouldRememberDialogFocusTarget(element, dialog, closeGuard);
}

export function isActiveCloseGuardFocus(element, closeGuard) {
  return closeGuard instanceof HTMLElement
    && element instanceof HTMLElement
    && closeGuard.contains(element)
    && isElementVisiblyFocusable(element);
}

export function getCloseGuardFocusTarget(closeGuard, cancelButton) {
  if (!(closeGuard instanceof HTMLElement) || !closeGuard.isConnected) {
    return null;
  }

  const autoFocusTarget = getAutoFocusTarget(closeGuard);

  if (autoFocusTarget) {
    return autoFocusTarget;
  }

  if (cancelButton instanceof HTMLElement && cancelButton.isConnected) {
    return cancelButton;
  }

  return getFocusableElements(closeGuard)[0] ?? closeGuard;
}
