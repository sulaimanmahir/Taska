import { Link } from 'react-router-dom';
import InsightCardList from './InsightCardList';
import DashboardActionChipLink from './DashboardActionChipLink';
import { buildInsightViewUrl } from '../lib/aiInsights';

export default function InsightGroupPreviewCard({
  group,
  getInsightAction,
  getInsightCardPresentationProps,
  getInsightFocusClasses,
  markReadMutation,
  dismissMutation,
  restoreMutation,
}) {
  return (
    <article
      className="rounded-[var(--card-radius)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-[var(--card-padding-sm)] shadow-[var(--shadow-sm)]"
      aria-labelledby={`insight-group-${group.key}-title`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 id={`insight-group-${group.key}-title`} className="text-sm font-semibold text-slate-900">{group.label}</h3>
          <dl className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <dt className="sr-only">Signals</dt>
              <dd>{group.count} signals</dd>
            </div>
            <div className="flex items-center gap-1">
              <dt className="sr-only">Unread</dt>
              <dd>{group.unread} unread</dd>
            </div>
          </dl>
        </div>
        <ul className="flex flex-wrap items-center gap-2">
          {group.critical > 0 ? (
            <li>
              <span className="rounded-full border border-rose-100 bg-rose-50/10 px-2 py-1 text-[10px] font-semibold uppercase text-rose-700">
                {group.critical} critical
              </span>
            </li>
          ) : null}
          <li>
            <DashboardActionChipLink
              to={buildInsightViewUrl({ groupKey: group.key })}
              tone="slate"
              label="Open group"
              className="px-2.5 py-1 text-[10px] uppercase tracking-wide"
            />
          </li>
        </ul>
      </div>

      <div className="mt-3">
        <InsightCardList
          insights={(group.items || []).slice(0, 2)}
          compact
          ariaLabel={`${group.label} insight preview`}
          getInsightAction={(insight) => getInsightAction(insight, buildInsightViewUrl({
            groupKey: group.key,
            insightId: insight.id,
          }))}
          getInsightCardPresentationProps={getInsightCardPresentationProps}
          getInsightFocusClasses={getInsightFocusClasses}
          markReadMutation={markReadMutation}
          dismissMutation={dismissMutation}
          restoreMutation={restoreMutation}
          unreadClasses="ring-2 ring-violet-300 ring-offset-2 ring-offset-[var(--color-surface-subtle)]"
        />
      </div>
    </article>
  );
}
