import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Card, { CardHeader } from '../components/Card';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useBusinessType } from '../config';
import { getErrorMessage } from '../lib/apiFeedback';
import {
  buildingMaterialsCustomerRoleOptions,
  buildBuildingMaterialsCreditCard,
  buildBuildingMaterialsCustomerPayload,
  buildBuildingMaterialsDeliveryFeedCard,
  buildBuildingMaterialsDeliveryPayload,
  buildBuildingMaterialsDeliveryUpdatePayload,
  buildBuildingMaterialsDeskMetrics,
  buildBuildingMaterialsLowStockCard,
  buildBuildingMaterialsMaterialPayload,
  buildBuildingMaterialsOverviewMetrics,
  buildBuildingMaterialsOwnerMetrics,
  buildBuildingMaterialsPaymentPayload,
  buildBuildingMaterialsPriceChangeCard,
  buildBuildingMaterialsPricePayload,
  buildBuildingMaterialsQuotationCard,
  buildBuildingMaterialsQuotationConversionPayload,
  buildBuildingMaterialsQuotationPayload,
  buildBuildingMaterialsTransferCard,
  buildBuildingMaterialsTransferPayload,
  createBuildingMaterialForm,
  createBuildingMaterialsCustomerForm,
  createBuildingMaterialsDeliveryForm,
  createBuildingMaterialsPaymentForm,
  createBuildingMaterialsPriceForm,
  createBuildingMaterialsQuotationForm,
  createBuildingMaterialsTransferForm,
  filterBuildingMaterialsCredits,
  filterBuildingMaterialsDeliveries,
  filterBuildingMaterialsItems,
  filterBuildingMaterialsQuotations,
  getBuildingMaterialsActiveSection,
  getBuildingMaterialsHighlightedItems,
} from '../lib/buildingMaterials';
import { formatCurrencyNGN } from '../lib/financeFormatters';

const formatCurrency = formatCurrencyNGN;
const EMPTY_LIST = [];

