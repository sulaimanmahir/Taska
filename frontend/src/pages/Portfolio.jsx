import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Card, { CardHeader } from '../components/Card';
import EmptyState from '../components/EmptyState';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { formatCurrencyNGN } from '../lib/financeFormatters';

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

export default function Portfolio() {
  const navigate = useNavigate();
  const switchBusiness = useAuthStore((state) => state.switchBusiness);

  const portfolioQuery = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => api.get('/portfolio').then((response) => response.data),
  });

  const businesses = portfolioQuery.data?.businesses ?? [];
  const totals = portfolioQuery.data?.totals ?? {
    business_count: 0,
    today_sales: 0,
    today_orders: 0,
    customers_count: 0,
    expenses_today: 0,
    staff_count: 0,
    low_stock_count: 0,
  };

  const totalsMetrics = [
    { label: 'Businesses', value: String(totals.business_count), tone: 'violet' },
    { label: "Today's sales", value: formatCurrencyNGN(totals.today_sales), tone: 'emerald' },
    { label: "Today's orders", value: String(totals.today_orders), tone: 'sky' },
    { label: 'Customers', value: String(totals.customers_count), tone: 'slate' },
    { label: 'Staff', value: String(totals.staff_count), tone: 'slate' },
    { label: 'Low stock alerts', value: String(totals.low_stock_count), tone: totals.low_stock_count > 0 ? 'amber' : 'emerald' },
    { label: "Today's expenses", value: formatCurrencyNGN(totals.expenses_today), tone: 'amber' },
  ];

  const handleOpenBusiness = async (businessId) => {
    await switchBusiness(businessId);
    navigate('/dashboard');
  };

  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="Portfolio"
        title="All your businesses, at a glance"
        description="A rolled-up view across every business you belong to, with each one's own financials and headcount broken out separately."
      />

      <ResponsiveCardGrid variant="metrics" className="2xl:grid-cols-4">
        {totalsMetrics.map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            tone={metric.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <QueryErrorPanel
        message={portfolioQuery.isError ? 'We could not load your business portfolio right now. Please try again.' : ''}
        onRetry={() => portfolioQuery.refetch()}
      />

      {portfolioQuery.isLoading ? (
        <Card>
          <p className="text-sm text-slate-500">Loading your businesses...</p>
        </Card>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {businesses.map((business) => (
          <Card key={business.id}>
            <CardHeader
              title={business.name}
              subtitle={business.business_type_label}
            />
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Today's sales</p>
                <p className="mt-1 font-semibold text-slate-900">{formatCurrencyNGN(business.stats.today_sales)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Orders today</p>
                <p className="mt-1 font-semibold text-slate-900">{business.stats.today_orders}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Customers</p>
                <p className="mt-1 font-semibold text-slate-900">{business.stats.customers_count}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Staff</p>
                <p className="mt-1 font-semibold text-slate-900">{business.stats.staff_count}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Expenses today</p>
                <p className="mt-1 font-semibold text-slate-900">{formatCurrencyNGN(business.stats.expenses_today)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Low stock</p>
                <p className={`mt-1 font-semibold ${business.stats.low_stock_count > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                  {business.stats.low_stock_count}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleOpenBusiness(business.id)}
              className="mt-4 w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            >
              Open {business.name}
            </button>
          </Card>
        ))}
      </div>

      {!portfolioQuery.isLoading && businesses.length === 0 ? (
        <Card>
          <EmptyState
            icon="M3 7l1.5-3h15L21 7M3 7v11a2 2 0 002 2h14a2 2 0 002-2V7M3 7h18M9 11h6"
            title="No businesses yet"
            description="Businesses you own or belong to will appear here."
          />
        </Card>
      ) : null}
    </div>
  );
}
