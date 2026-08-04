import { useId } from 'react';
import Button from './Button';
import ModalShell, { ModalActions } from './ModalShell';

// Keep common confirmation flows on the shared preset path.
// Prefer `copyPreset` + `copyContext` and `detailPreset` + `detailContext`
// before reaching for one-off labels, messages, or raw detail arrays.

const CONFIRM_INTENTS = {
  destructive: {
    tone: 'rose',
    confirmVariant: 'dangerOutline',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    badgeLabel: 'Destructive action',
    headerBadgePreset: 'destructive',
    iconLabel: 'Delete carefully',
    severityLabel: 'Important',
  },
  warning: {
    tone: 'amber',
    confirmVariant: 'primary',
    confirmLabel: 'Continue',
    cancelLabel: 'Cancel',
    badgeLabel: 'Requires review',
    headerBadgePreset: 'review',
    iconLabel: 'Review before continuing',
    severityLabel: 'Review impact',
  },
  neutral: {
    tone: 'default',
    confirmVariant: 'primary',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    badgeLabel: 'Confirmation',
    headerBadgePreset: 'confirmation',
    iconLabel: 'Confirm this change',
    severityLabel: 'Before you continue',
  },
};
const CONFIRM_COPY_PRESETS = {
  deleteRecord: {
    intent: 'destructive',
    description: 'Remove this {{noun}} from your current workspace.',
    confirmLabel: 'Delete {{noun}}',
    cancelLabel: 'Keep {{noun}}',
    busyLabel: 'Deleting {{noun}}...',
    iconPreset: 'recordRemoval',
    iconLabel: '{{Noun}} removal',
    severityLabel: 'Permanent change',
    message: 'This action removes the selected record from the current workspace. Review any linked history before proceeding.',
    severityNote: 'This change cannot be undone once the record is removed.',
    confirmScope: 'Workspace',
  },
  adminChange: {
    intent: 'warning',
    description: 'Are you sure you want to {{actionLabelLower}} this {{targetNoun}}?',
    confirmLabel: '{{actionLabel}}',
    cancelLabel: 'Cancel',
    busyLabel: '{{actionLabel}}...',
    iconPreset: 'adminChange',
    iconLabel: 'Administrative change',
    severityLabel: 'Platform impact',
    message: 'This action updates live platform data immediately. Review the record carefully before continuing.',
    severityNote: 'Administrative changes take effect immediately across the live workspace and may affect active users.',
    confirmScope: 'Platform',
  },
  cancelSubscription: {
    intent: 'destructive',
    description: 'Are you sure you want to cancel your subscription?',
    confirmLabel: 'Cancel subscription',
    cancelLabel: 'Keep plan',
    busyLabel: 'Cancelling subscription...',
    iconPreset: 'subscriptionChange',
    iconLabel: 'Subscription change',
    severityLabel: 'Billing impact',
    message: 'Cancelling stops the current paid plan for this workspace. Review your renewal timing before proceeding.',
    severityNote: 'Subscription changes affect the current workspace billing state as soon as this action is processed.',
    confirmScope: 'Billing',
  },
  removePaymentMethod: {
    intent: 'destructive',
    description: 'Remove this payment method from the business profile?',
    confirmLabel: 'Remove method',
    cancelLabel: 'Keep method',
    busyLabel: 'Removing payment method...',
    iconPreset: 'paymentMethodRemoval',
    iconLabel: 'Billing method removal',
    severityLabel: 'Billing impact',
    message: 'Removing this payment method affects future billing collection for the current workspace.',
    severityNote: 'If this is the active default method, future collections may require another saved payment source.',
    confirmScope: 'Billing',
  },
};
const CONFIRM_SURFACE_CLASSES = {
  default: {
    helper: 'border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-700',
    icon: 'border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-600 shadow-[var(--shadow-sm)]',
    severityPanel: 'border-slate-200/80 bg-white/75',
    severityScope: 'border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-700 shadow-[var(--shadow-sm)]',
  },
  amber: {
    helper: 'border-amber-100 bg-amber-50/10 text-amber-800',
    icon: 'border-amber-100 bg-[var(--color-surface-subtle)] text-amber-600 shadow-[var(--shadow-sm)]',
    severityPanel: 'border-amber-100 bg-white/75',
    severityScope: 'border-amber-100 bg-[var(--color-surface-subtle)] text-amber-800 shadow-[var(--shadow-sm)]',
  },
  rose: {
    helper: 'border-rose-100 bg-rose-50/10 text-rose-800',
    icon: 'border-rose-100 bg-[var(--color-surface-subtle)] text-rose-600 shadow-[var(--shadow-sm)]',
    severityPanel: 'border-rose-100 bg-white/75',
    severityScope: 'border-rose-100 bg-[var(--color-surface-subtle)] text-rose-800 shadow-[var(--shadow-sm)]',
  },
};

