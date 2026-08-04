import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useBusinessType } from '../config';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import { getErrorMessage } from '../lib/apiFeedback';
import {
  buildDebtorCard,
  buildDebtorOverviewMetrics,
  filterDebtorAccounts,
  getDebtorAccounts,
} from '../lib/debtors';
import TextileOps from './TextileOps';
import BuildingMaterialsOps from './BuildingMaterialsOps';
import WholesaleOps from './WholesaleOps';

function QueryErrorPanel({ message, onRetry }) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-[1.3rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p>{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="self-start rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default function Debtors() {
  const { labels, type } = useBusinessType();
  const [search, setSearch] = useState('');

  const customersQuery = useQuery({
    queryKey: ['debtor-customers'],
    queryFn: async () => {
      const response = await api.get('/customers');
      return response.data?.data || response.data || [];
    },
  });

  if (type === 'textile') {
    return <TextileOps />;
  }

  if (type === 'construction') {
    return <BuildingMaterialsOps />;
  }

  if (type === 'wholesale') {
    return <WholesaleOps />;
  }

  const customers = customersQuery.data || [];
  const debtorAccounts = useMemo(() => getDebtorAccounts(customers), [customers]);
  const visibleAccounts = useMemo(
    () => filterDebtorAccounts(debtorAccounts, search),
    [debtorAccounts, search]
  );
  const overviewMetrics = useMemo(() => buildDebtorOverviewMetrics(debtorAccounts), [debtorAccounts]);
  const loadError = customersQuery.isError
    ? getErrorMessage(customersQuery.error, 'We could not load debtor accounts right now. Please try again.')
    : '';

  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="Collections Desk"
        title={labels.debtors || 'Debtors'}
        description="See who owes, how much exposure is sitting outside the cash drawer, and which accounts deserve same-day follow-up."
      />

      <QueryErrorPanel
        message={loadError}
        onRetry={() => {
          void customersQuery.refetch();
        }}
      />

      <ResponsiveCardGrid variant="metrics">
        {overviewMetrics.map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={customersQuery.isLoading ? '...' : metric.value}
            helper={metric.helper}
            tone={metric.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Priority Follow-up</h2>
              <p className="mt-1 text-sm text-slate-500">Largest balances first so collection effort goes where it matters most.</p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
              {debtorAccounts.length} open
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {visibleAccounts.slice(0, 5).map((account) => {
              const card = buildDebtorCard(account);

              return (
                <div key={card.id} className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{card.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-amber-700">{card.collectionPriority}</p>
                    </div>
                    <p className="text-sm font-semibold text-amber-700">{card.balanceLabel}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{card.phoneLabel}</p>
                  <p className="mt-1 text-xs text-slate-500">Limit: {card.creditLimitLabel} • Headroom: {card.headroomLabel}</p>
                </div>
              );
            })}

            {!customersQuery.isLoading && visibleAccounts.length === 0 ? (
              <EmptyState
                icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 0L9 6m3-2l3 2m0 0v6.5m0-6.5l-3-3"
                title={`No ${labels.debtors?.toLowerCase() || 'debtors'} yet`}
                description="Credit accounts will appear here as soon as customers start carrying unpaid balances."
                tone="amber"
                className="max-w-none px-0"
              />
            ) : null}
          </div>
        </Card>

        <Card padding={false}>
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Debtor Register</h2>
                <p className="mt-1 text-sm text-slate-500">Customer balances, limits, and immediate collection context in one place.</p>
              </div>
              <input
                type="text"
                placeholder="Search debtor, phone, or type..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="input w-full md:max-w-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Account</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Type</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Balance</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Credit Limit</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Headroom</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Contact</th>
                </tr>
              </thead>
              <tbody>
                {customersQuery.isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td colSpan={6} className="px-5 py-4">
                        <div className="h-12 animate-pulse rounded-2xl bg-slate-100"></div>
                      </td>
                    </tr>
                  ))
                ) : visibleAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10">
                      <EmptyState
                        icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 0L9 6m3-2l3 2m0 0v6.5m0-6.5l-3-3"
                        title="No matching debtor accounts"
                        description="Try another search term, or wait for credit balances to build from real sales activity."
                        className="max-w-none px-0 py-2"
                      />
                    </td>
                  </tr>
                ) : visibleAccounts.map((account) => {
                  const card = buildDebtorCard(account);

                  return (
                    <tr key={card.id} className="border-t border-slate-100">
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">{card.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{card.emailLabel}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-500 capitalize">{card.customerTypeLabel}</td>
                      <td className="px-5 py-4 font-semibold text-amber-700">{card.balanceLabel}</td>
                      <td className="px-5 py-4 text-slate-500">{card.creditLimitLabel}</td>
                      <td className="px-5 py-4 text-slate-500">{card.headroomLabel}</td>
                      <td className="px-5 py-4">
                        <p className="text-slate-600">{card.phoneLabel}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{card.collectionPriority}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
