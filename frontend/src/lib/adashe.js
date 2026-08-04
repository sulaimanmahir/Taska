import { formatCurrencyNGN, formatShortDate } from './financeFormatters.js';
import {
  buildActiveViewLensItem,
  buildLedgerScopeLensItem,
  buildOrderingLensItem,
  joinFinanceLensParts,
} from './financeLensItems.js';

const riskPriority = {
  high: 0,
  medium: 1,
  low: 2,
};

function isDueNow(account) {
  if (!account?.next_due_date) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextDue = new Date(account.next_due_date);
  nextDue.setHours(0, 0, 0, 0);

  return nextDue <= today && Number(account?.balance || 0) < Number(account?.limit || 0);
}

export function sortAdasheAccounts(accounts = [], activeSort = 'priority') {
  return [...accounts].sort((left, right) => {
    if (activeSort === 'newest') {
      return new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime();
    }

    if (activeSort === 'largest_target') {
      return Number(right.limit || 0) - Number(left.limit || 0);
    }

    if (activeSort === 'largest_balance') {
      return Number(right.balance || 0) - Number(left.balance || 0);
    }

    const leftRisk = riskPriority[left?.recommendation?.risk_level] ?? 3;
    const rightRisk = riskPriority[right?.recommendation?.risk_level] ?? 3;

    if (leftRisk !== rightRisk) {
      return leftRisk - rightRisk;
    }

    const leftDueNow = isDueNow(left);
    const rightDueNow = isDueNow(right);

    if (leftDueNow !== rightDueNow) {
      return leftDueNow ? -1 : 1;
    }

    const leftDueDate = left?.next_due_date ? new Date(left.next_due_date).getTime() : Number.MAX_SAFE_INTEGER;
    const rightDueDate = right?.next_due_date ? new Date(right.next_due_date).getTime() : Number.MAX_SAFE_INTEGER;

    if (leftDueDate !== rightDueDate) {
      return leftDueDate - rightDueDate;
    }

    return Number(right.balance || 0) - Number(left.balance || 0);
  });
}

export function buildAdasheLedgerLensItems({
  pagination = { total: 0, from: 0, to: 0, currentPage: 1, lastPage: 1 },
  activeViewLabel = 'All cycles',
  activeSortLabel = 'Priority',
  activeSortDescription = 'Ranks cycles by recommendation risk, due-now urgency, and the nearest collection date.',
  searchScopeSummary = 'All member cycles',
  selectedAccount = null,
  focusActions = [],
} = {}) {
  return [
    buildLedgerScopeLensItem({
      value: `${pagination.total} cycles`,
      helper: `Showing ${pagination.from}-${pagination.to} on page ${pagination.currentPage} of ${pagination.lastPage}.`,
      tone: 'violet',
    }),
    buildActiveViewLensItem({
      value: activeViewLabel,
      helper: searchScopeSummary,
      tone: 'emerald',
    }),
    buildOrderingLensItem({
      value: activeSortLabel,
      helper: activeSortDescription,
      tone: 'amber',
    }),
    {
      label: selectedAccount ? 'Selected cycle' : 'Current focus',
      value: selectedAccount
        ? joinFinanceLensParts([selectedAccount.customer?.name || 'Selected member', selectedAccount.cycle_name])
        : 'No cycle selected',
      helper: selectedAccount
        ? `Next due ${formatShortDate(selectedAccount.next_due_date, 'No due date set')}`
        : 'Choose a member cycle to open the collection desk and statement.',
      tone: 'slate',
      actions: focusActions,
    },
  ];
}

export function createAdasheStatementSummary(transactions = []) {
  return transactions.reduce((totals, transaction) => {
    const amount = Math.abs(Number(transaction.amount || 0));

    if (transaction.type === 'draw') {
      totals.totalCollected += amount;
    }

    if (transaction.type === 'repayment') {
      totals.totalPaidOut += amount;
    }

    if (!totals.lastActivityDate) {
      totals.lastActivityDate = transaction.transaction_date || null;
    }

    return totals;
  }, {
    totalCollected: 0,
    totalPaidOut: 0,
    lastActivityDate: null,
  });
}

export function mapAdasheStatementExportRow(transaction) {
  return {
    date: formatShortDate(transaction.transaction_date, 'No activity yet'),
    activity: transaction.type === 'draw' ? 'Contribution collected' : 'Payout recorded',
    amount: formatCurrencyNGN(Math.abs(transaction.amount)),
    balance_after: formatCurrencyNGN(transaction.balance_after),
    reference: transaction.reference || 'No narration',
  };
}

export function buildAdasheStatementPanelSummaryItems(statementSummary) {
  return [
    { label: 'Collected', value: formatCurrencyNGN(statementSummary.totalCollected), tone: 'emerald' },
    { label: 'Paid Out', value: formatCurrencyNGN(statementSummary.totalPaidOut), tone: 'amber' },
    { label: 'Last Activity', value: formatShortDate(statementSummary.lastActivityDate, 'No activity yet'), tone: 'slate' },
  ];
}

export function buildAdasheStatementPrintSummary(statementSummary) {
  return [
    { label: 'Collected', value: formatCurrencyNGN(statementSummary.totalCollected) },
    { label: 'Paid Out', value: formatCurrencyNGN(statementSummary.totalPaidOut) },
    { label: 'Last Activity', value: formatShortDate(statementSummary.lastActivityDate, 'No activity yet') },
  ];
}

export function mapAdasheStatementPanelEntries(transactions = []) {
  return transactions.map((transaction) => ({
    ...transaction,
    balanceAfter: formatCurrencyNGN(transaction.balance_after),
  }));
}

export function getAdasheStatementEntryTitle(transaction) {
  return transaction?.type === 'draw' ? 'Contribution collected' : 'Payout recorded';
}

export function getAdasheStatementEntryMeta(transaction) {
  return `${transaction?.reference || 'No narration'} - ${formatShortDate(transaction?.transaction_date, 'No activity yet')}`;
}
