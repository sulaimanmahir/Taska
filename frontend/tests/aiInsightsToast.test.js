import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createAiInsightsSavedViewsToast,
  createAiInsightsSuccessToast,
  createAiInsightsUndoToast,
} from '../src/lib/aiInsights/index.js';

test('AI insights success toast helper returns the expected base payload', () => {
  assert.deepEqual(
    createAiInsightsSuccessToast('Saved AI view removed.'),
    {
      tone: 'success',
      message: 'Saved AI view removed.',
    },
  );
});

test('AI insights undo toast helper preserves custom action labels and handlers', () => {
  const onAction = () => 'undo';
  const toast = createAiInsightsUndoToast({
    message: 'Most urgent is now active.',
    actionLabel: 'Back to previous sort',
    onAction,
  });

  assert.equal(toast.tone, 'success');
  assert.equal(toast.message, 'Most urgent is now active.');
  assert.equal(toast.actionLabel, 'Back to previous sort');
  assert.equal(toast.onAction, onAction);
});

test('AI insights saved views toast helper only adds collapse actions when views were auto-revealed', () => {
  const onCollapse = () => 'collapse';
  const expandedToast = createAiInsightsSavedViewsToast({
    message: 'AI view saved for quick return.',
    didRevealSavedViews: true,
    onCollapse,
  });
  const plainToast = createAiInsightsSavedViewsToast({
    message: 'Saved AI view unpinned.',
    didRevealSavedViews: false,
    onCollapse,
  });

  assert.equal(expandedToast.actionLabel, 'Collapse again');
  assert.equal(expandedToast.onAction, onCollapse);
  assert.equal(plainToast.actionLabel, undefined);
  assert.equal(plainToast.onAction, undefined);
});
