import { buttonClassName } from './buttonClassName';

export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  type,
  ...props
}) {
  const resolvedType = Component === 'button' ? (type || 'button') : undefined;

  return (
    <Component
      type={resolvedType}
      className={buttonClassName({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}
