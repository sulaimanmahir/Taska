export function captureSortAndFilterState({
  activeVisibilityFilter,
  activeSort,
}) {
  return {
    filter: activeVisibilityFilter,
    sort: activeSort,
  };
}

export function captureResetFiltersState({
  searchTerm,
  activeVisibilityFilter,
  activeSort,
  requestedGroupKey,
  requestedInsightId,
  preset,
}) {
  return {
    searchTerm,
    activeVisibilityFilter,
    activeSort,
    groupKey: requestedGroupKey,
    insightId: requestedInsightId,
    preset,
  };
}

export function buildInsightSearchParams({
  preset,
  groupKey,
  insightId,
}) {
  const params = new URLSearchParams();

  if (preset) {
    params.set('preset', preset);
  }

  if (groupKey) {
    params.set('group', groupKey);
  }

  if (insightId) {
    params.set('insight', insightId);
  }

  return params;
}
