import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSettingsTeamCreateDefaults,
  buildSettingsTeamMemberDrafts,
  buildSettingsTeamMetrics,
  formatSettingsTeamModuleSummary,
  hasSettingsTeamDraftChanges,
  sortSettingsTeamMembers,
} from '../src/lib/settingsTeam.js';

test('team module summary keeps module labels compact and readable', () => {
  assert.equal(
    formatSettingsTeamModuleSummary(['dashboard', 'inventory', 'reports']),
    'Dashboard, Inventory, Reports',
  );

  assert.equal(
    formatSettingsTeamModuleSummary(['dashboard', 'inventory', 'reports', 'cashbook']),
    'Dashboard, Inventory, Reports +1 more',
  );

  assert.equal(formatSettingsTeamModuleSummary([]), 'Dashboard visibility only');
});

test('team defaults prefer a non-owner role and the first active branch', () => {
  assert.deepEqual(
    buildSettingsTeamCreateDefaults(
      [
        { slug: 'admin' },
        { slug: 'manager' },
      ],
      [
        { id: 2, is_active: false },
        { id: 3, is_active: true },
      ],
    ),
    {
      name: '',
      email: '',
      phone: '',
      role_slug: 'manager',
      branch_id: '3',
      password: '',
    },
  );
});

test('team member drafts mirror editable access state and detect changes safely', () => {
  const members = [
    { id: 7, role_slug: 'manager', branch_id: 4, status: 'active' },
  ];

  const drafts = buildSettingsTeamMemberDrafts(members);

  assert.deepEqual(drafts, {
    7: {
      role_slug: 'manager',
      branch_id: '4',
      status: 'active',
    },
  });

  assert.equal(hasSettingsTeamDraftChanges(members[0], drafts[7]), false);
  assert.equal(
    hasSettingsTeamDraftChanges(members[0], { ...drafts[7], status: 'suspended' }),
    true,
  );
});

test('team metrics and member sorting stay aligned with owner-facing priorities', () => {
  assert.deepEqual(
    buildSettingsTeamMetrics({
      summary: {
        active_member_count: 3,
        suspended_member_count: 1,
        branch_coverage_count: 2,
      },
      roles: [{ slug: 'admin' }, { slug: 'manager' }],
      branches: [{ id: 1 }, { id: 2 }, { id: 3 }],
    }),
    [
      {
        label: 'Active Members',
        value: '3',
        helper: '1 suspended member still retained for audit visibility',
        tone: 'emerald',
      },
      {
        label: 'Roles Available',
        value: '2',
        helper: 'Business-scoped roles stay aligned with Taska permission modules',
        tone: 'violet',
      },
      {
        label: 'Branch Coverage',
        value: '2/3',
        helper: 'Shows how many branches currently have assigned team coverage',
        tone: 'sky',
      },
    ],
  );

  assert.deepEqual(
    sortSettingsTeamMembers([
      { id: 2, name: 'Cashier Grace', role_slug: 'cashier', status: 'active', is_current_user: false },
      { id: 1, name: 'Owner Ada', role_slug: 'admin', status: 'active', is_current_user: true },
      { id: 3, name: 'Manager Mary', role_slug: 'manager', status: 'suspended', is_current_user: false },
    ]).map((member) => member.id),
    [1, 2, 3],
  );
});
