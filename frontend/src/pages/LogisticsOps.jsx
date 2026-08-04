import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Card, { CardHeader } from '../components/Card';
import Button from '../components/Button';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import { getErrorMessage } from '../lib/apiFeedback';
import { useOfflineStore } from '../stores/offlineStore';
import { formatCurrencyNGN } from '../lib/financeFormatters';
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
} from '../lib/logistics';

function QueryErrorPanel({ message, onRetry }) {
  return (
    <Card className="border-rose-200 bg-rose-50/60">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">Workspace issue</p>
          <p className="mt-2 text-sm text-rose-700">{message}</p>
        </div>
        <Button variant="secondary" onClick={onRetry}>
          Retry loading
        </Button>
      </div>
    </Card>
  );
}

const initialFleetForm = {
  asset_type: 'truck',
  name: '10 Tyre Mack Truck',
  plate_number: '',
  ownership_model: 'company_owned',
  capacity_unit: 'ton',
  capacity_value: '30',
  purchase_value: '28000000',
  target_km_per_litre: '2.8',
  fuel_responsibility: 'company',
  maintenance_responsibility: 'company',
};

const initialTripForm = {
  job_type: 'haulage',
  customer_name: 'Arewa Build Projects',
  route_name: 'Kaduna to Abuja Cement Line',
  origin: 'Kakuri Yard, Kaduna',
  destination: 'Kubwa Site, Abuja',
  trip_date: new Date().toISOString().slice(0, 10),
  status: 'planned',
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
};

const initialFuelForm = {
  log_date: new Date().toISOString().slice(0, 10),
  litres: '350',
  unit_cost: '980',
  odometer_km: '124500',
  source: 'cash',
  notes: '',
};

const initialMaintenanceForm = {
  logged_on: new Date().toISOString().slice(0, 10),
  category: 'routine_service',
  status: 'open',
  cost: '0',
  summary: '',
  notes: '',
};

