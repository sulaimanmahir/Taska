import { useId } from 'react';
import { ResponsiveCardGrid } from './PageShell';

function toneClasses(tone) {
  switch (tone) {
    case 'emerald':
      return {
        border: 'border-emerald-100',
        background: 'bg-emerald-50/10',
        eyebrow: 'text-emerald-700',
      };
    case 'amber':
      return {
        border: 'border-amber-100',
        background: 'bg-amber-50/10',
        eyebrow: 'text-amber-700',
      };
    case 'sky':
      return {
        border: 'border-sky-100',
        background: 'bg-sky-50/10',
        eyebrow: 'text-sky-700',
      };
    case 'violet':
      return {
        border: 'border-violet-100',
        background: 'bg-violet-50/10',
        eyebrow: 'text-violet-700',
      };
    default:
      return {
        border: 'border-slate-200/80',
        background: 'bg-[var(--color-surface-subtle)]',
        eyebrow: 'text-slate-500',
      };
  }
}

export default function FinanceLensSummary({
  items,
  className = '',
  ariaLabel = 'Finance lens summary cards',
  getActionsAriaLabel,
  sectionTitle = 'Finance lens summary',
}) {
  const sectionTitleId = useId();

  if (!items?.length) {
    return null;
  }

  return (
    <section
      aria-labelledby={sectionTitleId}
      className={className}
    >
      <h2 id={sectionTitleId} className="sr-only">{sectionTitle}</h2>
      <ResponsiveCardGrid as="ul" variant="default" className="md:grid-cols-2 xl:grid-cols-4" aria-label={ariaLabel}>
      {items.map((item) => {
        const classes = toneClasses(item.tone);

        return (
          <li
            key={item.label}
            className={`rounded-[var(--card-radius)] border p-[var(--card-padding-sm)] shadow-[var(--shadow-sm)] ${classes.border} ${classes.background}`}
          >
            <dl>
              <dt className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${classes.eyebrow}`}>
                {item.label}
              </dt>
              <dd className="mt-2 text-lg font-semibold text-slate-900">{item.value}</dd>
            {item.helper ? (
                <dd className="mt-1 text-sm text-slate-600">{item.helper}</dd>
            ) : null}
            </dl>
            {item.actions?.length ? (
              <ul
                className="mt-3 flex flex-wrap gap-2"
                role="group"
                aria-label={getActionsAriaLabel ? getActionsAriaLabel(item) : `${item.label} actions`}
              >
                {item.actions.map((action) => (
                  <li key={action.label}>
                    <button
                      type="button"
                      onClick={action.onClick}
                      aria-pressed={action.active ? 'true' : 'false'}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold shadow-[var(--shadow-sm)] transition focus-visible:outline-none focus-visible:ring-4 ${
                        action.active
                          ? 'border-slate-300 bg-slate-200 text-slate-950 focus-visible:ring-slate-200'
                          : 'border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-700 hover:border-slate-300 hover:bg-white focus-visible:ring-slate-200'
                      }`}
                    >
                      {action.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
      </ResponsiveCardGrid>
    </section>
  );
}
