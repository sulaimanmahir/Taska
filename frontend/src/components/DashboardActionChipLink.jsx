import { Link } from 'react-router-dom';

const toneClasses = {
  violet: 'border-violet-100 bg-violet-50/10 text-violet-700 hover:border-violet-100 hover:bg-violet-50/15',
  amber: 'border-amber-100 bg-amber-50/10 text-amber-700 hover:border-amber-100 hover:bg-amber-50/15',
  emerald: 'border-emerald-100 bg-emerald-50/10 text-emerald-700 hover:border-emerald-100 hover:bg-emerald-50/15',
  sky: 'border-sky-100 bg-sky-50/10 text-sky-700 hover:border-sky-100 hover:bg-sky-50/15',
  rose: 'border-rose-100 bg-rose-50/10 text-rose-700 hover:border-rose-100 hover:bg-rose-50/15',
  slate: 'border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-700 hover:border-slate-300 hover:bg-white hover:text-slate-900',
};

export default function DashboardActionChipLink({
  to,
  label,
  tone = 'violet',
  className = '',
  ariaLabel,
}) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel || label}
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold shadow-[var(--shadow-sm)] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 ${toneClasses[tone] || toneClasses.violet} ${className}`.trim()}
    >
      {label}
    </Link>
  );
}
