export function buildInsightViewSearchParams({
  activePreset = 'custom',
  activeVisibilityFilter = 'all',
  activeSort = 'priority',
  groupKey = '',
  insightId = '',
}) {
  const params = new URLSearchParams();

  if (activePreset && activePreset !== 'all_signals' && activePreset !== 'custom') {
    params.set('preset', activePreset);
  } else {
    if (activeVisibilityFilter && activeVisibilityFilter !== 'all') {
      params.set('filter', activeVisibilityFilter);
    }

    if (activeSort && activeSort !== 'priority') {
      params.set('sort', activeSort);
    }
  }

  if (groupKey) {
    params.set('group', groupKey);
  }

  if (insightId) {
    params.set('insight', insightId);
  }

  return params;
}

export function buildInsightViewUrl({
  pathname = '/ai-insights',
  activePreset = 'custom',
  activeVisibilityFilter = 'all',
  activeSort = 'priority',
  groupKey = '',
  insightId = '',
}) {
  const params = buildInsightViewSearchParams({
    activePreset,
    activeVisibilityFilter,
    activeSort,
    groupKey,
    insightId,
  });
  const query = params.toString();

  return query ? `${pathname}?${query}` : pathname;
}
