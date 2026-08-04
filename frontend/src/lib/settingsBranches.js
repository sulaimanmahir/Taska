export function buildSettingsBranchCreateDefaults() {
  return {
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    is_primary: false,
  };
}

export function buildSettingsBranchDrafts(branches = []) {
  return Object.fromEntries(
    branches.map((branch) => [
      branch.id,
      {
        name: branch.name ?? '',
        phone: branch.phone ?? '',
        address: branch.address ?? '',
        city: branch.city ?? '',
        state: branch.state ?? '',
        is_primary: branch.is_primary === true,
        is_active: branch.is_active !== false,
      },
    ]),
  );
}

export function hasSettingsBranchDraftChanges(branch, draft) {
  if (!branch || !draft) {
    return false;
  }

  return (
    draft.name.trim() !== String(branch.name ?? '')
    || draft.phone.trim() !== String(branch.phone ?? '')
    || draft.address.trim() !== String(branch.address ?? '')
    || draft.city.trim() !== String(branch.city ?? '')
    || draft.state.trim() !== String(branch.state ?? '')
    || draft.is_primary !== (branch.is_primary === true)
    || draft.is_active !== (branch.is_active !== false)
  );
}

export function sortSettingsBranches(branches = []) {
  return [...branches].sort((left, right) => {
    if (left.is_primary !== right.is_primary) {
      return left.is_primary ? -1 : 1;
    }

    if (left.is_current_user_branch !== right.is_current_user_branch) {
      return left.is_current_user_branch ? -1 : 1;
    }

    if (left.is_active !== right.is_active) {
      return left.is_active ? -1 : 1;
    }

    return String(left.name ?? '').localeCompare(String(right.name ?? ''));
  });
}

export function buildSettingsBranchMetrics({ summary = {}, branches = [] } = {}) {
  const branchCount = Number(summary?.branch_count ?? branches.length);
  const activeBranchCount = Number(
    summary?.active_branch_count
      ?? branches.filter((branch) => branch.is_active !== false).length,
  );
  const coveredBranchCount = Number(
    summary?.branch_coverage_count
      ?? branches.filter((branch) => Number(branch.active_member_count ?? 0) > 0).length,
  );
  const warehouseCount = Number(
    summary?.warehouse_count
      ?? branches.reduce((total, branch) => total + Number(branch.warehouse_count ?? 0), 0),
  );
  const inactiveBranchCount = Math.max(branchCount - activeBranchCount, 0);

  return [
    {
      label: 'Active Branches',
      value: `${activeBranchCount}/${branchCount}`,
      helper: inactiveBranchCount > 0
        ? `${inactiveBranchCount} inactive branch${inactiveBranchCount === 1 ? '' : 'es'} retained for audit visibility`
        : 'Every branch is currently open for team assignment and reporting',
      tone: activeBranchCount > 0 ? 'emerald' : 'amber',
    },
    {
      label: 'Team Coverage',
      value: `${coveredBranchCount}/${branchCount}`,
      helper: branchCount > 0
        ? 'Shows how many branches currently have active member coverage'
        : 'Create a branch before assigning branch-scoped teammates',
      tone: coveredBranchCount === activeBranchCount && activeBranchCount > 0 ? 'violet' : 'sky',
    },
    {
      label: 'Warehouses Linked',
      value: warehouseCount.toLocaleString(),
      helper: 'Inventory routing still depends on warehouse setup, even when branch structure is ready first',
      tone: 'amber',
    },
  ];
}

export function formatSettingsBranchFootprint(branch = {}) {
  const activeMembers = Number(branch?.active_member_count ?? 0);
  const suspendedMembers = Number(branch?.suspended_member_count ?? 0);
  const warehouses = Number(branch?.warehouse_count ?? 0);
  const parts = [
    `${activeMembers} active member${activeMembers === 1 ? '' : 's'}`,
    `${warehouses} warehouse${warehouses === 1 ? '' : 's'}`,
  ];

  if (suspendedMembers > 0) {
    parts.push(`${suspendedMembers} suspended`);
  }

  return parts.join(' • ');
}

export function buildSettingsBranchStatusNote(branch = {}) {
  if (branch.is_primary) {
    return 'Primary branch changes affect the default workspace location shown across admin surfaces.';
  }

  if (branch.is_active === false) {
    return 'Inactive branches stay visible for history, but they should not receive new member assignments.';
  }

  if (Number(branch.active_member_count ?? 0) > 0) {
    return 'Move or suspend active members here before you try to deactivate this branch.';
  }

  return 'This branch can be promoted to primary or paused later if operations move elsewhere.';
}
