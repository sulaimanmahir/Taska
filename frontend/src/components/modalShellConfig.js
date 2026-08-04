// Shared modal primitives should stay preset-first.
// Prefer the existing preset families before adding one-off classes or booleans:
// - `size`: sm, md, lg, xl, 2xl, 3xl
// - `tone`: default, violet, sky, amber, emerald, rose
// - `headerBadgePreset`: profile, setup, capture, action, destructive, review, confirmation, step
// - `dismissPreset`: soft, guarded, locked
// - `draftStatePreset`: default, editor, setup, pending
// - `closeGuardPreset`: discardDraft, cancelSetup, leaveEditor
// - `statusStripPreset`: default, progress
// - `ModalActions` `preset`: default, form, confirmation

export const MODAL_SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

export const MODAL_TONE_CLASSES = {
  default: {
    panel: 'border-slate-200/80 bg-[var(--color-bg-elevated)]',
    closeButton: 'border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-500 shadow-[var(--shadow-sm)] hover:border-slate-300 hover:bg-white hover:text-slate-700 focus-visible:ring-violet-200',
    actions: 'border-slate-200/80 bg-[var(--color-bg-elevated)]',
    statusStrip: 'modal-status-strip-default',
  },
  violet: {
    panel: 'border-violet-100 bg-[var(--color-bg-elevated)]',
    closeButton: 'border-violet-100 bg-violet-50/10 text-violet-600 hover:bg-violet-50/15 hover:text-violet-700 focus-visible:ring-violet-200',
    actions: 'border-violet-100 bg-[var(--color-bg-elevated)]',
    statusStrip: 'modal-status-strip-violet',
  },
  sky: {
    panel: 'border-sky-100 bg-[var(--color-bg-elevated)]',
    closeButton: 'border-sky-100 bg-sky-50/10 text-sky-600 hover:bg-sky-50/15 hover:text-sky-700 focus-visible:ring-sky-200',
    actions: 'border-sky-100 bg-[var(--color-bg-elevated)]',
    statusStrip: 'modal-status-strip-sky',
  },
  amber: {
    panel: 'border-amber-100 bg-[var(--color-bg-elevated)]',
    closeButton: 'border-amber-100 bg-amber-50/10 text-amber-700 hover:bg-amber-50/15 hover:text-amber-800 focus-visible:ring-amber-200',
    actions: 'border-amber-100 bg-[var(--color-bg-elevated)]',
    statusStrip: 'modal-status-strip-amber',
  },
  emerald: {
    panel: 'border-emerald-100 bg-[var(--color-bg-elevated)]',
    closeButton: 'border-emerald-100 bg-emerald-50/10 text-emerald-700 hover:bg-emerald-50/15 hover:text-emerald-800 focus-visible:ring-emerald-200',
    actions: 'border-emerald-100 bg-[var(--color-bg-elevated)]',
    statusStrip: 'modal-status-strip-emerald',
  },
  rose: {
    panel: 'border-rose-100 bg-[var(--color-bg-elevated)]',
    closeButton: 'border-rose-100 bg-rose-50/10 text-rose-600 hover:bg-rose-50/15 hover:text-rose-700 focus-visible:ring-rose-200',
    actions: 'border-rose-100 bg-[var(--color-bg-elevated)]',
    statusStrip: 'modal-status-strip-rose',
  },
};

export const MODAL_HEADER_LAYOUT_CLASSES = {
  standard: 'mb-3.5 flex items-start justify-between gap-4',
  compact: 'mb-2.5 flex items-start justify-between gap-3',
  stacked: 'mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4',
};

export const MODAL_STATUS_STRIP_PRESETS = {
  default: '',
  progress: 'rounded-2xl px-3 py-2.5',
};

export const MODAL_ACTIONS_PRESETS = {
  default: {
    className: '',
    ariaLabel: 'Dialog actions',
  },
  form: {
    className: '',
    ariaLabel: 'Form actions',
  },
  confirmation: {
    className: 'mt-4',
    ariaLabel: 'Confirmation actions',
  },
};

export const MODAL_HEADER_BADGE_PRESETS = {
  profile: {
    variant: 'soft',
  },
  setup: {
    variant: 'soft',
  },
  capture: {
    variant: 'soft',
  },
  action: {
    variant: 'soft',
  },
  destructive: {
    variant: 'subtle',
  },
  review: {
    variant: 'subtle',
  },
  confirmation: {
    variant: 'subtle',
  },
  step: {
    variant: 'subtle',
    tone: 'slate',
  },
};

export const MODAL_HEADER_BADGE_CLASSES = {
  soft: {
    default: 'border border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-700 shadow-[var(--shadow-sm)]',
    slate: 'border border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-600 shadow-[var(--shadow-sm)]',
    violet: 'border border-violet-100 bg-violet-50/10 text-violet-700 shadow-[var(--shadow-sm)]',
    sky: 'border border-sky-100 bg-sky-50/10 text-sky-700 shadow-[var(--shadow-sm)]',
    amber: 'border border-amber-100 bg-amber-50/10 text-amber-700 shadow-[var(--shadow-sm)]',
    emerald: 'border border-emerald-100 bg-emerald-50/10 text-emerald-700 shadow-[var(--shadow-sm)]',
    rose: 'border border-rose-100 bg-rose-50/10 text-rose-700 shadow-[var(--shadow-sm)]',
  },
  subtle: {
    default: 'border border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-600 shadow-[var(--shadow-sm)]',
    slate: 'border border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-500 shadow-[var(--shadow-sm)]',
    violet: 'border border-violet-100 bg-violet-50/10 text-violet-700',
    sky: 'border border-sky-100 bg-sky-50/10 text-sky-700',
    amber: 'border border-amber-100 bg-amber-50/10 text-amber-700',
    emerald: 'border border-emerald-100 bg-emerald-50/10 text-emerald-700',
    rose: 'border border-rose-100 bg-rose-50/10 text-rose-700',
  },
};

