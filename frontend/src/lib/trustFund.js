import { formatCurrencyNGN, formatShortDate } from './financeFormatters.js';
import {
  getTrustFundLedgerActionLabel,
  getTrustFundPrimaryActionKey,
} from './financeActionRouting.js';
import {
  buildActiveViewLensItem,
  buildFocusLensItem,
  buildLedgerScopeLensItem,
  buildOrderingLensItem,
  joinFinanceLensParts,
} from './financeLensItems.js';
import { getTrustFundRecommendationPresentation } from './financeRecommendationPresenter.js';

const riskPriority = {
  high: 0,
  medium: 1,
  low: 2,
};

function getRecommendationRiskRank(account) {
  return riskPriority[account?.recommendation?.risk_level] ?? 3;
}

function getRecommendationReviewTimestamp(account) {
  return account?.recommendation?.next_review_date
    ? new Date(account.recommendation.next_review_date).getTime()
    : Number.MAX_SAFE_INTEGER;
}

export function sortTrustAccounts(accounts = [], activeSort = 'priority') {
  return [...accounts].sort((left, right) => {
    if (activeSort === 'newest') {
      return new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime();
    }

    if (activeSort === 'largest_balance') {
      return Number(right.balance || 0) - Number(left.balance || 0);
    }

    if (activeSort === 'largest_limit') {
      return Number(right.limit || 0) - Number(left.limit || 0);
    }

    const leftRisk = getRecommendationRiskRank(left);
    const rightRisk = getRecommendationRiskRank(right);

    if (leftRisk !== rightRisk) {
      return leftRisk - rightRisk;
    }

    const leftReviewDate = getRecommendationReviewTimestamp(left);
    const rightReviewDate = getRecommendationReviewTimestamp(right);

    if (leftReviewDate !== rightReviewDate) {
      return leftReviewDate - rightReviewDate;
    }

    return Number(right.balance || 0) - Number(left.balance || 0);
  });
}

export function buildTrustFundLedgerAccountPresentation(account) {
  const outstanding = Number(account?.balance || 0);
  const recommendation = account?.recommendation ?? null;
  const primaryActionKey = getTrustFundPrimaryActionKey(account);
  const recommendationPresentation = getTrustFundRecommendationPresentation(account, primaryActionKey);
  const recommendedAmount = Number(recommendation?.recommended_amount || 0);
  const customerName = account?.customer?.name ?? 'customer';
  const drawLabel = getTrustFundLedgerActionLabel(account, 'draw', formatCurrencyNGN);
  const repayLabel = getTrustFundLedgerActionLabel(account, 'repay', formatCurrencyNGN);
  const drawAriaLabel = recommendation?.action === 'draw_within_limit' && recommendedAmount > 0
    ? `Open draw for ${customerName} with recommended amount ${formatCurrencyNGN(recommendedAmount)}`
    : `Open draw for ${customerName}`;
  const repayAriaLabel = (recommendation?.action === 'collect_repayment_first' || recommendation?.action === 'account_clear') && recommendedAmount > 0
    ? `Open repayment for ${customerName} with recommended amount ${formatCurrencyNGN(recommendedAmount)}`
    : `Open repayment for ${customerName}`;
  const utilization = Number(account?.limit || 0) > 0
    ? Math.min(100, (outstanding / Number(account.limit || 0)) * 100)
    : 0;

  return {
    customerName,
    drawAriaLabel,
    drawLabel,
    outstanding,
    primaryActionKey,
    recommendation,
    recommendationPresentation,
    recommendedAmount,
    repayAriaLabel,
    repayLabel,
    statusClassName: outstanding > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700',
    statusLabel: outstanding > 0 ? 'Active' : 'Clear',
    utilization,
  };
}

export function buildTrustFundOverdueAccountPresentation(account) {
  const ctaLabel = getTrustFundLedgerActionLabel(account, 'repay', formatCurrencyNGN);
  const customerName = account?.customer?.name || 'customer';

  return {
    ariaLabel: `${ctaLabel} for overdue account ${customerName}`,
    ctaLabel,
    customerName,
    overdueAmountLabel: `${formatCurrencyNGN(account?.balance)} overdue`,
    recommendation: account?.recommendation,
    recommendationPresentation: getTrustFundRecommendationPresentation(account, 'repay'),
  };
}

