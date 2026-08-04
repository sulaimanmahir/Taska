import { useMemo, useState } from 'react';
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
import { formatCurrencyNGN } from '../lib/financeFormatters';
import {
  buildTextileConsignmentCard,
  buildTextileConsignmentPayload,
  buildTextileDeskMetrics,
  buildTextileExposureMetrics,
  buildTextileInvoicePayload,
  buildTextileJobCard,
  buildTextileJobCompletionPayload,
  buildTextileMeasurementPayload,
  buildTextileOverviewMetrics,
  buildTextileStyleOrderCard,
  buildTextileStyleOrderPayload,
  buildTextileVariantPayload,
  createTextileConsignmentForm,
  createTextileInvoiceForm,
  createTextileMeasurementForm,
  createTextileStyleForm,
  createTextileVariantForm,
  filterTextileConsignments,
  filterTextileJobs,
  filterTextileStyleOrders,
  getTextileTailorQueue,
} from '../lib/textile';

const formatCurrency = formatCurrencyNGN;

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

export default function TextileOps() {
  const { labels } = useBusinessType();
  const queryClient = useQueryClient();
  const { toast, setToast, clearToast } = useToast();
  const [measurementForm, setMeasurementForm] = useState(createTextileMeasurementForm);
  const [variantForm, setVariantForm] = useState(createTextileVariantForm);
  const [styleForm, setStyleForm] = useState(createTextileStyleForm);
  const [consignmentForm, setConsignmentForm] = useState(createTextileConsignmentForm);
  const [invoiceForm, setInvoiceForm] = useState(createTextileInvoiceForm);
  const [styleSearch, setStyleSearch] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  const [consignmentSearch, setConsignmentSearch] = useState('');

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['textile-desk'] });
  };

  const { data, error, refetch } = useQuery({
    queryKey: ['textile-desk'],
    queryFn: async () => {
      const [overview, customers, products, measurements, variants, styleOrders, jobs, consignments] = await Promise.all([
        api.get('/textile/overview').then((response) => response.data),
        api.get('/customers').then((response) => response.data.data || response.data || []),
        api.get('/products').then((response) => response.data.data || response.data || []),
        api.get('/textile/measurements').then((response) => response.data),
        api.get('/textile/variants').then((response) => response.data),
        api.get('/textile/style-orders').then((response) => response.data),
        api.get('/textile/jobs').then((response) => response.data),
        api.get('/textile/consignments').then((response) => response.data),
      ]);

      return { overview, customers, products, measurements, variants, styleOrders, jobs, consignments };
    },
    staleTime: 60000,
  });

  const saveMeasurement = useMutation({
    mutationFn: (payload) => api.post('/textile/measurements', payload).then((response) => response.data),
    onSuccess: () => {
      setMeasurementForm(createTextileMeasurementForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Measurement profile saved into the tailoring book.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that measurement profile right now.') });
    },
  });

  const saveVariant = useMutation({
    mutationFn: (payload) => api.post('/textile/variants', payload).then((response) => response.data),
    onSuccess: () => {
      setVariantForm(createTextileVariantForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Fabric variant added to the color-stock desk.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that fabric variant right now.') });
    },
  });

  const saveStyleOrder = useMutation({
    mutationFn: (payload) => api.post('/textile/style-orders', payload).then((response) => response.data),
    onSuccess: () => {
      setStyleForm(createTextileStyleForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Style order captured into the tailoring queue.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that style order right now.') });
    },
  });

  const updateJob = useMutation({
    mutationFn: ({ id, payload }) => api.patch(`/textile/jobs/${id}`, payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Tailoring job marked complete on the floor board.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not update that tailoring job right now.') });
    },
  });

  const saveConsignment = useMutation({
    mutationFn: (payload) => api.post('/textile/consignments', payload).then((response) => response.data),
    onSuccess: () => {
      setConsignmentForm(createTextileConsignmentForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Consignment logged into the exposure watch.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not log that consignment right now.') });
    },
  });

  const saveInvoice = useMutation({
    mutationFn: (payload) => api.post('/textile/invoices', payload).then((response) => response.data),
    onSuccess: () => {
      setInvoiceForm(createTextileInvoiceForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Invoice saved and customer recovery totals refreshed.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that invoice right now.') });
    },
  });

  const overview = data?.overview;
  const customers = data?.customers || [];
  const products = data?.products || [];
  const measurements = data?.measurements || [];
  const variants = data?.variants || [];
  const styleOrders = data?.styleOrders || [];
  const jobs = data?.jobs || [];
  const consignments = data?.consignments || [];

  const overviewMetrics = useMemo(
    () => buildTextileOverviewMetrics(overview?.summary, formatCurrency),
    [overview?.summary],
  );
  const deskMetrics = useMemo(
    () => buildTextileDeskMetrics(overview?.summary, jobs, styleOrders, consignments, variants, formatCurrency),
    [overview?.summary, jobs, styleOrders, consignments, variants],
  );
  const tailorQueue = useMemo(() => getTextileTailorQueue(jobs), [jobs]);
  const exposureMetrics = useMemo(() => buildTextileExposureMetrics(), []);
  const filteredStyleOrders = useMemo(
    () => filterTextileStyleOrders(styleOrders, styleSearch).map((order) => buildTextileStyleOrderCard(order, formatCurrency)),
    [styleOrders, styleSearch],
  );
  const filteredJobs = useMemo(
    () => filterTextileJobs(tailorQueue, jobSearch).map((job) => ({ source: job, card: buildTextileJobCard(job) })),
    [tailorQueue, jobSearch],
  );
  const filteredConsignments = useMemo(
    () => filterTextileConsignments(consignments, consignmentSearch).map((consignment) => buildTextileConsignmentCard(consignment, formatCurrency)),
    [consignments, consignmentSearch],
  );

  return (
    <div className="space-y-5">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Textile operations feedback" />

      <PageHero
        eyebrow="Textile and Tailoring"
        title={`${labels.products || 'Fabrics'} and tailoring command centre`}
        description="Manage measurement books, style orders, sewing stages, color variants, yard and meter invoices, and consignment exposure without losing shop-floor control."
      />

      {error ? (
        <QueryErrorPanel
          message={getErrorMessage(error, 'We could not load textile operations right now.')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      <ResponsiveCardGrid variant="metrics">
        {overviewMetrics.map((metric) => (
          <OpsMetricCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
        ))}
      </ResponsiveCardGrid>

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-6">
        {deskMetrics.map((metric) => (
          <OpsMetricCard key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} tone={metric.tone} />
        ))}
      </ResponsiveCardGrid>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Style Order Intake" subtitle="Capture customer, fabric, measurements, labour, and tailor assignment in one stronger flow." />
          <form
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveStyleOrder.mutate(buildTextileStyleOrderPayload(styleForm));
            }}
          >
            <select className="input" value={styleForm.customer_id} onChange={(event) => setStyleForm({ ...styleForm, customer_id: event.target.value })}>
              <option value="">Customer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            <select className="input" value={styleForm.measurement_id} onChange={(event) => setStyleForm({ ...styleForm, measurement_id: event.target.value })}>
              <option value="">Measurement profile</option>
              {measurements.map((measurement) => <option key={measurement.id} value={measurement.id}>{measurement.customer?.name} | {measurement.measurement_profile}</option>)}
            </select>
            <select className="input" value={styleForm.variant_id} onChange={(event) => setStyleForm({ ...styleForm, variant_id: event.target.value })}>
              <option value="">Fabric variant</option>
              {variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.product?.name} | {variant.color_name}</option>)}
            </select>
            <input className="input" placeholder="Style name" value={styleForm.style_name} onChange={(event) => setStyleForm({ ...styleForm, style_name: event.target.value })} />
            <input className="input" placeholder="Garment type" value={styleForm.garment_type} onChange={(event) => setStyleForm({ ...styleForm, garment_type: event.target.value })} />
            <input className="input" type="number" min="0" step="0.001" placeholder="Fabric quantity" value={styleForm.fabric_quantity} onChange={(event) => setStyleForm({ ...styleForm, fabric_quantity: event.target.value })} />
            <select className="input" value={styleForm.fabric_unit} onChange={(event) => setStyleForm({ ...styleForm, fabric_unit: event.target.value })}>
              <option value="yard">Yard</option>
              <option value="meter">Meter</option>
              <option value="roll">Roll</option>
              <option value="piece">Piece</option>
            </select>
            <input className="input" type="number" min="0" placeholder="Labour charge" value={styleForm.labour_charge} onChange={(event) => setStyleForm({ ...styleForm, labour_charge: event.target.value })} />
            <input className="input" type="date" value={styleForm.due_date} onChange={(event) => setStyleForm({ ...styleForm, due_date: event.target.value })} />
            <input className="input" placeholder="Assigned tailor" value={styleForm.assigned_tailor} onChange={(event) => setStyleForm({ ...styleForm, assigned_tailor: event.target.value })} />
            <button type="submit" className="md:col-span-2 w-full rounded-2xl bg-slate-900 px-4 py-4 font-semibold text-white shadow-lg shadow-slate-900/10">
              {saveStyleOrder.isPending ? 'Saving style order...' : 'Save style order'}
            </button>
          </form>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader title="Tailor Queue" subtitle="Search what is stuck, overdue, or ready for customer release." className="mb-0" />
            <input className="input" placeholder="Search customer, style, stage, or tailor..." value={jobSearch} onChange={(event) => setJobSearch(event.target.value)} />
          </div>
          <div className="mt-4 space-y-3">
            {filteredJobs.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">No tailoring jobs matched the current search.</p>
            ) : filteredJobs.slice(0, 6).map(({ source, card }) => (
              <div key={card.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{card.customerLabel}</p>
                  <button
                    type="button"
                    className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                    onClick={() => {
                      clearToast();
                      updateJob.mutate({ id: source.id, payload: buildTextileJobCompletionPayload() });
                    }}
                  >
                    Complete
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">{card.meta}</p>
                <p className="mt-1 text-xs text-slate-500">{card.dueLabel}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <Card>
          <CardHeader title="Measurement Book" subtitle="Keep repeat customers production-ready." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveMeasurement.mutate(buildTextileMeasurementPayload(measurementForm));
            }}
          >
            <select className="input" value={measurementForm.customer_id} onChange={(event) => setMeasurementForm({ ...measurementForm, customer_id: event.target.value })}>
              <option value="">Customer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            <input className="input" placeholder="Measurement profile" value={measurementForm.measurement_profile} onChange={(event) => setMeasurementForm({ ...measurementForm, measurement_profile: event.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className="input" type="number" placeholder="Chest" value={measurementForm.chest} onChange={(event) => setMeasurementForm({ ...measurementForm, chest: event.target.value })} />
              <input className="input" type="number" placeholder="Waist" value={measurementForm.waist} onChange={(event) => setMeasurementForm({ ...measurementForm, waist: event.target.value })} />
              <input className="input" type="number" placeholder="Hip" value={measurementForm.hip} onChange={(event) => setMeasurementForm({ ...measurementForm, hip: event.target.value })} />
              <input className="input" type="number" placeholder="Length" value={measurementForm.length} onChange={(event) => setMeasurementForm({ ...measurementForm, length: event.target.value })} />
            </div>
            <button type="submit" className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white">
              {saveMeasurement.isPending ? 'Saving measurement...' : 'Save measurement'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Color Variants" subtitle="Track fabric shades by yard, meter, or roll." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveVariant.mutate(buildTextileVariantPayload(variantForm));
            }}
          >
            <select className="input" value={variantForm.product_id} onChange={(event) => setVariantForm({ ...variantForm, product_id: event.target.value })}>
              <option value="">Fabric product</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <input className="input" placeholder="Color name" value={variantForm.color_name} onChange={(event) => setVariantForm({ ...variantForm, color_name: event.target.value })} />
            <input className="input" placeholder="Shade code" value={variantForm.shade_code} onChange={(event) => setVariantForm({ ...variantForm, shade_code: event.target.value })} />
            <input className="input" type="number" min="0" step="0.001" placeholder="Available quantity" value={variantForm.available_quantity} onChange={(event) => setVariantForm({ ...variantForm, available_quantity: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Retail price" value={variantForm.retail_price} onChange={(event) => setVariantForm({ ...variantForm, retail_price: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-fuchsia-700 px-4 py-3 font-semibold text-white">
              {saveVariant.isPending ? 'Saving variant...' : 'Save variant'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Consignment Stock" subtitle="Watch what sits outside the shop but still belongs to you." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveConsignment.mutate(buildTextileConsignmentPayload(consignmentForm));
            }}
          >
            <select className="input" value={consignmentForm.product_id} onChange={(event) => setConsignmentForm({ ...consignmentForm, product_id: event.target.value })}>
              <option value="">Fabric product</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <select className="input" value={consignmentForm.variant_id} onChange={(event) => setConsignmentForm({ ...consignmentForm, variant_id: event.target.value })}>
              <option value="">Variant</option>
              {variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.color_name}</option>)}
            </select>
            <input className="input" placeholder="Partner name" value={consignmentForm.partner_name} onChange={(event) => setConsignmentForm({ ...consignmentForm, partner_name: event.target.value })} />
            <input className="input" type="number" min="0" step="0.001" placeholder="Quantity sent" value={consignmentForm.quantity_sent} onChange={(event) => setConsignmentForm({ ...consignmentForm, quantity_sent: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Settlement due" value={consignmentForm.settlement_due} onChange={(event) => setConsignmentForm({ ...consignmentForm, settlement_due: event.target.value })} />
            <input className="input" type="date" value={consignmentForm.sent_date} onChange={(event) => setConsignmentForm({ ...consignmentForm, sent_date: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-amber-600 px-4 py-3 font-semibold text-white">
              {saveConsignment.isPending ? 'Logging consignment...' : 'Log consignment'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Yard and Meter Invoices" subtitle="Invoice exactly by unit and keep part-payments visible." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveInvoice.mutate(buildTextileInvoicePayload(invoiceForm));
            }}
          >
            <select className="input" value={invoiceForm.customer_id} onChange={(event) => setInvoiceForm({ ...invoiceForm, customer_id: event.target.value })}>
              <option value="">Customer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            <select className="input" value={invoiceForm.style_order_id} onChange={(event) => setInvoiceForm({ ...invoiceForm, style_order_id: event.target.value })}>
              <option value="">Style order</option>
              {styleOrders.map((order) => <option key={order.id} value={order.id}>{order.order_number} | {order.style_name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input className="input" type="number" min="0" step="0.001" placeholder="Quantity" value={invoiceForm.quantity} onChange={(event) => setInvoiceForm({ ...invoiceForm, quantity: event.target.value })} />
              <input className="input" type="number" min="0" placeholder="Rate" value={invoiceForm.rate} onChange={(event) => setInvoiceForm({ ...invoiceForm, rate: event.target.value })} />
            </div>
            <input className="input" type="number" min="0" placeholder="Amount paid" value={invoiceForm.amount_paid} onChange={(event) => setInvoiceForm({ ...invoiceForm, amount_paid: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-emerald-700 px-4 py-3 font-semibold text-white">
              {saveInvoice.isPending ? 'Saving invoice...' : 'Save invoice'}
            </button>
          </form>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader title="Recent Style Orders" subtitle="Search sewing status, tailor assignment, and collection pressure." className="mb-0" />
            <input className="input" placeholder="Search customer, style, garment, status, or tailor..." value={styleSearch} onChange={(event) => setStyleSearch(event.target.value)} />
          </div>
          <div className="mt-4 space-y-3">
            {filteredStyleOrders.slice(0, 6).map((orderCard) => (
              <div key={orderCard.id} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{orderCard.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{orderCard.meta}</p>
                    <p className="mt-1 text-xs text-slate-500">{orderCard.garmentLabel} | {orderCard.tailorLabel} | {orderCard.dueLabel}</p>
                  </div>
                  <p className="font-semibold text-slate-900">{orderCard.totalAmountLabel}</p>
                </div>
              </div>
            ))}
            {!filteredStyleOrders.length ? <p className="text-sm text-slate-500">No style orders matched the current search.</p> : null}
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader title="Exposure Watch" subtitle="Search consignment pressure while keeping the margin leak brief visible." className="mb-0" />
            <input className="input" placeholder="Search partner, product, variant, or date..." value={consignmentSearch} onChange={(event) => setConsignmentSearch(event.target.value)} />
          </div>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <ResponsiveCardGrid variant="default">
              {exposureMetrics.map((metric) => (
                <OpsMetricCard key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} tone={metric.tone} />
              ))}
            </ResponsiveCardGrid>
            <div className="space-y-2">
              {filteredConsignments.slice(0, 4).map((consignmentCard) => (
                <div key={consignmentCard.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="font-medium text-slate-900">{consignmentCard.partnerLabel}</p>
                  <p className="mt-1 text-xs text-slate-500">{consignmentCard.meta}</p>
                  <p className="mt-1 text-xs text-slate-500">{consignmentCard.productLabel} | {consignmentCard.variantLabel}</p>
                </div>
              ))}
              {!filteredConsignments.length ? <p className="text-sm text-slate-500">No consignments matched the current search.</p> : null}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
