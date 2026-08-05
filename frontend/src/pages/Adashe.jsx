import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Button from '../components/Button';
import Card, { CardHeader } from '../components/Card';
import EmptyState from '../components/EmptyState';
import { FinanceFormError, FinanceFormHint, FinanceReasonBadge } from '../components/FinanceFormFeedback';
import FinanceLensSummary from '../components/FinanceLensSummary';
import FinanceMobileShortcutRail from '../components/FinanceMobileShortcutRail';
import FinanceInputField from '../components/FinanceInputField';
import FinanceRecommendationCard from '../components/FinanceRecommendationCard';
import FinanceRecommendationInline from '../components/FinanceRecommendationInline';
import FinanceSelectionBanner from '../components/FinanceSelectionBanner';
import { FinanceInfoCard, FinanceLoadingState, FinanceUnavailableState } from '../components/FinanceStatePanel';
import LedgerFilterBar from '../components/LedgerFilterBar';
import OpsMetricCard from '../components/OpsMetricCard';
import { PageShell, ResponsiveCardGrid } from '../components/PageShell';
import PageHero from '../components/PageHero';
import ResultsPagination from '../components/ResultsPagination';
import StatementPanel from '../components/StatementPanel';
import Toast from '../components/Toast';
import { useActiveFinanceSection } from '../hooks/useActiveFinanceSection';
import { computeLedgerPagination, useLedgerControls } from '../hooks/useLedgerControls';
import { useStatementData } from '../hooks/useStatementData';
import { useStatementFilters } from '../hooks/useStatementFilters';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/apiFeedback';
import {
  getAdasheLedgerPreviewLabel,
  getAdashePrimaryActionLabel,
  getAdasheSuggestedAmount,
  getRecommendedAdasheActionMode,
  runAdashePrimaryAction,
} from '../lib/financeActionRouting';
import { buildDateField, buildNumberField, buildSelectField, buildTextField } from '../lib/financeFieldBuilders';
import {
  buildAdasheLedgerLensItems,
  buildAdasheStatementPanelSummaryItems,
  buildAdasheStatementPrintSummary,
  createAdasheStatementSummary,
  getAdasheStatementEntryMeta,
  getAdasheStatementEntryTitle,
  mapAdasheStatementExportRow,
  mapAdasheStatementPanelEntries,
  sortAdasheAccounts,
} from '../lib/adashe';
import { buildFinanceFieldProps } from '../lib/financeFieldProps';
import { formatCurrencyNGN, formatShortDate } from '../lib/financeFormatters';
import { getAdasheRecommendationPresentation } from '../lib/financeRecommendationPresenter';
import { getFinanceQueryValue } from '../lib/financePageQuery';
import { scrollToFinanceRef } from '../lib/financeScroll';
import { exportStatementCsv, printStatement } from '../lib/statementReports';

const defaultCreateForm = {
  customer_id: '',
  cycle_name: '',
  limit: '',
  installment_amount: '',
  contribution_frequency_days: '7',
  next_due_date: new Date().toISOString().slice(0, 10),
};

const defaultActionForm = {
  amount: '',
  reference: '',
};

const adasheViews = [
  { id: 'all', label: 'All cycles' },
  { id: 'due_now', label: 'Due now' },
  { id: 'collecting', label: 'Collecting' },
  { id: 'funded', label: 'Funded' },
  { id: 'paid_out', label: 'Paid out' },
];

const adasheSortOptions = [
  { id: 'priority', label: 'Priority', description: 'Ranks cycles by recommendation risk, due-now urgency, and the nearest collection date.' },
  { id: 'newest', label: 'Newest', description: 'Shows the most recently opened cycle accounts first.' },
  { id: 'largest_target', label: 'Largest target', description: 'Brings the biggest cycle commitments to the top.' },
  { id: 'largest_balance', label: 'Largest balance', description: 'Shows cycles holding the most collected money first.' },
];

const statementViews = [
  { id: 'all', label: 'All activity' },
  { id: 'draw', label: 'Collections' },
  { id: 'repayment', label: 'Payouts' },
];

const statementDatePresets = [
  { id: 'all', label: 'All time' },
  { id: 'month', label: 'This month' },
  { id: 'last30', label: 'Last 30 days' },
];

const statementViewLabels = {
  all: 'All activity',
  draw: 'Collections',
  repayment: 'Payouts',
};

