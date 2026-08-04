export default function ResultsPagination({
  currentPage = 1,
  lastPage = 1,
  from = 0,
  to = 0,
  total = 0,
  itemLabel = 'results',
  isFetching = false,
  sortLabel = '',
  onPrevious,
  onNext,
  className = '',
  ariaLabel = 'Pagination',
  previousLabel = 'Previous',
  nextLabel = 'Next',
  loadingLabel = 'Loading page...',
  idleLabel = 'Up to date',
  getRangeLabel,
  getPageLabel,
  getPreviousAriaLabel,
  getNextAriaLabel,
}) {
  if (lastPage <= 1) {
    return null;
  }

  const actionButtonClass = 'rounded-[var(--field-radius)] border border-slate-200/80 bg-[var(--color-surface-subtle)] px-4 py-2 text-sm font-medium text-slate-600 shadow-[var(--shadow-sm)] transition hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-50';

  const rangeLabel = getRangeLabel
    ? getRangeLabel({ from: from || 0, to: to || 0, total, itemLabel })
    : `Showing ${from || 0}-${to || 0} of ${total} ${itemLabel}`;
  const pageLabel = getPageLabel
    ? getPageLabel({ currentPage, lastPage })
    : `Page ${currentPage} of ${lastPage}`;
  const previousAriaLabel = getPreviousAriaLabel
    ? getPreviousAriaLabel({ itemLabel, currentPage, lastPage })
    : `Go to previous ${itemLabel} page`;
  const nextAriaLabel = getNextAriaLabel
    ? getNextAriaLabel({ itemLabel, currentPage, lastPage })
    : `Go to next ${itemLabel} page`;

  return (
    <nav
      aria-label={ariaLabel}
      className={`flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${className}`.trim()}
    >
      <p className="text-sm text-slate-500" aria-live="polite" aria-atomic="true">
        {rangeLabel}
      </p>
      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        {sortLabel ? (
          <span className="rounded-full border border-slate-200/80 bg-[var(--color-surface-subtle)] px-3 py-1 text-xs font-semibold text-slate-600 shadow-[var(--shadow-sm)]">
            Sorted by {sortLabel}
          </span>
        ) : null}
        <div className="min-w-[96px] text-sm text-slate-500" role="status" aria-live="polite" aria-atomic="true">
          {isFetching ? (
            <span className="inline-flex items-center gap-2 font-medium text-violet-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-violet-200" />
              {loadingLabel}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-200" />
              {idleLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onPrevious}
            disabled={currentPage <= 1}
            aria-label={previousAriaLabel}
            className={actionButtonClass}
          >
            {previousLabel}
          </button>
          <span className="text-sm text-slate-500" aria-live="polite" aria-atomic="true">
            {pageLabel}
          </span>
          <button
            type="button"
            onClick={onNext}
            disabled={currentPage >= lastPage}
            aria-label={nextAriaLabel}
            className={actionButtonClass}
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </nav>
  );
}
