import { formatCurrencyNGN } from './financeFormatters.js';

export function getAgroCurrentDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function createAgroForecastForm() {
  return {
    product_id: '',
    season_name: '',
    region_name: '',
    forecast_quantity: '',
    reserved_quantity: '',
    confidence_score: '',
  };
}

export function createAgroSubsidyForm(date = new Date()) {
  return {
    customer_id: '',
    product_id: '',
    programme_name: '',
    agency_name: '',
    region_name: '',
    season_name: '',
    input_category: 'fertilizer',
    quantity: '',
    unit_price: '',
    amount_received: '',
    sale_date: getAgroCurrentDate(date),
  };
}

export function createAgroRecoveryForm() {
  return {
    customer_id: '',
    region_name: '',
    credit_amount: '',
    recovered_amount: '',
    due_date: '',
  };
}

export function createAgroAdvisoryForm(date = new Date()) {
  return {
    customer_id: '',
    farmer_name: '',
    region_name: '',
    advisory_type: '',
    crop_or_input: '',
    recommendation: '',
    advised_on: getAgroCurrentDate(date),
    follow_up_date: '',
  };
}

export function buildAgroOverviewMetrics(summary = {}, formatCurrency = formatCurrencyNGN) {
  return [
    {
      label: 'Forecast Quantity',
      value: summary?.forecast_quantity || 0,
      helper: 'Projected seasonal demand currently captured across active regional plans.',
      tone: 'sky',
    },
    {
      label: 'Programme Sales',
      value: formatCurrency(summary?.programme_sales_total || 0),
      helper: 'Government and programme-driven agro sales already booked.',
      tone: 'emerald',
    },
    {
      label: 'Subsidy Receivable',
      value: formatCurrency(summary?.subsidy_receivable || 0),
      helper: 'Outstanding programme balances still squeezing working capital.',
      tone: 'amber',
    },
    {
      label: 'Open Recoveries',
      value: summary?.open_recoveries || 0,
      helper: 'Farmer credit cases still needing follow-up or closure.',
      tone: 'rose',
    },
  ];
}

export function buildAgroPressureMetrics(summary = {}, formatCurrency = formatCurrencyNGN) {
  return [
    {
      label: 'Receivable Pressure',
      value: formatCurrency(summary?.subsidy_receivable || 0),
      tone: 'amber',
    },
    {
      label: 'Farmer Credit',
      value: formatCurrency(summary?.outstanding_credit || 0),
      tone: 'rose',
    },
    {
      label: 'Forecast Confidence',
      value: `${summary?.avg_confidence || 0}%`,
      tone: 'sky',
    },
  ];
}

export function buildAgroDeskMetrics(
  summary = {},
  forecasts = [],
  subsidySales = [],
  recoveries = [],
  advisories = [],
  formatCurrency = formatCurrencyNGN,
) {
  const openRecoveries = recoveries.filter((recovery) => recovery.status !== 'recovered').length;
  const overdueRecoveries = recoveries.filter((recovery) => {
    if (!recovery.due_date || recovery.status === 'recovered') {
      return false;
    }

    return new Date(recovery.due_date) < new Date();
  }).length;
  const liveRegions = new Set(
    [
      ...forecasts.map((entry) => entry.region_name),
      ...subsidySales.map((entry) => entry.region_name),
      ...recoveries.map((entry) => entry.region_name),
      ...advisories.map((entry) => entry.region_name),
    ].filter(Boolean),
  ).size;

  return [
    ...buildAgroOverviewMetrics(summary, formatCurrency),
    {
      label: 'Live Regions',
      value: liveRegions,
      helper: 'Regions already represented across demand plans, subsidy flow, recovery, or advisory work.',
      tone: 'violet',
    },
    {
      label: 'Forecast Lines',
      value: forecasts.length,
      helper: 'Seasonal demand plans already captured for the next buying cycle.',
      tone: 'sky',
    },
    {
      label: 'Overdue Recoveries',
      value: overdueRecoveries,
      helper: 'Farmer credit balances already past due and likely to need escalation.',
      tone: 'rose',
    },
    {
      label: 'Advisory Touchpoints',
      value: advisories.length,
      helper: 'Field guidance records already feeding commercial intelligence back into the desk.',
      tone: 'emerald',
    },
    {
      label: 'Recovery Queue',
      value: openRecoveries,
      helper: 'Recovery cases still open and visible for follow-up or closure.',
      tone: 'amber',
    },
  ];
}

