export default function LedgerFilterBar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search records',
  views = [],
  activeView = 'all',
  onViewChange,
  sortOptions = [],
  activeSort = 'priority',
  onSortChange,
  accent = 'slate',
  className = '',
  viewsAriaLabel = 'Ledger view filters',
}) {
  const activeChipClass = accent === 'violet'
    ? 'border border-violet-100 bg-violet-100 text-violet-900 shadow-[var(--shadow-sm)]'
    : 'border border-slate-300 bg-slate-200 text-slate-950 shadow-[var(--shadow-sm)]';
  const activeSortOption = sortOptions.find((option) => option.id === activeSort) ?? null;
  const inactiveChipClass = 'border border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-600 shadow-[var(--shadow-sm)] hover:border-slate-300 hover:bg-white';
  const controlClass = 'rounded-[var(--field-radius)] border border-slate-200/80 bg-[var(--color-surface-subtle)] text-sm text-slate-700 shadow-[var(--shadow-sm)]';

  return (
    <div className={className}>
      <div className="relative">
        <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label={searchPlaceholder}
          className={`w-full py-3 pl-11 pr-4 placeholder:text-slate-400 ${controlClass}`}
          placeholder={searchPlaceholder}
        />
      </div>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <ul className="flex flex-wrap gap-2" aria-label={viewsAriaLabel}>
          {views.map((view) => {
            const isActive = activeView === view.id;
            return (
              <li key={view.id}>
                <button
                  type="button"
                  onClick={() => onViewChange(view.id)}
                  aria-pressed={isActive}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 ${
                    isActive
                      ? activeChipClass
                      : inactiveChipClass
                  }`}
                >
                  {view.label}
                </button>
              </li>
            );
          })}
        </ul>
        {sortOptions.length > 0 && onSortChange ? (
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <span>Sort</span>
              <select
                value={activeSort}
                onChange={(event) => onSortChange(event.target.value)}
                aria-label="Ledger sort order"
                className="rounded-full border border-slate-200/80 bg-[var(--color-surface-subtle)] px-3 py-2 text-xs font-semibold normal-case tracking-normal text-slate-700 shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {activeSortOption?.description ? (
              <>
                <details className="w-full max-w-xs sm:hidden">
                  <summary className="cursor-pointer list-none text-xs font-medium text-slate-500 marker:hidden">
                    What this means
                  </summary>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {activeSortOption.description}
                  </p>
                </details>
                <p className="hidden max-w-xs text-xs text-slate-500 sm:block sm:text-right">
                  {activeSortOption.description}
                </p>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
