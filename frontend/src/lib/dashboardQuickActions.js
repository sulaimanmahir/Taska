export function getDashboardQuickActions({ labels, color, type }) {
  return [
    {
      label: labels.newSale,
      icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
      color,
      path: ['beauty', 'service'].includes(type) ? '/appointments' : '/pos',
    },
    {
      label: labels.addProduct,
      icon: 'M12 4v16m8-8H4',
      color: '#10B981',
      path: '/products',
    },
    {
      label: labels.addCustomer,
      icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
      color: '#3B82F6',
      path: '/customers',
    },
    {
      label: labels.expenses || 'Expenses',
      icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
      color: '#F59E0B',
      path: '/expenses',
    },
  ];
}
