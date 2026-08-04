export function getInsightTypeIcon(type = '') {
  const icons = {
    inventory:
      'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    sales: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    credit: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 0L9 6m3-2l2.999 2',
    staff: 'M12 4.354v2.708m-4.643-2.982l1.194-1.196m5.193 3.178l-1.196 1.194',
    industry: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h6m-6 4h6',
    forecast: 'M3 17l6-6 4 4 8-8M14 7h7v7',
    anomaly:
      'M12 9v2m0 4h.01m-7.938 4h15.876c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L2.33 16c-.77 1.333.192 3 1.732 3z',
    recommendation:
      'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a4.98 4.98 0 013.217-2.827 4.996 4.996 0 00.526-1.783 4.996 4.996 0 00-1.783-.526 4.98 4.98 0 01-2.827-3.217V5',
  };

  if (type.includes('forecast')) return icons.forecast;
  if (type.includes('risk') || type.includes('pressure') || type.includes('decline')) return icons.anomaly;

  return icons[type] || icons.recommendation;
}

export function getInsightTypeColor(type = '') {
  const colors = {
    inventory: 'from-orange-500 to-red-500',
    sales: 'from-blue-500 to-cyan-500',
    credit: 'from-purple-500 to-pink-500',
    staff: 'from-green-500 to-emerald-500',
    industry: 'from-amber-500 to-yellow-500',
    forecast: 'from-sky-500 to-indigo-500',
    anomaly: 'from-orange-500 to-rose-500',
    recommendation: 'from-pink-500 to-purple-600',
  };

  if (type.includes('forecast')) return colors.forecast;
  if (type.includes('risk') || type.includes('pressure') || type.includes('decline')) return colors.anomaly;

  return colors[type] || colors.recommendation;
}

export function formatInsightMetricValue(value) {
  if (typeof value === 'number') {
    if (value >= 1000) {
      return new Intl.NumberFormat('en-NG', { maximumFractionDigits: 1 }).format(value);
    }

    return Number.isInteger(value) ? `${value}` : value.toFixed(1);
  }

  return value;
}

export function formatInsightType(type = '') {
  return type.split('_').join(' ');
}
