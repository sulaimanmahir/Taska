import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildModalShellCloseGuardViewModel,
  buildModalShellContentSectionState,
  buildModalShellContextValue,
  buildModalShellFrameState,
  buildModalShellHeaderMetaState,
  getModalShellCloseButtonClassName,
  getModalShellHeaderSectionClassName,
} from '../src/components/modalShellSectionsState.js';

test('modal sections helper keeps context payload aligned with busy and close-guard state', () => {
  const requestClose = () => {};

  assert.deepEqual(buildModalShellContextValue({
    requestClose,
    busy: true,
    draftState: 'dirty',
    isCloseGuardActive: true,
  }), {
    requestClose,
    isBusy: true,
    draftState: 'dirty',
    showCloseGuard: true,
    isCloseGuardActive: true,
  });

  assert.deepEqual(buildModalShellContextValue({
    requestClose,
  }), {
    requestClose,
    isBusy: false,
    draftState: null,
    showCloseGuard: false,
    isCloseGuardActive: false,
  });
});

test('modal sections helper resolves header meta visibility and class composition cleanly', () => {
  assert.deepEqual(buildModalShellHeaderMetaState({
    headerAction: null,
    resolvedHeaderBadgeLabel: '',
    draftState: null,
  }), {
    shouldRender: false,
    hasHeaderBadge: false,
    hasDraftState: false,
  });

  assert.deepEqual(buildModalShellHeaderMetaState({
    headerAction: { type: 'button' },
    resolvedHeaderBadgeLabel: 'Customer profile',
    draftState: 'dirty',
  }), {
    shouldRender: true,
    hasHeaderBadge: true,
    hasDraftState: true,
  });

  assert.equal(getModalShellHeaderSectionClassName({
    headerLayoutClassName: 'layout-class',
    stickyHeaderClassName: 'sticky-class',
    headerClassName: 'header-class',
  }), 'layout-class sticky-class header-class');

  assert.equal(getModalShellCloseButtonClassName({
    closeButtonToneClassName: 'close-tone',
  }), 'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-3 close-tone');
});

test('modal sections helper keeps close-guard classes readable and consistent', () => {
  assert.deepEqual(buildModalShellCloseGuardViewModel({
    closeGuardToneClasses: {
      panel: 'guard-panel',
      body: 'guard-body',
      secondary: 'guard-secondary',
      primary: 'guard-primary',
    },
  }), {
    panelClassName: 'mb-3.5 rounded-[1.5rem] border px-3.5 py-2.5 shadow-[var(--shadow-sm)] guard-panel',
    messageClassName: 'mt-1 text-sm guard-body',
    secondaryButtonClassName: 'rounded-xl border px-3 py-1.5 text-sm font-medium transition guard-secondary',
    primaryButtonClassName: 'rounded-xl px-3 py-1.5 text-sm font-semibold transition guard-primary',
  });
});

test('modal sections helper keeps content section state aligned with close-button and status-strip behavior', () => {
  const requestSources = [];
  const contentState = buildModalShellContentSectionState({
    guardedContentProps: {
      ariaHidden: 'true',
      inert: '',
      className: 'guarded-shell',
    },
    requestClose: (source) => {
      requestSources.push(source);
    },
    busy: true,
    draftState: 'saving',
    isCloseGuardActive: true,
    statusStrip: 'Setup in progress',
  });

  assert.deepEqual(contentState.contentAttributes, {
    ariaHidden: 'true',
    inert: '',
    className: 'guarded-shell',
  });
  assert.equal(contentState.shouldRenderStatusStrip, true);
  assert.deepEqual(contentState.modalContextValue, {
    requestClose: contentState.modalContextValue.requestClose,
    isBusy: true,
    draftState: 'saving',
    showCloseGuard: true,
    isCloseGuardActive: true,
  });

  contentState.onCloseButton();
  assert.deepEqual(requestSources, ['close-button']);

  const idleContentState = buildModalShellContentSectionState({
    requestClose: () => {},
  });
  assert.equal(idleContentState.shouldRenderStatusStrip, false);
});

test('modal sections helper keeps frame accessibility state aligned with guard visibility', () => {
  assert.deepEqual(buildModalShellFrameState({
    backdropAriaHidden: 'true',
    dialogAccessibility: {
      labelledBy: 'guard-title',
      describedBy: 'guard-message',
    },
    dialogPanelClassName: 'panel-class',
    dialogScrollAreaClassName: 'scroll-class',
    frameAccessibility: {
      dialogAriaModal: undefined,
      dialogAriaBusy: true,
      dialogAriaHidden: 'true',
      dialogInert: '',
    },
    isCloseGuardActive: true,
  }), {
    backdropClassName: 'modal-backdrop modal-backdrop-enter items-end px-0 sm:items-center sm:px-4',
    backdropAriaHidden: 'true',
    dialogRole: 'dialog',
    dialogAriaModal: undefined,
    dialogAriaBusy: true,
    dialogAriaHidden: 'true',
    dialogLabelledBy: 'guard-title',
    dialogDescribedBy: 'guard-message',
    dialogTabIndex: -1,
    dialogInert: '',
    dialogPanelClassName: 'panel-class',
    dialogScrollAreaClassName: 'scroll-class',
    shouldRenderCloseGuard: true,
  });
});
