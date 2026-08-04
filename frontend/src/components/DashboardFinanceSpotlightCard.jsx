import { useId } from 'react';

export default function DashboardFinanceSpotlightCard({
  eyebrow,
  title,
  description,
  statusLabel,
  statusClass,
  className = '',
}) {
  const titleId = useId();

  return (
    <article
      aria-labelledby={titleId}
      className={`rounded-[var(--card-radius)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-[var(--card-padding-sm)] shadow-[var(--shadow-sm)] ${className}`.trim()}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <dl>
          <dt id={titleId} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{eyebrow}</dt>
          <dd className="mt-2 text-lg font-semibold text-slate-900">{title}</dd>
          <dd className="mt-1 text-sm text-slate-600">{description}</dd>
        </dl>
        {statusLabel ? (
          <dl>
            <dt className="sr-only">Status</dt>
            <dd className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold shadow-[var(--shadow-sm)] ${statusClass || 'border border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-700'}`}>
              {statusLabel}
            </dd>
          </dl>
        ) : null}
      </div>
    </article>
  );
}
