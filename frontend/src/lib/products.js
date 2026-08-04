import { formatCurrencyNGN } from './financeFormatters.js';

export function createProductForm() {
  return {
    name: '',
    sku: '',
    category_id: '',
    cost_price: '',
    selling_price: '',
    low_stock_alert: '10',
    track_inventory: 'yes',
    product_type: 'good',
  };
}

export function buildProductPayload(form = {}) {
  return {
    name: form.name.trim(),
    sku: form.sku.trim() || null,
    category_id: form.category_id ? Number(form.category_id) : null,
    cost_price: form.cost_price === '' ? null : Number(form.cost_price),
    selling_price: Number(form.selling_price),
    low_stock_alert: form.low_stock_alert === '' ? null : Number(form.low_stock_alert),
    track_inventory: form.track_inventory || 'yes',
    product_type: form.product_type || 'good',
  };
}

export function buildInventorySummaryByProduct(items = []) {
  return items.reduce((summary, item) => {
    const productId = item.product_id ?? item.product?.id;

    if (!productId) {
      return summary;
    }

    const quantity = Number(item.quantity || 0);
    const reservedQuantity = Number(item.reserved_quantity || 0);
    const reorderPoint = Number(item.reorder_point || 0);
    const current = summary[productId] || {
      quantity: 0,
      reservedQuantity: 0,
      reorderPoint: 0,
      warehouseCount: 0,
      stockValue: 0,
    };

    summary[productId] = {
      quantity: current.quantity + quantity,
      reservedQuantity: current.reservedQuantity + reservedQuantity,
      reorderPoint: current.reorderPoint + reorderPoint,
      warehouseCount: current.warehouseCount + 1,
      stockValue: current.stockValue + (quantity * Number(item.product?.cost_price || 0)),
    };

    return summary;
  }, {});
}

export function buildProductOverviewMetrics({
  products = [],
  totalProducts = 0,
  lowStockTotal = 0,
  inventorySummary = {},
} = {}, formatCurrency = formatCurrencyNGN) {
  const activeProducts = products.filter((product) => product.is_active !== false);
  const trackedProducts = products.filter((product) => product.track_inventory !== 'no');
  const catalogValue = Object.values(inventorySummary).reduce((sum, item) => sum + Number(item.stockValue || 0), 0);
  const latestProduct = [...products]
    .sort((left, right) => String(right.created_at || '').localeCompare(String(left.created_at || '')))[0];

  return [
    {
      label: 'Catalog Total',
      value: totalProducts.toLocaleString(),
      helper: 'Products available across the current business catalog.',
      tone: 'sky',
    },
    {
      label: 'Active on Screen',
      value: activeProducts.length.toLocaleString(),
      helper: 'Visible products currently marked active for selling.',
      tone: 'emerald',
    },
    {
      label: 'Inventory Tracked',
      value: trackedProducts.length.toLocaleString(),
      helper: 'Visible products configured to participate in stock control.',
      tone: 'violet',
    },
    {
      label: 'Low Stock Watch',
      value: lowStockTotal.toLocaleString(),
      helper: 'Products already inside the low-stock threshold.',
      tone: lowStockTotal > 0 ? 'amber' : 'sky',
    },
    {
      label: 'Visible Stock Value',
      value: formatCurrency(catalogValue),
      helper: latestProduct?.name ? `Latest catalog item: ${latestProduct.name}.` : 'No catalog activity yet.',
      tone: catalogValue > 0 ? 'rose' : 'slate',
    },
  ];
}

export function buildProductRow(product = {}, inventorySummary = {}, formatCurrency = formatCurrencyNGN) {
  const summary = inventorySummary[product.id] || null;
  const explicitAvailableQuantity = product?.available_quantity ?? product?.availableQuantity;
  const explicitStockStatus = product?.stock_status ?? product?.stockStatus;
  const quantity = explicitAvailableQuantity === null || explicitAvailableQuantity === undefined
    ? Number(summary?.quantity || 0)
    : Number(explicitAvailableQuantity);
  const reorderPoint = Number(summary?.reorderPoint || product.low_stock_alert || 0);
  const availableQuantity = explicitAvailableQuantity === null || explicitAvailableQuantity === undefined
    ? quantity - Number(summary?.reservedQuantity || 0)
    : quantity;
  const isLowStock = explicitStockStatus === 'low_stock' || (quantity > 0 && reorderPoint > 0 && quantity <= reorderPoint);
  const isOutOfStock = explicitStockStatus === 'out_of_stock' || (quantity <= 0 && product.track_inventory !== 'no');

  return {
    id: product.id,
    title: product.name || 'Product',
    skuLabel: product.sku || 'No SKU',
    categoryLabel: product.category?.name || 'Uncategorized',
    typeLabel: product.product_type || 'good',
    trackInventoryLabel: product.track_inventory === 'no' ? 'Manual' : 'Tracked',
    stockLabel: product.track_inventory === 'no'
      ? 'Not tracked'
      : explicitStockStatus === 'out_of_stock'
        ? 'Out of stock'
        : explicitStockStatus === 'low_stock'
          ? 'Low stock'
          : `${quantity.toLocaleString()} on hand`,
    stockHelper: product.track_inventory === 'no'
      ? 'Stock movement is not tracked for this item.'
      : explicitStockStatus === 'out_of_stock'
        ? 'No available stock remains for this product.'
        : explicitStockStatus === 'low_stock'
          ? 'Stock is approaching the configured low-stock threshold.'
          : `${availableQuantity.toLocaleString()} available${summary ? ` across ${summary.warehouseCount} location${summary.warehouseCount === 1 ? '' : 's'}` : ''}`,
    pricingLabel: `${formatCurrency(product.cost_price || 0)} / ${formatCurrency(product.selling_price || 0)}`,
    statusLabel: product.is_active !== false ? 'Active' : 'Inactive',
    stockTone: isOutOfStock ? 'rose' : isLowStock ? 'amber' : 'emerald',
  };
}
