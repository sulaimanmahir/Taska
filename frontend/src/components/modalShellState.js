import {
  MODAL_CLOSE_GUARD_CLASSES,
  MODAL_CLOSE_GUARD_PRESETS,
  MODAL_DISMISS_PRESETS,
  MODAL_DRAFT_STATE_CLASSES,
  MODAL_DRAFT_STATE_LABELS,
  MODAL_DRAFT_STATE_PRESETS,
  MODAL_HEADER_BADGE_CLASSES,
  MODAL_HEADER_BADGE_PRESETS,
  MODAL_HEADER_LAYOUT_CLASSES,
  MODAL_SIZE_CLASSES,
  MODAL_STATUS_STRIP_PRESETS,
  MODAL_TONE_CLASSES,
} from './modalShellConfig.js';

export function buildModalDescriptionIds({ subtitle, subtitleId, describedBy }) {
  return [subtitle ? subtitleId : null, describedBy]
    .filter(Boolean)
    .join(' ') || undefined;
}

export function resolveModalShellPresentation({
  size = null,
  maxWidth = 'max-w-md',
  tone = 'default',
  statusStripTone,
  headerLayout = 'standard',
  headerBadgePreset = null,
  headerBadgeLabel = '',
  headerBadgeTone,
  statusStripPreset = 'default',
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
  closeOnBackdrop,
  closeOnEscape,
  showCloseButton,
}) {
  const widthClassName = size && MODAL_SIZE_CLASSES[size]
    ? MODAL_SIZE_CLASSES[size]
    : maxWidth;
  const toneClasses = MODAL_TONE_CLASSES[tone] || MODAL_TONE_CLASSES.default;
  const statusStripToneClasses = MODAL_TONE_CLASSES[statusStripTone || tone] || MODAL_TONE_CLASSES.default;
  const closeGuardToneClasses = MODAL_CLOSE_GUARD_CLASSES[tone] || MODAL_CLOSE_GUARD_CLASSES.default;
  const headerBadgePresetConfig = headerBadgePreset ? (MODAL_HEADER_BADGE_PRESETS[headerBadgePreset] || null) : null;
  const draftStatePresetConfig = MODAL_DRAFT_STATE_PRESETS[draftStatePreset] || MODAL_DRAFT_STATE_PRESETS.default;
  const closeGuardPresetConfig = MODAL_CLOSE_GUARD_PRESETS[closeGuardPreset] || MODAL_CLOSE_GUARD_PRESETS.discardDraft;
  const activeDismissPreset = busy && busyDismissPreset ? busyDismissPreset : dismissPreset;
  const dismissPresetConfig = MODAL_DISMISS_PRESETS[activeDismissPreset] || MODAL_DISMISS_PRESETS.soft;
  const resolvedCloseOnBackdrop = closeOnBackdrop ?? dismissPresetConfig.closeOnBackdrop;
  const resolvedCloseOnEscape = closeOnEscape ?? dismissPresetConfig.closeOnEscape;
  const resolvedShowCloseButton = showCloseButton ?? dismissPresetConfig.showCloseButton;
  const resolvedCloseGuardTitle = closeGuardTitle || closeGuardPresetConfig.title;
  const resolvedCloseGuardMessage = closeGuardMessage || closeGuardPresetConfig.message;
  const resolvedCloseGuardConfirmLabel = closeGuardConfirmLabel || closeGuardPresetConfig.confirmLabel;
  const resolvedCloseGuardCancelLabel = closeGuardCancelLabel || closeGuardPresetConfig.cancelLabel;
  const resolvedHeaderBadgeLabel = headerBadgeLabel || headerBadgePresetConfig?.label || '';
  const resolvedHeaderBadgeTone = headerBadgeTone || headerBadgePresetConfig?.tone || tone;
  const resolvedHeaderBadgeVariant = headerBadgePresetConfig?.variant || 'soft';
  const headerBadgeClasses = resolvedHeaderBadgeLabel
    ? (MODAL_HEADER_BADGE_CLASSES[resolvedHeaderBadgeVariant]?.[resolvedHeaderBadgeTone]
      || MODAL_HEADER_BADGE_CLASSES[resolvedHeaderBadgeVariant]?.default
      || MODAL_HEADER_BADGE_CLASSES.soft.default)
    : '';
  const draftStateClassName = draftState ? MODAL_DRAFT_STATE_CLASSES[draftState] || MODAL_DRAFT_STATE_CLASSES.dirty : '';
  const resolvedDraftStateLabel = draftState
    ? (draftStateLabel
      || draftStatePresetConfig[draftState]
      || MODAL_DRAFT_STATE_LABELS[draftState]
      || MODAL_DRAFT_STATE_LABELS.dirty)
    : '';

  return {
    closeGuardToneClasses,
    dismissPresetConfig,
    draftStateClassName,
    headerBadgeClasses,
    headerLayoutClassName: MODAL_HEADER_LAYOUT_CLASSES[headerLayout] || MODAL_HEADER_LAYOUT_CLASSES.standard,
    resolvedCloseGuardCancelLabel,
    resolvedCloseGuardConfirmLabel,
    resolvedCloseGuardMessage,
    resolvedCloseGuardTitle,
    resolvedCloseOnBackdrop,
    resolvedCloseOnEscape,
    resolvedDraftStateLabel,
    resolvedHeaderBadgeLabel,
    resolvedHeaderBadgeTone,
    resolvedHeaderBadgeVariant,
    resolvedShowCloseButton,
    shouldGuardClose: draftState === 'dirty' && !busy,
    statusStripPresetClassName: MODAL_STATUS_STRIP_PRESETS[statusStripPreset] || MODAL_STATUS_STRIP_PRESETS.default,
    statusStripToneClasses,
    toneClasses,
    widthClassName,
  };
}