function QueryErrorPanel({ message, onRetry }) {
  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-4 py-2 font-semibold text-white transition hover:bg-rose-500"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default function Adashe() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const ledgerRef = useRef(null);
  const collectionDeskRef = useRef(null);
  const statementRef = useRef(null);
  const [createForm, setCreateForm] = useState(defaultCreateForm);
  const [actionMode, setActionMode] = useState('collect');
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [actionForm, setActionForm] = useState(defaultActionForm);
  const [actionAutoFillHint, setActionAutoFillHint] = useState(null);
  const { toast, setToast } = useToast();
  const {
    statementView,
    setStatementView,
    statementDatePreset,
    statementDateRange,
    showAllStatement,
    setShowAllStatement,
    handleStatementPresetChange,
    handleStatementDateChange,
    resetStatementFilters,
    filtersAreActive,
  } = useStatementFilters({
    storageKeyPrefix: 'taska-adashe-statement',
    resetKey: selectedAccountId,
  });

  const requestedView = getFinanceQueryValue(
    searchParams,
    'view',
    adasheViews.map((view) => view.id),
  );
  const requestedSort = getFinanceQueryValue(
    searchParams,
    'sort',
    adasheSortOptions.map((sort) => sort.id),
  );
  const {
    accountsPage,
    setAccountsPage,
    searchTerm,
    setSearchTerm,
    activeView,
    setActiveView,
    activeSort,
    setActiveSort,
    deferredSearchTerm,
    hasSearch,
  } = useLedgerControls({
    storageKeyPrefix: 'taska-adashe',
    requestedView,
    requestedSort,
  });

  const accountsQuery = useQuery({
    queryKey: ['adashe-accounts', accountsPage, deferredSearchTerm, activeView],
    queryFn: () => api.get('/trust-accounts', {
      params: {
        type: 'contribution',
        page: accountsPage,
        search: deferredSearchTerm || undefined,
        view: activeView === 'all' ? undefined : activeView,
      },
    }).then((response) => response.data),
    staleTime: 30000,
    keepPreviousData: true,
  });

  const customersQuery = useQuery({
    queryKey: ['adashe-customers'],
    queryFn: () => api.get('/customers').then((response) => response.data),
    staleTime: 30000,
  });

  const {
    data: statementResponse,
    isFetching: statementLoading,
    isError: statementFailed,
    error: statementError,
  } = useQuery({
    queryKey: ['adashe-statement', selectedAccountId],
    enabled: Boolean(selectedAccountId),
    queryFn: () => api.get(`/trust-accounts/${selectedAccountId}`).then((response) => response.data),
    staleTime: 15000,
  });

  const insightsQuery = useQuery({
    queryKey: ['adashe-ai-watch'],
    queryFn: () => api.get('/ai/insights').then((response) => response.data),
    staleTime: 30000,
  });
  const accountsResponse = accountsQuery.data;
  const isLoading = accountsQuery.isLoading;
  const accountsFetching = accountsQuery.isFetching;
  const accountsFailed = accountsQuery.isError;
  const accountsError = accountsQuery.error;
  const customersResponse = customersQuery.data;
  const customersFailed = customersQuery.isError;
  const customersError = customersQuery.error;
  const insightResponse = insightsQuery.data;
  const insightsFailed = insightsQuery.isError;
  const adasheDeskQueries = [accountsQuery, customersQuery, insightsQuery];
  const adasheDeskError = getErrorMessage(
    adasheDeskQueries.find((query) => query.isError)?.error,
    'We could not load part of the adashe workspace right now. Please try again.',
  );

  const accounts = useMemo(() => accountsResponse?.data ?? [], [accountsResponse]);
  const accountsSummary = accountsResponse?.summary ?? null;
  const pagination = useMemo(
    () => computeLedgerPagination({ response: accountsResponse, itemCount: accounts.length }),
    [accountsResponse, accounts.length]
  );
  const customers = customersResponse?.data ?? customersResponse ?? [];
  const orderedAccounts = useMemo(() => sortAdasheAccounts(accounts, activeSort), [accounts, activeSort]);
  const selectedAccount = orderedAccounts.find((account) => account.id === selectedAccountId) ?? orderedAccounts[0] ?? null;
  const activeViewLabel = adasheViews.find((view) => view.id === activeView)?.label ?? 'All cycles';
  const activeSortLabel = adasheSortOptions.find((option) => option.id === activeSort)?.label ?? 'Priority';
  const activeSortDescription = adasheSortOptions.find((option) => option.id === activeSort)?.description
    ?? 'Ranks cycles by recommendation risk, due-now urgency, and the nearest collection date.';
  const searchScopeSummary = hasSearch ? `Matches for "${deferredSearchTerm}"` : 'All member cycles';
  const scrollToLedger = () => scrollToFinanceRef(ledgerRef);
  const scrollToCollectionDesk = () => scrollToFinanceRef(collectionDeskRef);
  const scrollToStatement = () => scrollToFinanceRef(statementRef);
  const applyActionMode = (nextActionMode) => {
    setActionMode(nextActionMode);

    if (!selectedAccount) {
      return;
    }

    const suggestedAmount = getAdasheSuggestedAmount(selectedAccount, nextActionMode);
    setActionForm((current) => ({
      ...current,
      amount: suggestedAmount > 0 ? String(suggestedAmount) : '',
    }));
    setActionAutoFillHint(suggestedAmount > 0
      ? `Amount preloaded from the current recommendation: ${formatCurrencyNGN(suggestedAmount)}.`
      : null);
  };
  const openCurrentDeskAction = () => runAdashePrimaryAction(actionMode, {
    openCollect: () => {
      applyActionMode('collect');
      scrollToCollectionDesk();
    },
    openPayout: () => {
      applyActionMode('payout');
      scrollToCollectionDesk();
    },
  });
  const activeRailAction = useActiveFinanceSection({
    initialLabel: 'Ledger',
    sections: [
      { label: 'Ledger', ref: ledgerRef },
      { label: 'Desk', ref: collectionDeskRef },
      { label: 'Statement', ref: statementRef },
    ],
  });
  const ledgerLensItems = useMemo(() => {
    const openDeskAction = (nextActionMode) => {
      setActionMode(nextActionMode);

      if (!selectedAccount) {
        return;
      }

      const suggestedAmount = getAdasheSuggestedAmount(selectedAccount, nextActionMode);
      setActionForm((current) => ({
        ...current,
        amount: suggestedAmount > 0 ? String(suggestedAmount) : '',
      }));
      setActionAutoFillHint(suggestedAmount > 0
        ? `Amount preloaded from the current recommendation: ${formatCurrencyNGN(suggestedAmount)}.`
        : null);
      scrollToFinanceRef(collectionDeskRef);
    };

    const ledgerFocusActions = selectedAccount
      ? [
        {
          label: getAdashePrimaryActionLabel(actionMode),
          onClick: () => runAdashePrimaryAction(actionMode, {
            openCollect: () => {
              openDeskAction('collect');
            },
            openPayout: () => {
              openDeskAction('payout');
            },
          }),
          active: activeRailAction === 'Desk',
        },
        {
          label: 'Go to statement',
          onClick: () => scrollToFinanceRef(statementRef),
          active: activeRailAction === 'Statement',
        },
      ]
      : [];

    const items = buildAdasheLedgerLensItems({
      pagination,
      activeViewLabel,
      activeSortLabel,
      activeSortDescription,
      searchScopeSummary,
      selectedAccount,
    });

    return items.map((item, index) => (
      index === items.length - 1
        ? { ...item, actions: ledgerFocusActions }
        : item
    ));
  }, [
    pagination,
    activeViewLabel,
    activeSortLabel,
    activeSortDescription,
    searchScopeSummary,
    selectedAccount,
    actionMode,
    activeRailAction,
  ]);
  const statement = statementResponse?.transactions ?? [];
  const selectedStatementAccount = statementResponse?.account ?? selectedAccount;
  const adasheInsights = (insightResponse ?? []).filter((insight) => String(insight.type).startsWith('adashe_'));
  const {
    statementCounts,
    filteredStatement,
    statementSummary,
    statementExportRows,
    statementDateSummary,
  } = useStatementData({
    transactions: statement,
    statementView,
    statementDateRange,
    createSummary: createAdasheStatementSummary,
    mapExportRow: mapAdasheStatementExportRow,
  });
  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      queueMicrotask(() => {
        setSelectedAccountId(accounts[0].id);
      });
    }
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    if (selectedAccountId && accounts.length > 0 && !accounts.some((account) => account.id === selectedAccountId)) {
      queueMicrotask(() => {
        setSelectedAccountId(accounts[0].id);
      });
    }
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    if (!selectedAccount) {
      return;
    }

    const recommendedActionMode = getRecommendedAdasheActionMode(selectedAccount);
    const suggestedAmount = getAdasheSuggestedAmount(selectedAccount, recommendedActionMode);

    queueMicrotask(() => {
      setActionMode(recommendedActionMode);
      setActionForm({
        amount: suggestedAmount > 0 ? String(suggestedAmount) : '',
        reference: '',
      });
      setActionAutoFillHint(suggestedAmount > 0
        ? `Amount preloaded from the current recommendation: ${formatCurrencyNGN(suggestedAmount)}.`
        : null);
    });
  }, [selectedAccount]);

  const statementNavigationActions = [
    {
      label: 'Back to ledger',
      onClick: scrollToLedger,
      active: activeRailAction === 'Ledger',
    },
    {
      label: 'Jump to desk',
      onClick: openCurrentDeskAction,
      active: activeRailAction === 'Desk',
    },
  ];
  const mobileRailActions = [
    {
      label: 'Ledger',
      onClick: scrollToLedger,
    },
    {
      label: getAdashePrimaryActionLabel(actionMode, 'compact'),
      onClick: openCurrentDeskAction,
    },
    {
      label: 'Statement',
      onClick: scrollToStatement,
    },
  ];

  const refreshAccounts = () => {
    queryClient.invalidateQueries({ queryKey: ['adashe-accounts'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    if (selectedAccountId) {
      queryClient.invalidateQueries({ queryKey: ['adashe-statement', selectedAccountId] });
    }
  };

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/trust-accounts', payload),
    onSuccess: (response) => {
      const createdId = response.data?.id ?? null;
      const memberName = response.data?.customer?.name || 'member';
      setCreateForm(defaultCreateForm);
      setToast({
        tone: 'success',
        message: `Adashe cycle opened for ${memberName}.`,
      });
      refreshAccounts();
      if (createdId) {
        setSelectedAccountId(createdId);
      }
    },
  });

  const collectMutation = useMutation({
    mutationFn: ({ accountId, payload }) => api.post(`/trust-accounts/${accountId}/draw`, payload),
    onSuccess: (response, variables) => {
      const memberName = response.data?.customer?.name || selectedAccount?.customer?.name || 'member';
      setActionForm(defaultActionForm);
      setToast({
        tone: 'success',
        message: `${formatCurrencyNGN(variables.payload.amount)} collected for ${memberName}.`,
      });
      refreshAccounts();
    },
  });

  const payoutMutation = useMutation({
    mutationFn: ({ accountId, payload }) => api.post(`/trust-accounts/${accountId}/repay`, payload),
    onSuccess: (response, variables) => {
      const memberName = response.data?.customer?.name || selectedAccount?.customer?.name || 'member';
      setActionForm(defaultActionForm);
      setToast({
        tone: 'success',
        message: `${formatCurrencyNGN(variables.payload.amount)} paid out for ${memberName}.`,
      });
      refreshAccounts();
    },
  });

  const pageSummary = useMemo(() => {
    return accounts.reduce((totals, account) => {
      const target = Number(account.limit || 0);
      const collected = Number(account.balance || 0);
      const paidOut = Number(account.total_repaid || 0);
      const nextDueDate = account.next_due_date ? new Date(account.next_due_date) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      totals.totalTarget += target;
      totals.totalCollected += collected;
      totals.totalPaidOut += paidOut;
      totals.memberCount += 1;
      if (collected > 0) {
        totals.activeCycles += 1;
      }
      if (nextDueDate && nextDueDate <= today && collected < target) {
        totals.dueNow += 1;
      }

      return totals;
    }, {
      totalTarget: 0,
      totalCollected: 0,
      totalPaidOut: 0,
      memberCount: 0,
      activeCycles: 0,
      dueNow: 0,
    });
  }, [accounts]);

  const summary = useMemo(() => ({
    totalTarget: Number(accountsSummary?.total_target ?? pageSummary.totalTarget),
    totalCollected: Number(accountsSummary?.total_collected ?? pageSummary.totalCollected),
    totalPaidOut: Number(accountsSummary?.total_paid_out ?? pageSummary.totalPaidOut),
    memberCount: Number(accountsSummary?.member_accounts ?? pageSummary.memberCount),
    activeCycles: Number(accountsSummary?.active_cycles ?? pageSummary.activeCycles),
    dueNow: Number(accountsSummary?.due_now ?? pageSummary.dueNow),
  }), [accountsSummary, pageSummary]);

  const completionRate = summary.totalTarget > 0
    ? Math.min(100, (summary.totalCollected / summary.totalTarget) * 100)
    : 0;
  const actionBusy = collectMutation.isPending || payoutMutation.isPending;
  const createErrorMessageText = createMutation.isError
    ? getErrorMessage(createMutation.error, 'Unable to create the adashe cycle right now.')
    : null;
  const actionErrorMessageText = collectMutation.isError
    ? getErrorMessage(collectMutation.error, 'Unable to save this contribution right now.')
    : payoutMutation.isError
      ? getErrorMessage(payoutMutation.error, 'Unable to save this payout right now.')
      : null;
  const selectedTarget = Number(selectedAccount?.limit || 0);
  const selectedCollected = Number(selectedAccount?.balance || 0);
  const selectedInstallment = Number(selectedAccount?.installment_amount || 0);
  const selectedPaidOut = Number(selectedAccount?.total_repaid || 0);
  const selectedRemaining = Math.max(0, selectedTarget - selectedCollected);
  const selectedProgress = selectedTarget > 0
    ? Math.min(100, (selectedCollected / selectedTarget) * 100)
    : 0;
  const accountRecommendation = selectedAccount?.recommendation ?? null;
  const actionAmountValue = Number(actionForm.amount || 0);
  const actionAmountEntered = String(actionForm.amount).trim() !== '';
  const actionLimit = actionMode === 'collect' ? selectedRemaining : selectedCollected;
  const recommendedCollectAmount = selectedInstallment > 0 && selectedInstallment <= selectedRemaining
    ? selectedInstallment
    : selectedRemaining;
  const recommendedPayoutAmount = selectedCollected;
  const actionRecommendationTone = actionMode === 'collect' && accountRecommendation?.tone
    ? accountRecommendation.tone
    : actionMode === 'collect'
    ? selectedRemaining <= 0
      ? 'emerald'
      : 'violet'
    : selectedCollected <= 0
      ? 'amber'
      : 'violet';
  const actionRecommendation = actionMode === 'collect' && accountRecommendation?.message
    ? accountRecommendation.message
    : actionMode === 'collect'
    ? selectedRemaining <= 0
      ? 'Best next step: this cycle has reached its target, so no further collection is needed right now.'
      : recommendedCollectAmount === selectedInstallment && selectedInstallment > 0
        ? `Best next step: collect the regular installment of ${formatCurrencyNGN(selectedInstallment)} to stay on schedule.`
        : `Best next step: collect the exact remaining amount of ${formatCurrencyNGN(selectedRemaining)} to complete this cycle.`
    : selectedCollected <= 0
      ? 'Best next step: wait for more collections before recording a payout from this cycle.'
      : `Best next step: the cycle can safely pay out up to ${formatCurrencyNGN(recommendedPayoutAmount)} right now.`;
  const actionRecommendationWhy = actionMode === 'collect'
    ? accountRecommendation?.why
    : selectedCollected <= 0
      ? 'This cycle does not have enough collected balance yet to support a payout.'
      : 'Payouts should stay within the balance that has already been collected into this cycle.';
  const actionRecommendationRiskLevel = actionMode === 'collect'
    ? accountRecommendation?.risk_level
    : selectedCollected <= 0
      ? 'medium'
      : 'low';
  const actionRecommendationNextReviewDate = actionMode === 'collect'
    ? accountRecommendation?.next_review_date
    : selectedAccount?.next_due_date ?? null;
  const actionAutoFillPresentation = actionAutoFillHint && selectedAccount
    ? getAdasheRecommendationPresentation(selectedAccount, actionMode)
    : null;
  const installmentShortcutPresentation = selectedAccount
    ? getAdasheRecommendationPresentation(selectedAccount, 'collect')
    : null;
  const collectRemainingShortcutBadge = {
    label: 'Target completion',
    tone: 'sky',
  };
  const payoutShortcutPresentation = selectedAccount
    ? getAdasheRecommendationPresentation(selectedAccount, 'payout')
    : null;
  const actionValidationMessage = !selectedAccount
    ? 'Select a member cycle to continue.'
    : !actionAmountEntered
      ? null
      : Number.isNaN(actionAmountValue) || actionAmountValue <= 0
        ? 'Enter an amount greater than zero.'
        : actionAmountValue > actionLimit
          ? actionMode === 'collect'
            ? `This collection exceeds the remaining cycle target of ${formatCurrencyNGN(selectedRemaining)}.`
            : `This payout exceeds the collected balance of ${formatCurrencyNGN(selectedCollected)}.`
          : null;
  const actionPositiveMessage = selectedAccount && actionAmountEntered && !actionValidationMessage
    ? actionMode === 'collect'
      ? `Within range. You can save up to ${formatCurrencyNGN(selectedRemaining)} for this collection.`
      : `Within range. You can pay out up to ${formatCurrencyNGN(selectedCollected)} from this cycle.`
    : null;
  const actionSubmitDisabled = actionBusy || !selectedAccount || Boolean(actionValidationMessage);
  const memberField = buildFinanceFieldProps('adashe-member', {
    errorId: customersFailed ? 'adashe-member-error' : null,
    inputProps: { 'data-autofocus': 'true' },
  });
  const cycleNameField = buildFinanceFieldProps('adashe-cycle-name');
  const limitField = buildFinanceFieldProps('adashe-limit');
  const installmentField = buildFinanceFieldProps('adashe-installment');
  const cadenceField = buildFinanceFieldProps('adashe-cadence');
  const firstDueDateField = buildFinanceFieldProps('adashe-first-due-date');
  const actionAmountField = buildFinanceFieldProps('adashe-action-amount', {
    inputProps: { 'data-autofocus': 'true' },
  });
  const referenceField = buildFinanceFieldProps('adashe-reference');
  const createFundingFields = [
    buildNumberField({
      key: 'limit',
      fieldProps: limitField,
      label: 'Cycle target amount',
      hint: 'The full amount the member is expected to complete.',
      min: '0',
      step: '0.01',
      value: createForm.limit,
      onChange: (event) => setCreateForm((current) => ({ ...current, limit: event.target.value })),
      placeholder: '0.00',
      required: true,
    }),
    buildNumberField({
      key: 'installment_amount',
      fieldProps: installmentField,
      label: 'Expected installment',
      hint: 'Use the regular amount collectors should ask for each visit.',
      min: '0',
      step: '0.01',
      value: createForm.installment_amount,
      onChange: (event) => setCreateForm((current) => ({ ...current, installment_amount: event.target.value })),
      placeholder: '0.00',
    }),
  ];
  const scheduleFields = [
    buildNumberField({
      key: 'contribution_frequency_days',
      fieldProps: cadenceField,
      label: 'Cadence in days',
      hint: 'How often the next collection becomes due.',
      min: '1',
      max: '365',
      value: createForm.contribution_frequency_days,
      onChange: (event) => setCreateForm((current) => ({ ...current, contribution_frequency_days: event.target.value })),
      placeholder: '7',
    }),
    buildDateField({
      key: 'next_due_date',
      fieldProps: firstDueDateField,
      label: 'First due date',
      hint: 'Start the collection schedule from this date.',
      value: createForm.next_due_date,
      onChange: (event) => setCreateForm((current) => ({ ...current, next_due_date: event.target.value })),
    }),
  ];
  const actionFields = [
    buildNumberField({
      key: 'amount',
      fieldProps: actionAmountField,
      label: actionMode === 'collect' ? 'Contribution amount' : 'Payout amount',
      hint: actionMode === 'collect'
        ? `Record what was actually collected from the member now. You can collect up to ${formatCurrencyNGN(selectedRemaining)} on this cycle.`
        : `Record only what should be released from the collected cycle balance. You can pay out up to ${formatCurrencyNGN(selectedCollected)} right now.`,
      min: '0',
      step: '0.01',
      value: actionForm.amount,
      onChange: (event) => {
        setActionAutoFillHint(null);
        setActionForm((current) => ({ ...current, amount: event.target.value }));
      },
      className: 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm',
      invalid: Boolean(actionValidationMessage),
      invalidClassName: 'border-amber-300 bg-amber-50 text-amber-900 ring-2 ring-amber-100',
      placeholder: '0.00',
      required: true,
    }),
    buildTextField({
      key: 'reference',
      fieldProps: referenceField,
      label: 'Reference or narration',
      hint: 'Add who collected it, payout reason, or any short audit note.',
      value: actionForm.reference,
      onChange: (event) => setActionForm((current) => ({ ...current, reference: event.target.value })),
      className: 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm',
      placeholder: 'Collector note or payout reason',
    }),
  ];
  const memberFieldConfig = buildSelectField({
    key: 'customer_id',
    fieldProps: memberField,
    label: 'Member',
    hint: 'Choose who will contribute into this cycle.',
    required: true,
    disabled: customersFailed,
    value: createForm.customer_id,
    onChange: (event) => setCreateForm((current) => ({ ...current, customer_id: event.target.value })),
    options: [
      { value: '', label: 'Select member' },
      ...customers.map((customer) => ({ value: customer.id, label: customer.name })),
    ],
  });
  const cycleNameFieldConfig = buildTextField({
    key: 'cycle_name',
    fieldProps: cycleNameField,
    label: 'Cycle name',
    hint: 'Give the group or collection round a recognizable name.',
    value: createForm.cycle_name,
    onChange: (event) => setCreateForm((current) => ({ ...current, cycle_name: event.target.value })),
    placeholder: 'Friday women traders pot',
  });

  const handleCreate = (event) => {
    event.preventDefault();
    createMutation.mutate({
      customer_id: Number(createForm.customer_id),
      account_type: 'contribution',
      cycle_name: createForm.cycle_name || null,
      limit: Number(createForm.limit || 0),
      installment_amount: Number(createForm.installment_amount || 0),
      contribution_frequency_days: Number(createForm.contribution_frequency_days || 0),
      next_due_date: createForm.next_due_date || null,
    });
  };

  const handleAction = (event) => {
    event.preventDefault();
    if (!selectedAccount) {
      return;
    }

    const payload = {
      amount: Number(actionForm.amount || 0),
      reference: actionForm.reference || null,
    };

    if (actionMode === 'collect') {
      collectMutation.mutate({ accountId: selectedAccount.id, payload });
      return;
    }

    payoutMutation.mutate({ accountId: selectedAccount.id, payload });
  };

  const handleExportStatement = () => {
    if (!selectedStatementAccount || statementExportRows.length === 0) {
      return;
    }

    exportStatementCsv({
      filePrefix: 'adashe-statement',
      accountName: selectedStatementAccount.customer?.name,
      fallbackName: 'member',
      rows: statementExportRows,
    });
  };

  const handlePrintStatement = () => {
    if (!selectedStatementAccount || statementExportRows.length === 0) {
      return;
    }

    printStatement({
      title: 'Adashe Statement',
      subtitle: `${selectedStatementAccount.customer?.name || 'Member'} contribution history`,
      summary: buildAdasheStatementPrintSummary(statementSummary),
      rows: statementExportRows,
    });
  };

  return (
    <PageShell width="wide" className="page-stack pb-28 md:pb-5">
      {adasheDeskQueries.some((query) => query.isError) ? (
        <QueryErrorPanel
          message={adasheDeskError}
          onRetry={() => {
            adasheDeskQueries.forEach((query) => query.refetch());
          }}
        />
      ) : null}

      <PageHero
        eyebrow="Community finance"
        title="Adashe"
        description="Run rotating savings and contribution cycles with clear member balances, payout tracking, and a simple daily collection desk."
      />

      <ResponsiveCardGrid variant="metrics">
        <OpsMetricCard
          label="Target Pot"
          value={formatCurrencyNGN(summary.totalTarget)}
          helper={`${summary.memberCount} member account${summary.memberCount === 1 ? '' : 's'}`}
          tone="violet"
        />
        <OpsMetricCard
          label="Collected"
          value={formatCurrencyNGN(summary.totalCollected)}
          helper={`${completionRate.toFixed(1)}% of target cycle funded`}
          tone="emerald"
        />
        <OpsMetricCard
          label="Paid Out"
          value={formatCurrencyNGN(summary.totalPaidOut)}
          helper="Recorded payouts across active cycles"
          tone="amber"
        />
        <OpsMetricCard
          label="Due Now"
          value={summary.dueNow}
          helper={`${summary.activeCycles} active cycles in collection`}
          tone="sky"
        />
      </ResponsiveCardGrid>

      {adasheInsights.length > 0 ? (
        <Card className="border-violet-200 bg-violet-50/55">
          <CardHeader
            title="Adashe AI watch"
            subtitle="Early warnings on collection discipline and payout-cycle pressure"
          />
            <div className="grid gap-4 xl:grid-cols-2">
              {adasheInsights.map((insight) => (
                <div key={insight.id} className="rounded-2xl border border-violet-200/70 bg-white/75 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{insight.title}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    insight.severity === 'warning'
                      ? 'bg-amber-100 text-amber-700'
                      : insight.severity === 'critical'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-sky-100 text-sky-700'
                    }`}>
                      {insight.severity}
                    </span>
                  </div>
                  <details className="mt-2 sm:hidden">
                    <summary className="cursor-pointer list-none text-sm font-medium text-violet-700 marker:hidden">
                      Insight details
                    </summary>
                    <div className="mt-2 space-y-3">
                      <p className="text-sm leading-6 text-slate-600">{insight.description}</p>
                      {insight.recommendation ? (
                        <p className="text-sm font-medium text-violet-700">{insight.recommendation}</p>
                      ) : null}
                    </div>
                  </details>
                  <div className="mt-2 hidden space-y-3 sm:block">
                    <p className="text-sm leading-6 text-slate-600">{insight.description}</p>
                    {insight.recommendation ? (
                      <p className="text-sm font-medium text-violet-700">{insight.recommendation}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
        </Card>
      ) : insightsFailed ? (
        <FinanceInfoCard
          title="Adashe AI watch"
          subtitle="Insight feed is temporarily unavailable, but collections and payouts can continue."
        />
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <div ref={ledgerRef}>
        <Card>
          <CardHeader
            title="Member contribution ledger"
            subtitle="Each member has a target pot, live collected balance, and payout history"
          />
          <LedgerFilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search members, phones, or cycle names"
            views={adasheViews}
            activeView={activeView}
            onViewChange={setActiveView}
            sortOptions={adasheSortOptions}
            activeSort={activeSort}
            onSortChange={setActiveSort}
            accent="violet"
            className="mb-4 px-1"
          />
          <FinanceLensSummary items={ledgerLensItems} className="mb-4" />

            {isLoading ? (
              <FinanceLoadingState message="Loading member cycles and balances..." />
            ) : accountsFailed ? (
              <FinanceUnavailableState
                title="Adashe ledger is unavailable"
              description={getErrorMessage(accountsError, 'We could not load member cycles right now. Refresh and try again.')}
            />
          ) : accounts.length > 0 ? (
              <div className="space-y-4" role="list" aria-label="Member contribution cycles">
                {orderedAccounts.map((account) => {
                  const target = Number(account.limit || 0);
                  const collected = Number(account.balance || 0);
                  const paidOut = Number(account.total_repaid || 0);
                  const remaining = Math.max(0, target - collected);
                  const progress = target > 0 ? Math.min(100, (collected / target) * 100) : 0;
                  const isSelected = selectedAccount?.id === account.id;
                  const recommendation = account.recommendation ?? null;
                  const recommendationPresentation = getAdasheRecommendationPresentation(
                    account,
                    recommendation?.action === 'cycle_funded' ? 'payout' : 'collect',
                  );
                  const dueNow = account.next_due_date
                    ? new Date(account.next_due_date).setHours(0, 0, 0, 0) <= new Date().setHours(0, 0, 0, 0) && remaining > 0
                    : false;
                  const previewLabel = getAdasheLedgerPreviewLabel(account, formatCurrencyNGN);
                  const dueLabel = account.next_due_date ? formatShortDate(account.next_due_date, 'No activity yet') : 'No due date';
                  const statusTone = progress >= 100 ? 'bg-emerald-100 text-emerald-700' : remaining > 0 ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-700';
                  const statusLabel = progress >= 100 ? 'Fully funded' : remaining > 0 ? 'Still collecting' : 'No target set';

                  return (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => setSelectedAccountId(account.id)}
                      role="listitem"
                      aria-pressed={isSelected}
                      aria-label={`Select ${account.customer?.name ?? 'member'} cycle ${account.cycle_name || 'Contribution cycle'}`}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? 'border-violet-300 bg-[linear-gradient(135deg,rgba(124,58,237,0.10),rgba(6,182,212,0.06))] shadow-sm'
                          : dueNow
                            ? 'border-amber-300 bg-[linear-gradient(135deg,rgba(251,191,36,0.14),rgba(245,158,11,0.06))] hover:border-amber-400 hover:bg-white'
                            : 'border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-white'
                      } focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-slate-900">{account.customer?.name ?? 'Member'}</p>
                            <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${statusTone}`}>
                              {statusLabel}
                            </span>
                            {dueNow ? (
                              <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-800">
                                Due now
                              </span>
                            ) : null}
                            {recommendation?.risk_level ? (
                              <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                                recommendation.risk_level === 'high'
                                  ? 'bg-rose-100 text-rose-700'
                                  : recommendation.risk_level === 'medium'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {recommendation.risk_level === 'high'
                                  ? 'High urgency'
                                  : recommendation.risk_level === 'medium'
                                    ? 'Needs attention'
                                    : 'Low risk'}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm font-medium text-violet-700">{account.cycle_name || 'Contribution cycle'}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            Last activity {formatShortDate(account.last_payment_date || account.updated_at, 'No activity yet')}
                          </p>
                          <FinanceRecommendationInline
                            recommendation={recommendation}
                            defaultTone="violet"
                            summaryLabel={recommendationPresentation.summaryLabel}
                            summaryTone={recommendationPresentation.summaryTone}
                            className="mt-3"
                          />
                          {isSelected ? (
                          <span className="mt-3 inline-flex rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
                            Selected cycle
                          </span>
                        ) : null}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm lg:min-w-[280px]">
                        <div>
                          <p className="text-slate-500">Target</p>
                          <p className="mt-1 font-semibold text-slate-900">{formatCurrencyNGN(target)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Collected</p>
                          <p className="mt-1 font-semibold text-emerald-700">{formatCurrencyNGN(collected)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Paid out</p>
                          <p className="mt-1 font-semibold text-amber-700">{formatCurrencyNGN(paidOut)}</p>
                        </div>
                          <div>
                            <p className="text-slate-500">Remaining</p>
                            <p className="mt-1 font-semibold text-slate-900">{formatCurrencyNGN(remaining)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Next due</p>
                            <p className="mt-1 font-semibold text-slate-900">{dueLabel}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Installment</p>
                            <p className="mt-1 font-semibold text-slate-900">{formatCurrencyNGN(account.installment_amount)}</p>
                          </div>
                      </div>
                    </div>

                      <div className="mt-4">
                        <div className="h-2 w-full rounded-full bg-slate-200">
                          <div
                            className="h-2 rounded-full bg-[linear-gradient(90deg,#7C3AED,#06B6D4)]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="mt-3 inline-flex rounded-full border border-violet-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-violet-700">
                          {previewLabel}
                        </div>
                        <div className="mt-2 flex flex-col gap-2 text-xs font-medium text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                          <p>{progress.toFixed(1)}% funded this cycle</p>
                          <p className={isSelected ? 'text-violet-700' : 'text-slate-500'}>
                            {isSelected ? 'Active in collection desk and statement' : 'Tap to work on this cycle'}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              <ResultsPagination
                currentPage={pagination.currentPage}
                lastPage={pagination.lastPage}
                from={pagination.from}
                to={pagination.to}
                total={pagination.total}
                itemLabel="accounts"
                isFetching={accountsFetching && !isLoading}
                sortLabel={activeSortLabel}
                onPrevious={() => setAccountsPage((current) => Math.max(1, current - 1))}
                onNext={() => setAccountsPage((current) => Math.min(pagination.lastPage, current + 1))}
                className="rounded-2xl border border-slate-200 bg-white"
              />
            </div>
          ) : (
            <EmptyState
              icon="M12 8c-2 0-3.5 1.1-3.5 2.4s1.5 2.4 3.5 2.4 3.5 1.1 3.5 2.4-1.5 2.4-3.5 2.4m0-12V4m0 16v-1"
              title={hasSearch ? 'No matching member cycles' : 'No adashe members yet'}
              description={hasSearch
                ? 'Try a different member name, phone number, or cycle label.'
                : 'Create the first contribution account to start tracking member savings and payouts.'}
              tone={hasSearch ? 'amber' : 'violet'}
            />
          )}
        </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Open new cycle account" subtitle="Create a contribution account for a member" />
            <form onSubmit={handleCreate} className="space-y-3">
              <FinanceFormError message={createErrorMessageText} />
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">Member and cycle</p>
                <div className="mt-3 space-y-3">
                  <FinanceInputField field={memberFieldConfig} value={memberFieldConfig.value} onChange={memberFieldConfig.onChange} />
                  <FinanceInputField field={cycleNameFieldConfig} value={cycleNameFieldConfig.value} onChange={cycleNameFieldConfig.onChange} />
                </div>
              </div>
              <FinanceFormHint id="adashe-member-error" message={customersFailed ? getErrorMessage(customersError, 'Customer list is unavailable right now.') : null} />
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">Funding rules</p>
                <div className="mt-3 space-y-3">
                  {createFundingFields.map((field) => <FinanceInputField key={field.key} field={field} value={field.value} onChange={field.onChange} />)}
                  <div className="grid grid-cols-2 gap-3">
                    {scheduleFields.map((field) => <FinanceInputField key={field.key} field={field} value={field.value} onChange={field.onChange} />)}
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                size="lg"
                fullWidth
                className="bg-violet-600 hover:bg-violet-700"
                disabled={createMutation.isPending || customersFailed}
              >
                {createMutation.isPending ? 'Saving adashe account...' : 'Save adashe account'}
              </Button>
            </form>
          </Card>

          <div ref={collectionDeskRef}>
          <Card>
            <CardHeader title="Collection desk" subtitle={selectedAccount ? `Working on ${selectedAccount.customer?.name}` : 'Choose a member to continue'} />
            {selectedAccount ? (
              <form onSubmit={handleAction} className="space-y-3">
                <FinanceFormError message={actionErrorMessageText} />
                <FinanceSelectionBanner
                  eyebrow={actionMode === 'collect' ? 'Collection focus' : 'Payout focus'}
                  title={selectedAccount.customer?.name || 'Selected member'}
                  subtitle={selectedAccount.cycle_name || 'Contribution cycle'}
                  tone="violet"
                  metrics={[
                    { label: 'Collected', value: formatCurrencyNGN(selectedCollected) },
                    { label: 'Remaining', value: formatCurrencyNGN(selectedRemaining), toneClass: 'text-violet-700' },
                    { label: 'Next due', value: formatShortDate(selectedAccount.next_due_date, 'No activity yet') },
                  ]}
                  helper={actionMode === 'collect'
                    ? `Use quick-fill shortcuts to keep collections aligned with the member schedule. Remaining target: ${formatCurrencyNGN(selectedRemaining)}.`
                    : `Payouts draw from the collected balance already sitting in this cycle. Available payout balance: ${formatCurrencyNGN(selectedCollected)}.`}
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    onClick={() => applyActionMode('collect')}
                    aria-pressed={actionMode === 'collect'}
                    variant={actionMode === 'collect' ? 'primary' : 'secondary'}
                    size="lg"
                    className={actionMode === 'collect' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                  >
                    Collect
                  </Button>
                  <Button
                    type="button"
                    onClick={() => applyActionMode('payout')}
                    aria-pressed={actionMode === 'payout'}
                    variant={actionMode === 'payout' ? 'primary' : 'secondary'}
                    size="lg"
                    className={actionMode === 'payout' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                  >
                    Payout
                  </Button>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-slate-500">Collected balance</p>
                      <p className="mt-1 text-xl font-semibold text-slate-900">{formatCurrencyNGN(selectedCollected)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Remaining to target</p>
                      <p className="mt-1 text-base font-semibold text-violet-700">{formatCurrencyNGN(selectedRemaining)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Paid out so far</p>
                      <p className="mt-1 text-base font-semibold text-amber-700">{formatCurrencyNGN(selectedPaidOut)}</p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 w-full rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-[linear-gradient(90deg,#7C3AED,#06B6D4)]"
                      style={{ width: `${selectedProgress}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Next due {formatShortDate(selectedAccount.next_due_date, 'No activity yet')} {selectedAccount.contribution_frequency_days ? `- every ${selectedAccount.contribution_frequency_days} days` : ''}
                  </p>
                </div>
                <FinanceInputField field={actionFields[0]} value={actionFields[0].value} onChange={actionFields[0].onChange} />
                <FinanceFormHint message={actionAutoFillHint} className="text-sky-700" />
                <FinanceReasonBadge label={actionAutoFillPresentation?.badge?.label} tone={actionAutoFillPresentation?.badge?.tone} />
                <FinanceFormHint message={actionAutoFillPresentation?.why} className="text-slate-500" />
                <FinanceFormHint message={actionValidationMessage} />
                <FinanceFormHint message={actionPositiveMessage} className={actionValidationMessage ? '' : 'text-emerald-600'} />
                <FinanceRecommendationCard
                  message={actionRecommendation}
                  tone={actionRecommendationTone}
                  summaryLabel={actionAutoFillPresentation?.summaryLabel}
                  summaryTone={actionAutoFillPresentation?.summaryTone}
                  why={actionRecommendationWhy}
                  riskLevel={actionRecommendationRiskLevel}
                  nextReviewDate={actionRecommendationNextReviewDate}
                />
                <div className="flex flex-wrap gap-2">
                  {actionMode === 'collect' && selectedInstallment > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActionAutoFillHint(null);
                        setActionForm((current) => ({ ...current, amount: String(selectedInstallment) }));
                      }}
                      aria-label={`Use installment amount ${formatCurrencyNGN(selectedInstallment)}`}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                    >
                      {(accountRecommendation?.action === 'collect_installment') || recommendedCollectAmount === selectedInstallment
                        ? `${installmentShortcutPresentation?.badge?.label || 'Schedule aligned'}: installment`
                        : 'Use installment'}
                    </button>
                  ) : null}
                  {actionMode === 'collect' && selectedRemaining > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActionAutoFillHint(null);
                        setActionForm((current) => ({ ...current, amount: String(selectedRemaining) }));
                      }}
                      aria-label={`Collect remaining balance ${formatCurrencyNGN(selectedRemaining)}`}
                      className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
                    >
                      {(accountRecommendation?.action === 'complete_cycle') || recommendedCollectAmount === selectedRemaining
                        ? `${collectRemainingShortcutBadge.label}: collect remaining`
                        : 'Collect remaining'}
                    </button>
                  ) : null}
                  {actionMode === 'payout' && selectedCollected > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActionAutoFillHint(null);
                        setActionForm((current) => ({ ...current, amount: String(selectedCollected) }));
                      }}
                      aria-label={`Use collected balance ${formatCurrencyNGN(selectedCollected)}`}
                      className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
                    >
                      {recommendedPayoutAmount === selectedCollected
                        ? `${payoutShortcutPresentation?.badge?.label || 'Within collected balance'}: full payout`
                        : 'Use collected balance'}
                    </button>
                  ) : null}
                </div>
                <FinanceInputField field={actionFields[1]} value={actionFields[1].value} onChange={actionFields[1].onChange} />
                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  disabled={actionSubmitDisabled}
                  className={actionMode === 'collect' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-500 hover:bg-amber-600'}
                >
                  {actionBusy
                    ? (actionMode === 'collect' ? 'Saving contribution...' : 'Saving payout...')
                    : actionMode === 'collect'
                      ? 'Save contribution'
                      : 'Save payout'}
                </Button>
              </form>
            ) : (
              <EmptyState
                icon="M8 7h8m-8 5h8m-8 5h5"
                title="Select a member first"
                description="Pick an account from the ledger to record a contribution or payout."
                tone="amber"
                className="py-8"
              />
            )}
          </Card>
          </div>
        </div>
      </div>

        <div ref={statementRef}>
        <Card>
          <CardHeader
            title="Contribution statement"
              subtitle={selectedStatementAccount ? `${selectedStatementAccount.customer?.name} transaction history` : 'Recent activity will appear after you select a member'}
        />
        {selectedAccount ? (
          statementLoading ? (
            <FinanceLoadingState message="Loading contribution history..." className="py-8 text-sm text-slate-500" />
          ) : statementFailed ? (
            <FinanceUnavailableState
              title="Statement unavailable"
              description={getErrorMessage(statementError, 'We could not load this member statement right now.')}
              tone="amber"
            />
          ) : statement.length > 0 ? (
            <div className="space-y-4">
              <FinanceSelectionBanner
                eyebrow="Statement scope"
                title={selectedStatementAccount.customer?.name || 'Selected member'}
                subtitle={selectedStatementAccount.cycle_name || 'Contribution cycle'}
                tone="violet"
                metrics={[
                  { label: 'Filtered entries', value: String(filteredStatement.length) },
                  { label: 'Visible window', value: statementDateSummary },
                  { label: 'Activity view', value: statementViewLabels[statementView] },
                ]}
                helper="Exports and prints follow the current statement filters shown below."
              />
              <StatementPanel
                accent="violet"
                summaryItems={buildAdasheStatementPanelSummaryItems(statementSummary)}
                navigationActions={statementNavigationActions}
                toolbarProps={{
                  onPrint: handlePrintStatement,
                  onExport: handleExportStatement,
                  datePresets: statementDatePresets,
                  activeDatePreset: statementDatePreset,
                  onDatePresetChange: handleStatementPresetChange,
                  activityViews: statementViews,
                  activeActivityView: statementView,
                  activityCounts: statementCounts,
                  onActivityViewChange: setStatementView,
                  dateRange: statementDateRange,
                  onDateChange: handleStatementDateChange,
                  activeViewLabel: statementViewLabels[statementView],
                  dateSummary: statementDateSummary,
                  showReset: filtersAreActive,
                  onReset: resetStatementFilters,
                  accent: 'violet',
                }}
                entries={mapAdasheStatementPanelEntries(filteredStatement)}
                showAll={showAllStatement}
                onToggleShowAll={() => setShowAllStatement((current) => !current)}
                renderTitle={getAdasheStatementEntryTitle}
                renderMeta={getAdasheStatementEntryMeta}
                renderAmount={(transaction) => (
                  <span className={transaction.type === 'draw' ? 'text-emerald-700' : 'text-amber-700'}>
                    {formatCurrencyNGN(Math.abs(transaction.amount))}
                  </span>
                )}
                emptyState={{
                  icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2',
                  title: statementView === 'draw' ? 'No collections in this statement' : 'No payouts in this statement',
                  description: 'Switch filters or record new activity to build a fuller statement history.',
                }}
              />
            </div>
          ) : (
            <EmptyState
              icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
              title="No contribution activity yet"
              description="The first collection or payout for this member will show here."
              tone="emerald"
            />
          )
        ) : (
          <EmptyState
            icon="M4 6h16M4 12h16M4 18h16"
            title="Choose a member to view history"
            description="Statements help you explain what happened, how much has been collected, and what has already been paid out."
            tone="amber"
          />
        )}
      </Card>
      </div>

      <Toast tone={toast?.tone} message={toast?.message} />
      {selectedAccount ? (
        <FinanceMobileShortcutRail
          title={selectedAccount.customer?.name || 'Selected member'}
          subtitle={selectedAccount.cycle_name || 'Contribution cycle'}
          activeActionLabel={activeRailAction === 'Desk' ? getAdashePrimaryActionLabel(actionMode, 'compact') : activeRailAction}
          tone="violet"
          actions={mobileRailActions}
        />
      ) : null}
    </PageShell>
  );
}

