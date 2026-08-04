import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Card, { CardHeader } from '../components/Card';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import { useBusinessType } from '../config';
import {
  buildDeliveryComplaintPayload,
  buildDeliveryDeliverPayload,
  buildDeliveryDisputePayload,
  buildDeliveryFailPayload,
  buildDeliveryHeroAside,
  buildDeliveryManifestPayload,
  buildManifestCandidateCards,
  buildComplaintQueueCards,
  buildDeliveryOverviewMetrics,
  buildDeliveryOrderPresentation,
  buildDeliveryOtpPayload,
  buildInvestorPayoutCards,
  buildDeliveryPickupPayload,
  buildDeliveryRemittancePayload,
  buildDeliveryRequestPayload,
  buildRiderScorecardCards,
  buildRouteEfficiencyCards,
  buildDeliverySettlementPayload,
  buildDeliveryVehiclePayload,
  buildManifestSummaryCard,
  buildRemittanceHistoryCard,
  buildWalletActivityCards,
  calculateDeliveryChargePreview,
  createDeliveryActionState,
  createDeliveryManifestForm,
  createDeliveryRequestForm,
  createDeliveryVehicleForm,
  formatDeliveryStatus,
} from '../lib/deliveries';
import { useOfflineStore } from '../stores/offlineStore';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import BuildingMaterialsOps from './BuildingMaterialsOps';
import LogisticsOps from './LogisticsOps';

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

