import { formatCurrencyNGN } from './financeFormatters.js';

export function getDebtorAccounts(customers = []) {
  return customers
    .filter((customer) => Number(customer?.balance || 0) > 0)
    .sort((left, right) => Number(right?.balance || 0) - Number(left?.balance || 0));
}

export function filterDebtorAccounts(accounts = [], search = '') {
  const term = String(search || '').trim().toLowerCase();

  if (!term) {
    return accounts;
  }

  return accounts.filter((account) => {
    const haystack = [
      account?.name,
      account?.phone,
      account?.email,
      account?.customer_type,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(term);
  });
}

export function buildDebtorOverviewMetrics(accounts = [], formatCurrency = formatCurrencyNGN) {
  const exposure = accounts.reduce((sum, account) => sum + Number(account?.balance || 0), 0);
  const totalCreditLimit = accounts.reduce((sum, account) => sum + Number(account?.credit_limit || 0), 0);
  const averageBalance = accounts.length > 0 ? exposure / accounts.length : 0;
  const priorityCount = accounts.filter((account) => Number(account?.balance || 0) >= 50000).length;

  return [
    {
      label: 'Debtor Accounts',
      value: accounts.length,
      helper: 'Customers currently carrying an unpaid balance that needs follow-up.',
      tone: 'amber',
    },
    {
      label: 'Outstanding Exposure',
      value: formatCurrency(exposure),
      helper: 'Total receivables still sitting outside the cash drawer.',
      tone: 'rose',
    },
    {
      label: 'Average Balance',
      value: formatCurrency(averageBalance),
      helper: 'Useful for spotting whether risk is concentrated or widely spread.',
      tone: 'violet',
    },
    {
      label: 'Priority Follow-up',
      value: priorityCount,
      helper: 'Accounts already large enough to deserve same-day collection pressure.',
      tone: 'sky',
    },
    {
      label: 'Credit Limit Cover',
      value: formatCurrency(totalCreditLimit),
      helper: 'Visible approved credit still on the books for these customers.',
      tone: 'emerald',
    },
  ];
}

export function buildDebtorCard(account, formatCurrency = formatCurrencyNGN) {
  const balance = Number(account?.balance || 0);
  const creditLimit = Number(account?.credit_limit || 0);
  const limitLeft = Math.max(creditLimit - balance, 0);
  const collectionPriority = balance >= 100000 ? 'Immediate follow-up' : balance >= 50000 ? 'Today' : 'Monitor';

  return {
    id: account?.id,
    title: account?.name || 'Customer',
    customerTypeLabel: account?.customer_type ? account.customer_type.replaceAll('_', ' ') : 'customer',
    balanceLabel: formatCurrency(balance),
    creditLimitLabel: formatCurrency(creditLimit),
    headroomLabel: formatCurrency(limitLeft),
    phoneLabel: account?.phone || 'No phone recorded',
    emailLabel: account?.email || 'No email recorded',
    collectionPriority,
  };
}
