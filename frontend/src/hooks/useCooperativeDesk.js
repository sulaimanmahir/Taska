import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import {
  buildCooperativeDashboardMetrics,
  buildCooperativeGovernanceRecordPresentation,
  buildCooperativeGovernanceSnapshot,
  buildCooperativeInvestmentPresentation,
  buildCooperativeMemberPresentation,
  buildCooperativeReportCards,
  buildCooperativeShareOwnership,
  buildCooperativeSettingsSummary,
  createCooperativeShareSummary,
  buildCooperativeWalletPresentation,
  buildCooperativeWithdrawalPresentation,
} from '../lib/cooperative';
import { getErrorMessage } from '../lib/apiFeedback';

export const cooperativeSections = [
  { id: 'dashboard', label: 'Cooperative Dashboard' },
  { id: 'members', label: 'Members' },
  { id: 'shares', label: 'Shares & Contributions' },
  { id: 'financing', label: 'Financing' },
  { id: 'investments', label: 'Investments' },
  { id: 'profits', label: 'Profit Distribution' },
  { id: 'withdrawals', label: 'Withdrawals' },
  { id: 'governance', label: 'Governance' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
];

const defaultSetupForm = {
  name: 'Cooperative',
  slug: '',
  description: 'Community-owned halal finance and investment operations.',
  share_price: '1000',
  minimum_member_shares: '1',
  contribution_rule: 'Monthly share purchase window with disciplined treasury allocation.',
  profit_cycle: 'monthly',
  subscription_plan_id: '',
  sharia_notes: 'No riba. Qard Hasan late penalties move to charity. Profit is recognized only from halal activity.',
  loan_settings: {
    required_guarantors: '2',
    min_shares_per_guarantor: '2',
    min_combined_guarantor_shares: '5',
    borrower_min_shares: '2',
    loan_limit_mode: 'multiplier',
    loan_limit_value: '2',
    lock_borrower_shares: true,
    lock_guarantor_shares: true,
    liability_mode: 'proportional',
    allow_admin_override: false,
    custom_liability_notes: '',
  },
  branding: {
    branding_tier: 'basic',
    logo_url: '',
    primary_color: '#6D28D9',
    secondary_color: '#0F172A',
    remove_powered_by_taska: false,
    custom_domain: '',
    custom_tagline: '',
  },
};

const defaultMemberForm = {
  customer_id: '',
  role: 'member',
  joined_at: new Date().toISOString().slice(0, 10),
  notes: '',
};

const defaultShareForm = {
  member_id: '',
  units: '',
  price_per_share: '',
  issued_at: new Date().toISOString().slice(0, 10),
  notes: '',
};

const defaultFinancingForm = {
  member_id: '',
  financing_type: 'qard_hasan',
  amount_requested: '',
  capital_amount: '',
  cooperative_capital: '',
  member_capital: '',
  profit_share_cooperative: '60',
  profit_share_member: '40',
  profit_share_ratio: '',
  business_description: '',
  duration_months: '6',
  repayment_due_date: new Date(Date.now() + (1000 * 60 * 60 * 24 * 30)).toISOString().slice(0, 10),
  guarantor_member_ids: [],
  sharia_notes: '',
};

const defaultInvestmentForm = {
  product_id: '',
  name: '',
  category: 'halal_trade',
  amount: '',
  expected_return_rate: '',
  current_value: '',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: '',
  linked_inventory: false,
  notes: '',
};

const defaultProfitForm = {
  label: '',
  cycle_start: new Date().toISOString().slice(0, 10),
  cycle_end: new Date().toISOString().slice(0, 10),
  total_profit: '',
  reserve_allocation: '',
  charity_allocation: '',
  notes: '',
};

const defaultWithdrawalForm = {
  member_id: '',
  withdrawal_type: 'profit_withdrawal',
  amount: '',
  reason: '',
};

const defaultGovernanceForm = {
  record_type: 'meeting',
  title: '',
  record_date: new Date().toISOString().slice(0, 10),
  status: 'scheduled',
  summary: '',
};

export function useCooperativeDesk() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSection = cooperativeSections.some((section) => section.id === searchParams.get('section'))
    ? searchParams.get('section')
    : 'dashboard';
  const [activeSection, setActiveSection] = useState(initialSection);
  const [setupForm, setSetupForm] = useState(defaultSetupForm);
  const [memberForm, setMemberForm] = useState(defaultMemberForm);
  const [shareForm, setShareForm] = useState(defaultShareForm);
  const [financingForm, setFinancingForm] = useState(defaultFinancingForm);
  const [investmentForm, setInvestmentForm] = useState(defaultInvestmentForm);
  const [profitForm, setProfitForm] = useState(defaultProfitForm);
  const [withdrawalForm, setWithdrawalForm] = useState(defaultWithdrawalForm);
  const [governanceForm, setGovernanceForm] = useState(defaultGovernanceForm);

  useEffect(() => {
    const requestedSection = searchParams.get('section');

    if (requestedSection && cooperativeSections.some((section) => section.id === requestedSection) && requestedSection !== activeSection) {
      queueMicrotask(() => {
        setActiveSection(requestedSection);
      });
    }
  }, [activeSection, searchParams]);

  const cooperativeDashboard = useQuery({
    queryKey: ['cooperative-dashboard'],
    queryFn: () => api.get('/cooperative/dashboard').then((response) => response.data),
    staleTime: 30000,
  });

  const customersQuery = useQuery({
    queryKey: ['cooperative-customers'],
    queryFn: () => api.get('/customers').then((response) => response.data.data || response.data || []),
    staleTime: 60000,
  });

  const plansQuery = useQuery({
    queryKey: ['cooperative-plans'],
    queryFn: () => api.get('/billing/plans').then((response) => response.data.data || response.data || []),
    staleTime: 60000,
  });

  const productsQuery = useQuery({
    queryKey: ['cooperative-products'],
    queryFn: () => api.get('/products').then((response) => response.data.data || response.data || []),
    staleTime: 60000,
  });

  const configured = cooperativeDashboard.data?.configured;

  const cooperativeQuery = useQuery({
    queryKey: ['cooperative-show'],
    queryFn: () => api.get('/cooperative').then((response) => response.data),
    enabled: Boolean(configured),
    staleTime: 30000,
  });

  const membersQuery = useQuery({
    queryKey: ['cooperative-members'],
    queryFn: () => api.get('/cooperative/members').then((response) => response.data),
    enabled: Boolean(configured),
    staleTime: 30000,
  });

  const sharesQuery = useQuery({
    queryKey: ['cooperative-shares'],
    queryFn: () => api.get('/cooperative/shares').then((response) => response.data),
    enabled: Boolean(configured),
    staleTime: 30000,
  });

  const financingQuery = useQuery({
    queryKey: ['cooperative-financing'],
    queryFn: () => api.get('/cooperative/financing').then((response) => response.data),
    enabled: Boolean(configured),
    staleTime: 30000,
  });

  const investmentsQuery = useQuery({
    queryKey: ['cooperative-investments'],
    queryFn: () => api.get('/cooperative/investments').then((response) => response.data),
    enabled: Boolean(configured),
    staleTime: 30000,
  });

  const profitCyclesQuery = useQuery({
    queryKey: ['cooperative-profit-cycles'],
    queryFn: () => api.get('/cooperative/profit-cycles').then((response) => response.data),
    enabled: Boolean(configured),
    staleTime: 30000,
  });

  const withdrawalsQuery = useQuery({
    queryKey: ['cooperative-withdrawals'],
    queryFn: () => api.get('/cooperative/withdrawals').then((response) => response.data),
    enabled: Boolean(configured),
    staleTime: 30000,
  });

  const governanceQuery = useQuery({
    queryKey: ['cooperative-governance'],
    queryFn: () => api.get('/cooperative/governance').then((response) => response.data),
    enabled: Boolean(configured),
    staleTime: 30000,
  });

  const reportsQuery = useQuery({
    queryKey: ['cooperative-reports'],
    queryFn: () => api.get('/cooperative/reports').then((response) => response.data),
    enabled: Boolean(configured),
    staleTime: 30000,
  });

  const settingsQuery = useQuery({
    queryKey: ['cooperative-settings'],
    queryFn: () => api.get('/cooperative/settings').then((response) => response.data),
    enabled: Boolean(configured),
    staleTime: 30000,
  });

  const refreshCooperative = () => {
    [
      'cooperative-dashboard',
      'cooperative-show',
      'cooperative-members',
      'cooperative-shares',
      'cooperative-financing',
      'cooperative-investments',
      'cooperative-profit-cycles',
      'cooperative-withdrawals',
      'cooperative-governance',
      'cooperative-reports',
      'cooperative-settings',
    ].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
  };

  const setupMutation = useMutation({
    mutationFn: (payload) => api.post('/cooperative/setup', payload),
    onSuccess: () => {
      refreshCooperative();
    },
  });

  const memberMutation = useMutation({
    mutationFn: (payload) => api.post('/cooperative/members', payload),
    onSuccess: () => {
      setMemberForm(defaultMemberForm);
      refreshCooperative();
    },
  });

  const shareMutation = useMutation({
    mutationFn: (payload) => api.post('/cooperative/shares/purchase', payload),
    onSuccess: () => {
      setShareForm(defaultShareForm);
      refreshCooperative();
    },
  });

  const financingMutation = useMutation({
    mutationFn: (payload) => api.post('/cooperative/financing', payload),
    onSuccess: () => {
      setFinancingForm(defaultFinancingForm);
      refreshCooperative();
    },
  });

  const approveGuarantorMutation = useMutation({
    mutationFn: ({ financingId, memberId }) => api.post(`/cooperative/financing/${financingId}/guarantors/${memberId}/approve`),
    onSuccess: refreshCooperative,
  });

  const updateFinancingStatusMutation = useMutation({
    mutationFn: ({ financingId, payload }) => api.patch(`/cooperative/financing/${financingId}/status`, payload),
    onSuccess: refreshCooperative,
  });

  const investmentMutation = useMutation({
    mutationFn: (payload) => api.post('/cooperative/investments', payload),
    onSuccess: () => {
      setInvestmentForm(defaultInvestmentForm);
      refreshCooperative();
    },
  });

  const profitCycleMutation = useMutation({
    mutationFn: (payload) => api.post('/cooperative/profit-cycles', payload),
    onSuccess: () => {
      setProfitForm(defaultProfitForm);
      refreshCooperative();
    },
  });

  const distributeProfitMutation = useMutation({
    mutationFn: (cycleId) => api.post(`/cooperative/profit-cycles/${cycleId}/distribute`),
    onSuccess: refreshCooperative,
  });

  const withdrawalMutation = useMutation({
    mutationFn: (payload) => api.post('/cooperative/withdrawals', payload),
    onSuccess: () => {
      setWithdrawalForm(defaultWithdrawalForm);
      refreshCooperative();
    },
  });

  const governanceMutation = useMutation({
    mutationFn: (payload) => api.post('/cooperative/governance', payload),
    onSuccess: () => {
      setGovernanceForm(defaultGovernanceForm);
      refreshCooperative();
    },
  });

  const members = useMemo(() => membersQuery.data || [], [membersQuery.data]);
  const cooperative = cooperativeQuery.data || settingsQuery.data?.cooperative || cooperativeDashboard.data?.cooperative;
  const dashboardSummary = cooperativeDashboard.data?.summary;
  const shareOwnership = useMemo(() => {
    return buildCooperativeShareOwnership(sharesQuery.data || []);
  }, [sharesQuery.data]);
  const shareSummary = useMemo(() => createCooperativeShareSummary({
    shareOwnership,
    entries: sharesQuery.data || [],
    sharePrice: cooperative?.share_price || 0,
  }), [cooperative?.share_price, shareOwnership, sharesQuery.data]);
  const dashboardMetrics = useMemo(() => buildCooperativeDashboardMetrics(dashboardSummary), [dashboardSummary]);
  const walletPresentations = useMemo(
    () => (cooperative?.wallets || []).map((wallet) => buildCooperativeWalletPresentation(wallet)),
    [cooperative?.wallets],
  );
  const governanceSnapshot = useMemo(() => buildCooperativeGovernanceSnapshot(cooperative), [cooperative]);
  const withdrawalPresentations = useMemo(
    () => (withdrawalsQuery.data || []).map((item) => ({ id: item.id, ...buildCooperativeWithdrawalPresentation(item) })),
    [withdrawalsQuery.data],
  );
  const governanceRecordPresentations = useMemo(
    () => (governanceQuery.data || []).map((record) => ({ id: record.id, ...buildCooperativeGovernanceRecordPresentation(record) })),
    [governanceQuery.data],
  );
  const reportCards = useMemo(() => buildCooperativeReportCards(reportsQuery.data || {}), [reportsQuery.data]);
  const memberPresentations = useMemo(
    () => members.map((member) => ({ id: member.id, ...buildCooperativeMemberPresentation(member) })),
    [members],
  );
  const investmentPresentations = useMemo(
    () => (investmentsQuery.data || []).map((investment) => ({ id: investment.id, ...buildCooperativeInvestmentPresentation(investment) })),
    [investmentsQuery.data],
  );
  const settingsSummary = useMemo(() => buildCooperativeSettingsSummary(cooperative), [cooperative]);
  const cooperativeQueries = [
    cooperativeDashboard,
    customersQuery,
    plansQuery,
    productsQuery,
    cooperativeQuery,
    membersQuery,
    sharesQuery,
    financingQuery,
    investmentsQuery,
    profitCyclesQuery,
    withdrawalsQuery,
    governanceQuery,
    reportsQuery,
    settingsQuery,
  ];
  const loadError = getErrorMessage(
    cooperativeQueries.find((query) => query.isError)?.error,
    'We could not load part of the cooperative workspace right now. Please try again.',
  );

  const submitSetup = (event) => {
    event.preventDefault();
    setupMutation.mutate({
      ...setupForm,
      share_price: Number(setupForm.share_price || 0),
      minimum_member_shares: Number(setupForm.minimum_member_shares || 1),
      subscription_plan_id: setupForm.subscription_plan_id ? Number(setupForm.subscription_plan_id) : null,
      loan_settings: {
        required_guarantors: Number(setupForm.loan_settings.required_guarantors || 0),
        min_shares_per_guarantor: Number(setupForm.loan_settings.min_shares_per_guarantor || 0),
        min_combined_guarantor_shares: Number(setupForm.loan_settings.min_combined_guarantor_shares || 0),
        borrower_min_shares: Number(setupForm.loan_settings.borrower_min_shares || 0),
        loan_limit_mode: setupForm.loan_settings.loan_limit_mode,
        loan_limit_value: Number(setupForm.loan_settings.loan_limit_value || 0),
        lock_borrower_shares: setupForm.loan_settings.lock_borrower_shares,
        lock_guarantor_shares: setupForm.loan_settings.lock_guarantor_shares,
        liability_mode: setupForm.loan_settings.liability_mode,
        allow_admin_override: setupForm.loan_settings.allow_admin_override,
        custom_liability_notes: setupForm.loan_settings.custom_liability_notes,
      },
      branding: setupForm.branding,
    });
  };

  return {
    queryClient,
    searchParams,
    setSearchParams,
    activeSection,
    setActiveSection,
    setupForm,
    setSetupForm,
    memberForm,
    setMemberForm,
    shareForm,
    setShareForm,
    financingForm,
    setFinancingForm,
    investmentForm,
    setInvestmentForm,
    profitForm,
    setProfitForm,
    withdrawalForm,
    setWithdrawalForm,
    governanceForm,
    setGovernanceForm,
    cooperativeDashboard,
    customersQuery,
    plansQuery,
    productsQuery,
    configured,
    cooperativeQuery,
    membersQuery,
    sharesQuery,
    financingQuery,
    investmentsQuery,
    profitCyclesQuery,
    withdrawalsQuery,
    governanceQuery,
    reportsQuery,
    settingsQuery,
    refreshCooperative,
    setupMutation,
    memberMutation,
    shareMutation,
    financingMutation,
    approveGuarantorMutation,
    updateFinancingStatusMutation,
    investmentMutation,
    profitCycleMutation,
    distributeProfitMutation,
    withdrawalMutation,
    governanceMutation,
    members,
    cooperative,
    dashboardSummary,
    shareOwnership,
    shareSummary,
    dashboardMetrics,
    walletPresentations,
    governanceSnapshot,
    withdrawalPresentations,
    governanceRecordPresentations,
    reportCards,
    memberPresentations,
    investmentPresentations,
    settingsSummary,
    cooperativeQueries,
    loadError,
    submitSetup,
  };
}
