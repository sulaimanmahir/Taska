import { useMemo } from 'react';
import { formatShortDate } from '../lib/financeFormatters';
import { matchesStatementDateRange } from '../lib/statementDateRange';

export function useStatementData({
  transactions = [],
  statementView = 'all',
  statementDateRange = { start: '', end: '' },
  createSummary,
  mapExportRow,
}) {
  const dateFilteredStatement = useMemo(() => transactions.filter((transaction) => matchesStatementDateRange(
    transaction.transaction_date,
    statementDateRange,
  )), [statementDateRange, transactions]);

  const statementCounts = useMemo(() => dateFilteredStatement.reduce((totals, transaction) => {
    totals.all += 1;
    if (transaction.type === 'draw') {
      totals.draw += 1;
    }
    if (transaction.type === 'repayment') {
      totals.repayment += 1;
    }

    return totals;
  }, {
    all: 0,
    draw: 0,
    repayment: 0,
  }), [dateFilteredStatement]);

  const filteredStatement = useMemo(() => {
    if (statementView === 'all') {
      return dateFilteredStatement;
    }

    return dateFilteredStatement.filter((transaction) => transaction.type === statementView);
  }, [dateFilteredStatement, statementView]);

  const statementSummary = useMemo(
    () => createSummary(dateFilteredStatement),
    [createSummary, dateFilteredStatement],
  );

  const statementExportRows = useMemo(
    () => filteredStatement.map((transaction) => mapExportRow(transaction)),
    [filteredStatement, mapExportRow],
  );

  const statementDateSummary = useMemo(() => {
    if (statementDateRange.start && statementDateRange.end) {
      return `${formatShortDate(statementDateRange.start)} to ${formatShortDate(statementDateRange.end)}`;
    }
    if (statementDateRange.start) {
      return `From ${formatShortDate(statementDateRange.start)}`;
    }
    if (statementDateRange.end) {
      return `Up to ${formatShortDate(statementDateRange.end)}`;
    }
    return 'All time';
  }, [statementDateRange.end, statementDateRange.start]);

  return {
    dateFilteredStatement,
    statementCounts,
    filteredStatement,
    statementSummary,
    statementExportRows,
    statementDateSummary,
  };
}
