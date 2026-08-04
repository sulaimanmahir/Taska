import test from 'node:test';
import assert from 'node:assert/strict';

import { buildModalActionsViewModel } from '../src/components/modalShellActions.js';

test('modal actions helper composes default action-bar state with safe tone and preset fallbacks', () => {
  assert.deepEqual(buildModalActionsViewModel({
    tone: 'missing-tone',
    preset: 'missing-preset',
    className: 'custom-actions',
  }), {
    resolvedAriaLabel: 'Dialog actions',
    className: 'modal-actions-mobile sticky bottom-0 -mx-4.5 mt-1 flex flex-col gap-2.5 border-t px-4.5 pb-1 pt-3 sm:static sm:mx-0 sm:flex-row sm:border-t-0 sm:bg-transparent sm:px-0 sm:pb-0 border-slate-200/80 bg-[var(--color-bg-elevated)] custom-actions',
  });
});

test('modal actions helper respects preset labelling and custom aria overrides', () => {
  assert.deepEqual(buildModalActionsViewModel({
    tone: 'emerald',
    preset: 'confirmation',
  }), {
    resolvedAriaLabel: 'Confirmation actions',
    className: 'modal-actions-mobile sticky bottom-0 -mx-4.5 mt-1 flex flex-col gap-2.5 border-t px-4.5 pb-1 pt-3 sm:static sm:mx-0 sm:flex-row sm:border-t-0 sm:bg-transparent sm:px-0 sm:pb-0 border-emerald-100 bg-[var(--color-bg-elevated)] mt-4'.trim(),
  });

  assert.deepEqual(buildModalActionsViewModel({
    tone: 'emerald',
    preset: 'confirmation',
    ariaLabel: 'Approve or cancel',
  }), {
    resolvedAriaLabel: 'Approve or cancel',
    className: 'modal-actions-mobile sticky bottom-0 -mx-4.5 mt-1 flex flex-col gap-2.5 border-t px-4.5 pb-1 pt-3 sm:static sm:mx-0 sm:flex-row sm:border-t-0 sm:bg-transparent sm:px-0 sm:pb-0 border-emerald-100 bg-[var(--color-bg-elevated)] mt-4'.trim(),
  });
});
