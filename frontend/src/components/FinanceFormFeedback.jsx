export function FinanceFormError({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className="rounded-[calc(var(--card-radius)-0.35rem)] border border-rose-100 bg-rose-50/65 px-4 py-3 text-sm text-rose-700 shadow-[var(--shadow-sm)]"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {message}
    </div>
  );
}

export function FinanceFieldLabel({ label, hint, fieldId, hintId }) {
  const resolvedHintId = hint ? (hintId || (fieldId ? `${fieldId}-hint` : undefined)) : undefined;

  return (
    <div className="mb-1.5">
      <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700">{label}</label>
      {hint ? (
        <p id={resolvedHintId} className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function FinanceFormHint({ message, className = '', id }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className={`text-xs font-medium text-rose-600 ${className}`.trim()}>
      {message}
    </p>
  );
}

function reasonBadgeClasses(tone) {
  switch (tone) {
    case 'emerald':
      return 'border-emerald-100 bg-emerald-50/10 text-emerald-700';
    case 'amber':
      return 'border-amber-100 bg-amber-50/10 text-amber-700';
    case 'sky':
      return 'border-sky-100 bg-sky-50/10 text-sky-700';
    default:
      return 'border-violet-100 bg-violet-50/10 text-violet-700';
  }
}

export function FinanceReasonBadge({ label, tone = 'violet' }) {
  if (!label) {
    return null;
  }

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-[var(--shadow-sm)] ${reasonBadgeClasses(tone)}`}>
      {label}
    </span>
  );
}
