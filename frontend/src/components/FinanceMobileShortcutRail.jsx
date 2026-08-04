import { useId } from 'react';

function toneClasses(tone) {
  switch (tone) {
    case 'amber':
      return 'border-amber-100 bg-amber-50/10';
    case 'emerald':
      return 'border-emerald-100 bg-emerald-50/10';
    default:
      return 'border-violet-100 bg-violet-50/10';
  }
}

export default function FinanceMobileShortcutRail({
  title,
  subtitle,
  actions = [],
  activeActionLabel = null,
  tone = 'violet',
  shortcutsLabel,
}) {
  const titleId = useId();
  const subtitleId = useId();

  if (!actions.length) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-30 px-4 md:hidden">
      <section
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        className={`mx-auto max-w-xl rounded-[var(--card-radius)] border px-4 py-3 shadow-[var(--shadow-lg)] backdrop-blur ${toneClasses(tone)}`}
      >
        <div className="mb-3">
          <h2 id={titleId} className="text-sm font-semibold text-slate-900">{title}</h2>
          {subtitle ? (
            <p id={subtitleId} className="mt-1 text-xs text-slate-600">{subtitle}</p>
          ) : null}
        </div>
        <ul
          className="grid grid-cols-3 gap-2"
          aria-label={shortcutsLabel || `${title} shortcuts`}
        >
          {actions.map((action) => (
            <li key={action.label}>
              <button
                type="button"
                onClick={action.onClick}
                aria-pressed={activeActionLabel === action.label ? 'true' : 'false'}
                className={`rounded-[calc(var(--card-radius)-0.45rem)] border px-3 py-2 text-xs font-semibold shadow-[var(--shadow-sm)] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/80 ${
                  activeActionLabel === action.label
                    ? 'border-slate-300 bg-slate-200 text-slate-950'
                    : 'border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-700 hover:border-slate-300 hover:bg-white'
                }`}
              >
                {action.label}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
