import { useId, useMemo } from 'react';
import { formatCurrencyNGN } from '../lib/financeFormatters';

export default function StatsCard({
  title,
  value,
  change,
  changeType = 'percentage',
  icon,
  format = 'number',
  trend = 'neutral',
  loading = false,
}) {
  const titleId = useId();
  const formattedValue = useMemo(() => {
    if (loading) return '---';
    if (!value && value !== 0) return '--';

    switch (format) {
      case 'currency':
        return formatCurrencyNGN(value);
      case 'percent':
        return `${value.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('en-NG').format(value);
    }
  }, [value, format, loading]);

  const trendColors = {
    up: 'border border-emerald-100 bg-emerald-50/10 text-emerald-700 shadow-[var(--shadow-sm)]',
    down: 'border border-rose-100 bg-rose-50/10 text-rose-700 shadow-[var(--shadow-sm)]',
    neutral: 'border border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-600 shadow-[var(--shadow-sm)]',
  };

  const trendIcon = {
    up: '+',
    down: '-',
    neutral: '=',
  };

  return (
    <article
      aria-labelledby={titleId}
      className="min-h-[120px] rounded-[var(--card-radius)] border border-[var(--color-border)] bg-white p-[var(--card-padding)] shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-md)]"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <p id={titleId} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">{title}</p>
        {icon ? (
          <div aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-soft)]">
            <svg aria-hidden="true" className="h-5 w-5 text-[var(--color-brand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
            </svg>
          </div>
        ) : null}
      </div>

      <dl className="flex items-end justify-between">
        <div>
          <dt className="sr-only">{title}</dt>
          <dd className={`text-[clamp(1.68rem,0.9vw+1.22rem,2.1rem)] font-bold leading-tight text-[var(--color-text)] ${loading ? 'animate-pulse' : ''}`}>
            {formattedValue}
          </dd>
          {change !== undefined && !loading ? (
            <dd className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${trendColors[trend]}`}>
              <span aria-hidden="true">{trendIcon[trend]}</span>
              <span>{change}{changeType === 'percentage' ? '%' : ''}</span>
              <span className="font-normal text-slate-500">vs last month</span>
            </dd>
          ) : null}
        </div>
      </dl>
    </article>
  );
}
