import { useId } from 'react';
import { Link } from 'react-router-dom';
import Card, { CardHeader } from './Card';
import DashboardFinanceDetailTiles from './DashboardFinanceDetailTiles';
import DashboardFinanceMetricGrid from './DashboardFinanceMetricGrid';
import DashboardFinanceSpotlightCard from './DashboardFinanceSpotlightCard';

export default function DashboardFinanceWatchCard({
  title,
  subtitle,
  action,
  metrics,
  spotlight,
  detailTiles,
  className = 'xl:col-span-2',
}) {
  const titleId = useId();
  const subtitleId = useId();

  return (
    <Card
      as="section"
      aria-labelledby={titleId}
      aria-describedby={subtitle ? subtitleId : undefined}
      className={className}
    >
      <CardHeader
        title={title}
        subtitle={subtitle}
        titleId={titleId}
        subtitleId={subtitle ? subtitleId : undefined}
        action={action ? (
          <Link
            to={action.to}
            className="text-sm font-medium hover:opacity-80"
            style={action.color ? { color: action.color } : undefined}
          >
            {action.label}
          </Link>
        ) : null}
      />
      <DashboardFinanceMetricGrid metrics={metrics} ariaLabel={`${title} metrics`} />

      {spotlight ? (
        <DashboardFinanceSpotlightCard
          className="mt-4"
          eyebrow={spotlight.eyebrow}
          title={spotlight.title}
          description={spotlight.description}
          statusLabel={spotlight.statusLabel}
          statusClass={spotlight.statusClass}
        />
      ) : null}

      {detailTiles?.length ? (
        <DashboardFinanceDetailTiles items={detailTiles} ariaLabel={`${title} details`} />
      ) : null}
    </Card>
  );
}
