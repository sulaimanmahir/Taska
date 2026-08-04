import { useId } from 'react';
import { ResponsiveCardGrid } from './PageShell';

function DetailTile({ item }) {
  const titleId = useId();

  return (
    <li>
      <article
        aria-labelledby={titleId}
        className="rounded-[var(--card-radius)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-[var(--card-padding-sm)] shadow-[var(--shadow-sm)]"
      >
        <dl>
          <dt id={titleId} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{item.eyebrow}</dt>
          <dd className="mt-2 text-lg font-semibold text-slate-900">{item.title}</dd>
          <dd className="mt-1 text-sm text-slate-600">{item.description}</dd>
        </dl>
      </article>
    </li>
  );
}

export default function DashboardFinanceDetailTiles({
  items,
  className = 'mt-4 md:grid-cols-2',
  ariaLabel = 'Finance detail tiles',
}) {
  return (
    <ResponsiveCardGrid as="ul" variant="default" className={className} aria-label={ariaLabel}>
      {items.filter(Boolean).map((item) => (
        <DetailTile key={item.eyebrow} item={item} />
      ))}
    </ResponsiveCardGrid>
  );
}
