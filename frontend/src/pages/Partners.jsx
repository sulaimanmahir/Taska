import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '../components/Button';
import Card, { CardHeader } from '../components/Card';
import { FinanceFormError } from '../components/FinanceFormFeedback';
import OpsMetricCard from '../components/OpsMetricCard';
import { PageShell, ResponsiveCardGrid } from '../components/PageShell';
import PageHero from '../components/PageHero';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useAuthStore } from '../stores/authStore';
import { getErrorMessage } from '../lib/apiFeedback';
import { formatCurrencyNGN, formatShortDate } from '../lib/financeFormatters';
import {
  buildPartnerAgentRow,
  buildPartnerCommissionRow,
  buildPartnerMetrics,
  buildPartnerPayload,
  buildPartnerPayoutPayload,
  buildPartnerPayoutRow,
  buildPartnerProfilePayload,
  buildPartnerTierCard,
  createPartnerForm,
  createPartnerPayoutForm,
  createPartnerProfileForm,
  filterPartnerAgents,
  partnerAgentTypeOptions,
  partnerCommissionStatusOptions,
  partnerCommissionTypeOptions,
  partnerPaymentMethodOptions,
  partnerPayoutStatusOptions,
  partnerStatusOptions,
  partnerTabs,
} from '../lib/partners';
import api from '../lib/api';

const EMPTY_META = {
  current_page: 1,
  last_page: 1,
  total: 0,
};

function buildQueryString(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) {
      return;
    }

    query.append(key, String(value));
  });

  return query.toString();
}

function fetchPartnerList(path, params = {}) {
  const queryString = buildQueryString(params);
  const url = queryString ? `${path}?${queryString}` : path;
  return api.get(url).then((response) => response.data);
}

function EmptyPanel({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}

function QueryErrorPanel({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p>{message}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start text-rose-700 hover:bg-rose-100"
          onClick={() => {
            void onRetry();
          }}
        >
          Retry
        </Button>
      </div>
    </div>
  );
}

function QueueSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  );
}

function PaginationControls({ meta, page, onPageChange }) {
  if ((meta?.last_page || 1) <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-4 border-t border-slate-200 px-5 py-4">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-sm text-slate-500">
        Page {meta.current_page || page} of {meta.last_page}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(meta.last_page || page, page + 1))}
        disabled={page >= (meta.last_page || 1)}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

