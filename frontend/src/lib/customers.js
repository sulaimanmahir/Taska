import { formatCurrencyNGN } from './financeFormatters.js';

export function createCustomerForm() {
  return {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    customer_group_id: '',
    customer_type: 'individual',
    credit_limit: '',
    is_active: true,
  };
}

export function buildCustomerPayload(form = {}) {
  return {
    name: form.name.trim(),
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    address: form.address.trim() || null,
    city: form.city.trim() || null,
    state: form.state.trim() || null,
    customer_group_id: form.customer_group_id ? Number(form.customer_group_id) : null,
    customer_type: form.customer_type,
    credit_limit: form.credit_limit === '' ? null : Number(form.credit_limit),
    is_active: Boolean(form.is_active),
  };
}

export function buildCustomerOverviewMetrics(customers = [], formatCurrency = formatCurrencyNGN) {
  const activeCustomers = customers.filter((customer) => customer.is_active !== false);
  const debtors = customers.filter((customer) => Number(customer.balance || 0) > 0);
  const creditEnabled = customers.filter((customer) => Number(customer.credit_limit || 0) > 0);
  const totalExposure = debtors.reduce((sum, customer) => sum + Number(customer.balance || 0), 0);
  const latestCustomer = [...customers]
    .sort((left, right) => String(right.created_at || '').localeCompare(String(left.created_at || '')))[0];

  return [
    {
      label: 'Active Customers',
      value: activeCustomers.length,
      helper: 'Customers currently available for orders, invoicing, and follow-up.',
      tone: 'emerald',
    },
    {
      label: 'Debtors',
      value: debtors.length,
      helper: 'Customers carrying an outstanding balance right now.',
      tone: 'amber',
    },
    {
      label: 'Credit Enabled',
      value: creditEnabled.length,
      helper: 'Customer accounts configured with a usable credit limit.',
      tone: 'sky',
    },
    {
      label: 'Outstanding Exposure',
      value: formatCurrency(totalExposure),
      helper: 'Total customer balance still waiting to be collected.',
      tone: totalExposure > 0 ? 'rose' : 'violet',
    },
    {
      label: 'Latest Customer',
      value: latestCustomer?.name || 'No customers yet',
      helper: latestCustomer?.group?.name
        ? `Assigned to ${latestCustomer.group.name}.`
        : 'No customer group assigned yet.',
      tone: latestCustomer ? 'violet' : 'slate',
    },
  ];
}

export function buildCustomerRow(customer = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: customer.id,
    title: customer.name || 'Customer',
    typeLabel: customer.customer_type || 'individual',
    phoneLabel: customer.phone || '-',
    balanceLabel: formatCurrency(customer.balance || 0),
    creditLimitLabel: formatCurrency(customer.credit_limit || 0),
    statusLabel: customer.is_active !== false ? 'Active' : 'Inactive',
    locationLabel: [customer.city, customer.state].filter(Boolean).join(', ') || 'No city/state',
    groupLabel: customer.group?.name || 'No group',
    emailLabel: customer.email || 'No email',
  };
}

export function filterCustomers(customers = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return customers;
  }

  return customers.filter((customer) => {
    const fields = [
      customer.name,
      customer.phone,
      customer.email,
      customer.customer_type,
      customer.city,
      customer.state,
      customer.group?.name,
    ];

    return fields.some((field) => String(field ?? '').toLowerCase().includes(query));
  });
}
