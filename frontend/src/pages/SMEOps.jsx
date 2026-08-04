import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Card, { CardHeader } from '../components/Card';
import EmptyState from '../components/EmptyState';
import OpsMetricCard from '../components/OpsMetricCard';
import { PageHeader, ResponsiveCardGrid, SectionShell } from '../components/PageShell';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import {
  buildSmeCashEntryCard,
  buildSmeCashPayload,
  buildSmeFollowUpCard,
  buildSmeFollowUpPayload,
  buildSmeOverviewMetrics,
  buildSmeOwnerPulse,
  buildSmeTargetCard,
  buildSmeTargetPayload,
  createSmeCashForm,
  createSmeFollowUpForm,
  createSmeTargetForm,
  getSmeDueFollowUps,
} from '../lib/sme';

const EMPTY_LIST = [];

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

export default function SMEOps() {
  const queryClient = useQueryClient();
  const [cashForm, setCashForm] = useState(() => createSmeCashForm());
  const [followUpForm, setFollowUpForm] = useState(() => createSmeFollowUpForm());
  const [targetForm, setTargetForm] = useState(() => createSmeTargetForm());

  const overviewQuery = useQuery({
    queryKey: ['general-sme-overview'],
    queryFn: () => api.get('/general-sme/overview').then((response) => response.data),
    staleTime: 30000,
  });

  const customersQuery = useQuery({
    queryKey: ['general-sme-customers'],
    queryFn: () => api.get('/customers').then((response) => response.data.data || response.data || []),
    staleTime: 30000,
  });

  const data = overviewQuery.data;
  const isLoading = overviewQuery.isLoading;
  const customers = customersQuery.data || [];
  const smeQueries = [overviewQuery, customersQuery];
  const loadError = smeQueries.find((query) => query.isError)?.error
    ? 'We could not load part of the SME control centre right now. Please try again.'
    : '';

  const invalidateOverview = () => {
    queryClient.invalidateQueries({ queryKey: ['general-sme-overview'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const cashMutation = useMutation({
    mutationFn: (payload) => api.post('/general-sme/cash-entries', payload),
    onSuccess: () => {
      setCashForm(createSmeCashForm());
      invalidateOverview();
    },
  });

  const followUpMutation = useMutation({
    mutationFn: (payload) => api.post('/general-sme/follow-ups', payload),
    onSuccess: () => {
      setFollowUpForm(createSmeFollowUpForm());
      invalidateOverview();
    },
  });

  const targetMutation = useMutation({
    mutationFn: (payload) => api.post('/general-sme/daily-targets', payload),
    onSuccess: () => {
      invalidateOverview();
    },
  });

  const summary = useMemo(() => data?.summary ?? {}, [data?.summary]);
  const cashEntries = data?.cash_entries ?? [];
  const followUps = data?.followups ?? EMPTY_LIST;
  const targets = data?.targets ?? [];

  const dueFollowUps = useMemo(() => getSmeDueFollowUps(followUps), [followUps]);
  const overviewMetrics = useMemo(() => buildSmeOverviewMetrics(summary, formatCurrencyNGN), [summary]);
  const ownerPulse = useMemo(() => buildSmeOwnerPulse(summary, formatCurrencyNGN), [summary]);

  return (
    <div className="space-y-6">
      <SectionShell>
        <PageHeader
          eyebrow="Owner Control"
          title="SME Control Centre"
          description="Cash visibility, customer follow-up, and owner target discipline for mixed businesses."
        />
      </SectionShell>

      <QueryErrorPanel
        message={loadError}
        onRetry={() => {
          smeQueries.forEach((query) => {
            void query.refetch();
          });
        }}
      />

      <ResponsiveCardGrid variant="metrics">
        {overviewMetrics.map((metric) => (
          <OpsMetricCard key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} tone={metric.tone} />
        ))}
      </ResponsiveCardGrid>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Owner Pulse" subtitle="What deserves attention before close of business" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {ownerPulse.map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Due Follow-ups" />
          <div className="space-y-3">
            {dueFollowUps.length > 0 ? dueFollowUps.map((item) => {
              const followUp = buildSmeFollowUpCard(item);
              return (
              <div key={followUp.id} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-medium text-slate-900">{followUp.title}</p>
                <p className="mt-1 text-sm text-slate-500">{followUp.customerLabel}</p>
                <p className="mt-2 text-sm text-slate-700">{followUp.dueLabel}</p>
              </div>
            );}) : (
              <EmptyState
                icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                title="No follow-ups due"
                description="Collections and customer reminders will show here."
              />
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Log Cash Movement" />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              cashMutation.mutate(buildSmeCashPayload(cashForm));
            }}
          >
            <select
              value={cashForm.entry_type}
              onChange={(event) => setCashForm((current) => ({ ...current, entry_type: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <option value="cash_in">Cash In</option>
              <option value="cash_out">Cash Out</option>
            </select>
            <input
              value={cashForm.source}
              onChange={(event) => setCashForm((current) => ({ ...current, source: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="Source or purpose"
              required
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={cashForm.amount}
              onChange={(event) => setCashForm((current) => ({ ...current, amount: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="Amount"
              required
            />
            <select
              value={cashForm.payment_method}
              onChange={(event) => setCashForm((current) => ({ ...current, payment_method: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <option value="cash">Cash</option>
              <option value="transfer">Transfer</option>
              <option value="card">Card</option>
              <option value="wallet">Wallet</option>
            </select>
            <input
              type="date"
              value={cashForm.entry_date}
              onChange={(event) => setCashForm((current) => ({ ...current, entry_date: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              required
            />
            <textarea
              value={cashForm.notes}
              onChange={(event) => setCashForm((current) => ({ ...current, notes: event.target.value }))}
              className="min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="Notes"
            />
            <button
              type="submit"
              disabled={cashMutation.isPending}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
            >
              {cashMutation.isPending ? 'Saving cash entry...' : 'Save cash entry'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Set Daily Target" />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              targetMutation.mutate(buildSmeTargetPayload(targetForm));
            }}
          >
            <input
              type="date"
              value={targetForm.target_date}
              onChange={(event) => setTargetForm((current) => ({ ...current, target_date: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              required
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={targetForm.sales_target}
              onChange={(event) => setTargetForm((current) => ({ ...current, sales_target: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="Sales target"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={targetForm.collection_target}
              onChange={(event) => setTargetForm((current) => ({ ...current, collection_target: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="Collection target"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={targetForm.expense_limit}
              onChange={(event) => setTargetForm((current) => ({ ...current, expense_limit: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="Expense limit"
            />
            <textarea
              value={targetForm.notes}
              onChange={(event) => setTargetForm((current) => ({ ...current, notes: event.target.value }))}
              className="min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="Notes"
            />
            <button
              type="submit"
              disabled={targetMutation.isPending}
              className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white"
            >
              {targetMutation.isPending ? 'Saving daily target...' : 'Save daily target'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Save Follow-up" />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              followUpMutation.mutate(buildSmeFollowUpPayload(followUpForm));
            }}
          >
            <select
              value={followUpForm.customer_id || ''}
              onChange={(event) => setFollowUpForm((current) => ({ ...current, customer_id: event.target.value || null }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
            <input
              value={followUpForm.title}
              onChange={(event) => setFollowUpForm((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="What needs follow-up?"
              required
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={followUpForm.amount_in_focus}
              onChange={(event) => setFollowUpForm((current) => ({ ...current, amount_in_focus: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="Amount in focus"
            />
            <input
              type="date"
              value={followUpForm.due_on}
              onChange={(event) => setFollowUpForm((current) => ({ ...current, due_on: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              required
            />
            <textarea
              value={followUpForm.notes}
              onChange={(event) => setFollowUpForm((current) => ({ ...current, notes: event.target.value }))}
              className="min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="Notes"
            />
            <button
              type="submit"
              disabled={followUpMutation.isPending}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white"
            >
              {followUpMutation.isPending ? 'Saving follow-up...' : 'Save follow-up'}
            </button>
          </form>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Recent Cash Entries" />
          <div className="space-y-3">
            {isLoading ? (
              <div className="py-8 text-sm text-slate-500">Loading cash activity...</div>
            ) : cashEntries.length > 0 ? cashEntries.slice(0, 6).map((entry) => {
              const cashEntry = buildSmeCashEntryCard(entry, formatCurrencyNGN);
              return (
              <div key={cashEntry.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                <div>
                  <p className="font-medium text-slate-900">{cashEntry.source}</p>
                  <p className="text-sm text-slate-500">{cashEntry.meta}</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${cashEntry.amountTone}`}>{cashEntry.amountLabel}</p>
                  <p className="text-sm text-slate-500">{cashEntry.dateLabel}</p>
                </div>
              </div>
            );}) : (
              <EmptyState
                icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V4m0 0L9 6m3-2l3 2"
                title="No cash entries yet"
                description="Daily cash inflow and outflow will show here."
              />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Target History" />
          <div className="space-y-3">
            {targets.length > 0 ? targets.slice(0, 5).map((target) => {
              const targetCard = buildSmeTargetCard(target, formatCurrencyNGN);
              return (
              <div key={targetCard.id} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-medium text-slate-900">{targetCard.dateLabel}</p>
                <p className="mt-1 text-sm text-slate-600">{targetCard.salesLabel}</p>
                <p className="text-sm text-slate-600">{targetCard.collectionsLabel}</p>
              </div>
            );}) : (
              <EmptyState
                icon="M3 12h18M4 18h16M4 6h16"
                title="No targets set yet"
                description="Daily target snapshots will appear here."
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
