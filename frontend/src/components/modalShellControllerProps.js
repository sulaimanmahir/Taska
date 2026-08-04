export function buildModalShellBodyProps({
  bodyClassName = '',
  busy = false,
  closeAriaLabel = 'Close dialog',
  draftState = null,
  headerAction = null,
  headerClassName = '',
  presentation,
  requestClose,
  statusStrip = null,
  subtitle,
  subtitleId,
  title,
  titleId,
  viewModel,
}) {
  return {
    guardedContentProps: viewModel.guardedContentProps,
    title,
    subtitle,
    titleId,
    subtitleId,
    headerAction,
    resolvedHeaderBadgeLabel: presentation.resolvedHeaderBadgeLabel,
    headerBadgeClasses: presentation.headerBadgeClasses,
    draftState,
    draftStateClassName: presentation.draftStateClassName,
    resolvedDraftStateLabel: presentation.resolvedDraftStateLabel,
    headerLayoutClassName: presentation.headerLayoutClassName,
    stickyHeaderClassName: viewModel.stickyHeaderClassName,
    headerClassName,
    resolvedShowCloseButton: presentation.resolvedShowCloseButton,
    requestClose,
    closeAriaLabel,
    closeButtonToneClassName: presentation.toneClasses.closeButton,
    statusStrip,
    statusStripClassNames: viewModel.statusStripClassNames,
    busy,
    isCloseGuardActive: viewModel.isCloseGuardActive,
    bodyClassName,
  };
}

export function buildModalShellCloseGuardProps({
  confirmCloseGuard,
  dismissCloseGuard,
  presentation,
}) {
  return {
    closeGuardToneClasses: presentation.closeGuardToneClasses,
    resolvedCloseGuardTitle: presentation.resolvedCloseGuardTitle,
    resolvedCloseGuardMessage: presentation.resolvedCloseGuardMessage,
    resolvedCloseGuardCancelLabel: presentation.resolvedCloseGuardCancelLabel,
    resolvedCloseGuardConfirmLabel: presentation.resolvedCloseGuardConfirmLabel,
    dismissCloseGuard,
    confirmCloseGuard,
  };
}

export function buildModalShellFrameProps({
  handleDialogKeyDown,
  requestClose,
  viewModel,
}) {
  return {
    backdropAriaHidden: viewModel.frameAccessibility.backdropAriaHidden,
    onBackdropClick: viewModel.allowBackdropClose
      ? () => requestClose('backdrop')
      : undefined,
    dialogAccessibility: viewModel.dialogAccessibility,
    dialogPanelClassName: viewModel.dialogPanelClassName,
    dialogScrollAreaClassName: viewModel.dialogScrollAreaClassName,
    frameAccessibility: viewModel.frameAccessibility,
    handleDialogKeyDown,
    isCloseGuardActive: viewModel.isCloseGuardActive,
  };
}
