import InsightActionButtons from './InsightActionButtons';

export default function InsightActionItemCard({
  action,
  isBusy,
  isMarkingRead,
  isDismissing,
  onMarkRead,
  onDismiss,
}) {
  return (
    <article
      aria-labelledby={`insight-action-${action.id}-title`}
      className={`rounded-[var(--card-radius)] border p-[var(--card-padding-sm)] shadow-[var(--shadow-sm)] transition ${
        action.is_read
          ? 'border-slate-200 bg-[var(--color-surface-subtle)]'
          : 'border-violet-300 bg-white ring-2 ring-violet-300 ring-offset-2 ring-offset-[var(--color-surface-subtle)]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 id={`insight-action-${action.id}-title`} className="text-sm font-semibold text-slate-900">{action.title}</h3>
          <p className="mt-1 text-[11px] font-medium text-slate-500">
            {action.is_read ? 'Handled for now' : 'Needs owner attention'}
          </p>
        </div>
        <dl className="flex items-center gap-2">
          <div>
            <dt className="sr-only">Insight group</dt>
            <dd
              className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${
                action.severity === 'critical'
                  ? 'border-rose-100 bg-rose-50/10 text-rose-700'
                  : action.severity === 'warning'
                    ? 'border-amber-100 bg-amber-50/10 text-amber-700'
                    : 'border-sky-100 bg-sky-50/10 text-sky-700'
              }`}
            >
              {action.group_label}
            </dd>
          </div>
          {action.is_read ? (
            <div>
              <dt className="sr-only">Read status</dt>
              <dd className="rounded-full border border-emerald-100 bg-emerald-50/10 px-2 py-1 text-[10px] font-semibold uppercase text-emerald-700">
                Read
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      <details className="mt-3 sm:hidden">
        <summary className="cursor-pointer list-none text-xs font-medium text-violet-700 marker:hidden">
          Next step
        </summary>
        <p className="mt-2 text-xs font-medium text-slate-700">Next: {action.recommendation}</p>
      </details>
      <p className="mt-3 hidden text-xs font-medium text-slate-700 sm:block">Next: {action.recommendation}</p>

      <div className="mt-3">
        <InsightActionButtons
          isRead={action.is_read}
          isBusy={isBusy}
          isMarkingRead={isMarkingRead}
          isDismissing={isDismissing}
          onMarkRead={onMarkRead}
          onDismiss={onDismiss}
          size="xs"
        />
      </div>
    </article>
  );
}
