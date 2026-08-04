import { formatCurrencyNGN, formatShortDate } from './financeFormatters.js';

const BILLING_STATUS_CLASSES = {
  paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-slate-100 text-slate-700',
  active: 'bg-emerald-100 text-emerald-700',
  trial: 'bg-sky-100 text-sky-700',
};

export function getBillingStatusClass(status) {
  return BILLING_STATUS_CLASSES[status] || 'bg-slate-100 text-slate-700';
}

export function buildBillingOverviewMetrics(
  subscription = null,
  invoices = [],
  formatCurrency = formatCurrencyNGN,
) {
  const activePlanName = subscription?.plan?.name || 'No active plan';
  const daysRemaining = subscription?.days_remaining || 0;
  const paidInvoices = invoices.filter((invoice) => invoice.status === 'paid').length;
  const totalInvoiced = invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);

  return {
    activePlanName,
    daysRemaining,
    paidInvoices,
    totalInvoiced,
    cards: [
      {
        label: 'Active Plan',
        value: activePlanName,
        helper: 'Current subscription attached to this business',
        tone: 'violet',
      },
      {
        label: 'Days Remaining',
        value: daysRemaining.toLocaleString(),
        helper: 'Time left before the current cycle closes',
        tone: 'sky',
      },
      {
        label: 'Paid Invoices',
        value: paidInvoices.toLocaleString(),
        helper: 'Billing records already settled successfully',
        tone: 'emerald',
      },
      {
        label: 'Total Invoiced',
        value: formatCurrency(totalInvoiced),
        helper: 'Combined billed amount across recent invoices',
        tone: 'amber',
      },
    ],
  };
}

export function getBillingMethodPrimaryLabel(method = {}) {
  if (method.type === 'card') {
    return `${method.brand} •••• ${method.last_four}`;
  }

  return `${method.bank_name} •••• ${method.account_number?.slice(-4)}`;
}

export function getBillingMethodSecondaryLabel(method = {}) {
  const descriptor = method.expiry_month
    ? `Expires ${method.expiry_month}/${method.expiry_year}`
    : 'Bank transfer method';

  return {
    text: descriptor,
    isDefault: Boolean(method.is_default),
  };
}

export function getBillingMethodConfirmLabel(method = {}) {
  if (method.type === 'card') {
    return `${method.brand} ending in ${method.last_four}`;
  }

  return `${method.bank_name} ending in ${method.account_number?.slice(-4)}`;
}

export function buildBillingMethodPresentation(
  method = {},
  { settingDefaultId = null, removingId = null } = {},
) {
  return {
    primaryLabel: getBillingMethodPrimaryLabel(method),
    secondary: getBillingMethodSecondaryLabel(method),
    confirmLabel: getBillingMethodConfirmLabel(method),
    badgeLabel: method.type === 'card'
      ? method.brand?.substring(0, 2).toUpperCase()
      : 'BNK',
    badgeClassName: method.type === 'card'
      ? 'bg-slate-900 text-white'
      : 'bg-blue-600 text-white',
    isSettingDefault: settingDefaultId === method.id,
    isRemoving: removingId === method.id,
  };
}

export function getBillingDefaultMethodLabel(methods = []) {
  const defaultMethod = methods.find((method) => method.is_default);
  if (!defaultMethod) {
    return 'None marked';
  }

  return getBillingMethodPrimaryLabel(defaultMethod);
}

export function getBillingPendingConfirmBusy(
  pendingConfirm,
  cancelling = false,
  removingId = null,
) {
  if (pendingConfirm?.type === 'cancel') {
    return cancelling;
  }

  if (pendingConfirm?.type === 'remove-method') {
    return removingId === pendingConfirm.methodId;
  }

  return false;
}

export function buildBillingUsageItems(usage = []) {
  return usage.map((item) => {
    const limit = Number(item.limit || 0);
    const current = Number(item.current || 0);
    const ratio = limit > 0 ? Math.min(100, (current / limit) * 100) : 0;

    return {
      ...item,
      currentValue: current.toLocaleString(),
      ratio,
      label: item.feature_key?.replace(/_/g, ' '),
    };
  });
}

export function buildBillingInvoiceRows(
  invoices = [],
  formatCurrency = formatCurrencyNGN,
  formatDate = formatShortDate,
) {
  return invoices.slice(0, 10).map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    totalLabel: formatCurrency(invoice.total),
    status: invoice.status,
    statusClassName: getBillingStatusClass(invoice.status),
    dateLabel: formatDate(invoice.paid_at || invoice.due_date, 'No date'),
    viewHref: `/billing/invoices/${invoice.id}`,
  }));
}

export function buildBillingCancelDetailContext(
  subscription = null,
  planName = 'No active plan',
  formatDate = formatShortDate,
) {
  const daysRemaining = subscription?.days_remaining || 0;

  return {
    planName,
    billingCycle: subscription?.billing_cycle ? `${subscription.billing_cycle}` : 'Not set',
    renewsOn: formatDate(subscription?.ends_at, 'No renewal date set'),
    daysRemainingLabel: `${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`,
  };
}

export function buildBillingMethodRemovalDetailContext(
  pendingConfirm,
  methods = [],
  defaultMethodLabel = 'None marked',
) {
  return {
    methodLabel: pendingConfirm?.methodLabel || 'Saved payment method',
    savedMethodsCount: methods.length.toLocaleString(),
    defaultMethodLabel,
  };
}
