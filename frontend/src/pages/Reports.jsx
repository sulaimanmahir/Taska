import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Card, { CardHeader } from '../components/Card';
import OpsMetricCard from '../components/OpsMetricCard';
import { PageShell, ResponsiveCardGrid } from '../components/PageShell';
import PageHero from '../components/PageHero';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import {
  buildExpenseCategoryReportItem,
  buildLowStockReportItem,
  buildReportOverviewMetrics,
  buildTopCustomerReportItem,
  buildTopProductReportItem,
  reportPeriodOptions,
} from '../lib/reports';
import api from '../lib/api';

function QueryErrorPanel({ message, onRetry }) {
  if (!message) {
    return null;
  }

  return (
    <Card className="border-rose-200 bg-rose-50">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-rose-800">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
        >
          Retry
        </button>
      </div>
    </Card>
  );
}

function ReportListCard({ title, subtitle, items, emptyText, renderItem }) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <div className="space-y-3">
        {items?.length ? (
          items.map((item, index) => renderItem(item, index))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            {emptyText}
          </div>
        )}
      </div>
    </Card>
  );
}

export default function Reports() {
  const [period, setPeriod] = useState('today');

  const salesQuery = useQuery({
    queryKey: ['reports-sales', period],
    queryFn: () => api.get(`/reports/sales?period=${period}`).then((response) => response.data),
    enabled: !!period,
  });

  const inventoryQuery = useQuery({
    queryKey: ['reports-inventory'],
    queryFn: () => api.get('/reports/inventory').then((response) => response.data),
  });

  const expensesQuery = useQuery({
    queryKey: ['reports-expenses', period],
    queryFn: () => api.get(`/reports/expenses?period=${period}`).then((response) => response.data),
  });

  const customersQuery = useQuery({
    queryKey: ['reports-customers'],
    queryFn: () => api.get('/reports/customers').then((response) => response.data),
  });

  const profitLossQuery = useQuery({
    queryKey: ['reports-profitloss', period],
    queryFn: () => api.get(`/reports/profit-loss?period=${period}`).then((response) => response.data),
  });

  const sales = salesQuery.data;
  const inventory = inventoryQuery.data;
  const expenses = expensesQuery.data;
  const customers = customersQuery.data;
  const profitLoss = profitLossQuery.data;
  const reportQueries = [salesQuery, inventoryQuery, expensesQuery, customersQuery, profitLossQuery];
  const reportsError = reportQueries.find((query) => query.isError)?.error;

  const handleRetry = () => {
    reportQueries.forEach((query) => {
      void query.refetch();
    });
  };

  const totalSales = sales?.total || 0;
  const totalOrders = sales?.orders || 0;
  const totalExpenses = expenses?.total || 0;
  const netProfit = profitLoss?.netProfit || 0;
  const overviewMetrics = buildReportOverviewMetrics({
    totalSales,
    totalOrders,
    totalExpenses,
    netProfit,
  }, formatCurrencyNGN);

  return (
    <PageShell width="wide" className="page-stack">
      <PageHero
        eyebrow="Reporting Centre"
        title="Reports"
        description="Track sales, stock health, customer value, and expense pressure from one clean business-performance view."
        actions={(
          <div className="rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="rounded-lg border-0 bg-transparent px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-0"
            >
              {reportPeriodOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        )}
      />

      <ResponsiveCardGrid variant="metrics">
        {overviewMetrics.map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            tone={metric.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <QueryErrorPanel
        message={reportsError ? 'We could not load part of the reporting centre right now. Please try again.' : ''}
        onRetry={handleRetry}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportListCard
          title="Top Products"
          subtitle="Best-performing items by sales value"
          items={sales?.topProducts?.slice(0, 5)}
          emptyText="No sales data has landed in this period yet."
          renderItem={(item, index) => {
            const row = buildTopProductReportItem(item, index, formatCurrencyNGN);

            return (
            <div key={row.key} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-xs font-semibold text-[var(--color-brand)]">
                  {row.rankLabel}
                </span>
                <div>
                  <p className="font-medium text-slate-900">{row.title}</p>
                  <p className="text-xs text-slate-500">{row.helper}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-slate-900">{row.valueLabel}</span>
            </div>
          )}}
        />

        <ReportListCard
          title="Low Stock Alerts"
          subtitle="Items that need replenishment attention"
          items={inventory?.lowStock?.slice(0, 5)}
          emptyText="All stock levels look healthy right now."
          renderItem={(item, index) => {
            const row = buildLowStockReportItem(item, index);

            return (
            <div key={row.key} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              <div>
                <p className="font-medium text-slate-900">{row.title}</p>
                <p className="text-xs text-slate-500">{row.helper}</p>
              </div>
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                {row.badgeLabel}
              </span>
            </div>
          )}}
        />

        <ReportListCard
          title="Top Customers"
          subtitle="Highest-value buyers in the current report set"
          items={customers?.topCustomers?.slice(0, 5)}
          emptyText="No customer sales concentration to show yet."
          renderItem={(item, index) => {
            const row = buildTopCustomerReportItem(item, index, formatCurrencyNGN);

            return (
            <div key={row.key} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">
                  {row.initialsLabel}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{row.title}</p>
                  <p className="text-xs text-slate-500">{row.helper}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-slate-900">{row.valueLabel}</span>
            </div>
          )}}
        />

        <ReportListCard
          title="Expenses by Category"
          subtitle="Where spend is concentrating in this period"
          items={expenses?.byCategory}
          emptyText="No expense categories recorded for this period yet."
          renderItem={(item, index) => {
            const row = buildExpenseCategoryReportItem(item, index, formatCurrencyNGN);

            return (
            <div key={row.key} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              <div>
                <p className="font-medium text-slate-900">{row.title}</p>
                <p className="text-xs text-slate-500">{row.helper}</p>
              </div>
              <span className="text-sm font-semibold text-slate-900">{row.valueLabel}</span>
            </div>
          )}}
        />
      </div>
    </PageShell>
  );
}
