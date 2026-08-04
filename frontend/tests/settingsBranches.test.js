import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSettingsBranchCreateDefaults,
  buildSettingsBranchDrafts,
  buildSettingsBranchMetrics,
  buildSettingsBranchStatusNote,
  formatSettingsBranchFootprint,
  hasSettingsBranchDraftChanges,
  sortSettingsBranches,
} from '../src/lib/settingsBranches.js';

test('branch defaults start with a clean create form', () => {
  assert.deepEqual(buildSettingsBranchCreateDefaults(), {
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    is_primary: false,
  });
});

test('branch drafts mirror editable branch state and detect changes safely', () => {
  const branches = [
    {
      id: 7,
      name: 'HQ',
      phone: '08030001111',
      address: '12 Market Road',
      city: 'Kano',
      state: 'Kano',
      is_primary: true,
      is_active: true,
    },
  ];

  const drafts = buildSettingsBranchDrafts(branches);

  assert.deepEqual(drafts, {
    7: {
      name: 'HQ',
      phone: '08030001111',
      address: '12 Market Road',
      city: 'Kano',
      state: 'Kano',
      is_primary: true,
      is_active: true,
    },
  });

  assert.equal(hasSettingsBranchDraftChanges(branches[0], drafts[7]), false);
  assert.equal(
    hasSettingsBranchDraftChanges(branches[0], { ...drafts[7], is_active: false }),
    true,
  );
});

test('branch metrics and summaries stay aligned with branch coverage priorities', () => {
  assert.deepEqual(
    buildSettingsBranchMetrics({
      summary: {
        branch_count: 4,
        active_branch_count: 3,
        branch_coverage_count: 2,
        warehouse_count: 5,
      },
    }),
    [
      {
        label: 'Active Branches',
        value: '3/4',
        helper: '1 inactive branch retained for audit visibility',
        tone: 'emerald',
      },
      {
        label: 'Team Coverage',
        value: '2/4',
        helper: 'Shows how many branches currently have active member coverage',
        tone: 'sky',
      },
      {
        label: 'Warehouses Linked',
        value: '5',
        helper: 'Inventory routing still depends on warehouse setup, even when branch structure is ready first',
        tone: 'amber',
      },
    ],
  );

  assert.equal(
    formatSettingsBranchFootprint({
      active_member_count: 3,
      suspended_member_count: 1,
      warehouse_count: 2,
    }),
    '3 active members • 2 warehouses • 1 suspended',
  );
});

test('branch sorting and status notes prioritize primary and current workspace branches', () => {
  assert.deepEqual(
    sortSettingsBranches([
      { id: 3, name: 'North', is_primary: false, is_current_user_branch: false, is_active: true },
      { id: 1, name: 'HQ', is_primary: true, is_current_user_branch: false, is_active: true },
      { id: 2, name: 'South', is_primary: false, is_current_user_branch: true, is_active: true },
      { id: 4, name: 'Archive', is_primary: false, is_current_user_branch: false, is_active: false },
    ]).map((branch) => branch.id),
    [1, 2, 3, 4],
  );

  assert.equal(
    buildSettingsBranchStatusNote({ is_primary: true }),
    'Primary branch changes affect the default workspace location shown across admin surfaces.',
  );
  assert.equal(
    buildSettingsBranchStatusNote({ is_primary: false, is_active: false }),
    'Inactive branches stay visible for history, but they should not receive new member assignments.',
  );
  assert.equal(
    buildSettingsBranchStatusNote({ is_primary: false, is_active: true, active_member_count: 2 }),
    'Move or suspend active members here before you try to deactivate this branch.',
  );
});
