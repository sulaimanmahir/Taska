export default function Card({ children, className = '', padding = true, hover = false, as: componentTag = 'div', ...props }) {
  const CardTag = componentTag;

  return (
    <CardTag
      {...props}
      className={`
      rounded-[var(--card-radius)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]
      ${padding ? 'p-[var(--card-padding)]' : ''}
      ${hover ? 'transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-md)]' : 'shadow-[var(--shadow-sm)]'}
      ${className}
    `}
    >
      {children}
    </CardTag>
  );
}

export function CardHeader({ title, subtitle, action, className = '', titleId, subtitleId, actionLabel = 'Card actions' }) {
  return (
    <div className={`mb-4 flex items-start justify-between gap-4 ${className}`}>
      <div>
        {subtitle ? <p id={subtitleId} className="mb-1 text-xs font-medium leading-5 text-[var(--color-text-muted)]">{subtitle}</p> : null}
        <h3 id={titleId} className="text-[clamp(1.05rem,0.4vw+0.98rem,1.18rem)] font-bold leading-tight text-[var(--color-text)]">{title}</h3>
      </div>
      {action ? <div role="group" aria-label={actionLabel}>{action}</div> : null}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}
