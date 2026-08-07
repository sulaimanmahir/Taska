import { formatCurrencyNGN } from './financeFormatters.js';

export const animalTypeOptions = [
  { value: 'cattle', label: 'Cattle' },
  { value: 'goat', label: 'Goat' },
  { value: 'sheep', label: 'Sheep' },
  { value: 'camel', label: 'Camel' },
  { value: 'poultry', label: 'Poultry' },
  { value: 'other', label: 'Other' },
];

export const transactionTypeOptions = [
  { value: 'intake', label: 'Intake (bought from herder/farmer)' },
  { value: 'sale', label: 'Sale (sold to buyer)' },
];

export function formatAnimalType(animalType) {
  return animalTypeOptions.find((option) => option.value === animalType)?.label ?? (animalType ?? '');
}

export function createLivestockMarketTransactionForm() {
  return {
    transaction_type: 'intake',
    animal_type: 'cattle',
    head_count: '',
    total_weight_kg: '',
    unit_price_per_kg: '',
    total_amount: '',
    counterparty_name: '',
    counterparty_phone: '',
    market_date: new Date().toISOString().slice(0, 10),
    notes: '',
  };
}

export function buildLivestockMarketTransactionPayload(form = {}) {
  return {
    transaction_type: form.transaction_type,
    animal_type: form.animal_type,
    head_count: Number(form.head_count || 0),
    total_weight_kg: form.total_weight_kg ? Number(form.total_weight_kg) : null,
    unit_price_per_kg: form.unit_price_per_kg ? Number(form.unit_price_per_kg) : null,
    total_amount: Number(form.total_amount || 0),
    counterparty_name: form.counterparty_name,
    counterparty_phone: form.counterparty_phone || null,
    market_date: form.market_date,
    notes: form.notes || null,
  };
}

export function buildLivestockMarketOverviewMetrics(summary = {}, formatCurrency = formatCurrencyNGN) {
  return [
    { label: 'Animals in holding pen', value: String(summary.animals_in_holding ?? 0), tone: 'violet' },
    { label: 'Intake today', value: String(summary.intake_head_count_today ?? 0), tone: 'slate' },
    { label: 'Sold today', value: String(summary.sale_head_count_today ?? 0), tone: 'emerald' },
    { label: 'Revenue today', value: formatCurrency(summary.revenue_today ?? 0), tone: 'sky' },
    { label: 'Intake cost today', value: formatCurrency(summary.intake_cost_today ?? 0), tone: 'amber' },
    { label: 'Avg sale price/kg', value: formatCurrency(summary.average_sale_price_per_kg ?? 0), tone: 'rose' },
  ];
}

export function buildLivestockMarketTransactionCard(transaction = {}, formatCurrency = formatCurrencyNGN) {
  const isSale = transaction.transaction_type === 'sale';

  return {
    id: transaction.id,
    transactionNumber: transaction.transaction_number,
    isSale,
    typeLabel: isSale ? 'Sale' : 'Intake',
    animalTypeLabel: formatAnimalType(transaction.animal_type),
    marketDate: transaction.market_date,
    headCountLabel: `${transaction.head_count ?? 0} head`,
    weightLabel: transaction.total_weight_kg ? `${transaction.total_weight_kg} kg` : null,
    counterpartyLabel: isSale ? `Sold to ${transaction.counterparty_name}` : `Bought from ${transaction.counterparty_name}`,
    totalAmountLabel: formatCurrency(transaction.total_amount ?? 0),
  };
}
