import { useId } from 'react';
import Card, { CardHeader } from './Card';
import DashboardActionChipLink from './DashboardActionChipLink';
import DashboardFocusStack from './DashboardFocusStack';
import DashboardMetricGrid from './DashboardMetricGrid';
import DashboardSplitSection from './DashboardSplitSection';

export default function DashboardVerticalSection({ section, stats, actions = [] }) {
  const metricsTitleId = useId();
  const focusTitleId = useId();

  if (!section) {
    return null;
  }

  const metrics = section.metrics(stats);
  const focusItems = section.focusItems(stats);

  return (
    <DashboardSplitSection
      ariaLabel={`${section.title} dashboard section`}
      primary={(
        <Card as="section" aria-labelledby={metricsTitleId} className="xl:col-span-2">
          <CardHeader title={section.title} titleId={metricsTitleId} />
          <DashboardMetricGrid
            className={section.metricsClassName}
            metrics={metrics}
            ariaLabel={`${section.title} metrics`}
          />
        </Card>
      )}
      secondary={(
        <Card as="section" aria-labelledby={focusTitleId}>
          <CardHeader title={section.focusTitle} titleId={focusTitleId} />
          <DashboardFocusStack items={focusItems} ariaLabel={`${section.focusTitle} focus items`} />
          {actions.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {actions.map((action) => (
                <li key={`${section.focusTitle}-${action.label}`}>
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