export const MODAL_DRAFT_STATE_CLASSES = {
  dirty: 'border-amber-100 bg-amber-50/10 text-amber-700',
  saving: 'border-sky-100 bg-sky-50/10 text-sky-700',
  clean: 'border-emerald-100 bg-emerald-50/10 text-emerald-700',
};

export const MODAL_DRAFT_STATE_LABELS = {
  dirty: 'Unsaved changes',
  saving: 'Saving...',
  clean: 'Saved',
};

export const MODAL_DRAFT_STATE_PRESETS = {
  default: {
    dirty: 'Unsaved changes',
    saving: 'Saving...',
    clean: 'Saved',
  },
  editor: {
    dirty: 'Editing',
    saving: 'Saving changes...',
    clean: 'Saved',
  },
  setup: {
    dirty: 'Setup in progress',
    saving: 'Saving setup...',
    clean: 'Setup saved',
  },
  pending: {
    dirty: 'Pending changes',
    saving: 'Applying changes...',
    clean: 'Up to date',
  },
};

export const MODAL_CLOSE_GUARD_CLASSES = {
  default: {
    panel: 'border-amber-100 bg-amber-50/10 text-amber-900',
    body: 'text-amber-800',
    secondary: 'border-amber-100 bg-[var(--color-surface-subtle)] text-amber-800 hover:bg-amber-50/10',
    primary: 'border border-amber-100 bg-amber-50/10 text-amber-900 hover:border-amber-200 hover:bg-amber-50/15',
  },
  violet: {
    panel: 'border-violet-100 bg-violet-50/10 text-violet-900',
    body: 'text-violet-800',
    secondary: 'border-violet-100 bg-[var(--color-surface-subtle)] text-violet-800 hover:bg-violet-50/10',
    primary: 'border border-violet-100 bg-violet-50/10 text-violet-900 hover:border-violet-200 hover:bg-violet-50/15',
  },
  sky: {
    panel: 'border-sky-100 bg-sky-50/10 text-sky-900',
    body: 'text-sky-800',
    secondary: 'border-sky-100 bg-[var(--color-surface-subtle)] text-sky-800 hover:bg-sky-50/10',
    primary: 'border border-sky-100 bg-sky-50/10 text-sky-900 hover:border-sky-200 hover:bg-sky-50/15',
  },
  amber: {
    panel: 'border-amber-100 bg-amber-50/10 text-amber-900',
    body: 'text-amber-800',
    secondary: 'border-amber-100 bg-[var(--color-surface-subtle)] text-amber-800 hover:bg-amber-50/10',
    primary: 'border border-amber-100 bg-amber-50/10 text-amber-900 hover:border-amber-200 hover:bg-amber-50/15',
  },
  emerald: {
    panel: 'border-emerald-100 bg-emerald-50/10 text-emerald-900',
    body: 'text-emerald-800',
    secondary: 'border-emerald-100 bg-[var(--color-surface-subtle)] text-emerald-800 hover:bg-emerald-50/10',
    primary: 'border border-emerald-100 bg-emerald-50/10 text-emerald-900 hover:border-emerald-200 hover:bg-emerald-50/15',
  },
  rose: {
    panel: 'border-rose-100 bg-rose-50/10 text-rose-900',
    body: 'text-rose-800',
    secondary: 'border-rose-100 bg-[var(--color-surface-subtle)] text-rose-800 hover:bg-rose-50/10',
    primary: 'border border-rose-100 bg-rose-50/10 text-rose-900 hover:border-rose-200 hover:bg-rose-50/15',
  },
};

export const MODAL_CLOSE_GUARD_PRESETS = {
  discardDraft: {
    title: 'Unsaved changes',
    message: 'You have unsaved changes. Discard them and close this dialog?',
    confirmLabel: 'Discard changes',
    cancelLabel: 'Keep editing',
  },
  cancelSetup: {
    title: 'Discard setup changes',
    message: 'This setup is still in progress. Discard your changes and close this dialog?',
    confirmLabel: 'Discard setup',
    cancelLabel: 'Continue setup',
  },
  leaveEditor: {
    title: 'Leave editor',
    message: 'Your current edits have not been saved yet. Leave this editor and lose those changes?',
    confirmLabel: 'Leave editor',
    cancelLabel: 'Stay here',
  },
};

export const MODAL_DISMISS_PRESETS = {
  soft: {
    closeOnBackdrop: true,
    closeOnEscape: true,
    showCloseButton: true,
  },
  guarded: {
    closeOnBackdrop: false,
    closeOnEscape: true,
    showCloseButton: true,
  },
  locked: {
    closeOnBackdrop: false,
    closeOnEscape: false,
    showCloseButton: false,
  },
};
