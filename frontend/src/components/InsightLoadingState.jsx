import Card from './Card';
import { ResponsiveCardGrid } from './PageShell';

function InsightSkeletonCard() {
  return (
    <Card aria-hidden="true">
      <div className="animate-pulse space-y-4">
        <div className="flex items-start justify-between">
          <div className="h-10 w-10 rounded-xl bg-slate-200/90" />
          <div className="h-5 w-24 rounded-full bg-slate-200/90" />
        </div>
        <div className="h-5 w-3/4 rounded bg-slate-200/90" />
        <div className="h-4 w-full rounded bg-[var(--color-surface-subtle)]" />
        <div className="h-4 w-5/6 rounded bg-[var(--color-surface-subtle)]" />
        <div className="grid gap-2">
          <div className="h-10 rounded-xl bg-[var(--color-surface-subtle)]" />
          <div className="h-10 rounded-xl bg-[var(--color-surface-subtle)]" />
        </div>
        <div className="h-12 rounded-xl bg-[var(--color-surface-subtle)]" />
      </div>
    </Card>
  );
}

export default function InsightLoadingState({
  groups = 2,
  cardsPerGroup = 3,
}) {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-atomic="true">
      <p className="sr-only">Loading insight groups and cards.</p>
      {Array.from({ length: groups }, (_, groupIndex) => (
        <section key={groupIndex} className="space-y-4">
          <div className="space-y-2" aria-hidden="true">
            <div className="h-6 w-40 skeleton rounded" />
            <div className="h-4 w-56 skeleton rounded" />
          </div>
          <ResponsiveCardGrid as="div" variant="cards" className="xl:grid-cols-3" aria-hidden="true">
            {Array.from({ length: cardsPerGroup }, (_, cardIndex) => (
              <InsightSkeletonCard key={`${groupIndex}-${cardIndex}`} />
            ))}
          </ResponsiveCardGrid>
        </section>
      ))}
    </div>
  );
}
