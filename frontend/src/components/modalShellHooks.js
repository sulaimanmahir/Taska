import { useEffect } from 'react';
import {
  isElementVisiblyFocusable,
  shouldRememberDialogFocusTarget,
} from './modalShellDom.js';
import {
  resolveCloseGuardFocusTarget,
  resolveCloseGuardReturnFocusState,
  resolveModalOpenFocusTarget,
} from './modalShellFocus.js';
import { observeModalScrollArea } from './modalShellScroll.js';
import {
  MODAL_STACK_CHANGE_EVENT,
  modalShellRuntime,
} from './modalShellRuntime.js';

export function shouldRestoreModalTriggerFocus({
  hasActiveModals = false,
  previouslyFocusedElement = null,
}) {
  return !hasActiveModals && isElementVisiblyFocusable(previouslyFocusedElement);
}

export function shouldTrackModalDialogFocus({
  isTopModal = false,
  dialog = null,
}) {
  return Boolean(isTopModal && dialog instanceof HTMLElement);
}

export function shouldDismissStaleCloseGuardRequest({
  closeGuardRequested = false,
  shouldGuardClose = false,
}) {
  return Boolean(closeGuardRequested && !shouldGuardClose);
}

export function shouldFocusModalCloseGuard({
  isCloseGuardActive = false,
  isTopModal = false,
}) {
  return Boolean(isCloseGuardActive && isTopModal);
}

export function shouldRestoreDialogFocusAfterCloseGuard({
  wasCloseGuardOpen = false,
  isCloseGuardActive = false,
  isTopModal = false,
  dialog = null,
}) {
  return Boolean(wasCloseGuardOpen && !isCloseGuardActive && isTopModal && dialog);
}

export function shouldScheduleModalOpenFocus({
  portalRoot = null,
  isTopModal = false,
}) {
  return Boolean(portalRoot && isTopModal);
}

