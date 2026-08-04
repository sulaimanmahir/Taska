import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildModalShellBodyProps,
  buildModalShellCloseGuardProps,
  buildModalShellFrameProps,
} from '../src/components/modalShellControllerProps.js';

test('modal controller props helper maps presentation and view state into body props', () => {
  const requestClose = () => {};

  assert.deepEqual(buildModalShellBodyProps({
    bodyClassName: 'body-class',
    busy: true,
    closeAriaLabel: 'Dismiss modal',
    draftState: 'dirty',
    headerAction: { type: 'button' },
    headerClassName: 'header-class',
    presentation: {
      resolvedHeaderBadgeLabel: 'Step 1',
      headerBadgeClasses: 'badge-class',
      draftStateClassName: 'draft-class',
      resolvedDraftStateLabel: 'Unsaved changes',
      headerLayoutClassName: 'layout-class',
      resolvedShowCloseButton: true,
      toneClasses: {
        closeButton: 'close-tone',
      },
    },
    requestClose,
    statusStrip: 'Status strip',
    subtitle: 'Subtitle',
    subtitleId: 'subtitle-id',
    title: 'Title',
    titleId: 'title-id',
    viewModel: {
      guardedContentProps: {
        ariaHidden: 'true',
        inert: '',
        className: 'guarded-class',
      },
      stickyHeaderClassName: 'sticky-header',
      statusStripClassNames: 'status-strip-class',
      isCloseGuardActive: true,
    },
  }), {
    guardedContentProps: {
      ariaHidden: 'true',
      inert: '',
      className: 'guarded-class',
    },
    title: 'Title',
    subtitle: 'Subtitle',
    titleId: 'title-id',
    subtitleId: 'subtitle-id',
    headerAction: { type: 'button' },
    resolvedHeaderBadgeLabel: 'Step 1',
    headerBadgeClasses: 'badge-class',
    draftState: 'dirty',
    draftStateClassName: 'draft-class',
    resolvedDraftStateLabel: 'Unsaved changes',
    headerLayoutClassName: 'layout-class',
    stickyHeaderClassName: 'sticky-header',
    headerClassName: 'header-class',
    resolvedShowCloseButton: true,
    requestClose,
    closeAriaLabel: 'Dismiss modal',
    closeButtonToneClassName: 'close-tone',
    statusStrip: 'Status strip',
    statusStripClassNames: 'status-strip-class',
    busy: true,
    isCloseGuardActive: true,
    bodyClassName: 'body-class',
  });
});

test('modal controller props helper maps close-guard copy and actions consistently', () => {
  const dismissCloseGuard = () => {};
  const confirmCloseGuard = () => {};

  assert.deepEqual(buildModalShellCloseGuardProps({
    confirmCloseGuard,
    dismissCloseGuard,
    presentation: {
      closeGuardToneClasses: {
        panel: 'panel-tone',
        body: 'body-tone',
        secondary: 'secondary-tone',
        primary: 'primary-tone',
      },
      resolvedCloseGuardTitle: 'Leave editor',
      resolvedCloseGuardMessage: 'Changes will be lost.',
      resolvedCloseGuardCancelLabel: 'Stay here',
      resolvedCloseGuardConfirmLabel: 'Leave',
    },
  }), {
    closeGuardToneClasses: {
      panel: 'panel-tone',
      body: 'body-tone',
      secondary: 'secondary-tone',
      primary: 'primary-tone',
    },
    resolvedCloseGuardTitle: 'Leave editor',
    resolvedCloseGuardMessage: 'Changes will be lost.',
    resolvedCloseGuardCancelLabel: 'Stay here',
    resolvedCloseGuardConfirmLabel: 'Leave',
    dismissCloseGuard,
    confirmCloseGuard,
  });
});

test('modal controller props helper maps frame props and only wires backdrop close when allowed', () => {
  const requestSources = [];
  const requestClose = (source) => {
    requestSources.push(source);
  };
  const handleDialogKeyDown = () => {};

  const closableFrame = buildModalShellFrameProps({
    handleDialogKeyDown,
    requestClose,
    viewModel: {
      allowBackdropClose: true,
      frameAccessibility: {
        backdropAriaHidden: undefined,
        dialogAriaModal: 'true',
      },
      dialogAccessibility: {
        labelledBy: 'title-id',
        describedBy: 'subtitle-id',
      },
      dialogPanelClassName: 'panel-class',
      dialogScrollAreaClassName: 'scroll-class',
      isCloseGuardActive: false,
    },
  });

  assert.equal(typeof closableFrame.onBackdropClick, 'function');
  closableFrame.onBackdropClick();
  assert.deepEqual(requestSources, ['backdrop']);
  assert.deepEqual({
    backdropAriaHidden: closableFrame.backdropAriaHidden,
    dialogAccessibility: closableFrame.dialogAccessibility,
    dialogPanelClassName: closableFrame.dialogPanelClassName,
    dialogScrollAreaClassName: closableFrame.dialogScrollAreaClassName,
    frameAccessibility: closableFrame.frameAccessibility,
    handleDialogKeyDown: closableFrame.handleDialogKeyDown,
    isCloseGuardActive: closableFrame.isCloseGuardActive,
  }, {
    backdropAriaHidden: undefined,
    dialogAccessibility: {
      labelledBy: 'title-id',
      describedBy: 'subtitle-id',
    },
    dialogPanelClassName: 'panel-class',
    dialogScrollAreaClassName: 'scroll-class',
    frameAccessibility: {
      backdropAriaHidden: undefined,
      dialogAriaModal: 'true',
    },
    handleDialogKeyDown,
    isCloseGuardActive: false,
  });

  const lockedFrame = buildModalShellFrameProps({
    handleDialogKeyDown,
    requestClose,
    viewModel: {
      allowBackdropClose: false,
      frameAccessibility: {
        backdropAriaHidden: 'true',
      },
      dialogAccessibility: {
        labelledBy: 'guard-title',
        describedBy: 'guard-message',
      },
      dialogPanelClassName: 'panel-class',
      dialogScrollAreaClassName: 'scroll-class',
      isCloseGuardActive: true,
    },
  });

  assert.equal(lockedFrame.onBackdropClick, undefined);
});
