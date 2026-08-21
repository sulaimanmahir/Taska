import { useQuery } from '@tanstack/react-query';
import Card, { CardHeader } from '../components/Card';
import EmptyState from '../components/EmptyState';
import PageHero from '../components/PageHero';
import api from '../lib/api';
import {
  buildHealthOverview,
  buildInProgressCard,
  buildStreakCard,
  buildUnlockedCard,
  sortInProgressByClosest,
} from '../lib/gamification';

function QueryErrorPanel({ message, onRetry }) {
  if (!message) {
    return null;
  }

  return (
    <Card className="border-rose-200 bg-rose-50">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-rose-800">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
        >
          Retry
        </button>
      </div>
    </Card>
  );
}

const TONE_CLASSES = {
  emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  amber: 'text-amber-700 bg-amber-50 border-amber-200',
  rose: 'text-rose-700 bg-rose-50 border-rose-200',
};

export default function ProgressCentre() {
  const overviewQuery = useQuery({
    queryKey: ['gamification-overview'],
    queryFn: () => api.get('/gamification/overview').then((response) => response.data),
  });

  const data = overviewQuery.data;
  const health = buildHealthOverview(data?.health);
  const streakCards = (data?.streaks ?? []).map(buildStreakCard);
  const unlockedCards = (data?.unlocked ?? []).map(buildUnlockedCard);
  const inProgressCards = sortInProgressByClosest(data?.in_progress ?? []).map(buildInProgressCard);
  const toneClass = TONE_CLASSES[health.tone] || TONE_CLASSES.amber;

  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="Progress Centre"
        title="How your business is doing"
        description="A real read on business health, streaks worth keeping, and what's next - built from your own sales, expenses, stock, and customers, not arbitrary points."
      />

      <QueryErrorPanel
        message={overviewQuery.isError ? 'We could not load your progress right now. Please try again.' : ''}
        onRetry={() => overviewQuery.refetch()}
      />

      <Card>
        <CardHeader title="Business Health" subtitle="A composite score from revenue trend, expense control, stock health, and receivables." />
        {overviewQuery.isLoading ? (
          <div className="h-24 skeleton rounded-2xl" />
        ) : (
          <>
            <div className={`inline-flex items-center gap-3 rounded-2xl border px-5 py-4 ${toneClass}`}>
              <span className="text-3xl font-bold">{health.score}</span>
              <span className="text-sm font-semibold uppercase tracking-[0.14em]">{health.label}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {health.components.map((component) => (
                <div key={component.key} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{component.label}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{component.value}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Card>
        <CardHeader title="Streaks" subtitle="Consecutive-day habits worth keeping." />
        {overviewQuery.isLoading ? (
          <div className="h-16 skeleton rounded-2xl" />
        ) : streakCards.length === 0 ? (
          <EmptyState
            icon="M13 10V3L4 14h7v7l9-11h-7z"
            title="No streaks started yet"
            description="Log a sale or an expense to start your first streak."
            className="py-6"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {streakCards.map((streak) => (
              <div
                key={streak.key}
                className={`rounded-2xl border p-4 ${streak.isActive ? 'border-orange-200 bg-orange-50' : 'border-slate-200 bg-slate-50'}`}
              >
                <p className="text-sm font-semibold text-slate-900">{streak.title}</p>
                <p className={`mt-1 text-xl font-bold ${streak.isActive ? 'text-orange-600' : 'text-slate-400'}`}>{streak.currentLabel}</p>
                <p className="mt-1 text-xs text-slate-500">{streak.bestLabel}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Unlocked" subtitle="Achievements and milestones your business has already earned." />
          {overviewQuery.isLoading ? (
            <div className="h-24 skeleton rounded-2xl" />
          ) : unlockedCards.length === 0 ? (
            <EmptyState
              icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              title="Nothing unlocked yet"
              description="Your first sale, customer, or expense will unlock the first achievement."
              className="py-6"
            />
          ) : (
            <div className="space-y-3">
              {unlockedCards.map((unlock) => (
                <div key={unlock.key} className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{unlock.title}</p>
                    <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">{unlock.categoryLabel}</p>
                  </div>
                  <p className="text-xs text-slate-500">{unlock.dateLabel}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="In Progress" subtitle="What's next, and how close your business is." />
          {overviewQuery.isLoading ? (
            <div className="h-24 skeleton rounded-2xl" />
          ) : inProgressCards.length === 0 ? (
            <EmptyState
              icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14"
              title="Everything is unlocked"
              description="Your business has crossed every tracked milestone so far."
              className="py-6"
            />
          ) : (
            <div className="space-y-3">
              {inProgressCards.map((item) => (
                <div key={item.key} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{item.categoryLabel}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[var(--color-brand)] transition-[width] duration-300 ease-out"
                      style={{ width: `${item.progressPercent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{item.progressPercent}% there</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
