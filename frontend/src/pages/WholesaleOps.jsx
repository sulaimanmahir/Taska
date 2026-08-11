import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Card, { CardHeader } from '../components/Card';
import EmptyState from '../components/EmptyState';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/apiFeedback';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import {
  buildWholesaleCustomerCard,
  buildWholesaleDeskMetrics,
  buildWholesaleOrderPayload,
  buildWholesaleOverviewMetrics,
  buildWholesalePriceSourceLabel,
  buildWholesalePriceTierPayload,
  buildWholesaleRouteBoardItem,
  buildWholesaleRouteRunPayload,
  buildWholesaleSalesRepPayload,
  buildWholesaleTransferPayload,
  createWholesaleOrderForm,
  createWholesaleRepForm,
  createWholesaleRouteForm,
  createWholesaleTierForm,
  createWholesaleTransferForm,
  filterWholesaleCustomers,
  filterWholesaleRoutes,
  findWholesaleSelectedProduct,
} from '../lib/wholesale';

const formatCurrency = formatCurrencyNGN;

function QueryErrorPanel({ message, onRetry }) {
  if (!message) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-[1.3rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800 md:flex-row md:items-center md:justify-between">
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="self-start rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
      >
        Retry
      </button>
    </div>
  );
}

export default function WholesaleOps() {
  const queryClient = useQueryClient();
  const { toast, setToast, clearToast } = useToast();
  const [repForm, setRepForm] = useState(createWholesaleRepForm);
  const [tierForm, setTierForm] = useState(createWholesaleTierForm);
  const [routeForm, setRouteForm] = useState(createWholesaleRouteForm);
  const [orderForm, setOrderForm] = useState(createWholesaleOrderForm);
  const [transferForm, setTransferForm] = useState(createWholesaleTransferForm);
  const [routeSearch, setRouteSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  const wholesaleQuery = useQuery({
    queryKey: ['wholesale-desk'],
    queryFn: async () => {
      const [overviewRes, productRes, customerRes, warehouseRes] = await Promise.all([
        api.get('/wholesale/overview'),
        api.get('/products'),
        api.get('/customers'),
        api.get('/warehouses'),
      ]);

      return {
        overview: overviewRes.data || {},
        products: productRes.data?.data || [],
        customers: customerRes.data?.data || customerRes.data || [],
        warehouses: warehouseRes.data?.data || warehouseRes.data || [],
      };
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ request }) => request(),
    onSuccess: async (_, variables) => {
      setToast({
        tone: 'success',
        message: variables.successMessage,
      });
      await queryClient.invalidateQueries({ queryKey: ['wholesale-desk'] });
    },
    onError: (error, variables) => {
      setToast({
        tone: 'error',
        message: getErrorMessage(error, variables.errorMessage),
      });
    },
  });

  const runMutation = async ({ request, successMessage, errorMessage, onSuccess }) => {
    clearToast();
    await mutation.mutateAsync({
      request,
      successMessage,
      errorMessage,
    });
    if (typeof onSuccess === 'function') {
      onSuccess();
    }
  };

  const overview = wholesaleQuery.data?.overview || {};
  const products = wholesaleQuery.data?.products || [];
  const customers = wholesaleQuery.data?.customers || [];
  const warehouses = wholesaleQuery.data?.warehouses || [];
  const routeRunOptions = Array.isArray(overview?.route_runs) ? overview.route_runs : [];
  const salesRepOptions = Array.isArray(overview?.sales_reps) ? overview.sales_reps : [];
  const debtorCustomers = Array.isArray(overview?.debtors) ? overview.debtors : customers.filter((customer) => Number(customer?.balance || 0) > 0);

  const selectedProduct = useMemo(
    () => findWholesaleSelectedProduct(products, orderForm.product_id),
    [orderForm.product_id, products]
  );
  const overviewMetrics = useMemo(() => buildWholesaleOverviewMetrics(overview?.summary, formatCurrency), [overview?.summary]);
  const deskMetrics = useMemo(() => buildWholesaleDeskMetrics(overview, formatCurrency), [overview]);
  const filteredRoutes = useMemo(() => filterWholesaleRoutes(routeRunOptions, routeSearch), [routeRunOptions, routeSearch]);
  const filteredCustomers = useMemo(() => filterWholesaleCustomers(debtorCustomers, customerSearch), [customerSearch, debtorCustomers]);
  const routeBoardItems = useMemo(
    () => filteredRoutes.map((routeRun) => buildWholesaleRouteBoardItem(routeRun, formatCurrency)),
    [filteredRoutes]
  );
  const customerCards = useMemo(
    () => filteredCustomers.map((customer) => buildWholesaleCustomerCard(customer, formatCurrency)),
    [filteredCustomers]
  );

  const submitRep = async (event) => {
    event.preventDefault();
    await runMutation({
      request: () => api.post('/wholesale/sales-reps', buildWholesaleSalesRepPayload(repForm)),
      successMessage: 'Sales rep added to the wholesale desk.',
      errorMessage: 'We could not save that sales rep right now.',
      onSuccess: () => setRepForm(createWholesaleRepForm()),
    });
  };

  const submitTier = async (event) => {
    event.preventDefault();
    await runMutation({
      request: () => api.post('/wholesale/price-tiers', buildWholesalePriceTierPayload(tierForm)),
      successMessage: 'Bulk price tier saved.',
      errorMessage: 'We could not save that price tier right now.',
      onSuccess: () => setTierForm(createWholesaleTierForm()),
    });
  };

  const submitRouteRun = async (event) => {
    event.preventDefault();
    await runMutation({
      request: () => api.post('/wholesale/route-runs', buildWholesaleRouteRunPayload(routeForm)),
      successMessage: 'Route run scheduled.',
      errorMessage: 'We could not save that route run right now.',
      onSuccess: () => setRouteForm(createWholesaleRouteForm()),
    });
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    await runMutation({
      request: () => api.post('/wholesale/orders', buildWholesaleOrderPayload(orderForm)),
      successMessage: 'Wholesale order saved.',
      errorMessage: 'We could not save that wholesale order right now.',
      onSuccess: () => setOrderForm(createWholesaleOrderForm()),
    });
  };

  const submitTransfer = async (event) => {
    event.preventDefault();
    await runMutation({
      request: () => api.post('/wholesale/transfers', buildWholesaleTransferPayload(transferForm)),
      successMessage: 'Depot stock transfer recorded.',
      errorMessage: 'We could not move that depot stock right now.',
      onSuccess: () => setTransferForm(createWholesaleTransferForm()),
    });
  };

  const markRouteComplete = async (routeRunId) => {
    await runMutation({
      request: () => api.patch(`/wholesale/route-runs/${routeRunId}`, { status: 'completed' }),
      successMessage: 'Route run marked complete.',
      errorMessage: 'We could not complete that route run right now.',
    });
  };

  return (
    <div className="space-y-5">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Wholesale operations feedback" />
      <PageHero
        eyebrow="Wholesale Operations"
        title="Bulk trading, route collections, and stock allocation in one command centre."
        description="Built for distributor owners who need route visibility, negotiated pricing, rep control, and tighter depot movement discipline."
      />

      <QueryErrorPanel
        message={wholesaleQuery.isError ? getErrorMessage(wholesaleQuery.error, 'We could not load wholesale operations right now. Please try again.') : ''}
        onRetry={() => {
          void wholesaleQuery.refetch();
        }}
      />

      <ResponsiveCardGrid variant="metrics">
        {overviewMetrics.map((metric) => (
          <OpsMetricCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
        ))}
      </ResponsiveCardGrid>

      <ResponsiveCardGrid variant="metrics">
        {deskMetrics.map((metric) => (
          <OpsMetricCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
        ))}
      </ResponsiveCardGrid>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Sales Rep Desk"
            description="Register route sellers with territory and target visibility."
          />
          <form className="grid gap-3 md:grid-cols-2" onSubmit={submitRep}>
            <input value={repForm.name} onChange={(event) => setRepForm({ ...repForm, name: event.target.value })} placeholder="Rep name" className="rounded-2xl border border-slate-200 px-3 py-3 text-sm" />
            <input value={repForm.phone} onChange={(event) => setRepForm({ ...repForm, phone: event.target.value })} placeholder="Phone" className="rounded-2xl border border-slate-200 px-3 py-3 text-sm" />
            <input value={repForm.territory} onChange={(event) => setRepForm({ ...repForm, territory: event.target.value })} placeholder="Territory" className="rounded-2xl border border-slate-200 px-3 py-3 text-sm" />
            <input value={repForm.target_amount} onChange={(event) => setRepForm({ ...repForm, target_amount: event.target.value })} placeholder="Monthly target" type="number" className="rounded-2xl border border-slate-200 px-3 py-3 text-sm" />
            <button disabled={mutation.isPending} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 md:col-span-2">Save sales rep</button>
          </form>
        </Card>

        <Card>
          <CardHeader
            title="Bulk Price Tier"
            description="Keep contract pricing and minimum-volume deals aligned."
          />
          <form className="grid gap-3 md:grid-cols-2" onSubmit={submitTier}>
            <select value={tierForm.customer_id} onChange={(event) => setTierForm({ ...tierForm, customer_id: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm">
              <option value="">General wholesale customer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            <select value={tierForm.product_id} onChange={(event) => setTierForm({ ...tierForm, product_id: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm">
              <option value="">Select product</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <input value={tierForm.tier_name} onChange={(event) => setTierForm({ ...tierForm, tier_name: event.target.value })} placeholder="Tier name" className="rounded-2xl border border-slate-200 px-3 py-3 text-sm" />
            <input value={tierForm.minimum_quantity} onChange={(event) => setTierForm({ ...tierForm, minimum_quantity: event.target.value })} placeholder="Min quantity" type="number" className="rounded-2xl border border-slate-200 px-3 py-3 text-sm" />
            <input value={tierForm.unit_price} onChange={(event) => setTierForm({ ...tierForm, unit_price: event.target.value })} placeholder="Unit price" type="number" className="rounded-2xl border border-slate-200 px-3 py-3 text-sm md:col-span-2" />
            <button disabled={mutation.isPending} className="rounded-2xl bg-indigo-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 md:col-span-2">Save price tier</button>
          </form>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Route Sales Planner"
              description="Schedule route runs with targets, vehicle context, and first-stop expectations."
            />
            <form className="grid gap-3 md:grid-cols-2" onSubmit={submitRouteRun}>
              <select value={routeForm.sales_rep_id} onChange={(event) => setRouteForm({ ...routeForm, sales_rep_id: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm">
                <option value="">Assign later</option>
                {salesRepOptions.map((rep) => <option key={rep.id} value={rep.id}>{rep.name}</option>)}
              </select>
              <input value={routeForm.route_name} onChange={(event) => setRouteForm({ ...routeForm, route_name: event.target.value })} placeholder="Route name" className="rounded-2xl border border-slate-200 px-3 py-3 text-sm" />
              <input value={routeForm.route_date} onChange={(event) => setRouteForm({ ...routeForm, route_date: event.target.value })} type="date" className="rounded-2xl border border-slate-200 px-3 py-3 text-sm" />
              <input value={routeForm.vehicle_reference} onChange={(event) => setRouteForm({ ...routeForm, vehicle_reference: event.target.value })} placeholder="Vehicle reference" className="rounded-2xl border border-slate-200 px-3 py-3 text-sm" />
              <input value={routeForm.target_amount} onChange={(event) => setRouteForm({ ...routeForm, target_amount: event.target.value })} placeholder="Target amount" type="number" className="rounded-2xl border border-slate-200 px-3 py-3 text-sm" />
              <select value={routeForm.customer_id} onChange={(event) => setRouteForm({ ...routeForm, customer_id: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm">
                <option value="">Optional first customer</option>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
              </select>
              <input value={routeForm.stop_name} onChange={(event) => setRouteForm({ ...routeForm, stop_name: event.target.value })} placeholder="First stop name" className="rounded-2xl border border-slate-200 px-3 py-3 text-sm" />
              <input value={routeForm.expected_amount} onChange={(event) => setRouteForm({ ...routeForm, expected_amount: event.target.value })} placeholder="Expected collection" type="number" className="rounded-2xl border border-slate-200 px-3 py-3 text-sm" />
              <button disabled={mutation.isPending} className="rounded-2xl bg-fuchsia-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 md:col-span-2">Save route run</button>
            </form>
          </Card>

          <Card>
            <CardHeader
              title="Bulk Order Desk"
              description="Capture negotiated orders with route and payment posture in one place."
            />
            <form className="grid gap-3 md:grid-cols-2" onSubmit={submitOrder}>
              <select value={orderForm.customer_id} onChange={(event) => setOrderForm({ ...orderForm, customer_id: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm">
                <option value="">Select customer</option>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
              </select>
              <select value={orderForm.route_run_id} onChange={(event) => setOrderForm({ ...orderForm, route_run_id: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm">
                <option value="">No route run</option>
                {routeRunOptions.map((routeRun) => <option key={routeRun.id} value={routeRun.id}>{routeRun.route_name}</option>)}
              </select>
              <input value={orderForm.stop_name} onChange={(event) => setOrderForm({ ...orderForm, stop_name: event.target.value })} placeholder="Stop or market name" className="rounded-2xl border border-slate-200 px-3 py-3 text-sm" />
              <select value={orderForm.product_id} onChange={(event) => setOrderForm({ ...orderForm, product_id: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm">
                <option value="">Select product</option>
                {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
              </select>
              <input value={orderForm.quantity} onChange={(event) => setOrderForm({ ...orderForm, quantity: event.target.value })} placeholder="Quantity" type="number" className="rounded-2xl border border-slate-200 px-3 py-3 text-sm" />
              <input value={orderForm.paid} onChange={(event) => setOrderForm({ ...orderForm, paid: event.target.value })} placeholder="Amount paid" type="number" className="rounded-2xl border border-slate-200 px-3 py-3 text-sm" />
              <select value={orderForm.payment_method} onChange={(event) => setOrderForm({ ...orderForm, payment_method: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm">
                <option value="transfer">transfer</option>
                <option value="cash">cash</option>
                <option value="credit">credit</option>
              </select>
              <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                {buildWholesalePriceSourceLabel(selectedProduct)}
              </div>
              <textarea value={orderForm.notes} onChange={(event) => setOrderForm({ ...orderForm, notes: event.target.value })} placeholder="Order note" className="h-24 rounded-2xl border border-slate-200 px-3 py-3 text-sm md:col-span-2" />
              <button disabled={mutation.isPending} className="rounded-2xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 md:col-span-2">Save wholesale order</button>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Depot Transfer"
              description="Shift stock between depots while keeping route fulfillment visible."
            />
            <form className="space-y-3" onSubmit={submitTransfer}>
              <select value={transferForm.from_warehouse_id} onChange={(event) => setTransferForm({ ...transferForm, from_warehouse_id: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm">
                <option value="">From warehouse</option>
                {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
              </select>
              <select value={transferForm.to_warehouse_id} onChange={(event) => setTransferForm({ ...transferForm, to_warehouse_id: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm">
                <option value="">To warehouse</option>
                {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
              </select>
              <select value={transferForm.product_id} onChange={(event) => setTransferForm({ ...transferForm, product_id: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm">
                <option value="">Select product</option>
                {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
              </select>
              <input value={transferForm.quantity} onChange={(event) => setTransferForm({ ...transferForm, quantity: event.target.value })} placeholder="Quantity" type="number" className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm" />
              <textarea value={transferForm.notes} onChange={(event) => setTransferForm({ ...transferForm, notes: event.target.value })} placeholder="Transfer note" className="h-24 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm" />
              <button disabled={mutation.isPending} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">Move stock</button>
            </form>
          </Card>

          <Card>
            <CardHeader
              title="Live Route Board"
              description="Track active route pressure, expected collections, and completion status."
            />
            <input
              value={routeSearch}
              onChange={(event) => setRouteSearch(event.target.value)}
              placeholder="Search route, rep, stop, status, or vehicle"
              className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm"
            />
            <div className="space-y-3">
              {routeBoardItems.length ? routeBoardItems.map((routeRun) => (
                <div key={routeRun.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{routeRun.routeName}</p>
                      <p className="text-xs text-slate-500">{routeRun.repAndDateLabel}</p>
                    </div>
                    {routeRun.isCompletable ? (
                      <button
                        type="button"
                        onClick={() => {
                          void markRouteComplete(routeRun.id);
                        }}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Complete
                      </button>
                    ) : (
                      <span className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">
                        Completed
                      </span>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-600">
                    <span>Status: {routeRun.statusLabel}</span>
                    <span>Target: {routeRun.targetAmountLabel}</span>
                    <span>Expected: {routeRun.expectedAmountLabel}</span>
                    <span>{routeRun.stopCountLabel}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{routeRun.territoryLabel}</p>
                </div>
              )) : (
                <EmptyState
                  icon="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  title="No route runs matched your search"
                  description="Try a different search, or check back once route runs are scheduled."
                  className="py-4"
                />
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Debt Watch"
              description="Keep overdue wholesale customers visible for route follow-up."
            />
            <input
              value={customerSearch}
              onChange={(event) => setCustomerSearch(event.target.value)}
              placeholder="Search customer, phone, city, state, or type"
              className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm"
            />
            <div className="space-y-3">
              {customerCards.length ? customerCards.map((customer) => (
                <div key={customer.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
                      <p className="text-xs text-slate-500">{customer.phoneLabel}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${customer.tone === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {customer.debtLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{customer.locationLabel}</p>
                  <p className="mt-2 text-xs text-slate-500">Credit limit: {customer.creditLimitLabel}</p>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                  No debtor accounts match this search yet.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