function ConfirmIcon({ preset, intent }) {
  if (preset === 'recordRemoval') {
    return (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M7.5 3.5A1.5 1.5 0 0 1 9 2h2a1.5 1.5 0 0 1 1.5 1.5V4H16a.75.75 0 0 1 0 1.5h-.58l-.66 9.19A2.25 2.25 0 0 1 12.52 17H7.48a2.25 2.25 0 0 1-2.24-2.31L4.58 5.5H4A.75.75 0 0 1 4 4h3.5v-.5ZM9 4h2v-.5H9V4Zm-.25 3.25a.75.75 0 0 1 .75.75v5a.75.75 0 0 1-1.5 0V8a.75.75 0 0 1 .75-.75Zm3.25.75a.75.75 0 0 0-1.5 0v5a.75.75 0 0 0 1.5 0V8Z" clipRule="evenodd" />
      </svg>
    );
  }

  if (preset === 'adminChange') {
    return (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M11.32 2.47a1.75 1.75 0 0 0-2.64 0l-.54.62a1.75 1.75 0 0 1-1.5.57l-.81-.08a1.75 1.75 0 0 0-1.86 1.86l.08.82a1.75 1.75 0 0 1-.57 1.49l-.62.54a1.75 1.75 0 0 0 0 2.64l.62.54c.43.38.65.94.57 1.5l-.08.81a1.75 1.75 0 0 0 1.86 1.86l.82-.08c.56-.06 1.12.15 1.49.57l.54.62a1.75 1.75 0 0 0 2.64 0l.54-.62c.38-.43.94-.65 1.5-.57l.81.08a1.75 1.75 0 0 0 1.86-1.86l-.08-.82a1.75 1.75 0 0 1 .57-1.49l.62-.54a1.75 1.75 0 0 0 0-2.64l-.62-.54a1.75 1.75 0 0 1-.57-1.5l.08-.81a1.75 1.75 0 0 0-1.86-1.86l-.82.08a1.75 1.75 0 0 1-1.49-.57l-.54-.62ZM10 7a.75.75 0 0 1 .75.75v2.75a.75.75 0 0 1-1.5 0V7.75A.75.75 0 0 1 10 7Zm0 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
      </svg>
    );
  }

  if (preset === 'subscriptionChange') {
    return (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M3.5 5.5A2.5 2.5 0 0 1 6 3h8a2.5 2.5 0 0 1 2.5 2.5v1.38c-.24-.08-.5-.13-.77-.13-.83 0-1.59.4-2.06 1.05H6c-.41 0-.75.34-.75.75s.34.75.75.75h7.13a3.2 3.2 0 0 0 0 1.5H6a.75.75 0 0 0 0 1.5h7.67c.47.65 1.23 1.05 2.06 1.05.27 0 .53-.05.77-.13v1.28A2.5 2.5 0 0 1 14 17H6a2.5 2.5 0 0 1-2.5-2.5v-9ZM15.75 8.5a.75.75 0 0 0-1.5 0v1h-1a.75.75 0 0 0 0 1.5h1v1a.75.75 0 0 0 1.5 0v-1h1a.75.75 0 0 0 0-1.5h-1v-1Z" />
      </svg>
    );
  }

  if (preset === 'paymentMethodRemoval') {
    return (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M3 5.75A2.75 2.75 0 0 1 5.75 3h8.5A2.75 2.75 0 0 1 17 5.75v4.63a3.24 3.24 0 0 0-1.5-.36h-.38v-1.4h-10.24v5.63c0 .69.56 1.25 1.25 1.25h6.45c.1.55.35 1.05.7 1.5H6.13A2.75 2.75 0 0 1 3 14.25v-8.5ZM4.88 7.12h10.24V5.75c0-.69-.56-1.25-1.25-1.25h-7.74c-.69 0-1.25.56-1.25 1.25v1.37Zm8.37 5.88a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0Zm1.53-.53a.75.75 0 0 0-1.06 1.06l.53.53-.53.53a.75.75 0 1 0 1.06 1.06l.53-.53.53.53a.75.75 0 0 0 1.06-1.06l-.53-.53.53-.53a.75.75 0 0 0-1.06-1.06l-.53.53-.53-.53Z" clipRule="evenodd" />
      </svg>
    );
  }

  return <DefaultIntentIcon intent={intent} />;
}

