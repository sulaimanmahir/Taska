export function buildTransferOverviewMetrics({
  warehouses = [],
  inventoryItems = [],
  movements = [],
} = {}) {
  const activeWarehouses = warehouses.filter((warehouse) => warehouse?.is_active !== false);
  const defaultWarehouse = warehouses.find((warehouse) => warehouse?.is_default);
  const warehouseIdsWithStock = new Set(
    inventoryItems
      .map((item) => item?.warehouse_id)
      .filter(Boolean)
  );
  const lowStockWarehouseIds = new Set(
    inventoryItems
      .filter((item) => Number(item?.quantity || 0) <= Number(item?.reorder_point || 0))
      .map((item) => item?.warehouse_id)
      .filter(Boolean)
  );

  return [
    {
      label: 'Active Warehouses',
      value: activeWarehouses.length,
      helper: 'Locations currently available for internal stock movement planning.',
      tone: 'sky',
    },
    {
      label: 'Stocked Locations',
      value: warehouseIdsWithStock.size,
      helper: 'Warehouses already carrying tracked inventory that can be rebalanced.',
      tone: 'emerald',
    },
    {
      label: 'Low-Stock Warehouses',
      value: lowStockWarehouseIds.size,
      helper: 'Locations already showing reorder pressure before transfer decisions are made.',
      tone: 'amber',
    },
    {
      label: 'Recent Movements',
      value: movements.length,
      helper: 'Latest stock ledger activity available to support transfer review.',
      tone: 'violet',
    },
    {
      label: 'Default Warehouse',
      value: defaultWarehouse?.name || 'Not set',
      helper: 'Primary warehouse that anchors internal stock routing.',
      tone: 'slate',
    },
  ];
}

export function buildTransferWarehouseCard(warehouse, inventoryItems = []) {
  const warehouseItems = inventoryItems.filter((item) => String(item?.warehouse_id) === String(warehouse?.id));
  const trackedSkus = warehouseItems.length;
  const totalUnits = warehouseItems.reduce((sum, item) => sum + Number(item?.quantity || 0), 0);
  const lowStockCount = warehouseItems.filter(
    (item) => Number(item?.quantity || 0) <= Number(item?.reorder_point || 0)
  ).length;

  return {
    id: warehouse?.id,
    title: warehouse?.name || 'Warehouse',
    branchLabel: warehouse?.branch?.name || 'No branch linked',
    statusLabel: warehouse?.is_active !== false ? 'Active' : 'Inactive',
    isDefault: Boolean(warehouse?.is_default),
    trackedSkus,
    totalUnits,
    lowStockCount,
    description: warehouse?.description || 'No warehouse note recorded yet.',
  };
}

export function buildTransferMovementCard(movement) {
  return {
    id: movement?.id,
    title: movement?.product?.name || 'Inventory movement',
    warehouseLabel: movement?.warehouse?.name || 'Unknown warehouse',
    movementTypeLabel: String(movement?.movement_type || 'movement').replaceAll('_', ' '),
    quantityLabel: Number(movement?.quantity || 0),
    notesLabel: movement?.notes || 'No movement note recorded.',
    timestampLabel: movement?.created_at || '',
  };
}
