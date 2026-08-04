import { formatCurrencyNGN } from './financeFormatters.js';

export const reportPeriodOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
];

export function buildReportOverviewMetrics(
  { totalSales = 0, totalOrders = 0, totalExpenses = 0, netProfit = 0 } = {},
  formatCurrency = formatCurrencyNGN,
) {
  return [
    {
      label: 'Total Sales',
      value: formatCurrency(totalSales),
      helper: 'Revenue captured in the selected window',
      tone: 'emerald',
    },
    {
      label: 'Orders',
      value: totalOrders.toLocaleString(),
      helper: 'Transactions recorded in the same period',
      tone: 'sky',
    },
    {
      label: 'Total Expenses',
      value: formatCurrency(totalExpenses),
      helper: 'Operating spend recorded in the selected window',
      tone: 'rose',
    },
    {
      label: 'Net Profit',
      value: formatCurrency(netProfit),
      helper: netProfit >= 0
        ? 'The business is staying ahead after costs'
        : 'Costs are currently outpacing margin',
      tone: netProfit >= 0 ? 'violet' : 'amber',
    },
  ];
}

export function buildTopProductReportItem(item = {}, index = 0, formatCurrency = formatCurrencyNGN) {
  return {
    key: `${item.product_name}-${index}`,
    rankLabel: index + 1,
    title: item.product_name,
    helper: 'Revenue contribution',
    valueLabel: formatCurrency(item.total),
  };
}

export function buildLowStockReportItem(item = {}, index = 0) {
  return {
    key: `${item.name}-${index}`,
    title: item.name,
    helper: 'Reorder watchlist',
    badgeLabel: `${item.quantity} left`,
  };
}

export function buildTopCustomerReportItem(item = {}, index = 0, formatCurrency = formatCurrencyNGN) {
  return {
    key: `${item.name}-${index}`,
    title: item.name,
    helper: 'Customer lifetime value snapshot',
    initialsLabel: item.name?.charAt(0) || '?',
    valueLabel: formatCurrency(item.total),
  };
}

export function buildExpenseCategoryReportItem(item = {}, index = 0, formatCurrency = formatCurrencyNGN) {
  return {
    key: `${item.category}-${index}`,
    title: item.category,
    helper: 'Expense concentration',
    valueLabel: formatCurrency(item.total),
  };
}
