import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildApprovalSettingsPayload,
  buildSettingsApprovalMetrics,
  buildSettingsApprovalSettingsDefaults,
  formatApprovalActionType,
  hasSettingsApprovalSettingsChanges,
} from '../src/lib/settingsApprovals.js';

test('formatApprovalActionType maps known action types and falls back for unknown ones', () => {
  assert.equal(formatApprovalActionType('expense'), 'Expense');
  assert.equal(formatApprovalActionType('inventory_adjustment'), 'Inventory adjustment');
  assert.equal(formatApprovalActionType('order_discount'), 'Order discount');
  assert.equal(formatApprovalActionType('something_new'), 'something_new');
});

test('buildSettingsApprovalSettingsDefaults stringifies thresholds and defaults an empty state safely', () => {
  assert.deepEqual(buildSettingsApprovalSettingsDefaults(), {
    expense_approval_threshold: '',
    discount_approval_threshold: '',
    require_inventory_adjustment_approval: false,
  });

  assert.deepEqual(buildSettingsApprovalSettingsDefaults({
    expense_approval_threshold: 50000,
    discount_approval_threshold: null,
    require_inventory_adjustment_approval: true,
  }), {
    expense_approval_threshold: '50000',
    discount_approval_threshold: '',
    require_inventory_adjustment_approval: true,
  });
});

test('hasSettingsApprovalSettingsChanges only flags a real difference from the saved state', () => {
  const saved = {
    expense_approval_threshold: 50000,
    discount_approval_threshold: null,
    require_inventory_adjustment_approval: false,
  };
  const unchanged = buildSettingsApprovalSettingsDefaults(saved);

  assert.equal(hasSettingsApprovalSettingsChanges(saved, unchanged), false);
  assert.equal(hasSettingsApprovalSettingsChanges(saved, { ...unchanged, expense_approval_threshold: '75000' }), true);
  assert.equal(hasSettingsApprovalSettingsChanges(null, unchanged), false);
});

test('buildApprovalSettingsPayload converts blank threshold strings to null and numbers otherwise', () => {
  assert.deepEqual(buildApprovalSettingsPayload({
    expense_approval_threshold: '',
    discount_approval_threshold: '2500',
    require_inventory_adjustment_approval: true,
  }), {
    expense_approval_threshold: null,
    discount_approval_threshold: 2500,
    require_inventory_adjustment_approval: true,
  });
});

test('buildSettingsApprovalMetrics counts pending, approved, and declined requests', () => {
  const approvals = [
    { status: 'pending' },
    { status: 'pending' },
    { status: 'approved' },
    { status: 'declined' },
  ];

  const metrics = buildSettingsApprovalMetrics(approvals);

  assert.equal(metrics[0].label, 'Pending Review');
  assert.equal(metrics[0].value, '2');
  assert.equal(metrics[0].tone, 'amber');
  assert.equal(metrics[1].value, '1');
  assert.equal(metrics[2].value, '1');
});

test('buildSettingsApprovalMetrics reads as healthy when nothing is pending', () => {
  const metrics = buildSettingsApprovalMetrics([]);

  assert.equal(metrics[0].value, '0');
  assert.equal(metrics[0].tone, 'emerald');
});
