import { useId } from 'react';
import { formatShortDate } from '../lib/financeFormatters';

const toneClasses = {
  violet: 'border-violet-100 bg-violet-50/10 text-violet-700',
  amber: 'border-amber-100 bg-amber-50/10 text-amber-800',
  emerald: 'border-emerald-100 bg-emerald-50/10 text-emerald-700',
};

const riskClasses = {
  low: 'border border-emerald-100 bg-emerald-50/10 text-emerald-700',
  medium: 'border border-amber-100 bg-amber-50/10 text-amber-800',
  high: 'border border-rose-100 bg-rose-50/10 text-rose-700',
};
const reviewDateClass = 'rounded-full border border-slate-200/80 bg-[var(--color-surface-subtle)] px-2.5 py-1 text-slate-700 shadow-[var(--shadow-sm)]';

const riskLabels = {
  low: 'Low risk',
  medium: 'Watch closely',
  high: 'High urgency',
};

export default function FinanceRecommendationInline({
  recommendation,
  defaultTone = 'violet',
  className = '',
  summaryLabel,
  summaryTone,
  reviewDetailsLabel = 'Why and review',
}) {
  const summaryLabelId = useId();
  const messageId = useId();
  const reviewHeadingId = useId();
  if (!recommendation?.message) {
    return null;
  }

  const toneClass = toneClasses[recommendation.tone] || toneClasses[defaultTone] || toneClasses.violet;
  const hasMeta = Boolean(recommendation.risk_level || recommendation.next_review_date || recommendation.why);
  const summaryToneClass = toneClasses[summaryTone] || toneClasses[defaultTone] || toneClasses.violet;

  return (
    <section
      aria-labelledby={summaryLabel ? summaryLabelId : messageId}
      className={`rounded-[calc(var(--card-radius)-0.35rem)] border px-3 py-2 text-xs shadow-[var(--shadow-sm)] ${toneClass} ${className}`.trim()}
    >
      {summaryLabel ? (
        <div className="mb-2">
          <p id={summaryLabelId} className="sr-only">{summaryLabel}</p>
          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-[var(--shadow-sm)] ${summaryToneClass}`}>
            {summaryLabel}
          </span>
        </div>
      ) : null}
      <p id={messageId} className="font-medium">{recommendation.message}</p>
      {hasMeta ? (
        <>
          <details className="mt-2 sm:hidden">
            <summary className="cursor-pointer list-none font-medium marker:hidden">
              {reviewDetailsLabel}
            </summary>
            <div className="mt-2 space-y-2">
              <dl className="flex flex-wrap items-center gap-2">
                {recommendation.risk_level ? (
                  <div>
                    <dt className="sr-only">Risk level</dt>
                    <dd className={`rounded-full px-2.5 py-1 font-semibold shadow-[var(--shadow-sm)] ${riskClasses[recommendation.risk_level] || 'border border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-700'}`}>
                      {riskLabels[recommendation.risk_level] || 'Review needed'}
                    </dd>
                  </div>
                ) : null}
                {recommendation.next_review_date ? (
                  <div>
                    <dt className="sr-only">Next review date</dt>
                    <dd className={reviewDateClass}>
                      Review by {formatShortDate(recommendation.next_review_date, 'No review date')}
                    </dd>
                  </div>
                ) : null}
              </dl>
              {recommendation.why ? (
                <p className="opacity-80">{recommendation.why}</p>
              ) : null}
            </div>
          </details>
          <div className="mt-2 hidden space-y-2 sm:block">
            <p id={reviewHeadingId} className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-80">
              {reviewDetailsLabel}
            </p>
            <dl className="flex flex-wrap items-center gap-2">
              {recommendation.risk_level ? (
                <div>
                  <dt className="sr-only">Risk level</dt>
                  <dd className={`rounded-full px-2.5 py-1 font-semibold shadow-[var(--shadow-sm)] ${riskClasses[recommendation.risk_level] || 'border border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-700'}`}>
                    {riskLabels[recommendation.risk_level] || 'Review needed'}
                  </dd>
                </div>
              ) : null}
              {recommendation.next_review_date ? (
                <div>
                  <dt className="sr-only">Next review date</dt>
                  <dd className={reviewDateClass}>
                    Review by {formatShortDate(recommendation.next_review_date, 'No review date')}
                  </dd>
                </div>
              ) : null}
            </dl>
            {recommendation.why ? (
              <p className="opacity-80">{recommendation.why}</p>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
