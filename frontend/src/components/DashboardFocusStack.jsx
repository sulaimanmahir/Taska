import { useId } from 'react';
import { ResponsiveCardGrid } from './PageShell';

function FocusStackItem({ item, badgeClasses }) {
  const titleId = useId();

  return (
    <li>
      <article
        aria-labelledby={titleId}
        className="rounded-[var(--card-radius)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-[var(--card-padding-sm)] shadow-[var(--shadow-sm)]"
      >
        {item.summaryLabel || item.secondaryBadges?.length ? (
          <ul className="mb-2 flex flex-wrap gap-2">
            {item.summaryLabel ? (
              <li>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-[var(--shadow-sm)] ${badgeClasses[item.summaryTone] || badgeClasses.violet}`}>
                  {item.summaryLabel}
                </span>
              </li>
            ) : null}
            {item.secondaryBadges?.filter(Boolean).map((badge) => (
              <li key={`${item.title}-${badge.label}`}>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-[var(--shadow-sm)] ${badgeClasses[badge.tone] || badgeClasses.slate}`}
                >
                  {badge.label}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <h3 id={titleId} className="font-semibold text-slate-900">{item.title}</h3>
        <details className="mt-2 sm:hidden">
          <summary className="cursor-pointer list-none font-medium text-violet-700 marker:hidden">
            View details
          </summary>
          {item.lines?.length ? (
            <div className="mt-2 space-y-2">
              {item.lines.map((line) => <p key={line}>{line}</p>)}
            </div>
          ) : (
            <p className="mt-2">{item.body}</p>
          )}
        </details>
        {item.lines?.length ? (
          <div className="mt-2 hidden space-y-2 sm:block">
            {item.lines.map((line) => <p key={line}>{line}</p>)}
          </div>
        ) : (
          <p className="mt-2 hidden sm:block">{item.body}</p>
        )}
        {item.action ? (
          <div className="mt-3">
            {item.action}
          </div>
        ) : null}
      </article>
    </li>
  );
}

export default function DashboardFocusStack({
  items,
  className = 'text-sm text-slate-600',
  ariaLabel = 'Focus items',
}) {
  const badgeClasses = {
    violet: 'border-violet-100 bg-violet-50/10 text-violet-700',
    amber: 'border-amber-100 bg-amber-50/10 text-amber-700',
    emerald: 'border-emerald-100 bg-emerald-50/10 text-emerald-700',
    sky: 'border-sky-100 bg-sky-50/10 text-sky-700',
    slate: 'border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-700',
  };

  return (
    <ResponsiveCardGrid as="ul" variant="default" className={className} aria-label={ariaLabel}>
      {items.filter(Boolean).map((item) => (
        <FocusStackItem key={item.title} item={item} badgeClasses={badgeClasses} />
      ))}
    </ResponsiveCardGrid>
  );
}
