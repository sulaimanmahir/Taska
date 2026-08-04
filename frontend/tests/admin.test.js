import test from 'node:test';
import assert from 'node:assert/strict';

import {
  adminTabs,
  buildAdminStatsCards,
  filterAdminRecords,
  getAdminActionTargetLabel,
  getAdminCurrentTabLabel,
  getAdminLoadRequests,
  getAdminPendingActionLabel,
  getAdminPendingActionLabelDisplay,
  getAdminPendingRecordName,
} from '../src/lib/admin.js';
import { formatCurrencyNGN } from '../src/lib/financeFormatters.js';

test('admin tabs and request mapping stay aligned with the dashboard sections', () => {
  assert.equal(adminTabs.length, 6);
  assert.deepEqual(getAdminLoadRequests('users'), {
    primary: '/admin/users',
    includeStats: true,
  });
  assert.deepEqual(getAdminLoadRequests('support'), {
    primary: '/admin/support-tickets',
    includeStats: false,
  });
  assert.deepEqual(getAdminLoadRequests('unknown'), {
    primary: null,
    includeStats: false,
  });
});

test('admin target labels and current tab labels stay readable', () => {
  assert.equal(getAdminActionTargetLabel('users'), 'user');
  assert.equal(getAdminActionTargetLabel('businesses'), 'business');
  assert.equal(getAdminActionTargetLabel('support'), 'ticket');
  assert.equal(getAdminActionTargetLabel('plans'), 'record');

  assert.equal(getAdminCurrentTabLabel('transactions', adminTabs), 'Transactions');
  assert.equal(getAdminCurrentTabLabel('missing', adminTabs), 'Records');
});

test('admin pending action helpers format labels and record names safely', () => {
  assert.equal(getAdminPendingActionLabel('resolve-ticket'), 'resolve ticket');
  assert.equal(getAdminPendingActionLabelDisplay('suspend-business'), 'Suspend business');
  assert.equal(getAdminPendingActionLabelDisplay(''), 'Confirm');

  assert.equal(getAdminPendingRecordName({ name: 'Ada Obi' }), 'Ada Obi');
  assert.equal(getAdminPendingRecordName({ business_name: 'Taska Mart' }), 'Taska Mart');
  assert.equal(getAdminPendingRecordName({ subject: 'Login issue' }), 'Login issue');
  assert.equal(getAdminPendingRecordName({ email: 'ops@example.com' }), 'ops@example.com');
  assert.equal(getAdminPendingRecordName({ id: 14 }), '#14');
});

test('admin record filtering matches supported searchable fields case-insensitively', () => {
  const records = [
    { id: 1, name: 'Ada Obi', email: 'ada@example.com' },
    { id: 2, business_name: 'Taska Mart', owner_name: 'Bello Musa' },
    { id: 3, subject: 'Payment issue', user_name: 'Grace' },
    { id: 4, referrer_name: 'Amina', referred_name: 'John' },
  ];

  assert.deepEqual(filterAdminRecords(records, '').map((item) => item.id), [1, 2, 3, 4]);
  assert.deepEqual(filterAdminRecords(records, 'taska').map((item) => item.id), [2]);
  assert.deepEqual(filterAdminRecords(records, 'payment').map((item) => item.id), [3]);
  assert.deepEqual(filterAdminRecords(records, 'john').map((item) => item.id), [4]);
});

test('admin stats cards keep platform summary metrics aligned', () => {
  assert.deepEqual(buildAdminStatsCards({
    totalUsers: 1200,
    activeBusinesses: 320,
    monthlyRevenue: 4500000,
    pendingSupport: 14,
  }, formatCurrencyNGN), [
    {
      label: 'Total Users',
      value: '1,200',
      helper: 'Registered accounts across the system',
      tone: 'sky',
    },
    {
      label: 'Active Businesses',
      value: '320',
      helper: 'Tenants currently marked active',
      tone: 'emerald',
    },
    {
      label: 'Monthly Revenue',
      value: formatCurrencyNGN(4500000),
      helper: 'Successful transaction volume this month',
      tone: 'violet',
    },
    {
      label: 'Open Tickets',
      value: '14',
      helper: 'Support requests still unresolved',
      tone: 'amber',
    },
  ]);
});
