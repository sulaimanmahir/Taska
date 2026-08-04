const FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'actionable', label: 'Actionable' },
];

export default function InsightGroupFilters({
  activeFilter,
  counts,
  onChange,
  ariaLabel = 'Insight filters',
}) {
  return (
    <ul className="mx-6 mb-4 flex flex-wrap items-center gap-2" aria-label={ariaLabel}>
      {FILTER_OPTIONS.map((option) => (
        <li key={option.key}>
          <button
            type="button"
            onClick={() => onChange(option.key)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              activeFilter === option.key
                ? 'border border-slate-300 bg-slate-200 text-slate-950 shadow-[var(--shadow-sm)]'
                : 'border border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-600 shadow-[var(--shadow-sm)] hover:border-slate-300 hover:bg-white hover:text-slate-900'
            }`}
            aria-pressed={activeFilter === option.key}
          >
            {option.label} {counts?.[option.key] ? `(${counts[option.key]})` : ''}
          </button>
        </li>
      ))}
    </ul>
  );
}