function DefaultIntentIcon({ intent }) {
  if (intent === 'warning') {
    return (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l4.58 8.145c.75 1.334-.213 2.99-1.742 2.99H5.42c-1.53 0-2.492-1.656-1.742-2.99l4.58-8.145ZM10 7a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5A.75.75 0 0 1 10 7Zm0 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
      </svg>
    );
  }

  if (intent === 'neutral') {
    return (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.313a1 1 0 0 1-1.42-.003L4.295 10.26a1 1 0 1 1 1.41-1.42l3.034 3.013 6.55-6.558a1 1 0 0 1 1.415-.006Z" clipRule="evenodd" />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 2.75a.75.75 0 0 1 .75.75v5.69l3.03-1.748a.75.75 0 0 1 .75 1.299l-3.03 1.748 3.03 1.749a.75.75 0 1 1-.75 1.299L10.75 11.79v4.71a.75.75 0 0 1-1.5 0v-4.71l-3.03 1.748a.75.75 0 1 1-.75-1.299l3.03-1.749-3.03-1.748a.75.75 0 0 1 .75-1.3l3.03 1.75V3.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
    </svg>
  );
}

function ConfirmationDetails({ details, layout = 'grid' }) {
  if (!details.length) {
    return null;
  }

  if (layout === 'summary') {
    return (
      <dl className="space-y-2 rounded-[calc(var(--card-radius)-0.35rem)] border border-current/10 bg-white/55 px-4 py-3 shadow-[var(--shadow-sm)]">
        {details.map((detail, index) => (
          <div
            key={`${detail.label}-${detail.value}`}
            className={`flex items-start justify-between gap-4 ${
              index < details.length - 1 ? 'border-b border-current/10 pb-2' : ''
            }`.trim()}
          >
            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">
              {detail.label}
            </dt>
            <dd className="text-right">
              <div className={`${detail.emphasis ? 'text-sm font-semibold' : 'text-sm font-medium'} text-slate-900`.trim()}>
                {detail.value}
              </div>
              {detail.note ? (
                <div className="mt-1 text-xs text-slate-500">
                  {detail.note}
                </div>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {details.map((detail) => (
        <div
          key={`${detail.label}-${detail.value}`}
          className={`rounded-[calc(var(--card-radius)-0.45rem)] border px-3 py-3 ${
            detail.emphasis
              ? 'border-current/20 bg-white/70 shadow-[var(--shadow-sm)]'
              : 'border-current/10 bg-[var(--color-surface-subtle)] shadow-[var(--shadow-sm)]'
          }`.trim()}
        >
          <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">
            {detail.label}
          </dt>
          <dd className="mt-1">
            <div className={`${detail.emphasis ? 'text-base font-semibold' : 'text-sm font-medium'} text-slate-900`.trim()}>
              {detail.value}
            </div>
            {detail.note ? (
              <div className="mt-1 text-xs text-slate-500">
                {detail.note}
              </div>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ScrollCueBridge({ children }) {
  return (
    <div className="modal-scroll-cue-anchor" aria-hidden="true">
      {children}
    </div>
  );
}

function buildConfirmDetails(detailPreset, detailContext = {}) {
  if (!detailPreset) {
    return [];
  }

  if (detailPreset === 'contactRecord') {
    return [
      { label: 'Record', value: detailContext.recordName || 'Record', emphasis: true },
      { label: 'Phone', value: detailContext.phone || 'Not provided' },
      { label: 'Email', value: detailContext.email || 'Not provided' },
    ];
  }

  if (detailPreset === 'adminAction') {
    return [
      {
        label: 'Action',
        value: detailContext.actionLabel || 'Confirm',
        note: 'Administrative command to be sent',
        emphasis: true,
      },
      {
        label: 'Target type',
        value: detailContext.targetType || 'Record',
        note: 'Record group affected by this change',
      },
      {
        label: 'Record',
        value: detailContext.recordName || 'Platform record',
        note: 'Live platform record under review',
        emphasis: true,
      },
      {
        label: 'Created',
        value: detailContext.createdAt || 'No date',
        note: 'Original creation date for this record',
      },
    ];
  }

  if (detailPreset === 'billingCancel') {
    return [
      {
        label: 'Active plan',
        value: detailContext.planName || 'No active plan',
        note: 'Current workspace subscription',
        emphasis: true,
      },
      {
        label: 'Billing cycle',
        value: detailContext.billingCycle || 'Not set',
        note: 'Plan cadence on record',
      },
      {
        label: 'Renews on',
        value: detailContext.renewsOn || 'No renewal date set',
        note: 'Scheduled end of current cycle',
      },
      {
        label: 'Days remaining',
        value: detailContext.daysRemainingLabel || '0 days',
        note: 'Access left before plan changes take effect',
        emphasis: true,
      },
    ];
  }

  if (detailPreset === 'billingMethodRemoval') {
    return [
      {
        label: 'Method',
        value: detailContext.methodLabel || 'Saved payment method',
        note: 'Payment source selected for removal',
        emphasis: true,
      },
      {
        label: 'Saved methods',
        value: detailContext.savedMethodsCount || '0',
        note: 'Payment methods currently attached',
      },
      {
        label: 'Default method',
        value: detailContext.defaultMethodLabel || 'None marked',
        note: 'Method used for future billing by default',
        emphasis: true,
      },
    ];
  }

  return [];
}

function resolveCopyTemplate(value, context = {}) {
  if (typeof value !== 'string' || !value.includes('{{')) {
    return value;
  }

  return value.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (key in context && context[key] != null) {
      return String(context[key]);
    }

    const normalizedKey = key.charAt(0).toLowerCase() + key.slice(1);
    const contextValue = context[normalizedKey];

    if (contextValue == null) {
      return match;
    }

    const stringValue = String(contextValue);
    return key.charAt(0) === key.charAt(0).toUpperCase()
      ? stringValue.charAt(0).toUpperCase() + stringValue.slice(1)
      : stringValue;
  });
}

export default function ConfirmDialog({
  open,
  title = 'Confirm action',
  description,
  copyPreset,
  copyContext,
  message,
  details,
  detailPreset,
  detailContext,
  detailsLayout = 'grid',
  severityNote,
  confirmScope,
  onConfirm,
  onCancel,
  intent = 'destructive',
  confirmLabel,
  busyLabel,
  cancelLabel,
  isBusy = false,
  tone,
  size = 'sm',
  confirmVariant,
  badgeLabel,
  helperToneClassName,
  iconToneClassName,
  severityToneClassName,
  severityScopeClassName,
  severityLabel,
  iconPreset,
  icon,
  iconLabel,
  children = null,
}) {
  const helperDescriptionId = useId();

  if (!open) {
    return null;
  }

  const copyPresetConfig = copyPreset ? (CONFIRM_COPY_PRESETS[copyPreset] || null) : null;
  const resolvedIntent = intent || copyPresetConfig?.intent || 'destructive';
  const intentConfig = CONFIRM_INTENTS[resolvedIntent] || CONFIRM_INTENTS.destructive;
  const resolvedTone = tone || intentConfig.tone;
  const resolvedConfirmVariant = confirmVariant || intentConfig.confirmVariant;
  const resolvedDescription = description || resolveCopyTemplate(copyPresetConfig?.description, copyContext) || undefined;
  const resolvedConfirmLabel = confirmLabel || resolveCopyTemplate(copyPresetConfig?.confirmLabel, copyContext) || intentConfig.confirmLabel;
  const resolvedBusyLabel = busyLabel || resolveCopyTemplate(copyPresetConfig?.busyLabel, copyContext) || 'Working...';
  const resolvedCancelLabel = cancelLabel || resolveCopyTemplate(copyPresetConfig?.cancelLabel, copyContext) || intentConfig.cancelLabel;
  const resolvedBadgeLabel = badgeLabel || intentConfig.badgeLabel;
  const surfaceClasses = CONFIRM_SURFACE_CLASSES[resolvedTone] || CONFIRM_SURFACE_CLASSES.default;
  const resolvedHelperToneClassName = helperToneClassName || surfaceClasses.helper;
  const resolvedIconToneClassName = iconToneClassName || surfaceClasses.icon;
  const resolvedSeverityToneClassName = severityToneClassName || surfaceClasses.severityPanel;
  const resolvedSeverityScopeClassName = severityScopeClassName || surfaceClasses.severityScope;
  const resolvedSeverityLabel = severityLabel || resolveCopyTemplate(copyPresetConfig?.severityLabel, copyContext) || intentConfig.severityLabel;
  const resolvedIconLabel = iconLabel || resolveCopyTemplate(copyPresetConfig?.iconLabel, copyContext) || intentConfig.iconLabel;
  const resolvedIconPreset = iconPreset || copyPresetConfig?.iconPreset || null;
  const resolvedIcon = icon || <ConfirmIcon preset={resolvedIconPreset} intent={resolvedIntent} />;
  const resolvedMessage = message || resolveCopyTemplate(copyPresetConfig?.message, copyContext) || '';
  const resolvedSeverityNote = severityNote || resolveCopyTemplate(copyPresetConfig?.severityNote, copyContext) || '';
  const resolvedConfirmScope = confirmScope || resolveCopyTemplate(copyPresetConfig?.confirmScope, copyContext) || '';
  const presetDetails = buildConfirmDetails(detailPreset, detailContext);
  const resolvedDetails = Array.isArray(details) && details.length > 0 ? details : presetDetails;
  const normalizedDetails = Array.isArray(resolvedDetails)
    ? resolvedDetails.filter((detail) => detail?.label && detail?.value != null && detail?.value !== '')
    : [];
  const hasHelperContent = Boolean(resolvedMessage) || normalizedDetails.length > 0 || Boolean(children);

  return (
    <ModalShell
      title={title}
      subtitle={resolvedDescription}
      onClose={isBusy ? () => {} : onCancel}
      size={size}
      tone={resolvedTone}
      headerLayout="compact"
      busy={isBusy}
      dismissPreset="guarded"
      busyDismissPreset="locked"
      scrollAreaClassName="pr-0"
      bodyClassName="pb-1"
      closeAriaLabel="Close confirmation dialog"
      describedBy={hasHelperContent ? helperDescriptionId : undefined}
      headerBadgePreset={intentConfig.headerBadgePreset}
      headerBadgeTone={resolvedTone}
      headerBadgeLabel={resolvedBadgeLabel}
    >
      {hasHelperContent ? (
        <div id={helperDescriptionId} className={`space-y-4 rounded-[var(--card-radius)] border p-[var(--card-padding-sm)] shadow-[var(--shadow-sm)] ${resolvedHelperToneClassName}`.trim()}>
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[calc(var(--card-radius)-0.35rem)] border ${resolvedIconToneClassName}`.trim()}>
              {resolvedIcon}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                {resolvedIconLabel}
              </p>
              {resolvedMessage ? <p className="mt-1 text-sm">{resolvedMessage}</p> : null}
            </div>
          </div>
          <ConfirmationDetails details={normalizedDetails} layout={detailsLayout} />
          {resolvedSeverityNote ? (
            <div className={`rounded-[calc(var(--card-radius)-0.35rem)] border px-4 py-3 ${resolvedSeverityToneClassName}`.trim()}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">
                  {resolvedSeverityLabel}
                </p>
                {resolvedConfirmScope ? (
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${resolvedSeverityScopeClassName}`.trim()}>
                    {resolvedConfirmScope}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm">
                {resolvedSeverityNote}
              </p>
            </div>
          ) : null}
          {children}
        </div>
      ) : null}
      <ScrollCueBridge>
        <ModalActions tone={resolvedTone} preset={hasHelperContent ? 'confirmation' : 'default'}>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            onClick={onCancel}
            disabled={isBusy}
            data-modal-dismiss="true"
          >
            {resolvedCancelLabel}
          </Button>
          <Button
            type="button"
            variant={resolvedConfirmVariant}
            size="lg"
            fullWidth
            onClick={onConfirm}
            disabled={isBusy}
            data-autofocus="true"
          >
            {isBusy ? resolvedBusyLabel : resolvedConfirmLabel}
          </Button>
        </ModalActions>
      </ScrollCueBridge>
    </ModalShell>
  );
}
