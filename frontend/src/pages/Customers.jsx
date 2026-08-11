import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useBusinessType } from '../config';
import Button from '../components/Button';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import ModalShell, { ModalActions } from '../components/ModalShell';
import OpsMetricCard from '../components/OpsMetricCard';
import { ResponsiveCardGrid } from '../components/PageShell';
import { useModalShell } from '../components/ModalShellContext';
import PageHero from '../components/PageHero';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/apiFeedback';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import {
  buildCustomerOverviewMetrics,
  buildCustomerPayload,
  buildCustomerRow,
  createCustomerForm,
  filterCustomers,
} from '../lib/customers';
import AgroOps from './AgroOps';
import BeautyOps from './BeautyOps';
import BuildingMaterialsOps from './BuildingMaterialsOps';
import CommodityOps from './CommodityOps';
import FarmOps from './FarmOps';
import PureWaterRetailOps from './PureWaterRetailOps';
import ServiceOps from './ServiceOps';
import SMEOps from './SMEOps';
import WarehouseOps from './WarehouseOps';
import WholesaleOps from './WholesaleOps';

function QueryErrorPanel({ message, onRetry }) {
  if (!message) {
    return null;
  }

  return (
    <div className="border-b border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p>{message}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start text-rose-700 hover:bg-rose-100"
          onClick={onRetry}
        >
          Retry
        </Button>
      </div>
    </div>
  );
}