export function useModalShellRuntimeEffects({
  instanceId,
  portalRoot,
  previouslyFocusedElementRef,
  runtime = modalShellRuntime,
  setIsTopModal,
}) {
  useEffect(() => {
    if (!portalRoot || !runtime) {
      return undefined;
    }

    previouslyFocusedElementRef.current = document.activeElement;
    runtime.registerModalInstance(instanceId);
    runtime.lockBodyScroll();

    const updateTopModalState = () => {
      setIsTopModal(runtime.isTopModalInstance(instanceId));
    };

    updateTopModalState();
    window.addEventListener(MODAL_STACK_CHANGE_EVENT, updateTopModalState);

    return () => {
      window.removeEventListener(MODAL_STACK_CHANGE_EVENT, updateTopModalState);
      runtime.unregisterModalInstance(instanceId);
      runtime.unlockBodyScroll();
      runtime.scheduleModalRootCleanup(portalRoot);

      if (shouldRestoreModalTriggerFocus({
        hasActiveModals: runtime.hasActiveModals(),
        previouslyFocusedElement: previouslyFocusedElementRef.current,
      })) {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [instanceId, portalRoot, previouslyFocusedElementRef, runtime, setIsTopModal]);
}

export function useModalShellOpenFocusEffect({
  portalRoot,
  isTopModal,
  dialogRef,
  closeGuardRef,
  closeGuardCancelButtonRef,
  isCloseGuardActive,
  lastFocusedWithinDialogRef,
}) {
  useEffect(() => {
    if (!shouldScheduleModalOpenFocus({ portalRoot, isTopModal })) {
      return undefined;
    }

    const dialog = dialogRef.current;
    const focusFrame = window.requestAnimationFrame(() => {
      const preferredFocusTarget = resolveModalOpenFocusTarget({
        activeElement: document.activeElement,
        closeGuard: closeGuardRef.current,
        closeGuardCancelButton: closeGuardCancelButtonRef.current,
        dialog,
        isCloseGuardActive,
        rememberedDialogTarget: lastFocusedWithinDialogRef.current,
      });

      preferredFocusTarget?.focus?.();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
    };
  }, [
    closeGuardCancelButtonRef,
    closeGuardRef,
    dialogRef,
    isCloseGuardActive,
    isTopModal,
    lastFocusedWithinDialogRef,
    portalRoot,
  ]);
}

export function useModalShellDialogFocusTrackingEffect({
  isTopModal,
  dialogRef,
  closeGuardRef,
  lastFocusedWithinDialogRef,
}) {
  useEffect(() => {
    const dialog = dialogRef.current;

    if (!shouldTrackModalDialogFocus({ isTopModal, dialog })) {
      return undefined;
    }

    const handleFocusIn = (event) => {
      if (shouldRememberDialogFocusTarget(event.target, dialog, closeGuardRef.current)) {
        lastFocusedWithinDialogRef.current = event.target;
      }
    };

    dialog.addEventListener('focusin', handleFocusIn);

    return () => {
      dialog.removeEventListener('focusin', handleFocusIn);
    };
  }, [closeGuardRef, dialogRef, isTopModal, lastFocusedWithinDialogRef]);
}

export function useModalShellCloseGuardRequestEffect({
  closeGuardRequested,
  shouldGuardClose,
  setCloseGuardRequested,
}) {
  useEffect(() => {
    if (!shouldDismissStaleCloseGuardRequest({ closeGuardRequested, shouldGuardClose })) {
      return undefined;
    }

    const closeGuardFrame = window.requestAnimationFrame(() => {
      setCloseGuardRequested(false);
    });

    return () => {
      window.cancelAnimationFrame(closeGuardFrame);
    };
  }, [closeGuardRequested, setCloseGuardRequested, shouldGuardClose]);
}

export function useModalShellCloseGuardFocusEffect({
  isCloseGuardActive,
  isTopModal,
  closeGuardRef,
  closeGuardCancelButtonRef,
}) {
  useEffect(() => {
    if (!shouldFocusModalCloseGuard({ isCloseGuardActive, isTopModal })) {
      return undefined;
    }

    const focusFrame = window.requestAnimationFrame(() => {
      resolveCloseGuardFocusTarget({
        activeElement: document.activeElement,
        closeGuard: closeGuardRef.current,
        closeGuardCancelButton: closeGuardCancelButtonRef.current,
      })?.focus?.();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
    };
  }, [closeGuardCancelButtonRef, closeGuardRef, isCloseGuardActive, isTopModal]);
}

export function useModalShellCloseGuardRestoreFocusEffect({
  isCloseGuardActive,
  isTopModal,
  dialogRef,
  closeGuardDismissIntentRef,
  closeGuardReturnFocusRef,
  lastFocusedWithinDialogRef,
  wasCloseGuardOpenRef,
}) {
  useEffect(() => {
    const dialog = dialogRef.current;
    const shouldRestoreFocus = shouldRestoreDialogFocusAfterCloseGuard({
      wasCloseGuardOpen: wasCloseGuardOpenRef.current,
      isCloseGuardActive,
      isTopModal,
      dialog,
    });

    wasCloseGuardOpenRef.current = isCloseGuardActive;

    if (!shouldRestoreFocus) {
      return undefined;
    }

    const focusFrame = window.requestAnimationFrame(() => {
      const {
        focusTarget,
        nextDismissIntent,
        nextRememberedDialogTarget,
        nextReturnFocusTarget,
      } = resolveCloseGuardReturnFocusState({
        activeElement: document.activeElement,
        dialog,
        dismissIntent: closeGuardDismissIntentRef.current,
        rememberedDialogTarget: lastFocusedWithinDialogRef.current,
        returnFocusTarget: closeGuardReturnFocusRef.current,
      });

      closeGuardDismissIntentRef.current = nextDismissIntent;
      closeGuardReturnFocusRef.current = nextReturnFocusTarget;
      lastFocusedWithinDialogRef.current = nextRememberedDialogTarget;
      focusTarget?.focus?.();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
    };
  }, [
    closeGuardDismissIntentRef,
    closeGuardReturnFocusRef,
    dialogRef,
    isCloseGuardActive,
    isTopModal,
    lastFocusedWithinDialogRef,
    wasCloseGuardOpenRef,
  ]);
}

export function useModalShellScrollEffect({
  scrollAreaRef,
  setScrollState,
}) {
  useEffect(() => {
    return observeModalScrollArea({
      scrollArea: scrollAreaRef.current,
      setScrollState,
    });
  }, [scrollAreaRef, setScrollState]);
}
