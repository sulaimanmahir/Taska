import { formatCurrencyNGN } from './financeFormatters.js';

export function createFarmPlotForm() {
  return {
    name: '',
    location: '',
    size_hectares: '',
    soil_type: '',
  };
}

export function createFarmCycleForm() {
  return {
    plot_id: '',
    crop_name: '',
    season_name: '',
    planting_date: '',
    expected_harvest_date: '',
    planted_area_hectares: '',
    status: 'planned',
  };
}

export function createFarmInputForm() {
  return {
    planting_cycle_id: '',
    input_type: 'fertilizer',
    input_name: '',
    quantity: '',
    unit: 'kg',
    cost: '',
    applied_on: '',
  };
}

export function createFarmHarvestForm() {
  return {
    planting_cycle_id: '',
    quantity_harvested: '',
    unit: 'kg',
    estimated_revenue: '',
    loss_quantity: '',
    harvested_on: '',
  };
}

export function buildFarmOverviewMetrics(summary = {}, formatCurrency = formatCurrencyNGN) {
  return [
    ['Active Plots', summary.active_plots ?? 0, 'emerald'],
    ['Hectares Cultivated', summary.hectares_under_cultivation ?? 0, 'lime'],
    ['Input Cost Today', formatCurrency(summary.input_cost_today ?? 0), 'amber'],
    ['Harvest Revenue', formatCurrency(summary.harvest_revenue_today ?? 0), 'sky'],
  ];
}

export function buildFarmDeskMetrics(summary = {}, plots = [], plantingCycles = [], inputLogs = [], harvestLogs = [], formatCurrency = formatCurrencyNGN) {
  const activeCycles = plantingCycles.filter((cycle) => cycle.status !== 'harvested' && cycle.status !== 'closed').length;
  const openHarvests = plantingCycles.filter((cycle) => cycle.status === 'growing' || cycle.status === 'planted').length;
  const lossEvents = harvestLogs.filter((entry) => Number(entry.loss_quantity || 0) > 0).length;
  const recentInputCost = inputLogs.reduce((sum, entry) => sum + Number(entry.cost || 0), 0);

  return [
    {
      label: 'Planting Cycles',
      value: activeCycles,
      helper: 'Crop cycles still moving through planting, growth, and expected harvest windows.',
      tone: 'sky',
    },
    {
      label: 'Plots Tracked',
      value: plots.length,
      helper: 'Named plots already mapped into the farm operations register.',
      tone: 'emerald',
    },
    {
      label: 'Input Spend Logged',
      value: formatCurrency(recentInputCost),
      helper: 'Captured fertilizer, chemical, seed, and field-input cost already posted to the desk.',
      tone: 'amber',
    },
    {
      label: 'Harvest Queue',
      value: openHarvests,
      helper: 'Cycles still approaching harvest and needing close field attention.',
      tone: 'lime',
    },
    {
      label: 'Loss Events',
      value: lossEvents,
      helper: 'Harvest logs already carrying loss quantities that need review.',
      tone: 'rose',
    },
    {
      label: 'Revenue Potential',
      value: formatCurrency(summary.harvest_revenue_today ?? 0),
      helper: 'Recorded harvest value currently visible on the field desk.',
      tone: 'violet',
    },
  ];
}

export function buildFarmFieldPulseMetrics(summary = {}) {
  return [
    { label: 'Harvest Today', value: summary.harvest_today ?? 0, tone: 'emerald' },
    { label: 'Losses Today', value: summary.losses_today ?? 0, tone: 'rose' },
  ];
}

export function buildFarmCycleOptionLabel(cycle = {}) {
  return `${cycle.crop_name || 'Crop'} | ${cycle.plot?.name || 'Plot'}`;
}

export function buildFarmPlotPayload(plotForm = {}) {
  return {
    ...plotForm,
    size_hectares: Number(plotForm.size_hectares || 0),
  };
}

export function buildFarmCyclePayload(cycleForm = {}) {
  return {
    ...cycleForm,
    plot_id: Number(cycleForm.plot_id),
    planted_area_hectares: Number(cycleForm.planted_area_hectares || 0),
  };
}

export function buildFarmInputPayload(inputForm = {}) {
  return {
    ...inputForm,
    planting_cycle_id: Number(inputForm.planting_cycle_id),
    quantity: Number(inputForm.quantity || 0),
    cost: Number(inputForm.cost || 0),
  };
}

export function buildFarmHarvestPayload(harvestForm = {}) {
  return {
    ...harvestForm,
    planting_cycle_id: Number(harvestForm.planting_cycle_id),
    quantity_harvested: Number(harvestForm.quantity_harvested || 0),
    estimated_revenue: Number(harvestForm.estimated_revenue || 0),
    loss_quantity: Number(harvestForm.loss_quantity || 0),
  };
}

export function filterFarmPlots(plots = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return plots;

  return plots.filter((plot) =>
    [plot.name, plot.location, plot.soil_type]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query)
  );
}

export function filterFarmCycles(cycles = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return cycles;

  return cycles.filter((cycle) =>
    [cycle.crop_name, cycle.season_name, cycle.status, cycle.plot?.name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query)
  );
}

export function filterFarmHarvests(harvests = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return harvests;

  return harvests.filter((harvest) =>
    [harvest.planting_cycle?.crop_name, harvest.planting_cycle?.plot?.name, harvest.unit, harvest.harvested_on]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query)
  );
}

export function buildFarmPlotCard(plot = {}) {
  return {
    id: plot.id,
    title: plot.name || 'Plot',
    meta: `${plot.location || 'Unknown location'} | ${Number(plot.size_hectares || 0).toFixed(1)} ha | ${plot.soil_type || 'Soil pending'}`,
  };
}

export function buildFarmCycleCard(cycle = {}) {
  return {
    id: cycle.id,
    title: cycle.crop_name || 'Crop cycle',
    meta: `${cycle.plot?.name || 'Plot'} | ${cycle.season_name || 'Season'} | ${cycle.status || 'planned'}`,
    dateLabel: `${cycle.planting_date || 'No planting date'} to ${cycle.expected_harvest_date || 'No harvest date'}`,
  };
}

export function buildFarmHarvestCard(harvest = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: harvest.id,
    title: harvest.planting_cycle?.crop_name || 'Harvest log',
    meta: `${harvest.planting_cycle?.plot?.name || 'Plot'} | ${Number(harvest.quantity_harvested || 0).toFixed(1)} ${harvest.unit || 'kg'}`,
    revenueLabel: formatCurrency(harvest.estimated_revenue || 0),
    lossLabel: `${Number(harvest.loss_quantity || 0).toFixed(1)} lost`,
  };
}
