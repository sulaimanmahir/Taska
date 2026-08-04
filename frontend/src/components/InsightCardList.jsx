import InsightCard from './InsightCard';
import { ResponsiveCardGrid } from './PageShell';

export default function InsightCardList({
  insights = [],
  compact = false,
  className,
  ariaLabel = 'Insight cards',
  getInsightAction,
  getInsightCardPresentationProps,
  getInsightFocusClasses,
  getInsightHighlights,
  getUpdatedLabel,
  markReadMutation,
  dismissMutation,
  restoreMutation,
  unreadClasses,
}) {
  const containerClassName = className || (compact ? 'space-y-2' : '');

  if (compact) {
    return (
      <ul className={containerClassName} aria-label={ariaLabel}>
        {insights.map((insight) => {
          const action = getInsightAction ? getInsightAction(insight) : undefined;
          const highlights = getInsightHighlights ? getInsightHighlights(insight) : undefined;
          const updatedLabel = getUpdatedLabel ? getUpdatedLabel(insight) : undefined;

          return (
            <li key={insight.id}>
              <InsightCard
                insight={insight}
                compact={compact}
                focusClasses={getInsightFocusClasses ? getInsightFocusClasses(insight) : ''}
                action={action}
                highlights={highlights}
                updatedLabel={updatedLabel}
                {...getInsightCardPresentationProps(insight, {
                  markReadMutation,
                  dismissMutation,
                  restoreMutation,
                  unreadClasses,
                })}
              />
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ResponsiveCardGrid as="ul" variant="cards" className={`xl:grid-cols-3 ${containerClassName}`.trim()} aria-label={ariaLabel}>
      {insights.map((insight) => {
        const action = getInsightAction ? getInsightAction(insight) : undefined;
        const highlights = getInsightHighlights ? getInsightHighlights(insight) : undefined;
        const updatedLabel = getUpdatedLabel ? getUpdatedLabel(insight) : undefined;

        return (
          <li key={insight.id}>
            <InsightCard
              insight={insight}
              compact={compact}
              focusClasses={getInsightFocusClasses ? getInsightFocusClasses(insight) : ''}
              action={action}
              highlights={highlights}
              updatedLabel={updatedLabel}
              {...getInsightCardPresentationProps(insight, {
                markReadMutation,
                dismissMutation,
                restoreMutation,
                unreadClasses,
              })}
            />
          </li>
        );
      })}
    </ResponsiveCardGrid>
  );
}
