import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useActiveFinanceSection } from './useActiveFinanceSection';
import { computeLedgerPagination, useLedgerControls } from './useLedgerControls';
import { useStatementData } from './useStatementData';
import { useStatementFilters } from './useStatementFilters';
import { useToast } from './useToast';
import { getErrorMessage } from '../lib/apiFeedback';
import {
  getAdashePrimaryActionLabel,
  getAdasheSuggestedAmount,
  getRecommendedAdasheActionMode,
  runAdashePrimaryAction,
} from '../lib/financeActionRouting';
import { buildDateField, buildNumberField, buildSelectField, buildTextField } from '../lib/financeFieldBuilders';
import {
  buildAdasheLedgerLensItems,
  buildAdasheStatementPrintSummary,
  createAdasheStatementSummary,
  mapAdasheStatementExportRow,
  sortAdasheAccounts,
} from '../lib/adashe';
import { buildFinanceFieldProps } from '../lib/financeFieldProps';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import { getAdasheRecommendationPresentation } from '../lib/financeRecommendationPresenter';
import { getFinanceQueryValue } from '../lib/financePageQuery';
import { scrollToFinanceRef } from '../lib/financeScroll';
import { exportStatementCsv, printStatement } from '../lib/statementReports';

export const defaultCreateForm = {
  customer_id: '',
  cycle_name: '',
  limit: '',
  installment_amount: '',
  contribution_frequency_days: '7',
  next_due_date: new Date().toISOString().slice(0, 10),
};

export const defaultActionForm = {
  amount: '',
  reference: '',
};

export const adasheViews = [
  { id: 'all', label: 'All cycles' },
  { id: 'due_now', label: 'Due now' },
  { id: 'collecting', label: 'Collecting' },
  { id: 'funded', label: 'Funded' },
  { id: 'paid_out', label: 'Paid out' },
];

export const adasheSortOptions = [
  { id: 'priority', label: 'Priority', description: 'Ranks cycles by recommendation risk, due-now urgency, and the nearest collection date.' },
  { id: 'newest', label: 'Newest', description: 'Shows the most recently opened cycle accounts first.' },
  { id: 'largest_target', label: 'Largest target', description: 'Brings the biggest cycle commitments to the top.' },
  { id: 'largest_balance', label: 'Largest balance', description: 'Shows cycles holding the most collected money first.' },
];

export function useAdasheDesk() {
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

  return {
    ledgerRef,
    collectionDeskRef,
    statementRef,
    createForm,
    setCreateForm,
    actionMode,
    setActionMode,
    selectedAccountId,
    setSelectedAccountId,
    actionForm,
    setActionForm,
    actionAutoFillHint,
    setActionAutoFillHint,
    toast,
    setToast,
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
    statementLoading,
    statementFailed,
    statementError,
    isLoading,
    accountsFetching,
    accountsFailed,
    accountsError,
    customersFailed,
    customersError,
    insightsFailed,
    adasheDeskQueries,
    adasheDeskError,
    accounts,
    accountsSummary,
    pagination,
    customers,
    orderedAccounts,
    selectedAccount,
    activeViewLabel,
    activeSortLabel,
    activeSortDescription,
    searchScopeSummary,
    scrollToLedger,
    scrollToCollectionDesk,
    scrollToStatement,
    applyActionMode,
    openCurrentDeskAction,
    activeRailAction,
    ledgerLensItems,
    statement,
    selectedStatementAccount,
    adasheInsights,
    statementCounts,
    filteredStatement,
    statementSummary,
    statementExportRows,
    statementDateSummary,
    statementNavigationActions,
    mobileRailActions,
    refreshAccounts,
    createMutation,
    collectMutation,
    payoutMutation,
    summary,
    completionRate,
    actionBusy,
    createErrorMessageText,
    actionErrorMessageText,
    selectedTarget,
    selectedCollected,
    selectedInstallment,
    selectedPaidOut,
    selectedRemaining,
    selectedProgress,
    accountRecommendation,
    actionAmountValue,
    actionAmountEntered,
    actionLimit,
    recommendedCollectAmount,
    recommendedPayoutAmount,
    actionRecommendationTone,
    actionRecommendation,
    actionRecommendationWhy,
    actionRecommendationRiskLevel,
    actionRecommendationNextReviewDate,
    actionAutoFillPresentation,
    installmentShortcutPresentation,
    collectRemainingShortcutBadge,
    payoutShortcutPresentation,
    actionValidationMessage,
    actionPositiveMessage,
    actionSubmitDisabled,
    createFundingFields,
    scheduleFields,
    actionFields,
    memberFieldConfig,
    cycleNameFieldConfig,
    handleCreate,
    handleAction,
    handleExportStatement,
    handlePrintStatement,
  };
}
