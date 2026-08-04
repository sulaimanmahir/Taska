import { useId } from 'react';

export default function OpsMetricCard({
  label,
  value,
  helper,
  tone = 'slate',
  className = '',
}) {
  const labelId = useId();
  const palettes = {
    slate: ['border-slate-200/80 bg-[var(--color-surface-subtle)]', 'text-slate-500'],
    violet: ['border-violet-100 bg-violet-50/10', 'text-violet-700'],
    emerald: ['border-emerald-100 bg-emerald-50/10', 'text-emerald-700'],
    amber: ['border-amber-100 bg-amber-50/10', 'text-amber-700'],
    orange: ['border-orange-100 bg-orange-50/10', 'text-orange-700'],
    sky: ['border-sky-100 bg-sky-50/10', 'text-sky-700'],
    cyan: ['border-cyan-100 bg-cyan-50/10', 'text-cyan-700'],
    blue: ['border-blue-100 bg-blue-50/10', 'text-blue-700'],
    indigo: ['border-indigo-100 bg-indigo-50/10', 'text-indigo-700'],
    fuchsia: ['border-fuchsia-100 bg-fuchsia-50/10', 'text-fuchsia-700'],
    rose: ['border-rose-100 bg-rose-50/10', 'text-rose-700'],
    lime: ['border-lime-100 bg-lime-50/10', 'text-lime-700'],
    teal: ['border-teal-100 bg-teal-50/10', 'text-teal-700'],
  };

  const [cardTone, labelTone] = palettes[tone] || palettes.slate;

  return (
    <article
      aria-labelledby={labelId}
      className={`min-h-[108px] rounded-[var(--card-radius)] border p-[var(--card-padding)] shadow-[var(--shadow-sm)] ${cardTone} ${className}`.trim()}
    >
      <dl>
        <dt id={labelId} className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${labelTone}`}>{label}</dt>
        <dd className="mt-2.5 text-[clamp(1.65rem,0.75vw+1.25rem,2.15rem)] font-bold leading-tight text-[var(--color-text)]">{value}</dd>
        {helper ? <dd className="mt-2 text-sm text-[var(--color-text-soft)]">{helper}</dd> : null}
      </dl>
    </article>
  );
}
