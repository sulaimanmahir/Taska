const VARIANT_CLASS = {
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  info: 'badge-info',
  brand: 'badge-brand',
  neutral: 'badge-neutral',
};

export default function Badge({ variant = 'neutral', className = '', children, ...props }) {
  const variantClass = VARIANT_CLASS[variant] || VARIANT_CLASS.neutral;

  return (
    <span className={`badge ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}
