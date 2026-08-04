export function shouldCollapseSavedViews(savedViews = [], limit = 4) {
  return savedViews.length > limit;
}

export function getVisibleSavedViews({
  savedViews = [],
  showAll = false,
  currentViewHref = '',
  limit = 4,
}) {
  if (!shouldCollapseSavedViews(savedViews, limit) || showAll) {
    return savedViews;
  }

  const compactViews = savedViews.slice(0, limit);

  if (!currentViewHref || compactViews.some((view) => view.href === currentViewHref)) {
    return compactViews;
  }

  const currentSavedView = savedViews.find((view) => view.href === currentViewHref);

  if (!currentSavedView) {
    return compactViews;
  }

  return [...compactViews.slice(0, Math.max(0, limit - 1)), currentSavedView];
}

export function getHiddenSavedViewCount({
  savedViews = [],
  visibleSavedViews = [],
}) {
  return Math.max(savedViews.length - visibleSavedViews.length, 0);
}
