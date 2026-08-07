import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useActiveFinanceSection } from './useActiveFinanceSection';
import { computeLedgerPagination, useLedgerControls } from './useLedgerControls';
import { useStatementData } from './useStatementData';
import { useStatementFilters } from './useStatementFilters';
import { useToast } from './useToast';
import { getErrorMessage } from '../lib/apiFeedback';
import { buildNumberField, buildSelectField, buildTextareaField } from '../lib/financeFieldBuilders';
import {
  getTrustFundPrimaryActionLabel,
  getTrustFundSuggestedAmount,
  runTrustFundPrimaryAction,
} from '../lib/financeActionRouting';
import { buildFinanceFieldProps } from '../lib/financeFieldProps';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import { getFinanceQueryValue } from '../lib/financePageQuery';
import { scrollToFinanceRef } from '../lib/financeScroll';
import { exportStatementCsv, printStatement } from '../lib/statementReports';
import {
  buildTrustFundLedgerLensItems,
  buildTrustFundStatementPrintSummary,
  createTrustFundStatementSummary,
  getTrustFundTransactionState,
  mapTrustFundStatementExportRow,
  sortTrustAccounts,
} from '../lib/trustFund';

export const trustLedgerViews = [
  { id: 'all', label: 'All accounts' },
  { id: 'active_balance', label: 'With balance' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'clear', label: 'Cleared' },
];

export const trustSortOptions = [
  { id: 'priority', label: 'Priority', description: 'Ranks accounts by recommendation risk, next review timing, and exposure still outstanding.' },
  { id: 'newest', label: 'Newest', description: 'Shows the most recently opened trust accounts first.' },
  { id: 'largest_balance', label: 'Largest balance', description: 'Brings the highest outstanding balances to the top.' },
  { id: 'largest_limit', label: 'Largest limit', description: 'Shows the biggest approved credit limits first.' },
];