function ActionButton({ children, tone = 'dark', disabled = false, onClick }) {
  const tones = {
    dark: 'bg-slate-900 text-white',
    violet: 'bg-violet-600 text-white',
    amber: 'bg-amber-500 text-white',
    emerald: 'bg-emerald-600 text-white',
    rose: 'bg-rose-600 text-white',
    slate: 'bg-slate-100 text-slate-700',
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 ${tones[tone] ?? tones.dark}`}
    >
      {children}
    </button>
  );
}

function QueryErrorPanel({ message, onRetry }) {
  if (!message) {
    return null;
  }

  return (
    <Card className="border-rose-200 bg-rose-50">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-rose-800">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
        >
          Retry
        </button>
      </div>
    </Card>
  );
}

function DeliveryCompanyOps() {
  const { color = '#7C3AED' } = useBusinessType();
  const accentColor = color || '#7C3AED';
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const queueAction = useOfflineStore((state) => state.queueAction);
  const isOnline = useOfflineStore((state) => state.isOnline);
  const [deliveryForm, setDeliveryForm] = useState(createDeliveryRequestForm);
  const [vehicleForm, setVehicleForm] = useState(createDeliveryVehicleForm);
  const [manifestForm, setManifestForm] = useState(createDeliveryManifestForm);
  const [actionForms, setActionForms] = useState({});
  const [selectedManifestOrders, setSelectedManifestOrders] = useState([]);
  const dispatchDeskRef = useRef(null);

  const overviewQuery = useQuery({
    queryKey: ['deliveries-overview'],
    queryFn: () => api.get('/deliveries/overview').then((response) => response.data),
  });

  const deliveriesQuery = useQuery({
    queryKey: ['deliveries-list'],
    queryFn: () => api.get('/deliveries').then((response) => response.data.data ?? []),
  });

  const vehiclesQuery = useQuery({
    queryKey: ['delivery-vehicles'],
    queryFn: () => api.get('/delivery-vehicles').then((response) => response.data ?? []),
  });

  const operationsQuery = useQuery({
    queryKey: ['deliveries-operations'],
    queryFn: () => api.get('/deliveries/operations').then((response) => response.data),
  });

  const overview = overviewQuery.data;
  const deliveries = deliveriesQuery.data;
  const vehicles = vehiclesQuery.data;
  const operations = operationsQuery.data;
  const deliveryQueries = [overviewQuery, deliveriesQuery, vehiclesQuery, operationsQuery];
  const deliveryError = deliveryQueries.find((query) => query.isError)?.error;

  const refreshCourierQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['deliveries-overview'] });
    queryClient.invalidateQueries({ queryKey: ['deliveries-list'] });
    queryClient.invalidateQueries({ queryKey: ['delivery-vehicles'] });
    queryClient.invalidateQueries({ queryKey: ['deliveries-operations'] });
  };

  const enqueueOrPost = async ({ endpoint, payload, method = 'POST', resourceType = 'delivery' }) => {
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

  const handleRetry = () => {
    deliveryQueries.forEach((query) => {
      void query.refetch();
    });
  };

  const createDelivery = useMutation({
    mutationFn: (payload) => enqueueOrPost({
      endpoint: '/deliveries',
      payload,
      resourceType: 'delivery',
    }),
    onSuccess: () => {
      refreshCourierQueries();
      setDeliveryForm(createDeliveryRequestForm());
    },
  });

  const createVehicle = useMutation({
    mutationFn: (payload) => enqueueOrPost({
      endpoint: '/delivery-vehicles',
      payload,
      resourceType: 'fleet',
    }),
    onSuccess: () => {
      refreshCourierQueries();
      setVehicleForm(createDeliveryVehicleForm());
    },
  });

  const deliveryAction = useMutation({
    mutationFn: ({ endpoint, payload }) => enqueueOrPost({
      endpoint,
      payload,
      resourceType: 'delivery',
    }),
    onSuccess: () => {
      refreshCourierQueries();
    },
  });

  const createManifest = useMutation({
    mutationFn: (payload) => enqueueOrPost({
      endpoint: '/deliveries/manifests',
      payload,
      resourceType: 'delivery',
    }),
    onSuccess: () => {
      refreshCourierQueries();
      setManifestForm(createDeliveryManifestForm());
      setSelectedManifestOrders([]);
    },
  });

  const summary = overview?.summary ?? {};
  const riderScorecards = overview?.rider_scorecards ?? EMPTY_ARRAY;
  const investorPayouts = overview?.investor_payouts ?? EMPTY_ARRAY;
  const manifests = operations?.manifests ?? EMPTY_ARRAY;
  const disputes = operations?.disputes ?? EMPTY_ARRAY;
  const complaints = operations?.complaints ?? EMPTY_ARRAY;
  const remittanceHistory = operations?.remittance_history ?? EMPTY_ARRAY;
  const walletActivity = operations?.wallet_activity ?? EMPTY_ARRAY;
  const manifestCandidates = operations?.manifest_candidates ?? EMPTY_ARRAY;
  const routeEfficiency = overview?.route_efficiency ?? EMPTY_OBJECT;
  const walletBalances = overview?.wallet_balances ?? EMPTY_ARRAY;

  useEffect(() => {
    if (searchParams.get('section') === 'dispatch' && dispatchDeskRef.current) {
      dispatchDeskRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchParams]);

  const activeFleet = useMemo(
    () => (vehicles ?? []).filter((vehicle) => vehicle.is_active).length,
    [vehicles]
  );
  const overviewMetrics = buildDeliveryOverviewMetrics(summary, {
    activeFleet,
    routeEfficiency,
    walletBalances,
  }, formatCurrencyNGN);
  const riderCards = useMemo(
    () => buildRiderScorecardCards(riderScorecards, formatCurrencyNGN),
    [riderScorecards]
  );
  const investorCards = useMemo(
    () => buildInvestorPayoutCards(investorPayouts, formatCurrencyNGN),
    [investorPayouts]
  );
  const walletCards = useMemo(
    () => buildWalletActivityCards(walletActivity, formatCurrencyNGN),
    [walletActivity]
  );
  const complaintCards = useMemo(
    () => buildComplaintQueueCards(complaints),
    [complaints]
  );
  const routeEfficiencyCards = useMemo(
    () => buildRouteEfficiencyCards(routeEfficiency),
    [routeEfficiency]
  );
  const manifestCandidateCards = useMemo(
    () => buildManifestCandidateCards(manifestCandidates, selectedManifestOrders),
    [manifestCandidates, selectedManifestOrders]
  );

  const getActionState = (deliveryId) => actionForms[deliveryId] ?? createDeliveryActionState();

  const updateActionState = (deliveryId, patch) => {
    setActionForms((current) => ({
      ...current,
      [deliveryId]: {
        ...(current[deliveryId] ?? createDeliveryActionState()),
        ...patch,
      },
    }));
  };

  const handleDeliverySubmit = (event) => {
    event.preventDefault();

    createDelivery.mutate(buildDeliveryRequestPayload(deliveryForm, isOnline));
  };

  const handleVehicleSubmit = (event) => {
    event.preventDefault();

    createVehicle.mutate(buildDeliveryVehiclePayload(vehicleForm));
  };

  const submitAction = (delivery, endpoint, payload = {}) => {
    deliveryAction.mutate({
      endpoint,
      payload: {
        ...payload,
        offline: {
          created_offline: !isOnline,
        },
      },
    });
  };

  const toggleManifestOrder = (orderId) => {
    setSelectedManifestOrders((current) => (
      current.includes(orderId)
        ? current.filter((item) => item !== orderId)
        : [...current, orderId]
    ));
  };

  const handleManifestSubmit = (event) => {
    event.preventDefault();

    if (selectedManifestOrders.length === 0) {
      return;
    }

    createManifest.mutate(buildDeliveryManifestPayload(manifestForm, selectedManifestOrders));
  };

  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="Courier Command Centre"
        title="Dispatch, remittance, and payout control"
        description="Taska now surfaces live delivery operations: pending pickups, in-transit workload, COD exposure, rider scorecards, and investor payout pressure in one place."
        aside={buildDeliveryHeroAside(summary, activeFleet, formatCurrencyNGN)}
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

      <QueryErrorPanel
        message={deliveryError ? 'We could not load part of the delivery workspace right now. Please try again.' : ''}
        onRetry={handleRetry}
      />

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div ref={dispatchDeskRef}>
        <Card>
          <CardHeader title="Register Delivery Request" />
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleDeliverySubmit}>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Parcel Category</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={deliveryForm.parcel_category} onChange={(event) => setDeliveryForm({ ...deliveryForm, parcel_category: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Distance (km)</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={deliveryForm.distance_km} onChange={(event) => setDeliveryForm({ ...deliveryForm, distance_km: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Base Fee</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={deliveryForm.base_fee} onChange={(event) => setDeliveryForm({ ...deliveryForm, base_fee: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Distance Fee</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={deliveryForm.distance_fee} onChange={(event) => setDeliveryForm({ ...deliveryForm, distance_fee: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>COD Amount</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={deliveryForm.cod_amount} onChange={(event) => setDeliveryForm({ ...deliveryForm, cod_amount: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Urgent Fee</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={deliveryForm.urgent_fee} onChange={(event) => setDeliveryForm({ ...deliveryForm, urgent_fee: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
              <span>Pickup Address</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={deliveryForm.pickup_address} onChange={(event) => setDeliveryForm({ ...deliveryForm, pickup_address: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
              <span>Dropoff Address</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={deliveryForm.dropoff_address} onChange={(event) => setDeliveryForm({ ...deliveryForm, dropoff_address: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Sender Name</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={deliveryForm.sender_name} onChange={(event) => setDeliveryForm({ ...deliveryForm, sender_name: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Sender Phone</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={deliveryForm.sender_phone} onChange={(event) => setDeliveryForm({ ...deliveryForm, sender_phone: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Recipient Name</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={deliveryForm.recipient_name} onChange={(event) => setDeliveryForm({ ...deliveryForm, recipient_name: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Recipient Phone</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={deliveryForm.recipient_phone} onChange={(event) => setDeliveryForm({ ...deliveryForm, recipient_phone: event.target.value })} />
            </label>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 md:col-span-2">
              <span>Total charge preview</span>
              <strong className="text-slate-900">
                {formatCurrencyNGN(calculateDeliveryChargePreview(deliveryForm))}
              </strong>
            </div>
            <button
              type="submit"
              disabled={createDelivery.isPending}
              className="rounded-2xl px-5 py-4 text-sm font-semibold text-white shadow-lg md:col-span-2"
              style={{ background: createDelivery.isPending ? '#94a3b8' : accentColor }}
            >
              {createDelivery.isPending ? 'Saving delivery request...' : (isOnline ? 'Save delivery request' : 'Queue offline delivery request')}
            </button>
          </form>
        </Card>
        </div>

        <Card>
          <CardHeader title="Fleet Intake" />
          <form className="space-y-4" onSubmit={handleVehicleSubmit}>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Vehicle Type</span>
              <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={vehicleForm.vehicle_type} onChange={(event) => setVehicleForm({ ...vehicleForm, vehicle_type: event.target.value })}>
                <option value="motorcycle">Motorcycle</option>
                <option value="tricycle">Tricycle</option>
                <option value="van">Van</option>
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Ownership Model</span>
              <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={vehicleForm.ownership_model} onChange={(event) => setVehicleForm({ ...vehicleForm, ownership_model: event.target.value })}>
                <option value="company_owned">Company Owned</option>
                <option value="investor_owned">Investor Owned</option>
                <option value="partner_owned">Partner Owned</option>
                <option value="rider_owned">Rider Owned</option>
                <option value="investor_rider">Investor Rider</option>
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Owner Name</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={vehicleForm.owner_name} onChange={(event) => setVehicleForm({ ...vehicleForm, owner_name: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Purchase Value</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={vehicleForm.purchase_value} onChange={(event) => setVehicleForm({ ...vehicleForm, purchase_value: event.target.value })} />
            </label>
            <button
              type="submit"
              disabled={createVehicle.isPending}
              className="w-full rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white"
            >
              {createVehicle.isPending ? 'Saving fleet asset...' : (isOnline ? 'Save fleet asset' : 'Queue fleet asset')}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            {(vehicles ?? []).slice(0, 4).map((vehicle) => (
              <div key={vehicle.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{vehicle.owner_name}</p>
                      <p className="text-sm text-slate-500 capitalize">{vehicle.vehicle_type} - {formatDeliveryStatus(vehicle.ownership_model)}</p>
                    </div>
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                    {vehicle.orders_count} jobs
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Rider Scorecards" />
          <div className="space-y-3">
            {riderCards.length ? riderCards.map((rider) => (
              <div key={rider.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{rider.riderName}</p>
                    <p className="text-sm text-slate-500">{rider.jobsLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{rider.totalJobsLabel}</p>
                    <p className="text-xs text-amber-600">{rider.remittanceLabel}</p>
                  </div>
                </div>
              </div>
            )) : <p className="text-sm text-slate-500">No rider data yet.</p>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Investor Payout Pressure" />
          <div className="space-y-3">
            {investorCards.length ? investorCards.map((investor) => (
              <div key={investor.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{investor.ownerName}</p>
                    <p className="text-sm text-slate-500">{investor.revenueLabel}</p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-700">{investor.payoutLabel}</p>
                </div>
              </div>
            )) : <p className="text-sm text-slate-500">No investor payouts yet.</p>}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Wallet Activity" subtitle="Rider wallet and payout trail" />
          <div className="space-y-3">
            {walletCards.length ? walletCards.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{entry.riderName}</p>
                    <p className="text-sm text-slate-500">{entry.reasonLabel}</p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-700">{entry.amountLabel}</p>
                </div>
              </div>
            )) : <p className="text-sm text-slate-500">No rider wallet activity yet.</p>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Complaint Queue" subtitle="Customer-facing issue intake" />
          <div className="space-y-3">
            {complaintCards.length ? complaintCards.map((complaint) => (
              <div key={complaint.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{complaint.trackingCode}</p>
                    <p className="text-sm text-slate-500">{complaint.summary}</p>
                  </div>
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase text-rose-700">
                    {complaint.statusLabel}
                  </span>
                </div>
              </div>
            )) : <p className="text-sm text-slate-500">No complaints logged yet.</p>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Route Efficiency" subtitle="Manifest throughput pulse" />
          <div className="space-y-3">
            {routeEfficiencyCards.map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader title="Dispatch Manifest Builder" subtitle="Group active jobs into rider runs" />
          <form className="space-y-4" onSubmit={handleManifestSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-600">
                <span>Manifest Title</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  value={manifestForm.title}
                  onChange={(event) => setManifestForm({ ...manifestForm, title: event.target.value })}
                />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>Dispatch State</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  value={manifestForm.status}
                  onChange={(event) => setManifestForm({ ...manifestForm, status: event.target.value })}
                >
                  <option value="draft">Draft manifest</option>
                  <option value="dispatched">Dispatch now</option>
                </select>
              </label>
            </div>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Manifest Notes</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={manifestForm.notes}
                onChange={(event) => setManifestForm({ ...manifestForm, notes: event.target.value })}
                placeholder="Fragile loads, payment notes, route focus"
              />
            </label>

            <div className="space-y-3">
              {manifestCandidateCards.length ? manifestCandidateCards.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => toggleManifestOrder(candidate.id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    candidate.isSelected
                      ? 'border-violet-300 bg-violet-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{candidate.trackingCode}</p>
                      <p className="text-sm text-slate-500">{candidate.contactLabel}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600">
                      {candidate.statusLabel}
                    </span>
                  </div>
                </button>
              )) : <p className="text-sm text-slate-500">No manifest-ready jobs yet.</p>}
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span>Selected jobs</span>
              <strong className="text-slate-900">{selectedManifestOrders.length}</strong>
            </div>

            <button
              type="submit"
              disabled={createManifest.isPending || selectedManifestOrders.length === 0}
              className="w-full rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white disabled:bg-slate-300"
            >
              {createManifest.isPending ? 'Saving dispatch manifest...' : (isOnline ? 'Save dispatch manifest' : 'Queue dispatch manifest')}
            </button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Recent Manifests" />
            <div className="space-y-3">
              {manifests.length ? manifests.map((manifest) => {
                const item = buildManifestSummaryCard(manifest);

                return (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-500">{item.metaLabel}</p>
                    </div>
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold uppercase text-violet-700">
                      {item.statusLabel}
                    </span>
                  </div>
                </div>
              )}) : <p className="text-sm text-slate-500">No manifests yet.</p>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Remittance History" />
            <div className="space-y-3">
              {remittanceHistory.length ? remittanceHistory.map((entry) => {
                const item = buildRemittanceHistoryCard(entry);

                return (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-500">{item.notesLabel}</p>
                    </div>
                    <p className="text-xs font-semibold uppercase text-emerald-700">{item.actorLabel}</p>
                  </div>
                </div>
              )}) : <p className="text-sm text-slate-500">No remittance records yet.</p>}
            </div>
          </Card>
        </div>
      </section>

      <Card>
        <CardHeader title="Recent Delivery Orders" subtitle="Pickup, delivery, remittance, and payout operations" />
        <div className="space-y-4">
          {(deliveries ?? []).map((delivery) => {
            const actionState = getActionState(delivery.id);
            const deliveryView = buildDeliveryOrderPresentation(delivery, disputes, formatCurrencyNGN);

            return (
              <div key={delivery.id} className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: accentColor }}>
                      {deliveryView.trackingCode}
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900">{deliveryView.parcelCategory}</h3>
                    <p className="text-sm text-slate-500">{deliveryView.contactLabel}</p>
                    <p className="text-sm text-slate-500">{deliveryView.routeLabel}</p>
                  </div>

                  <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 xl:min-w-[330px]">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Charge</p>
                      <p className="mt-1 font-semibold text-slate-900">{deliveryView.chargeLabel}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">COD Due</p>
                      <p className="mt-1 font-semibold text-slate-900">{deliveryView.remittanceDueLabel}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p>
                      <p className="mt-1 font-semibold capitalize text-slate-900">{deliveryView.statusLabel}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Settlement</p>
                      <p className="mt-1 font-semibold capitalize text-slate-900">{deliveryView.settlementStatusLabel}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <label className="space-y-2 text-sm text-slate-600">
                    <span>Proof URL</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      value={actionState.proof_url}
                      onChange={(event) => updateActionState(delivery.id, { proof_url: event.target.value })}
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate-600">
                    <span>Action Note</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      value={actionState.notes}
                      onChange={(event) => updateActionState(delivery.id, { notes: event.target.value })}
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate-600">
                    <span>Remittance Amount</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      value={actionState.amount_remitted}
                      onChange={(event) => updateActionState(delivery.id, { amount_remitted: event.target.value })}
                      placeholder={String(deliveryView.remittanceDue || 0)}
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate-600">
                    <span>OTP Code</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      value={actionState.otp_code}
                      onChange={(event) => updateActionState(delivery.id, { otp_code: event.target.value })}
                      placeholder="Confirm with recipient OTP"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate-600">
                    <span>Failure Reason</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      value={actionState.failed_delivery_reason}
                      onChange={(event) => updateActionState(delivery.id, { failed_delivery_reason: event.target.value })}
                    />
                  </label>
                </div>

                {!deliveryView.hasSettlement ? (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-600">
                      <span>Fuel Deduction</span>
                      <input
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                        value={actionState.fuel_deduction}
                        onChange={(event) => updateActionState(delivery.id, { fuel_deduction: event.target.value })}
                      />
                    </label>
                    <label className="space-y-2 text-sm text-slate-600">
                      <span>Maintenance Deduction</span>
                      <input
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                        value={actionState.maintenance_deduction}
                        onChange={(event) => updateActionState(delivery.id, { maintenance_deduction: event.target.value })}
                      />
                    </label>
                  </div>
                ) : null}

                {deliveryView.hasSettlement ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {deliveryView.settlementSummary.map((item) => (
                      <div key={item.label} className={`rounded-2xl px-4 py-3 ${item.toneClassName}`}>
                        <p className={`text-xs uppercase tracking-[0.18em] ${item.accentClassName}`}>{item.label}</p>
                        <p className="mt-1 font-semibold">{item.value}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {deliveryView.disputeCards.map((dispute) => (
                  <div key={dispute.id} className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">{dispute.categoryLabel}</p>
                    <p className="mt-1 text-sm text-rose-900">{dispute.summary}</p>
                  </div>
                ))}

                {deliveryView.complaintCards.map((complaint) => (
                  <div key={complaint.id} className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">{complaint.categoryLabel}</p>
                    <p className="mt-1 text-sm text-orange-900">{complaint.summary}</p>
                  </div>
                ))}

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-slate-600">
                    <span>Dispute Category</span>
                    <select
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      value={actionState.dispute_category}
                      onChange={(event) => updateActionState(delivery.id, { dispute_category: event.target.value })}
                    >
                      <option value="damaged_parcel">Damaged Parcel</option>
                      <option value="missing_item">Missing Item</option>
                      <option value="cash_shortage">Cash Shortage</option>
                      <option value="recipient_rejection">Recipient Rejection</option>
                    </select>
                  </label>
                  <label className="space-y-2 text-sm text-slate-600">
                    <span>Dispute Summary</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      value={actionState.dispute_summary}
                      onChange={(event) => updateActionState(delivery.id, { dispute_summary: event.target.value })}
                      placeholder="Log damage, shortage, refusal, or escalation"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate-600">
                    <span>Complaint Summary</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                      value={actionState.complaint_summary}
                      onChange={(event) => updateActionState(delivery.id, { complaint_summary: event.target.value })}
                      placeholder="Late parcel, rude rider, COD issue, damaged item"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {deliveryView.canMarkPickup ? (
                    <ActionButton
                      tone="violet"
                      disabled={deliveryAction.isPending}
                      onClick={() => submitAction(delivery, `/deliveries/${delivery.id}/pickup`, buildDeliveryPickupPayload(actionState))}
                    >
                      {isOnline ? 'Mark pickup complete' : 'Queue pickup update'}
                    </ActionButton>
                  ) : null}

                  {deliveryView.canMarkDelivered ? (
                    <>
                      <ActionButton
                        tone="emerald"
                        disabled={deliveryAction.isPending}
                        onClick={() => submitAction(delivery, `/deliveries/${delivery.id}/deliver`, buildDeliveryDeliverPayload(actionState, delivery))}
                      >
                        {isOnline ? 'Mark delivered' : 'Queue delivery update'}
                      </ActionButton>
                      <ActionButton
                        tone="rose"
                        disabled={deliveryAction.isPending}
                        onClick={() => submitAction(delivery, `/deliveries/${delivery.id}/fail`, buildDeliveryFailPayload(actionState))}
                      >
                        Record failed attempt
                      </ActionButton>
                    </>
                  ) : null}

                  {deliveryView.canReconcileRemittance ? (
                    <ActionButton
                      tone="amber"
                      disabled={deliveryAction.isPending}
                      onClick={() => submitAction(delivery, `/deliveries/${delivery.id}/remittance`, buildDeliveryRemittancePayload(actionState, delivery))}
                    >
                      {isOnline ? 'Reconcile remittance' : 'Queue remittance'}
                    </ActionButton>
                  ) : null}

                  {deliveryView.canConfirmOtp ? (
                    <ActionButton
                      tone="violet"
                      disabled={deliveryAction.isPending || !actionState.otp_code}
                      onClick={() => submitAction(delivery, `/deliveries/${delivery.id}/confirm-otp`, buildDeliveryOtpPayload(actionState))}
                    >
                      Confirm OTP delivery
                    </ActionButton>
                  ) : null}

                  {deliveryView.canCreateSettlement ? (
                    <ActionButton
                      tone="dark"
                      disabled={deliveryAction.isPending}
                      onClick={() => submitAction(delivery, `/deliveries/${delivery.id}/settle`, buildDeliverySettlementPayload(actionState))}
                    >
                      {isOnline ? 'Create settlement' : 'Queue settlement'}
                    </ActionButton>
                  ) : null}

                  {deliveryView.canMarkSettlementPaid ? (
                    <ActionButton
                      tone="slate"
                      disabled={deliveryAction.isPending}
                      onClick={() => submitAction(delivery, `/deliveries/${delivery.id}/settlement-paid`, {})}
                    >
                      Mark payout paid
                    </ActionButton>
                  ) : null}

                  <ActionButton
                    tone="rose"
                    disabled={deliveryAction.isPending || !actionState.dispute_summary}
                    onClick={() => submitAction(delivery, `/deliveries/${delivery.id}/disputes`, buildDeliveryDisputePayload(actionState))}
                  >
                    Log dispute
                  </ActionButton>
                  <ActionButton
                    tone="amber"
                    disabled={deliveryAction.isPending || !actionState.complaint_summary}
                    onClick={() => submitAction(delivery, `/deliveries/${delivery.id}/complaints`, buildDeliveryComplaintPayload(actionState))}
                  >
                    Log complaint
                  </ActionButton>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export default function Deliveries() {
  const { type } = useBusinessType();

  if (type === 'construction') {
    return <BuildingMaterialsOps />;
  }

  if (type === 'logistics') {
    return <LogisticsOps />;
  }

  return <DeliveryCompanyOps />;
}
