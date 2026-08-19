export function buildSettingsWarehouseCreateDefaults() {
  return {
    name: '',
    branch_id: '',
    description: '',
    address: '',
    is_default: false,
  };
}

export function buildSettingsWarehouseDrafts(warehouses = []) {
  return Object.fromEntries(
    warehouses.map((warehouse) => [
      warehouse.id,
      {
        name: warehouse.name ?? '',
        branch_id: warehouse.branch_id ? String(warehouse.branch_id) : '',
        description: warehouse.description ?? '',
        address: warehouse.address ?? '',
        is_default: warehouse.is_default === true,
        is_active: warehouse.is_active !== false,
      },
    ]),
  );
}

export function hasSettingsWarehouseDraftChanges(warehouse, draft) {
  if (!warehouse || !draft) {
    return false;
  }

  return (
    draft.name.trim() !== String(warehouse.name ?? '')
    || draft.branch_id !== (warehouse.branch_id ? String(warehouse.branch_id) : '')
    || draft.description.trim() !== String(warehouse.description ?? '')
    || draft.address.trim() !== String(warehouse.address ?? '')
    || draft.is_default !== (warehouse.is_default === true)
    || draft.is_active !== (warehouse.is_active !== false)
  );
}

export function sortSettingsWarehouses(warehouses = []) {
  return [...warehouses].sort((left, right) => {
    if (left.is_default !== right.is_default) {
      return left.is_default ? -1 : 1;
    }

    if (left.is_active !== right.is_active) {
      return left.is_active ? -1 : 1;
    }

    return String(left.name ?? '').localeCompare(String(right.name ?? ''));
  });
}

export function buildSettingsWarehouseMetrics(warehouses = []) {
  const total = warehouses.length;
  const active = warehouses.filter((warehouse) => warehouse.is_active !== false).length;
  const unassigned = warehouses.filter((warehouse) => !warehouse.branch_id).length;
  const inactive = Math.max(total - active, 0);

  return [
    {
      label: 'Active Warehouses',
      value: `${active}/${total}`,
      helper: inactive > 0
        ? `${inactive} inactive warehouse${inactive === 1 ? '' : 's'} retained for audit visibility`
        : 'Every warehouse is currently available for stock routing',
      tone: active > 0 ? 'emerald' : 'amber',
    },
    {
      label: 'Not Assigned to a Branch',
      value: String(unassigned),
      helper: unassigned > 0
        ? 'Orders still route to the single business-wide default warehouse until a warehouse is tied to a branch'
        : 'Every warehouse is linked to a branch',
      tone: unassigned > 0 ? 'amber' : 'violet',
    },
  ];
}

export function formatSettingsWarehouseBranchLabel(warehouse = {}) {
  return warehouse.branch?.name || 'Not assigned to a branch';
}

export function buildSettingsWarehouseStatusNote(warehouse = {}) {
  if (warehouse.is_default) {
    return 'The default warehouse is used business-wide whenever a sale or purchase doesn’t resolve a more specific warehouse.';
  }

  if (warehouse.is_active === false) {
    return 'Inactive warehouses stay visible for history, but should not receive new stock or transactions.';
  }

  if (!warehouse.branch_id) {
    return 'Assign this warehouse to a branch so its stock is scoped correctly as the business grows.';
  }

  return 'This warehouse can be promoted to default or paused later if operations move elsewhere.';
}
