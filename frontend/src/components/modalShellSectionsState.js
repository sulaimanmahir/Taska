import { shouldRenderModalHeaderMeta } from './modalShellView.js';

const MODAL_SHELL_FRAME_BACKDROP_CLASS_NAME = 'modal-backdrop modal-backdrop-enter items-end px-0 sm:items-center sm:px-4';
const MODAL_SHELL_CLOSE_BUTTON_BASE_CLASS_NAME = 'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-3';
const MODAL_SHELL_CLOSE_GUARD_PANEL_BASE_CLASS_NAME = 'mb-3.5 rounded-[1.5rem] border px-3.5 py-2.5 shadow-[var(--shadow-sm)]';
const MODAL_SHELL_CLOSE_GUARD_SECONDARY_BUTTON_BASE_CLASS_NAME = 'rounded-xl border px-3 py-1.5 text-sm font-medium transition';
const MODAL_SHELL_CLOSE_GUARD_PRIMARY_BUTTON_BASE_CLASS_NAME = 'rounded-xl px-3 py-1.5 text-sm font-semibold transition';

export function buildModalShellContextValue({
  requestClose,
  busy = false,
  draftState = null,
  isCloseGuardActive = false,
} = {}) {
  return {
    requestClose,
    isBusy: busy,
    draftState,
    showCloseGuard: isCloseGuardActive,
    isCloseGuardActive,
  };
}

export function buildModalShellHeaderMetaState({
  headerAction = null,
  resolvedHeaderBadgeLabel = '',
  draftState = null,
} = {}) {
  return {
    shouldRender: shouldRenderModalHeaderMeta({
      headerAction,
      hasHeaderBadge: Boolean(resolvedHeaderBadgeLabel),
      hasDraftState: Boolean(draftState),
    }),
    hasHeaderBadge: Boolean(resolvedHeaderBadgeLabel),
    hasDraftState: Boolean(draftState),
  };
}

export function getModalShellHeaderSectionClassName({
  headerLayoutClassName = '',
  stickyHeaderClassName = '',
  headerClassName = '',
} = {}) {
  return [
    headerLayoutClassName,
    stickyHeaderClassName,
    headerClassName,
  ].filter(Boolean).join(' ');
}

export function getModalShellCloseButtonClassName({
  closeButtonToneClassName = '',
} = {}) {
  return [
    MODAL_SHELL_CLOSE_BUTTON_BASE_CLASS_NAME,
    closeButtonToneClassName,
  ].filter(Boolean).join(' ');
}

export function buildModalShellCloseGuardViewModel({
  closeGuardToneClasses = {},
} = {}) {
  return {
    panelClassName: [
      MODAL_SHELL_CLOSE_GUARD_PANEL_BASE_CLASS_NAME,
      closeGuardToneClasses.panel,
    ].filter(Boolean).join(' '),
    messageClassName: [
      'mt-1 text-sm',
      closeGuardToneClasses.body,
    ].filter(Boolean).join(' '),
    secondaryButtonClassName: [
      MODAL_SHELL_CLOSE_GUARD_SECONDARY_BUTTON_BASE_CLASS_NAME,
      closeGuardToneClasses.secondary,
    ].filter(Boolean).join(' '),
    primaryButtonClassName: [
      MODAL_SHELL_CLOSE_GUARD_PRIMARY_BUTTON_BASE_CLASS_NAME,
      closeGuardToneClasses.primary,
    ].filter(Boolean).join(' '),
  };
}

export function buildModalShellContentSectionState({
  guardedContentProps = {},
  requestClose,
  busy = false,
  draftState = null,
  isCloseGuardActive = false,
  statusStrip = null,
} = {}) {
  return {
    contentAttributes: {
      ariaHidden: guardedContentProps.ariaHidden,
      inert: guardedContentProps.inert,
      className: guardedContentProps.className,
    },
    shouldRenderStatusStrip: Boolean(statusStrip),
    onCloseButton: () => requestClose('close-button'),
    modalContextValue: buildModalShellContextValue({
      requestClose,
      busy,
      draftState,
      isCloseGuardActive,
    }),
  };
}

export function buildModalShellFrameState({
  backdropAriaHidden,
  dialogAccessibility = {},
  dialogPanelClassName = '',
  dialogScrollAreaClassName = '',
  frameAccessibility = {},
  isCloseGuardActive = false,
} = {}) {
  return {
    backdropClassName: MODAL_SHELL_FRAME_BACKDROP_CLASS_NAME,
    backdropAriaHidden,
    dialogRole: 'dialog',
    dialogAriaModal: frameAccessibility.dialogAriaModal,
    dialogAriaBusy: frameAccessibility.dialogAriaBusy,
    dialogAriaHidden: frameAccessibility.dialogAriaHidden,
    dialogLabelledBy: dialogAccessibility.labelledBy,
    dialogDescribedBy: dialogAccessibility.describedBy,
    dialogTabIndex: -1,
    dialogInert: frameAccessibility.dialogInert,
    dialogPanelClassName,
    dialogScrollAreaClassName,
    shouldRenderCloseGuard: Boolean(isCloseGuardActive),
  };
}
