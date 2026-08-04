import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildModalShellViewModel,
  getModalDialogAccessibilityState,
  getModalFrameAccessibilityState,
  getModalGuardedContentProps,
  getModalPanelClassName,
  getModalScrollAreaClassName,
  getModalStatusStripClassName,
  getModalStickyHeaderClassName,
  shouldRenderModalHeaderMeta,
} from '../src/components/modalShellView.js';

test('modal view helper resolves dialog labelling between the main shell and close guard', () => {
  assert.deepEqual(getModalDialogAccessibilityState({
    isCloseGuardActive: false,
    closeGuardTitleId: 'guard-title',
    closeGuardMessageId: 'guard-message',
    titleId: 'dialog-title',
    resolvedDescriptionIds: 'dialog-subtitle external-help',
  }), {
    labelledBy: 'dialog-title',
    describedBy: 'dialog-subtitle external-help',
  });

  assert.deepEqual(getModalDialogAccessibilityState({
    isCloseGuardActive: true,
    closeGuardTitleId: 'guard-title',
    closeGuardMessageId: 'guard-message',
    titleId: 'dialog-title',
    resolvedDescriptionIds: 'dialog-subtitle external-help',
  }), {
    labelledBy: 'guard-title',
    describedBy: 'guard-message',
  });
});

test('modal view helper keeps top-layer accessibility state aligned with busy and stack status', () => {
  assert.deepEqual(getModalFrameAccessibilityState({
    busy: false,
    isTopModal: true,
  }), {
    backdropAriaHidden: undefined,
    dialogAriaModal: 'true',
    dialogAriaBusy: undefined,
    dialogAriaHidden: undefined,
    dialogInert: undefined,
  });

  assert.deepEqual(getModalFrameAccessibilityState({
    busy: true,
    isTopModal: false,
  }), {
    backdropAriaHidden: 'true',
    dialogAriaModal: undefined,
    dialogAriaBusy: true,
    dialogAriaHidden: 'true',
    dialogInert: '',
  });
});

test('modal view helper only renders header meta when action, badge, or draft state is present', () => {
  assert.equal(shouldRenderModalHeaderMeta({
    headerAction: null,
    hasHeaderBadge: false,
    hasDraftState: false,
  }), false);
  assert.equal(shouldRenderModalHeaderMeta({
    headerAction: { type: 'button' },
    hasHeaderBadge: false,
    hasDraftState: false,
  }), true);
  assert.equal(shouldRenderModalHeaderMeta({
    headerAction: null,
    hasHeaderBadge: true,
    hasDraftState: false,
  }), true);
  assert.equal(shouldRenderModalHeaderMeta({
    headerAction: null,
    hasHeaderBadge: false,
    hasDraftState: true,
  }), true);
});

test('modal view helper keeps sticky header and status strip classes aligned with scroll state', () => {
  assert.equal(getModalStickyHeaderClassName({
    stickyHeader: false,
    hasTopShadow: true,
  }), '');
  assert.equal(getModalStickyHeaderClassName({
    stickyHeader: true,
    hasTopShadow: true,
  }), 'modal-sticky-header sticky top-0 z-10 -mx-4.5 px-4.5 pb-2.5 pt-1 sm:-mx-5.5 sm:px-5.5 modal-sticky-header-elevated');

  assert.equal(getModalStatusStripClassName({
    stickyStatusStrip: false,
    stickyHeader: true,
    hasTopShadow: true,
    toneClassName: 'tone',
    presetClassName: 'preset',
    className: 'custom',
  }), 'modal-status-strip tone preset custom');
  assert.equal(getModalStatusStripClassName({
    stickyStatusStrip: true,
    stickyHeader: true,
    hasTopShadow: true,
    toneClassName: 'tone',
    presetClassName: 'preset',
    className: 'custom',
  }), 'modal-status-strip modal-status-strip-sticky-with-header modal-status-strip-elevated tone preset custom');
});

