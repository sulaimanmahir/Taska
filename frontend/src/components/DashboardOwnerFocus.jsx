import { useId } from 'react';
import Card, { CardHeader } from './Card';
import DashboardActionChipLink from './DashboardActionChipLink';
import DashboardSplitSection from './DashboardSplitSection';
import OpsMetricCard from './OpsMetricCard';
import { ResponsiveCardGrid } from './PageShell';

function FocusSummaryCard({ item, color }) {
  const titleId = useId();

  if (item.tone === 'brand') {
    return (
      <article
        aria-labelledby={titleId}
        className="rounded-[var(--card-radius)] border p-[var(--card-padding)] shadow-[var(--shadow-sm)]"
        style={{ background: `${color}10`, borderColor: `${color}22` }}
      >
        <h3 id={titleId} className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color }}>{item.title}</h3>
        <p className="mt-2.5 text-sm leading-6 text-slate-700">{item.body}</p>
      </article>
    );
  }

  const metricTone = {
    rose: 'rose',
    amber: 'amber',
    sky: 'sky',
  };

  return (
    <OpsMetricCard
      label={item.title}
      value={item.value || item.metric || item.summary || 'Watch'}
      helper={(item.lines || []).join(' ')}
      tone={metricTone[item.tone] || 'slate'}
      className="min-h-[136px]"
    />
  );
}

export default function DashboardOwnerFocus({ ownerFocus, color, actions = [] }) {
  const ownerFocusTitleId = useId();
  const monthlyReportTitleId = useId();

  if (!ownerFocus) {
    return null;
  }

  return (
    <DashboardSplitSection
      ariaLabel="Owner focus dashboard section"
      primary={(
        <Card as="section" aria-labelledby={ownerFocusTitleId} className="xl:col-span-2">
          <CardHeader
            title="Owner Focus"
            subtitle="Daily control based on your industry economics"
            titleId={ownerFocusTitleId}
          />
          <ResponsiveCardGrid as="ul" variant="default" className="md:grid-cols-2">
            {ownerFocus.summaryCards.map((item) => (
              <li key={item.title}>
                <FocusSummaryCard item={item} color={color} />
              </li>
            ))}
          </ResponsiveCardGrid>
        </Card>
      )}
      secondary={(
        <Card as="section" aria-labelledby={monthlyReportTitleId}>
          <CardHeader title="Monthly Report Stack" titleId={monthlyReportTitleId} />
          <ResponsiveCardGrid as="ul" variant="default" className="text-sm">
            {ownerFocus.monthlyReports.map((report) => (
              <li key={report}>
                <article className="rounded-[calc(var(--card-radius)-0.35rem)] border border-slate-200/80 bg-[var(--color-surface-subtle)] px-4 py-3 text-sm text-slate-700 shadow-[var(--shadow-sm)]">
                  {report}
                </article>
              </li>
            ))}
          </ResponsiveCardGrid>
          <div className="mt-4 rounded-[calc(var(--card-radius)-0.2rem)] border border-slate-200/80 bg-[var(--color-surface-subtle)] p-[var(--card-padding-sm)] shadow-[var(--shadow-sm)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Module controls now expected</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {ownerFocus.featureHighlights.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>
          {actions.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {actions.map((action) => (
                <li key={`owner-focus-${action.label}`}>
                  <DashboardActionChipLink
                    to={action.to}
                    tone={action.tone}
                    label={action.label}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      )}
    />
  );
}