export function useTrustFundDesk() {
  const emptyTrustForm = { customer_id: '', limit: '', notes: '' };
  const [searchParams] = useSearchParams();
  const ledgerRef = useRef(null);
  const accountActivityRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedLedgerAccountId, setSelectedLedgerAccountId] = useState(null);
  const [form, setForm] = useState(emptyTrustForm);
  const [amount, setAmount] = useState('');
  const [modalBaseline, setModalBaseline] = useState({ modalType: 'create', form: emptyTrustForm, amount: '' });
  const [transactionAutoFillHint, setTransactionAutoFillHint] = useState(null);
  const { toast, setToast } = useToast();
  const queryClient = useQueryClient();
  const resetTrustModal = () => {
    setShowModal(false);
    setModalType('create');
    setSelectedAccount(null);
    setForm(emptyTrustForm);
    setAmount('');
    setTransactionAutoFillHint(null);
    setModalBaseline({ modalType: 'create', form: emptyTrustForm, amount: '' });
  };

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
    storageKeyPrefix: 'taska-trust-fund-statement',
    resetKey: selectedLedgerAccountId,
  });

  const requestedView = getFinanceQueryValue(
    searchParams,
    'view',
    trustLedgerViews.map((view) => view.id),
  );
  const requestedSort = getFinanceQueryValue(
    searchParams,
    'sort',
    trustSortOptions.map((sort) => sort.id),
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
    storageKeyPrefix: 'taska-trust-fund',
    requestedView,
    requestedSort,
  });

  const accountsQuery = useQuery({
    queryKey: ['trust-accounts', accountsPage, deferredSearchTerm, activeView],
    queryFn: () => api.get('/trust-accounts', {
      params: {
        type: 'credit',
        page: accountsPage,
        search: deferredSearchTerm || undefined,
        view: activeView === 'all' ? undefined : activeView,
      },
    }).then((response) => response.data),
    keepPreviousData: true,
  });

  const overdueQuery = useQuery({
    queryKey: ['trust-overdue'],
    queryFn: () => api.get('/trust-accounts/overdue').then((response) => response.data),
  });

  const customersQuery = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then((response) => response.data),
  });

  const {
    data: statementResponse,
    isFetching: statementLoading,
    isError: statementFailed,
    error: statementError,
  } = useQuery({
    queryKey: ['trust-account-statement', selectedLedgerAccountId],
    enabled: Boolean(selectedLedgerAccountId),
    queryFn: () => api.get(`/trust-accounts/${selectedLedgerAccountId}`).then((response) => response.data),
    staleTime: 15000,
  });
  const accounts = accountsQuery.data;
  const accountsLoading = accountsQuery.isLoading;
  const accountsFetching = accountsQuery.isFetching;
  const accountsFailed = accountsQuery.isError;
  const accountsError = accountsQuery.error;
  const overdue = overdueQuery.data;
  const overdueFailed = overdueQuery.isError;
  const customers = customersQuery.data;
  const customersFailed = customersQuery.isError;
  const customersError = customersQuery.error;
  const trustDeskQueries = [accountsQuery, overdueQuery, customersQuery];
  const trustDeskError = getErrorMessage(
    trustDeskQueries.find((query) => query.isError)?.error,
    'We could not load part of the trust fund workspace right now. Please try again.',
  );

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/trust-accounts', data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['trust-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['trust-overdue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      resetTrustModal();
      setToast({
        tone: 'success',
        message: `Trust account opened for ${response.data?.customer?.name || 'customer'}.`,
      });
    },
  });

  const drawMutation = useMutation({
    mutationFn: ({ accountId, data }) => api.post(`/trust-accounts/${accountId}/draw`, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trust-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['trust-overdue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      resetTrustModal();
      setToast({
        tone: 'success',
        message: `${formatCurrencyNGN(Number(variables.data.amount || 0))} released to ${response.data?.customer?.name || 'customer'}.`,
      });
    },
  });

  const repayMutation = useMutation({
    mutationFn: ({ accountId, data }) => api.post(`/trust-accounts/${accountId}/repay`, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trust-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['trust-overdue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      resetTrustModal();
      setToast({
        tone: 'success',
        message: `${formatCurrencyNGN(Number(variables.data.amount || 0))} recovered from ${response.data?.customer?.name || 'customer'}.`,
      });
    },
  });

  const handleCreate = (event) => {
    event.preventDefault();
    createMutation.mutate({
      customer_id: Number(form.customer_id),
      account_type: 'credit',
      limit: Number(form.limit || 0),
    });
  };

  const openDraw = (account) => {
    setSelectedAccount(account);
    setModalType('draw');
    const suggestedAmount = getTrustFundSuggestedAmount(account, 'draw');
    const nextAmount = suggestedAmount > 0 ? String(suggestedAmount) : '';
    setTransactionAutoFillHint(suggestedAmount > 0
      ? `Amount preloaded from the current recommendation: ${formatCurrencyNGN(suggestedAmount)}.`
      : null);
    setAmount(nextAmount);
    setForm(emptyTrustForm);
    setModalBaseline({ modalType: 'draw', form: emptyTrustForm, amount: nextAmount });
    setShowModal(true);
  };

  const openRepay = (account) => {
    setSelectedAccount(account);
    setModalType('repay');
    const suggestedAmount = getTrustFundSuggestedAmount(account, 'repay');
    const nextAmount = suggestedAmount > 0 ? String(suggestedAmount) : '';
    setTransactionAutoFillHint(suggestedAmount > 0
      ? `Amount preloaded from the current recommendation: ${formatCurrencyNGN(suggestedAmount)}.`
      : null);
    setAmount(nextAmount);
    setForm(emptyTrustForm);
    setModalBaseline({ modalType: 'repay', form: emptyTrustForm, amount: nextAmount });
    setShowModal(true);
  };

  const handleTransaction = (event) => {
    event.preventDefault();
    const payload = {
      amount: Number(amount || 0),
      reference: form.notes || null,
    };
    if (modalType === 'draw') {
      drawMutation.mutate({ accountId: selectedAccount.id, data: payload });
      return;
    }
    repayMutation.mutate({ accountId: selectedAccount.id, data: payload });
  };

  const accountsList = useMemo(() => accounts?.data ?? [], [accounts]);
  const accountsSummary = accounts?.summary ?? null;
  const pagination = useMemo(
    () => computeLedgerPagination({ response: accounts, itemCount: accountsList.length }),
    [accounts, accountsList.length]
  );
  const overdueList = overdue?.data ?? [];
  const customerOptions = customers?.data ?? [];
  const orderedAccountsList = useMemo(
    () => sortTrustAccounts(accountsList, activeSort),
    [accountsList, activeSort],
  );

  // Adjust state during render rather than in an effect: default to the
  // first account once accounts load, or fall back to it if the current
  // selection no longer exists in the list (e.g. filtered out).
  const hasValidLedgerSelection = selectedLedgerAccountId
    && accountsList.some((account) => account.id === selectedLedgerAccountId);
  if (!hasValidLedgerSelection && accountsList.length > 0) {
    setSelectedLedgerAccountId(accountsList[0].id);
  }

  const selectedLedgerAccount = orderedAccountsList.find((account) => account.id === selectedLedgerAccountId) ?? null;
  const activeViewLabel = trustLedgerViews.find((view) => view.id === activeView)?.label ?? 'All accounts';
  const activeSortLabel = trustSortOptions.find((option) => option.id === activeSort)?.label ?? 'Priority';
  const activeSortDescription = trustSortOptions.find((option) => option.id === activeSort)?.description
    ?? 'Ranks accounts by recommendation risk, next review timing, and exposure still outstanding.';
  const searchScopeSummary = hasSearch ? `Matches for "${deferredSearchTerm}"` : 'All trust accounts';
  const activeRailAction = useActiveFinanceSection({
    initialLabel: 'Ledger',
    overrideLabel: showModal && modalType !== 'create'
      ? getTrustFundPrimaryActionLabel({ balance: modalType === 'repay' ? 1 : 0 }, 'compact')
      : null,
    sections: [
      { label: 'Ledger', ref: ledgerRef },
      { label: 'Activity', ref: accountActivityRef },
    ],
  });
  const scrollToLedger = () => scrollToFinanceRef(ledgerRef);
  const scrollToAccountActivity = () => scrollToFinanceRef(accountActivityRef);
  const openSelectedLedgerAction = () => runTrustFundPrimaryAction(selectedLedgerAccount, { openDraw, openRepay });
  const ledgerLensItemsBase = buildTrustFundLedgerLensItems({
    pagination,
    orderedAccountsList,
    activeViewLabel,
    activeSortLabel,
    activeSortDescription,
    searchScopeSummary,
    selectedLedgerAccount,
  });
  // The ref-derived "Go to activity" closure is attached locally, after the
  // external builder call, rather than passed as a focusActions argument into
  // it (matching how useAdasheDesk.js's equivalent already does this
  // correctly). react-hooks/refs can't trace a ref-closure through a function
  // boundary to confirm it's never invoked during render (buildFinanceAction
  // just stores onClick on the returned object, it never calls it), so it
  // flags any such call as a false positive - keeping the closure local avoids
  // that entirely instead of trying to prove a negative to the linter.
  const focusActions = selectedLedgerAccount
    ? [
      {
        label: getTrustFundPrimaryActionLabel(selectedLedgerAccount),
        onClick: openSelectedLedgerAction,
        active: activeRailAction === getTrustFundPrimaryActionLabel(selectedLedgerAccount, 'compact'),
      },
      {
        label: 'Go to activity',
        onClick: () => scrollToFinanceRef(accountActivityRef),
        active: activeRailAction === 'Activity',
      },
    ]
    : [];
  const ledgerLensItems = ledgerLensItemsBase.map((item, index) => (
    index === ledgerLensItemsBase.length - 1
      ? { ...item, actions: focusActions }
      : item
  ));

  const statementAccount = statementResponse?.account ?? selectedLedgerAccount;
  const statementTransactions = statementResponse?.transactions ?? [];
  const modalBusy = createMutation.isPending || drawMutation.isPending || repayMutation.isPending;
  const createErrorMessageText = createMutation.isError
    ? getErrorMessage(createMutation.error, 'Unable to open the trust account right now.')
    : null;
  const transactionErrorMessageText = drawMutation.isError
    ? getErrorMessage(drawMutation.error, 'Unable to save this draw right now.')
    : repayMutation.isError
      ? getErrorMessage(repayMutation.error, 'Unable to save this repayment right now.')
      : null;
  const {
    accountRecommendation,
    availableToDraw,
    drawShortcutPresentation,
    recommendedDrawAmount,
    recommendedRepaymentAmount,
    repayShortcutPresentation,
    selectedOutstanding,
    transactionAutoFillPresentation,
    transactionPositiveMessage,
    transactionRecommendation,
    transactionRecommendationNextReviewDate,
    transactionRecommendationRiskLevel,
    transactionRecommendationTone,
    transactionRecommendationWhy,
    transactionValidationMessage,
  } = getTrustFundTransactionState({
    modalType,
    selectedAccount,
    amount,
    transactionAutoFillHint,
  });
  const transactionSubmitDisabled = modalBusy
    || (modalType === 'create' && customersFailed)
    || Boolean(transactionValidationMessage);
  const trustModalDirty = modalType === 'create'
    ? JSON.stringify(form) !== JSON.stringify(modalBaseline.form)
    : String(amount) !== String(modalBaseline.amount) || form.notes !== modalBaseline.form.notes;
  const pageSummary = useMemo(() => accountsList.reduce((totals, account) => {
    const limit = Number(account.limit || 0);
    const outstanding = Number(account.balance || 0);
    const collected = Number(account.total_repaid || 0);

    totals.totalExtended += limit;
    totals.totalCollected += collected;
    totals.totalOutstanding += outstanding;

    return totals;
  }, {
    totalExtended: 0,
    totalCollected: 0,
    totalOutstanding: 0,
  }), [accountsList]);

  const summary = useMemo(() => ({
    totalExtended: Number(accountsSummary?.total_extended ?? pageSummary.totalExtended),
    totalCollected: Number(accountsSummary?.total_collected ?? pageSummary.totalCollected),
    totalOutstanding: Number(accountsSummary?.total_outstanding ?? pageSummary.totalOutstanding),
  }), [accountsSummary, pageSummary]);
  const {
    statementCounts,
    filteredStatement,
    statementSummary,
    statementExportRows,
    statementDateSummary,
  } = useStatementData({
    transactions: statementTransactions,
    statementView,
    statementDateRange,
    createSummary: createTrustFundStatementSummary,
    mapExportRow: mapTrustFundStatementExportRow,
  });
  const customerField = buildFinanceFieldProps('trust-customer', {
    errorId: customersFailed ? 'trust-customer-error' : null,
    inputProps: { 'data-autofocus': 'true' },
  });
  const limitField = buildFinanceFieldProps('trust-limit');
  const createNotesField = buildFinanceFieldProps('trust-create-notes');
  const transactionAmountField = buildFinanceFieldProps('trust-transaction-amount', {
    inputProps: { 'data-autofocus': 'true' },
  });
  const transactionNotesField = buildFinanceFieldProps('trust-transaction-notes');
  const createModalFields = [
    buildNumberField({
      key: 'limit',
      fieldProps: limitField,
      label: 'Credit limit',
      hint: 'This is the maximum exposure allowed on the account.',
      required: true,
      value: form.limit,
      onChange: (event) => setForm({ ...form, limit: event.target.value }),
      className: 'input bg-white',
      placeholder: '0.00',
    }),
    buildTextareaField({
      key: 'notes',
      fieldProps: createNotesField,
      label: 'Notes',
      hint: 'Capture approval context, guarantor info, or repayment terms.',
      value: form.notes,
      onChange: (event) => setForm({ ...form, notes: event.target.value }),
      className: 'input min-h-[96px] resize-y bg-white py-3',
      rows: 2,
    }),
  ];
  const transactionModalFields = [
    buildNumberField({
      key: 'amount',
      fieldProps: transactionAmountField,
      label: modalType === 'draw' ? 'Draw amount' : 'Repayment amount',
      hint: modalType === 'draw'
        ? `Enter the amount being released to the customer now. Available limit: ${formatCurrencyNGN(availableToDraw)}.`
        : `Enter the amount the customer is paying back now. Outstanding balance: ${formatCurrencyNGN(selectedOutstanding)}.`,
      required: true,
      value: amount,
      onChange: (event) => {
        setTransactionAutoFillHint(null);
        setAmount(event.target.value);
      },
      className: 'input',
      invalid: Boolean(transactionValidationMessage),
      invalidClassName: 'border-amber-300 bg-amber-50 text-amber-900 ring-2 ring-amber-100',
      placeholder: '0.00',
    }),
    buildTextareaField({
      key: 'notes',
      fieldProps: transactionNotesField,
      label: 'Notes',
      hint: 'Add who handled it, channel used, or any repayment explanation.',
      value: form.notes,
      onChange: (event) => setForm({ ...form, notes: event.target.value }),
      className: 'input min-h-[96px] resize-y py-3',
      rows: 2,
    }),
  ];
  const customerFieldConfig = buildSelectField({
    key: 'customer_id',
    fieldProps: customerField,
    label: 'Customer',
    hint: 'Choose who will receive and repay this trust limit.',
    required: true,
    disabled: customersFailed,
    value: form.customer_id,
    onChange: (event) => setForm({ ...form, customer_id: event.target.value }),
    className: 'input bg-white',
    options: [
      { value: '', label: 'Select customer' },
      ...customerOptions.map((customer) => ({ value: customer.id, label: customer.name })),
    ],
  });
  const handleExportStatement = () => {
    if (!statementAccount || statementExportRows.length === 0) {
      return;
    }

    exportStatementCsv({
      filePrefix: 'trust-fund-statement',
      accountName: statementAccount.customer?.name,
      fallbackName: 'customer',
      rows: statementExportRows,
    });
  };

  const handlePrintStatement = () => {
    if (!statementAccount || statementExportRows.length === 0) {
      return;
    }

    printStatement({
      title: 'Trust Fund Statement',
      subtitle: `${statementAccount.customer?.name || 'Customer'} credit activity history`,
      summary: buildTrustFundStatementPrintSummary(statementSummary),
      rows: statementExportRows,
    });
  };

  return {
    emptyTrustForm,
    ledgerRef,
    accountActivityRef,
    showModal,
    setShowModal,
    modalType,
    setModalType,
    selectedAccount,
    setSelectedAccount,
    selectedLedgerAccountId,
    setSelectedLedgerAccountId,
    form,
    setForm,
    amount,
    setAmount,
    modalBaseline,
    setModalBaseline,
    transactionAutoFillHint,
    setTransactionAutoFillHint,
    toast,
    resetTrustModal,
    openDraw,
    openRepay,
    accountsList,
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
    hasSearch,
    accountsLoading,
    accountsFetching,
    accountsFailed,
    accountsError,
    overdueList,
    overdueFailed,
    customersFailed,
    customersError,
    trustDeskQueries,
    trustDeskError,
    handleCreate,
    handleTransaction,
    orderedAccountsList,
    selectedLedgerAccount,
    activeSortLabel,
    activeRailAction,
    scrollToLedger,
    scrollToAccountActivity,
    openSelectedLedgerAction,
    ledgerLensItems,
    statementAccount,
    statementLoading,
    statementFailed,
    statementError,
    statementTransactions,
    modalBusy,
    createErrorMessageText,
    transactionErrorMessageText,
    accountRecommendation,
    availableToDraw,
    drawShortcutPresentation,
    recommendedDrawAmount,
    recommendedRepaymentAmount,
    repayShortcutPresentation,
    selectedOutstanding,
    transactionAutoFillPresentation,
    transactionPositiveMessage,
    transactionRecommendation,
    transactionRecommendationNextReviewDate,
    transactionRecommendationRiskLevel,
    transactionRecommendationTone,
    transactionRecommendationWhy,
    transactionValidationMessage,
    transactionSubmitDisabled,
    trustModalDirty,
    summary,
    pagination,
    statementCounts,
    filteredStatement,
    statementSummary,
    statementDateSummary,
    createModalFields,
    transactionModalFields,
    customerFieldConfig,
    handleExportStatement,
    handlePrintStatement,
  };
}
