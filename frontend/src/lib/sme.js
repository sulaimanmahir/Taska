import { formatCurrencyNGN } from './financeFormatters.js';

export function getSmeCurrentDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function createSmeCashForm(date = new Date()) {
  return {
    entry_type: 'cash_in',
    source: '',
    amount: '',
    payment_method: 'cash',
    entry_date: getSmeCurrentDate(date),
    notes: '',
  };
}

export function createSmeFollowUpForm(date = new Date()) {
  return {
    title: '',
    due_on: getSmeCurrentDate(date),
    amount_in_focus: '',
    notes: '',
  };
}

export function createSmeTargetForm(date = new Date()) {
  return {
    target_date: getSmeCurrentDate(date),
    sales_target: '',
    collection_target: '',
    expense_limit: '',
    notes: '',
  };
}

export function buildSmeOverviewMetrics(summary = {}, formatCurrency = formatCurrencyNGN) {
  return [
    {
      label: 'Sales Today',
      value: formatCurrency(summary.sales_today),
      helper: `Cash in: ${formatCurrency(summary.cash_in_today)}`,
      tone: 'emerald',
    },
    {
      label: 'Cash Out Today',
      value: formatCurrency(summary.cash_out_today),
      helper: `Expenses: ${formatCurrency(summary.expenses_today)}`,
      tone: 'rose',
    },
    {
      label: 'Debtor Exposure',
      value: formatCurrency(summary.debtor_exposure),
      helper: `${summary.followups_due || 0} follow-ups due today.`,
      tone: 'sky',
    },
    {
      label: 'Target Attainment',
      value: `${Number(summary.target_attainment || 0).toFixed(1)}%`,
      helper: `Sales target: ${formatCurrency(summary.sales_target)}`,
      tone: 'violet',
    },
  ];
}

export function buildSmeOwnerPulse(summary = {}, formatCurrency = formatCurrencyNGN) {
  return [
    {
      label: 'Net Cash Today',
      value: formatCurrency(summary.net_cash_today),
    },
    {
      label: 'Collections Target',
      value: formatCurrency(summary.collection_target),
    },
    {
      label: 'Expense Limit',
      value: formatCurrency(summary.expense_limit),
    },
  ];
}

export function getSmeDueFollowUps(followUps = []) {
  return followUps.filter((item) => item.status === 'open').slice(0, 5);
}

export function buildSmeFollowUpCard(item = {}) {
  return {
    id: item.id,
    title: item.title || 'Follow-up',
    customerLabel: item.customer?.name || 'No customer linked',
    dueLabel: `Due ${item.due_on || 'Date pending'}`,
  };
}

export function buildSmeCashPayload(cashForm = {}) {
  return {
    ...cashForm,
    amount: Number(cashForm.amount || 0),
  };
}

export function buildSmeTargetPayload(targetForm = {}) {
  return {
    ...targetForm,
    sales_target: Number(targetForm.sales_target || 0),
    collection_target: Number(targetForm.collection_target || 0),
    expense_limit: Number(targetForm.expense_limit || 0),
  };
}

export function buildSmeFollowUpPayload(followUpForm = {}) {
  return {
    ...followUpForm,
    amount_in_focus: Number(followUpForm.amount_in_focus || 0),
  };
}

export function buildSmeCashEntryCard(entry = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: entry.id,
    source: entry.source || 'Cash entry',
    meta: `${(entry.entry_type || 'cash_in').replace('_', ' ')} via ${entry.payment_method || 'cash'}`,
    amountLabel: formatCurrency(entry.amount),
    amountTone: entry.entry_type === 'cash_in' ? 'text-emerald-700' : 'text-rose-700',
    dateLabel: entry.entry_date || 'Date pending',
  };
}

export function buildSmeTargetCard(target = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: target.id,
    dateLabel: target.target_date || 'Target date pending',
    salesLabel: `Sales ${formatCurrency(target.sales_target)}`,
    collectionsLabel: `Collections ${formatCurrency(target.collection_target)}`,
  };
}
