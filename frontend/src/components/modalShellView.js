export function getModalDialogAccessibilityState({
  isCloseGuardActive = false,
  closeGuardTitleId,
  closeGuardMessageId,
  titleId,
  resolvedDescriptionIds,
}) {
  return {
    labelledBy: isCloseGuardActive ? closeGuardTitleId : titleId,
    describedBy: isCloseGuardActive ? closeGuardMessageId : resolvedDescriptionIds,
  };
}

export function getModalFrameAccessibilityState({
  busy = false,
  isTopModal = true,
}) {
  return {
    backdropAriaHidden: !isTopModal ? 'true' : undefined,
    dialogAriaModal: isTopModal ? 'true' : undefined,
    dialogAriaBusy: busy || undefined,
    dialogAriaHidden: !isTopModal ? 'true' : undefined,
    dialogInert: !isTopModal ? '' : undefined,
  };
}

export function shouldRenderModalHeaderMeta({
  headerAction = null,
  hasHeaderBadge = false,
  hasDraftState = false,
}) {
  return Boolean(headerAction || hasHeaderBadge || hasDraftState);
}

export function getModalStickyHeaderClassName({
  stickyHeader = false,
  hasTopShadow = false,
}) {
  if (!stickyHeader) {
    return '';
  }

  return [
    'modal-sticky-header sticky top-0 z-10 -mx-4.5 px-4.5 pb-2.5 pt-1 sm:-mx-5.5 sm:px-5.5',
    hasTopShadow ? 'modal-sticky-header-elevated' : '',
  ].filter(Boolean).join(' ');
}

export function getModalStatusStripClassName({
  stickyStatusStrip = false,
  stickyHeader = false,
  hasTopShadow = false,
  toneClassName = '',
  presetClassName = '',
  className = '',
}) {
  const stickyClassName = stickyStatusStrip
    ? [
      'modal-status-strip',
      stickyHeader ? 'modal-status-strip-sticky-with-header' : 'modal-status-strip-sticky',
      hasTopShadow ? 'modal-status-strip-elevated' : '',
    ].filter(Boolean).join(' ')
    : 'modal-status-strip';

  return [
    stickyClassName,
    toneClassName,
    presetClassName,
    className,
  ].filter(Boolean).join(' ');
}

export function getModalGuardedContentProps({
  isCloseGuardActive = false,
}) {
  if (!isCloseGuardActive) {
    return {
      ariaHidden: undefined,
      inert: undefined,
      className: undefined,
    };
  }

  return {
    ariaHidden: 'true',
    inert: '',
    className: 'pointer-events-none select-none',
  };
}

export function getModalPanelClassName({
  widthClassName,
  panelToneClassName,
  className = '',
}) {
  return [
    'modal modal-panel-enter w-full',
    widthClassName,
    'max-h-[91vh] overflow-hidden rounded-t-[1.5rem] rounded-b-none border p-4.5 shadow-[var(--shadow-md)] sm:max-h-[89vh] sm:rounded-[1.5rem] sm:p-5.5',
    panelToneClassName,
    className,
  ].filter(Boolean).join(' ');
}

export function getModalScrollAreaClassName({
  hasTopShadow = false,
  hasBottomShadow = false,
  className = '',
}) {
  return [
    'modal-scroll-area',
    hasTopShadow ? 'modal-scroll-area-has-top-shadow' : '',
    hasBottomShadow ? 'modal-scroll-area-has-bottom-shadow' : '',
    'max-h-[calc(91vh-2.5rem)] overflow-y-auto pr-0.5 sm:max-h-[calc(89vh-3rem)]',
    className,
  ].filter(Boolean).join(' ');
}

export function buildModalShellViewModel({
  busy = false,
  closeGuardRequested = false,
  shouldGuardClose = false,
  scrollState = { top: false, bottom: false },
  resolvedCloseOnBackdrop = false,
  isTopModal = true,
  closeGuardTitleId,
  closeGuardMessageId,
  titleId,
  resolvedDescriptionIds,
  stickyHeader = false,
  stickyStatusStrip = false,
  statusStripToneClassName = '',
  statusStripPresetClassName = '',
  statusStripClassName = '',
  widthClassName,
  panelToneClassName,
  panelClassName = '',
  scrollAreaClassName = '',
}) {
  const isCloseGuardActive = closeGuardRequested && shouldGuardClose;
  const hasTopShadow = Boolean(scrollState.top);
  const hasBottomShadow = Boolean(scrollState.bottom);

  return {
    isCloseGuardActive,
    hasTopShadow,
    hasBottomShadow,
    allowBackdropClose: shouldAllowModalBackdropClose({
      closeOnBackdrop: resolvedCloseOnBackdrop,
      isTopModal,
      isCloseGuardActive,
    }),
    frameAccessibility: getModalFrameAccessibilityState({
      busy,
      isTopModal,
    }),
    stickyHeaderClassName: getModalStickyHeaderClassName({
      stickyHeader,
      hasTopShadow,
    }),
    statusStripClassNames: getModalStatusStripClassName({
      stickyStatusStrip,
      stickyHeader,
      hasTopShadow,
      toneClassName: statusStripToneClassName,
      presetClassName: statusStripPresetClassName,
      className: statusStripClassName,
    }),
    dialogAccessibility: getModalDialogAccessibilityState({
      isCloseGuardActive,
      closeGuardTitleId,
      closeGuardMessageId,
      titleId,
      resolvedDescriptionIds,
    }),
    guardedContentProps: getModalGuardedContentProps({
      isCloseGuardActive,
    }),
    dialogPanelClassName: getModalPanelClassName({
      widthClassName,
      panelToneClassName,
      className: panelClassName,
    }),
    dialogScrollAreaClassName: getModalScrollAreaClassName({
      hasTopShadow,
      hasBottomShadow,
      className: scrollAreaClassName,
    }),
  };
}

function shouldAllowModalBackdropClose({
  closeOnBackdrop = false,
  isTopModal = true,
  isCloseGuardActive = false,
}) {
  return Boolean(closeOnBackdrop && isTopModal && !isCloseGuardActive);
}
