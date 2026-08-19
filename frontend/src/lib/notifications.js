const SEVERITY_TONE = {
  critical: 'rose',
  warning: 'amber',
  info: 'sky',
};

export function severityTone(severity) {
  return SEVERITY_TONE[severity] || 'slate';
}

function formatRelativeTime(isoString) {
  if (!isoString) return '';

  const then = new Date(isoString).getTime();
  const now = Date.now();
  const diffMinutes = Math.round((now - then) / 60000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

export function buildNotificationPreviewItems(insights = [], limit = 6) {
  return insights.slice(0, limit).map((insight) => ({
    id: insight.id,
    title: insight.title,
    description: insight.description,
    tone: severityTone(insight.severity),
    timeLabel: formatRelativeTime(insight.created_at),
  }));
}
