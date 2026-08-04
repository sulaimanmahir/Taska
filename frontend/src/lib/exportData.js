function escapeCsvValue(value) {
  const stringValue = String(value ?? '');
  const escapedValue = stringValue.replace(/"/g, '""');

  return /[",\n]/.test(escapedValue) ? `"${escapedValue}"` : escapedValue;
}

export function downloadCsv(filename, columns, rows) {
  const headerRow = columns.map((column) => escapeCsvValue(column.label)).join(',');
  const dataRows = rows.map((row) => columns.map((column) => escapeCsvValue(row[column.key])).join(','));
  const csvContent = [headerRow, ...dataRows].join('\n');
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
