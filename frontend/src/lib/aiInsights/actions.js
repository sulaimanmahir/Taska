export function getInsightAction(insight, fallbackTo = '/ai-insights') {
  const type = insight?.type || '';

  if (type.startsWith('cooperative_financing_')) {
    return { to: '/cooperative?section=financing', label: 'Open financing' };
  }

  if (type.startsWith('cooperative_profit_')) {
    return { to: '/cooperative?section=profits', label: 'Review profit cycle' };
  }

  if (type.startsWith('adashe_')) {
    return { to: '/adashe', label: 'Open adashe' };
  }

  if (type.includes('stock') || type.includes('inventory') || type.includes('pharmacy')) {
    return { to: '/inventory', label: 'Check stock' };
  }

  if (type.includes('credit') || type.includes('debtor') || type.includes('trust')) {
    return { to: '/customers', label: 'Review customers' };
  }

  if (type.includes('delivery')) {
    return { to: '/deliveries', label: 'Open deliveries' };
  }

  if (type.includes('production')) {
    return { to: '/production', label: 'Open production' };
  }

  if (type.includes('hotel')) {
    return { to: '/bookings', label: 'Open bookings' };
  }

  if (type.includes('fuel')) {
    return { to: '/fuel', label: 'Open fuel ops' };
  }

  if (type.includes('school')) {
    return { to: '/fees', label: 'Open fees' };
  }

  if (type.includes('restaurant')) {
    return { to: '/restaurant', label: 'Open restaurant' };
  }

  if (type.includes('wholesale')) {
    return { to: '/wholesale', label: 'Open wholesale' };
  }

  if (type.includes('agro')) {
    return { to: '/agro', label: 'Open agro ops' };
  }

  if (type.includes('livestock')) {
    return { to: '/livestock', label: 'Open livestock' };
  }

  if (type.includes('construction')) {
    return { to: '/quotations', label: 'Open quotations' };
  }

  return { to: fallbackTo, label: 'Open insight' };
}
