export function getFinanceQueryValue(searchParams, key, allowedValues = [], fallback = null) {
  const requestedValue = searchParams.get(key);

  if (!requestedValue) {
    return fallback;
  }

  return allowedValues.includes(requestedValue) ? requestedValue : fallback;
}

export function buildFinancePageUrl(path, { view, sort } = {}) {
  const params = new URLSearchParams();

  if (view && view !== 'all') {
    params.set('view', view);
  }

  if (sort && sort !== 'priority') {
    params.set('sort', sort);
  }

  const query = params.toString();

  return query ? `${path}?${query}` : path;
}
