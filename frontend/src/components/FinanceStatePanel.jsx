import { useId } from 'react';
import Card, { CardHeader } from './Card';
import EmptyState from './EmptyState';

const defaultWarningIcon = 'M12 9v2m0 4h.01m-7.938 4h15.876c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.33 17c-.77 1.333.192 3 1.732 3z';

export function FinanceLoadingState({ message, className = 'py-10 text-sm text-slate-500' }) {
  return (
    <div className={className} role="status" aria-live="polite">
      {message}
    </div>
  );
}

export function FinanceInfoCard({ title, subtitle, className = 'border-slate-200/80 bg-[var(--color-surface-subtle)] shadow-[var(--shadow-sm)]' }) {
  const titleId = useId();
  const subtitleId = useId();

  return (
    <Card
      as="section"
      aria-labelledby={titleId}
      aria-describedby={subtitle ? subtitleId : undefined}
      className={className}
    >
      <CardHeader title={title} subtitle={subtitle} titleId={titleId} subtitleId={subtitle ? subtitleId : undefined} />
    </Card>
  );
}

export function FinanceUnavailableState({
  title,
  description,
  className = '',
  icon = defaultWarningIcon,
  tone = 'amber',
}) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      tone={tone}
      className={className}
    />
  );
}