test('modal view helper keeps guarded content props aligned with the close-guard state', () => {
  assert.deepEqual(getModalGuardedContentProps({
    isCloseGuardActive: false,
  }), {
    ariaHidden: undefined,
    inert: undefined,
    className: undefined,
  });

  assert.deepEqual(getModalGuardedContentProps({
    isCloseGuardActive: true,
  }), {
    ariaHidden: 'true',
    inert: '',
    className: 'pointer-events-none select-none',
  });
});

test('modal view helper keeps panel and scroll area classes readable and composable', () => {
  assert.equal(getModalPanelClassName({
    widthClassName: 'max-w-lg',
    panelToneClassName: 'tone-panel',
    className: 'custom-panel',
  }), 'modal modal-panel-enter w-full max-w-lg max-h-[91vh] overflow-hidden rounded-t-[1.5rem] rounded-b-none border p-4.5 shadow-[var(--shadow-md)] sm:max-h-[89vh] sm:rounded-[1.5rem] sm:p-5.5 tone-panel custom-panel');

  assert.equal(getModalScrollAreaClassName({
    hasTopShadow: true,
    hasBottomShadow: true,
    className: 'custom-scroll',
  }), 'modal-scroll-area modal-scroll-area-has-top-shadow modal-scroll-area-has-bottom-shadow max-h-[calc(91vh-2.5rem)] overflow-y-auto pr-0.5 sm:max-h-[calc(89vh-3rem)] custom-scroll');
});

test('modal view helper builds a consistent view model for guarded sticky modals', () => {
  assert.deepEqual(buildModalShellViewModel({
    busy: true,
    closeGuardRequested: true,
    shouldGuardClose: true,
    scrollState: { top: true, bottom: true },
    resolvedCloseOnBackdrop: true,
    isTopModal: true,
    closeGuardTitleId: 'guard-title',
    closeGuardMessageId: 'guard-message',
    titleId: 'dialog-title',
    resolvedDescriptionIds: 'dialog-description',
    stickyHeader: true,
    stickyStatusStrip: true,
    statusStripToneClassName: 'tone',
    statusStripPresetClassName: 'preset',
    statusStripClassName: 'custom-strip',
    widthClassName: 'max-w-xl',
    panelToneClassName: 'tone-panel',
    panelClassName: 'custom-panel',
    scrollAreaClassName: 'custom-scroll',
  }), {
    isCloseGuardActive: true,
    hasTopShadow: true,
    hasBottomShadow: true,
    allowBackdropClose: false,
    frameAccessibility: {
      backdropAriaHidden: undefined,
      dialogAriaModal: 'true',
      dialogAriaBusy: true,
      dialogAriaHidden: undefined,
      dialogInert: undefined,
    },
    stickyHeaderClassName: 'modal-sticky-header sticky top-0 z-10 -mx-4.5 px-4.5 pb-2.5 pt-1 sm:-mx-5.5 sm:px-5.5 modal-sticky-header-elevated',
    statusStripClassNames: 'modal-status-strip modal-status-strip-sticky-with-header modal-status-strip-elevated tone preset custom-strip',
    dialogAccessibility: {
      labelledBy: 'guard-title',
      describedBy: 'guard-message',
    },
    guardedContentProps: {
      ariaHidden: 'true',
      inert: '',
      className: 'pointer-events-none select-none',
    },
    dialogPanelClassName: 'modal modal-panel-enter w-full max-w-xl max-h-[91vh] overflow-hidden rounded-t-[1.5rem] rounded-b-none border p-4.5 shadow-[var(--shadow-md)] sm:max-h-[89vh] sm:rounded-[1.5rem] sm:p-5.5 tone-panel custom-panel',
    dialogScrollAreaClassName: 'modal-scroll-area modal-scroll-area-has-top-shadow modal-scroll-area-has-bottom-shadow max-h-[calc(91vh-2.5rem)] overflow-y-auto pr-0.5 sm:max-h-[calc(89vh-3rem)] custom-scroll',
  });
});
