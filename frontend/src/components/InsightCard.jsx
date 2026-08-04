import { Link } from 'react-router-dom';
import Card from './Card';
import InsightActionButtons from './InsightActionButtons';
import InsightBody from './InsightBody';
import InsightHeader from './InsightHeader';

export default function InsightCard({
  insight,
  compact = false,
  unreadClasses = '',
  focusClasses = '',
  action,
  highlights = [],
  updatedLabel,
  actionButtons,
}) {
  if (compact) {
    return (
      <article
        aria-labelledby={`insight-${insight.id}-title`}
        className={`rounded-[calc(var(--card-radius)-0.4rem)] border border-slate-200/80 bg-[var(--panel-strong)] px-3 py-3 shadow-[var(--shadow-sm)] ${unreadClasses} ${focusClasses}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div id={`insight-${insight.id}-title`}>
              <InsightHeader insight={insight} compact />
            </div>
            <InsightBody insight={insight} compact />
          </div>
          {action ? (
            <Link
              to={action.to}
              className="shrink-0 rounded-full border border-slate-200/80 bg-[var(--color-surface-subtle)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-800 shadow-[var(--shadow-sm)] transition hover:border-slate-300 hover:bg-white"
            >
              {action.label}
            </Link>
          ) : null}
        </div>
        <div className="mt-3">
          <InsightActionButtons {...actionButtons} size="xs" />
        </div>
      </article>
    );
  }

  return (
    <Card className={`border-slate-200/80 bg-[var(--panel-strong)] transition-all ${unreadClasses} ${focusClasses}`}>
      <article aria-labelledby={`insight-${insight.id}-title`}>
        <div id={`insight-${insight.id}-title`}>
          <InsightHeader insight={insight} />
        </div>
        <InsightBody insight={insight} />

        {highlights.length > 0 ? (
          <dl className="mb-4 grid grid-cols-1 gap-2">
            {highlights.map((highlight) => (
              <div
                key={`${insight.id}-${highlight.label}`}
                className="flex items-center justify-between rounded-[calc(var(--card-radius)-0.55rem)] border border-slate-200/80 bg-[var(--color-bg-subtle)] px-3 py-2.5"
              >
                <dt className="text-xs font-medium text-slate-500">{highlight.label}</dt>
                <dd className="text-sm font-semibold text-slate-900">{highlight.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-slate-500">{updatedLabel}</span>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {action ? (
              <Link
                to={action.to}
                className="rounded-full border border-slate-200/80 bg-[var(--color-surface-subtle)] px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-[var(--shadow-sm)] transition hover:border-slate-300 hover:bg-white"
              >
                {action.label}
              </Link>
            ) : null}
            <InsightActionButtons {...actionButtons} />
          </div>
        </div>
      </article>
    </Card>
  );
}
