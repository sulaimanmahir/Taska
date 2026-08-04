import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Button from '../components/Button';
import Card, { CardHeader } from '../components/Card';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/apiFeedback';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import {
  buildPureWaterRetailCrateLedgerCard,
  buildPureWaterRetailCratePayload,
  buildPureWaterRetailDeskMetrics,
  buildPureWaterRetailMovementCard,
  buildPureWaterRetailMovementPayload,
  buildPureWaterRetailMovementReset,
  buildPureWaterRetailOverviewMetrics,
  buildPureWaterRetailOwnerBoardCards,
  buildPureWaterRetailPriceTierPayload,
  buildPureWaterRetailSalePayload,
  buildPureWaterRetailSaleReset,
  buildPureWaterRetailTransferPayload,
  createPureWaterRetailCrateForm,
  createPureWaterRetailMovementForm,
  createPureWaterRetailPriceTierForm,
  createPureWaterRetailSaleForm,
  createPureWaterRetailTransferForm,
  filterPureWaterRetailCrateLedger,
  filterPureWaterRetailMovements,
  getPureWaterRetailPredictedRevenue,
  getPureWaterRetailSelectedProduct,
  pureWaterRetailPackageTypes,
} from '../lib/pureWaterRetail';

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

export default function PureWaterRetailOps() {
  const queryClient = useQueryClient();
  const { toast, setToast, clearToast } = useToast();
  const [priceTierForm, setPriceTierForm] = useState(createPureWaterRetailPriceTierForm);
  const [saleForm, setSaleForm] = useState(createPureWaterRetailSaleForm);
  const [movementForm, setMovementForm] = useState(createPureWaterRetailMovementForm);
  const [crateForm, setCrateForm] = useState(createPureWaterRetailCrateForm);
  const [transferForm, setTransferForm] = useState(createPureWaterRetailTransferForm);
  const [movementSearch, setMovementSearch] = useState('');
  const [crateSearch, setCrateSearch] = useState('');

  const retailQuery = useQuery({
    queryKey: ['pure-water-retail-desk'],
    queryFn: async () => {
      const [overviewRes, productRes, customerRes, warehouseRes] = await Promise.all([
        api.get('/pure-water-retail/overview'),
        api.get('/products'),
        api.get('/customers'),
        api.get('/warehouses'),
      ]);

      return {
        overview: overviewRes.data || {},
        products: productRes.data?.data || productRes.data || [],
        customers: customerRes.data?.data || customerRes.data || [],
        warehouses: warehouseRes.data?.data || warehouseRes.data || [],
      };
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ request }) => request(),
    onSuccess: async (_, variables) => {
      setToast({ tone: 'success', message: variables.successMessage });
      await queryClient.invalidateQueries({ queryKey: ['pure-water-retail-desk'] });
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
    await mutation.mutateAsync({ request, successMessage, errorMessage });
    if (typeof onSuccess === 'function') {
      onSuccess();
    }
  };

  const overview = retailQuery.data?.overview || {};
  const products = retailQuery.data?.products || [];
  const customers = retailQuery.data?.customers || [];
  const warehouses = retailQuery.data?.warehouses || [];
  const packageMovements = Array.isArray(overview?.package_movements) ? overview.package_movements : [];
  const crateLedger = Array.isArray(overview?.crate_ledgers) ? overview.crate_ledgers : [];

  const selectedProduct = useMemo(
    () => getPureWaterRetailSelectedProduct(products, saleForm.product_id),
    [products, saleForm.product_id],
  );
  const predictedRevenue = useMemo(
    () => getPureWaterRetailPredictedRevenue(overview?.price_tiers || [], saleForm, selectedProduct),
    [overview?.price_tiers, saleForm, selectedProduct],
  );
  const overviewMetrics = useMemo(
    () => buildPureWaterRetailOverviewMetrics(overview?.summary, formatCurrencyNGN),
    [overview?.summary],
  );
  const deskMetrics = useMemo(
    () => buildPureWaterRetailDeskMetrics(overview, formatCurrencyNGN),
    [overview],
  );
  const ownerBoardCards = useMemo(
    () => buildPureWaterRetailOwnerBoardCards(overview?.summary, formatCurrencyNGN),
    [overview?.summary],
  );
  const movementCards = useMemo(
    () => filterPureWaterRetailMovements(packageMovements, movementSearch).map((movement) =>
      buildPureWaterRetailMovementCard(movement, formatCurrencyNGN)
    ),
    [movementSearch, packageMovements],
  );
  const crateCards = useMemo(
    () => filterPureWaterRetailCrateLedger(crateLedger, crateSearch).map((entry) =>
      buildPureWaterRetailCrateLedgerCard(entry, formatCurrencyNGN)
    ),
    [crateLedger, crateSearch],
  );

  const submitPriceTier = async (event) => {
    event.preventDefault();
    await runMutation({
      request: () => api.post('/pure-water-retail/price-tiers', buildPureWaterRetailPriceTierPayload(priceTierForm)),
      successMessage: 'Retailer price tier saved.',
      errorMessage: 'We could not save that retailer price tier right now.',
      onSuccess: () => setPriceTierForm(createPureWaterRetailPriceTierForm()),
    });
  };

  const submitSale = async (event) => {
    event.preventDefault();
    await runMutation({
      request: () => api.post('/pure-water-retail/sales', buildPureWaterRetailSalePayload(saleForm)),
      successMessage: 'Retail water sale recorded.',
      errorMessage: 'We could not record that retail water sale right now.',
      onSuccess: () => setSaleForm((current) => buildPureWaterRetailSaleReset(current)),
    });
  };

  const submitMovement = async (event) => {
    event.preventDefault();
    await runMutation({
      request: () => api.post('/pure-water-retail/package-movements', buildPureWaterRetailMovementPayload(movementForm)),
      successMessage: 'Package movement saved.',
      errorMessage: 'We could not save that package movement right now.',
      onSuccess: () => setMovementForm((current) => buildPureWaterRetailMovementReset(current)),
    });
  };

  const submitCrate = async (event) => {
    event.preventDefault();
    await runMutation({
      request: () => api.post('/pure-water-retail/crates', buildPureWaterRetailCratePayload(crateForm)),
      successMessage: 'Crate movement saved.',
      errorMessage: 'We could not save that crate movement right now.',
      onSuccess: () => setCrateForm(createPureWaterRetailCrateForm()),
    });
  };

  const submitTransfer = async (event) => {
    event.preventDefault();
    await runMutation({
      request: () => api.post('/pure-water-retail/transfers', buildPureWaterRetailTransferPayload(transferForm)),
      successMessage: 'Outlet stock transfer recorded.',
      errorMessage: 'We could not move that outlet stock right now.',
      onSuccess: () => setTransferForm(createPureWaterRetailTransferForm()),
    });
  };

  return (
    <div className="space-y-5">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Pure water retail feedback" />
      <PageHero
        eyebrow="Pure Water Retail"
        title="Package movement, outlet stock, and retailer pricing without guesswork"
        description="Built for sachet-water depots, bottled-water counters, distributors, and outlet operators who need price discipline, crate accountability, and branch stock visibility."
      />

      <QueryErrorPanel
        message={retailQuery.isError ? getErrorMessage(retailQuery.error, 'We could not load pure water retail operations right now. Please try again.') : ''}
        onRetry={() => {
          void retailQuery.refetch();
        }}
      />

      <ResponsiveCardGrid variant="metrics">
        {overviewMetrics.map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            tone={metric.tone}
            className="border border-slate-200 shadow-sm"
          />
        ))}
      </ResponsiveCardGrid>

      <ResponsiveCardGrid variant="metrics">
        {deskMetrics.map((metric) => (
          <OpsMetricCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
        ))}
      </ResponsiveCardGrid>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Retailer Price Tier" description="Keep outlet, retailer, and wholesale package pricing disciplined." />
          <form className="space-y-3" onSubmit={submitPriceTier}>
            <select value={priceTierForm.customer_id} onChange={(event) => setPriceTierForm({ ...priceTierForm, customer_id: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <option value="">General customer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            <select value={priceTierForm.product_id} onChange={(event) => setPriceTierForm({ ...priceTierForm, product_id: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <option value="">Select product</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <select value={priceTierForm.pricing_scope} onChange={(event) => setPriceTierForm({ ...priceTierForm, pricing_scope: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="all">All</option>
              </select>
              <select value={priceTierForm.package_type} onChange={(event) => setPriceTierForm({ ...priceTierForm, package_type: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                {pureWaterRetailPackageTypes.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={priceTierForm.minimum_quantity} onChange={(event) => setPriceTierForm({ ...priceTierForm, minimum_quantity: event.target.value })} placeholder="Min qty" type="number" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <input value={priceTierForm.unit_price} onChange={(event) => setPriceTierForm({ ...priceTierForm, unit_price: event.target.value })} placeholder="Unit price" type="number" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            </div>
            <input value={priceTierForm.crate_deposit} onChange={(event) => setPriceTierForm({ ...priceTierForm, crate_deposit: event.target.value })} placeholder="Crate deposit" type="number" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            <Button disabled={mutation.isPending} size="lg" fullWidth className="rounded-2xl">Save price tier</Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Retail Water Sale" description="Capture package sales with live value visibility before checkout." />
          <form className="space-y-3" onSubmit={submitSale}>
            <div className="grid grid-cols-2 gap-3">
              <select value={saleForm.sales_channel} onChange={(event) => setSaleForm({ ...saleForm, sales_channel: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
              </select>
              <select value={saleForm.delivery_mode} onChange={(event) => setSaleForm({ ...saleForm, delivery_mode: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <option value="counter">Counter pickup</option>
                <option value="dispatch">Dispatch</option>
                <option value="route_drop">Route drop</option>
              </select>
            </div>
            <select value={saleForm.customer_id} onChange={(event) => setSaleForm({ ...saleForm, customer_id: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <option value="">Walk-in or no linked customer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            <select value={saleForm.warehouse_id} onChange={(event) => setSaleForm({ ...saleForm, warehouse_id: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <option value="">Select outlet stock</option>
              {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
            </select>
            <select value={saleForm.product_id} onChange={(event) => setSaleForm({ ...saleForm, product_id: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <option value="">Select package</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <div className="grid grid-cols-3 gap-3">
              <select value={saleForm.package_type} onChange={(event) => setSaleForm({ ...saleForm, package_type: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                {pureWaterRetailPackageTypes.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <input value={saleForm.quantity} onChange={(event) => setSaleForm({ ...saleForm, quantity: event.target.value })} placeholder="Qty" type="number" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <input value={saleForm.units_per_package} onChange={(event) => setSaleForm({ ...saleForm, units_per_package: event.target.value })} placeholder="Units/pkg" type="number" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            </div>
            <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-900">
              Estimated value: <span className="font-semibold">{formatCurrencyNGN(predictedRevenue)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={saleForm.paid} onChange={(event) => setSaleForm({ ...saleForm, paid: event.target.value })} placeholder="Amount paid" type="number" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <select value={saleForm.payment_method} onChange={(event) => setSaleForm({ ...saleForm, payment_method: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <option value="cash">cash</option>
                <option value="transfer">transfer</option>
                <option value="credit">credit</option>
                <option value="card">card</option>
              </select>
            </div>
            <textarea value={saleForm.notes} onChange={(event) => setSaleForm({ ...saleForm, notes: event.target.value })} placeholder="Notes" className="h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            <Button disabled={mutation.isPending} size="lg" fullWidth className="rounded-2xl bg-cyan-700 hover:bg-cyan-800">Record sale</Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Crate Accountability" description="Track crate issue, return, and deposit posture per customer." />
          <form className="space-y-3" onSubmit={submitCrate}>
            <select value={crateForm.customer_id} onChange={(event) => setCrateForm({ ...crateForm, customer_id: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <option value="">Select customer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            <select value={crateForm.product_id} onChange={(event) => setCrateForm({ ...crateForm, product_id: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <option value="">Optional product</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <select value={crateForm.movement_type} onChange={(event) => setCrateForm({ ...crateForm, movement_type: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <option value="issue">Issue</option>
                <option value="return">Return</option>
                <option value="adjustment_in">Adjustment in</option>
                <option value="adjustment_out">Adjustment out</option>
              </select>
              <input value={crateForm.crate_count} onChange={(event) => setCrateForm({ ...crateForm, crate_count: event.target.value })} placeholder="Crates" type="number" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            </div>
            <input value={crateForm.deposit_amount} onChange={(event) => setCrateForm({ ...crateForm, deposit_amount: event.target.value })} placeholder="Deposit amount" type="number" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            <textarea value={crateForm.notes} onChange={(event) => setCrateForm({ ...crateForm, notes: event.target.value })} placeholder="Notes" className="h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            <Button disabled={mutation.isPending} size="lg" fullWidth className="rounded-2xl bg-blue-800 hover:bg-blue-900">Save crate movement</Button>
          </form>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader title="Package Movement Desk" description="Manage restock, wastage, and outlet transfers with package-level discipline." />
          <form className="space-y-3" onSubmit={submitMovement}>
            <select value={movementForm.warehouse_id} onChange={(event) => setMovementForm({ ...movementForm, warehouse_id: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <option value="">Select stock point</option>
              {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
            </select>
            <select value={movementForm.product_id} onChange={(event) => setMovementForm({ ...movementForm, product_id: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <option value="">Select product</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <div className="grid grid-cols-3 gap-3">
              <select value={movementForm.movement_type} onChange={(event) => setMovementForm({ ...movementForm, movement_type: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <option value="restock">Restock</option>
                <option value="wastage">Wastage</option>
                <option value="adjustment_in">Adjustment in</option>
                <option value="adjustment_out">Adjustment out</option>
              </select>
              <select value={movementForm.package_type} onChange={(event) => setMovementForm({ ...movementForm, package_type: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                {pureWaterRetailPackageTypes.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <input value={movementForm.quantity} onChange={(event) => setMovementForm({ ...movementForm, quantity: event.target.value })} placeholder="Qty" type="number" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            </div>
            <input value={movementForm.units_per_package} onChange={(event) => setMovementForm({ ...movementForm, units_per_package: event.target.value })} placeholder="Units per package" type="number" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            <textarea value={movementForm.notes} onChange={(event) => setMovementForm({ ...movementForm, notes: event.target.value })} placeholder="Why this movement happened" className="h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            <Button disabled={mutation.isPending} size="lg" fullWidth className="rounded-2xl">Save stock movement</Button>
          </form>

          <h3 className="mt-8 text-base font-semibold text-slate-900">Outlet Transfer</h3>
          <form className="mt-4 space-y-3" onSubmit={submitTransfer}>
            <div className="grid grid-cols-2 gap-3">
              <select value={transferForm.from_warehouse_id} onChange={(event) => setTransferForm({ ...transferForm, from_warehouse_id: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <option value="">From</option>
                {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
              </select>
              <select value={transferForm.to_warehouse_id} onChange={(event) => setTransferForm({ ...transferForm, to_warehouse_id: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <option value="">To</option>
                {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
              </select>
            </div>
            <select value={transferForm.product_id} onChange={(event) => setTransferForm({ ...transferForm, product_id: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <option value="">Select product</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <div className="grid grid-cols-3 gap-3">
              <select value={transferForm.package_type} onChange={(event) => setTransferForm({ ...transferForm, package_type: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                {pureWaterRetailPackageTypes.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <input value={transferForm.quantity} onChange={(event) => setTransferForm({ ...transferForm, quantity: event.target.value })} placeholder="Qty" type="number" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <input value={transferForm.units_per_package} onChange={(event) => setTransferForm({ ...transferForm, units_per_package: event.target.value })} placeholder="Units/pkg" type="number" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            </div>
            <textarea value={transferForm.notes} onChange={(event) => setTransferForm({ ...transferForm, notes: event.target.value })} placeholder="Transfer note" className="h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            <Button disabled={mutation.isPending} size="lg" fullWidth className="rounded-2xl bg-emerald-700 hover:bg-emerald-800">Move outlet stock</Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Live Retail Water Board" description="Keep movement, crate, and revenue posture visible across outlets." />
          <ResponsiveCardGrid variant="default" className="md:grid-cols-2">
            {ownerBoardCards.map((metric) => (
              <OpsMetricCard key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} tone={metric.tone} />
            ))}
          </ResponsiveCardGrid>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Recent Package Movements</h3>
              <input
                value={movementSearch}
                onChange={(event) => setMovementSearch(event.target.value)}
                placeholder="Search package, movement, outlet, or note"
                className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />
              <div className="mt-3 space-y-3">
                {movementCards.length ? movementCards.slice(0, 6).map((movementCard) => (
                  <div key={movementCard.id} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">{movementCard.title}</p>
                      <span className="text-xs font-semibold text-slate-500">{movementCard.valueLabel}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{movementCard.meta}</p>
                    <p className="mt-1 text-xs text-slate-500">{movementCard.locationLabel}</p>
                    <p className="mt-2 text-xs text-slate-500">{movementCard.noteLabel}</p>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                    No package movements match this search yet.
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Recent Crate Ledger</h3>
              <input
                value={crateSearch}
                onChange={(event) => setCrateSearch(event.target.value)}
                placeholder="Search customer, movement, product, or note"
                className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />
              <div className="mt-3 space-y-3">
                {crateCards.length ? crateCards.slice(0, 6).map((ledgerCard) => (
                  <div key={ledgerCard.id} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">{ledgerCard.title}</p>
                      <span className="text-xs font-semibold text-slate-500">{ledgerCard.depositLabel}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{ledgerCard.meta}</p>
                    <p className="mt-1 text-xs text-slate-500">{ledgerCard.balanceLabel}</p>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                    No crate ledger entries match this search yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
