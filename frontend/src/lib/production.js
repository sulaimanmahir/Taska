import { formatCurrencyNGN } from './financeFormatters.js';

const batchStatusTones = {
  pending: 'bg-amber-50 text-amber-700',
  in_progress: 'bg-sky-50 text-sky-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-rose-50 text-rose-700',
};

function formatProductionLabel(value, fallback = 'Not set') {
  if (!value) {
    return fallback;
  }

  return String(value).replace(/_/g, ' ');
}

export function createProductionMaterialForm() {
  return {
    name: 'Printed Sachet Nylon',
    sku: 'NYLON-001',
    unit: 'roll',
    material_category: 'packaging',
    quantity: '20',
    cost_per_unit: '15000',
    reorder_level: '10',
    low_stock_threshold: '5',
    supplier_name: 'Kano Packaging Hub',
    supplier_phone: '08030000000',
    supplier_balance: '0',
    last_purchase_cost: '15000',
    description: 'Primary printed nylon for sachet water output.',
  };
}

export function createProductionPurchaseForm() {
  return {
    raw_material_id: '',
    supplier_name: 'Kano Packaging Hub',
    supplier_phone: '08030000000',
    quantity: '10',
    unit_cost: '16000',
    amount_paid: '120000',
    purchased_at: new Date().toISOString().slice(0, 10),
    notes: 'Emergency replenishment for the next dispatch cycle.',
  };
}

export function createProductionBatchForm() {
  return {
    production_date: new Date().toISOString().slice(0, 10),
    machine_runtime_hours: '6',
    downtime_minutes: '45',
    public_power_hours: '3',
    electricity_cost: '8500',
    generator_runtime_hours: '3',
    generator_fuel_cost: '12500',
    labour_cost: '9000',
    loading_cost: '3000',
    maintenance_allocation: '2500',
    sachets_per_bag: '20',
    leakage_losses: '4',
    torn_sacks: '2',
    damaged_nylon: '1',
    notes: 'Morning production run for wholesale dispatch.',
    materials: [{ raw_material_id: '', quantity_used: '4', cost_per_unit: '16000' }],
    outputs: [{ product_id: '', quantity_produced: '100', selling_price: '220' }],
  };
}

export function createProductionEnergyForm() {
  return {
    production_batch_id: '',
    energy_source: 'generator',
    runtime_hours: '3',
    cost: '12500',
    fuel_litres: '18',
    outage_minutes: '45',
    logged_at: new Date().toISOString().slice(0, 10),
    notes: 'Generator covered the main packaging shift.',
  };
}

export function createProductionWastageForm() {
  return {
    production_batch_id: '',
    raw_material_id: '',
    loss_type: 'torn_sacks',
    quantity: '2',
    estimated_cost: '1800',
    logged_at: new Date().toISOString().slice(0, 10),
    notes: 'Packaging damage during loading.',
  };
}

export function getProductionBatchStatusTone(status) {
  return batchStatusTones[status] || 'bg-slate-100 text-slate-700';
}

export function buildProductionOverviewMetrics(summary = {}) {
  return [
    { label: 'Units Produced', value: summary.units_produced_today ?? 0, tone: 'violet' },
    { label: 'Units Sold', value: summary.units_sold_today ?? 0, tone: 'sky' },
    { label: 'Electricity', value: formatCurrencyNGN(summary.electricity_cost_today), tone: 'amber' },
    { label: 'Packaging', value: formatCurrencyNGN(summary.packaging_cost_today), tone: 'indigo' },
    { label: 'Generator Fuel', value: formatCurrencyNGN(summary.generator_fuel_today), tone: 'rose' },
    {
      label: 'Profit Estimate',
      value: formatCurrencyNGN(summary.profit_estimate_today),
      helper: `Downtime today: ${summary.downtime_today ?? 0} mins`,
      tone: 'emerald',
    },
  ];
}

export function buildProductionDeskMetrics(summary = {}, batches = [], lowStockMaterials = []) {
  const activeBatches = batches.filter((batch) => batch.status === 'in_progress');
  const completedBatches = batches.filter((batch) => batch.status === 'completed');
  const marginWatch = completedBatches.filter((batch) => Number(batch.net_margin || 0) <= 0);

  return [
    ...buildProductionOverviewMetrics(summary),
    {
      label: 'Active Batches',
      value: activeBatches.length,
      helper: 'Production runs currently consuming labour, stock, and power inside the factory workflow.',
      tone: activeBatches.length > 0 ? 'sky' : 'emerald',
    },
    {
      label: 'Low Stock Inputs',
      value: lowStockMaterials.length,
      helper: 'Raw materials already close enough to disruption that they can interrupt the next run.',
      tone: lowStockMaterials.length > 0 ? 'amber' : 'emerald',
    },
    {
      label: 'Margin Watch',
      value: marginWatch.length,
      helper: 'Completed batches that are no longer showing healthy positive margin after costs and losses.',
      tone: marginWatch.length > 0 ? 'rose' : 'emerald',
    },
  ];
}

