import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from './useToast';
import { useAuthStore } from '../stores/authStore';
import { getErrorMessage } from '../lib/apiFeedback';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import {
  buildPartnerMetrics,
  buildPartnerPayload,
  buildPartnerPayoutPayload,
  buildPartnerProfilePayload,
  buildPartnerTierCard,
  createPartnerForm,
  createPartnerPayoutForm,
  createPartnerProfileForm,
  filterPartnerAgents,
} from '../lib/partners';
import api from '../lib/api';

export const EMPTY_META = {
  current_page: 1,
  last_page: 1,
  total: 0,
};

export function buildQueryString(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) {
      return;
    }

    query.append(key, String(value));
  });

  return query.toString();
}

export function fetchPartnerList(path, params = {}) {
  const queryString = buildQueryString(params);
  const url = queryString ? `${path}?${queryString}` : path;
  return api.get(url).then((response) => response.data);
}

export function usePartnersDesk() {
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

  return {
    business,
    toast,
    tab,
    setTab,
    agentPage,
    setAgentPage,
    commissionPage,
    setCommissionPage,
    payoutPage,
    setPayoutPage,
    agentSearch,
    setAgentSearch,
    agentStatus,
    setAgentStatus,
    commissionAgentId,
    setCommissionAgentId,
    commissionStatus,
    setCommissionStatus,
    commissionType,
    setCommissionType,
    payoutAgentId,
    setPayoutAgentId,
    payoutStatus,
    setPayoutStatus,
    selectedAgentId,
    registerForm,
    setRegisterForm,
    registerError,
    profileForm,
    setProfileForm,
    profileError,
    payoutForm,
    setPayoutForm,
    payoutFormError,
    approvingAgentId,
    approvingCommissionId,
    processingPayoutId,
    statsQuery,
    tiersQuery,
    agentsQuery,
    commissionsQuery,
    payoutsQuery,
    partnerDeskQueries,
    registerMutation,
    updateProfileMutation,
    createPayoutMutation,
    agents,
    agentMeta,
    commissions,
    commissionMeta,
    payouts,
    payoutMeta,
    partnerMetrics,
    tierCards,
    filteredAgents,
    selectedAgent,
    payoutReadyAgents,
    allAgentOptions,
    handlePartnerQueryRefresh,
    partnerDeskError,
    handleRegisterPartner,
    handleSelectAgent,
    handleUpdateProfile,
    handleCreatePayout,
    handleApproveAgent,
    handleApproveCommission,
    handleProcessPayout,
  };
}