export function getTrustFundTransactionState({
  modalType = 'create',
  selectedAccount = null,
  amount = '',
  transactionAutoFillHint = null,
} = {}) {
  const selectedOutstanding = Number(selectedAccount?.balance || 0);
  const selectedLimit = Number(selectedAccount?.limit || 0);
  const availableToDraw = Math.max(0, selectedLimit - selectedOutstanding);
  const accountRecommendation = selectedAccount?.recommendation ?? null;
  const recommendedDrawAmount = availableToDraw;
  const recommendedRepaymentAmount = selectedOutstanding;

  const transactionRecommendationTone = modalType === 'draw' && accountRecommendation?.tone
    ? accountRecommendation.tone
    : modalType === 'draw'
      ? availableToDraw <= 0
        ? 'amber'
        : 'violet'
      : modalType === 'repay'
        ? selectedOutstanding <= 0
          ? 'emerald'
          : 'violet'
        : 'violet';

  const transactionRecommendation = modalType === 'draw' && accountRecommendation?.message
    ? accountRecommendation.message
    : modalType === 'draw'
      ? availableToDraw <= 0
        ? 'Best next step: this account has no remaining headroom, so collect a repayment before releasing more credit.'
        : `Best next step: release only what fits within the remaining headroom of ${formatCurrencyNGN(recommendedDrawAmount)}.`
      : modalType === 'repay'
        ? selectedOutstanding <= 0
          ? 'Best next step: this account is already clear, so no repayment is needed right now.'
          : `Best next step: recover up to ${formatCurrencyNGN(recommendedRepaymentAmount)} to clear the current balance.`
        : null;

  const transactionRecommendationWhy = modalType === 'draw'
    ? accountRecommendation?.why
    : modalType === 'repay'
      ? selectedOutstanding <= 0
        ? 'There is no outstanding balance left on this account.'
        : 'Recovering against the current outstanding balance reduces risk before any future draw.'
      : null;

  const transactionRecommendationRiskLevel = modalType === 'draw'
    ? accountRecommendation?.risk_level
    : modalType === 'repay'
      ? selectedOutstanding <= 0
        ? 'low'
        : 'medium'
      : null;

  const transactionRecommendationNextReviewDate = modalType === 'draw'
    ? accountRecommendation?.next_review_date
    : null;

  const transactionAutoFillPresentation = transactionAutoFillHint && selectedAccount && modalType !== 'create'
    ? getTrustFundRecommendationPresentation(selectedAccount, modalType === 'repay' ? 'repay' : 'draw')
    : null;

  const drawShortcutPresentation = selectedAccount
    ? getTrustFundRecommendationPresentation(selectedAccount, 'draw')
    : null;

  const repayShortcutPresentation = selectedAccount
    ? getTrustFundRecommendationPresentation(selectedAccount, 'repay')
    : null;

  const transactionAmountValue = Number(amount || 0);
  const transactionAmountEntered = String(amount).trim() !== '';
  const transactionValidationMessage = modalType === 'create'
    ? null
    : !selectedAccount
      ? 'Choose an account before saving this transaction.'
      : !transactionAmountEntered
        ? null
        : Number.isNaN(transactionAmountValue) || transactionAmountValue <= 0
          ? 'Enter an amount greater than zero.'
          : modalType === 'draw' && transactionAmountValue > availableToDraw
            ? `This draw exceeds the available limit of ${formatCurrencyNGN(availableToDraw)}.`
            : modalType === 'repay' && transactionAmountValue > selectedOutstanding
              ? `This repayment exceeds the outstanding balance of ${formatCurrencyNGN(selectedOutstanding)}.`
              : null;

  const transactionPositiveMessage = modalType !== 'create' && selectedAccount && transactionAmountEntered && !transactionValidationMessage
    ? modalType === 'draw'
      ? `Within range. Up to ${formatCurrencyNGN(availableToDraw)} is available for this draw.`
      : `Within range. Up to ${formatCurrencyNGN(selectedOutstanding)} can be recovered on this repayment.`
    : null;

  return {
    accountRecommendation,
    availableToDraw,
    drawShortcutPresentation,
    recommendedDrawAmount,
    recommendedRepaymentAmount,
    repayShortcutPresentation,
    selectedLimit,
    selectedOutstanding,
    transactionAmountEntered,
    transactionAmountValue,
    transactionAutoFillPresentation,
    transactionPositiveMessage,
    transactionRecommendation,
    transactionRecommendationNextReviewDate,
    transactionRecommendationRiskLevel,
    transactionRecommendationTone,
    transactionRecommendationWhy,
    transactionValidationMessage,
  };
}

