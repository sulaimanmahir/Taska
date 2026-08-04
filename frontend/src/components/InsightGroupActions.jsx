import { GROUP_INSIGHT_ACTION_GUIDANCE } from '../lib/insightActionGuidance';
import { ResponsiveCardGrid } from './PageShell';

const statusToneClasses = {
  slate: {
    panel: 'border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-700 shadow-[var(--shadow-sm)]',
    badge: 'border border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-700 shadow-[var(--shadow-sm)]',
    heading: 'text-slate-900',
    body: 'text-slate-600',
  },
  rose: {
    panel: 'border-rose-100 bg-rose-50/10 text-rose-800 shadow-[var(--shadow-sm)]',
    badge: 'border border-rose-100 bg-rose-50/10 text-rose-700',
    heading: 'text-rose-900',
    body: 'text-rose-700',
  },
  violet: {
    panel: 'border-violet-100 bg-violet-50/10 text-violet-900 shadow-[var(--shadow-sm)]',
    badge: 'border border-violet-100 bg-violet-50/10 text-violet-700',
    heading: 'text-violet-900',
    body: 'text-violet-900',
  },
};

export default function InsightGroupActions({
  group,
  unreadIds,
  dismissibleIds,
  needsReadConfirmation,
  isConfirmingRead,
  isConfirmingDismiss,
  isMarkingGroupRead,
  isDismissingGroup,
  isAnyBatchPending,
  summary,
  onStartReadConfirm,
  onCancelReadConfirm,
  onConfirmRead,
  onStartDismissConfirm,
  onCancelDismissConfirm,
  onConfirmDismiss,
  actionGroupAriaLabel,
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label={actionGroupAriaLabel || `Actions for ${group.title ?? 'insight group'}`}
        >
          {unreadIds.length > 0 ? (
            needsReadConfirmation && isConfirmingRead ? (
              <>
                <button
                  type="button"
                  disabled={isAnyBatchPending}
                  onClick={onConfirmRead}
                  className="rounded-full border border-violet-100 bg-violet-50/10 px-3 py-1 text-xs font-semibold text-violet-900 transition hover:border-violet-200 hover:bg-violet-50/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isMarkingGroupRead ? 'Saving...' : `Confirm read ${unreadIds.length}`}
                </button>
                <button
                  type="button"
                  disabled={isMarkingGroupRead}
                  onClick={onCancelReadConfirm}
                  className="rounded-full border border-slate-200/80 bg-[var(--color-surface-subtle)] px-3 py-1 text-xs font-semibold text-slate-600 shadow-[var(--shadow-sm)] transition hover:border-slate-300 hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={isAnyBatchPending}
                onClick={onStartReadConfirm}
                className="rounded-full border border-slate-200/80 bg-[var(--color-surface-subtle)] px-3 py-1 text-xs font-semibold text-slate-700 shadow-[var(--shadow-sm)] transition hover:border-slate-300 hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isMarkingGroupRead ? 'Saving...' : 'Mark group read'}
              </button>
            )
          ) : null}

          {dismissibleIds.length > 0 ? (
            isConfirmingDismiss ? (
              <>
                <button
                  type="button"
                  disabled={isAnyBatchPending}
                  onClick={onConfirmDismiss}
                  className="rounded-full border border-rose-100 bg-rose-50/10 px-3 py-1 text-xs font-semibold text-rose-900 transition hover:border-rose-200 hover:bg-rose-50/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDismissingGroup ? 'Dismissing...' : `Confirm dismiss ${dismissibleIds.length}`}
                </button>
                <button
                  type="button"
                  disabled={isDismissingGroup}
                  onClick={onCancelDismissConfirm}
                  className="rounded-full border border-slate-200/80 bg-[var(--color-surface-subtle)] px-3 py-1 text-xs font-semibold text-slate-600 shadow-[var(--shadow-sm)] transition hover:border-slate-300 hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={isAnyBatchPending}
                onClick={onStartDismissConfirm}
                className="rounded-full border border-rose-100 bg-[var(--color-surface-subtle)] px-3 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-200 hover:bg-rose-50/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Dismiss low priority
              </button>
            )
          ) : null}
        </div>

        <dl className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <div>
            <dt className="sr-only">Total insights</dt>
            <dd className="rounded-full border border-slate-200/80 bg-[var(--color-surface-subtle)] px-3 py-1 text-slate-600 shadow-[var(--shadow-sm)]">
              {group.count} total
            </dd>
          </div>
          {group.critical > 0 ? (
            <div>
              <dt className="sr-only">Critical insights</dt>
              <dd className="rounded-full border border-rose-100 bg-rose-50/10 px-3 py-1 text-rose-700">
                {group.critical} critical
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      {(unreadIds.length > 0 || dismissibleIds.length > 0) ? (
        <ResponsiveCardGrid variant="default" className="mx-6 mb-4 md:grid-cols-2">
          {unreadIds.length > 0 ? (
            <div className={`rounded-[calc(var(--card-radius)-0.35rem)] border px-4 py-3 ${statusToneClasses.slate.panel}`}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${statusToneClasses.slate.badge}`}>
                  {GROUP_INSIGHT_ACTION_GUIDANCE.markRead.badge}
                </span>
                <span className={`text-xs font-semibold ${statusToneClasses.slate.heading}`}>
                  {GROUP_INSIGHT_ACTION_GUIDANCE.markRead.panelTitle}
                </span>
              </div>
              <p className={`text-xs leading-5 ${statusToneClasses.slate.body}`}>
                {GROUP_INSIGHT_ACTION_GUIDANCE.markRead.summary}
              </p>
            </div>
          ) : null}
          {dismissibleIds.length > 0 ? (
            <div className={`rounded-[calc(var(--card-radius)-0.35rem)] border px-4 py-3 ${statusToneClasses.rose.panel}`}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${statusToneClasses.rose.badge}`}>
                  {GROUP_INSIGHT_ACTION_GUIDANCE.dismiss.badge}
                </span>
                <span className={`text-xs font-semibold ${statusToneClasses.rose.heading}`}>
                  {GROUP_INSIGHT_ACTION_GUIDANCE.dismiss.panelTitle}
                </span>
              </div>
              <p className={`text-xs leading-5 ${statusToneClasses.rose.body}`}>
                {GROUP_INSIGHT_ACTION_GUIDANCE.dismiss.summary}
              </p>
            </div>
          ) : null}
        </ResponsiveCardGrid>
      ) : null}

      {needsReadConfirmation && isConfirmingRead ? (
        <div
          className={`mx-6 mb-4 rounded-[calc(var(--card-radius)-0.35rem)] border px-4 py-3 text-sm ${statusToneClasses.violet.panel}`}
          role="status"
          aria-live="polite"
        >
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">
            {GROUP_INSIGHT_ACTION_GUIDANCE.markRead.confirmationTitle}
          </div>
          <p className="leading-6">
            This will mark {unreadIds.length} unread insight{unreadIds.length === 1 ? '' : 's'} as handled for now in this group. {GROUP_INSIGHT_ACTION_GUIDANCE.markRead.confirmationSuffix}
          </p>
        </div>
      ) : null}
      {isConfirmingDismiss && dismissibleIds.length > 0 ? (
        <div
          className={`mx-6 mb-4 rounded-[calc(var(--card-radius)-0.35rem)] border px-4 py-3 text-sm ${statusToneClasses.rose.panel}`}
          role="status"
          aria-live="polite"
        >
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">
            {GROUP_INSIGHT_ACTION_GUIDANCE.dismiss.confirmationTitle}
          </div>
          <p className="leading-6">
            This will remove {dismissibleIds.length} non-critical insight{dismissibleIds.length === 1 ? '' : 's'} from this group. {GROUP_INSIGHT_ACTION_GUIDANCE.dismiss.confirmationSuffix}
          </p>
        </div>
      ) : null}
      {summary ? (
        <div
          className={`mx-6 mb-4 rounded-[calc(var(--card-radius)-0.35rem)] px-4 py-3 text-sm shadow-[var(--shadow-sm)] ${
            summary.tone === 'rose'
              ? 'border border-rose-100 bg-rose-50/10 text-rose-800'
              : 'border border-violet-100 bg-violet-50/10 text-violet-900'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className={`mb-1 text-xs font-semibold uppercase tracking-[0.2em] ${
            summary.tone === 'rose' ? 'text-rose-700' : 'text-violet-700'
          }`}
          >
            Recent update
          </div>
          <p className="leading-6">{summary.message}</p>
        </div>
      ) : null}
    </>
  );
}
