import { formatCurrencyNGN } from './financeFormatters.js';

function formatLogisticsLabel(value, fallback = 'Not set') {
  if (!value) {
    return fallback;
  }

  return String(value).replaceAll('_', ' ');
}

function resolveLogisticsActualOrExpected(actualValue, expectedValue) {
  const actual = Number(actualValue || 0);

  if (actual > 0) {
    return actual;
  }

  return Number(expectedValue || 0);
}

export function buildLogisticsOverviewMetrics(summary = {}) {
  return [
    { label: 'Trips Today', value: summary.trips_today ?? 0, helper: 'Planned and active work.', tone: 'sky' },
    { label: 'Active Trips', value: summary.active_trips ?? 0, helper: 'Currently dispatched or in transit.', tone: 'violet' },
    { label: 'Revenue Today', value: formatCurrencyNGN(summary.revenue_today), helper: 'Transport revenue booked today.', tone: 'emerald' },
    { label: 'Profit Today', value: formatCurrencyNGN(summary.profit_today), helper: 'Margin left after visible trip costs.', tone: 'teal' },
    {
      label: 'Fuel Cost Today',
      value: formatCurrencyNGN(summary.fuel_cost_today),
      helper: `${Number(summary.litres_today ?? 0).toFixed(0)} litres logged.`,
      tone: 'amber',
    },
    { label: 'Fleet Active', value: summary.fleet_active ?? 0, helper: 'Assets ready for dispatch.', tone: 'cyan' },
    { label: 'Open Maintenance', value: summary.open_maintenance ?? 0, helper: 'Jobs still unresolved.', tone: 'rose' },
    { label: 'Delayed Stops', value: summary.delayed_stops ?? 0, helper: 'Stop-level execution pressure.', tone: 'orange' },
  ];
}

export function calculateProjectedTripProfit(tripForm = {}) {
  return (
    resolveLogisticsActualOrExpected(tripForm.actual_revenue, tripForm.expected_revenue)
    - resolveLogisticsActualOrExpected(tripForm.actual_fuel_cost, tripForm.expected_fuel_cost)
    - Number(tripForm.loading_cost || 0)
    - Number(tripForm.driver_allowance || 0)
    - Number(tripForm.maintenance_cost || 0)
    - Number(tripForm.other_cost || 0)
  );
}

export function buildLogisticsTripPayload(tripForm = {}) {
  return {
    ...tripForm,
    expected_revenue: Number(tripForm.expected_revenue || 0),
    actual_revenue: Number(tripForm.actual_revenue || 0),
    distance_km: Number(tripForm.distance_km || 0),
    expected_fuel_cost: Number(tripForm.expected_fuel_cost || 0),
    actual_fuel_cost: Number(tripForm.actual_fuel_cost || 0),
    loading_cost: Number(tripForm.loading_cost || 0),
    driver_allowance: Number(tripForm.driver_allowance || 0),
    maintenance_cost: Number(tripForm.maintenance_cost || 0),
    other_cost: Number(tripForm.other_cost || 0),
    stops: [
      {
        stop_name: tripForm.stop_name,
        location: tripForm.stop_location,
        expected_revenue: Number(tripForm.stop_expected_revenue || 0),
      },
    ],
  };
}

export function buildLogisticsSettlementQueueItem(trip) {
  return {
    id: trip?.id,
    tripCode: trip?.trip_code || 'Trip',
    routeName: trip?.route_name || 'Unnamed route',
    statusLabel: formatLogisticsLabel(trip?.status, 'planned'),
    completePayload: { status: 'completed', actual_revenue: trip?.expected_revenue },
    settlementPayload: { status: 'approved' },
  };
}

export function buildLogisticsTripPresentation(trip) {
  return {
    id: trip?.id,
    tripCode: trip?.trip_code || 'Trip',
    routeName: trip?.route_name || 'Unnamed route',
    routeSummary: `${trip?.origin || 'Unknown origin'} to ${trip?.destination || 'Unknown destination'}`,
    customerName: trip?.customer_name || 'No customer linked yet',
    revenueLabel: formatCurrencyNGN(trip?.actual_revenue || trip?.expected_revenue),
    profitLabel: formatCurrencyNGN(trip?.profit_estimate || 0),
    vehicleName: trip?.asset?.name || 'Unassigned',
    driverName: trip?.driver?.name || 'Unassigned',
    stops: (trip?.stops || []).map((stop) => ({
      id: stop.id,
      orderLabel: `Stop ${stop.stop_order}`,
      stopName: stop.stop_name,
      location: stop.location,
    })),
  };
}

export function buildLogisticsFuelLogPresentation(log) {
  return {
    id: log?.id,
    amountLabel: formatCurrencyNGN(log?.amount || 0),
    meta: `${Number(log?.litres || 0).toFixed(0)}L - ${log?.asset?.name || 'Fleet asset pending'}`,
  };
}

export function buildLogisticsMaintenanceLogPresentation(log) {
  return {
    id: log?.id,
    summary: log?.summary || 'Maintenance log',
    meta: `${formatCurrencyNGN(log?.cost || 0)} - ${log?.asset?.name || 'Fleet asset pending'}`,
  };
}

export function buildLogisticsSettlementPresentation(settlement) {
  return {
    id: settlement?.id,
    title: settlement?.trip?.trip_code || 'Trip settlement',
    payoutLabel: `${formatCurrencyNGN(settlement?.driver_payout || 0)} driver payout`,
  };
}

export function buildLogisticsFleetAssetPayload(fleetForm = {}) {
  return {
    ...fleetForm,
    capacity_value: Number(fleetForm.capacity_value || 0),
    purchase_value: Number(fleetForm.purchase_value || 0),
    target_km_per_litre: Number(fleetForm.target_km_per_litre || 0),
  };
}

export function buildLogisticsFuelLogPayload(fuelForm = {}, fleetAssets = [], tripSheets = []) {
  return {
    ...fuelForm,
    fleet_asset_id: fleetAssets[0]?.id ?? null,
    trip_sheet_id: tripSheets[0]?.id ?? null,
    litres: Number(fuelForm.litres || 0),
    unit_cost: Number(fuelForm.unit_cost || 0),
    odometer_km: Number(fuelForm.odometer_km || 0),
  };
}

export function buildLogisticsMaintenancePayload(maintenanceForm = {}, fleetAssets = [], tripSheets = []) {
  return {
    ...maintenanceForm,
    fleet_asset_id: fleetAssets[0]?.id ?? null,
    trip_sheet_id: tripSheets[0]?.id ?? null,
    cost: Number(maintenanceForm.cost || 0),
  };
}
