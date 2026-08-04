import { formatCurrencyNGN, formatShortDate } from './financeFormatters.js';

function formatDateInput(date) {
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
}

function getWeekStart(date) {
  const current = new Date(date);
  current.setHours(0, 0, 0, 0);
  const offset = (current.getDay() + 6) % 7;
  current.setDate(current.getDate() - offset);
  return current;
}

export function getExpenseDatePresets(now = new Date()) {
  const current = new Date(now);
  current.setHours(0, 0, 0, 0);

  return {
    today: formatDateInput(current),
    weekStart: formatDateInput(getWeekStart(current)),
    monthStart: formatDateInput(new Date(current.getFullYear(), current.getMonth(), 1)),
  };
}

export function createExpenseForm(now = new Date()) {
  return {
    description: '',
    amount: '',
    expense_category_id: '',
    payment_method: 'cash',
    reference: '',
    expense_date: getExpenseDatePresets(now).today,
  };
}

export function createExpenseCategoryForm() {
  return {
    name: '',
    description: '',
  };
}

export function buildExpensePayload(form) {
  return {
    description: form.description.trim(),
    amount: Number(form.amount || 0),
    expense_category_id: Number(form.expense_category_id),
    payment_method: form.payment_method,
    reference: form.reference.trim() || null,
    expense_date: form.expense_date,
  };
}

export function buildExpenseCategoryPayload(form) {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
  };
}

export function buildExpenseOverviewMetrics(
  {
    todaySummary = {},
    weekTotal = 0,
    monthTotal = 0,
    categories = [],
  } = {},
  formatCurrency = formatCurrencyNGN,
) {
  const largestCategory = [...(todaySummary.by_category ?? [])]
    .sort((left, right) => Number(right.total || 0) - Number(left.total || 0))[0];

  return [
    {
      label: 'Today Spend',
      value: formatCurrency(todaySummary.total_today || 0),
      helper: "Expense captured against today's operating cash burn.",
      tone: 'amber',
    },
    {
      label: 'This Week',
      value: formatCurrency(weekTotal || 0),
      helper: 'Confirmed spend recorded since the start of the week.',
      tone: 'sky',
    },
    {
      label: 'This Month',
      value: formatCurrency(monthTotal || 0),
      helper: 'Operating spend accumulated in the current month.',
      tone: 'violet',
    },
    {
      label: 'Active Categories',
      value: String((categories ?? []).filter((category) => category.is_active !== false).length),
      helper: 'Categories currently available for controlled expense capture.',
      tone: 'emerald',
    },
    {
      label: 'Top Spend Today',
      value: largestCategory?.name || 'No spend yet',
      helper: largestCategory
        ? `${formatCurrency(largestCategory.total || 0)} is leading today's spend concentration.`
        : 'No category has recorded expense activity today yet.',
      tone: largestCategory ? 'rose' : 'slate',
    },
  ];
}

export function buildExpenseCategoryCard(
  category = {},
  todayTotalsByCategory = {},
  formatCurrency = formatCurrencyNGN,
) {
  return {
    id: category.id,
    title: category.name || 'Uncategorized',
    descriptionLabel: category.description || 'No category note captured yet.',
    todayAmountLabel: formatCurrency(todayTotalsByCategory[category.name] || 0),
    statusLabel: category.is_active === false ? 'Inactive' : 'Active',
    usageLabel: `${Number(category.expenses_count || 0)} logged`,
  };
}

export function buildExpenseLedgerRow(
  expense = {},
  formatCurrency = formatCurrencyNGN,
  formatDate = formatShortDate,
) {
  return {
    id: expense.id,
    title: expense.description || 'Expense entry',
    categoryLabel: expense.category?.name || 'No category',
    dateLabel: formatDate(expense.expense_date, 'No date'),
    amountLabel: formatCurrency(expense.amount || 0),
    paymentMethodLabel: expense.payment_method || 'cash',
    referenceLabel: expense.reference || 'No reference',
    approvalLabel: expense.is_approved ? 'Approved' : 'Awaiting review',
  };
}

export function filterExpenseLedger(expenses = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return expenses;
  }

  return expenses.filter((expense) => {
    const fields = [
      expense.description,
      expense.title,
      expense.category?.name,
      expense.categoryLabel,
      expense.payment_method,
      expense.paymentMethodLabel,
      expense.reference,
      expense.referenceLabel,
      expense.expense_date,
      expense.dateLabel,
      expense.amount,
      expense.amountLabel,
    ];

    return fields.some((field) => String(field ?? '').toLowerCase().includes(query));
  });
}
