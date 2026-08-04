import { formatShortDate } from '../lib/financeFormatters';

const riskLabels = {
  low: 'Low risk',
  medium: 'Watch closely',
  high: 'High urgency',
};

export default function FinanceRecommendationCard({
  message,
  tone = 'violet',
  why,
  riskLevel,
  nextReviewDate,
  summaryLabel,
  summaryTone,
}) {
  if (!message) {
    return null;
  }

  const toneClasses = {
    violet: 'border-violet-100 bg-violet-50/5 text-violet-800',
    amber: 'border-amber-100 bg-amber-50/5 text-amber-900',
    emerald: 'border-emerald-100 bg-emerald-50/5 text-emerald-900',
  };
  const riskToneClasses = {
    low: 'border border-emerald-100 bg-emerald-50/10 text-emerald-700',
    medium: 'border border-amber-100 bg-amber-50/10 text-amber-800',
    high: 'border border-rose-100 bg-rose-50/10 text-rose-700',
  };
  const summaryToneClasses = {
    violet: 'border border-violet-100 bg-violet-50/10 text-violet-700',
    amber: 'border border-amber-100 bg-amber-50/10 text-amber-800',
    emerald: 'border border-emerald-100 bg-emerald-50/10 text-emerald-700',
    sky: 'border border-sky-100 bg-sky-50/10 text-sky-700',
  };
  const showMeta = Boolean(why || riskLevel || nextReviewDate);

  return (
    <div className={`rounded-[var(--card-radius)] border p-[var(--card-padding-sm)] text-sm shadow-[var(--shadow-sm)] ${toneClasses[tone] || toneClasses.violet}`}>
      {summaryLabel ? (
        <div className="mb-2">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-[var(--shadow-sm)] ${summaryToneClasses[summaryTone] || summaryToneClasses.violet}`}>
            {summaryLabel}
          </span>
        </div>
      ) : null}
      <p className="font-medium">{message}</p>
      {showMeta ? (
        <div className="mt-3 space-y-2">
          {why ? (
            <p className="text-xs leading-5 opacity-90">
              Why it matters: {why}
            </p>
          ) : null}
          <dl className="flex flex-wrap items-center gap-2 text-xs font-medium">
            {riskLevel ? (
              <div>
                <dt className="sr-only">Risk level</dt>
                <dd className={`rounded-full px-2.5 py-1 shadow-[var(--shadow-sm)] ${riskToneClasses[riskLevel] || 'border border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-700'}`}>
                  {riskLabels[riskLevel] || 'Review needed'}
                </dd>
              </div>
            ) : null}
            {nextReviewDate ? (
              <div>
                <dt className="sr-only">Next review date</dt>
                <dd className="rounded-full border border-slate-200/80 bg-[var(--color-surface-subtle)] px-2.5 py-1 text-slate-700 shadow-[var(--shadow-sm)]">
                  Review by {formatShortDate(nextReviewDate, 'No review date')}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}
    </div>
  );
}
