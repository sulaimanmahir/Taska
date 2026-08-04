import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildExpenseCategoryReportItem,
  buildLowStockReportItem,
  buildReportOverviewMetrics,
  buildTopCustomerReportItem,
  buildTopProductReportItem,
  reportPeriodOptions,
} from '../src/lib/reports.js';
import { formatCurrencyNGN } from '../src/lib/financeFormatters.js';

test('report period options stay aligned with the reporting filter control', () => {
  assert.deepEqual(reportPeriodOptions, [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
  ]);
});

test('report overview metrics preserve labels, values, and profit tone logic', () => {
  assert.deepEqual(buildReportOverviewMetrics({
    totalSales: 400000,
    totalOrders: 28,
    totalExpenses: 150000,
    netProfit: 250000,
  }, formatCurrencyNGN), [
    {
      label: 'Total Sales',
      value: formatCurrencyNGN(400000),
      helper: 'Revenue captured in the selected window',
      tone: 'emerald',
    },
    {
      label: 'Orders',
      value: '28',
      helper: 'Transactions recorded in the same period',
      tone: 'sky',
    },
    {
      label: 'Total Expenses',
      value: formatCurrencyNGN(150000),
      helper: 'Operating spend recorded in the selected window',
      tone: 'rose',
    },
    {
      label: 'Net Profit',
      value: formatCurrencyNGN(250000),
      helper: 'The business is staying ahead after costs',
      tone: 'violet',
    },
  ]);

  assert.equal(buildReportOverviewMetrics({ netProfit: -5000 }, formatCurrencyNGN)[3].tone, 'amber');
});

test('report row presenters keep list-card content readable', () => {
  assert.deepEqual(buildTopProductReportItem({
    product_name: 'Paracetamol',
    total: 90000,
  }, 1, formatCurrencyNGN), {
    key: 'Paracetamol-1',
    rankLabel: 2,
    title: 'Paracetamol',
    helper: 'Revenue contribution',
    valueLabel: formatCurrencyNGN(90000),
  });

  assert.deepEqual(buildLowStockReportItem({
    name: 'Rice',
    quantity: 4,
  }, 0), {
    key: 'Rice-0',
    title: 'Rice',
    helper: 'Reorder watchlist',
    badgeLabel: '4 left',
  });

  assert.deepEqual(buildTopCustomerReportItem({
    name: 'Amina Bello',
    total: 120000,
  }, 2, formatCurrencyNGN), {
    key: 'Amina Bello-2',
    title: 'Amina Bello',
    helper: 'Customer lifetime value snapshot',
    initialsLabel: 'A',
    valueLabel: formatCurrencyNGN(120000),
  });

  assert.deepEqual(buildExpenseCategoryReportItem({
    category: 'Fuel',
    total: 45000,
  }, 3, formatCurrencyNGN), {
    key: 'Fuel-3',
    title: 'Fuel',
    helper: 'Expense concentration',
    valueLabel: formatCurrencyNGN(45000),
  });
});
