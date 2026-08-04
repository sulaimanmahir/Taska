import { useState } from 'react';
import ModalShell from './ModalShell';

export default function OnboardingTour({ step, totalSteps = 1, tour, next, skip, complete }) {
  if (!tour || step < 0) return null;

  const progressValue = Math.min(100, Math.max(0, ((step + 1) / totalSteps) * 100));

  const getActionHandler = (action) => {
    if (action === 'skip') {
      return skip;
    }

    if (action === 'complete') {
      return complete;
    }

    return next;
  };

  return (
    <ModalShell
      title={tour.title}
      subtitle={`Guided tour step ${step + 1}`}
      onClose={skip}
      size="sm"
      tone="violet"
      headerLayout="compact"
      statusStripPreset="progress"
      statusStrip={(
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500/90">
                Tour progress
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                Step {step + 1} of {totalSteps}
              </p>
            </div>
            <span className="rounded-full border border-slate-200/80 bg-[var(--color-surface-subtle)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-brand)] shadow-[var(--shadow-sm)]">
              {Math.round(progressValue)}%
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full border border-slate-200/70 bg-[var(--color-surface-subtle)]">
            <div
              className="h-full rounded-full bg-[var(--color-brand)] transition-[width] duration-300 ease-out"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </>
      )}
      statusStripClassName="mb-4"
      className="rounded-[1.5rem] border-slate-200 p-6 sm:p-6"
      scrollAreaClassName="overflow-visible pr-0"
      bodyClassName="pr-1"
      headerBadgePreset="step"
      headerBadgeLabel={`Step ${step + 1}`}
      closeAriaLabel="Close onboarding tour"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-soft)]">
          <span className="font-bold text-[var(--color-brand)]">{step + 1}</span>
        </div>
        <div className="flex-1">
          <p className="text-sm leading-6 text-slate-600">{tour.content}</p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {tour.buttons.map((btn) => {
              const isPrimary = btn.label === 'Get Started' || btn.label === 'Finish' || btn.action === 'next';
              const isDismissAction = btn.action === 'skip';

              return (
                <button
                  key={btn.label}
                  type="button"
                  onClick={getActionHandler(btn.action)}
                  data-autofocus={isPrimary ? 'true' : undefined}
                  data-modal-dismiss={isDismissAction ? 'true' : undefined}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isPrimary
                      ? 'rounded-[var(--field-radius)] border border-slate-300 bg-slate-200 text-slate-950 shadow-[var(--shadow-sm)] hover:bg-slate-300'
                      : 'rounded-[var(--field-radius)] border border-slate-200/80 bg-[var(--color-surface-subtle)] text-slate-600 shadow-[var(--shadow-sm)] hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

export function OnboardingTrigger({ onStart }) {
  const [show, setShow] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 z-40">
      {!show && (
        <button
          type="button"
          onClick={() => {
            setShow(true);
            onStart?.();
          }}
          className="flex items-center gap-2 rounded-[var(--field-radius)] border border-slate-200/80 bg-[var(--color-surface-subtle)] px-4 py-2 text-sm font-medium text-slate-700 shadow-[var(--shadow-sm)] transition hover:border-slate-300 hover:bg-white hover:shadow-[var(--shadow-md)]"
        >
          <span>Take Tour</span>
        </button>
      )}
    </div>
  );
}
