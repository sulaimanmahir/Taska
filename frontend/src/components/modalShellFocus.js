import {
  getModalFocusTrapRedirectIndex,
  normalizeModalCloseRequestSource,
  shouldRestoreFocusForModalCloseSource,
} from '../lib/modalShell.js';
import {
  getCloseGuardFocusTarget,
  getFocusableElements,
  getPreferredDialogFocusTarget,
  isActiveCloseGuardFocus,
  isActiveWorkingDialogFocus,
  isElementVisiblyFocusable,
  shouldRememberDialogFocusTarget,
} from './modalShellDom.js';

export function resolveModalOpenFocusTarget({
  activeElement,
  closeGuard,
  closeGuardCancelButton,
  dialog,
  isCloseGuardActive = false,
  rememberedDialogTarget = null,
}) {
  if (!(dialog instanceof HTMLElement) || !dialog.isConnected) {
    return null;
  }

  if (isCloseGuardActive && isActiveCloseGuardFocus(activeElement, closeGuard)) {
    return null;
  }

  if (isActiveWorkingDialogFocus(activeElement, dialog, closeGuard)) {
    return null;
  }

  return isCloseGuardActive
    ? getCloseGuardFocusTarget(closeGuard, closeGuardCancelButton)
    : getPreferredDialogFocusTarget(dialog, rememberedDialogTarget);
}

export function resolveCloseGuardFocusTarget({
  activeElement,
  closeGuard,
  closeGuardCancelButton,
}) {
  if (isActiveCloseGuardFocus(activeElement, closeGuard)) {
    return null;
  }

  return getCloseGuardFocusTarget(closeGuard, closeGuardCancelButton);
}

export function buildCloseGuardRequestState({
  source = 'generic',
  activeElement,
  dialog,
}) {
  const normalizedSource = normalizeModalCloseRequestSource(source);

  return {
    normalizedSource,
    returnFocusTarget: shouldRestoreFocusForModalCloseSource(normalizedSource)
      && shouldRememberDialogFocusTarget(activeElement, dialog)
      ? activeElement
      : null,
  };
}

export function resolveCloseGuardReturnFocusState({
  activeElement,
  dialog,
  dismissIntent = 'return',
  rememberedDialogTarget = null,
  returnFocusTarget = null,
}) {
  if (!(dialog instanceof HTMLElement) || !dialog.isConnected) {
    return {
      focusTarget: null,
      nextDismissIntent: 'return',
      nextRememberedDialogTarget: rememberedDialogTarget,
      nextReturnFocusTarget: null,
    };
  }

  if (dismissIntent === 'suppress') {
    return {
      focusTarget: dialog,
      nextDismissIntent: 'return',
      nextRememberedDialogTarget: null,
      nextReturnFocusTarget: null,
    };
  }

  if (isActiveWorkingDialogFocus(activeElement, dialog)) {
    return {
      focusTarget: null,
      nextDismissIntent: dismissIntent,
      nextRememberedDialogTarget: rememberedDialogTarget,
      nextReturnFocusTarget: null,
    };
  }

  if (isElementVisiblyFocusable(returnFocusTarget) && dialog.contains(returnFocusTarget)) {
    return {
      focusTarget: returnFocusTarget,
      nextDismissIntent: dismissIntent,
      nextRememberedDialogTarget: rememberedDialogTarget,
      nextReturnFocusTarget: null,
    };
  }

  return {
    focusTarget: getPreferredDialogFocusTarget(dialog, rememberedDialogTarget),
    nextDismissIntent: dismissIntent,
    nextRememberedDialogTarget: rememberedDialogTarget,
    nextReturnFocusTarget: null,
  };
}

export function resolveFocusTrapTarget({
  activeElement,
  focusScope,
  key = 'Tab',
  shiftKey = false,
}) {
  if (!(focusScope instanceof HTMLElement)) {
    return {
      focusTarget: null,
      shouldPreventDefault: false,
    };
  }

  const focusableElements = getFocusableElements(focusScope);

  if (focusableElements.length === 0) {
    return {
      focusTarget: focusScope,
      shouldPreventDefault: true,
    };
  }

  const redirectIndex = getModalFocusTrapRedirectIndex({
    key,
    shiftKey,
    activeIndex: focusableElements.findIndex((element) => element === activeElement),
    itemCount: focusableElements.length,
    containsActiveElement: focusScope.contains(activeElement),
  });

  if (redirectIndex < 0) {
    return {
      focusTarget: null,
      shouldPreventDefault: false,
    };
  }

  return {
    focusTarget: focusableElements[redirectIndex] ?? null,
    shouldPreventDefault: true,
  };
}
