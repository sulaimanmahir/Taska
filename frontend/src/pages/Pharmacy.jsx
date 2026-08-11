import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Card, { CardHeader } from '../components/Card';
import Button from '../components/Button';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/apiFeedback';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import {
  buildHealthBatchPayload,
  buildHealthControlledLogCard,
  buildHealthDispensePayload,
  buildHealthNearExpiryCard,
  buildHealthPharmacyDeskMetrics,
  buildHealthPurchaseHistoryCard,
  buildHealthRefillReminderCard,
  buildHealthSubstitutionCard,
  buildHealthSubstitutionPayload,
  createHealthBatchForm,
  createHealthDispenseForm,
  createHealthSubstitutionForm,
  filterHealthBatches,
  filterHealthPharmacyHistory,
} from '../lib/health';

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

export default function Pharmacy() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { toast, setToast, clearToast } = useToast();
  const [batchForm, setBatchForm] = useState(createHealthBatchForm);
  const [substitutionForm, setSubstitutionForm] = useState(createHealthSubstitutionForm);
  const [dispenseForm, setDispenseForm] = useState(createHealthDispenseForm);
  const [batchSearch, setBatchSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const batchSectionRef = useRef(null);
  const substitutionSectionRef = useRef(null);
  const dispenseSectionRef = useRef(null);
  const refillHistorySectionRef = useRef(null);

  const overviewQuery = useQuery({
    queryKey: ['pharmacy-overview'],
    queryFn: () => api.get('/pharmacy/overview').then((response) => response.data),
  });

  const batchesQuery = useQuery({
    queryKey: ['pharmacy-batches'],
    queryFn: () => api.get('/batches').then((response) => response.data.data ?? response.data ?? []),
  });

  const productsQuery = useQuery({
    queryKey: ['pharmacy-products'],
    queryFn: () => api.get('/products?limit=100').then((response) => response.data.data ?? response.data ?? []),
  });

  const customersQuery = useQuery({
    queryKey: ['pharmacy-customers'],
    queryFn: () => api.get('/customers?limit=100').then((response) => response.data.data ?? response.data ?? []),
  });

  const substitutionsQuery = useQuery({
    queryKey: ['pharmacy-substitutions'],
    queryFn: () => api.get('/pharmacy/substitutions').then((response) => response.data ?? []),
  });

  const controlledLogsQuery = useQuery({
    queryKey: ['pharmacy-controlled-logs'],
    queryFn: () => api.get('/pharmacy/controlled-logs').then((response) => response.data ?? []),
  });

  const remindersQuery = useQuery({
    queryKey: ['pharmacy-refill-reminders'],
    queryFn: () => api.get('/pharmacy/refill-reminders').then((response) => response.data ?? []),
  });

  const purchaseHistoryQuery = useQuery({
    queryKey: ['pharmacy-purchase-history'],
    queryFn: () => api.get('/pharmacy/purchase-history').then((response) => response.data ?? []),
  });

  const pharmacyQueries = [
    overviewQuery,
    batchesQuery,
    productsQuery,
    customersQuery,
    substitutionsQuery,
    controlledLogsQuery,
    remindersQuery,
    purchaseHistoryQuery,
  ];
  const overview = overviewQuery.data;
  const batches = batchesQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const customers = customersQuery.data ?? [];
  const substitutions = substitutionsQuery.data ?? [];
  const controlledLogs = controlledLogsQuery.data ?? [];
  const reminders = remindersQuery.data ?? [];
  const purchaseHistory = purchaseHistoryQuery.data ?? [];

  const refresh = () => {
    [
      'pharmacy-overview',
      'pharmacy-batches',
      'pharmacy-substitutions',
      'pharmacy-controlled-logs',
      'pharmacy-refill-reminders',
      'pharmacy-purchase-history',
      'dashboard-stats',
      'inventory',
    ].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
  };

  const createBatch = useMutation({
    mutationFn: (payload) => api.post('/batches', payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      setBatchForm(createHealthBatchForm());
      clearToast();
      setToast({ tone: 'success', message: 'Medicine batch saved into the expiry control register.' });
    },
    onError: (error) => {
      setToast({ tone: 'error', message: getErrorMessage(error, 'We could not save that batch right now.') });
    },
  });

  const createSubstitution = useMutation({
    mutationFn: (payload) => api.post('/pharmacy/substitutions', payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      setSubstitutionForm(createHealthSubstitutionForm());
      clearToast();
      setToast({ tone: 'success', message: 'Substitution rule saved into the pharmacy safety map.' });
    },
    onError: (error) => {
      setToast({ tone: 'error', message: getErrorMessage(error, 'We could not save that substitution rule right now.') });
    },
  });

  const createDispense = useMutation({
    mutationFn: (payload) => api.post('/pharmacy/dispense', payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      setDispenseForm(createHealthDispenseForm());
      clearToast();
      setToast({ tone: 'success', message: 'Dispense record saved into the pharmacy ledger.' });
    },
    onError: (error) => {
      setToast({ tone: 'error', message: getErrorMessage(error, 'We could not save that dispense record right now.') });
    },
  });

  const summary = overview?.summary ?? {};
  const nearExpiry = overview?.near_expiry ?? [];
  const pharmacyMetrics = buildHealthPharmacyDeskMetrics(summary, batches, reminders, controlledLogs);
  const batchCards = useMemo(
    () => filterHealthBatches(batches, batchSearch).map((batch) => buildHealthNearExpiryCard(batch, formatCurrencyNGN)),
    [batchSearch, batches],
  );
  const reminderCards = useMemo(
    () => filterHealthPharmacyHistory(reminders, historySearch).map((entry) => buildHealthRefillReminderCard(entry)),
    [historySearch, reminders],
  );
  const purchaseHistoryCards = useMemo(
    () => filterHealthPharmacyHistory(purchaseHistory, historySearch).map((entry) => buildHealthPurchaseHistoryCard(entry, formatCurrencyNGN)),
    [historySearch, purchaseHistory],
  );
  const hasPageError = pharmacyQueries.some((query) => query.isError);
  const loadError = getErrorMessage(
    pharmacyQueries.find((query) => query.isError)?.error,
    'We could not load the pharmacy desk right now.',
  );

  useEffect(() => {
    const requestedSection = searchParams.get('section');
    const targetRef = {
      batches: batchSectionRef,
      substitutions: substitutionSectionRef,
      dispense: dispenseSectionRef,
      refills: refillHistorySectionRef,
    }[requestedSection];

    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchParams]);

  return (
    <div className="space-y-5">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Pharmacy feedback" />

      <PageHero
        eyebrow="Pharmacy Control"
        title="Batch, substitution, and refill discipline"
        description="Watch expiry exposure, manage controlled medicines, guide safe substitutions, and keep refill demand visible from one stronger pharmacy desk."
      />

      {hasPageError ? (
        <QueryErrorPanel
          message={loadError}
          onRetry={() => {
            pharmacyQueries.forEach((query) => {
              void query.refetch();
            });
          }}
        />
      ) : null}

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-7">
        {pharmacyMetrics.map((item) => (
          <OpsMetricCard
            key={item.label}
            label={item.label}
            value={item.value}
            helper={item.helper}
            tone={item.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <section className="grid gap-6 xl:grid-cols-3">
        <div ref={batchSectionRef}>
          <Card>
            <CardHeader title="Save Batch" subtitle="Capture supplier, stock, manufacturing, and expiry detail with pricing protection already in view." />
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                clearToast();
                createBatch.mutate(buildHealthBatchPayload(batchForm));
              }}
            >
              <select
                className="input"
                value={batchForm.product_id}
                onChange={(event) => setBatchForm({ ...batchForm, product_id: event.target.value })}
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="input"
                  value={batchForm.batch_number}
                  onChange={(event) => setBatchForm({ ...batchForm, batch_number: event.target.value })}
                  placeholder="Batch number"
                />
                <input
                  className="input"
                  value={batchForm.supplier}
                  onChange={(event) => setBatchForm({ ...batchForm, supplier: event.target.value })}
                  placeholder="Supplier"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="input"
                  type="date"
                  value={batchForm.manufacture_date}
                  onChange={(event) => setBatchForm({ ...batchForm, manufacture_date: event.target.value })}
                />
                <input
                  className="input"
                  type="date"
                  value={batchForm.expiry_date}
                  onChange={(event) => setBatchForm({ ...batchForm, expiry_date: event.target.value })}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="input"
                  value={batchForm.quantity}
                  onChange={(event) => setBatchForm({ ...batchForm, quantity: event.target.value })}
                  placeholder="Quantity"
                />
                <input
                  className="input"
                  value={batchForm.cost_per_unit}
                  onChange={(event) => setBatchForm({ ...batchForm, cost_per_unit: event.target.value })}
                  placeholder="Cost per unit"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="input"
                  value={batchForm.near_expiry_discount_percent}
                  onChange={(event) => setBatchForm({ ...batchForm, near_expiry_discount_percent: event.target.value })}
                  placeholder="Near-expiry discount %"
                />
                <input
                  className="input"
                  value={batchForm.discounted_price}
                  onChange={(event) => setBatchForm({ ...batchForm, discounted_price: event.target.value })}
                  placeholder="Discounted price"
                />
              </div>

              <Button type="submit" size="lg" className="w-full">
                {createBatch.isPending ? 'Saving batch...' : 'Save batch'}
              </Button>
            </form>
          </Card>
        </div>

        <div ref={dispenseSectionRef}>
          <Card>
            <CardHeader title="Dispense Medicine" subtitle="Keep patient, batch, pricing, and refill follow-through inside the same controlled-sale save flow." />
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                clearToast();
                createDispense.mutate(buildHealthDispensePayload(dispenseForm));
              }}
            >
              <select
                className="input"
                value={dispenseForm.customer_id}
                onChange={(event) => setDispenseForm({ ...dispenseForm, customer_id: event.target.value })}
              >
                <option value="">Select customer / patient</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>

              <div className="grid gap-3 md:grid-cols-2">
                <select
                  className="input"
                  value={dispenseForm.product_id}
                  onChange={(event) => setDispenseForm({ ...dispenseForm, product_id: event.target.value })}
                >
                  <option value="">Dispensed medicine</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <select
                  className="input"
                  value={dispenseForm.product_batch_id}
                  onChange={(event) => setDispenseForm({ ...dispenseForm, product_batch_id: event.target.value })}
                >
                  <option value="">Select batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batch_number} - {batch.product?.name}
                    </option>
                  ))}
                </select>
              </div>

              <select
                className="input"
                value={dispenseForm.substituted_from_product_id}
                onChange={(event) => setDispenseForm({ ...dispenseForm, substituted_from_product_id: event.target.value })}
              >
                <option value="">Substituted from (optional)</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="input"
                  value={dispenseForm.quantity}
                  onChange={(event) => setDispenseForm({ ...dispenseForm, quantity: event.target.value })}
                  placeholder="Quantity"
                />
                <input
                  className="input"
                  value={dispenseForm.unit_price}
                  onChange={(event) => setDispenseForm({ ...dispenseForm, unit_price: event.target.value })}
                  placeholder="Unit price"
                />
              </div>

              <input
                className="input"
                value={dispenseForm.prescription_reference}
                onChange={(event) => setDispenseForm({ ...dispenseForm, prescription_reference: event.target.value })}
                placeholder="Prescription reference"
              />
              <textarea
                className="input min-h-[108px] resize-y py-3"
                value={dispenseForm.notes}
                onChange={(event) => setDispenseForm({ ...dispenseForm, notes: event.target.value })}
                placeholder="Dispense or counselling notes"
              />
              <label className="flex items-center gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={dispenseForm.create_refill_reminder}
                  onChange={(event) => setDispenseForm({ ...dispenseForm, create_refill_reminder: event.target.checked })}
                />
                Save refill reminder
              </label>

              <Button type="submit" variant="secondary" className="w-full border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100">
                {createDispense.isPending ? 'Saving dispense...' : 'Save dispense record'}
              </Button>
            </form>
          </Card>
        </div>

        <div ref={substitutionSectionRef}>
          <Card>
            <CardHeader title="Substitution Rule" subtitle="Map brand and generic alternatives with explicit safety intent and active-state visibility." />
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                clearToast();
                createSubstitution.mutate(buildHealthSubstitutionPayload(substitutionForm));
              }}
            >
              <select
                className="input"
                value={substitutionForm.product_id}
                onChange={(event) => setSubstitutionForm({ ...substitutionForm, product_id: event.target.value })}
              >
                <option value="">Select original medicine</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <select
                className="input"
                value={substitutionForm.substitute_product_id}
                onChange={(event) => setSubstitutionForm({ ...substitutionForm, substitute_product_id: event.target.value })}
              >
                <option value="">Select substitute</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <textarea
                className="input min-h-[108px] resize-y py-3"
                value={substitutionForm.reason}
                onChange={(event) => setSubstitutionForm({ ...substitutionForm, reason: event.target.value })}
                placeholder="Why this substitution is allowed"
              />
              <label className="flex items-center gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={substitutionForm.is_active}
                  onChange={(event) => setSubstitutionForm({ ...substitutionForm, is_active: event.target.checked })}
                />
                Rule is active for dispensing
              </label>
              <Button type="submit" variant="secondary" className="w-full border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                {createSubstitution.isPending ? 'Saving rule...' : 'Save substitution rule'}
              </Button>
            </form>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
            <CardHeader
              title="Batch Register"
              subtitle="Active stock, expiry timing, and supplier context across the medicine batches already inside the pharmacy."
              className="mb-0"
            />
            <input
              className="input md:min-w-[280px]"
              value={batchSearch}
              onChange={(event) => setBatchSearch(event.target.value)}
              placeholder="Search batch, medicine, supplier, or expiry..."
            />
          </div>

          <div className="mt-4 space-y-3">
            {batchCards.map((card) => (
              <div key={card.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">{card.title}</p>
                    <p className="text-sm text-slate-500">{card.batchLabel}</p>
                    <p className="text-sm text-slate-500">{card.expiryLabel}</p>
                  </div>
                  <p className="text-sm font-semibold text-amber-700">{card.discountLabel}</p>
                </div>
              </div>
            ))}
            {!batchCards.length ? (
              <EmptyState
                icon="M9 3v2m6-2v2M4 7h16M5 7v11a2 2 0 002 2h10a2 2 0 002-2V7"
                title="No medicine batches found"
                description={
                  batches.length
                    ? 'Try a different medicine, supplier, or expiry search.'
                    : 'Save your first batch above to start tracking stock, cost, and expiry together.'
                }
              />
            ) : null}
          </div>
        </Card>

        <Card>
          <CardHeader title="Near Expiry Queue" subtitle="Prioritize discounting or movement before expiring medicines convert into dead stock." />
          <div className="space-y-3">
            {nearExpiry.map((batch) => {
              const batchCard = buildHealthNearExpiryCard(batch, formatCurrencyNGN);

              return (
                <div key={batchCard.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="font-semibold text-slate-900">{batchCard.title}</p>
                  <p className="text-sm text-slate-600">{batchCard.batchLabel}</p>
                  <p className="text-sm text-slate-600">{batchCard.expiryLabel}</p>
                  <p className="text-sm font-semibold text-amber-700">{batchCard.discountLabel}</p>
                </div>
              );
            })}
            {!nearExpiry.length ? (
              <EmptyState
                icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                title="Nothing near expiry"
                description="Batches will show up here automatically once they enter the near-expiry warning window."
              />
            ) : null}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Substitution Map" subtitle="Approved brand and generic switches currently available to the pharmacy team." />
          <div className="space-y-3">
            {substitutions.map((rule) => {
              const ruleCard = buildHealthSubstitutionCard(rule);

              return (
                <div key={ruleCard.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{ruleCard.title}</p>
                  <p className="text-sm text-slate-500">{ruleCard.substituteLabel}</p>
                  <p className="text-sm text-slate-500">{ruleCard.reasonLabel}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">{ruleCard.statusLabel}</p>
                </div>
              );
            })}
            {!substitutions.length ? (
              <EmptyState
                icon="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4"
                title="No substitution rules yet"
                description="Map approved brand and generic alternatives above so the dispense desk can suggest safe switches."
              />
            ) : null}
          </div>
        </Card>

        <Card>
          <CardHeader title="Controlled Drug Log" subtitle="Controlled-medicine movements with patient, batch, and prescription traceability." />
          <div className="space-y-3">
            {controlledLogs.map((entry) => {
              const entryCard = buildHealthControlledLogCard(entry);

              return (
                <div key={entryCard.id} className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <p className="font-semibold text-slate-900">{entryCard.title}</p>
                  <p className="text-sm text-slate-600">{entryCard.quantityLabel}</p>
                  <p className="text-sm text-slate-600">{entryCard.batchLabel}</p>
                  <p className="text-sm text-rose-700">{entryCard.prescriptionLabel}</p>
                  <p className="mt-1 text-xs text-slate-500">{entryCard.dateLabel}</p>
                </div>
              );
            })}
            {!controlledLogs.length ? (
              <EmptyState
                icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                title="No controlled-drug movements yet"
                description="Dispense a controlled medicine above to start the traceability log for this pharmacy."
              />
            ) : null}
          </div>
        </Card>

        <div ref={refillHistorySectionRef}>
          <Card>
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
              <CardHeader
                title="Refill and Dispense History"
                subtitle="Patient follow-through and recent medicine movement in one searchable pharmacy memory."
                className="mb-0"
              />
              <input
                className="input"
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                placeholder="Search patient, medicine, batch, prescription, or status..."
              />
            </div>

            <div className="mt-4 space-y-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Refill Follow-through</p>
                {reminderCards.slice(0, 4).map((entry) => (
                  <div key={`reminder-${entry.id}`} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="font-semibold text-slate-900">{entry.title}</p>
                    <p className="text-sm text-slate-600">{entry.productLabel}</p>
                    <p className="text-sm text-emerald-700">{entry.dueLabel}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">{entry.statusLabel}</p>
                  </div>
                ))}
                {!reminderCards.length ? (
                  <EmptyState
                    icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    title="No refill reminders"
                    description={
                      reminders.length
                        ? 'Try a different search.'
                        : 'Save a dispense record above with "Save refill reminder" checked to start tracking follow-through.'
                    }
                    className="py-4"
                  />
                ) : null}
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recent Dispense History</p>
                {purchaseHistoryCards.slice(0, 4).map((entry) => (
                  <div key={`history-${entry.id}`} className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-semibold text-slate-900">{entry.title}</p>
                    <p className="text-sm text-slate-600">{entry.amountLabel}</p>
                    <p className="text-sm text-slate-600">{entry.batchLabel}</p>
                    <p className="text-sm text-slate-500">{entry.quantityLabel}</p>
                    <p className="text-sm text-slate-500">{entry.contextLabel}</p>
                    <p className="mt-1 text-xs text-slate-500">{entry.dateLabel}</p>
                  </div>
                ))}
                {!purchaseHistoryCards.length ? (
                  <EmptyState
                    icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    title="No dispense history"
                    description={
                      purchaseHistory.length
                        ? 'Try a different search.'
                        : 'Dispense records will build a history here as sales happen at this pharmacy.'
                    }
                    className="py-4"
                  />
                ) : null}
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
