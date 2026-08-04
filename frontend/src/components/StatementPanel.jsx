import { useId } from 'react';
import EmptyState from './EmptyState';
import StatementActivityList from './StatementActivityList';
import StatementSummaryCards from './StatementSummaryCards';
import StatementToolbar from './StatementToolbar';

export default function StatementPanel({
  summaryItems = [],
  toolbarProps,
  navigationActions = [],
  entries = [],
  showAll = false,
  onToggleShowAll,
  renderTitle,
  renderMeta,
  renderAmount,
  emptyState,
  recentCount = 8,
  accent = 'slate',
  shortcutsAriaLabel = 'Statement shortcuts',
  sectionTitle = 'Statement overview',
}) {
  const sectionTitleId = useId();
  const shortcutsTitleId = useId();

  const accentClasses = {
    slate: {
      actionActive: 'border-slate-300 bg-slate-200 text-slate-950',
      actionInactive: 'border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-700 hover:border-slate-300 hover:bg-white',
      actionWrap: 'border-slate-200/80 bg-[var(--color-surface-subtle)] shadow-[var(--shadow-sm)]',
      actionEyebrow: 'text-slate-500',
      focusRing: 'focus-visible:ring-slate-200',
      emptyClass: 'rounded-[var(--card-radius)] border border-slate-200/80 bg-linear-to-br from-white via-slate-50 to-slate-100/80 shadow-[var(--shadow-sm)]',
    },
    violet: {
      actionActive: 'border-violet-100 bg-violet-100 text-violet-900',
      actionInactive: 'border-violet-100 bg-[var(--color-surface-subtle)] text-violet-700 shadow-[var(--shadow-sm)] hover:border-violet-200 hover:bg-violet-50/10',
      actionWrap: 'border-violet-100 bg-linear-to-r from-violet-50 via-white to-slate-50 shadow-[var(--shadow-sm)]',
      actionEyebrow: 'text-violet-700',
      focusRing: 'focus-visible:ring-violet-200',
      emptyClass: 'rounded-[var(--card-radius)] border border-violet-100 bg-linear-to-br from-violet-50 via-white to-slate-50 shadow-[var(--shadow-sm)]',
    },
    amber: {
      actionActive: 'border-amber-100 bg-amber-100 text-amber-900',
      actionInactive: 'border-amber-100 bg-[var(--color-surface-subtle)] text-amber-700 shadow-[var(--shadow-sm)] hover:border-amber-200 hover:bg-amber-50/10',
      actionWrap: 'border-amber-100 bg-linear-to-r from-amber-50 via-white to-slate-50 shadow-[var(--shadow-sm)]',
      actionEyebrow: 'text-amber-700',
      focusRing: 'focus-visible:ring-amber-200',
      emptyClass: 'rounded-[var(--card-radius)] border border-amber-100 bg-linear-to-br from-amber-50 via-white to-slate-50 shadow-[var(--shadow-sm)]',
    },
  };
  const palette = accentClasses[accent] || accentClasses.slate;

  return (
    <section aria-labelledby={sectionTitleId} className="space-y-5">
      <h2 id={sectionTitleId} className="sr-only">{sectionTitle}</h2>
      <StatementSummaryCards items={summaryItems} accent={accent} />
      <StatementToolbar {...toolbarProps} />
      {navigationActions.length > 0 ? (
        <section
          aria-labelledby={shortcutsTitleId}
          className={`rounded-[var(--card-radius)] border px-4 py-3 ${palette.actionWrap}`}
        >
          <h3
            id={shortcutsTitleId}
            className={`mb-3 text-xs font-semibold uppercase tracking-[0.18em] ${palette.actionEyebrow}`}
          >
            Statement shortcuts
          </h3>
          <ul className="flex flex-wrap gap-2" aria-label={shortcutsAriaLabel}>
            {navigationActions.map((action) => (
              <li key={action.label}>
                <button
                  type="button"
                  onClick={action.onClick}
                  aria-pressed={action.active ? 'true' : 'false'}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold shadow-[var(--shadow-sm)] transition focus-visible:outline-none focus-visible:ring-4 ${palette.focusRing} ${
                    action.active ? palette.actionActive : palette.actionInactive
                  }`}
                >
                  {action.label}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {entries.length > 0 ? (
        <StatementActivityList
          entries={entries}
          showAll={showAll}
          onToggleShowAll={onToggleShowAll}
          renderTitle={renderTitle}
          renderMeta={renderMeta}
          renderAmount={renderAmount}
          recentCount={recentCount}
          accent={accent}
        />
      ) : (
        <EmptyState
          tone={accent}
          className={palette.emptyClass}
          {...emptyState}
        />
      )}
    </section>
  );
}
