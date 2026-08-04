import { buildInsightViewUrl } from './aiInsights';

export function getDashboardAiAlertSummary({
  totalInsights = 0,
  unreadCount = 0,
  criticalCount = 0,
  activeGroupCount = 0,
  dailyActionCount = 0,
} = {}) {
  return {
    metrics: [
      { label: 'Visible Insights', value: totalInsights, tone: 'violet' },
      { label: 'Unread', value: unreadCount, tone: 'amber' },
      { label: 'Critical', value: criticalCount, tone: 'rose' },
      { label: 'Action Groups', value: activeGroupCount, tone: 'sky' },
    ],
    lenses: [
      {
        title: 'Review queue',
        tone: 'violet',
        value: `${unreadCount} unread`,
        description: 'Best for owners who want to clear fresh AI signals first.',
      },
      {
        title: 'Risk watch',
        tone: 'rose',
        value: `${criticalCount} critical`,
        description: 'Jumps straight to the highest-urgency signals across the business.',
      },
      {
        title: 'Suggested moves',
        tone: 'sky',
        value: `${dailyActionCount} owner action${dailyActionCount === 1 ? '' : 's'}`,
        description: 'Focuses on practical next steps that already have recommended follow-up.',
      },
      {
        title: 'Coverage',
        tone: 'slate',
        value: `${activeGroupCount} active group${activeGroupCount === 1 ? '' : 's'}`,
        description: `Signals are currently spread across ${totalInsights} visible insight${totalInsights === 1 ? '' : 's'}.`,
      },
    ],
    quickLinks: [
      {
        label: 'Needs review',
        tone: 'violet',
        to: buildInsightViewUrl({ activePreset: 'needs_review' }),
      },
      {
        label: 'High risk',
        tone: 'rose',
        to: buildInsightViewUrl({ activePreset: 'high_risk' }),
      },
      {
        label: 'Recommended actions',
        tone: 'sky',
        to: buildInsightViewUrl({ activePreset: 'recommended_actions' }),
      },
    ],
  };
}
