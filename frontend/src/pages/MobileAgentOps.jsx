import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Card, { CardHeader } from '../components/Card';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useBusinessType } from '../config';
import { getErrorMessage } from '../lib/apiFeedback';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import {
  buildMobileAgentDeskMetrics,
  buildMobileAgentFloatApprovalPayload,
  buildMobileAgentFloatRequestItem,
  buildMobileAgentFloatRequestPayload,
  buildMobileAgentFraudAlertItem,
  buildMobileAgentOverviewMetrics,
  buildMobileAgentRankingItem,
  buildMobileAgentReversalItem,
  buildMobileAgentShortageItem,
  buildMobileAgentShortagePayload,
  buildMobileAgentTierItem,
  buildMobileAgentTierPayload,
  buildMobileAgentTransactionItem,
  buildMobileAgentTransactionPayload,
  createMobileAgentFloatForm,
  createMobileAgentReversalForm,
  createMobileAgentShortageForm,
  createMobileAgentTierForm,
  createMobileAgentTransactionForm,
  filterMobileAgentFloatRequests,
  filterMobileAgentFraudAlerts,
  filterMobileAgentShortages,
  filterMobileAgentTransactions,
} from '../lib/mobileAgent';

const formatCurrency = formatCurrencyNGN;

function QueryErrorPanel({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p>{message}</p>
        <button
          type="button"
          onClick={() => {
            void onRetry();
          }}
          className="self-start rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default function MobileAgentOps() {
  const { labels } = useBusinessType();
  const queryClient = useQueryClient();
  const { toast, setToast, clearToast } = useToast();
  const [tierForm, setTierForm] = useState(createMobileAgentTierForm);
  const [floatForm, setFloatForm] = useState(createMobileAgentFloatForm);
  const [transactionForm, setTransactionForm] = useState(createMobileAgentTransactionForm);
  const [reversalForm, setReversalForm] = useState(createMobileAgentReversalForm);
  const [shortageForm, setShortageForm] = useState(createMobileAgentShortageForm);
  const [transactionSearch, setTransactionSearch] = useState('');
  const [floatSearch, setFloatSearch] = useState('');
  const [shortageSearch, setShortageSearch] = useState('');
  const [fraudSearch, setFraudSearch] = useState('');

  const refresh = () => {
    [
      'mobile-agent-overview',
      'mobile-agent-tiers',
      'mobile-agent-float-requests',
      'mobile-agent-transactions',
      'mobile-agent-reversals',
      'mobile-agent-shortages',
      'mobile-agent-fraud-alerts',
    ].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
  };

  const { data, error, refetch } = useQuery({
    queryKey: ['mobile-agent-desk'],
    queryFn: async () => {
      const [overview, tiers, floatRequests, transactions, reversals, shortages, fraudAlerts] = await Promise.all([
        api.get('/mobile-agent/overview').then((response) => response.data),
        api.get('/mobile-agent/commission-tiers').then((response) => response.data),
        api.get('/mobile-agent/float-requests').then((response) => response.data),
        api.get('/mobile-agent/transactions').then((response) => response.data),
        api.get('/mobile-agent/reversals').then((response) => response.data),
        api.get('/mobile-agent/shortages').then((response) => response.data),
        api.get('/mobile-agent/fraud-alerts').then((response) => response.data),
      ]);

      return { overview, tiers, floatRequests, transactions, reversals, shortages, fraudAlerts };
    },
    staleTime: 60000,
  });

  const tiers = data?.tiers || [];
  const floatRequests = data?.floatRequests || [];
  const transactions = data?.transactions || [];
  const reversals = data?.reversals || [];
  const shortages = data?.shortages || [];
  const fraudAlerts = data?.fraudAlerts || [];

  const createTier = useMutation({
    mutationFn: (payload) => api.post('/mobile-agent/commission-tiers', payload).then((response) => response.data),
    onSuccess: () => {
      setTierForm(createMobileAgentTierForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Commission tier saved into the agent banking desk.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that commission tier right now.') });
    },
  });

  const createFloatRequest = useMutation({
    mutationFn: (payload) => api.post('/mobile-agent/float-requests', payload).then((response) => response.data),
    onSuccess: () => {
      setFloatForm(createMobileAgentFloatForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Float request added to the live liquidity queue.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that float request right now.') });
    },
  });

  const approveFloatRequest = useMutation({
    mutationFn: ({ id, payload }) => api.post(`/mobile-agent/float-requests/${id}/approve`, payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Float request approved and liquidity totals refreshed.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not approve that float request right now.') });
    },
  });

  const createTransaction = useMutation({
    mutationFn: (payload) => api.post('/mobile-agent/transactions', payload).then((response) => response.data),
    onSuccess: () => {
      setTransactionForm(createMobileAgentTransactionForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Transaction captured into the mobile-agent ledger.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that transaction right now.') });
    },
  });

  const createReversal = useMutation({
    mutationFn: (payload) => api.post('/mobile-agent/reversals', payload).then((response) => response.data),
    onSuccess: () => {
      setReversalForm(createMobileAgentReversalForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Reversal logged into the exception queue.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not log that reversal right now.') });
    },
  });

  const createShortage = useMutation({
    mutationFn: (payload) => api.post('/mobile-agent/shortages', payload).then((response) => response.data),
    onSuccess: () => {
      setShortageForm(createMobileAgentShortageForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Cash shortage added to the loss-control queue.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not log that cash shortage right now.') });
    },
  });

  const deskMetrics = useMemo(
    () => buildMobileAgentDeskMetrics(data?.overview?.summary, floatRequests, transactions, shortages, fraudAlerts, formatCurrency),
    [data?.overview?.summary, floatRequests, transactions, shortages, fraudAlerts],
  );
  const filteredTransactions = useMemo(
    () => filterMobileAgentTransactions(transactions, transactionSearch).map((transaction) => buildMobileAgentTransactionItem(transaction, formatCurrency)),
    [transactions, transactionSearch],
  );
  const filteredFloatRequests = useMemo(
    () => filterMobileAgentFloatRequests(floatRequests, floatSearch).map((request) => ({ source: request, card: buildMobileAgentFloatRequestItem(request, formatCurrency) })),
    [floatRequests, floatSearch],
  );
  const filteredShortages = useMemo(
    () => filterMobileAgentShortages(shortages, shortageSearch).map((shortage) => buildMobileAgentShortageItem(shortage, formatCurrency)),
    [shortages, shortageSearch],
  );
  const filteredFraudAlerts = useMemo(
    () => filterMobileAgentFraudAlerts(fraudAlerts, fraudSearch).map((alert) => buildMobileAgentFraudAlertItem(alert)),
    [fraudAlerts, fraudSearch],
  );

  return (
    <div className="space-y-5">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Mobile agent feedback" />

      <PageHero
        eyebrow="Mobile Agent Operations"
        title={`${labels.transfers || 'Agent Banking'} control centre`}
        description="Run float, transfers, reversals, shortage recovery, commission tiers, and fraud review from one stronger desk built for high-volume Nigerian agency banking."
      />

      {error ? (
        <QueryErrorPanel
          message={getErrorMessage(error, 'We could not load the mobile agent operations desk right now.')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-9">
        {deskMetrics.map((metric) => (
          <OpsMetricCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
        ))}
      </ResponsiveCardGrid>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Transaction Desk" subtitle="Capture cash-in, cash-out, transfers, airtime, and bill payments with live float and cash impact." />
          <form
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              createTransaction.mutate(buildMobileAgentTransactionPayload(transactionForm));
            }}
          >
            <input className="input" placeholder="Agent name" value={transactionForm.agent_name} onChange={(event) => setTransactionForm({ ...transactionForm, agent_name: event.target.value })} />
            <select className="input" value={transactionForm.service_type} onChange={(event) => setTransactionForm({ ...transactionForm, service_type: event.target.value })}>
              <option value="transfer">Transfer</option>
              <option value="cash_in">Cash in</option>
              <option value="cash_out">Cash out</option>
              <option value="bill_payment">Bill payment</option>
              <option value="airtime">Airtime</option>
            </select>
            <input className="input" type="number" min="0" placeholder="Transaction amount" value={transactionForm.transaction_amount} onChange={(event) => setTransactionForm({ ...transactionForm, transaction_amount: event.target.value })} />
            <select className="input" value={transactionForm.commission_tier_id} onChange={(event) => setTransactionForm({ ...transactionForm, commission_tier_id: event.target.value })}>
              <option value="">Auto-assign commission tier</option>
              {tiers.map((tier) => <option key={tier.id} value={tier.id}>{tier.name} | {tier.service_type}</option>)}
            </select>
            <input className="input" type="number" placeholder="Cash delta" value={transactionForm.cash_delta} onChange={(event) => setTransactionForm({ ...transactionForm, cash_delta: event.target.value })} />
            <input className="input" type="number" placeholder="Float delta" value={transactionForm.float_delta} onChange={(event) => setTransactionForm({ ...transactionForm, float_delta: event.target.value })} />
            <textarea className="input min-h-[108px] resize-y py-3 md:col-span-2" placeholder="Transaction notes" value={transactionForm.notes} onChange={(event) => setTransactionForm({ ...transactionForm, notes: event.target.value })} />
            <button type="submit" className="md:col-span-2 mt-1 w-full rounded-2xl bg-slate-900 px-4 py-4 font-semibold text-white shadow-lg shadow-slate-900/10">
              {createTransaction.isPending ? 'Saving transaction...' : 'Save transaction'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Agent Ranking" subtitle="Who is driving earnings and who needs attention." />
          <div className="space-y-3">
            {(data?.overview?.agent_rankings || []).length === 0 ? (
              <p className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">No agent volume yet.</p>
            ) : (data?.overview?.agent_rankings || []).map((agent, index) => {
              const ranking = buildMobileAgentRankingItem(agent, index, formatCurrency);
              return (
                <div key={ranking.key} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900">{ranking.label}</p>
                    <p className="text-sm font-semibold text-sky-700">{ranking.commissionLabel}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{ranking.meta}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <Card>
          <CardHeader title="Float Requests" subtitle="Keep liquidity ahead of demand spikes with searchable queue visibility." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              createFloatRequest.mutate(buildMobileAgentFloatRequestPayload(floatForm));
            }}
          >
            <input className="input" placeholder="Agent name" value={floatForm.agent_name} onChange={(event) => setFloatForm({ ...floatForm, agent_name: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Requested amount" value={floatForm.requested_amount} onChange={(event) => setFloatForm({ ...floatForm, requested_amount: event.target.value })} />
            <input className="input" placeholder="Reason" value={floatForm.reason} onChange={(event) => setFloatForm({ ...floatForm, reason: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white">
              {createFloatRequest.isPending ? 'Saving float request...' : 'Save float request'}
            </button>
          </form>
          <input className="input mt-4" placeholder="Search agent, reason, or status..." value={floatSearch} onChange={(event) => setFloatSearch(event.target.value)} />
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            {filteredFloatRequests.slice(0, 4).map(({ source, card }) => (
              <div key={card.id} className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{card.agentName}</p>
                  {card.status === 'pending' ? (
                    <button type="button" className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700" onClick={() => approveFloatRequest.mutate({ id: card.id, payload: buildMobileAgentFloatApprovalPayload(source) })}>Approve</button>
                  ) : <span className="text-xs font-semibold text-emerald-700">{card.status}</span>}
                </div>
                <p className="mt-1 text-xs">{card.requestedAmountLabel}</p>
                <p className="mt-1 text-xs text-slate-500">{card.reasonLabel}</p>
              </div>
            ))}
            {!filteredFloatRequests.length ? <p className="text-sm text-slate-500">No float requests matched the current search.</p> : null}
          </div>
        </Card>

        <Card>
          <CardHeader title="Commission Tiers" subtitle="Reward volume without leaking margin." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              createTier.mutate(buildMobileAgentTierPayload(tierForm));
            }}
          >
            <input className="input" placeholder="Tier name" value={tierForm.name} onChange={(event) => setTierForm({ ...tierForm, name: event.target.value })} />
            <select className="input" value={tierForm.service_type} onChange={(event) => setTierForm({ ...tierForm, service_type: event.target.value })}>
              <option value="transfer">Transfer</option>
              <option value="cash_in">Cash in</option>
              <option value="cash_out">Cash out</option>
              <option value="bill_payment">Bill payment</option>
              <option value="airtime">Airtime</option>
            </select>
            <input className="input" type="number" min="0" placeholder="Min volume" value={tierForm.minimum_volume} onChange={(event) => setTierForm({ ...tierForm, minimum_volume: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Max volume" value={tierForm.maximum_volume} onChange={(event) => setTierForm({ ...tierForm, maximum_volume: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Commission rate %" value={tierForm.commission_rate} onChange={(event) => setTierForm({ ...tierForm, commission_rate: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Flat bonus" value={tierForm.flat_bonus} onChange={(event) => setTierForm({ ...tierForm, flat_bonus: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-sky-700 px-4 py-3 font-semibold text-white">
              {createTier.isPending ? 'Saving commission tier...' : 'Save commission tier'}
            </button>
          </form>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            {tiers.slice(0, 4).map((tier) => {
              const tierItem = buildMobileAgentTierItem(tier, formatCurrency);
              return <div key={tierItem.id} className="rounded-2xl bg-slate-50 px-3 py-3"><p className="font-medium text-slate-900">{tierItem.name}</p><p className="mt-1 text-xs">{tierItem.meta}</p></div>;
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Reversals" subtitle="Stop unresolved customer pain from turning into fraud exposure." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              createReversal.mutate(reversalForm);
            }}
          >
            <select className="input" value={reversalForm.mobile_agent_transaction_id} onChange={(event) => setReversalForm({ ...reversalForm, mobile_agent_transaction_id: event.target.value })}>
              <option value="">Select transaction</option>
              {transactions.slice(0, 10).map((transaction) => <option key={transaction.id} value={transaction.id}>{transaction.agent_name} | {transaction.transaction_reference}</option>)}
            </select>
            <textarea className="input min-h-[108px] resize-y py-3" placeholder="Reversal reason" value={reversalForm.reason} onChange={(event) => setReversalForm({ ...reversalForm, reason: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-amber-600 px-4 py-3 font-semibold text-white">
              {createReversal.isPending ? 'Logging reversal...' : 'Log reversal'}
            </button>
          </form>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            {reversals.slice(0, 4).map((reversal) => {
              const reversalItem = buildMobileAgentReversalItem(reversal, formatCurrency);
              return <div key={reversalItem.id} className="rounded-2xl bg-slate-50 px-3 py-3"><p className="font-medium text-slate-900">{reversalItem.reference}</p><p className="mt-1 text-xs">{reversalItem.meta}</p></div>;
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Cash Shortages" subtitle="Recover losses before they become habit." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              createShortage.mutate(buildMobileAgentShortagePayload(shortageForm));
            }}
          >
            <input className="input" placeholder="Agent name" value={shortageForm.agent_name} onChange={(event) => setShortageForm({ ...shortageForm, agent_name: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Shortage amount" value={shortageForm.shortage_amount} onChange={(event) => setShortageForm({ ...shortageForm, shortage_amount: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Recovered amount" value={shortageForm.recovered_amount} onChange={(event) => setShortageForm({ ...shortageForm, recovered_amount: event.target.value })} />
            <input className="input" placeholder="Reason" value={shortageForm.reason} onChange={(event) => setShortageForm({ ...shortageForm, reason: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-rose-600 px-4 py-3 font-semibold text-white">
              {createShortage.isPending ? 'Logging shortage...' : 'Log shortage'}
            </button>
          </form>
          <input className="input mt-4" placeholder="Search agent, reason, or status..." value={shortageSearch} onChange={(event) => setShortageSearch(event.target.value)} />
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            {filteredShortages.slice(0, 4).map((shortageItem) => {
              return <div key={shortageItem.id} className="rounded-2xl bg-slate-50 px-3 py-3"><p className="font-medium text-slate-900">{shortageItem.agentName}</p><p className="mt-1 text-xs">{shortageItem.meta}</p><p className="mt-1 text-xs text-slate-500">{shortageItem.reasonLabel}</p></div>;
            })}
            {!filteredShortages.length ? <p className="text-sm text-slate-500">No shortage records matched the current search.</p> : null}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader title="Recent Transactions" subtitle="Volume, commission, and cash-vs-float movement by agent." className="mb-0" />
            <input className="input" placeholder="Search agent, service, reference, or notes..." value={transactionSearch} onChange={(event) => setTransactionSearch(event.target.value)} />
          </div>
          <div className="mt-4 space-y-3">
            {filteredTransactions.slice(0, 6).map((transactionItem) => (
              <div key={transactionItem.id} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{transactionItem.agentName}</p>
                    <p className="mt-1 text-xs text-slate-500">{transactionItem.referenceLabel}</p>
                    <p className="mt-1 text-xs text-slate-500">{transactionItem.balanceLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{transactionItem.amountLabel}</p>
                    <p className="text-xs text-sky-700">{transactionItem.commissionLabel}</p>
                  </div>
                </div>
              </div>
            ))}
            {!filteredTransactions.length ? <p className="text-sm text-slate-500">No transactions matched the current search.</p> : null}
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader title="Fraud and Loss Watch" subtitle="High-value swings, negative float, and shortage pressure." className="mb-0" />
            <input className="input" placeholder="Search agent, alert type, detail, or severity..." value={fraudSearch} onChange={(event) => setFraudSearch(event.target.value)} />
          </div>
          <div className="mt-4 space-y-3">
            {filteredFraudAlerts.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">No open fraud alerts matched the current search.</p>
            ) : filteredFraudAlerts.slice(0, 6).map((alertItem) => (
              <div key={alertItem.id} className="rounded-2xl bg-rose-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-rose-900">{alertItem.agentName}</p>
                  <span className="text-xs font-semibold uppercase tracking-wide text-rose-700">{alertItem.severityLabel}</span>
                </div>
                <p className="mt-1 text-sm text-rose-800">{alertItem.alertTypeLabel}</p>
                <p className="mt-1 text-xs text-rose-700">{alertItem.details}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
