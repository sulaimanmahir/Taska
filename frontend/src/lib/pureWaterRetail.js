import { formatCurrencyNGN } from './financeFormatters.js';

export const pureWaterRetailPackageTypes = ['sachet', 'bag', 'bottle', 'crate', 'pack'];

export function createPureWaterRetailPriceTierForm() {
  return {
    customer_id: '',
    product_id: '',
    pricing_scope: 'wholesale',
    package_type: 'bag',
    minimum_quantity: '10',
    unit_price: '',
    crate_deposit: '0',
  };
}

export function createPureWaterRetailSaleForm() {
  return {
    customer_id: '',
    warehouse_id: '',
    sales_channel: 'retail',
    delivery_mode: 'counter',
    product_id: '',
    quantity: '',
    package_type: 'bag',
    units_per_package: '20',
    paid: '',
    payment_method: 'cash',
    notes: '',
  };
}

export function createPureWaterRetailMovementForm() {
  return {
    warehouse_id: '',
    product_id: '',
    movement_type: 'restock',
    package_type: 'bag',
    quantity: '',
    units_per_package: '20',
    notes: '',
  };
}

export function createPureWaterRetailCrateForm() {
  return {
    customer_id: '',
    product_id: '',
    movement_type: 'issue',
    crate_count: '',
    deposit_amount: '',
    notes: '',
  };
}

export function createPureWaterRetailTransferForm() {
  return {
    from_warehouse_id: '',
    to_warehouse_id: '',
    product_id: '',
    package_type: 'bag',
    quantity: '',
    units_per_package: '20',
    notes: '',
  };
}

export function buildPureWaterRetailOverviewMetrics(summary = {}, formatCurrency = formatCurrencyNGN) {
  return [
    { label: 'Revenue Today', value: formatCurrency(summary.revenue_today || 0), tone: 'sky' },
    { label: 'Packages Sold', value: summary.packages_sold_today || 0, tone: 'violet' },
    { label: 'Crates Outstanding', value: summary.crates_outstanding || 0, tone: 'amber' },
    { label: 'Retailer Debt', value: formatCurrency(summary.customer_debt || 0), tone: 'rose' },
  ];
}

export function buildPureWaterRetailDeskMetrics(overview = {}, formatCurrency = formatCurrencyNGN) {
  const movements = Array.isArray(overview?.package_movements) ? overview.package_movements : [];
  const crateLedger = Array.isArray(overview?.crate_ledgers) ? overview.crate_ledgers : [];
  const wastageEvents = movements.filter((movement) => movement?.movement_type === 'wastage').length;
  const restockEvents = movements.filter((movement) => movement?.movement_type === 'restock').length;
  const depositExposure = crateLedger.reduce((total, entry) => total + Number(entry?.deposit_amount || 0), 0);

  return [
    { label: 'Package Movements', value: movements.length, tone: 'sky' },
    { label: 'Restock Events', value: restockEvents, tone: 'emerald' },
    { label: 'Wastage Events', value: wastageEvents, tone: wastageEvents > 0 ? 'amber' : 'emerald' },
    { label: 'Crate Ledger Entries', value: crateLedger.length, tone: 'violet' },
    { label: 'Deposit Exposure', value: formatCurrency(depositExposure), tone: depositExposure > 0 ? 'amber' : 'emerald' },
    { label: 'Outlet Transfers', value: overview?.summary?.transfers_out_today || 0, tone: 'teal' },
  ];
}

export function getPureWaterRetailSelectedProduct(products = [], productId = '') {
  return products.find((product) => String(product.id) === String(productId)) || null;
}

export function getPureWaterRetailPredictedRevenue(priceTiers = [], saleForm = {}, selectedProduct = null) {
  const activeTier = priceTiers.find((tier) =>
    String(tier.product_id) === String(saleForm.product_id)
    && tier.package_type === saleForm.package_type
    && (tier.pricing_scope === saleForm.sales_channel || tier.pricing_scope === 'all')
    && Number(tier.minimum_quantity) <= Number(saleForm.quantity || 0)
    && (!tier.customer_id || String(tier.customer_id) === String(saleForm.customer_id || ''))
  );

  return Number(activeTier?.unit_price || selectedProduct?.selling_price || 0) * Number(saleForm.quantity || 0);
}

export function buildPureWaterRetailPriceTierPayload(priceTierForm = {}) {
  return {
    customer_id: priceTierForm.customer_id || null,
    product_id: Number(priceTierForm.product_id),
    pricing_scope: priceTierForm.pricing_scope,
    package_type: priceTierForm.package_type,
    minimum_quantity: Number(priceTierForm.minimum_quantity || 0),
    unit_price: Number(priceTierForm.unit_price || 0),
    crate_deposit: Number(priceTierForm.crate_deposit || 0),
  };
}