export function buildAgroForecastPayload(forecastForm = {}) {
  return {
    ...forecastForm,
    product_id: forecastForm.product_id || null,
    forecast_quantity: Number(forecastForm.forecast_quantity || 0),
    reserved_quantity: Number(forecastForm.reserved_quantity || 0),
    confidence_score: Number(forecastForm.confidence_score || 0),
  };
}

export function buildAgroSubsidySalePayload(subsidyForm = {}) {
  return {
    ...subsidyForm,
    customer_id: subsidyForm.customer_id || null,
    product_id: subsidyForm.product_id || null,
    quantity: Number(subsidyForm.quantity || 0),
    unit_price: Number(subsidyForm.unit_price || 0),
    amount_received: Number(subsidyForm.amount_received || 0),
  };
}

export function buildAgroRecoveryPayload(recoveryForm = {}) {
  return {
    ...recoveryForm,
    credit_amount: Number(recoveryForm.credit_amount || 0),
    recovered_amount: Number(recoveryForm.recovered_amount || 0),
  };
}

export function buildAgroAdvisoryPayload(advisoryForm = {}) {
  return {
    ...advisoryForm,
    customer_id: advisoryForm.customer_id || null,
  };
}

export function buildAgroRecoveryCompletionPayload(recovery = {}) {
  return { recovered_amount: recovery.credit_amount };
}

export function filterAgroForecasts(forecasts = [], query = '') {
  const search = query.trim().toLowerCase();

  if (!search) {
    return forecasts;
  }

  return forecasts.filter((forecast) =>
    [forecast.region_name, forecast.season_name, forecast.product?.name, forecast.forecast_quantity, forecast.reserved_quantity]
      .some((field) => String(field ?? '').toLowerCase().includes(search))
  );
}

export function filterAgroSubsidySales(sales = [], query = '') {
  const search = query.trim().toLowerCase();

  if (!search) {
    return sales;
  }

  return sales.filter((sale) =>
    [sale.programme_name, sale.agency_name, sale.region_name, sale.season_name, sale.customer?.name, sale.product?.name]
      .some((field) => String(field ?? '').toLowerCase().includes(search))
  );
}

export function filterAgroRecoveries(recoveries = [], query = '') {
  const search = query.trim().toLowerCase();

  if (!search) {
    return recoveries;
  }

  return recoveries.filter((recovery) =>
    [recovery.customer?.name, recovery.region_name, recovery.recovery_reference, recovery.status, recovery.due_date]
      .some((field) => String(field ?? '').toLowerCase().includes(search))
  );
}

export function filterAgroAdvisories(advisories = [], query = '') {
  const search = query.trim().toLowerCase();

  if (!search) {
    return advisories;
  }

  return advisories.filter((advisory) =>
    [advisory.advisory_type, advisory.region_name, advisory.crop_or_input, advisory.farmer_name, advisory.customer?.name]
      .some((field) => String(field ?? '').toLowerCase().includes(search))
  );
}

export function buildAgroProgrammeSaleCard(sale = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: sale.id,
    title: sale.programme_name || 'Programme sale',
    meta: `${sale.region_name || 'Region n/a'} - due ${formatCurrency((sale.amount_due || 0) - (sale.amount_received || 0))}`,
    detailLabel: `${sale.customer?.name || 'No farmer linked'} - ${sale.product?.name || 'General input'}`,
  };
}

export function buildAgroRecoveryCard(recovery = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: recovery.id,
    title: recovery.customer?.name || recovery.recovery_reference || 'Recovery case',
    meta: `${recovery.region_name || 'No region'} - due ${formatCurrency(recovery.outstanding_amount || 0)}`,
    dueLabel: recovery.due_date || 'No due date set',
    isRecovered: recovery.status === 'recovered',
  };
}

export function buildAgroForecastCard(forecast = {}) {
  return {
    id: forecast.id,
    title: `${forecast.region_name || 'No region'} - ${forecast.season_name || 'Season pending'}`,
    meta: `${forecast.product?.name || 'General input'} - forecast ${forecast.forecast_quantity} / reserved ${forecast.reserved_quantity}`,
    confidenceLabel: `${forecast.confidence_score || 0}% confidence`,
  };
}

export function buildAgroAdvisoryCard(advisory = {}) {
  return {
    id: advisory.id,
    title: advisory.advisory_type || 'Advisory',
    meta: `${advisory.region_name || 'No region'} - ${advisory.crop_or_input || 'General advisory'}`,
    farmerLabel: advisory.customer?.name || advisory.farmer_name || 'No farmer linked',
  };
}
