import test from 'node:test';
import assert from 'node:assert/strict';

import {
  joinFinanceLensParts,
  buildLedgerScopeLensItem,
  buildActiveViewLensItem,
  buildOrderingLensItem,
  buildFocusLensItem,
} from '../src/lib/financeLensItems.js';

test('joinFinanceLensParts joins truthy parts with a bullet separator', () => {
  assert.equal(joinFinanceLensParts(['All accounts', 'Priority order']), 'All accounts • Priority order');
});

test('joinFinanceLensParts drops falsy parts', () => {
  assert.equal(joinFinanceLensParts(['All accounts', null, '', undefined, 'Priority order']), 'All accounts • Priority order');
});

test('joinFinanceLensParts returns an empty string for an empty list', () => {
  assert.equal(joinFinanceLensParts([]), '');
});

test('buildLedgerScopeLensItem defaults tone to slate and label to Ledger scope', () => {
  assert.deepEqual(
    buildLedgerScopeLensItem({ value: 'All', helper: 'Everything' }),
    { label: 'Ledger scope', value: 'All', helper: 'Everything', tone: 'slate' },
  );
});

test('buildLedgerScopeLensItem accepts a custom tone', () => {
  const item = buildLedgerScopeLensItem({ value: 'Overdue', helper: 'Risk', tone: 'rose' });
  assert.equal(item.tone, 'rose');
});

test('buildActiveViewLensItem defaults tone to emerald and label to Active view', () => {
  assert.deepEqual(
    buildActiveViewLensItem({ value: 'Due now', helper: 'Urgent' }),
    { label: 'Active view', value: 'Due now', helper: 'Urgent', tone: 'emerald' },
  );
});

test('buildOrderingLensItem defaults tone to amber and label to Ordering', () => {
  assert.deepEqual(
    buildOrderingLensItem({ value: 'Priority', helper: 'Highest risk first' }),
    { label: 'Ordering', value: 'Priority', helper: 'Highest risk first', tone: 'amber' },
  );
});

test('buildFocusLensItem defaults label to Current focus and tone to slate', () => {
  assert.deepEqual(
    buildFocusLensItem({ value: 'Repay', helper: 'Recommended' }),
    { label: 'Current focus', value: 'Repay', helper: 'Recommended', tone: 'slate' },
  );
});

test('buildFocusLensItem accepts a custom label and tone', () => {
  const item = buildFocusLensItem({ label: 'Next step', value: 'Draw', helper: 'Available', tone: 'sky' });
  assert.equal(item.label, 'Next step');
  assert.equal(item.tone, 'sky');
});