export function buildTrustFundLedgerLensItems({
  pagination = { total: 0, currentPage: 1, lastPage: 1 },
  orderedAccountsList = [],
  activeViewLabel = 'All accounts',
  activeSortLabel = 'Priority',
  activeSortDescription = 'Ranks accounts by recommendation risk, next review timing, and exposure still outstanding.',
  searchScopeSummary = 'All trust accounts',
  selectedLedgerAccount = null,
  focusActions = [],
} = {}) {
  return [
    buildLedgerScopeLensItem({
      value: `${pagination.total} account${pagination.total === 1 ? '' : 's'}`,
      helper: pagination.currentPage === pagination.lastPage
        ? `Showing ${orderedAccountsList.length} visible on this page.`
        : `Viewing page ${pagination.currentPage} of ${pagination.lastPage}.`,
      tone: 'slate',
    }),
    buildActiveViewLensItem({
      value: activeViewLabel,
      helper: searchScopeSummary,
      tone: 'amber',
    }),
    buildOrderingLensItem({
      value: activeSortLabel,
      helper: activeSortDescription,
      tone: 'sky',
    }),
    {
      ...buildFocusLensItem({
        label: 'Current focus',
        value: selectedLedgerAccount ? 'Selected account' : 'Browse ledger',
        helper: joinFinanceLensParts([
          selectedLedgerAccount?.customer?.name || (selectedLedgerAccount ? 'Selected customer' : null),
          selectedLedgerAccount?.recommendation?.risk_level ? `${selectedLedgerAccount.recommendation.risk_level} risk` : null,
        ]) || 'No account selected',
        tone: 'violet',
      }),
      actions: focusActions,
    },
  ];
}

export function createTrustFundStatementSummary(transactions = []) {
  return transactions.reduce((totals, transaction) => {
    const amount = Math.abs(Number(transaction.amount || 0));

    if (transaction.type === 'draw') {
      totals.totalDrawn += amount;
    }

    if (transaction.type === 'repayment') {
      totals.totalRecovered += amount;
    }

    if (!totals.lastActivityDate) {
      totals.lastActivityDate = transaction.transaction_date || null;
    }

    return totals;
  }, {
    totalDrawn: 0,
    totalRecovered: 0,
    lastActivityDate: null,
  });
}

export function mapTrustFundStatementExportRow(transaction) {
  return {
    date: formatShortDate(transaction.transaction_date, 'No activity yet'),
    activity: transaction.type === 'draw' ? 'Draw released' : 'Repayment received',
    amount: formatCurrencyNGN(Math.abs(transaction.amount)),
    balance_after: formatCurrencyNGN(transaction.balance_after),
    reference: transaction.reference || 'No narration',
  };
}

export function buildTrustFundStatementPrintSummary(statementSummary) {
  return [
    { label: 'Drawn', value: formatCurrencyNGN(statementSummary.totalDrawn) },
    { label: 'Recovered', value: formatCurrencyNGN(statementSummary.totalRecovered) },
    { label: 'Last Activity', value: formatShortDate(statementSummary.lastActivityDate, 'No activity yet') },
  ];
}

export function buildTrustFundStatementPanelSummaryItems(statementSummary) {
  return [
    { label: 'Drawn', value: formatCurrencyNGN(statementSummary.totalDrawn), tone: 'amber' },
    { label: 'Recovered', value: formatCurrencyNGN(statementSummary.totalRecovered), tone: 'emerald' },
    { label: 'Last Activity', value: formatShortDate(statementSummary.lastActivityDate, 'No activity yet'), tone: 'slate' },
  ];
}

export function mapTrustFundStatementPanelEntries(transactions = []) {
  return transactions.map((transaction) => ({
    ...transaction,
    balanceAfter: formatCurrencyNGN(transaction.balance_after),
  }));
}

export function getTrustFundStatementEntryTitle(transaction) {
  return transaction?.type === 'draw' ? 'Draw released' : 'Repayment received';
}

export function getTrustFundStatementEntryMeta(transaction) {
  return `${transaction?.reference || 'No narration'} - ${formatShortDate(transaction?.transaction_date, 'No activity yet')}`;
}
