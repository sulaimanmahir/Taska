import { SINGLE_INSIGHT_ACTION_GUIDANCE } from '../lib/insightActionGuidance';

export default function InsightActionButtons({
  isRead,
  isBusy,
  isMarkingRead,
  isDismissing,
  onMarkRead,
  onDismiss,
  size = 'sm',
  showGuidance = true,
  actionGroupAriaLabel = 'Insight actions',
  guidanceAriaLabel = 'Insight action guidance',
}) {
  const textClass = size === 'xs' ? 'text-[11px]' : 'text-xs';
  const guidanceClass = size === 'xs' ? 'text-[10px]' : 'text-[11px]';
  const guidanceSize = size === 'xs' ? 'compact' : 'full';
  const markReadGuidance = SINGLE_INSIGHT_ACTION_GUIDANCE.markRead[guidanceSize];
  const dismissGuidance = SINGLE_INSIGHT_ACTION_GUIDANCE.dismiss[guidanceSize];
  const isCompact = size === 'xs';

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-end gap-2" role="group" aria-label={actionGroupAriaLabel}>
        {!isRead ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={onMarkRead}
            className={`${textClass} font-medium text-slate-500 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {isMarkingRead ? 'Saving...' : 'Mark read'}
          </button>
        ) : null}
        <button
          type="button"
          disabled={isBusy}
          onClick={onDismiss}
          className={`${textClass} font-medium text-slate-500 transition hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {isDismissing ? 'Dismissing...' : 'Dismiss'}
        </button>
      </div>
      {showGuidance ? (
        isCompact ? (
          <ul className="flex flex-wrap items-center justify-end gap-1.5 text-[10px]" aria-label={guidanceAriaLabel}>
            {!isRead ? (
              <li>
                <span className="rounded-full border border-slate-200/80 bg-[var(--color-surface-subtle)] px-2 py-0.5 font-medium text-slate-500 shadow-[var(--shadow-sm)]">
                  {SINGLE_INSIGHT_ACTION_GUIDANCE.markRead.compactBadge}
                </span>
              </li>
            ) : null}
            <li>
                <span className="rounded-full border border-rose-100 bg-rose-50/10 px-2 py-0.5 font-medium text-rose-500 shadow-[var(--shadow-sm)]">
                  {SINGLE_INSIGHT_ACTION_GUIDANCE.dismiss.compactBadge}
                </span>
            </li>
          </ul>
        ) : (
          <ul className={`flex flex-wrap items-center justify-end gap-2 text-slate-400 ${guidanceClass}`} aria-label={guidanceAriaLabel}>
            {!isRead ? (
              <li>{markReadGuidance}</li>
            ) : null}
            <li>{dismissGuidance}</li>
          </ul>
        )
      ) : null}
    </div>
  );
}
