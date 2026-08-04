import { useId } from 'react';

  const ACCENT_CLASSES = {
    slate: {
      focusRing: 'focus-visible:ring-slate-200',
      status: 'text-emerald-700',
      hint: 'text-slate-500',
      panel: 'border-slate-200/80 bg-[var(--color-surface-subtle)] shadow-[var(--shadow-sm)]',
      item: 'border-slate-200/80 from-white via-slate-50 to-slate-100/80 shadow-[var(--shadow-sm)]',
      badge: 'border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-500 shadow-[var(--shadow-sm)]',
      amountBox: 'border-slate-200/80 bg-[var(--color-surface-subtle)] shadow-[var(--shadow-sm)]',
      eyebrow: 'text-slate-500',
    modeChip: 'border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-700 shadow-[var(--shadow-sm)]',
    footerButton: 'border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-700 hover:border-slate-300 hover:bg-white',
    footerHint: 'text-slate-500',
  },
    violet: {
      focusRing: 'focus-visible:ring-violet-200',
      status: 'text-violet-700',
      hint: 'text-violet-700/80',
      panel: 'border-violet-100 bg-linear-to-r from-violet-50 via-white to-slate-50 shadow-[var(--shadow-sm)]',
      item: 'border-violet-100 from-violet-50 via-white to-slate-50 shadow-[var(--shadow-sm)]',
      badge: 'border-violet-100 bg-violet-50/10 text-violet-700 shadow-[var(--shadow-sm)]',
      amountBox: 'border-violet-100 bg-violet-50/25 shadow-[var(--shadow-sm)]',
      eyebrow: 'text-violet-700',
    modeChip: 'border-violet-100 bg-white/70 text-violet-700 shadow-[var(--shadow-sm)]',
    footerButton: 'border-violet-100 bg-[var(--color-surface-subtle)] text-violet-700 hover:border-violet-200 hover:bg-violet-50/10',
    footerHint: 'text-violet-700/80',
  },
    amber: {
      focusRing: 'focus-visible:ring-amber-200',
      status: 'text-amber-700',
      hint: 'text-amber-700/80',
      panel: 'border-amber-100 bg-linear-to-r from-amber-50 via-white to-slate-50 shadow-[var(--shadow-sm)]',
      item: 'border-amber-100 from-amber-50 via-white to-slate-50 shadow-[var(--shadow-sm)]',
      badge: 'border-amber-100 bg-amber-50/10 text-amber-700 shadow-[var(--shadow-sm)]',
      amountBox: 'border-amber-100 bg-amber-50/25 shadow-[var(--shadow-sm)]',
      eyebrow: 'text-amber-700',
    modeChip: 'border-amber-100 bg-white/70 text-amber-700 shadow-[var(--shadow-sm)]',
    footerButton: 'border-amber-100 bg-[var(--color-surface-subtle)] text-amber-700 hover:border-amber-200 hover:bg-amber-50/10',
    footerHint: 'text-amber-700/80',
  },
};

function formatEntryCount(count) {
  return `entr${count === 1 ? 'y' : 'ies'}`;
}

function getModeLabel({ entriesLength, hiddenCount, recentCount, showAll }) {
  if (entriesLength === 0) {
    return 'No entries';
  }

  if (hiddenCount === 0) {
    return 'All visible';
  }

  if (showAll) {
    return 'Full history';
  }

  return `Window ${Math.min(recentCount, entriesLength)}`;
}

function getVisibleWindowSummary({ entriesLength, visibleStart, visibleEnd }) {
  if (entriesLength === 0) {
    return 'No statement entries in the current window';
  }

  return `Visible window ${visibleStart} - ${visibleEnd} out of ${entriesLength} entries`;
}

function getVisibilityStatus({ entriesLength, hiddenCount, showAll }) {
  if (hiddenCount > 0) {
    return showAll
      ? 'Full statement history is currently open'
      : `${hiddenCount} additional ${formatEntryCount(hiddenCount)} remain hidden`;
  }

  return entriesLength > 0
    ? 'Full statement window visible'
    : 'No statement entries in the current window';
}