export default function LogisticsOps() {
  const queryClient = useQueryClient();
  const queueAction = useOfflineStore((state) => state.queueAction);
  const isOnline = useOfflineStore((state) => state.isOnline);

  const [fleetForm, setFleetForm] = useState(initialFleetForm);
  const [tripForm, setTripForm] = useState(initialTripForm);
  const [fuelForm, setFuelForm] = useState(initialFuelForm);
  const [maintenanceForm, setMaintenanceForm] = useState(initialMaintenanceForm);

  const logisticsQuery = useQuery({
    queryKey: ['logistics-overview'],
    queryFn: () => api.get('/logistics/overview').then((response) => response.data),
  });

  const data = logisticsQuery.data;

  const summary = data?.summary ?? {};
  const fleetAssets = data?.fleet_assets ?? [];
  const tripSheets = data?.trip_sheets ?? [];
  const fuelLogs = data?.fuel_logs ?? [];
  const maintenanceLogs = data?.maintenance_logs ?? [];
  const settlements = data?.settlements ?? [];

  const enqueueOrPost = async ({ endpoint, payload, resourceType = 'logistics', method = 'POST' }) => {
    if (!isOnline) {
      queueAction({
        endpoint,
        method,
        resourceType,
        payload,
      });

      return { queued: true };
    }

    const response = await api.request({
      url: endpoint,
      method,
      data: payload,
    });

    return response.data;
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['logistics-overview'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const createFleetAsset = useMutation({
    mutationFn: (payload) => enqueueOrPost({ endpoint: '/logistics/fleet-assets', payload }),
    onSuccess: () => {
      refresh();
      setFleetForm(initialFleetForm);
    },
  });

  const createTripSheet = useMutation({
    mutationFn: (payload) => enqueueOrPost({ endpoint: '/logistics/trip-sheets', payload }),
    onSuccess: () => {
      refresh();
      setTripForm(initialTripForm);
    },
  });

  const createFuelLog = useMutation({
    mutationFn: (payload) => enqueueOrPost({ endpoint: '/logistics/fuel-logs', payload }),
    onSuccess: () => {
      refresh();
      setFuelForm(initialFuelForm);
    },
  });

  const createMaintenanceLog = useMutation({
    mutationFn: (payload) => enqueueOrPost({ endpoint: '/logistics/maintenance-logs', payload }),
    onSuccess: () => {
      refresh();
      setMaintenanceForm(initialMaintenanceForm);
    },
  });

  const updateTrip = useMutation({
    mutationFn: ({ tripId, payload }) => enqueueOrPost({ endpoint: `/logistics/trip-sheets/${tripId}`, payload, method: 'PATCH' }),
    onSuccess: refresh,
  });

  const settleTrip = useMutation({
    mutationFn: ({ tripId, payload }) => enqueueOrPost({ endpoint: `/logistics/trip-sheets/${tripId}/settle`, payload }),
    onSuccess: refresh,
  });

  const projectedTripProfit = calculateProjectedTripProfit(tripForm);
  const overviewMetrics = buildLogisticsOverviewMetrics(summary);
  const settlementQueueItems = tripSheets.slice(0, 4).map((trip) => ({ raw: trip, ...buildLogisticsSettlementQueueItem(trip) }));
  const tripPresentations = tripSheets.map((trip) => buildLogisticsTripPresentation(trip));
  const fuelLogPresentations = fuelLogs.slice(0, 5).map((log) => buildLogisticsFuelLogPresentation(log));
  const maintenanceLogPresentations = maintenanceLogs.slice(0, 5).map((log) => buildLogisticsMaintenanceLogPresentation(log));
  const settlementPresentations = settlements.slice(0, 5).map((settlement) => buildLogisticsSettlementPresentation(settlement));
  const loadError = logisticsQuery.isError
    ? getErrorMessage(logisticsQuery.error, 'We could not load logistics operations right now. Please try again.')
    : '';

  return (
    <div className="space-y-5">
      {loadError ? (
        <QueryErrorPanel
          message={loadError}
          onRetry={() => {
            logisticsQuery.refetch();
          }}
        />
      ) : null}

      <PageHero
        eyebrow="Transport Control Tower"
        title="Trip sheets, fuel control, and fleet profitability"
        description="This is the logistics operating surface for trucks, line-haul, site supply, and transport settlements. It keeps trip margins, fuel spend, maintenance pressure, and receivables visible every day."
        aside={`Receivables outstanding ${formatCurrencyNGN(summary.receivables_outstanding)} | Driver payout pressure ${formatCurrencyNGN(summary.payout_pending)}`}
      />

      <ResponsiveCardGrid variant="metrics" className="2xl:grid-cols-4">
        {overviewMetrics.map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            tone={metric.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader title="Fleet Asset Intake" />
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              createFleetAsset.mutate(buildLogisticsFleetAssetPayload(fleetForm));
            }}
          >
            <label className="space-y-2 text-sm text-slate-600">
              <span>Asset Type</span>
              <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={fleetForm.asset_type} onChange={(event) => setFleetForm({ ...fleetForm, asset_type: event.target.value })}>
                <option value="truck">Truck</option>
                <option value="van">Van</option>
                <option value="pickup">Pickup</option>
                <option value="tanker">Tanker</option>
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Asset Name</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={fleetForm.name} onChange={(event) => setFleetForm({ ...fleetForm, name: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Plate Number</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={fleetForm.plate_number} onChange={(event) => setFleetForm({ ...fleetForm, plate_number: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Ownership</span>
              <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={fleetForm.ownership_model} onChange={(event) => setFleetForm({ ...fleetForm, ownership_model: event.target.value })}>
                <option value="company_owned">Company Owned</option>
                <option value="investor_owned">Investor Owned</option>
                <option value="partner_owned">Partner Owned</option>
                <option value="driver_owned">Driver Owned</option>
                <option value="leased">Leased</option>
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Capacity Unit</span>
              <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={fleetForm.capacity_unit} onChange={(event) => setFleetForm({ ...fleetForm, capacity_unit: event.target.value })}>
                <option value="ton">Ton</option>
                <option value="bag">Bag</option>
                <option value="pallet">Pallet</option>
                <option value="crate">Crate</option>
                <option value="trip">Trip</option>
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Capacity Value</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={fleetForm.capacity_value} onChange={(event) => setFleetForm({ ...fleetForm, capacity_value: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Purchase Value</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={fleetForm.purchase_value} onChange={(event) => setFleetForm({ ...fleetForm, purchase_value: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Target KM/Litre</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={fleetForm.target_km_per_litre} onChange={(event) => setFleetForm({ ...fleetForm, target_km_per_litre: event.target.value })} />
            </label>
            <Button
              type="submit"
              size="lg"
              disabled={createFleetAsset.isPending}
              className="md:col-span-2"
            >
              {createFleetAsset.isPending ? 'Saving fleet asset...' : (isOnline ? 'Save fleet asset' : 'Queue fleet asset')}
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Trip Sheet Builder" subtitle="Capture route economics before dispatch" />
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              createTripSheet.mutate(buildLogisticsTripPayload(tripForm));
            }}
          >
            <label className="space-y-2 text-sm text-slate-600">
              <span>Trip Name</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={tripForm.route_name} onChange={(event) => setTripForm({ ...tripForm, route_name: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Customer</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={tripForm.customer_name} onChange={(event) => setTripForm({ ...tripForm, customer_name: event.target.value })} />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-600">
                <span>Origin</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={tripForm.origin} onChange={(event) => setTripForm({ ...tripForm, origin: event.target.value })} />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>Destination</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={tripForm.destination} onChange={(event) => setTripForm({ ...tripForm, destination: event.target.value })} />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2 text-sm text-slate-600">
                <span>Trip Date</span>
                <input type="date" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={tripForm.trip_date} onChange={(event) => setTripForm({ ...tripForm, trip_date: event.target.value })} />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>Distance KM</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={tripForm.distance_km} onChange={(event) => setTripForm({ ...tripForm, distance_km: event.target.value })} />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>Status</span>
                <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={tripForm.status} onChange={(event) => setTripForm({ ...tripForm, status: event.target.value })}>
                  <option value="planned">Planned</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="in_transit">In Transit</option>
                </select>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2 text-sm text-slate-600">
                <span>Expected Revenue</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={tripForm.expected_revenue} onChange={(event) => setTripForm({ ...tripForm, expected_revenue: event.target.value })} />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>Expected Fuel</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={tripForm.expected_fuel_cost} onChange={(event) => setTripForm({ ...tripForm, expected_fuel_cost: event.target.value })} />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>Loading Cost</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={tripForm.loading_cost} onChange={(event) => setTripForm({ ...tripForm, loading_cost: event.target.value })} />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2 text-sm text-slate-600">
                <span>Driver Allowance</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={tripForm.driver_allowance} onChange={(event) => setTripForm({ ...tripForm, driver_allowance: event.target.value })} />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>Other Cost</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={tripForm.other_cost} onChange={(event) => setTripForm({ ...tripForm, other_cost: event.target.value })} />
              </label>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Projected Profit</span>
                <strong className="mt-2 block text-lg text-slate-900">{formatCurrencyNGN(projectedTripProfit)}</strong>
              </div>
            </div>
            <Button type="submit" fullWidth size="lg" disabled={createTripSheet.isPending}>
              {createTripSheet.isPending ? 'Saving trip sheet...' : (isOnline ? 'Save trip sheet' : 'Queue trip sheet')}
            </Button>
          </form>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Fuel Log" />
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              createFuelLog.mutate(buildLogisticsFuelLogPayload(fuelForm, fleetAssets, tripSheets));
            }}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <label className="space-y-2 text-sm text-slate-600">
                <span>Log Date</span>
                <input type="date" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={fuelForm.log_date} onChange={(event) => setFuelForm({ ...fuelForm, log_date: event.target.value })} />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>Litres</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={fuelForm.litres} onChange={(event) => setFuelForm({ ...fuelForm, litres: event.target.value })} />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>Unit Cost</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={fuelForm.unit_cost} onChange={(event) => setFuelForm({ ...fuelForm, unit_cost: event.target.value })} />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>Odometer KM</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={fuelForm.odometer_km} onChange={(event) => setFuelForm({ ...fuelForm, odometer_km: event.target.value })} />
              </label>
            </div>
            <Button
              type="submit"
              fullWidth
              variant="secondary"
              disabled={createFuelLog.isPending || !fleetAssets.length}
              className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            >
              {createFuelLog.isPending ? 'Saving fuel log...' : (isOnline ? 'Save fuel log' : 'Queue fuel log')}
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Maintenance Log" />
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              createMaintenanceLog.mutate(buildLogisticsMaintenancePayload(maintenanceForm, fleetAssets, tripSheets));
            }}
          >
            <label className="space-y-2 text-sm text-slate-600">
              <span>Summary</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={maintenanceForm.summary} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, summary: event.target.value })} />
            </label>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <label className="space-y-2 text-sm text-slate-600">
                <span>Category</span>
                <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={maintenanceForm.category} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, category: event.target.value })}>
                  <option value="routine_service">Routine Service</option>
                  <option value="breakdown">Breakdown</option>
                  <option value="tyre">Tyre</option>
                  <option value="engine">Engine</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>Cost</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={maintenanceForm.cost} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, cost: event.target.value })} />
              </label>
            </div>
            <Button
              type="submit"
              fullWidth
              variant="secondary"
              disabled={createMaintenanceLog.isPending || !fleetAssets.length}
              className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            >
              {createMaintenanceLog.isPending ? 'Saving maintenance log...' : (isOnline ? 'Save maintenance log' : 'Queue maintenance')}
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Settlement Queue" subtitle="Close out completed trips cleanly" />
          <div className="space-y-3">
            {settlementQueueItems.map((trip) => (
              <div key={trip.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{trip.tripCode}</p>
                    <p className="text-sm text-slate-500">{trip.routeName}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600">
                    {trip.statusLabel}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => updateTrip.mutate({ tripId: trip.raw.id, payload: trip.completePayload })}
                  >
                    Complete Trip
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
                    onClick={() => settleTrip.mutate({ tripId: trip.raw.id, payload: trip.settlementPayload })}
                  >
                    Create Settlement
                  </Button>
                </div>
              </div>
            ))}
            {!tripSheets.length ? <p className="text-sm text-slate-500">No trip sheets yet.</p> : null}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader title="Active Fleet and Trips" />
          <div className="space-y-4">
            {tripPresentations.length ? tripPresentations.map((trip) => (
              <div key={trip.id} className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">{trip.tripCode}</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">{trip.route_name}</h3>
                    <p className="text-sm text-slate-500">{trip.routeSummary}</p>
                    <p className="text-sm text-slate-500">{trip.customerName}</p>
                  </div>
                  <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 xl:min-w-[340px]">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Revenue</p>
                      <p className="mt-1 font-semibold text-slate-900">{trip.revenueLabel}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Profit</p>
                      <p className="mt-1 font-semibold text-slate-900">{trip.profitLabel}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Vehicle</p>
                      <p className="mt-1 font-semibold text-slate-900">{trip.vehicleName}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Driver</p>
                      <p className="mt-1 font-semibold text-slate-900">{trip.driverName}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {trip.stops?.map((stop) => (
                    <div key={stop.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{stop.orderLabel}</p>
                      <p className="mt-1 font-semibold text-slate-900">{stop.stopName}</p>
                      <p className="text-sm text-slate-500">{stop.location}</p>
                    </div>
                  ))}
                </div>
              </div>
            )) : <p className="text-sm text-slate-500">No trips logged yet.</p>}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Recent Fuel Logs" />
            <div className="space-y-3">
              {fuelLogPresentations.map((log) => (
                <div key={log.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{log.amountLabel}</p>
                  <p className="text-sm text-slate-500">{log.meta}</p>
                </div>
              ))}
              {!fuelLogs.length ? <p className="text-sm text-slate-500">No fuel logs yet.</p> : null}
            </div>
          </Card>

          <Card>
            <CardHeader title="Maintenance Pressure" />
            <div className="space-y-3">
              {maintenanceLogPresentations.map((log) => (
                <div key={log.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{log.summary}</p>
                  <p className="text-sm text-slate-500">{log.meta}</p>
                </div>
              ))}
              {!maintenanceLogs.length ? <p className="text-sm text-slate-500">No maintenance logs yet.</p> : null}
            </div>
          </Card>

          <Card>
            <CardHeader title="Driver Settlements" />
            <div className="space-y-3">
              {settlementPresentations.map((settlement) => (
                <div key={settlement.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{settlement.title}</p>
                  <p className="text-sm text-slate-500">{settlement.payoutLabel}</p>
                </div>
              ))}
              {!settlements.length ? <p className="text-sm text-slate-500">No settlements yet.</p> : null}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
