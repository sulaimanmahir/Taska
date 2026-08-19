import test from 'node:test';
import assert from 'node:assert/strict';

import { buildAuditChangeSummary, buildAuditLogEntry, formatAuditAction } from '../src/lib/accessAuditLog.js';

test('formatAuditAction humanizes known actions and falls back safely', () => {
  assert.equal(formatAuditAction('member_added'), 'Added team member');
  assert.equal(formatAuditAction('branch_updated'), 'Updated branch');
  assert.equal(formatAuditAction('unknown_action'), 'unknown_action');
});

test('buildAuditChangeSummary formats boolean fields as Yes/No and passes through others', () => {
  const summary = buildAuditChangeSummary({
    role_slug: { from: 'staff', to: 'admin' },
    is_active: { from: true, to: false },
  });

  assert.deepEqual(summary, [
    { field: 'role_slug', label: 'Role', fromLabel: 'staff', toLabel: 'admin' },
    { field: 'is_active', label: 'Active', fromLabel: 'Yes', toLabel: 'No' },
  ]);
});

test('buildAuditChangeSummary tolerates missing changes', () => {
  assert.deepEqual(buildAuditChangeSummary(), []);
});

test('buildAuditChangeSummary formats null values as a dash', () => {
  const summary = buildAuditChangeSummary({ branch_id: { from: null, to: 5 } });
  assert.equal(summary[0].fromLabel, '-');
  assert.equal(summary[0].toLabel, '5');
});

test('buildAuditLogEntry shapes a full log row for display', () => {
  const entry = buildAuditLogEntry({
    id: 1,
    action: 'member_updated',
    actor_name: 'Business Owner',
    subject_label: 'Manager Mary',
    changes: { role_slug: { from: 'staff', to: 'admin' } },
    created_at: new Date().toISOString(),
  });

  assert.equal(entry.actionLabel, 'Updated team member access');
  assert.equal(entry.actorName, 'Business Owner');
  assert.equal(entry.subjectLabel, 'Manager Mary');
  assert.equal(entry.changeSummary.length, 1);
  assert.equal(entry.timeLabel, 'just now');
});

test('buildAuditLogEntry falls back to "System" for a null actor', () => {
  const entry = buildAuditLogEntry({ id: 1, action: 'branch_created', actor_name: null, subject_label: 'HQ', changes: {} });
  assert.equal(entry.actorName, 'System');
});
