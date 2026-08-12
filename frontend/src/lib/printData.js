function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function printStatementReport({
  title,
  subtitle,
  summary = [],
  columns,
  rows,
}) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=960,height=720');

  if (!printWindow) {
    return false;
  }

  const summaryMarkup = summary.length > 0
    ? `
      <section class="summary-grid">
        ${summary.map((item) => `
          <div class="summary-card">
            <p class="summary-label">${escapeHtml(item.label)}</p>
            <p class="summary-value">${escapeHtml(item.value)}</p>
          </div>
        `).join('')}
      </section>
    `
    : '';

  const tableHead = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('');
  const tableRows = rows.map((row) => `
    <tr>
      ${columns.map((column) => `<td>${escapeHtml(row[column.key])}</td>`).join('')}
    </tr>
  `).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          :root {
            color-scheme: light;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 32px;
            font-family: Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
          }

          h1 {
            margin: 0;
            font-size: 28px;
          }

          .subtitle {
            margin: 8px 0 0;
            color: #475569;
            font-size: 14px;
            line-height: 1.6;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
            margin: 24px 0;
          }

          .summary-card {
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 16px;
            background: #f8fafc;
          }

          .summary-label {
            margin: 0;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #64748b;
          }

          .summary-value {
            margin: 10px 0 0;
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }

          th,
          td {
            border-bottom: 1px solid #e2e8f0;
            padding: 12px 10px;
            text-align: left;
            vertical-align: top;
            font-size: 13px;
          }

          th {
            background: #f8fafc;
            color: #475569;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
          }

          .brand-footer {
            margin-top: 32px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            gap: 8px;
            color: #94a3b8;
            font-size: 11px;
          }

          .brand-footer svg {
            flex-shrink: 0;
          }

          .brand-footer strong {
            color: #6d28d9;
            font-weight: 700;
          }

          @media print {
            body {
              padding: 18px;
            }
          }
        </style>
      </head>
      <body>
        <header>
          <h1>${escapeHtml(title)}</h1>
          <p class="subtitle">${escapeHtml(subtitle)}</p>
        </header>
        ${summaryMarkup}
        <table>
          <thead>
            <tr>${tableHead}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <footer class="brand-footer">
          <svg width="14" height="14" viewBox="0 0 48 46" aria-hidden="true">
            <path fill="#6D28D9" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" />
          </svg>
          <span>Generated with <strong>Taska</strong> - ${escapeHtml(new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }))}</span>
        </footer>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();

  return true;
}