export function buildPureWaterRetailSalePayload(saleForm = {}) {
  return {
    customer_id: saleForm.customer_id || null,
    warehouse_id: saleForm.warehouse_id || null,
    sales_channel: saleForm.sales_channel,
    delivery_mode: saleForm.delivery_mode,
    items: [{
      product_id: Number(saleForm.product_id),
      quantity: Number(saleForm.quantity || 0),
      package_type: saleForm.package_type,
      units_per_package: Number(saleForm.units_per_package || 1),
    }],
    paid: Number(saleForm.paid || 0),
    payment_method: saleForm.payment_method,
    notes: saleForm.notes || null,
  };
}

export function buildPureWaterRetailMovementPayload(movementForm = {}) {
  return {
    warehouse_id: movementForm.warehouse_id || null,
    product_id: Number(movementForm.product_id),
    movement_type: movementForm.movement_type,
    package_type: movementForm.package_type,
    quantity: Number(movementForm.quantity || 0),
    units_per_package: Number(movementForm.units_per_package || 1),
    notes: movementForm.notes || null,
  };
}

export function buildPureWaterRetailCratePayload(crateForm = {}) {
  return {
    customer_id: crateForm.customer_id || null,
    product_id: crateForm.product_id ? Number(crateForm.product_id) : null,
    movement_type: crateForm.movement_type,
    crate_count: Number(crateForm.crate_count || 0),
    deposit_amount: Number(crateForm.deposit_amount || 0),
    notes: crateForm.notes || null,
  };
}

export function buildPureWaterRetailTransferPayload(transferForm = {}) {
  return {
    from_warehouse_id: Number(transferForm.from_warehouse_id),
    to_warehouse_id: Number(transferForm.to_warehouse_id),
    product_id: Number(transferForm.product_id),
    package_type: transferForm.package_type,
    quantity: Number(transferForm.quantity || 0),
    units_per_package: Number(transferForm.units_per_package || 1),
    notes: transferForm.notes || null,
  };
}

export function buildPureWaterRetailSaleReset(current = {}) {
  return { ...current, customer_id: '', product_id: '', quantity: '', paid: '', notes: '' };
}

export function buildPureWaterRetailMovementReset(current = {}) {
  return { ...current, product_id: '', quantity: '', notes: '' };
}

export function buildPureWaterRetailOwnerBoardCards(summary = {}, formatCurrency = formatCurrencyNGN) {
  return [
    {
      label: 'Wholesale vs Retail',
      value: formatCurrency((summary.wholesale_revenue_today || 0) + (summary.retail_revenue_today || 0)),
      helper: `Wholesale today: ${formatCurrency(summary.wholesale_revenue_today || 0)}. Retail today: ${formatCurrency(summary.retail_revenue_today || 0)}.`,
      tone: 'sky',
    },
    {
      label: 'Owner Watchlist',
      value: summary.low_stock_products || 0,
      helper: `Transfers out today: ${summary.transfers_out_today || 0}.`,
      tone: 'amber',
    },
  ];
}

export function buildPureWaterRetailMovementCard(movement = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: movement.id,
    title: movement.product?.name || 'Package movement',
    meta: `${movement.movement_type || 'movement'} | ${movement.package_type || 'bag'} | ${movement.quantity || 0}`,
    locationLabel: movement.warehouse?.name || 'Default warehouse',
    noteLabel: movement.notes || 'No note recorded',
    valueLabel: formatCurrency(Number(movement.quantity || 0) * Number(movement.product?.selling_price || 0)),
  };
}

export function buildPureWaterRetailCrateLedgerCard(entry = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: entry.id,
    title: entry.customer?.name || 'General crate movement',
    meta: `${entry.movement_type || 'issue'} | ${entry.crate_count || 0} crates`,
    balanceLabel: `Balance after: ${entry.balance_after || 0}`,
    depositLabel: formatCurrency(entry.deposit_amount || 0),
  };
}

export function filterPureWaterRetailMovements(movements = [], query = '') {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) {
    return movements;
  }

  return movements.filter((movement) =>
    [
      movement?.product?.name,
      movement?.movement_type,
      movement?.package_type,
      movement?.warehouse?.name,
      movement?.notes,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery))
  );
}

export function filterPureWaterRetailCrateLedger(entries = [], query = '') {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) {
    return entries;
  }

  return entries.filter((entry) =>
    [
      entry?.customer?.name,
      entry?.movement_type,
      entry?.notes,
      entry?.product?.name,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery))
  );
}
