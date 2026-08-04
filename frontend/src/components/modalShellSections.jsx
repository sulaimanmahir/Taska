import { CardHeader } from './Card.jsx';
import { ModalShellContext } from './ModalShellContext.jsx';
import {
  buildModalShellCloseGuardViewModel,
  buildModalShellContentSectionState,
  buildModalShellFrameState,
  buildModalShellHeaderMetaState,
  getModalShellCloseButtonClassName,
  getModalShellHeaderSectionClassName,
} from './modalShellSectionsState.js';

function ModalShellHeaderMeta({
  headerAction = null,
  resolvedHeaderBadgeLabel = '',
  headerBadgeClasses = '',
  draftState = null,
  draftStateClassName = '',
  resolvedDraftStateLabel = '',
}) {
  const headerMetaState = buildModalShellHeaderMetaState({
    headerAction,
    resolvedHeaderBadgeLabel,
    draftState,
  });

  if (!headerMetaState.shouldRender) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {headerAction}
      {headerMetaState.hasHeaderBadge ? (
        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${headerBadgeClasses}`.trim()}>
          {resolvedHeaderBadgeLabel}
        </span>
      ) : null}
      {headerMetaState.hasDraftState ? (
        <span
          role="status"
          aria-live="polite"
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${draftStateClassName}`.trim()}
        >
          {resolvedDraftStateLabel}
        </span>
      ) : null}
    </div>
  );
}