export function buildProductionLowStockPresentation(material) {
  return {
    id: material?.id,
    title: material?.name || 'Raw material',
    name: material?.name || 'Raw material',
    meta: `${formatProductionLabel(material?.material_category, 'material')} - ${material?.quantity ?? 0} ${material?.unit || ''}`.trim(),
    supplierLabel: material?.supplier_name || 'Not captured',
    reorderLabel: `${material?.reorder_level ?? 0} reorder level`,
    thresholdLabel: `${material?.low_stock_threshold ?? 0} critical threshold`,
    unitCostLabel: formatCurrencyNGN(material?.cost_per_unit || 0),
  };
}

export function buildProductionBatchPresentation(batch) {
  const totalLosses = Number(batch?.leakage_losses || 0) + Number(batch?.torn_sacks || 0) + Number(batch?.damaged_nylon || 0);

  return {
    id: batch?.id,
    batchNumber: batch?.batch_number || 'Production batch',
    productionDate: batch?.production_date || 'Not scheduled',
    outputLabel: `${batch?.total_output_quantity || 0} bags`,
    packagingCostLabel: formatCurrencyNGN(batch?.packaging_cost_total || 0),
    statusLabel: formatProductionLabel(batch?.status, 'pending'),
    statusTone: getProductionBatchStatusTone(batch?.status),
    metrics: [
      { label: 'Total Cost', value: formatCurrencyNGN(batch?.total_batch_cost || 0) },
      { label: 'Revenue', value: formatCurrencyNGN(batch?.estimated_revenue || 0) },
      { label: 'Net Margin', value: formatCurrencyNGN(batch?.net_margin || 0) },
      { label: 'Downtime', value: `${batch?.downtime_minutes || 0} mins` },
    ],
    runtimeLabel: `${batch?.machine_runtime_hours || 0}h runtime | ${batch?.public_power_hours || 0}h public power | ${batch?.generator_runtime_hours || 0}h generator`,
    lossesLabel: `${totalLosses} tracked packaging losses`,
    notesLabel: batch?.notes || 'No batch note captured.',
    materialCountLabel: `${batch?.materials?.length ?? 0} material lines`,
    outputCountLabel: `${batch?.outputs?.length ?? 0} output lines`,
    canStart: batch?.status === 'pending',
    canComplete: batch?.status === 'in_progress',
  };
}

export function buildProductionSpendPresentation(entry) {
  return {
    supplierName: entry?.supplier_name || 'Unknown supplier',
    totalSpendLabel: formatCurrencyNGN(entry?.total_spend || 0),
  };
}

export function buildProductionSupplierBalancePresentation(entry) {
  return {
    supplierName: entry?.supplier_name || 'Unknown supplier',
    spendLabel: formatCurrencyNGN(entry?.total_spend || 0),
    outstandingLabel: formatCurrencyNGN(entry?.outstanding_balance || 0),
  };
}

export function buildProductionCostTrendPresentation(entry) {
  return {
    id: entry?.production_date || 'trend',
    dateLabel: entry?.production_date || 'No date',
    costPerBagLabel: formatCurrencyNGN(entry?.cost_per_bag || 0),
    revenueLabel: formatCurrencyNGN(entry?.estimated_revenue || 0),
    marginLabel: formatCurrencyNGN(entry?.net_margin || 0),
    totalCostLabel: formatCurrencyNGN(entry?.total_batch_cost || 0),
  };
}

export function createProductionMaterialUsageLine() {
  return { raw_material_id: '', quantity_used: '1', cost_per_unit: '0' };
}

export function createProductionOutputLine() {
  return { product_id: '', quantity_produced: '0', selling_price: '0' };
}

export function updateProductionFormListItem(list = [], index, key, value) {
  return list.map((entry, entryIndex) => (
    entryIndex === index ? { ...entry, [key]: value } : entry
  ));
}

