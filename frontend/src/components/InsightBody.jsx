import { useId } from 'react';

export default function InsightBody({ insight, compact = false }) {
  const recommendationHeadingId = useId();
  const summaryClass = compact
    ? 'text-xs font-medium text-violet-700'
    : 'text-sm font-medium text-violet-700';
  const descriptionClass = compact
    ? 'text-xs text-slate-600'
    : 'text-sm text-slate-600';

  return (
    <>
      <details className={compact ? 'mt-1 sm:hidden' : 'mb-4 sm:hidden'}>
        <summary className={`cursor-pointer list-none marker:hidden ${summaryClass}`}>
          Insight details
        </summary>
        <div className="mt-2 space-y-4">
          <p className={descriptionClass}>{insight.description}</p>
          {insight.recommendation ? (
            <section
              aria-labelledby={recommendationHeadingId}
              className="rounded-[calc(var(--card-radius)-0.35rem)] border border-violet-100 bg-violet-50/10 p-3 shadow-[var(--shadow-sm)]"
            >
              <h3 id={recommendationHeadingId} className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">What to do next</h3>
              <p className="text-sm font-medium text-slate-900">{insight.recommendation}</p>
            </section>
          ) : null}
        </div>
      </details>

      {compact ? (
        <p className="mt-1 hidden text-xs text-slate-600 sm:block">{insight.recommendation || insight.description}</p>
      ) : (
        <div className="mb-4 hidden space-y-4 sm:block">
          <p className={descriptionClass}>{insight.description}</p>
          {insight.recommendation ? (
            <section
              aria-labelledby={recommendationHeadingId}
              className="rounded-[calc(var(--card-radius)-0.35rem)] border border-violet-100 bg-violet-50/10 p-3 shadow-[var(--shadow-sm)]"
            >
              <h3 id={recommendationHeadingId} className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">What to do next</h3>
              <p className="text-sm font-medium text-slate-900">{insight.recommendation}</p>
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
