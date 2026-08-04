import { formatCurrencyNGN } from './financeFormatters.js';

export const adminTabs = [
  { id: 'users', label: 'Users' },
  { id: 'businesses', label: 'Businesses' },
  { id: 'plans', label: 'Plans' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'support', label: 'Support' },
  { id: 'referrals', label: 'Referrals' },
];

export function getAdminLoadRequests(activeTab) {
  if (activeTab === 'users') {
    return {
      primary: '/admin/users',
      includeStats: true,
    };
  }

  const endpointByTab = {
    businesses: '/admin/businesses',
    plans: '/admin/plans',
    transactions: '/admin/transactions',
    support: '/admin/support-tickets',
    referrals: '/admin/referrals',
  };

  return {
    primary: endpointByTab[activeTab] || null,
    includeStats: false,
  };
}

export function getAdminActionTargetLabel(activeTab) {
  if (activeTab === 'users') return 'user';
  if (activeTab === 'businesses') return 'business';
  if (activeTab === 'support') return 'ticket';
  return 'record';
}

export function getAdminPendingActionLabel(action = '') {
  return action.replace(/-/g, ' ') || 'confirm';
}

export function getAdminPendingActionLabelDisplay(action = '') {
  const label = getAdminPendingActionLabel(action);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function getAdminPendingRecordName(item = {}) {
  return (
    item.name ||
    item.business_name ||
    item.subject ||
    item.email ||
    `#${item.id}`
  );
}

export function filterAdminRecords(data = [], search = '') {
  if (!search) {
    return data;
  }

  const searchLower = search.toLowerCase();
  return data.filter((item) => (
    item.name?.toLowerCase().includes(searchLower) ||
    item.email?.toLowerCase().includes(searchLower) ||
    item.business_name?.toLowerCase().includes(searchLower) ||
    item.owner_name?.toLowerCase().includes(searchLower) ||
    item.subject?.toLowerCase().includes(searchLower) ||
    item.user_name?.toLowerCase().includes(searchLower) ||
    item.referrer_name?.toLowerCase().includes(searchLower) ||
    item.referred_name?.toLowerCase().includes(searchLower)
  ));
}

export function buildAdminStatsCards(stats = {}, formatCurrency = formatCurrencyNGN) {
  return [
    {
      label: 'Total Users',
      value: (stats.totalUsers || 0).toLocaleString(),
      helper: 'Registered accounts across the system',
      tone: 'sky',
    },
    {
      label: 'Active Businesses',
      value: (stats.activeBusinesses || 0).toLocaleString(),
      helper: 'Tenants currently marked active',
      tone: 'emerald',
    },
    {
      label: 'Monthly Revenue',
      value: formatCurrency(stats.monthlyRevenue || 0),
      helper: 'Successful transaction volume this month',
      tone: 'violet',
    },
    {
      label: 'Open Tickets',
      value: (stats.pendingSupport || 0).toLocaleString(),
      helper: 'Support requests still unresolved',
      tone: 'amber',
    },
  ];
}

export function getAdminCurrentTabLabel(activeTab, tabs = adminTabs) {
  return tabs.find((tab) => tab.id === activeTab)?.label || 'Records';
}
