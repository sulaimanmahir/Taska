import { formatCurrencyNGN } from './financeFormatters.js';

export function createInventoryAdjustmentForm() {
  return {
    inventory_item_id: '',
    quantity: '',
    type: 'add',
    reason: 'Cycle count adjustment',
  };
}

export function buildInventoryAdjustmentPayload(form = {}) {
  return {
    inventory_item_id: Number(form.inventory_item_id),
    quantity: Number(form.quantity || 0),
    type: form.type || 'add',
    reason: form.reason?.trim() || '',
  };
}

export function validateInventoryAdjustmentPayload(payload = {}) {
  const normalizedQuantity = Number(payload.quantity ?? 0);

  if (!Number.isFinite(normalizedQuantity) || normalizedQuantity < 0) {
    return { isValid: false, error: 'Quantity must be greater than or equal to 0.' };
  }

  if (!payload.inventory_item_id || Number.isNaN(Number(payload.inventory_item_id))) {
    return { isValid: false, error: 'Please select an inventory line.' };
  }

  if (!payload.reason || !String(payload.reason).trim()) {
    return { isValid: false, error: 'Please provide an adjustment reason.' };
  }

  return { isValid: true };
}

export function buildInventoryOverviewMetrics(items = [], formatCurrency = formatCurrencyNGN) {
  const lowStock = items.filter((item) => Number(item.quantity || 0) <= Number(item.reorder_point || 0));
  const outOfStock = items.filter((item) => Number(item.quantity || 0) <= 0);
  const reservedQuantity = items.reduce((sum, item) => sum + Number(item.reserved_quantity || 0), 0);
  const stockValue = items.reduce(
    (sum, item) => sum + (Number(item.quantity || 0) * Number(item.product?.cost_price || 0)),
    0
  );
  const activeWarehouses = new Set(items.map((item) => item.warehouse?.id).filter(Boolean));

  return [
    {
      label: 'Stock Lines',
      value: items.length.toLocaleString(),
      helper: 'Inventory records currently being monitored across your active stock locations.',
      tone: 'sky',
    },
    {
      label: 'Low Stock',
      value: lowStock.length.toLocaleString(),
      helper: 'Items already at or below their recorded reorder point.',
      tone: lowStock.length > 0 ? 'amber' : 'emerald',
    },
    {
      label: 'Out of Stock',
      value: outOfStock.length.toLocaleString(),
      helper: 'Inventory lines that are currently exhausted and need replenishment.',
      tone: outOfStock.length > 0 ? 'rose' : 'sky',
    },
    {
      label: 'Reserved Quantity',
      value: reservedQuantity.toLocaleString(),
      helper: 'Units already committed and no longer freely available for immediate use.',
      tone: 'violet',
    },
    {
      label: 'Stock Value',
      value: formatCurrency(stockValue),
      helper: `${activeWarehouses.size} warehouse location${activeWarehouses.size === 1 ? '' : 's'} currently represented in this view.`,
      tone: stockValue > 0 ? 'emerald' : 'slate',
    },
  ];
}

export function filterInventoryItems(items = [], searchTerm = '', filter = 'all') {
  const query = searchTerm.trim().toLowerCase();

  const filteredByStatus = items.filter((item) => {
    const quantity = Number(item.quantity || 0);
    const reorderPoint = Number(item.reorder_point || 0);

    if (filter === 'low') {
      return quantity > 0 && quantity <= reorderPoint;
    }

    if (filter === 'out') {
      return quantity <= 0;
    }

    return true;
  });

  if (!query) {
    return filteredByStatus;
  }

  return filteredByStatus.filter((item) => {
    const fields = [
      item.product?.name,
      item.product?.sku,
      item.product?.category?.name,
      item.warehouse?.name,
      item.warehouse?.code,
    ];

    return fields.some((field) => String(field ?? '').toLowerCase().includes(query));
  });
}

export function buildInventoryRow(item = {}, formatCurrency = formatCurrencyNGN) {
  const quantity = Number(item.quantity || 0);
  const reservedQuantity = Number(item.reserved_quantity || 0);
  const reorderPoint = Number(item.reorder_point || 0);
  const availableQuantity = quantity - reservedQuantity;

  let statusLabel = 'Healthy';
  let statusTone = 'emerald';

  if (quantity <= 0) {
    statusLabel = 'Out of Stock';
    statusTone = 'rose';
  } else if (quantity <= reorderPoint) {
    statusLabel = 'Low Stock';
    statusTone = 'amber';
  }

  return {
    id: item.id,
    title: item.product?.name || 'Product',
    skuLabel: item.product?.sku || 'No SKU',
    categoryLabel: item.product?.category?.name || 'Uncategorized',
    warehouseLabel: item.warehouse?.name || 'No warehouse',
    quantityLabel: quantity.toLocaleString(),
    reservedLabel: reservedQuantity.toLocaleString(),
    availableLabel: availableQuantity.toLocaleString(),
    reorderPointLabel: reorderPoint.toLocaleString(),
    pricingLabel: `${formatCurrency(item.product?.cost_price || 0)} / ${formatCurrency(item.product?.selling_price || 0)}`,
    statusLabel,
    statusTone,
  };
}

export function buildInventoryMovementRow(movement = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: movement.id,
    title: movement.product?.name || 'Product',
    warehouseLabel: movement.warehouse?.name || 'No warehouse',
    typeLabel: movement.movement_type || 'adjustment',
    quantityLabel: Number(movement.quantity || 0).toLocaleString(),
    beforeAfterLabel: `${Number(movement.previous_quantity || 0).toLocaleString()} -> ${Number(movement.new_quantity || 0).toLocaleString()}`,
    valueHint: formatCurrency(Number(movement.product?.cost_price || 0) * Number(movement.quantity || 0)),
    notesLabel: movement.notes || 'No note captured',
  };
}