export function ModalShellHeaderSection({
  title,
  subtitle,
  titleId,
  subtitleId,
  headerAction = null,
  resolvedHeaderBadgeLabel = '',
  headerBadgeClasses = '',
  draftState = null,
  draftStateClassName = '',
  resolvedDraftStateLabel = '',
  headerLayoutClassName = '',
  stickyHeaderClassName = '',
  headerClassName = '',
  resolvedShowCloseButton = false,
  onCloseButton,
  closeAriaLabel = 'Close dialog',
  closeButtonToneClassName = '',
}) {
  const headerSectionClassName = getModalShellHeaderSectionClassName({
    headerLayoutClassName,
    stickyHeaderClassName,
    headerClassName,
  });
  const closeButtonClassName = getModalShellCloseButtonClassName({
    closeButtonToneClassName,
  });

  return (
    <div className={headerSectionClassName}>
      <CardHeader
        title={title}
        subtitle={subtitle}
        titleId={titleId}
        subtitleId={subtitleId}
        className="mb-0 flex-1"
        action={(
          <ModalShellHeaderMeta
            headerAction={headerAction}
            resolvedHeaderBadgeLabel={resolvedHeaderBadgeLabel}
            headerBadgeClasses={headerBadgeClasses}
            draftState={draftState}
            draftStateClassName={draftStateClassName}
            resolvedDraftStateLabel={resolvedDraftStateLabel}
          />
        )}
      />
      {resolvedShowCloseButton ? (
        <button
          type="button"
          onClick={onCloseButton}
          data-modal-close="true"
          data-modal-dismiss="true"
          aria-label={closeAriaLabel}
          className={closeButtonClassName}
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

export function ModalShellCloseGuard({
  closeGuardRef,
  closeGuardCancelButtonRef,
  closeGuardTitleId,
  closeGuardMessageId,
  closeGuardToneClasses,
  resolvedCloseGuardTitle,
  resolvedCloseGuardMessage,
  resolvedCloseGuardCancelLabel,
  resolvedCloseGuardConfirmLabel,
  dismissCloseGuard,
  confirmCloseGuard,
}) {
  const closeGuardViewModel = buildModalShellCloseGuardViewModel({
    closeGuardToneClasses,
  });

  return (
    <div
      ref={closeGuardRef}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={closeGuardTitleId}
      aria-describedby={closeGuardMessageId}
      tabIndex={-1}
      className={closeGuardViewModel.panelClassName}
    >
      <p id={closeGuardTitleId} className="text-sm font-semibold">{resolvedCloseGuardTitle}</p>
      <p id={closeGuardMessageId} className={closeGuardViewModel.messageClassName}>{resolvedCloseGuardMessage}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          ref={closeGuardCancelButtonRef}
          data-autofocus="true"
          onClick={dismissCloseGuard}
          className={closeGuardViewModel.secondaryButtonClassName}
        >
          {resolvedCloseGuardCancelLabel}
        </button>
        <button
          type="button"
          onClick={confirmCloseGuard}
          className={closeGuardViewModel.primaryButtonClassName}
        >
          {resolvedCloseGuardConfirmLabel}
        </button>
      </div>
    </div>
  );
}

export function ModalShellFrame({
  backdropAriaHidden,
  onBackdropClick,
  dialogAccessibility,
  dialogRef,
  dialogPanelClassName = '',
  dialogScrollAreaClassName = '',
  frameAccessibility,
  handleDialogKeyDown,
  isCloseGuardActive = false,
  closeGuardProps = {},
  bodyProps = {},
  scrollAreaRef,
  children,
}) {
  const frameState = buildModalShellFrameState({
    backdropAriaHidden,
    dialogAccessibility,
    dialogPanelClassName,
    dialogScrollAreaClassName,
    frameAccessibility,
    isCloseGuardActive,
  });

  return (
    <div
      className={frameState.backdropClassName}
      aria-hidden={frameState.backdropAriaHidden}
      onClick={onBackdropClick}
    >
      <div
        ref={dialogRef}
        role={frameState.dialogRole}
        aria-modal={frameState.dialogAriaModal}
        aria-busy={frameState.dialogAriaBusy}
        aria-hidden={frameState.dialogAriaHidden}
        aria-labelledby={frameState.dialogLabelledBy}
        aria-describedby={frameState.dialogDescribedBy}
        tabIndex={frameState.dialogTabIndex}
        inert={frameState.dialogInert}
        className={frameState.dialogPanelClassName}
        onKeyDown={handleDialogKeyDown}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          ref={scrollAreaRef}
          className={frameState.dialogScrollAreaClassName}
        >
          {frameState.shouldRenderCloseGuard ? (
            <ModalShellCloseGuard {...closeGuardProps} />
          ) : null}
          <ModalShellContentSection {...bodyProps}>
            {children}
          </ModalShellContentSection>
        </div>
      </div>
    </div>
  );
}

export function ModalShellContentSection({
  guardedContentProps,
  title,
  subtitle,
  titleId,
  subtitleId,
  headerAction = null,
  resolvedHeaderBadgeLabel = '',
  headerBadgeClasses = '',
  draftState = null,
  draftStateClassName = '',
  resolvedDraftStateLabel = '',
  headerLayoutClassName = '',
  stickyHeaderClassName = '',
  headerClassName = '',
  resolvedShowCloseButton = false,
  requestClose,
  closeAriaLabel = 'Close dialog',
  closeButtonToneClassName = '',
  statusStrip = null,
  statusStripClassNames = '',
  busy = false,
  isCloseGuardActive = false,
  bodyClassName = '',
  children,
}) {
  const contentSectionState = buildModalShellContentSectionState({
    guardedContentProps,
    requestClose,
    busy,
    draftState,
    isCloseGuardActive,
    statusStrip,
  });

  return (
    <div
      aria-hidden={contentSectionState.contentAttributes.ariaHidden}
      inert={contentSectionState.contentAttributes.inert}
      className={contentSectionState.contentAttributes.className}
    >
      <ModalShellHeaderSection
        title={title}
        subtitle={subtitle}
        titleId={titleId}
        subtitleId={subtitleId}
        headerAction={headerAction}
        resolvedHeaderBadgeLabel={resolvedHeaderBadgeLabel}
        headerBadgeClasses={headerBadgeClasses}
        draftState={draftState}
        draftStateClassName={draftStateClassName}
        resolvedDraftStateLabel={resolvedDraftStateLabel}
        headerLayoutClassName={headerLayoutClassName}
        stickyHeaderClassName={stickyHeaderClassName}
        headerClassName={headerClassName}
        resolvedShowCloseButton={resolvedShowCloseButton}
        onCloseButton={contentSectionState.onCloseButton}
        closeAriaLabel={closeAriaLabel}
        closeButtonToneClassName={closeButtonToneClassName}
      />
      {contentSectionState.shouldRenderStatusStrip ? (
        <div className={statusStripClassNames}>
          {statusStrip}
        </div>
      ) : null}
      <ModalShellContext.Provider
        value={contentSectionState.modalContextValue}
      >
        <div className={bodyClassName}>
          {children}
        </div>
      </ModalShellContext.Provider>
    </div>
  );
}
