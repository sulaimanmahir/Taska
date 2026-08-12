const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-all duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100';

const sizeStyles = {
  sm: 'h-10 px-3.5',
  md: 'h-11 px-4.5',
  lg: 'h-12 px-5',
};

const variantStyles = {
  // Brand primary per the Taska Design Constitution (docs/TASKA_DESIGN_CONSTITUTION.md
  // §4): purple is reserved for primary actions - this was previously a generic
  // slate grey, meaning the whole app's primary CTA never actually used the brand
  // colour despite every page relying on this default.
  primary: 'bg-[var(--color-brand)] text-white shadow-[var(--shadow-sm)] hover:bg-[var(--color-brand-strong)]',
  secondary: 'border border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-700 shadow-[var(--shadow-sm)] hover:border-slate-300 hover:bg-white',
  ghost: 'border border-transparent bg-transparent text-slate-600 hover:border-slate-200/80 hover:bg-[var(--color-surface-subtle)] hover:text-slate-900',
  dangerOutline: 'border border-rose-100 bg-rose-50/10 text-rose-600 shadow-[var(--shadow-sm)] hover:bg-rose-50/15',
  textDanger: 'text-rose-600 hover:text-rose-700',
};

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
} = {}) {
  const widthClass = fullWidth ? 'w-full' : '';
  return [baseStyles, sizeStyles[size] || sizeStyles.md, variantStyles[variant] || variantStyles.primary, widthClass, className]
    .filter(Boolean)
    .join(' ');
}