export default function Partners() {
  const { business } = useAuthStore();
  const queryClient = useQueryClient();
  const { toast, setToast, clearToast } = useToast();
  const [tab, setTab] = useState('agents');
  const [agentPage, setAgentPage] = useState(1);
  const [commissionPage, setCommissionPage] = useState(1);
  const [payoutPage, setPayoutPage] = useState(1);
  const [agentSearch, setAgentSearch] = useState('');
  const [agentStatus, setAgentStatus] = useState('');
  const [commissionAgentId, setCommissionAgentId] = useState('');
  const [commissionStatus, setCommissionStatus] = useState('');
  const [commissionType, setCommissionType] = useState('');
  const [payoutAgentId, setPayoutAgentId] = useState('');
  const [payoutStatus, setPayoutStatus] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [registerForm, setRegisterForm] = useState(createPartnerForm());
  const [registerError, setRegisterError] = useState('');
  const [profileForm, setProfileForm] = useState(createPartnerProfileForm());
  const [syncedProfileAgentId, setSyncedProfileAgentId] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [payoutForm, setPayoutForm] = useState(createPartnerPayoutForm());
  const [payoutFormError, setPayoutFormError] = useState('');
  const [approvingAgentId, setApprovingAgentId] = useState(null);
  const [approvingCommissionId, setApprovingCommissionId] = useState(null);
  const [processingPayoutId, setProcessingPayoutId] = useState(null);

  const statsQuery = useQuery({
    queryKey: ['partners', 'stats'],
    queryFn: () => api.get('/partners/stats').then((response) => response.data.data || {}),
  });

  const tiersQuery = useQuery({
    queryKey: ['partners', 'tiers'],
    queryFn: () => api.get('/partners/tiers').then((response) => response.data.data || []),
  });

  const agentsQuery = useQuery({
    queryKey: ['partners', 'agents', agentPage],
    queryFn: () => fetchPartnerList('/partners', { page: agentPage }),
    keepPreviousData: true,
  });

  const commissionsQuery = useQuery({
    queryKey: ['partners', 'commissions', commissionPage, commissionAgentId, commissionStatus, commissionType],
    queryFn: () => fetchPartnerList('/partners/commissions', {
      page: commissionPage,
      agent_id: commissionAgentId,
      status: commissionStatus,
      type: commissionType,
    }),
    keepPreviousData: true,
  });

  const payoutsQuery = useQuery({
    queryKey: ['partners', 'payouts', payoutPage, payoutAgentId, payoutStatus],
    queryFn: () => fetchPartnerList('/partners/payouts', {
      page: payoutPage,
      agent_id: payoutAgentId,
      status: payoutStatus,
    }),
    keepPreviousData: true,
  });
  const partnerDeskQueries = [statsQuery, tiersQuery, agentsQuery];

  const registerMutation = useMutation({
    mutationFn: (payload) => api.post('/partners/register', buildPartnerPayload(payload)).then((response) => response.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      setRegisterForm(createPartnerForm());
      setRegisterError('');
      clearToast();
      setToast({ tone: 'success', message: 'Partner registration has been submitted.' });
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'We could not register that partner right now.');
      setRegisterError(message);
      setToast({ tone: 'error', message });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ id, payload }) => api.patch(`/partners/${id}`, buildPartnerProfilePayload(payload)).then((response) => response.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      setProfileError('');
      clearToast();
      setToast({ tone: 'success', message: 'Partner payout profile updated.' });
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'We could not update that partner profile right now.');
      setProfileError(message);
      setToast({ tone: 'error', message });
    },
  });

  const createPayoutMutation = useMutation({
    mutationFn: (payload) => api.post('/partners/payouts', buildPartnerPayoutPayload(payload)).then((response) => response.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      setPayoutForm(createPartnerPayoutForm());
      setPayoutFormError('');
      clearToast();
      setToast({ tone: 'success', message: 'Partner payout has been created.' });
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'We could not create that payout right now.');
      setPayoutFormError(message);
      setToast({ tone: 'error', message });
    },
  });

  const agents = agentsQuery.data?.data || [];
  const agentMeta = agentsQuery.data?.meta || EMPTY_META;
  const commissions = commissionsQuery.data?.data || [];
  const commissionMeta = commissionsQuery.data?.meta || EMPTY_META;
  const payouts = payoutsQuery.data?.data || [];
  const payoutMeta = payoutsQuery.data?.meta || EMPTY_META;
  const partnerMetrics = buildPartnerMetrics(statsQuery.data || {}, formatCurrencyNGN);
  const tierCards = (tiersQuery.data || []).map((tier) => buildPartnerTierCard(tier));
  const filteredAgents = filterPartnerAgents(agents, agentSearch, agentStatus);
  const selectedAgent = agents.find((agent) => String(agent.id) === selectedAgentId) || null;
  const payoutReadyAgents = agents.filter((agent) => Number(agent.pending_payout || 0) > 0);
  const allAgentOptions = agents.map((agent) => ({
    value: String(agent.id),
    label: `${agent.full_name} (${agent.referral_code || 'no code'})`,
  }));

  // Adjust state during render rather than in an effect (avoids an extra
  // commit): default to the first agent once the list loads, and keep the
  // editable profile form synced whenever the resolved selection changes.
  if (!selectedAgentId && agents.length) {
    setSelectedAgentId(String(agents[0].id));
  }

  if (selectedAgent && selectedAgent.id !== syncedProfileAgentId) {
    setSyncedProfileAgentId(selectedAgent.id);
    setProfileForm(createPartnerProfileForm(selectedAgent));
  }

  if (!payoutForm.agent_id && payoutReadyAgents.length) {
    setPayoutForm(createPartnerPayoutForm(String(payoutReadyAgents[0].id)));
  }

  const handlePartnerQueryRefresh = () => {
    partnerDeskQueries.forEach((query) => {
      void query.refetch();
    });
  };

  const partnerDeskError = getErrorMessage(
    partnerDeskQueries.find((query) => query.isError)?.error,
    'We could not load partner program data right now.',
  );

  const handleRegisterPartner = (event) => {
    event.preventDefault();

    if (!registerForm.first_name.trim() || !registerForm.last_name.trim()) {
      setRegisterError('Enter the partner first and last name before submitting registration.');
      return;
    }

    setRegisterError('');
    clearToast();
    registerMutation.mutate(registerForm);
  };

  const handleSelectAgent = (agentId) => {
    setSelectedAgentId(agentId);
    const agent = agents.find((item) => String(item.id) === String(agentId));
    setProfileForm(createPartnerProfileForm(agent || {}));
    setProfileError('');
  };

  const handleUpdateProfile = (event) => {
    event.preventDefault();

    if (!selectedAgentId) {
      setProfileError('Choose a partner before updating payout settings.');
      return;
    }

    setProfileError('');
    clearToast();
    updateProfileMutation.mutate({
      id: selectedAgentId,
      payload: profileForm,
    });
  };

  const handleCreatePayout = (event) => {
    event.preventDefault();

    if (!payoutForm.agent_id) {
      setPayoutFormError('Choose a partner with pending earnings before creating a payout.');
      return;
    }

    if (payoutForm.amount === '' || Number.isNaN(Number(payoutForm.amount)) || Number(payoutForm.amount) <= 0) {
      setPayoutFormError('Enter a valid payout amount before continuing.');
      return;
    }

    setPayoutFormError('');
    clearToast();
    createPayoutMutation.mutate(payoutForm);
  };

  const handleApproveAgent = async (id) => {
    setApprovingAgentId(id);
    clearToast();

    try {
      await api.post(`/partners/${id}/approve`);
      await queryClient.invalidateQueries({ queryKey: ['partners'] });
      setToast({ tone: 'success', message: 'Partner approved and now active.' });
    } catch (error) {
      setToast({
        tone: 'error',
        message: getErrorMessage(error, 'We could not approve that partner right now.'),
      });
    } finally {
      setApprovingAgentId(null);
    }
  };

  const handleApproveCommission = async (id) => {
    setApprovingCommissionId(id);
    clearToast();

    try {
      await api.post(`/partners/commissions/${id}/approve`);
      await queryClient.invalidateQueries({ queryKey: ['partners'] });
      setToast({ tone: 'success', message: 'Commission approved and ready for payout planning.' });
    } catch (error) {
      setToast({
        tone: 'error',
        message: getErrorMessage(error, 'We could not approve that commission right now.'),
      });
    } finally {
      setApprovingCommissionId(null);
    }
  };

  const handleProcessPayout = async (id) => {
    setProcessingPayoutId(id);
    clearToast();

    try {
      await api.post(`/partners/payouts/${id}/process`, { gateway: 'paystack' });
      await queryClient.invalidateQueries({ queryKey: ['partners'] });
      setToast({ tone: 'success', message: 'Payout processing has been triggered.' });
    } catch (error) {
      setToast({
        tone: 'error',
        message: getErrorMessage(error, 'We could not process that payout right now.'),
      });
    } finally {
      setProcessingPayoutId(null);
    }
  };

  return (
    <PageShell width="wide" className="page-stack">
      <Toast
        tone={toast?.tone}
        message={toast?.message}
        groupAriaLabel="Partner program feedback"
      />

      <PageHero
        eyebrow="Growth Network"
        title="Partner Program"
        description="Register partners, maintain payout profiles, approve commissions, and release earnings from one cleaner growth-operations surface."
        aside={(
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">{business?.name || 'Active business'}</p>
            <p>
              The partner desk now covers registration, payout setup, commission review, and payout release so growth operations stay in one place.
            </p>
          </div>
        )}
      />

      {partnerDeskQueries.some((query) => query.isError) ? (
        <QueryErrorPanel
          message={partnerDeskError}
          onRetry={handlePartnerQueryRefresh}
        />
      ) : null}

      <ResponsiveCardGrid variant="metrics" className="xl:grid-cols-5">
        {partnerMetrics.map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            tone={metric.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <Card>
        <div className="flex flex-wrap gap-2">
          {partnerTabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                tab === item.id
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      {tab === 'agents' ? (
        <>
          <ResponsiveCardGrid variant="default" className="xl:grid-cols-3">
            <Card>
              <CardHeader
                title="Register Partner"
                subtitle="Open the program to new affiliates, introducers, and resellers without leaving this workspace."
              />

              <form onSubmit={handleRegisterPartner} className="space-y-4">
                <FinanceFormError message={registerError} />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">First name *</label>
                    <input
                      type="text"
                      value={registerForm.first_name}
                      onChange={(event) => {
                        setRegisterForm({ ...registerForm, first_name: event.target.value });
                        if (registerError) setRegisterError('');
                      }}
                      className="input"
                      placeholder="Amina"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Last name *</label>
                    <input
                      type="text"
                      value={registerForm.last_name}
                      onChange={(event) => {
                        setRegisterForm({ ...registerForm, last_name: event.target.value });
                        if (registerError) setRegisterError('');
                      }}
                      className="input"
                      placeholder="Bello"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                      className="input"
                      placeholder="partner@example.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone</label>
                    <input
                      type="text"
                      value={registerForm.phone}
                      onChange={(event) => setRegisterForm({ ...registerForm, phone: event.target.value })}
                      className="input"
                      placeholder="0800 000 0000"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Partner type</label>
                  <select
                    value={registerForm.agent_type}
                    onChange={(event) => setRegisterForm({ ...registerForm, agent_type: event.target.value })}
                    className="input"
                  >
                    {partnerAgentTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <Button type="submit" fullWidth disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? 'Submitting partner...' : 'Submit registration'}
                </Button>
              </form>
            </Card>

            <Card>
              <CardHeader
                title="Payout Profile"
                subtitle="Maintain settlement details for the selected partner so approved earnings can move without manual follow-up."
              />

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <FinanceFormError message={profileError} />

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Partner</label>
                  <select
                    value={selectedAgentId}
                    onChange={(event) => handleSelectAgent(event.target.value)}
                    className="input"
                  >
                    <option value="">Select a partner</option>
                    {allAgentOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {selectedAgent ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">{selectedAgent.full_name}</p>
                    <p className="mt-1">{selectedAgent.referral_code || 'No referral code yet'} | Pending payout {formatCurrencyNGN(selectedAgent.pending_payout || 0)}</p>
                  </div>
                ) : null}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Payment method</label>
                  <select
                    value={profileForm.payment_method}
                    onChange={(event) => setProfileForm({ ...profileForm, payment_method: event.target.value })}
                    className="input"
                  >
                    {partnerPaymentMethodOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Bank name</label>
                    <input
                      type="text"
                      value={profileForm.bank_name}
                      onChange={(event) => setProfileForm({ ...profileForm, bank_name: event.target.value })}
                      className="input"
                      placeholder="Optional"
                      disabled={profileForm.payment_method === 'wallet'}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Bank code</label>
                    <input
                      type="text"
                      value={profileForm.bank_code}
                      onChange={(event) => setProfileForm({ ...profileForm, bank_code: event.target.value })}
                      className="input"
                      placeholder="Optional"
                      disabled={profileForm.payment_method === 'wallet'}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Account number</label>
                    <input
                      type="text"
                      value={profileForm.account_number}
                      onChange={(event) => setProfileForm({ ...profileForm, account_number: event.target.value })}
                      className="input"
                      placeholder="Optional"
                      disabled={profileForm.payment_method === 'wallet'}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Account name</label>
                    <input
                      type="text"
                      value={profileForm.account_name}
                      onChange={(event) => setProfileForm({ ...profileForm, account_name: event.target.value })}
                      className="input"
                      placeholder="Optional"
                      disabled={profileForm.payment_method === 'wallet'}
                    />
                  </div>
                </div>

                <Button type="submit" fullWidth disabled={updateProfileMutation.isPending || !selectedAgentId}>
                  {updateProfileMutation.isPending ? 'Updating profile...' : 'Save payout profile'}
                </Button>
              </form>
            </Card>

            <Card>
              <CardHeader
                title="Tier Ladder"
                subtitle="Keep referral incentives visible so approval and payout conversations stay grounded in the live program rules."
              />

              {tiersQuery.isLoading ? <QueueSkeleton rows={4} /> : null}

              {tiersQuery.error ? (
                <QueryErrorPanel
                  message={getErrorMessage(tiersQuery.error, 'We could not load partner tiers right now.')}
                  onRetry={tiersQuery.refetch}
                />
              ) : null}

              {!tiersQuery.isLoading && !tiersQuery.error ? (
                <div className="space-y-3">
                  {tierCards.length ? tierCards.map((tier) => (
                    <div key={tier.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{tier.name}</p>
                          <p className="mt-1 text-sm text-slate-600">{tier.rangeLabel}</p>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${tier.tierBadgeClassName}`}>
                          {tier.slug || tier.name}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="rounded-full bg-white px-3 py-1">{tier.commissionRateLabel}</span>
                        <span className="rounded-full bg-white px-3 py-1">{tier.recurringRateLabel}</span>
                      </div>
                    </div>
                  )) : (
                    <EmptyPanel
                      title="No partner tiers yet"
                      description="Activate at least one referral tier to make incentive progress visible inside this desk."
                    />
                  )}
                </div>
              ) : null}
            </Card>
          </ResponsiveCardGrid>

          <Card padding={false} className="overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <CardHeader
                  title="Partner Directory"
                  subtitle={`Showing ${filteredAgents.length} of ${agents.length} partners on this page.`}
                  className="mb-0"
                />

                <div className="flex w-full flex-col gap-3 md:flex-row xl:w-auto">
                  <input
                    type="text"
                    value={agentSearch}
                    onChange={(event) => setAgentSearch(event.target.value)}
                    className="input min-w-[240px]"
                    placeholder="Search partners..."
                  />
                  <select
                    value={agentStatus}
                    onChange={(event) => setAgentStatus(event.target.value)}
                    className="input min-w-[200px]"
                  >
                    <option value="">All statuses</option>
                    {partnerStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {agentsQuery.isLoading ? (
              <div className="px-5 py-5">
                <QueueSkeleton rows={4} />
              </div>
            ) : null}

            {agentsQuery.error ? (
              <div className="px-5 py-5">
                <QueryErrorPanel
                  message={getErrorMessage(agentsQuery.error, 'We could not load the partner directory right now.')}
                  onRetry={agentsQuery.refetch}
                />
              </div>
            ) : null}

            {!agentsQuery.isLoading && !agentsQuery.error ? (
              filteredAgents.length ? (
                <div className="divide-y divide-slate-100">
                  {filteredAgents.map((agent) => {
                    const row = buildPartnerAgentRow(agent, { approvingAgentId }, formatCurrencyNGN, formatShortDate);

                    return (
                      <div key={row.id} className="grid gap-4 px-5 py-5 xl:grid-cols-[1.3fr_0.9fr_0.7fr_auto] xl:items-center">
                        <div>
                          <p className="font-semibold text-slate-900">{row.fullName}</p>
                          <p className="mt-1 text-sm text-slate-600">{row.contactLabel}</p>
                          <p className="mt-1 text-xs text-slate-500">{row.referralCodeLabel} | Joined {row.joinedAtLabel}</p>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                          <span className="rounded-full bg-sky-50 px-3 py-1 font-semibold capitalize text-sky-700">
                            {row.agentTypeLabel}
                          </span>
                          <span className={`rounded-full border px-3 py-1 font-semibold uppercase ${row.tierBadgeClassName}`}>
                            {row.tierLabel}
                          </span>
                          <span className={`rounded-full px-3 py-1 font-semibold uppercase ${row.statusBadgeClassName}`}>
                            {row.statusLabel}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-slate-600">
                          <p><span className="font-semibold text-slate-900">{row.totalEarningsLabel}</span> earned</p>
                          <p><span className="font-semibold text-amber-700">{row.pendingPayoutLabel}</span> pending payout</p>
                          <p>{row.paymentMethodLabel} | {row.accountLabel}</p>
                        </div>

                        <div className="flex flex-col items-start gap-2 xl:items-end">
                          {row.isPendingApproval ? (
                            <button
                              type="button"
                              onClick={() => handleApproveAgent(row.id)}
                              disabled={row.isApproving}
                              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {row.isApproving ? 'Approving...' : 'Approve partner'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectAgent(String(row.id))}
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              Edit payout profile
                            </button>
                          )}
                          <p className="text-xs text-slate-500">
                            {row.recentCommissionCountLabel} | Approved {row.approvedAtLabel}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-5 py-10 text-center text-sm text-slate-500">
                  {agentSearch || agentStatus
                    ? 'No partners matched the current search or status filter on this page.'
                    : 'No partners yet. Register the first partner from the panel above.'}
                </div>
              )
            ) : null}

            {!agentsQuery.isLoading && !agentsQuery.error ? (
              <PaginationControls meta={agentMeta} page={agentPage} onPageChange={setAgentPage} />
            ) : null}
          </Card>
        </>
      ) : null}

      {tab === 'commissions' ? (
        <>
          <Card>
            <CardHeader
              title="Commission Queue Filters"
              subtitle="Tighten the review queue by partner, status, or commission type before approving earnings."
            />

            <div className="grid gap-4 xl:grid-cols-4">
              <select
                value={commissionAgentId}
                onChange={(event) => {
                  setCommissionAgentId(event.target.value);
                  setCommissionPage(1);
                }}
                className="input"
              >
                <option value="">All partners</option>
                {allAgentOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              <select
                value={commissionStatus}
                onChange={(event) => {
                  setCommissionStatus(event.target.value);
                  setCommissionPage(1);
                }}
                className="input"
              >
                <option value="">All statuses</option>
                {partnerCommissionStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              <select
                value={commissionType}
                onChange={(event) => {
                  setCommissionType(event.target.value);
                  setCommissionPage(1);
                }}
                className="input"
              >
                <option value="">All commission types</option>
                {partnerCommissionTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setCommissionAgentId('');
                  setCommissionStatus('');
                  setCommissionType('');
                  setCommissionPage(1);
                }}
              >
                Clear filters
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Commission Queue"
              subtitle={`${commissionMeta.total || commissions.length} earnings in the current review stream.`}
            />

            {commissionsQuery.isLoading ? <QueueSkeleton rows={4} /> : null}

            {commissionsQuery.error ? (
              <QueryErrorPanel
                message={getErrorMessage(commissionsQuery.error, 'We could not load partner commissions right now.')}
                onRetry={commissionsQuery.refetch}
              />
            ) : null}

            {!commissionsQuery.isLoading && !commissionsQuery.error ? (
              commissions.length ? (
                <div className="space-y-3">
                  {commissions.map((commission) => {
                    const row = buildPartnerCommissionRow(
                      commission,
                      { approvingId: approvingCommissionId },
                      formatCurrencyNGN,
                      formatShortDate,
                    );

                    return (
                      <div key={row.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900">{row.agentName}</p>
                          <p className="text-sm text-slate-600">{row.businessAndTypeLabel}</p>
                          <p className="text-xs text-slate-500">{row.metaLabel}</p>
                          <p className="text-xs text-slate-500">{row.descriptionLabel}</p>
                        </div>

                        <div className="flex flex-col items-start gap-3 md:items-end">
                          <div className="text-right">
                            <p className="font-semibold text-slate-900">{row.amountLabel}</p>
                            <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase ${row.statusBadgeClassName}`}>
                              {row.statusLabel}
                            </span>
                          </div>
                          {row.isPendingApproval ? (
                            <button
                              type="button"
                              onClick={() => handleApproveCommission(row.id)}
                              disabled={row.isApproving}
                              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {row.isApproving ? 'Approving...' : 'Approve commission'}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyPanel
                  title="No commissions yet"
                  description="Partner earnings will appear here as businesses start converting through the partner channel."
                />
              )
            ) : null}
          </Card>

          {!commissionsQuery.isLoading && !commissionsQuery.error ? (
            <Card padding={false}>
              <PaginationControls meta={commissionMeta} page={commissionPage} onPageChange={setCommissionPage} />
            </Card>
          ) : null}
        </>
      ) : null}

      {tab === 'payouts' ? (
        <>
          <ResponsiveCardGrid variant="default" className="xl:grid-cols-2">
            <Card>
              <CardHeader
                title="Create Payout"
                subtitle="Move approved partner earnings into a payout batch without leaving the partner desk."
              />

              <form onSubmit={handleCreatePayout} className="space-y-4">
                <FinanceFormError message={payoutFormError} />

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Partner</label>
                  <select
                    value={payoutForm.agent_id}
                    onChange={(event) => setPayoutForm({ ...payoutForm, agent_id: event.target.value })}
                    className="input"
                  >
                    <option value="">Select a payout-ready partner</option>
                    {payoutReadyAgents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.full_name} ({formatCurrencyNGN(agent.pending_payout || 0)} pending)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Amount</label>
                  <input
                    type="number"
                    min="1"
                    value={payoutForm.amount}
                    onChange={(event) => setPayoutForm({ ...payoutForm, amount: event.target.value })}
                    className="input"
                    placeholder="0"
                  />
                </div>

                <Button type="submit" fullWidth disabled={createPayoutMutation.isPending || !payoutReadyAgents.length}>
                  {createPayoutMutation.isPending ? 'Creating payout...' : 'Create payout'}
                </Button>
              </form>
            </Card>

            <Card>
              <CardHeader
                title="Payout Queue Filters"
                subtitle="Review payout readiness by partner or settlement status before triggering processing."
              />

              <div className="space-y-4">
                <select
                  value={payoutAgentId}
                  onChange={(event) => {
                    setPayoutAgentId(event.target.value);
                    setPayoutPage(1);
                  }}
                  className="input"
                >
                  <option value="">All partners</option>
                  {allAgentOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>

                <select
                  value={payoutStatus}
                  onChange={(event) => {
                    setPayoutStatus(event.target.value);
                    setPayoutPage(1);
                  }}
                  className="input"
                >
                  <option value="">All payout statuses</option>
                  {partnerPayoutStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>

                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    setPayoutAgentId('');
                    setPayoutStatus('');
                    setPayoutPage(1);
                  }}
                >
                  Clear payout filters
                </Button>
              </div>
            </Card>
          </ResponsiveCardGrid>

          <Card>
            <CardHeader
              title="Payout Queue"
              subtitle={`${payoutMeta.total || payouts.length} partner payouts currently in motion.`}
            />

            {payoutsQuery.isLoading ? <QueueSkeleton rows={4} /> : null}

            {payoutsQuery.error ? (
              <QueryErrorPanel
                message={getErrorMessage(payoutsQuery.error, 'We could not load partner payouts right now.')}
                onRetry={payoutsQuery.refetch}
              />
            ) : null}

            {!payoutsQuery.isLoading && !payoutsQuery.error ? (
              payouts.length ? (
                <div className="space-y-3">
                  {payouts.map((payout) => {
                    const row = buildPartnerPayoutRow(
                      payout,
                      { processingId: processingPayoutId },
                      formatCurrencyNGN,
                      formatShortDate,
                    );

                    return (
                      <div key={row.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900">{row.payoutNumber}</p>
                          <p className="text-sm text-slate-600">{row.agentName}</p>
                          <p className="text-xs text-slate-500">{row.createdAtLabel} | {row.paymentMethodLabel}</p>
                          <p className="text-xs text-slate-500">{row.accountLabel}</p>
                          {row.failureReasonLabel ? <p className="text-xs text-rose-600">{row.failureReasonLabel}</p> : null}
                        </div>

                        <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-3 md:items-center md:text-right">
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Amount</p>
                            <p className="font-semibold text-slate-900">{row.amountLabel}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Fees</p>
                            <p className="font-semibold text-slate-900">{row.feesLabel}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Net</p>
                            <p className="font-semibold text-slate-900">{row.netAmountLabel}</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-3 md:items-end">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase ${row.statusBadgeClassName}`}>
                            {row.statusLabel}
                          </span>
                          <p className="text-xs text-slate-500">{row.gatewayReferenceLabel} | {row.processedAtLabel}</p>
                          {row.isPendingProcess ? (
                            <button
                              type="button"
                              onClick={() => handleProcessPayout(row.id)}
                              disabled={row.isProcessing}
                              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {row.isProcessing ? 'Processing...' : 'Process payout'}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyPanel
                  title="No payouts yet"
                  description="Approved partner earnings will show up here once the business is ready to release payouts."
                />
              )
            ) : null}
          </Card>

          {!payoutsQuery.isLoading && !payoutsQuery.error ? (
            <Card padding={false}>
              <PaginationControls meta={payoutMeta} page={payoutPage} onPageChange={setPayoutPage} />
            </Card>
          ) : null}
        </>
      ) : null}
    </PageShell>
  );
}