export default function Customers() {
  const { hasActiveType } = useBusinessType();
  const emptyCustomerForm = createCustomerForm();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyCustomerForm);
  const queryClient = useQueryClient();
  const { toast, setToast, clearToast } = useToast();

  const customersQuery = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then((response) => response.data),
  });

  const customerGroupsQuery = useQuery({
    queryKey: ['customer-groups'],
    queryFn: () => api.get('/customer-groups').then((response) => response.data ?? []),
  });
  const customerQueries = [customersQuery, customerGroupsQuery];
  const customersResponse = customersQuery.data;
  const customerGroups = customerGroupsQuery.data ?? [];
  const isLoading = customerQueries.some((query) => query.isLoading);

  const createCustomer = useMutation({
    mutationFn: (payload) => api.post('/customers', payload).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      resetCustomerForm();
      clearToast();
    },
    onError: (mutationError) => {
      setToast({
        tone: 'error',
        message: getErrorMessage(mutationError, 'We could not save that customer right now.'),
      });
    },
  });

  const resetCustomerForm = () => {
    setShowModal(false);
    setForm(emptyCustomerForm);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    createCustomer.mutate(buildCustomerPayload(form));
  };

  const customerRecords = customersResponse?.data ?? customersResponse ?? [];
  const filteredCustomers = filterCustomers(customerRecords, search);
  const customerModalDirty = JSON.stringify(form) !== JSON.stringify(emptyCustomerForm);
  const loadError = getErrorMessage(
    customerQueries.find((query) => query.isError)?.error,
    'We could not load customers right now. Please try again.',
  );

  if (hasActiveType('agro_dealer')) return <AgroOps />;
  if (hasActiveType('construction')) return <BuildingMaterialsOps />;
  if (hasActiveType('commodity')) return <CommodityOps />;
  if (hasActiveType('warehouse')) return <WarehouseOps />;
  if (hasActiveType('wholesale')) return <WholesaleOps />;
  if (hasActiveType('beauty')) return <BeautyOps />;
  if (hasActiveType('service')) return <ServiceOps />;
  if (hasActiveType('pure_water_retail')) return <PureWaterRetailOps />;
  if (hasActiveType('farm')) return <FarmOps />;
  if (hasActiveType('mixed') || hasActiveType('general')) return <SMEOps />;

  return (
    <div className="space-y-6">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Customer feedback" />

      <PageHero
        eyebrow="Customer Desk"
        title="Customers"
        description={`${customerRecords.length} registered contacts with credit, location, and collection visibility.`}
        actions={(
          <Button
            onClick={() => {
              clearToast();
              resetCustomerForm();
              setShowModal(true);
            }}
          >
            New customer
          </Button>
        )}
      />

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-5">
        {buildCustomerOverviewMetrics(customerRecords, formatCurrencyNGN).map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            tone={metric.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <Card padding={false} className="overflow-hidden">
        <QueryErrorPanel
          message={loadError}
          onRetry={() => {
            customerQueries.forEach((query) => {
              void query.refetch();
            });
          }}
        />

        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Customer Register</p>
              <p className="mt-1 text-sm text-slate-500">
                Review customer type, group, location, credit posture, and collection exposure in one place.
              </p>
            </div>
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input max-w-md"
            />
          </div>
        </div>

        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Customer</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Type</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Group</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Location</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Balance</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Credit Limit</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(5).fill(0).map((_, index) => (
                <tr key={index}>
                  <td colSpan={7} className="px-5 py-4">
                    <div className="h-12 animate-pulse rounded-2xl bg-slate-100"></div>
                  </td>
                </tr>
              ))
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-6">
                  <EmptyState
                    icon="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4"
                    title={customerRecords.length ? 'No customers matched your search' : 'No customers yet'}
                    description={
                      customerRecords.length
                        ? 'Try a different name, phone number, or clear the search to see everyone.'
                        : 'Add your customers to track balances, credit, and collection history in one place.'
                    }
                    action={
                      customerRecords.length
                        ? null
                        : {
                          label: 'New customer',
                          onClick: () => {
                            clearToast();
                            resetCustomerForm();
                            setShowModal(true);
                          },
                        }
                    }
                  />
                </td>
              </tr>
            ) : filteredCustomers.map((customer) => {
              const customerRow = buildCustomerRow(customer, formatCurrencyNGN);

              return (
                <tr key={customerRow.id} className="border-t border-slate-100">
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900">{customerRow.title}</p>
                    <p className="text-sm text-slate-500">{customerRow.phoneLabel}</p>
                    <p className="text-sm text-slate-500">{customerRow.emailLabel}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold capitalize text-sky-700">{customerRow.typeLabel}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{customerRow.groupLabel}</td>
                  <td className="px-5 py-4 text-slate-500">{customerRow.locationLabel}</td>
                  <td className="px-5 py-4 font-medium">
                    <span className={parseFloat(customer.balance || 0) > 0 ? 'text-amber-600' : 'text-slate-700'}>
                      {customerRow.balanceLabel}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{customerRow.creditLimitLabel}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${customer.is_active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {customerRow.statusLabel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {showModal ? (
        <ModalShell
          title="Save Customer"
          subtitle="Capture contact, type, location, and credit detail in one place."
          size="lg"
          tone="sky"
          busy={createCustomer.isPending}
          dismissPreset="guarded"
          busyDismissPreset="locked"
          draftState={createCustomer.isPending ? 'saving' : customerModalDirty ? 'dirty' : null}
          draftStatePreset="pending"
          closeGuardPreset="discardDraft"
          scrollAreaClassName="pr-0"
          bodyClassName="pb-1"
          headerBadgePreset="profile"
          headerBadgeLabel="Customer profile"
          onClose={resetCustomerForm}
        >
          <CustomerModalForm
            customerGroups={customerGroups}
            form={form}
            setForm={setForm}
            handleSubmit={handleSubmit}
            saving={createCustomer.isPending}
          />
        </ModalShell>
      ) : null}
    </div>
  );
}

function CustomerModalForm({ customerGroups, form, setForm, handleSubmit, saving }) {
  const modal = useModalShell();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-600">Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          className="input mt-1"
          data-autofocus="true"
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-600">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            className="input mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            className="input mt-1"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-600">Address</label>
        <input
          type="text"
          value={form.address}
          onChange={(event) => setForm({ ...form, address: event.target.value })}
          className="input mt-1"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-600">City</label>
          <input
            type="text"
            value={form.city}
            onChange={(event) => setForm({ ...form, city: event.target.value })}
            className="input mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600">State</label>
          <input
            type="text"
            value={form.state}
            onChange={(event) => setForm({ ...form, state: event.target.value })}
            className="input mt-1"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-600">Type</label>
          <select
            value={form.customer_type}
            onChange={(event) => setForm({ ...form, customer_type: event.target.value })}
            className="input mt-1"
          >
            <option value="individual">Individual</option>
            <option value="retailer">Retailer</option>
            <option value="wholesaler">Wholesaler</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600">Customer Group</label>
          <select
            value={form.customer_group_id}
            onChange={(event) => setForm({ ...form, customer_group_id: event.target.value })}
            className="input mt-1"
          >
            <option value="">No group</option>
            {customerGroups.map((group) => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-600">Credit Limit</label>
        <input
          type="number"
          value={form.credit_limit}
          onChange={(event) => setForm({ ...form, credit_limit: event.target.value })}
          className="input mt-1"
          placeholder="0.00"
        />
      </div>

      <label className="flex items-center gap-3 text-sm font-medium text-slate-600">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
        />
        Customer is active for sales
      </label>

      <ModalActions tone="sky" preset="form">
        <Button type="button" variant="secondary" size="lg" fullWidth onClick={modal.requestClose} disabled={saving} data-modal-dismiss="true">
          Cancel
        </Button>
        <Button type="submit" size="lg" fullWidth disabled={saving}>
          {saving ? 'Saving customer...' : 'Save customer'}
        </Button>
      </ModalActions>
    </form>
  );
}