export function buildProductionBatchPayload(batchForm) {
  return {
    ...batchForm,
    machine_runtime_hours: Number(batchForm.machine_runtime_hours || 0),
    downtime_minutes: Number(batchForm.downtime_minutes || 0),
    public_power_hours: Number(batchForm.public_power_hours || 0),
    electricity_cost: Number(batchForm.electricity_cost || 0),
    generator_runtime_hours: Number(batchForm.generator_runtime_hours || 0),
    generator_fuel_cost: Number(batchForm.generator_fuel_cost || 0),
    labour_cost: Number(batchForm.labour_cost || 0),
    loading_cost: Number(batchForm.loading_cost || 0),
    maintenance_allocation: Number(batchForm.maintenance_allocation || 0),
    sachets_per_bag: Number(batchForm.sachets_per_bag || 20),
    leakage_losses: Number(batchForm.leakage_losses || 0),
    torn_sacks: Number(batchForm.torn_sacks || 0),
    damaged_nylon: Number(batchForm.damaged_nylon || 0),
    materials: (batchForm.materials || []).map((material) => ({
      raw_material_id: Number(material.raw_material_id),
      quantity_used: Number(material.quantity_used || 0),
      cost_per_unit: Number(material.cost_per_unit || 0),
    })),
    outputs: (batchForm.outputs || []).map((output) => ({
      product_id: Number(output.product_id),
      quantity_produced: Number(output.quantity_produced || 0),
      selling_price: Number(output.selling_price || 0),
    })),
  };
}

export function buildProductionMaterialPayload(materialForm = {}) {
  return {
    name: materialForm.name,
    sku: materialForm.sku || null,
    unit: materialForm.unit || null,
    material_category: materialForm.material_category || null,
    quantity: Number(materialForm.quantity || 0),
    cost_per_unit: Number(materialForm.cost_per_unit || 0),
    reorder_level: Number(materialForm.reorder_level || 0),
    low_stock_threshold: Number(materialForm.low_stock_threshold || 0),
    supplier_name: materialForm.supplier_name || null,
    supplier_phone: materialForm.supplier_phone || null,
    supplier_balance: Number(materialForm.supplier_balance || 0),
    last_purchase_cost: Number(materialForm.last_purchase_cost || 0),
    description: materialForm.description || null,
  };
}

export function buildProductionPurchasePayload(purchaseForm = {}) {
  return {
    raw_material_id: Number(purchaseForm.raw_material_id),
    supplier_name: purchaseForm.supplier_name,
    supplier_phone: purchaseForm.supplier_phone || null,
    quantity: Number(purchaseForm.quantity || 0),
    unit_cost: Number(purchaseForm.unit_cost || 0),
    amount_paid: Number(purchaseForm.amount_paid || 0),
    purchased_at: purchaseForm.purchased_at || null,
    notes: purchaseForm.notes || null,
  };
}

export function buildProductionEnergyPayload(energyForm = {}) {
  return {
    production_batch_id: energyForm.production_batch_id ? Number(energyForm.production_batch_id) : null,
    energy_source: energyForm.energy_source,
    runtime_hours: Number(energyForm.runtime_hours || 0),
    cost: Number(energyForm.cost || 0),
    fuel_litres: Number(energyForm.fuel_litres || 0),
    outage_minutes: Number(energyForm.outage_minutes || 0),
    logged_at: energyForm.logged_at || null,
    notes: energyForm.notes || null,
  };
}

export function buildProductionWastagePayload(wastageForm = {}) {
  return {
    production_batch_id: wastageForm.production_batch_id ? Number(wastageForm.production_batch_id) : null,
    raw_material_id: wastageForm.raw_material_id ? Number(wastageForm.raw_material_id) : null,
    loss_type: wastageForm.loss_type,
    quantity: Number(wastageForm.quantity || 0),
    estimated_cost: Number(wastageForm.estimated_cost || 0),
    logged_at: wastageForm.logged_at || null,
    notes: wastageForm.notes || null,
  };
}

export function filterProductionMaterials(materials = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return materials;
  }

  return materials.filter((material) => {
    const fields = [
      material.name,
      material.sku,
      material.material_category,
      material.supplier_name,
      material.unit,
      material.description,
    ];

    return fields.some((field) => String(field ?? '').toLowerCase().includes(query));
  });
}

export function filterProductionBatches(batches = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return batches;
  }

  return batches.filter((batch) => {
    const materialNames = (batch.materials ?? []).map((entry) => entry.raw_material?.name).join(' ');
    const outputNames = (batch.outputs ?? []).map((entry) => entry.product?.name).join(' ');
    const fields = [
      batch.batch_number,
      batch.production_date,
      batch.status,
      batch.notes,
      materialNames,
      outputNames,
    ];

    return fields.some((field) => String(field ?? '').toLowerCase().includes(query));
  });
}
