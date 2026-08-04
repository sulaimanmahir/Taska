import { useId } from 'react';
import Card, { CardHeader } from './Card';
import DashboardFocusStack from './DashboardFocusStack';

export default function DashboardFinancePromptCard({
  title,
  state,
  renderAction,
  className = '',
}) {
  const titleId = useId();

  if (!state) {
    return null;
  }

  return (
      <Card as="section" aria-labelledby={titleId} className={className}>
      <CardHeader title={title} titleId={titleId} />
      <DashboardFocusStack
        ariaLabel={`${title} focus items`}
        items={[
          {
            title: 'What matters today',
            body: state.whatMatters,
            summaryLabel: state.summaryLabel,
            summaryTone: state.summaryTone,
            secondaryBadges: state.overviewSecondaryBadges,
            action: renderAction(state.overviewAction),
          },
          {
            title: 'Next move',
            body: state.nextMove,
            summaryLabel: 'Recommended action',
            summaryTone: 'violet',
            secondaryBadges: state.nextMoveSecondaryBadges,
            action: renderAction(state.nextMoveAction),
          },
        ]}
      />
    </Card>
  );
}
