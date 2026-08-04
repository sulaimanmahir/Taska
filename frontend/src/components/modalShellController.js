import { useId, useRef, useState } from 'react';
import {
  buildModalShellBodyProps,
  buildModalShellCloseGuardProps,
  buildModalShellFrameProps,
} from './modalShellControllerProps.js';
import { useModalShellInteractionHandlers } from './modalShellInteractions.js';
import {
  useModalShellCloseGuardFocusEffect,
  useModalShellCloseGuardRequestEffect,
  useModalShellCloseGuardRestoreFocusEffect,
  useModalShellDialogFocusTrackingEffect,
  useModalShellOpenFocusEffect,
  useModalShellRuntimeEffects,
  useModalShellScrollEffect,
} from './modalShellHooks.js';
import {
  buildModalDescriptionIds,
  resolveModalShellPresentation,
} from './modalShellState.js';
import { modalShellRuntime } from './modalShellRuntime.js';
import { buildModalShellViewModel } from './modalShellView.js';

export function getInitialModalShellPortalRoot({
  hasDocument = typeof document !== 'undefined',
  runtime = modalShellRuntime,
} = {}) {
  return !hasDocument ? null : runtime?.ensureModalRoot() ?? null;
}

export function useModalShellController({
  title,
  subtitle,
  onClose,
  size = null,
  maxWidth = 'max-w-md',
  tone = 'default',
  headerLayout = 'standard',
  className = '',
  headerClassName = '',
  bodyClassName = '',
  scrollAreaClassName = '',
  closeAriaLabel = 'Close dialog',
  describedBy,
  closeOnBackdrop,
  closeOnEscape,
  showCloseButton,
  headerAction = null,
  headerBadgePreset = null,
  headerBadgeLabel = '',
  headerBadgeTone,
  stickyHeader = false,
  statusStrip = null,
  statusStripPreset = 'default',
  statusStripClassName = '',
  stickyStatusStrip = false,
  statusStripTone,
  dismissPreset = 'soft',
  busy = false,
  busyDismissPreset,
  draftState = null,
  draftStateLabel,
  draftStatePreset = 'default',
  closeGuardPreset = 'discardDraft',
  closeGuardTitle,
  closeGuardMessage,
  closeGuardConfirmLabel,
  closeGuardCancelLabel,
}) {
  const titleId = useId();
  const subtitleId = useId();
  const closeGuardTitleId = useId();
  const closeGuardMessageId = useId();
  const instanceId = useId();
  const dialogRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const closeGuardRef = useRef(null);
  const closeGuardCancelButtonRef = useRef(null);
  const closeGuardReturnFocusRef = useRef(null);
  const closeGuardDismissIntentRef = useRef('return');
  const wasCloseGuardOpenRef = useRef(false);
  const previouslyFocusedElementRef = useRef(null);
  const lastFocusedWithinDialogRef = useRef(null);
  const [portalRoot] = useState(() => getInitialModalShellPortalRoot());
  const [scrollState, setScrollState] = useState({ top: false, bottom: false });
  const [closeGuardRequested, setCloseGuardRequested] = useState(false);
  const [isTopModal, setIsTopModal] = useState(true);

  const presentation = resolveModalShellPresentation({
    busy,
    busyDismissPreset,
    closeGuardCancelLabel,
    closeGuardConfirmLabel,
    closeGuardMessage,
    closeGuardPreset,
    closeGuardTitle,
    closeOnBackdrop,
    closeOnEscape,
    dismissPreset,
    draftState,
    draftStateLabel,
    draftStatePreset,
    headerBadgeLabel,
    headerBadgePreset,
    headerBadgeTone,
    headerLayout,
    maxWidth,
    showCloseButton,
    size,
    statusStripPreset,
    statusStripTone,
    tone,
  });

  const resolvedDescriptionIds = buildModalDescriptionIds({
    describedBy,
    subtitle,
    subtitleId,
  });

  const viewModel = buildModalShellViewModel({
    busy,
    closeGuardRequested,
    shouldGuardClose: presentation.shouldGuardClose,
    scrollState,
    resolvedCloseOnBackdrop: presentation.resolvedCloseOnBackdrop,
    isTopModal,
    closeGuardTitleId,
    closeGuardMessageId,
    titleId,
    resolvedDescriptionIds,
    stickyHeader,
    stickyStatusStrip,
    statusStripToneClassName: presentation.statusStripToneClasses.statusStrip,
    statusStripPresetClassName: presentation.statusStripPresetClassName,
    statusStripClassName,
    widthClassName: presentation.widthClassName,
    panelToneClassName: presentation.toneClasses.panel,
    panelClassName: className,
    scrollAreaClassName,
  });

  const interactions = useModalShellInteractionHandlers({
    closeGuardDismissIntentRef,
    closeGuardRef,
    closeGuardReturnFocusRef,
    closeOnEscape: presentation.resolvedCloseOnEscape,
    dialogRef,
    isCloseGuardActive: viewModel.isCloseGuardActive,
    isTopModal,
    onClose,
    setCloseGuardRequested,
    shouldGuardClose: presentation.shouldGuardClose,
  });

  useModalShellRuntimeEffects({
    instanceId,
    portalRoot,
    previouslyFocusedElementRef,
    setIsTopModal,
  });

  useModalShellOpenFocusEffect({
    portalRoot,
    isTopModal,
    dialogRef,
    closeGuardRef,
    closeGuardCancelButtonRef,
    isCloseGuardActive: viewModel.isCloseGuardActive,
    lastFocusedWithinDialogRef,
  });

  useModalShellDialogFocusTrackingEffect({
    isTopModal,
    dialogRef,
    closeGuardRef,
    lastFocusedWithinDialogRef,
  });

  useModalShellCloseGuardRequestEffect({
    closeGuardRequested,
    shouldGuardClose: presentation.shouldGuardClose,
    setCloseGuardRequested,
  });

  useModalShellCloseGuardFocusEffect({
    isCloseGuardActive: viewModel.isCloseGuardActive,
    isTopModal,
    closeGuardRef,
    closeGuardCancelButtonRef,
  });

  useModalShellCloseGuardRestoreFocusEffect({
    isCloseGuardActive: viewModel.isCloseGuardActive,
    isTopModal,
    dialogRef,
    closeGuardDismissIntentRef,
    closeGuardReturnFocusRef,
    lastFocusedWithinDialogRef,
    wasCloseGuardOpenRef,
  });

  useModalShellScrollEffect({
    scrollAreaRef,
    setScrollState,
  });

  const bodyProps = buildModalShellBodyProps({
    bodyClassName,
    busy,
    closeAriaLabel,
    draftState,
    headerAction,
    headerClassName,
    presentation,
    requestClose: interactions.requestClose,
    statusStrip,
    subtitle,
    subtitleId,
    title,
    titleId,
    viewModel,
  });

  const closeGuardProps = buildModalShellCloseGuardProps({
    confirmCloseGuard: interactions.confirmCloseGuard,
    dismissCloseGuard: interactions.dismissCloseGuard,
    presentation,
  });

  const frameProps = buildModalShellFrameProps({
    handleDialogKeyDown: interactions.handleDialogKeyDown,
    requestClose: interactions.requestClose,
    viewModel,
  });

  return {
    frameProps: {
      ...frameProps,
      bodyProps,
      closeGuardProps: {
        ...closeGuardProps,
        closeGuardRef,
        closeGuardCancelButtonRef,
        closeGuardTitleId,
        closeGuardMessageId,
      },
      dialogRef,
      scrollAreaRef,
    },
    portalRoot,
  };
}
