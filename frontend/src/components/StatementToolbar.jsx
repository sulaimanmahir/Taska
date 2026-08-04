export default function StatementToolbar({
  onPrint,
  onExport,
  datePresets = [],
  activeDatePreset = 'all',
  onDatePresetChange,
  activityViews = [],
  activeActivityView = 'all',
  activityCounts = {},
  onActivityViewChange,
  dateRange = { start: '', end: '' },
  onDateChange,
  activeViewLabel = 'All activity',
  dateSummary = 'All time',
  showReset = false,
  onReset,
  accent = 'slate',
  actionsAriaLabel = 'Statement actions',
  datePresetsAriaLabel = 'Statement date presets',
  activityFiltersAriaLabel = 'Statement activity filters',
  printAriaLabel = 'Print the current filtered statement',
  exportAriaLabel = 'Export the current filtered statement to CSV',
}) {
  const activeChipClass = accent === 'violet'
    ? 'border border-violet-100 bg-violet-100 text-violet-900 shadow-[var(--shadow-sm)]'
    : accent === 'amber'
      ? 'border border-amber-100 bg-amber-100 text-amber-900 shadow-[var(--shadow-sm)]'
      : 'border border-slate-300 bg-slate-200 text-slate-950 shadow-[var(--shadow-sm)]';
  const resetClass = accent === 'violet'
    ? 'font-semibold text-violet-700 transition hover:text-violet-800'
    : accent === 'amber'
      ? 'font-semibold text-amber-700 transition hover:text-amber-800'
    : 'font-semibold text-slate-900 transition hover:text-slate-700';
  const focusRingClass = accent === 'violet'
    ? 'focus-visible:ring-violet-200'
    : accent === 'amber'
      ? 'focus-visible:ring-amber-200'
      : 'focus-visible:ring-slate-200';
  const fieldClasses = accent === 'violet'
    ? {
      sectionLabel: 'text-violet-700',
      input: 'border-violet-100 bg-violet-50/5 focus:border-violet-300 focus:ring-violet-100',
      status: 'border-violet-100 bg-linear-to-r from-violet-50 via-white to-slate-50',
      statusText: 'text-violet-700',
    }
    : accent === 'amber'
      ? {
        sectionLabel: 'text-amber-700',
        input: 'border-amber-100 bg-amber-50/5 focus:border-amber-300 focus:ring-amber-100',
        status: 'border-amber-100 bg-linear-to-r from-amber-50 via-white to-slate-50',
        statusText: 'text-amber-700',
      }
      : {
        sectionLabel: 'text-slate-500',
        input: 'border-slate-200 bg-[var(--color-surface-subtle)] focus:border-slate-300 focus:ring-slate-100',
        status: 'border-slate-200/80 bg-[var(--color-surface-subtle)]',
        statusText: 'text-slate-700',
      };
  const actionButtonClass = `rounded-[var(--field-radius)] border border-slate-200/80 bg-[var(--color-surface-subtle)] px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-[var(--shadow-sm)] transition hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${focusRingClass}`;
  const inactiveChipClass = 'border border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-600 shadow-[var(--shadow-sm)] hover:border-slate-300 hover:bg-white';

  return (
    <>
      <div className="grid gap-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label={actionsAriaLabel}>
          <button
            type="button"
            onClick={onPrint}
            disabled={!onPrint}
            aria-label={printAriaLabel}
            className={actionButtonClass}
          >
            Print statement
          </button>
          <button
            type="button"
            onClick={onExport}
            disabled={!onExport}
            aria-label={exportAriaLabel}
            className={actionButtonClass}
          >
            Export CSV
          </button>
        </div>

        <div>
          <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.18em] ${fieldClasses.sectionLabel}`}>Date window</p>
          <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label={datePresetsAriaLabel}>
            {datePresets.map((preset) => {
              const isActive = activeDatePreset === preset.id;
              return (
                <li key={preset.id}>
                  <button
                    type="button"
                    onClick={() => onDatePresetChange(preset.id)}
                    aria-pressed={isActive}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 ${focusRingClass} ${
                      isActive
                        ? activeChipClass
                        : inactiveChipClass
                    }`}
                  >
                    {preset.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.18em] ${fieldClasses.sectionLabel}`}>Activity type</p>
          <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label={activityFiltersAriaLabel}>
            {activityViews.map((view) => {
              const isActive = activeActivityView === view.id;
              const count = activityCounts[view.id] ?? 0;

              return (
                <li key={view.id}>
                  <button
                    type="button"
                    onClick={() => onActivityViewChange(view.id)}
                    aria-pressed={isActive}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 ${focusRingClass} ${
                      isActive
                        ? activeChipClass
                        : inactiveChipClass
                    }`}
                  >
                    {view.label} ({count})
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className={`mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] ${fieldClasses.sectionLabel}`}>Start date</span>
          <input
            type="date"
            value={dateRange.start}
            onChange={(event) => onDateChange('start', event.target.value)}
            className={`w-full rounded-[calc(var(--card-radius)-0.35rem)] border px-4 py-3 text-sm text-slate-700 transition focus:outline-none focus:ring-4 ${fieldClasses.input}`}
          />
        </label>
        <label className="block">
          <span className={`mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] ${fieldClasses.sectionLabel}`}>End date</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(event) => onDateChange('end', event.target.value)}
            className={`w-full rounded-[calc(var(--card-radius)-0.35rem)] border px-4 py-3 text-sm text-slate-700 transition focus:outline-none focus:ring-4 ${fieldClasses.input}`}
          />
        </label>
      </div>
      <div className={`flex flex-col gap-2 rounded-[var(--card-radius)] border px-4 py-3 text-sm text-slate-600 shadow-[var(--shadow-sm)] md:flex-row md:items-center md:justify-between ${fieldClasses.status}`} role="status" aria-live="polite">
        <p className={`leading-6 ${fieldClasses.statusText}`}>
          Viewing <span className="font-semibold text-slate-900">{activeViewLabel}</span> for <span className="font-semibold text-slate-900">{dateSummary}</span>
        </p>
        {showReset ? (
          <button
            type="button"
            onClick={onReset}
            className={`${resetClass} ${focusRingClass} rounded-full px-1 focus-visible:outline-none focus-visible:ring-4`}
          >
            Reset filters
          </button>
        ) : null}
      </div>
    </>
  );
}
