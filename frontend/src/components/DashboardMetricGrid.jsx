import OpsMetricCard from './OpsMetricCard';
import { ResponsiveCardGrid } from './PageShell';

export default function DashboardMetricGrid({
  metrics,
  className = '',
  ariaLabel = 'Dashboard metrics',
}) {
  return (
    <ResponsiveCardGrid as="ul" variant="metrics" className={className} aria-label={ariaLabel}>
      {metrics.map((metric) => (
        <li key={metric.label}>
          <OpsMetricCard
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            tone={metric.tone}
            className="rounded-2xl"
          />
        </li>
      ))}
    </ResponsiveCardGrid>
  );
}
