import { ContentGrid } from './PageShell';

export default function DashboardSplitSection({
  primary,
  secondary,
  className = '',
  ariaLabel = 'Dashboard split section',
}) {
  return (
    <ContentGrid as="section" columns="sidebar" aria-label={ariaLabel} className={className}>
      {primary}
      {secondary}
    </ContentGrid>
  );
}