function QueryErrorPanel({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p>{message}</p>
        <button
          type="button"
          onClick={() => {
            void onRetry();
          }}
          className="self-start rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default function BuildingMaterialsOps() {
  const { labels } = useBusinessType();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast, setToast, clearToast } = useToast();
  const activeSection = getBuildingMaterialsActiveSection(location.pathname);
  const [materialForm, setMaterialForm] = useState(createBuildingMaterialForm);
  const [customerForm, setCustomerForm] = useState(createBuildingMaterialsCustomerForm);
  const [quotationForm, setQuotationForm] = useState(createBuildingMaterialsQuotationForm);
  const [deliveryForm, setDeliveryForm] = useState(createBuildingMaterialsDeliveryForm);
  const [priceForm, setPriceForm] = useState(createBuildingMaterialsPriceForm);
  const [transferForm, setTransferForm] = useState(createBuildingMaterialsTransferForm);
  const [paymentForm, setPaymentForm] = useState(createBuildingMaterialsPaymentForm);
  const [itemSearch, setItemSearch] = useState('');
  const [quotationSearch, setQuotationSearch] = useState('');
  const [deliverySearch, setDeliverySearch] = useState('');
  const [creditSearch, setCreditSearch] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['building-materials-overview'],
    queryFn: () => api.get('/building-materials/overview').then((response) => response.data),
    staleTime: 60000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['building-materials-overview'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const createMaterial = useMutation({
    mutationFn: (payload) => api.post('/building-materials/items', payload).then((response) => response.data),
    onSuccess: () => {
      setMaterialForm(createBuildingMaterialForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Material line added to the building materials stock desk.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that material right now.') });
    },
  });

  const createCustomer = useMutation({
    mutationFn: (payload) => api.post('/building-materials/customers', payload).then((response) => response.data),
    onSuccess: () => {
      setCustomerForm(createBuildingMaterialsCustomerForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Project account saved into the contractor desk.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that project account right now.') });
    },
  });

  const createQuotation = useMutation({
    mutationFn: (payload) => api.post('/building-materials/quotations', payload).then((response) => response.data),
    onSuccess: () => {
      setQuotationForm(createBuildingMaterialsQuotationForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Quotation saved and ready for contractor follow-through.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that quotation right now.') });
    },
  });

  const convertQuotation = useMutation({
    mutationFn: ({ quotationId, payload }) => api.post(`/building-materials/quotations/${quotationId}/convert`, payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Quotation converted into a live order flow.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not convert that quotation right now.') });
    },
  });

  const createDelivery = useMutation({
    mutationFn: (payload) => api.post('/building-materials/deliveries', payload).then((response) => response.data),
    onSuccess: () => {
      setDeliveryForm(createBuildingMaterialsDeliveryForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Delivery dispatched into the live site queue.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not dispatch that delivery right now.') });
    },
  });

  const updateDelivery = useMutation({
    mutationFn: ({ id, payload }) => api.patch(`/building-materials/deliveries/${id}`, payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Delivery marked as completed and customer exposure updated.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not update that delivery right now.') });
    },
  });

  const savePrice = useMutation({
    mutationFn: (payload) => api.post('/building-materials/price-changes', payload).then((response) => response.data),
    onSuccess: () => {
      setPriceForm(createBuildingMaterialsPriceForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Price change added to the margin-control log.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that price change right now.') });
    },
  });

  const saveTransfer = useMutation({
    mutationFn: (payload) => api.post('/building-materials/transfers', payload).then((response) => response.data),
    onSuccess: () => {
      setTransferForm(createBuildingMaterialsTransferForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Stock transfer saved across yard and warehouse locations.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that transfer right now.') });
    },
  });

  const savePayment = useMutation({
    mutationFn: (payload) => api.post(`/building-materials/credit-accounts/${payload.account_id}/payments`, payload).then((response) => response.data),
    onSuccess: () => {
      setPaymentForm(createBuildingMaterialsPaymentForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Debt payment recorded into the contractor recovery ledger.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not record that debt payment right now.') });
    },
  });

  const categories = data?.categories || [];
  const items = data?.items ?? EMPTY_LIST;
  const contractors = data?.contractors || [];
  const quotations = data?.quotations || [];
  const deliveries = data?.deliveries || [];
  const credits = data?.credits || [];
  const priceChanges = data?.price_changes || [];
  const transfers = data?.transfers || [];
  const warehouses = data?.warehouses || [];
  const units = data?.units || [];
  const overviewMetrics = buildBuildingMaterialsOverviewMetrics(data?.summary, formatCurrency, isLoading);
  const ownerMetrics = buildBuildingMaterialsOwnerMetrics(data?.summary, formatCurrency);

  const highlightedItems = useMemo(() => getBuildingMaterialsHighlightedItems(items), [items]);
  const deskMetrics = useMemo(
    () => buildBuildingMaterialsDeskMetrics(data?.summary, items, quotations, deliveries, credits, formatCurrency),
    [data?.summary, items, quotations, deliveries, credits],
  );
  const filteredItems = useMemo(
    () => filterBuildingMaterialsItems(items, itemSearch),
    [items, itemSearch],
  );
  const filteredQuotations = useMemo(
    () => filterBuildingMaterialsQuotations(quotations, quotationSearch).map((quotation) => buildBuildingMaterialsQuotationCard(quotation, formatCurrency)),
    [quotations, quotationSearch],
  );
  const filteredDeliveries = useMemo(
    () => filterBuildingMaterialsDeliveries(deliveries, deliverySearch).map((delivery) => ({ source: delivery, card: buildBuildingMaterialsDeliveryFeedCard(delivery) })),
    [deliveries, deliverySearch],
  );
  const filteredCredits = useMemo(
    () => filterBuildingMaterialsCredits(credits, creditSearch).map((credit) => buildBuildingMaterialsCreditCard(credit, formatCurrency)),
    [credits, creditSearch],
  );

  return (
    <div className="space-y-5">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Building materials feedback" />

      <PageHero
        eyebrow="Building Materials Edition"
        title={labels.dashboard}
        description="Run quotations, contractor pricing, credit recovery, warehouse and yard stock, and site deliveries from one premium command centre built for Nigerian material merchants."
        aside={`Active section: ${activeSection}`}
      />

      {error ? (
        <QueryErrorPanel
          message={getErrorMessage(error, 'We could not load the building materials desk right now.')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      <ResponsiveCardGrid variant="metrics">
        {overviewMetrics.map((metric) => (
          <OpsMetricCard key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} tone={metric.tone} />
        ))}
      </ResponsiveCardGrid>

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-6">
        {deskMetrics.map((metric) => (
          <OpsMetricCard key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} tone={metric.tone} />
        ))}
      </ResponsiveCardGrid>

      {location.pathname === '/' ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader title="Owner Dashboard" subtitle="What the owner needs before the next truck leaves the yard." />
            <ResponsiveCardGrid variant="default" className="md:grid-cols-3">
              {ownerMetrics.map((metric) => (
                <OpsMetricCard key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} tone={metric.tone} />
              ))}
            </ResponsiveCardGrid>
            <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top Contractor</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{data?.summary?.top_contractor || 'No contractor yet'}</p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Low Stock Watch" subtitle="Fast-moving lines that can quietly kill today's sales." />
            <div className="space-y-3">
              {highlightedItems.map((item) => {
                const lowStockCard = buildBuildingMaterialsLowStockCard(item);

                return (
                  <div key={lowStockCard.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{lowStockCard.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{lowStockCard.meta}</p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        {lowStockCard.locationLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-700">{lowStockCard.priceLabel}</p>
                  </div>
                );
              })}
              {!highlightedItems.length ? <p className="text-sm text-slate-500">No urgent low-stock materials right now.</p> : null}
            </div>
          </Card>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Material Register" subtitle="Capture cement, rods, roofing, plumbing, electrical, tiles, timber, and bulk stock with pricing tiers ready." />
          <form
            className="grid grid-cols-1 gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              createMaterial.mutate(buildBuildingMaterialsMaterialPayload(materialForm));
            }}
          >
            <input className="input" placeholder="Material name" value={materialForm.name} onChange={(event) => setMaterialForm({ ...materialForm, name: event.target.value })} />
            <input className="input" placeholder="SKU" value={materialForm.sku} onChange={(event) => setMaterialForm({ ...materialForm, sku: event.target.value })} />
            <select className="input" value={materialForm.category_id} onChange={(event) => setMaterialForm({ ...materialForm, category_id: event.target.value })}>
              <option value="">Category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <input className="input" placeholder="Subcategory" value={materialForm.subcategory} onChange={(event) => setMaterialForm({ ...materialForm, subcategory: event.target.value })} />
            <input className="input" placeholder="Brand" value={materialForm.brand} onChange={(event) => setMaterialForm({ ...materialForm, brand: event.target.value })} />
            <select className="input" value={materialForm.unit_type} onChange={(event) => setMaterialForm({ ...materialForm, unit_type: event.target.value })}>
              {['bag', 'piece', 'bundle', 'roll', 'carton', 'ton', 'kg', 'meter', 'foot', 'truck load', 'tipper load'].map((unit) => <option key={unit} value={unit}>{unit}</option>)}
            </select>
            <input className="input" type="number" min="0" placeholder="Cost price" value={materialForm.cost_price} onChange={(event) => setMaterialForm({ ...materialForm, cost_price: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Selling price" value={materialForm.selling_price} onChange={(event) => setMaterialForm({ ...materialForm, selling_price: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Wholesale price" value={materialForm.wholesale_price} onChange={(event) => setMaterialForm({ ...materialForm, wholesale_price: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Contractor price" value={materialForm.contractor_price} onChange={(event) => setMaterialForm({ ...materialForm, contractor_price: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Opening quantity" value={materialForm.quantity} onChange={(event) => setMaterialForm({ ...materialForm, quantity: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Reorder level" value={materialForm.reorder_level} onChange={(event) => setMaterialForm({ ...materialForm, reorder_level: event.target.value })} />
            <select className="input md:col-span-2" value={materialForm.stock_location_type} onChange={(event) => setMaterialForm({ ...materialForm, stock_location_type: event.target.value })}>
              {['warehouse', 'shop', 'yard', 'damaged'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <button type="submit" className="md:col-span-2 mt-1 w-full rounded-2xl bg-slate-900 px-4 py-4 font-semibold text-white shadow-lg shadow-slate-900/10">
              {createMaterial.isPending ? 'Saving material...' : 'Save material'}
            </button>
          </form>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader title="Stock Register" subtitle="Search live catalog lines across yard, warehouse, and shop." className="mb-0" />
            <input className="input" placeholder="Search name, SKU, brand, category, or location..." value={itemSearch} onChange={(event) => setItemSearch(event.target.value)} />
          </div>
          <div className="mt-4 space-y-3">
            {filteredItems.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.sku || 'No SKU'} | {item.brand || 'No brand'} | {item.unit_type || 'unit'}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.stock_location_type || 'warehouse'} | {item.category?.name || item.subcategory || 'No category'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{Number(item.quantity_on_hand || item.quantity || 0).toFixed(2)}</p>
                    <p className="text-xs text-slate-500">{formatCurrency(item.selling_price || 0)}</p>
                  </div>
                </div>
              </div>
            ))}
            {!filteredItems.length ? <p className="text-sm text-slate-500">No material lines matched the current search.</p> : null}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Contractor and Project Accounts" subtitle="Track site buyers, developers, engineers, and negotiated price posture." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              createCustomer.mutate(buildBuildingMaterialsCustomerPayload(customerForm));
            }}
          >
            <input className="input" placeholder="Customer name" value={customerForm.name} onChange={(event) => setCustomerForm({ ...customerForm, name: event.target.value })} />
            <input className="input" placeholder="Phone" value={customerForm.phone} onChange={(event) => setCustomerForm({ ...customerForm, phone: event.target.value })} />
            <select className="input" value={customerForm.customer_role} onChange={(event) => setCustomerForm({ ...customerForm, customer_role: event.target.value })}>
              {buildingMaterialsCustomerRoleOptions.map((role) => <option key={role} value={role}>{role.replaceAll('_', ' ')}</option>)}
            </select>
            <select className="input" value={customerForm.pricing_tier} onChange={(event) => setCustomerForm({ ...customerForm, pricing_tier: event.target.value })}>
              {['retail', 'wholesale', 'contractor'].map((tier) => <option key={tier} value={tier}>{tier}</option>)}
            </select>
            <input className="input" placeholder="Site location" value={customerForm.site_location} onChange={(event) => setCustomerForm({ ...customerForm, site_location: event.target.value })} />
            <input className="input" placeholder="Project name" value={customerForm.project_name} onChange={(event) => setCustomerForm({ ...customerForm, project_name: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Credit limit" value={customerForm.credit_limit} onChange={(event) => setCustomerForm({ ...customerForm, credit_limit: event.target.value })} />
            <textarea className="input min-h-[108px] resize-y py-3" placeholder="Guarantor notes" value={customerForm.guarantor_notes} onChange={(event) => setCustomerForm({ ...customerForm, guarantor_notes: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-slate-900 px-4 py-4 font-semibold text-white shadow-lg shadow-slate-900/10">
              {createCustomer.isPending ? 'Saving project account...' : 'Save project account'}
            </button>
          </form>
        </Card>

        <Card className="xl:col-span-2">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader title="Credit Recovery Register" subtitle="Keep overdue contractor balances and site exposure visible." className="mb-0" />
            <input className="input" placeholder="Search contractor, project, site, or status..." value={creditSearch} onChange={(event) => setCreditSearch(event.target.value)} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {filteredCredits.slice(0, 6).map((creditCard) => (
              <div key={creditCard.id} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{creditCard.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{creditCard.meta}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-rose-700">{creditCard.statusLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-rose-700">{creditCard.outstandingLabel}</p>
                    <p className="text-xs text-slate-500">Limit {creditCard.limitLabel}</p>
                  </div>
                </div>
              </div>
            ))}
            {!filteredCredits.length ? <p className="text-sm text-slate-500">No credit accounts matched the current search.</p> : null}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Quotation Desk" subtitle="Create contractor-ready quotations with negotiated pricing and delivery logic." />
          <form
            className="grid grid-cols-1 gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              createQuotation.mutate(buildBuildingMaterialsQuotationPayload(quotationForm));
            }}
          >
            <select className="input" value={quotationForm.customer_id} onChange={(event) => setQuotationForm({ ...quotationForm, customer_id: event.target.value })}>
              <option value="">Customer / contractor</option>
              {contractors.map((contractor) => <option key={contractor.id} value={contractor.id}>{contractor.name}</option>)}
            </select>
            <select className="input" value={quotationForm.pricing_tier} onChange={(event) => setQuotationForm({ ...quotationForm, pricing_tier: event.target.value })}>
              {['retail', 'wholesale', 'contractor'].map((tier) => <option key={tier} value={tier}>{tier}</option>)}
            </select>
            <input className="input" type="date" value={quotationForm.valid_until} onChange={(event) => setQuotationForm({ ...quotationForm, valid_until: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Delivery fee" value={quotationForm.delivery_fee} onChange={(event) => setQuotationForm({ ...quotationForm, delivery_fee: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Discount line" value={quotationForm.discount_amount} onChange={(event) => setQuotationForm({ ...quotationForm, discount_amount: event.target.value })} />
            <input className="input" placeholder="Notes" value={quotationForm.notes} onChange={(event) => setQuotationForm({ ...quotationForm, notes: event.target.value })} />
            <select className="input" value={quotationForm.item_product_id} onChange={(event) => setQuotationForm({ ...quotationForm, item_product_id: event.target.value })}>
              <option value="">Material</option>
              {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <input className="input" placeholder="Line item label" value={quotationForm.item_name} onChange={(event) => setQuotationForm({ ...quotationForm, item_name: event.target.value })} />
            <input className="input" placeholder="Unit type" value={quotationForm.item_unit_type} onChange={(event) => setQuotationForm({ ...quotationForm, item_unit_type: event.target.value })} />
            <input className="input" type="number" min="0" step="0.001" placeholder="Quantity" value={quotationForm.item_quantity} onChange={(event) => setQuotationForm({ ...quotationForm, item_quantity: event.target.value })} />
            <input className="input md:col-span-2" type="number" min="0" placeholder="Unit price" value={quotationForm.item_unit_price} onChange={(event) => setQuotationForm({ ...quotationForm, item_unit_price: event.target.value })} />
            <button type="submit" className="md:col-span-2 mt-1 w-full rounded-2xl bg-amber-500 px-4 py-4 font-semibold text-white">
              {createQuotation.isPending ? 'Saving quotation...' : 'Save quotation'}
            </button>
          </form>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader title="Quotation Register" subtitle="Search, review, and convert material quotes into live orders." className="mb-0" />
            <input className="input" placeholder="Search customer, quotation no, status, or pricing tier..." value={quotationSearch} onChange={(event) => setQuotationSearch(event.target.value)} />
          </div>
          <div className="mt-4 space-y-3">
            {filteredQuotations.slice(0, 6).map((quotationCard) => (
              <div key={quotationCard.id} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{quotationCard.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{quotationCard.meta}</p>
                    <p className="mt-1 text-xs text-slate-500">{quotationCard.detail}</p>
                  </div>
                  {!quotationCard.isConverted ? (
                    <button
                      type="button"
                      className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                      onClick={() => {
                        clearToast();
                        convertQuotation.mutate({ quotationId: quotationCard.id, payload: buildBuildingMaterialsQuotationConversionPayload() });
                      }}
                    >
                      Convert
                    </button>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{quotationCard.statusLabel}</span>
                  )}
                </div>
                {!quotationCard.isConverted ? <p className="mt-3 text-sm font-semibold text-slate-900">{quotationCard.totalLabel}</p> : null}
              </div>
            ))}
            {!filteredQuotations.length ? <p className="text-sm text-slate-500">No quotations matched the current search.</p> : null}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Site Delivery Desk" subtitle="Assign truck, driver, loader, and destination before site dispatch." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              createDelivery.mutate(buildBuildingMaterialsDeliveryPayload(deliveryForm));
            }}
          >
            <select className="input" value={deliveryForm.customer_id} onChange={(event) => setDeliveryForm({ ...deliveryForm, customer_id: event.target.value })}>
              <option value="">Customer</option>
              {contractors.map((contractor) => <option key={contractor.id} value={contractor.id}>{contractor.name}</option>)}
            </select>
            <select className="input" value={deliveryForm.quotation_id} onChange={(event) => setDeliveryForm({ ...deliveryForm, quotation_id: event.target.value })}>
              <option value="">Quotation</option>
              {quotations.map((quotation) => <option key={quotation.id} value={quotation.id}>{quotation.quotation_number}</option>)}
            </select>
            <input className="input" placeholder="Driver assignment" value={deliveryForm.driver_name} onChange={(event) => setDeliveryForm({ ...deliveryForm, driver_name: event.target.value })} />
            <input className="input" placeholder="Loader assignment" value={deliveryForm.loader_name} onChange={(event) => setDeliveryForm({ ...deliveryForm, loader_name: event.target.value })} />
            <input className="input" placeholder="Vehicle / truck" value={deliveryForm.vehicle_reference} onChange={(event) => setDeliveryForm({ ...deliveryForm, vehicle_reference: event.target.value })} />
            <textarea className="input min-h-[108px] resize-y py-3" placeholder="Site address" value={deliveryForm.delivery_address} onChange={(event) => setDeliveryForm({ ...deliveryForm, delivery_address: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-emerald-700 px-4 py-3 font-semibold text-white">
              {createDelivery.isPending ? 'Dispatching delivery...' : 'Dispatch delivery'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Credit Recovery" subtitle="Capture contractor payments and protect site margin." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              savePayment.mutate(buildBuildingMaterialsPaymentPayload(paymentForm));
            }}
          >
            <select className="input" value={paymentForm.account_id} onChange={(event) => setPaymentForm({ ...paymentForm, account_id: event.target.value })}>
              <option value="">Credit account</option>
              {credits.map((credit) => <option key={credit.id} value={credit.id}>{credit.customer?.name || 'Account'} - {formatCurrency(credit.outstanding_amount)}</option>)}
            </select>
            <input className="input" type="number" min="0" placeholder="Amount paid" value={paymentForm.amount} onChange={(event) => setPaymentForm({ ...paymentForm, amount: event.target.value })} />
            <select className="input" value={paymentForm.payment_method} onChange={(event) => setPaymentForm({ ...paymentForm, payment_method: event.target.value })}>
              {['cash', 'transfer', 'bank', 'card', 'wallet'].map((method) => <option key={method} value={method}>{method}</option>)}
            </select>
            <textarea className="input min-h-[108px] resize-y py-3" placeholder="Payment notes" value={paymentForm.notes} onChange={(event) => setPaymentForm({ ...paymentForm, notes: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-rose-700 px-4 py-3 font-semibold text-white">
              {savePayment.isPending ? 'Recording payment...' : 'Record debt payment'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Price Control" subtitle="Track daily, wholesale, and contractor price movement." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              savePrice.mutate(buildBuildingMaterialsPricePayload(priceForm));
            }}
          >
            <select className="input" value={priceForm.product_id} onChange={(event) => setPriceForm({ ...priceForm, product_id: event.target.value })}>
              <option value="">Material</option>
              {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select className="input" value={priceForm.price_type} onChange={(event) => setPriceForm({ ...priceForm, price_type: event.target.value })}>
              {['selling', 'wholesale', 'contractor'].map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <input className="input" type="number" min="0" placeholder="New price" value={priceForm.new_price} onChange={(event) => setPriceForm({ ...priceForm, new_price: event.target.value })} />
            <textarea className="input min-h-[108px] resize-y py-3" placeholder="Reason for price change" value={priceForm.reason} onChange={(event) => setPriceForm({ ...priceForm, reason: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-violet-700 px-4 py-3 font-semibold text-white">
              {savePrice.isPending ? 'Saving price change...' : 'Save price change'}
            </button>
          </form>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Warehouse and Yard Transfers" subtitle="Move materials across shop floor, yard, and warehouse with unit awareness." />
          <form
            className="grid grid-cols-1 gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveTransfer.mutate(buildBuildingMaterialsTransferPayload(transferForm));
            }}
          >
            <select className="input" value={transferForm.product_id} onChange={(event) => setTransferForm({ ...transferForm, product_id: event.target.value })}>
              <option value="">Material</option>
              {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select className="input" value={transferForm.unit_of_measure_id} onChange={(event) => setTransferForm({ ...transferForm, unit_of_measure_id: event.target.value })}>
              <option value="">Unit</option>
              {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name} ({unit.abbreviation})</option>)}
            </select>
            <select className="input" value={transferForm.source_warehouse_id} onChange={(event) => setTransferForm({ ...transferForm, source_warehouse_id: event.target.value })}>
              <option value="">Source</option>
              {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
            </select>
            <select className="input" value={transferForm.destination_warehouse_id} onChange={(event) => setTransferForm({ ...transferForm, destination_warehouse_id: event.target.value })}>
              <option value="">Destination</option>
              {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
            </select>
            <input className="input" type="number" min="0" step="0.001" placeholder="Quantity" value={transferForm.quantity} onChange={(event) => setTransferForm({ ...transferForm, quantity: event.target.value })} />
            <textarea className="input min-h-[108px] resize-y py-3" placeholder="Transfer notes" value={transferForm.notes} onChange={(event) => setTransferForm({ ...transferForm, notes: event.target.value })} />
            <button type="submit" className="md:col-span-2 mt-1 w-full rounded-2xl bg-slate-900 px-4 py-4 font-semibold text-white">
              {saveTransfer.isPending ? 'Saving transfer...' : 'Save transfer'}
            </button>
          </form>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader title="Operations Feed" subtitle="Track site drops, price moves, and stock transfers from one searchable feed." className="mb-0" />
            <input className="input" placeholder="Search customer, driver, vehicle, address, or status..." value={deliverySearch} onChange={(event) => setDeliverySearch(event.target.value)} />
          </div>
          <div className="mt-4 space-y-3">
            {filteredDeliveries.slice(0, 4).map(({ source, card }) => (
              <div key={card.id} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{card.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{card.meta}</p>
                    <p className="mt-1 text-xs text-slate-500">{card.vehicleLabel} | {card.addressLabel}</p>
                  </div>
                  {card.canMarkDelivered ? (
                    <button
                      type="button"
                      className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                      onClick={() => {
                        clearToast();
                        updateDelivery.mutate({ id: card.id, payload: buildBuildingMaterialsDeliveryUpdatePayload(source) });
                      }}
                    >
                      Mark delivered
                    </button>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{card.statusLabel}</span>
                  )}
                </div>
              </div>
            ))}
            {!filteredDeliveries.length ? <p className="text-sm text-slate-500">No deliveries matched the current search.</p> : null}

            {priceChanges.slice(0, 3).map((change) => {
              const priceChangeCard = buildBuildingMaterialsPriceChangeCard(change, formatCurrency);

              return (
                <div key={priceChangeCard.id} className="rounded-2xl bg-violet-50 px-4 py-3">
                  <p className="font-medium text-violet-900">{priceChangeCard.title}</p>
                  <p className="mt-1 text-xs text-violet-700">{priceChangeCard.meta}</p>
                  <p className="mt-1 text-xs text-violet-700">{priceChangeCard.reasonLabel}</p>
                </div>
              );
            })}

            {transfers.slice(0, 3).map((transfer) => {
              const transferCard = buildBuildingMaterialsTransferCard(transfer);

              return (
                <div key={transferCard.id} className="rounded-2xl bg-amber-50 px-4 py-3">
                  <p className="font-medium text-amber-900">{transferCard.title}</p>
                  <p className="mt-1 text-xs text-amber-700">{transferCard.meta}</p>
                  <p className="mt-1 text-xs text-amber-700">{transferCard.routeLabel}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
