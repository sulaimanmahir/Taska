function moduleLabel(module) {
  return String(module ?? '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim();
}

export function formatSettingsTeamModuleSummary(modules = [], limit = 3) {
  const labels = [...new Set(modules.filter(Boolean).map(moduleLabel))];

  if (labels.length === 0) {
    return 'Dashboard visibility only';
  }

  if (labels.length <= limit) {
    return labels.join(', ');
  }

  const visible = labels.slice(0, limit).join(', ');
  const hiddenCount = labels.length - limit;

  return `${visible} +${hiddenCount} more`;
}

export function buildSettingsTeamMetrics({ summary = {}, roles = [], branches = [] } = {}) {
  const activeMembers = Number(summary?.active_member_count ?? 0);
  const suspendedMembers = Number(summary?.suspended_member_count ?? 0);
  const coveredBranches = Number(summary?.branch_coverage_count ?? 0);

  return [
    {
      label: 'Active Members',
      value: activeMembers.toLocaleString(),
      helper: suspendedMembers > 0
        ? `${suspendedMembers} suspended member${suspendedMembers === 1 ? '' : 's'} still retained for audit visibility`
        : 'Everyone listed here can currently operate in this workspace',
      tone: activeMembers > 0 ? 'emerald' : 'amber',
    },
    {
      label: 'Roles Available',
      value: roles.length.toLocaleString(),
      helper: 'Business-scoped roles stay aligned with Taska permission modules',
      tone: 'violet',
    },
    {
      label: 'Branch Coverage',
      value: `${coveredBranches}/${branches.length}`,
      helper: branches.length > 0
        ? 'Shows how many branches currently have assigned team coverage'
        : 'Create a branch before assigning branch-scoped members',
      tone: 'sky',
    },
  ];
}

export function buildSettingsTeamCreateDefaults(roles = [], branches = []) {
  const preferredRole = roles.find((role) => role.slug !== 'admin') ?? roles[0] ?? null;
  const preferredBranch = branches.find((branch) => branch.is_active) ?? branches[0] ?? null;

  return {
    name: '',
    email: '',
    phone: '',
    role_slug: preferredRole?.slug ?? '',
    branch_id: preferredBranch?.id ? String(preferredBranch.id) : '',
    password: '',
  };
}

export function buildSettingsTeamMemberDrafts(members = []) {
  return Object.fromEntries(
    members.map((member) => [
      member.id,
      {
        role_slug: member.role_slug ?? '',
        branch_id: member.branch_id ? String(member.branch_id) : '',
        status: member.status ?? 'active',
      },
    ]),
  );
}

export function hasSettingsTeamDraftChanges(member, draft) {
  if (!member || !draft) {
    return false;
  }

  return (
    draft.role_slug !== (member.role_slug ?? '')
    || draft.branch_id !== (member.branch_id ? String(member.branch_id) : '')
    || draft.status !== (member.status ?? 'active')
  );
}

export function sortSettingsTeamMembers(members = []) {
  return [...members].sort((left, right) => {
    if (left.is_current_user !== right.is_current_user) {
      return left.is_current_user ? -1 : 1;
    }

    if (left.status !== right.status) {
      return left.status === 'active' ? -1 : 1;
    }

    if (left.role_slug !== right.role_slug) {
      if (left.role_slug === 'admin') {
        return -1;
      }

      if (right.role_slug === 'admin') {
        return 1;
      }
    }

    return String(left.name ?? '').localeCompare(String(right.name ?? ''));
  });
}
