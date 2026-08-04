import { useId } from 'react';
import { ResponsiveCardGrid } from './PageShell';

export default function FinanceSelectionBanner({
  eyebrow,
  title,
  subtitle,
  tone = 'slate',
  metrics = [],
  helper,
  metricsAriaLabel = 'Selection summary metrics',
}) {
  const titleId = useId();
  const subtitleId = useId();
  const helperId = useId();
  const toneClasses = {
    violet: 'border-violet-100 bg-violet-50/[0.03]',
    amber: 'border-amber-100 bg-amber-50/[0.03]',
    emerald: 'border-emerald-100 bg-emerald-50/[0.03]',
    slate: 'border-slate-200/80 bg-[var(--color-surface-subtle)]',
  };

  return (
    <section
      aria-labelledby={titleId}
      aria-describedby={[
        subtitle ? subtitleId : null,
        helper ? helperId : null,
      ].filter(Boolean).join(' ') || undefined}
      className={`rounded-[var(--card-radius)] border p-[var(--card-padding-sm)] shadow-[var(--shadow-sm)] ${toneClasses[tone] || toneClasses.slate}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p>
          ) : null}
          <h2 id={titleId} className="mt-1 text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle ? (
            <p id={subtitleId} className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p>
          ) : null}
        </div>
        {metrics.length > 0 ? (
          <ResponsiveCardGrid
            as="dl"
            variant="default"
            aria-label={metricsAriaLabel}
            className={`text-sm ${metrics.length >= 3 ? 'sm:grid-cols-3 xl:grid-cols-3' : metrics.length === 2 ? 'sm:grid-cols-2 xl:grid-cols-2' : 'xl:grid-cols-1'}`.trim()}
          >
            {metrics.map((metric) => (
              <div key={metric.label} className="min-w-[110px] rounded-[calc(var(--card-radius)-0.35rem)] border border-slate-200/80 bg-[var(--color-surface-subtle)] px-3 py-2.5 shadow-[var(--shadow-sm)]">
                <dt className="text-slate-500">{metric.label}</dt>
                <dd className={`mt-1 font-semibold ${metric.toneClass || 'text-slate-900'}`}>{metric.value}</dd>
              </div>
            ))}
          </ResponsiveCardGrid>
        ) : null}
      </div>
      {helper ? (
        <p id={helperId} className="mt-4 text-sm font-medium text-slate-600">{helper}</p>
      ) : null}
    </section>
  );
}
