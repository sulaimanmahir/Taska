export const SINGLE_INSIGHT_ACTION_GUIDANCE = {
  markRead: {
    compact: 'Mark read is final.',
    compactBadge: 'Read final',
    full: 'Mark read updates handled state and is not undoable.',
  },
  dismiss: {
    compact: 'Dismiss supports undo.',
    compactBadge: 'Dismiss undoable',
    full: 'Dismiss removes this signal and supports undo after success.',
  },
};

export const GROUP_INSIGHT_ACTION_GUIDANCE = {
  markRead: {
    badge: 'Mark group read',
    panelTitle: 'Handled-state update',
    confirmationTitle: 'Confirm read update',
    summary: 'This updates handled state and is not undoable.',
    confirmationSuffix: 'This action is not undoable.',
  },
  dismiss: {
    badge: 'Dismiss low priority',
    panelTitle: 'Queue cleanup',
    confirmationTitle: 'Confirm low-priority dismissal',
    summary: 'This removes non-critical signals and supports undo after success.',
    confirmationSuffix: 'Critical alerts will stay visible, and you can undo the dismissal after it succeeds.',
  },
};

export const INSIGHT_SUCCESS_MESSAGES = {
  read: 'Insight marked as handled for now.',
  dismiss: 'Insight removed from today\'s action queue.',
  restore: 'Insight returned to today\'s action queue.',
};

export const INSIGHT_ERROR_MESSAGES = {
  read: 'We could not update that insight right now.',
  dismiss: 'We could not dismiss that insight right now.',
  restore: 'We could not restore that insight right now.',
  groupRead: 'We could not update that insight group right now.',
  groupDismiss: 'We could not dismiss that insight group right now.',
  groupRestore: 'We could not restore that insight group right now.',
};

export function buildInsightBatchSuccessMessage(action, count) {
  const noun = `${count} insight${count === 1 ? '' : 's'}`;

  if (action === 'read') {
    return `${noun} marked as read.`;
  }

  if (action === 'dismiss') {
    return `${noun} removed from this queue.`;
  }

  if (action === 'restore') {
    return `${noun} returned to this queue.`;
  }

  return noun;
}
