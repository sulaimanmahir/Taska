import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildProductionCostTrendPresentation,
  buildProductionDeskMetrics,
  buildProductionEnergyPayload,
  buildProductionBatchPayload,
  buildProductionBatchPresentation,
  buildProductionLowStockPresentation,
  buildProductionMaterialPayload,
  buildProductionOverviewMetrics,
  buildProductionPurchasePayload,
  buildProductionSpendPresentation,
  buildProductionSupplierBalancePresentation,
  buildProductionWastagePayload,
  createProductionBatchForm,
  createProductionEnergyForm,
  createProductionMaterialForm,
  createProductionMaterialUsageLine,
  createProductionOutputLine,
  createProductionPurchaseForm,
  createProductionWastageForm,
  filterProductionBatches,
  filterProductionMaterials,
  getProductionBatchStatusTone,
  updateProductionFormListItem,
} from '../src/lib/production.js';
import { formatCurrencyNGN } from '../src/lib/financeFormatters.js';

test('production overview metrics keep labels, values, and helper copy aligned', () => {
  const metrics = buildProductionOverviewMetrics({
    units_produced_today: 1200,
    units_sold_today: 1000,
    electricity_cost_today: 8500,
    packaging_cost_today: 24000,
    generator_fuel_today: 12500,
    profit_estimate_today: 46000,
    downtime_today: 45,
  });

  assert.equal(metrics.length, 6);
  assert.deepEqual(metrics[0], { label: 'Units Produced', value: 1200, tone: 'violet' });
  assert.equal(metrics[2].value, formatCurrencyNGN(8500));
  assert.equal(metrics[5].helper, 'Downtime today: 45 mins');
  assert.deepEqual(
    buildProductionDeskMetrics(
      {
        units_produced_today: 1200,
        units_sold_today: 1000,
        electricity_cost_today: 8500,
        packaging_cost_today: 24000,
        generator_fuel_today: 12500,
        profit_estimate_today: 46000,
        downtime_today: 45,
      },
      [
        { id: 1, status: 'in_progress', net_margin: 3000 },
        { id: 2, status: 'completed', net_margin: -500 },
      ],
      [{ id: 9 }],
    ).slice(6),
    [
      {
        label: 'Active Batches',
        value: 1,
        helper: 'Production runs currently consuming labour, stock, and power inside the factory workflow.',
        tone: 'sky',
      },
      {
        label: 'Low Stock Inputs',
        value: 1,
        helper: 'Raw materials already close enough to disruption that they can interrupt the next run.',
        tone: 'amber',
      },
      {
        label: 'Margin Watch',
        value: 1,
        helper: 'Completed batches that are no longer showing healthy positive margin after costs and losses.',
        tone: 'rose',
      },
    ],
  );
});

test('production low-stock presentation keeps supplier and quantity context readable', () => {
  const presentation = buildProductionLowStockPresentation({
    id: 7,
    name: 'Printed Sachet Nylon',
    material_category: 'packaging',
    quantity: 4,
    unit: 'roll',
    supplier_name: '',
  });

  assert.equal(presentation.id, 7);
  assert.equal(presentation.name, 'Printed Sachet Nylon');
  assert.equal(presentation.title, 'Printed Sachet Nylon');
  assert.equal(presentation.meta, 'packaging - 4 roll');
  assert.equal(presentation.supplierLabel, 'Not captured');
  assert.equal(presentation.reorderLabel, '0 reorder level');
  assert.equal(presentation.thresholdLabel, '0 critical threshold');
  assert.equal(presentation.unitCostLabel, formatCurrencyNGN(0));
});

