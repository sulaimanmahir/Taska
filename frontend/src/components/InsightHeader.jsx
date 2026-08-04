import {
  formatInsightType,
  getInsightTypeColor,
  getInsightTypeIcon,
} from '../lib/aiInsights';

export default function InsightHeader({ insight, compact = false }) {
  if (compact) {
    return (
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-slate-900">{insight.title}</h3>
        </div>
        <dl className="flex flex-wrap items-center justify-end gap-2">
          <div>
            <dt className="sr-only">Severity</dt>
            <dd
              className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${
                insight.severity === 'critical'
                  ? 'border-rose-100 bg-rose-50/10 text-rose-700'
                  : insight.severity === 'warning'
                    ? 'border-amber-100 bg-amber-50/10 text-amber-700'
                    : 'border-sky-100 bg-sky-50/10 text-sky-700'
              }`}
            >
              {insight.severity}
            </dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getInsightTypeColor(insight.type)}`}>
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getInsightTypeIcon(insight.type)} />
          </svg>
        </div>
        <dl className="flex flex-wrap items-center justify-end gap-2">
          <div>
            <dt className="sr-only">Insight type</dt>
            <dd className="text-right text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {formatInsightType(insight.type)}
            </dd>
          </div>
          <div>
            <dt className="sr-only">Severity</dt>
            <dd
              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${
                insight.severity === 'critical'
                  ? 'border-rose-100 bg-rose-50/10 text-rose-700'
                  : insight.severity === 'warning'
                    ? 'border-amber-100 bg-amber-50/10 text-amber-700'
                    : 'border-sky-100 bg-sky-50/10 text-sky-700'
              }`}
            >
              {insight.severity}
            </dd>
          </div>
        </dl>
      </div>

      <h3 className="mb-2 font-semibold text-slate-900">{insight.title}</h3>
    </>
  );
}
