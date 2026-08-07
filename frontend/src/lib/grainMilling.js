import { formatCurrencyNGN } from './financeFormatters.js';

export const grainTypeOptions = [
  { value: 'maize', label: 'Maize' },
  { value: 'rice', label: 'Rice' },
  { value: 'sorghum', label: 'Sorghum' },
  { value: 'millet', label: 'Millet' },
  { value: 'wheat', label: 'Wheat' },
  { value: 'groundnut', label: 'Groundnut' },
  { value: 'other', label: 'Other' },
];

export function formatGrainType(grainType) {
  return grainTypeOptions.find((option) => option.value === grainType)?.label ?? (grainType ?? '');
}

export function createGrainMillingBatchForm() {
  return {
    milling_date: new Date().toISOString().slice(0, 10),
    grain_type: 'maize',
    input_quantity_kg: '',
    output_quantity_kg: '',
    byproduct_quantity_kg: '',
    wastage_quantity_kg: '',
    labour_cost: '',
    electricity_cost: '',
    packaging_cost: '',
    notes: '',
  };
}

export function buildGrainMillingBatchPayload(form = {}) {
  return {
    milling_date: form.milling_date,
    grain_type: form.grain_type,
    input_quantity_kg: Number(form.input_quantity_kg || 0),
    output_quantity_kg: Number(form.output_quantity_kg || 0),
    byproduct_quantity_kg: Number(form.byproduct_quantity_kg || 0),
    wastage_quantity_kg: Number(form.wastage_quantity_kg || 0),
    labour_cost: Number(form.labour_cost || 0),
    electricity_cost: Number(form.electricity_cost || 0),
    packaging_cost: Number(form.packaging_cost || 0),
    notes: form.notes || null,
  };
}

export function buildGrainMillingOverviewMetrics(summary = {}, formatCurrency = formatCurrencyNGN) {
  return [
    { label: 'Batches today', value: String(summary.batches_today ?? 0), tone: 'violet' },
    { label: 'Input processed', value: `${summary.input_today_kg ?? 0} kg`, tone: 'slate' },
    { label: 'Output produced', value: `${summary.output_today_kg ?? 0} kg`, tone: 'emerald' },
    { label: 'Average yield', value: `${summary.average_yield_percent ?? 0}%`, tone: 'sky' },
    { label: 'Byproduct recovered', value: `${summary.byproduct_today_kg ?? 0} kg`, tone: 'amber' },
    { label: 'Processing cost today', value: formatCurrency(summary.processing_cost_today ?? 0), tone: 'rose' },
  ];
}

export function buildGrainMillingBatchCard(batch = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: batch.id,
    batchNumber: batch.batch_number,
    grainTypeLabel: formatGrainType(batch.grain_type),
    millingDate: batch.milling_date,
    statusLabel: (batch.status ?? '').replaceAll('_', ' '),
    inputLabel: `${batch.input_quantity_kg ?? 0} kg in`,
    outputLabel: `${batch.output_quantity_kg ?? 0} kg out`,
    byproductLabel: `${batch.byproduct_quantity_kg ?? 0} kg byproduct`,
    wastageLabel: `${batch.wastage_quantity_kg ?? 0} kg waste`,
    yieldLabel: `${batch.yield_percent ?? 0}% yield`,
    totalCostLabel: formatCurrency(batch.total_cost ?? 0),
  };
}
