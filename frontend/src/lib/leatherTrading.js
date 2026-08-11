import { formatCurrencyNGN } from './financeFormatters.js';

export const hideTypeOptions = [
  { value: 'cattle', label: 'Cattle' },
  { value: 'goat', label: 'Goat' },
  { value: 'sheep', label: 'Sheep' },
  { value: 'camel', label: 'Camel' },
  { value: 'other', label: 'Other' },
];

export function formatHideType(hideType) {
  return hideTypeOptions.find((option) => option.value === hideType)?.label ?? (hideType ?? '');
}

export function createLeatherProcessingBatchForm() {
  return {
    processing_date: new Date().toISOString().slice(0, 10),
    hide_type: 'cattle',
    input_hide_count: '',
    input_weight_kg: '',
    output_sqft: '',
    reject_count: '',
    tanning_chemical_cost: '',
    labour_cost: '',
    other_cost: '',
    notes: '',
  };
}

export function buildLeatherProcessingBatchPayload(form = {}) {
  return {
    processing_date: form.processing_date,
    hide_type: form.hide_type,
    input_hide_count: Number(form.input_hide_count || 0),
    input_weight_kg: form.input_weight_kg ? Number(form.input_weight_kg) : null,
    output_sqft: Number(form.output_sqft || 0),
    reject_count: Number(form.reject_count || 0),
    tanning_chemical_cost: Number(form.tanning_chemical_cost || 0),
    labour_cost: Number(form.labour_cost || 0),
    other_cost: Number(form.other_cost || 0),
    notes: form.notes || null,
  };
}

export function buildLeatherTradingOverviewMetrics(summary = {}, formatCurrency = formatCurrencyNGN) {
  return [
    { label: 'Batches today', value: String(summary.batches_today ?? 0), tone: 'violet' },
    { label: 'Hides processed', value: String(summary.hides_processed_today ?? 0), tone: 'slate' },
    { label: 'Output produced', value: `${summary.output_sqft_today ?? 0} sqft`, tone: 'emerald' },
    { label: 'Rejects today', value: String(summary.rejects_today ?? 0), tone: 'rose' },
    { label: 'Average reject rate', value: `${summary.average_reject_rate_percent ?? 0}%`, tone: 'amber' },
    { label: 'Processing cost today', value: formatCurrency(summary.processing_cost_today ?? 0), tone: 'sky' },
  ];
}

export function buildLeatherProcessingBatchCard(batch = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: batch.id,
    batchNumber: batch.batch_number,
    hideTypeLabel: formatHideType(batch.hide_type),
    processingDate: batch.processing_date,
    statusLabel: (batch.status ?? '').replaceAll('_', ' '),
    inputLabel: `${batch.input_hide_count ?? 0} hides in`,
    outputLabel: `${batch.output_sqft ?? 0} sqft out`,
    rejectLabel: `${batch.reject_count ?? 0} rejects`,
    rejectRateLabel: `${batch.reject_rate_percent ?? 0}% reject rate`,
    totalCostLabel: formatCurrency(batch.total_cost ?? 0),
  };
}
