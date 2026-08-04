import {
  buildCloseGuardRequestState,
  resolveFocusTrapTarget,
} from './modalShellFocus.js';

export function shouldAllowModalBackdropClose({
  closeOnBackdrop = false,
  isTopModal = true,
  isCloseGuardActive = false,
}) {
  return Boolean(closeOnBackdrop && isTopModal && !isCloseGuardActive);
}

export function resolveModalKeyDownAction({
  key,
  isTopModal = true,
  isCloseGuardActive = false,
  closeOnEscape = false,
}) {
  if (!isTopModal) {
    return {
      type: 'ignore',
      shouldPreventDefault: false,
    };
  }

  if (key === 'Escape' && isCloseGuardActive) {
    return {
      type: 'dismiss-close-guard',
      shouldPreventDefault: true,
    };
  }

  if (key === 'Escape' && closeOnEscape) {
    return {
      type: 'request-close',
      closeSource: 'escape',
      shouldPreventDefault: true,
    };
  }

  if (key === 'Tab') {
    return {
      type: 'trap-focus',
      shouldPreventDefault: false,
    };
  }

  return {
    type: 'ignore',
    shouldPreventDefault: false,
  };
}

export function buildCloseGuardRequestUpdate({
  source = 'generic',
  activeElement,
  dialog,
}) {
  return {
    closeGuardRequested: true,
    dismissIntent: 'return',
    returnFocusTarget: buildCloseGuardRequestState({
      source,
      activeElement,
      dialog,
    }).returnFocusTarget,
  };
}

export function buildCloseGuardCancelUpdate() {
  return {
    closeGuardRequested: false,
    dismissIntent: 'return',
  };
}

export function buildCloseGuardConfirmUpdate() {
  return {
    closeGuardRequested: false,
    dismissIntent: 'suppress',
    returnFocusTarget: null,
    shouldClose: true,
  };
}

export function useModalShellInteractionHandlers({
  closeGuardDismissIntentRef,
  closeGuardRef,
  closeGuardReturnFocusRef,
  closeOnEscape = false,
  dialogRef,
  getActiveElement = () => document.activeElement,
  isCloseGuardActive = false,
  isTopModal = true,
  onClose,
  setCloseGuardRequested,
  shouldGuardClose = false,
}) {
  const showUnsavedChangesGuard = (source = 'generic') => {
    const {
      closeGuardRequested: nextCloseGuardRequested,
      dismissIntent,
      returnFocusTarget,
    } = buildCloseGuardRequestUpdate({
      source,
      activeElement: getActiveElement(),
      dialog: dialogRef.current,
    });

    closeGuardDismissIntentRef.current = dismissIntent;
    closeGuardReturnFocusRef.current = returnFocusTarget;
    setCloseGuardRequested(nextCloseGuardRequested);
  };

  const requestClose = (source = 'generic') => {
    if (isCloseGuardActive) {
      return;
    }

    if (shouldGuardClose) {
      showUnsavedChangesGuard(source);
      return;
    }

    onClose();
  };

  const dismissCloseGuard = () => {
    const { closeGuardRequested: nextCloseGuardRequested, dismissIntent } = buildCloseGuardCancelUpdate();
    closeGuardDismissIntentRef.current = dismissIntent;
    setCloseGuardRequested(nextCloseGuardRequested);
  };

  const confirmCloseGuard = () => {
    const {
      closeGuardRequested: nextCloseGuardRequested,
      dismissIntent,
      returnFocusTarget,
      shouldClose,
    } = buildCloseGuardConfirmUpdate();

    closeGuardDismissIntentRef.current = dismissIntent;
    closeGuardReturnFocusRef.current = returnFocusTarget;
    setCloseGuardRequested(nextCloseGuardRequested);

    if (shouldClose) {
      onClose();
    }
  };

  const trapFocus = (event) => {
    if (!isTopModal || event.key !== 'Tab') {
      return;
    }

    const dialog = dialogRef.current;
    const focusScope = isCloseGuardActive ? closeGuardRef.current : dialog;

    if (!dialog || !focusScope) {
      return;
    }

    const { focusTarget, shouldPreventDefault } = resolveFocusTrapTarget({
      activeElement: getActiveElement(),
      focusScope,
      key: event.key,
      shiftKey: event.shiftKey,
    });

    if (!shouldPreventDefault) {
      return;
    }

    event.preventDefault();
    focusTarget?.focus?.();
  };

  const handleDialogKeyDown = (event) => {
    const { type, closeSource, shouldPreventDefault } = resolveModalKeyDownAction({
      key: event.key,
      isTopModal,
      isCloseGuardActive,
      closeOnEscape,
    });

    if (shouldPreventDefault) {
      event.preventDefault();
    }

    if (type === 'dismiss-close-guard') {
      dismissCloseGuard();
      return;
    }

    if (type === 'request-close') {
      requestClose(closeSource);
      return;
    }

    if (type === 'trap-focus') {
      trapFocus(event);
    }
  };

  return {
    confirmCloseGuard,
    dismissCloseGuard,
    handleDialogKeyDown,
    requestClose,
  };
}