test('production batch presentation aligns status, metrics, and actions', () => {
  const pending = buildProductionBatchPresentation({
    id: 1,
    batch_number: 'PB-001',
    production_date: '2026-05-25',
    total_output_quantity: 100,
    packaging_cost_total: 32000,
    status: 'pending',
    total_batch_cost: 78000,
    estimated_revenue: 110000,
    net_margin: 32000,
    downtime_minutes: 20,
  });
  const active = buildProductionBatchPresentation({
    id: 2,
    batch_number: 'PB-002',
    status: 'in_progress',
  });

  assert.equal(pending.batchNumber, 'PB-001');
  assert.equal(pending.outputLabel, '100 bags');
  assert.equal(pending.packagingCostLabel, formatCurrencyNGN(32000));
  assert.equal(pending.statusTone, 'bg-amber-50 text-amber-700');
  assert.equal(pending.runtimeLabel, '0h runtime | 0h public power | 0h generator');
  assert.equal(pending.lossesLabel, '0 tracked packaging losses');
  assert.equal(pending.notesLabel, 'No batch note captured.');
  assert.equal(pending.materialCountLabel, '0 material lines');
  assert.equal(pending.outputCountLabel, '0 output lines');
  assert.deepEqual(pending.metrics, [
    { label: 'Total Cost', value: formatCurrencyNGN(78000) },
    { label: 'Revenue', value: formatCurrencyNGN(110000) },
    { label: 'Net Margin', value: formatCurrencyNGN(32000) },
    { label: 'Downtime', value: '20 mins' },
  ]);
  assert.equal(pending.canStart, true);
  assert.equal(pending.canComplete, false);
  assert.equal(active.canStart, false);
  assert.equal(active.canComplete, true);
});

test('production spend helpers keep supplier totals and balances formatted', () => {
  const spend = buildProductionSpendPresentation({
    supplier_name: 'Kano Packaging Hub',
    total_spend: 55000,
  });
  const balance = buildProductionSupplierBalancePresentation({
    supplier_name: 'Kano Packaging Hub',
    total_spend: 55000,
    outstanding_balance: 18000,
  });

  assert.equal(spend.supplierName, 'Kano Packaging Hub');
  assert.equal(spend.totalSpendLabel, formatCurrencyNGN(55000));
  assert.equal(balance.spendLabel, formatCurrencyNGN(55000));
  assert.equal(balance.outstandingLabel, formatCurrencyNGN(18000));
  assert.deepEqual(buildProductionCostTrendPresentation({
    production_date: '2026-05-25',
    cost_per_bag: 180,
    estimated_revenue: 110000,
    net_margin: 32000,
    total_batch_cost: 78000,
  }), {
    id: '2026-05-25',
    dateLabel: '2026-05-25',
    costPerBagLabel: formatCurrencyNGN(180),
    revenueLabel: formatCurrencyNGN(110000),
    marginLabel: formatCurrencyNGN(32000),
    totalCostLabel: formatCurrencyNGN(78000),
  });
});

test('production batch status tone falls back safely for unknown states', () => {
  assert.equal(getProductionBatchStatusTone('completed'), 'bg-emerald-50 text-emerald-700');
  assert.equal(getProductionBatchStatusTone('unknown_state'), 'bg-slate-100 text-slate-700');
});

test('production batch form helpers create default rows and update targeted list items safely', () => {
  assert.deepEqual(createProductionMaterialForm(), {
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
  });
  assert.equal(createProductionPurchaseForm().raw_material_id, '');
  assert.equal(createProductionBatchForm().materials.length, 1);
  assert.equal(createProductionEnergyForm().energy_source, 'generator');
  assert.equal(createProductionWastageForm().loss_type, 'torn_sacks');
  assert.deepEqual(createProductionMaterialUsageLine(), {
    raw_material_id: '',
    quantity_used: '1',
    cost_per_unit: '0',
  });
  assert.deepEqual(createProductionOutputLine(), {
    product_id: '',
    quantity_produced: '0',
    selling_price: '0',
  });

  assert.deepEqual(
    updateProductionFormListItem(
      [
        { raw_material_id: '1', quantity_used: '4' },
        { raw_material_id: '2', quantity_used: '6' },
      ],
      1,
      'quantity_used',
      '8',
    ),
    [
      { raw_material_id: '1', quantity_used: '4' },
      { raw_material_id: '2', quantity_used: '8' },
    ],
  );
});

