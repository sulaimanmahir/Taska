import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Button from '../components/Button';
import Card, { CardHeader } from '../components/Card';
import EmptyState from '../components/EmptyState';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import {
  buildMaintenanceRequestCard,
  buildMaintenanceRequestPayload,
  buildPropertyLeaseCard,
  buildPropertyLeasePayload,
  buildPropertyOverviewMetrics,
  buildPropertyUnitCard,
  buildPropertyUnitPayload,
  createMaintenanceRequestForm,
  createPropertyLeaseForm,
  createPropertyUnitForm,
  priorityOptions,
  unitTypeOptions,
} from '../lib/propertyManagement';

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

const inputClass = 'w-full rounded-2xl border border-slate-200 px-4 py-3';

const STATUS_BADGE_CLASS = {
  slate: 'bg-slate-100 text-slate-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
};

export default function PropertyManagementOps() {
  const queryClient = useQueryClient();
  const [unitForm, setUnitForm] = useState(createPropertyUnitForm);
  const [leaseForm, setLeaseForm] = useState(createPropertyLeaseForm);
  const [maintenanceForm, setMaintenanceForm] = useState(createMaintenanceRequestForm);
  const [paymentAmounts, setPaymentAmounts] = useState({});

  const overviewQuery = useQuery({
    queryKey: ['property-management-overview'],
    queryFn: () => api.get('/property-management/overview').then((response) => response.data),
  });

  const unitsQuery = useQuery({
    queryKey: ['property-management-units'],
    queryFn: () => api.get('/property-management/units').then((response) => response.data ?? []),
  });

  const leasesQuery = useQuery({
    queryKey: ['property-management-leases'],
    queryFn: () => api.get('/property-management/leases').then((response) => response.data ?? []),
  });

  const maintenanceQuery = useQuery({
    queryKey: ['property-management-maintenance'],
    queryFn: () => api.get('/property-management/maintenance-requests').then((response) => response.data ?? []),
  });

  const customersQuery = useQuery({
    queryKey: ['property-management-customers'],
    queryFn: () => api.get('/customers?limit=100').then((response) => response.data.data ?? response.data ?? []),
  });

  const units = unitsQuery.data ?? [];
  const leases = leasesQuery.data ?? [];
  const maintenanceRequests = maintenanceQuery.data ?? [];
  const customers = customersQuery.data ?? [];
  const summary = overviewQuery.data?.summary ?? {};

  const allQueries = [overviewQuery, unitsQuery, leasesQuery, maintenanceQuery, customersQuery];
  const hasError = allQueries.some((query) => query.isError);

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['property-management-overview'] });
    queryClient.invalidateQueries({ queryKey: ['property-management-units'] });
    queryClient.invalidateQueries({ queryKey: ['property-management-leases'] });
    queryClient.invalidateQueries({ queryKey: ['property-management-maintenance'] });
  };

  const createUnit = useMutation({
    mutationFn: (payload) => api.post('/property-management/units', payload).then((response) => response.data),
    onSuccess: () => {
      refreshAll();
      setUnitForm(createPropertyUnitForm());
    },
  });

  const createLease = useMutation({
    mutationFn: (payload) => api.post('/property-management/leases', payload).then((response) => response.data),
    onSuccess: () => {
      refreshAll();
      setLeaseForm(createPropertyLeaseForm());
    },
  });

  const recordPayment = useMutation({
    mutationFn: ({ leaseId, amount }) => api.post(`/property-management/leases/${leaseId}/payments`, { amount }).then((response) => response.data),
    onSuccess: (_data, variables) => {
      refreshAll();
      setPaymentAmounts((current) => ({ ...current, [variables.leaseId]: '' }));
    },
  });

  const createMaintenance = useMutation({
    mutationFn: (payload) => api.post('/property-management/maintenance-requests', payload).then((response) => response.data),
    onSuccess: () => {
      refreshAll();
      setMaintenanceForm(createMaintenanceRequestForm());
    },
  });

  const overviewMetrics = buildPropertyOverviewMetrics(summary, formatCurrencyNGN);
  const unitCards = units.map(buildPropertyUnitCard);
  const leaseCards = leases.map((lease) => buildPropertyLeaseCard(lease, formatCurrencyNGN));
  const maintenanceCards = maintenanceRequests.map(buildMaintenanceRequestCard);

  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="Property Desk"
        title="Units, leases, rent collection, and maintenance"
        description="Register units, assign tenants, collect recurring rent against a running ledger, and track maintenance in one place."
      />

      <ResponsiveCardGrid variant="metrics" className="2xl:grid-cols-5">
        {overviewMetrics.map((metric) => (
          <OpsMetricCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
        ))}
      </ResponsiveCardGrid>

      <QueryErrorPanel
        message={hasError ? 'We could not load part of the property workspace right now. Please try again.' : ''}
        onRetry={() => allQueries.forEach((query) => void query.refetch())}
      />

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader title="Add Unit" subtitle="Register a property unit before assigning a tenant." />
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              createUnit.mutate(buildPropertyUnitPayload(unitForm));
            }}
          >
            <label className="space-y-2 text-sm text-slate-600">
              <span>Property / Estate Name</span>
              <input
                className={inputClass}
                value={unitForm.property_name}
                onChange={(event) => setUnitForm({ ...unitForm, property_name: event.target.value })}
                placeholder="e.g. Sabon Gari Estate"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-600">
                <span>Unit Type</span>
                <select
                  className={inputClass}
                  value={unitForm.unit_type}
                  onChange={(event) => setUnitForm({ ...unitForm, unit_type: event.target.value })}
                >
                  {unitTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>Bedrooms (optional)</span>
                <input
                  className={inputClass}
                  value={unitForm.bedrooms}
                  onChange={(event) => setUnitForm({ ...unitForm, bedrooms: event.target.value })}
                  placeholder="e.g. 2"
                />
              </label>
            </div>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Address</span>
              <input
                className={inputClass}
                value={unitForm.address}
                onChange={(event) => setUnitForm({ ...unitForm, address: event.target.value })}
                placeholder="e.g. Block 4, Flat 2"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-600">
                <span>Rent Amount</span>
                <input
                  className={inputClass}
                  value={unitForm.rent_amount}
                  onChange={(event) => setUnitForm({ ...unitForm, rent_amount: event.target.value })}
                  placeholder="e.g. 600000"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>Service Charge (optional)</span>
                <input
                  className={inputClass}
                  value={unitForm.service_charge_amount}
                  onChange={(event) => setUnitForm({ ...unitForm, service_charge_amount: event.target.value })}
                  placeholder="e.g. 50000"
                />
              </label>
            </div>
            <Button type="submit" disabled={createUnit.isPending} fullWidth>
              {createUnit.isPending ? 'Saving unit...' : 'Save unit'}
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Units" subtitle="Every registered unit and its current status." />
          <div className="space-y-3">
            {unitCards.length ? unitCards.map((card) => (
              <div key={card.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{card.title}</p>
                    <p className="text-sm text-slate-500">{card.unitTypeLabel} · {card.unitCode}</p>
                    <p className="text-sm text-slate-500">{card.addressLabel}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[card.statusTone] || STATUS_BADGE_CLASS.slate}`}>
                    {card.statusLabel}
                  </span>
                </div>
              </div>
            )) : (
              <EmptyState
                icon="M3 7l1.5-3h15L21 7M3 7v11a2 2 0 002 2h14a2 2 0 002-2V7M3 7h18M9 11h6"
                title="No units yet"
                description="Register your first unit to start assigning tenants."
              />
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader title="Create Lease" subtitle="Assign a tenant to a vacant unit. The first rent charge posts immediately." />
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              createLease.mutate(buildPropertyLeasePayload(leaseForm));
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-600">
                <span>Unit</span>
                <select
                  className={inputClass}
                  value={leaseForm.property_unit_id}
                  onChange={(event) => setLeaseForm({ ...leaseForm, property_unit_id: event.target.value })}
                >
                  <option value="">Select unit</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>{unit.property_name} - {unit.unit_code}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>Tenant</span>
                <select
                  className={inputClass}
                  value={leaseForm.customer_id}
                  onChange={(event) => setLeaseForm({ ...leaseForm, customer_id: event.target.value })}
                >
                  <option value="">Select tenant</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-600">
                <span>Start Date</span>
                <input
                  type="date"
                  className={inputClass}
                  value={leaseForm.start_date}
                  onChange={(event) => setLeaseForm({ ...leaseForm, start_date: event.target.value })}
                />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>Payment Frequency (days)</span>
                <input
                  className={inputClass}
                  value={leaseForm.payment_frequency_days}
                  onChange={(event) => setLeaseForm({ ...leaseForm, payment_frequency_days: event.target.value })}
                  placeholder="365"
                />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-600">
                <span>Rent Amount</span>
                <input
                  className={inputClass}
                  value={leaseForm.rent_amount}
                  onChange={(event) => setLeaseForm({ ...leaseForm, rent_amount: event.target.value })}
                  placeholder="e.g. 600000"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>Service Charge (optional)</span>
                <input
                  className={inputClass}
                  value={leaseForm.service_charge_amount}
                  onChange={(event) => setLeaseForm({ ...leaseForm, service_charge_amount: event.target.value })}
                  placeholder="e.g. 50000"
                />
              </label>
            </div>
            <Button type="submit" disabled={createLease.isPending} fullWidth>
              {createLease.isPending ? 'Saving lease...' : 'Save lease'}
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Leases" subtitle="Running balance per tenant. Record a payment to bring it down." />
          <div className="space-y-3">
            {leaseCards.length ? leaseCards.map((card) => (
              <div key={card.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{card.customerName}</p>
                    <p className="text-sm text-slate-500">{card.unitLabel}</p>
                  </div>
                  <span className={`text-sm font-semibold ${card.hasBalance ? 'text-amber-600' : 'text-emerald-700'}`}>
                    {card.balanceLabel}
                  </span>
                </div>
                {card.hasBalance ? (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      value={paymentAmounts[card.id] ?? ''}
                      onChange={(event) => setPaymentAmounts((current) => ({ ...current, [card.id]: event.target.value }))}
                      placeholder="Payment amount"
                    />
                    <button
                      type="button"
                      disabled={recordPayment.isPending || !paymentAmounts[card.id]}
                      onClick={() => recordPayment.mutate({ leaseId: card.id, amount: Number(paymentAmounts[card.id] || 0) })}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Record
                    </button>
                  </div>
                ) : null}
              </div>
            )) : (
              <EmptyState
                icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                title="No leases yet"
                description="Create a lease above once a unit has a tenant."
              />
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader title="Log Maintenance Issue" subtitle="Track requests until resolved." />
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              createMaintenance.mutate(buildMaintenanceRequestPayload(maintenanceForm));
            }}
          >
            <label className="space-y-2 text-sm text-slate-600">
              <span>Unit</span>
              <select
                className={inputClass}
                value={maintenanceForm.property_unit_id}
                onChange={(event) => setMaintenanceForm({ ...maintenanceForm, property_unit_id: event.target.value })}
              >
                <option value="">Select unit</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.property_name} - {unit.unit_code}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Issue</span>
              <input
                className={inputClass}
                value={maintenanceForm.title}
                onChange={(event) => setMaintenanceForm({ ...maintenanceForm, title: event.target.value })}
                placeholder="e.g. Leaking roof"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-600">
                <span>Priority</span>
                <select
                  className={inputClass}
                  value={maintenanceForm.priority}
                  onChange={(event) => setMaintenanceForm({ ...maintenanceForm, priority: event.target.value })}
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>Details (optional)</span>
                <input
                  className={inputClass}
                  value={maintenanceForm.details}
                  onChange={(event) => setMaintenanceForm({ ...maintenanceForm, details: event.target.value })}
                />
              </label>
            </div>
            <Button type="submit" disabled={createMaintenance.isPending} fullWidth>
              {createMaintenance.isPending ? 'Saving request...' : 'Log request'}
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Maintenance Requests" subtitle="Open and in-progress issues across every unit." />
          <div className="space-y-3">
            {maintenanceCards.length ? maintenanceCards.map((card) => (
              <div key={card.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{card.title}</p>
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase text-rose-700">{card.priorityLabel}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{card.unitCode} · {card.statusLabel}</p>
                {card.detailsLabel ? <p className="mt-1 text-sm text-slate-500">{card.detailsLabel}</p> : null}
              </div>
            )) : (
              <EmptyState
                icon="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828z"
                title="No maintenance requests"
                description="Issues reported against a unit will appear here."
              />
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
