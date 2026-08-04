import test from 'node:test';
import assert from 'node:assert/strict';

import { getInitialModalShellPortalRoot } from '../src/components/modalShellController.js';

test('modal controller helper skips portal root creation when no document is available', () => {
  const runtime = {
    ensureModalRoot() {
      throw new Error('ensureModalRoot should not run without a document');
    },
  };

  assert.equal(getInitialModalShellPortalRoot({
    hasDocument: false,
    runtime,
  }), null);
});

test('modal controller helper reuses the runtime modal root when document access exists', () => {
  const root = { id: 'taska-modal-root' };
  const runtime = {
    ensureModalRoot() {
      return root;
    },
  };

  assert.equal(getInitialModalShellPortalRoot({
    hasDocument: true,
    runtime,
  }), root);
  assert.equal(getInitialModalShellPortalRoot({
    hasDocument: true,
    runtime: null,
  }), null);
});
