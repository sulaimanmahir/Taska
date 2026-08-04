import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildLogisticsFleetAssetPayload,
  buildLogisticsFuelLogPresentation,
  buildLogisticsFuelLogPayload,
  buildLogisticsMaintenancePayload,
  buildLogisticsMaintenanceLogPresentation,
  buildLogisticsOverviewMetrics,
  buildLogisticsSettlementPresentation,
  buildLogisticsSettlementQueueItem,
  buildLogisticsTripPayload,
  buildLogisticsTripPresentation,
  calculateProjectedTripProfit,
} from '../src/lib/logistics.js';
import { formatCurrencyNGN } from '../src/lib/financeFormatters.js';

test('logistics overview metrics keep labels, helpers, and formatted values aligned', () => {
  const metrics = buildLogisticsOverviewMetrics({
    trips_today: 8,
    active_trips: 3,
    revenue_today: 450000,
    profit_today: 120000,
    fuel_cost_today: 95000,
    litres_today: 320,
    fleet_active: 6,
    open_maintenance: 2,
    delayed_stops: 1,
  });

  assert.equal(metrics.length, 8);
  assert.deepEqual(metrics[0], {
    label: 'Trips Today',
    value: 8,
    helper: 'Planned and active work.',
    tone: 'sky',
  });
  assert.equal(metrics[2].value, formatCurrencyNGN(450000));
  assert.equal(metrics[4].helper, '320 litres logged.');
});

test('logistics projected profit helper subtracts visible trip costs consistently', () => {
  assert.equal(calculateProjectedTripProfit({
    expected_revenue: '650000',
    actual_revenue: '0',
    expected_fuel_cost: '145000',
    actual_fuel_cost: '0',
    loading_cost: '45000',
    driver_allowance: '25000',
    maintenance_cost: '10000',
    other_cost: '5000',
  }), 420000);
});

test('logistics trip payload helper normalizes numeric fields and default stop payload', () => {
  const payload = buildLogisticsTripPayload({
    route_name: 'Kaduna to Abuja Cement Line',
    expected_revenue: '650000',
    actual_revenue: '0',
    distance_km: '235',
    expected_fuel_cost: '145000',
    actual_fuel_cost: '0',
    loading_cost: '45000',
    driver_allowance: '25000',
    maintenance_cost: '0',
    other_cost: '10000',
    stop_name: 'Kubwa Site Gate',
    stop_location: 'Kubwa, Abuja',
    stop_expected_revenue: '650000',
  });

  assert.equal(payload.distance_km, 235);
  assert.equal(payload.loading_cost, 45000);
  assert.deepEqual(payload.stops, [
    {
      stop_name: 'Kubwa Site Gate',
      location: 'Kubwa, Abuja',
      expected_revenue: 650000,
    },
  ]);
});

test('logistics queue and trip presenters keep status, route, and stop data readable', () => {
  const trip = {
    id: 4,
    trip_code: 'TRIP-004',
    route_name: 'Kaduna to Abuja Cement Line',
    status: 'in_transit',
    expected_revenue: 650000,
    origin: 'Kaduna',
    destination: 'Abuja',
    customer_name: '',
    profit_estimate: 180000,
    asset: { name: '10 Tyre Mack Truck' },
    driver: {},
    stops: [{ id: 1, stop_order: 1, stop_name: 'Kubwa Gate', location: 'Kubwa' }],
  };

  const queueItem = buildLogisticsSettlementQueueItem(trip);
  const presentation = buildLogisticsTripPresentation(trip);

  assert.equal(queueItem.statusLabel, 'in transit');
  assert.deepEqual(queueItem.completePayload, { status: 'completed', actual_revenue: 650000 });
  assert.equal(presentation.routeName, 'Kaduna to Abuja Cement Line');
  assert.equal(presentation.routeSummary, 'Kaduna to Abuja');
  assert.equal(presentation.customerName, 'No customer linked yet');
  assert.equal(presentation.revenueLabel, formatCurrencyNGN(650000));
  assert.equal(presentation.vehicleName, '10 Tyre Mack Truck');
  assert.equal(presentation.driverName, 'Unassigned');
  assert.deepEqual(presentation.stops, [
    { id: 1, orderLabel: 'Stop 1', stopName: 'Kubwa Gate', location: 'Kubwa' },
  ]);
});

test('logistics side-panel presenters keep fuel, maintenance, and settlement rows aligned', () => {
  const fuel = buildLogisticsFuelLogPresentation({
    id: 8,
    amount: 343000,
    litres: 350,
    asset: { name: 'Mack Truck' },
  });
  const maintenance = buildLogisticsMaintenanceLogPresentation({
    id: 9,
    summary: 'Routine service',
    cost: 18000,
    asset: {},
  });
  const settlement = buildLogisticsSettlementPresentation({
    id: 10,
    trip: {},
    driver_payout: 95000,
  });

  assert.equal(fuel.amountLabel, formatCurrencyNGN(343000));
  assert.equal(fuel.meta, '350L - Mack Truck');
  assert.equal(maintenance.meta, `${formatCurrencyNGN(18000)} - Fleet asset pending`);
  assert.equal(settlement.title, 'Trip settlement');
  assert.equal(settlement.payoutLabel, `${formatCurrencyNGN(95000)} driver payout`);
});

test('logistics payload helpers normalize fleet, fuel, and maintenance forms consistently', () => {
  const fleetPayload = buildLogisticsFleetAssetPayload({
    asset_type: 'truck',
    capacity_value: '30',
    purchase_value: '28000000',
    target_km_per_litre: '2.8',
  });
  const fuelPayload = buildLogisticsFuelLogPayload(
    {
      log_date: '2026-05-25',
      litres: '350',
      unit_cost: '980',
      odometer_km: '124500',
      source: 'cash',
    },
    [{ id: 7 }],
    [{ id: 9 }],
  );
  const maintenancePayload = buildLogisticsMaintenancePayload(
    {
      logged_on: '2026-05-25',
      category: 'routine_service',
      status: 'open',
      cost: '18000',
      summary: 'Routine service',
    },
    [{ id: 7 }],
    [{ id: 9 }],
  );

  assert.deepEqual(fleetPayload, {
    asset_type: 'truck',
    capacity_value: 30,
    purchase_value: 28000000,
    target_km_per_litre: 2.8,
  });
  assert.deepEqual(fuelPayload, {
    log_date: '2026-05-25',
    litres: 350,
    unit_cost: 980,
    odometer_km: 124500,
    source: 'cash',
    fleet_asset_id: 7,
    trip_sheet_id: 9,
  });
  assert.deepEqual(maintenancePayload, {
    logged_on: '2026-05-25',
    category: 'routine_service',
    status: 'open',
    cost: 18000,
    summary: 'Routine service',
    fleet_asset_id: 7,
    trip_sheet_id: 9,
  });
});
