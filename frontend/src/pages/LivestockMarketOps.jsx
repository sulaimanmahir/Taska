import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Card, { CardHeader } from '../components/Card';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import { useBusinessType } from '../config';
import {
  animalTypeOptions,
  buildLivestockMarketOverviewMetrics,
  buildLivestockMarketTransactionCard,
  buildLivestockMarketTransactionPayload,
  createLivestockMarketTransactionForm,
  transactionTypeOptions,
} from '../lib/livestockMarket';
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

export default function LivestockMarketOps() {
  const { color = '#7C3AED' } = useBusinessType();
  const accentColor = color || '#7C3AED';
  const queryClient = useQueryClient();
  const [transactionForm, setTransactionForm] = useState(createLivestockMarketTransactionForm);

  const overviewQuery = useQuery({
    queryKey: ['livestock-market-overview'],
    queryFn: () => api.get('/livestock-market/overview').then((response) => response.data),
  });

  const transactionsQuery = useQuery({
    queryKey: ['livestock-market-transactions'],
    queryFn: () => api.get('/livestock-market/transactions').then((response) => response.data ?? []),
  });

  const transactions = transactionsQuery.data ?? [];
  const summary = overviewQuery.data?.summary ?? {};
  const marketQueries = [overviewQuery, transactionsQuery];
  const marketError = marketQueries.find((query) => query.isError)?.error;

  const refreshMarketQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['livestock-market-overview'] });
    queryClient.invalidateQueries({ queryKey: ['livestock-market-transactions'] });
  };

  const handleRetry = () => {
    marketQueries.forEach((query) => {
      void query.refetch();
    });
  };

  const createTransaction = useMutation({
    mutationFn: (payload) => api.post('/livestock-market/transactions', payload).then((response) => response.data),
    onSuccess: () => {
      refreshMarketQueries();
      setTransactionForm(createLivestockMarketTransactionForm());
    },
  });

  const overviewMetrics = buildLivestockMarketOverviewMetrics(summary, formatCurrencyNGN);
  const transactionCards = transactions.map((transaction) => buildLivestockMarketTransactionCard(transaction, formatCurrencyNGN));

  const handleTransactionSubmit = (event) => {
    event.preventDefault();
    createTransaction.mutate(buildLivestockMarketTransactionPayload(transactionForm));
  };

  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="Livestock Market Desk"
        title="Track intake, holding pen, and market-day sales"
        description="Log every animal bought from herders and sold to buyers so the holding pen count and market revenue stay visible run over run."
      />

      <ResponsiveCardGrid variant="metrics" className="2xl:grid-cols-3">
        {overviewMetrics.map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            tone={metric.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <QueryErrorPanel
        message={marketError ? 'We could not load part of the livestock market workspace right now. Please try again.' : ''}
        onRetry={handleRetry}
      />

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader title="Log Market Transaction" subtitle="Record an intake from a herder or a sale to a buyer" />
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleTransactionSubmit}>
            <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
              <span>Transaction Type</span>
              <select
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={transactionForm.transaction_type}
                onChange={(event) => setTransactionForm({ ...transactionForm, transaction_type: event.target.value })}
              >
                {transactionTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Market Date</span>
              <input
                type="date"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={transactionForm.market_date}
                onChange={(event) => setTransactionForm({ ...transactionForm, market_date: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Animal Type</span>
              <select
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={transactionForm.animal_type}
                onChange={(event) => setTransactionForm({ ...transactionForm, animal_type: event.target.value })}
              >
                {animalTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Head Count</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={transactionForm.head_count}
                onChange={(event) => setTransactionForm({ ...transactionForm, head_count: event.target.value })}
                placeholder="e.g. 20"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Total Weight (kg, optional)</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={transactionForm.total_weight_kg}
                onChange={(event) => setTransactionForm({ ...transactionForm, total_weight_kg: event.target.value })}
                placeholder="e.g. 6000"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Unit Price per kg (optional)</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={transactionForm.unit_price_per_kg}
                onChange={(event) => setTransactionForm({ ...transactionForm, unit_price_per_kg: event.target.value })}
                placeholder="Leave blank for negotiated price"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Total Amount</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={transactionForm.total_amount}
                onChange={(event) => setTransactionForm({ ...transactionForm, total_amount: event.target.value })}
                placeholder="Final settled amount"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Counterparty Name</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={transactionForm.counterparty_name}
                onChange={(event) => setTransactionForm({ ...transactionForm, counterparty_name: event.target.value })}
                placeholder="Herder or buyer name"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Counterparty Phone</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={transactionForm.counterparty_phone}
                onChange={(event) => setTransactionForm({ ...transactionForm, counterparty_phone: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
              <span>Notes</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={transactionForm.notes}
                onChange={(event) => setTransactionForm({ ...transactionForm, notes: event.target.value })}
                placeholder="Optional notes"
              />
            </label>
            <button
              type="submit"
              disabled={createTransaction.isPending}
              className="rounded-2xl px-5 py-4 text-sm font-semibold text-white shadow-lg md:col-span-2"
              style={{ background: createTransaction.isPending ? '#94a3b8' : accentColor }}
            >
              {createTransaction.isPending ? 'Saving transaction...' : 'Save transaction'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Recent Transactions" subtitle="Latest intake and sale activity" />
          <div className="space-y-3">
            {transactionCards.length ? transactionCards.map((card) => (
              <div key={card.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{card.transactionNumber}</p>
                    <p className="text-sm text-slate-500">{card.animalTypeLabel} · {card.marketDate}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                    card.isSale ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'
                  }`}>
                    {card.typeLabel}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-3">
                  <span>{card.headCountLabel}</span>
                  {card.weightLabel ? <span>{card.weightLabel}</span> : null}
                  <span>{card.counterpartyLabel}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">Total: {card.totalAmountLabel}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No market transactions logged yet.</p>}
          </div>
        </Card>
      </section>
    </div>
  );
}
