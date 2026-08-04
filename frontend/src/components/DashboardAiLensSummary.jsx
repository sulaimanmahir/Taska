import { useId } from 'react';
import { ResponsiveCardGrid } from './PageShell';

const toneClasses = {
  violet: {
    wrapper: 'border-violet-100 bg-violet-50/10',
    eyebrow: 'text-violet-600',
    value: 'text-violet-950',
    description: 'text-violet-800',
  },
  rose: {
    wrapper: 'border-rose-100 bg-rose-50/10',
    eyebrow: 'text-rose-600',
    value: 'text-rose-950',
    description: 'text-rose-800',
  },
  sky: {
    wrapper: 'border-sky-100 bg-sky-50/10',
    eyebrow: 'text-sky-600',
    value: 'text-sky-950',
    description: 'text-sky-800',
  },
  slate: {
    wrapper: 'border-slate-200/80 bg-[var(--color-surface-subtle)]',
    eyebrow: 'text-slate-500',
    value: 'text-slate-900',
    description: 'text-slate-600',
  },
};

function LensSummaryItem({ lens, tone }) {
  const titleId = useId();

  return (
    <li>
      <article
        aria-labelledby={titleId}
        className={`rounded-[var(--card-radius)] border p-[var(--card-padding-sm)] shadow-[var(--shadow-sm)] ${tone.wrapper}`}
      >
        <dl>
          <dt id={titleId} className={`mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${tone.eyebrow}`}>
            {lens.title}
          </dt>
          <dd className={`text-base font-semibold ${tone.value}`}>
            {lens.value}
          </dd>
          <dd className={`mt-1 text-sm ${tone.description}`}>
            {lens.description}
          </dd>
        </dl>
      </article>
    </li>
  );
}

export default function DashboardAiLensSummary({
  lenses,
  className = 'mt-4 md:grid-cols-2 xl:grid-cols-4',
  ariaLabel = 'AI lens summaries',
}) {
  return (
    <ResponsiveCardGrid as="ul" variant="default" className={className} aria-label={ariaLabel}>
      {lenses.filter(Boolean).map((lens) => {
        const tone = toneClasses[lens.tone] || toneClasses.slate;

        return <LensSummaryItem key={lens.title} lens={lens} tone={tone} />;
      })}
    </ResponsiveCardGrid>
  );
}
