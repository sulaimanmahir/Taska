import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildModalDescriptionIds,
  resolveModalShellPresentation,
} from '../src/components/modalShellState.js';

test('modal description id helper keeps subtitle and external descriptions aligned', () => {
  assert.equal(
    buildModalDescriptionIds({
      subtitle: 'Capture details',
      subtitleId: 'modal-subtitle',
      describedBy: 'external-hint',
    }),
    'modal-subtitle external-hint',
  );

  assert.equal(
    buildModalDescriptionIds({
      subtitle: '',
      subtitleId: 'modal-subtitle',
      describedBy: 'external-hint',
    }),
    'external-hint',
  );

  assert.equal(
    buildModalDescriptionIds({
      subtitle: '',
      subtitleId: 'modal-subtitle',
      describedBy: '',
    }),
    undefined,
  );
});

test('modal presentation resolver preserves size, tone, and dismiss fallbacks', () => {
  const resolved = resolveModalShellPresentation({
    size: '2xl',
    tone: 'amber',
    statusStripTone: 'emerald',
    dismissPreset: 'soft',
    busy: true,
    busyDismissPreset: 'locked',
  });

  assert.equal(resolved.widthClassName, 'max-w-2xl');
  assert.equal(resolved.toneClasses.statusStrip, 'modal-status-strip-amber');
  assert.equal(resolved.statusStripToneClasses.statusStrip, 'modal-status-strip-emerald');
  assert.equal(resolved.resolvedCloseOnBackdrop, false);
  assert.equal(resolved.resolvedCloseOnEscape, false);
  assert.equal(resolved.resolvedShowCloseButton, false);
});

test('modal presentation resolver falls back safely for unknown presets and sizes', () => {
  const resolved = resolveModalShellPresentation({
    size: 'unknown',
    maxWidth: 'max-w-5xl',
    tone: 'unknown',
    headerLayout: 'unknown',
    statusStripPreset: 'unknown',
    dismissPreset: 'unknown',
  });

  assert.equal(resolved.widthClassName, 'max-w-5xl');
  assert.equal(resolved.toneClasses.statusStrip, 'modal-status-strip-default');
  assert.equal(resolved.headerLayoutClassName, 'mb-3.5 flex items-start justify-between gap-4');
  assert.equal(resolved.statusStripPresetClassName, '');
  assert.equal(resolved.resolvedCloseOnBackdrop, true);
  assert.equal(resolved.resolvedCloseOnEscape, true);
  assert.equal(resolved.resolvedShowCloseButton, true);
});

test('modal presentation resolver keeps badge, draft state, and close guard copy aligned', () => {
  const resolved = resolveModalShellPresentation({
    tone: 'violet',
    headerBadgePreset: 'step',
    headerBadgeLabel: '',
    draftState: 'dirty',
    draftStatePreset: 'setup',
    closeGuardPreset: 'cancelSetup',
    busy: false,
  });

  assert.equal(resolved.resolvedHeaderBadgeLabel, '');
  assert.equal(resolved.headerBadgeClasses, '');
  assert.equal(resolved.draftStateClassName, 'border-amber-100 bg-amber-50/10 text-amber-700');
  assert.equal(resolved.resolvedDraftStateLabel, 'Setup in progress');
  assert.equal(resolved.resolvedCloseGuardTitle, 'Discard setup changes');
  assert.equal(resolved.resolvedCloseGuardConfirmLabel, 'Discard setup');
  assert.equal(resolved.resolvedCloseGuardCancelLabel, 'Continue setup');
  assert.equal(resolved.shouldGuardClose, true);
});

test('modal presentation resolver allows explicit badge labels and manual dismiss overrides', () => {
  const resolved = resolveModalShellPresentation({
    tone: 'sky',
    headerBadgePreset: 'step',
    headerBadgeLabel: 'Step 2',
    closeOnBackdrop: false,
    closeOnEscape: true,
    showCloseButton: true,
    draftState: 'saving',
    draftStateLabel: 'Saving customer...',
    draftStatePreset: 'pending',
  });

  assert.equal(resolved.resolvedHeaderBadgeLabel, 'Step 2');
  assert.match(resolved.headerBadgeClasses, /text-slate-500/);
  assert.equal(resolved.resolvedDraftStateLabel, 'Saving customer...');
  assert.equal(resolved.resolvedCloseOnBackdrop, false);
  assert.equal(resolved.resolvedCloseOnEscape, true);
  assert.equal(resolved.resolvedShowCloseButton, true);
  assert.equal(resolved.shouldGuardClose, false);
});
