import { useId } from 'react';
import Card from './Card';
import EmptyState from './EmptyState';

const insightIcon = 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a4.98 4.98 0 013.217-2.827 4.996 4.996 0 00.526-1.783 4.996 4.996 0 00-1.783-.526 4.98 4.98 0 01-2.827-3.217V5';
const warningIcon = 'M12 9v3.75m0 3.75h.008v.008H12v-.008zm8.25-.75a8.25 8.25 0 11-16.5 0 8.25 8.25 0 0116.5 0z';

export default function InsightStatePanel({
  title,
  description,
  tone = 'violet',
  onRetry,
  retryLabel = 'Try again',
}) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Card
      as="section"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className="p-[var(--card-padding-sm)]"
    >
      <EmptyState
        icon={tone === 'rose' ? warningIcon : insightIcon}
        title={title}
        description={description}
        tone={tone}
        action={onRetry ? { label: retryLabel, onClick: onRetry } : null}
        className="py-4"
        titleId={titleId}
        descriptionId={description ? descriptionId : undefined}
      />
    </Card>
  );
}
