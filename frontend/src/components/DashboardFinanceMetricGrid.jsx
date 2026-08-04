import OpsMetricCard from './OpsMetricCard';
import { ResponsiveCardGrid } from './PageShell';

export default function DashboardFinanceMetricGrid({
  metrics,
  className = 'md:grid-cols-2 xl:grid-cols-4',
  ariaLabel = 'Finance metrics',
}) {
  return (
    <ResponsiveCardGrid as="ul" variant="metrics" className={className} aria-label={ariaLabel}>
      {metrics.filter(Boolean).map((metric) => (
        <li key={metric.label}>
          <OpsMetricCard
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            tone={metric.tone}
            className={metric.className || 'rounded-2xl'}
          />
        </li>
      ))}
    </ResponsiveCardGrid>
  );
}
