import { downloadCsv } from './exportData';
import { printStatementReport } from './printData';

const statementColumns = [
  { key: 'date', label: 'Date' },
  { key: 'activity', label: 'Activity' },
  { key: 'amount', label: 'Amount' },
  { key: 'balance_after', label: 'Balance After' },
  { key: 'reference', label: 'Reference' },
];

function slugifyReportName(value, fallback) {
  const slug = String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return slug || fallback;
}

export function exportStatementCsv({ filePrefix, accountName, fallbackName, rows }) {
  downloadCsv(
    `${filePrefix}-${slugifyReportName(accountName, fallbackName)}.csv`,
    statementColumns,
    rows,
  );
}

export function printStatement({
  title,
  subtitle,
  summary,
  rows,
}) {
  return printStatementReport({
    title,
    subtitle,
    summary,
    columns: statementColumns,
    rows,
  });
}
