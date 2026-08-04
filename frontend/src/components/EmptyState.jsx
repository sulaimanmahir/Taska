import { useId } from 'react';

export default function EmptyState({
  icon = 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
  title = 'No data yet',
  description = 'Get started by adding your first item.',
  action = null,
  tone = 'slate',
  className = '',
  titleId,
  descriptionId,
}) {
  const generatedTitleId = useId();
  const generatedDescriptionId = useId();
  const resolvedTitleId = titleId || generatedTitleId;
  const resolvedDescriptionId = descriptionId || generatedDescriptionId;
  const toneClasses = {
    slate: {
      iconWrap: 'border border-slate-200/80 bg-[var(--color-surface-subtle)] shadow-[var(--shadow-sm)]',
      icon: 'text-slate-400',
      description: 'text-slate-500',
      action: 'bg-[var(--color-brand)] hover:bg-[var(--color-brand-strong)] focus-visible:ring-violet-200',
      actionText: 'text-white',
    },
    violet: {
      iconWrap: 'border border-violet-100 bg-violet-50/10 shadow-[var(--shadow-sm)]',
      icon: 'text-violet-500',
      description: 'text-violet-700/80',
      action: 'border border-violet-100 bg-violet-100 hover:bg-violet-200 focus-visible:ring-violet-200',
      actionText: 'text-violet-900',
    },
    amber: {
      iconWrap: 'border border-amber-100 bg-amber-50/10 shadow-[var(--shadow-sm)]',
      icon: 'text-amber-500',
      description: 'text-amber-800/80',
      action: 'border border-amber-100 bg-amber-100 hover:bg-amber-200 focus-visible:ring-amber-200',
      actionText: 'text-amber-900',
    },
    emerald: {
      iconWrap: 'border border-emerald-100 bg-emerald-50/10 shadow-[var(--shadow-sm)]',
      icon: 'text-emerald-500',
      description: 'text-emerald-800/80',
      action: 'border border-emerald-100 bg-emerald-100 hover:bg-emerald-200 focus-visible:ring-emerald-200',
      actionText: 'text-emerald-900',
    },
  };
  const palette = toneClasses[tone] || toneClasses.slate;

  return (
    <section
      aria-labelledby={resolvedTitleId}
      aria-describedby={description ? resolvedDescriptionId : undefined}
      className={`mx-auto flex max-w-[480px] flex-col items-center justify-center px-4 py-8 text-center ${className}`}
    >
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-[calc(var(--card-radius)-0.35rem)] ${palette.iconWrap}`}>
        <svg className={`h-6 w-6 ${palette.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
        </svg>
      </div>
      <h3 id={resolvedTitleId} className="mb-2 text-xl font-bold text-[var(--color-text)]">{title}</h3>
      <p id={resolvedDescriptionId} className={`mb-5 max-w-sm text-sm ${palette.description}`}>{description}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          aria-describedby={description ? resolvedDescriptionId : undefined}
          className={`inline-flex h-10 items-center gap-2 rounded-[var(--field-radius)] px-4 text-sm font-semibold shadow-[var(--shadow-sm)] transition-colors focus-visible:outline-none focus-visible:ring-4 ${palette.action} ${palette.actionText}`}
        >
          {action.icon && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
            </svg>
          )}
          {action.label}
        </button>
      )}
    </section>
  );
}
