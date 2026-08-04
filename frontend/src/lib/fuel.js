import { formatCurrencyNGN } from './financeFormatters.js';

export const fuelTypes = ['petrol', 'diesel', 'kerosene', 'cooking_gas'];

export function getFuelCurrentDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getFuelCurrentDateTime(date = new Date()) {
  return date.toISOString().slice(0, 16);
}

export function getFuelShiftOpenedAt(date = new Date()) {
  return new Date(date.getTime() - 6 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

export function createFuelTankForm() {
  return {
    name: '',
    fuel_type: 'petrol',
    capacity_litres: '',
    current_stock_litres: '',
    reorder_level_litres: '',
    price_per_litre: '',
  };
}

export function createFuelPumpForm() {
  return {
    fuel_tank_id: '',
    name: '',
    code: '',
    attendant_name: '',
    nozzle_count: '1',
    meter_reading_start: '',
    meter_reading_current: '',
  };
}

export function createFuelReadingForm(date = new Date()) {
  return {
    fuel_pump_id: '',
    attendant_name: '',
    shift_name: 'Morning',
    reading_date: getFuelCurrentDate(date),
    opening_reading: '',
    closing_reading: '',
    unit_price: '',
    cash_reported: '',
  };
}

export function createFuelDipForm(date = new Date()) {
  return {
    fuel_tank_id: '',
    dipped_at: getFuelCurrentDateTime(date),
    opening_stock_litres: '',
    deliveries_received_litres: '0',
    closing_stock_litres: '',
    notes: '',
  };
}

export function createFuelShiftForm(date = new Date()) {
  return {
    attendant_name: '',
    shift_name: 'Morning',
    opened_at: getFuelShiftOpenedAt(date),
    closed_at: getFuelCurrentDateTime(date),
    cash_expected: '',
    cash_reported: '',
    recovery_amount: '0',
  };
}

export function createFuelPriceForm() {
  return {
    fuel_type: 'petrol',
    new_price: '',
    changed_by_name: '',
    reason: '',
  };
}

export function buildFuelOverviewMetrics(summary = {}, formatCurrency = formatCurrencyNGN) {
  return [
    {
      label: 'Sales Today',
      value: formatCurrency(summary?.sales_today || 0),
      helper: 'Pump revenue already captured in the current operating day.',
      tone: 'emerald',
    },
    {
      label: 'Litres Sold',
      value: summary?.litres_today || 0,
      helper: 'Fuel volume moved through active nozzles today.',
      tone: 'sky',
    },
    {
      label: 'Low Tanks',
      value: summary?.low_stock_tanks || 0,
      helper: 'Tank lines nearing refill pressure before stockout risk.',
      tone: 'amber',
    },
    {
      label: 'Anomaly Alerts',
      value: summary?.anomaly_alerts || 0,
      helper: 'Variance and fraud signals still waiting for owner review.',
      tone: 'rose',
    },
  ];
}

export function buildFuelLossMetrics(summary = {}, formatCurrency = formatCurrencyNGN) {
  return [
    {
      label: 'Shortage Today',
      value: formatCurrency(summary?.shortage_today || 0),
      helper: 'Cash or stock shortage still unresolved in today\'s control cycle.',
      tone: 'rose',
    },
    {
      label: 'Recovery Today',
      value: formatCurrency(summary?.recovery_today || 0),
      helper: 'Recovered variance already pushed back into the station books.',
      tone: 'amber',
    },
    {
      label: 'Dip Variance',
      value: `${Number(summary?.dip_variance_today || 0).toFixed(2)} L`,
      helper: 'Wet-stock variance between expected and observed tank position.',
      tone: 'sky',
    },
  ];
}

export function buildFuelDeskMetrics(
  summary = {},
  tanks = [],
  pumps = [],
  alerts = [],
  formatCurrency = formatCurrencyNGN,
) {
  const lowStock = tanks.filter((tank) => Number(tank.current_stock_litres || 0) <= Number(tank.reorder_level_litres || 0)).length;
  const activePumps = pumps.filter((pump) => pump.is_active !== false).length;

  return [
    ...buildFuelOverviewMetrics(summary, formatCurrency),
    {
      label: 'Tank Lines',
      value: tanks.length,
      helper: 'Fuel tanks currently visible in the wet-stock control register.',
      tone: 'violet',
    },
    {
      label: 'Active Pumps',
      value: activePumps,
      helper: 'Pump lines currently positioned to move fuel through the day.',
      tone: 'sky',
    },
    {
      label: 'Low Stock Watch',
      value: lowStock,
      helper: 'Tank lines already at or below reorder pressure.',
      tone: 'amber',
    },
    {
      label: 'Open Alerts',
      value: alerts.length,
      helper: 'Variance, anomaly, or fraud signals still visible in the station watchlist.',
      tone: 'rose',
    },
  ];
}

export function buildFuelReadingPayload(readingForm = {}) {
  return {
    ...readingForm,
    opening_reading: readingForm.opening_reading === '' ? null : Number(readingForm.opening_reading),
    closing_reading: Number(readingForm.closing_reading || 0),
    unit_price: readingForm.unit_price === '' ? null : Number(readingForm.unit_price),
    cash_reported: readingForm.cash_reported === '' ? null : Number(readingForm.cash_reported),
  };
}

export function buildFuelTankPayload(tankForm = {}) {
  return {
    ...tankForm,
    capacity_litres: Number(tankForm.capacity_litres || 0),
    current_stock_litres: Number(tankForm.current_stock_litres || 0),
    reorder_level_litres: Number(tankForm.reorder_level_litres || 0),
    price_per_litre: Number(tankForm.price_per_litre || 0),
  };
}

export function buildFuelPumpPayload(pumpForm = {}) {
  return {
    ...pumpForm,
    fuel_tank_id: pumpForm.fuel_tank_id || null,
    nozzle_count: Number(pumpForm.nozzle_count || 1),
    meter_reading_start: Number(pumpForm.meter_reading_start || 0),
    meter_reading_current: Number(pumpForm.meter_reading_current || pumpForm.meter_reading_start || 0),
  };
}

export function buildFuelDipPayload(dipForm = {}) {
  return {
    ...dipForm,
    opening_stock_litres: dipForm.opening_stock_litres === '' ? null : Number(dipForm.opening_stock_litres),
    deliveries_received_litres: Number(dipForm.deliveries_received_litres || 0),
    closing_stock_litres: Number(dipForm.closing_stock_litres || 0),
  };
}

export function buildFuelShiftPayload(shiftForm = {}) {
  return {
    ...shiftForm,
    cash_expected: Number(shiftForm.cash_expected || 0),
    cash_reported: Number(shiftForm.cash_reported || 0),
    recovery_amount: Number(shiftForm.recovery_amount || 0),
  };
}

export function buildFuelPriceChangePayload(priceForm = {}) {
  return {
    ...priceForm,
    new_price: Number(priceForm.new_price || 0),
  };
}

export function filterFuelAlerts(alerts = [], query = '') {
  const search = query.trim().toLowerCase();

  if (!search) {
    return alerts;
  }

  return alerts.filter((alert) =>
    [alert.alert_type, alert.details, alert.severity]
      .some((field) => String(field ?? '').toLowerCase().includes(search))
  );
}

export function buildFuelTankCard(tank = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: tank.id,
    title: tank.name || 'Fuel tank',
    fuelLabel: (tank.fuel_type || 'petrol').replaceAll('_', ' '),
    stockLabel: `${Number(tank.current_stock_litres || 0).toFixed(2)} L in stock`,
    reorderLabel: `Reorder at ${Number(tank.reorder_level_litres || 0).toFixed(2)} L`,
    priceLabel: formatCurrency(tank.price_per_litre || 0),
  };
}

export function buildFuelPumpCard(pump = {}) {
  return {
    id: pump.id,
    title: pump.name || 'Fuel pump',
    tankLabel: pump.tank?.name || 'No tank linked',
    attendantLabel: pump.attendant_name || 'No attendant assigned',
    nozzleLabel: `${pump.nozzle_count || 0} nozzles`,
  };
}

export function buildFuelAlertItem(alert = {}) {
  return {
    id: alert.id,
    title: (alert.alert_type || 'alert').replaceAll('_', ' '),
    details: alert.details || '',
    severityLabel: alert.severity || 'medium',
  };
}