function normalizeStringValue(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function splitEntryMeta(renderedMeta) {
  const normalizedMeta = normalizeStringValue(renderedMeta);

  if (!normalizedMeta) {
    return { primaryMeta: 'No details available', secondaryMeta: null };
  }

  if (typeof normalizedMeta !== 'string') {
    return { primaryMeta: normalizedMeta, secondaryMeta: null };
  }

  const metaDividerIndex = normalizedMeta.lastIndexOf(' - ');

  if (metaDividerIndex < 0) {
    return { primaryMeta: normalizedMeta, secondaryMeta: null };
  }

  const secondaryMeta = normalizedMeta.slice(metaDividerIndex + 3).trim();

  return {
    primaryMeta: normalizedMeta.slice(0, metaDividerIndex),
    secondaryMeta: secondaryMeta || null,
  };
}

function getEntryTitle(entryTitle) {
  return normalizeStringValue(entryTitle) || 'Activity entry';
}

function getEntryAmount(entryAmount) {
  return normalizeStringValue(entryAmount) || 'Amount unavailable';
}

function getBalanceAfterLabel(entry) {
  return normalizeStringValue(entry?.balanceAfter) || 'Unavailable';
}

function getEntryMeta(entryMeta) {
  return splitEntryMeta(entryMeta);
}

function renderVisibleWindowSummary({ entriesLength, visibleStart, visibleEnd }) {
  if (entriesLength === 0) {
    return 'No statement entries in the current window';
  }

  return (
    <>
      Visible window <span className="font-semibold text-slate-900">{visibleStart}</span>
      {' '}-{' '}
      <span className="font-semibold text-slate-900">{visibleEnd}</span>
      {' '}out of{' '}
      <span className="font-semibold text-slate-900">{entriesLength}</span> entries
    </>
  );
}

export default function StatementActivityList({
  entries = [],
  showAll = false,
  onToggleShowAll,
  renderTitle = (entry) => entry?.title ?? 'Activity entry',
  renderMeta = (entry) => entry?.meta ?? entry?.reference ?? 'No details available',
  renderAmount = (entry) => entry?.amount ?? 'Amount unavailable',
  recentCount = 8,
  accent = 'slate',
  listAriaLabel = 'Statement activity entries',
  sectionTitle = 'Activity ledger',
  getToggleLabel,
}) {
  const listId = useId();
  const headingId = useId();
  const summaryId = useId();
  const footerHintId = useId();
  const visibleEntries = showAll ? entries : entries.slice(0, recentCount);
  const hiddenCount = Math.max(entries.length - visibleEntries.length, 0);
  const visibleStart = visibleEntries.length > 0 ? 1 : 0;
  const visibleEnd = visibleEntries.length;
  const modeLabel = getModeLabel({
    entriesLength: entries.length,
    hiddenCount,
    recentCount,
    showAll,
  });
  const visibleWindowSummary = getVisibleWindowSummary({
    entriesLength: entries.length,
    visibleStart,
    visibleEnd,
  });
  const visibilityStatus = getVisibilityStatus({
    entriesLength: entries.length,
    hiddenCount,
    showAll,
  });
  const defaultToggleLabel = showAll ? `Show current ${recentCount}-entry window` : `View all ${entries.length} entries`;
  const toggleLabel = getToggleLabel
    ? getToggleLabel({ showAll, recentCount, entriesLength: entries.length, hiddenCount })
    : defaultToggleLabel;
  const toggleDescription = showAll
    ? 'Collapse back to the current statement window.'
    : `Expand to reveal ${hiddenCount} additional ${formatEntryCount(hiddenCount)}.`;
  const palette = ACCENT_CLASSES[accent] || ACCENT_CLASSES.slate;

  return (
    <section className="space-y-4" aria-labelledby={headingId} aria-describedby={summaryId}>
      <div className={`flex flex-col gap-2 rounded-[var(--card-radius)] border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${palette.panel}`}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 id={headingId} className={`text-xs font-semibold uppercase tracking-[0.18em] ${palette.eyebrow}`}>
              {sectionTitle}
            </h3>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${palette.modeChip}`}>
              {modeLabel}
            </span>
          </div>
          <p id={summaryId} className="mt-1 text-sm text-slate-600">
            {renderVisibleWindowSummary({
              entriesLength: entries.length,
              visibleStart,
              visibleEnd,
            })}
          </p>
        </div>
        <div role="status" aria-live="polite" aria-atomic="true">
          <p className={`text-xs font-medium ${hiddenCount > 0 ? palette.hint : palette.status}`}>
            {visibilityStatus}
          </p>
          <span className="sr-only">{visibleWindowSummary}</span>
        </div>
      </div>
      <ol id={listId} aria-label={listAriaLabel} className="space-y-3">
        {visibleEntries.map((entry, index) => {
          const entryTitle = getEntryTitle(renderTitle(entry));
          const entryAmount = getEntryAmount(renderAmount(entry));
          const { primaryMeta, secondaryMeta } = getEntryMeta(renderMeta(entry));
          const balanceAfterLabel = getBalanceAfterLabel(entry);
          const itemTitleId = `${listId}-title-${index}`;
          const itemPositionId = `${listId}-position-${index}`;
          const itemMetaId = `${listId}-meta-${index}`;
          const itemBalanceId = `${listId}-balance-${index}`;

          return (
            <li
              key={entry.id ?? `${entry.transaction_date ?? 'entry'}-${entry.reference ?? 'activity'}-${index}`}
              aria-posinset={index + 1}
              aria-setsize={visibleEntries.length}
              className={`rounded-[var(--card-radius)] border bg-linear-to-br ${palette.item}`}
            >
              <article
                aria-labelledby={itemTitleId}
                aria-describedby={`${itemPositionId} ${itemMetaId} ${itemBalanceId}`}
                className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:p-5"
              >
                <div className="flex items-start gap-3">
                  <div
                    aria-hidden="true"
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-xs font-semibold tabular-nums ${palette.badge}`}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <p id={itemPositionId} className="sr-only">
                      Statement entry {index + 1} of {visibleEntries.length}
                    </p>
                    <h4 id={itemTitleId} className="font-semibold text-slate-900">{entryTitle}</h4>
                    <div id={itemMetaId} className="mt-1 flex flex-wrap items-center gap-2">
                      {typeof primaryMeta === 'string' ? (
                        <p className={`text-sm leading-6 ${palette.hint}`}>{primaryMeta}</p>
                      ) : (
                        <div className={`text-sm leading-6 ${palette.hint}`}>{primaryMeta}</div>
                      )}
                      {secondaryMeta ? (
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${palette.modeChip}`}>
                          {secondaryMeta}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className={`rounded-[calc(var(--card-radius)-0.35rem)] border px-4 py-3 text-left shadow-[var(--shadow-sm)] md:min-w-[220px] md:text-right ${palette.amountBox}`}>
                  <dl className="space-y-2">
                    <div>
                      <dt className={`text-xs font-semibold uppercase tracking-[0.18em] ${palette.eyebrow}`}>Amount</dt>
                      <dd className="mt-1 text-base font-semibold tabular-nums">{entryAmount}</dd>
                    </div>
                    <div id={itemBalanceId} className={`text-sm ${palette.hint}`}>
                      <dt className="sr-only">Running balance</dt>
                      <dd>
                        Running balance <span className="font-medium text-slate-700 tabular-nums">{balanceAfterLabel}</span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
      {entries.length > recentCount ? (
        <button
          type="button"
          onClick={onToggleShowAll}
          aria-expanded={showAll}
          aria-controls={listId}
          aria-describedby={footerHintId}
          aria-label={showAll
            ? `Collapse statement activity to the current ${recentCount}-entry window`
            : `Expand statement activity to show all ${entries.length} entries`}
          className={`w-full rounded-[var(--card-radius)] border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-4 ${palette.focusRing} ${palette.footerButton}`}
        >
          <span className="flex items-center justify-between gap-3">
            <span>
              <span className="block text-sm font-semibold">{toggleLabel}</span>
              <span id={footerHintId} className={`mt-1 block text-xs font-medium ${palette.footerHint}`}>
                {toggleDescription}
              </span>
            </span>
            <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-current/10 bg-[var(--color-surface-subtle)]"
              aria-hidden="true"
            >
              <svg
                className={`h-4 w-4 transition-transform ${showAll ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </span>
        </button>
      ) : null}
    </section>
  );
}
