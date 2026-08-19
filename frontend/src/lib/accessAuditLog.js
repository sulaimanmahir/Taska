const ACTION_LABELS = {
  member_added: 'Added team member',
  member_updated: 'Updated team member access',
  branch_created: 'Created branch',
  branch_updated: 'Updated branch',
};

export function formatAuditAction(action) {
  return ACTION_LABELS[action] || action;
}

const FIELD_LABELS = {
  role_slug: 'Role',
  branch_id: 'Branch',
  status: 'Status',
  name: 'Name',
  is_primary: 'Primary branch',
  is_active: 'Active',
};

function formatFieldValue(field, value) {
  if (value === null || value === undefined) {
    return '-';
  }

  if (field === 'is_primary' || field === 'is_active') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}

export function buildAuditChangeSummary(changes = {}) {
  return Object.entries(changes).map(([field, { from, to }]) => ({
    field,
    label: FIELD_LABELS[field] || field,
    fromLabel: formatFieldValue(field, from),
    toLabel: formatFieldValue(field, to),
  }));
}

function formatRelativeTime(isoString) {
  if (!isoString) return '';

  const then = new Date(isoString).getTime();
  const diffMinutes = Math.round((Date.now() - then) / 60000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

export function buildAuditLogEntry(log) {
  return {
    id: log.id,
    actionLabel: formatAuditAction(log.action),
    actorName: log.actor_name || 'System',
    subjectLabel: log.subject_label || 'Unknown',
    changeSummary: buildAuditChangeSummary(log.changes),
    timeLabel: formatRelativeTime(log.created_at),
  };
}
