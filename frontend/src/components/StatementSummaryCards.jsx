import { useId } from 'react';
import { ResponsiveCardGrid } from './PageShell';

const toneClasses = {
  emerald: 'text-emerald-700',
  amber: 'text-amber-700',
  violet: 'text-violet-700',
  slate: 'text-slate-900',
  sky: 'text-sky-700',
  rose: 'text-rose-700',
};

function StatementSummaryCard({ item, palette }) {
  const labelId = useId();

  return (
    <li>
      <article
        aria-labelledby={labelId}
        className={`rounded-[var(--card-radius)] border border-slate-200/80 bg-linear-to-br ${palette.panel} p-[var(--card-padding-sm)] shadow-[var(--shadow-sm)]`}
      >
        <dl>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${palette.accentDot}`} aria-hidden="true" />
            <dt id={labelId} className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${palette.eyebrow}`}>{item.label}</dt>
          </div>
          <div className={`mt-3 rounded-[calc(var(--card-radius)-0.35rem)] border px-4 py-3 shadow-[var(--shadow-sm)] ${palette.valueWrap}`}>
            <dd className={`text-base font-semibold sm:text-lg ${toneClasses[item.tone] || toneClasses.slate}`}>
              {item.value}
            </dd>
          </div>
        </dl>
      </article>
    </li>
  );
}

export default function StatementSummaryCards({
  items = [],
  accent = 'slate',
  ariaLabel = 'Statement summary cards',
}) {
  const accentClasses = {
    slate: {
      panel: 'from-white via-slate-50 to-slate-100/80',
      eyebrow: 'text-slate-500',
      accentDot: 'bg-slate-900',
      valueWrap: 'bg-[var(--color-surface-subtle)] border-slate-200/80',
    },
    violet: {
      panel: 'from-violet-50 via-white to-slate-50',
      eyebrow: 'text-violet-700',
      accentDot: 'bg-violet-200',
      valueWrap: 'bg-violet-50/[0.03] border-violet-100',
    },
    amber: {
      panel: 'from-amber-50 via-white to-slate-50',
      eyebrow: 'text-amber-700',
      accentDot: 'bg-amber-200',
      valueWrap: 'bg-amber-50/[0.03] border-amber-100',
    },
  };
  const palette = accentClasses[accent] || accentClasses.slate;

  return (
    <ResponsiveCardGrid
      as="ul"
      variant="default"
      ariaLabel={ariaLabel}
      className={`${items.length >= 3 ? 'md:grid-cols-3' : items.length === 2 ? 'md:grid-cols-2' : ''}`.trim()}
    >
      {items.map((item) => (
        <StatementSummaryCard key={item.label} item={item} palette={palette} />
      ))}
    </ResponsiveCardGrid>
  );
}
