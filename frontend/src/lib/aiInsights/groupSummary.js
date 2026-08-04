export function buildInsightGroupReadSummary(count) {
  return {
    tone: 'violet',
    message: `${count} insight${count === 1 ? '' : 's'} marked as handled for now.`,
  };
}

export function buildInsightGroupDismissSummary(count) {
  return {
    tone: 'rose',
    message: `${count} low-priority insight${count === 1 ? '' : 's'} removed from this group.`,
  };
}
