import { useId } from 'react';

export default function PageHero({
  eyebrow,
  title,
  description,
  actions,
  aside,
  className = '',
  actionsAriaLabel = 'Page actions',
}) {
  const heroTitleId = useId();
  const heroDescriptionId = useId();

  return (
    <section
      aria-labelledby={heroTitleId}
      aria-describedby={description ? heroDescriptionId : undefined}
      className={`rounded-[var(--card-radius)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-[var(--card-padding)] py-[var(--card-padding)] shadow-[var(--shadow-sm)] ${className}`.trim()}
    >
      <div className="flex flex-col gap-[var(--page-header-gap)] xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-brand)]">{eyebrow}</p>
          ) : null}
          <h1 id={heroTitleId} className="mt-2 text-[var(--heading-page)] font-bold leading-[1.08] text-[var(--color-text)]">{title}</h1>
          {description ? (
            <p id={heroDescriptionId} className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-text-muted)]">{description}</p>
          ) : null}
        </div>
        {actions || aside ? (
          <div className="flex flex-col gap-3 xl:items-end">
            {actions ? <div className="flex flex-wrap gap-3" role="group" aria-label={actionsAriaLabel}>{actions}</div> : null}
            {aside ? <div className="text-sm text-[var(--color-text-muted)]">{aside}</div> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
