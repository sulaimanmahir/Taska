export function createAiInsightsSuccessToast(message) {
  return {
    tone: 'success',
    message,
  };
}

export function createAiInsightsUndoToast({
  message,
  actionLabel,
  onAction,
}) {
  return {
    ...createAiInsightsSuccessToast(message),
    actionLabel,
    onAction,
  };
}

export function createAiInsightsSavedViewsToast({
  message,
  didRevealSavedViews = false,
  onCollapse,
}) {
  return {
    ...createAiInsightsSuccessToast(message),
    actionLabel: didRevealSavedViews ? 'Collapse again' : undefined,
    onAction: didRevealSavedViews ? onCollapse : undefined,
  };
}