test('production batch payload helper normalizes nested batch form numbers consistently', () => {
  const payload = buildProductionBatchPayload({
    production_date: '2026-05-25',
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
    notes: 'Morning run',
    materials: [{ raw_material_id: '7', quantity_used: '4', cost_per_unit: '16000' }],
    outputs: [{ product_id: '11', quantity_produced: '100', selling_price: '220' }],
  });

  assert.equal(payload.machine_runtime_hours, 6);
  assert.equal(payload.generator_fuel_cost, 12500);
  assert.equal(payload.sachets_per_bag, 20);
  assert.deepEqual(payload.materials, [
    { raw_material_id: 7, quantity_used: 4, cost_per_unit: 16000 },
  ]);
  assert.deepEqual(payload.outputs, [
    { product_id: 11, quantity_produced: 100, selling_price: 220 },
  ]);
  assert.deepEqual(buildProductionMaterialPayload({
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
    supplier_balance: '5000',
    last_purchase_cost: '15000',
    description: 'Primary printed nylon',
  }), {
    name: 'Printed Sachet Nylon',
    sku: 'NYLON-001',
    unit: 'roll',
    material_category: 'packaging',
    quantity: 20,
    cost_per_unit: 15000,
    reorder_level: 10,
    low_stock_threshold: 5,
    supplier_name: 'Kano Packaging Hub',
    supplier_phone: '08030000000',
    supplier_balance: 5000,
    last_purchase_cost: 15000,
    description: 'Primary printed nylon',
  });
  assert.deepEqual(buildProductionPurchasePayload({
    raw_material_id: '7',
    supplier_name: 'Kano Packaging Hub',
    supplier_phone: '08030000000',
    quantity: '10',
    unit_cost: '16000',
    amount_paid: '120000',
    purchased_at: '2026-05-25',
    notes: 'Emergency replenishment',
  }), {
    raw_material_id: 7,
    supplier_name: 'Kano Packaging Hub',
    supplier_phone: '08030000000',
    quantity: 10,
    unit_cost: 16000,
    amount_paid: 120000,
    purchased_at: '2026-05-25',
    notes: 'Emergency replenishment',
  });
  assert.deepEqual(buildProductionEnergyPayload({
    production_batch_id: '4',
    energy_source: 'generator',
    runtime_hours: '3',
    cost: '12500',
    fuel_litres: '18',
    outage_minutes: '45',
    logged_at: '2026-05-25',
    notes: 'Generator covered shift',
  }), {
    production_batch_id: 4,
    energy_source: 'generator',
    runtime_hours: 3,
    cost: 12500,
    fuel_litres: 18,
    outage_minutes: 45,
    logged_at: '2026-05-25',
    notes: 'Generator covered shift',
  });
  assert.deepEqual(buildProductionWastagePayload({
    production_batch_id: '4',
    raw_material_id: '7',
    loss_type: 'torn_sacks',
    quantity: '2',
    estimated_cost: '1800',
    logged_at: '2026-05-25',
    notes: 'Packaging damage',
  }), {
    production_batch_id: 4,
    raw_material_id: 7,
    loss_type: 'torn_sacks',
    quantity: 2,
    estimated_cost: 1800,
    logged_at: '2026-05-25',
    notes: 'Packaging damage',
  });
  assert.deepEqual(filterProductionMaterials([
    { id: 1, name: 'Printed Sachet Nylon', supplier_name: 'Kano Packaging Hub', material_category: 'packaging' },
    { id: 2, name: 'Caustic Soda', supplier_name: 'Abuja Chem', material_category: 'chemical' },
  ], 'chem').map((entry) => entry.id), [2]);
  assert.deepEqual(filterProductionBatches([
    { id: 1, batch_number: 'PB-001', status: 'pending', notes: 'Morning dispatch', materials: [], outputs: [] },
    { id: 2, batch_number: 'PB-002', status: 'completed', notes: 'Wholesale retailer run', materials: [{ raw_material: { name: 'Printed Sachet Nylon' } }], outputs: [] },
  ], 'retailer').map((entry) => entry.id), [2]);
});
