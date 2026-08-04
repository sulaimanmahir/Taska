import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useBusinessType } from '../config';
import Card, { CardHeader } from '../components/Card';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import {
  appendPurchaseLine,
  buildPurchaseCard,
  buildPurchaseItemCard,
  buildPurchaseOverviewMetrics,
  buildPurchasePayload,
  buildPurchasePaymentPayload,
  buildPurchaseReceivePayload,
  createPurchaseForm,
  createPurchasePaymentDraft,
  createPurchaseReceiveDraft,
  removePurchaseLine,
  updatePurchaseLine,
} from '../lib/purchases';
import { formatCurrencyNGN } from '../lib/financeFormatters';

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

export default function Purchases() {
  const { labels } = useBusinessType();
  const queryClient = useQueryClient();
  const [purchaseForm, setPurchaseForm] = useState(createPurchaseForm);
  const [receiveDrafts, setReceiveDrafts] = useState({});
  const [paymentDrafts, setPaymentDrafts] = useState({});

  const purchasesQuery = useQuery({
    queryKey: ['purchases'],
    queryFn: () => api.get('/purchases').then((response) => response.data),
  });

  const suppliersQuery = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/suppliers').then((response) => response.data),
  });

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then((response) => response.data),
  });

  const warehousesQuery = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.get('/warehouses').then((response) => response.data),
  });

  const purchasesResponse = purchasesQuery.data;
  const suppliersResponse = suppliersQuery.data;
  const productsResponse = productsQuery.data;
  const warehousesResponse = warehousesQuery.data;
  const purchaseQueries = [purchasesQuery, suppliersQuery, productsQuery, warehousesQuery];
  const purchaseError = purchaseQueries.find((query) => query.isError)?.error;

  const purchases = purchasesResponse?.data ?? [];
  const purchaseSummary = purchasesResponse?.summary ?? {};
  const suppliers = suppliersResponse?.data ?? [];
  const products = productsResponse?.data ?? [];
  const warehouses = warehousesResponse?.data ?? warehousesResponse ?? [];

  const refreshPurchases = () => {
    ['purchases', 'suppliers', 'inventory'].forEach((key) =>
      queryClient.invalidateQueries({ queryKey: [key] })
    );
  };

  const handleRetry = () => {
    purchaseQueries.forEach((query) => {
      void query.refetch();
    });
  };

  const createPurchase = useMutation({
    mutationFn: (payload) => api.post('/purchases', payload).then((response) => response.data),
    onSuccess: () => {
      refreshPurchases();
      setPurchaseForm(createPurchaseForm());
    },
  });

  const receivePurchase = useMutation({
    mutationFn: ({ purchaseId, payload }) => api.post(`/purchases/${purchaseId}/receive`, payload).then((response) => response.data),
    onSuccess: (_, variables) => {
      refreshPurchases();
      setReceiveDrafts((current) => {
        const next = { ...current };
        delete next[variables.purchaseId];
        return next;
      });
    },
  });

  const recordPayment = useMutation({
    mutationFn: ({ purchaseId, payload }) => api.post(`/purchases/${purchaseId}/payments`, payload).then((response) => response.data),
    onSuccess: (_, variables) => {
      refreshPurchases();
      setPaymentDrafts((current) => {
        const next = { ...current };
        delete next[variables.purchaseId];
        return next;
      });
    },
  });

  const purchaseCards = purchases.map((purchase) => ({
    purchase,
    card: buildPurchaseCard(purchase, formatCurrencyNGN),
  }));

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Supply Desk"
        title={`${labels.purchases || 'Purchases'} and supplier payables`}
        description="Raise purchase orders, receive goods into stock, and settle supplier balances without leaving the supply workflow."
      />

      <ResponsiveCardGrid variant="metrics">
        {buildPurchaseOverviewMetrics(purchaseSummary, formatCurrencyNGN).map((metric) => (
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
        message={purchaseError ? 'We could not load part of the purchase workspace right now. Please try again.' : ''}
        onRetry={handleRetry}
      />

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader
            title="Create Purchase Order"
            subtitle="Supplier, receiving warehouse, and line-level unit costs for the next replenishment run"
          />
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              createPurchase.mutate(buildPurchasePayload(purchaseForm));
            }}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="input"
                value={purchaseForm.supplier_id}
                onChange={(event) => setPurchaseForm({ ...purchaseForm, supplier_id: event.target.value })}
              >
                <option value="">Select supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <select
                className="input"
                value={purchaseForm.warehouse_id}
                onChange={(event) => setPurchaseForm({ ...purchaseForm, warehouse_id: event.target.value })}
              >
                <option value="">Select warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              {purchaseForm.items.map((item, index) => (
                <div key={`purchase-line-${index}`} className="rounded-2xl border border-slate-200 p-4">
                  <div className="grid gap-3 md:grid-cols-[1.3fr_0.6fr_0.6fr_auto]">
                    <select
                      className="input"
                      value={item.product_id}
                      onChange={(event) => setPurchaseForm({
                        ...purchaseForm,
                        items: updatePurchaseLine(purchaseForm.items, index, { product_id: event.target.value }),
                      })}
                    >
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    <input
                      className="input"
                      value={item.quantity_ordered}
                      onChange={(event) => setPurchaseForm({
                        ...purchaseForm,
                        items: updatePurchaseLine(purchaseForm.items, index, { quantity_ordered: event.target.value }),
                      })}
                      placeholder="Qty"
                    />
                    <input
                      className="input"
                      value={item.unit_cost}
                      onChange={(event) => setPurchaseForm({
                        ...purchaseForm,
                        items: updatePurchaseLine(purchaseForm.items, index, { unit_cost: event.target.value }),
                      })}
                      placeholder="Unit cost"
                    />
                    <button
                      type="button"
                      onClick={() => setPurchaseForm({
                        ...purchaseForm,
                        items: removePurchaseLine(purchaseForm.items, index),
                      })}
                      className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setPurchaseForm({ ...purchaseForm, items: appendPurchaseLine(purchaseForm.items) })}
                className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Add line
              </button>
              <input
                className="input max-w-[160px]"
                value={purchaseForm.discount}
                onChange={(event) => setPurchaseForm({ ...purchaseForm, discount: event.target.value })}
                placeholder="Discount"
              />
            </div>

            <textarea
              className="input min-h-[96px] resize-y py-3"
              value={purchaseForm.notes}
              onChange={(event) => setPurchaseForm({ ...purchaseForm, notes: event.target.value })}
              placeholder="Notes for receiving team or supplier follow-up"
            />

            <button type="submit" className="h-11 w-full rounded-xl bg-[var(--color-brand)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-brand-strong)]">
              {createPurchase.isPending ? 'Saving purchase...' : 'Save purchase order'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader
            title="Purchase Ledger"
            subtitle="Order status, goods received progress, and supplier payables in one running ledger"
          />
          <div className="space-y-4">
            {purchaseCards.map(({ purchase, card }) => {
              const receiveDraft = receiveDrafts[purchase.id] ?? createPurchaseReceiveDraft(purchase);
              const paymentDraft = paymentDrafts[purchase.id] ?? createPurchasePaymentDraft(purchase);

              return (
                <div key={card.id} className="rounded-3xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{card.title}</p>
                      <p className="text-sm text-slate-500">{card.supplierLabel}</p>
                      <p className="text-sm text-slate-500">{card.warehouseLabel}</p>
                    </div>
                    <div className="text-right">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                        card.statusTone === 'emerald'
                          ? 'bg-emerald-50 text-emerald-700'
                          : card.statusTone === 'sky'
                            ? 'bg-sky-50 text-sky-700'
                            : 'bg-amber-50 text-amber-700'
                      }`}>
                        {card.status}
                      </span>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{card.totalLabel}</p>
                      <p className="text-xs text-slate-500">{card.itemCountLabel}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Paid</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{card.paidLabel}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Outstanding</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{card.outstandingLabel}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Notes</p>
                      <p className="mt-1 text-sm text-slate-600">{purchase.notes || 'No notes captured'}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {purchase.items?.map((item) => {
                      const itemCard = buildPurchaseItemCard(item, formatCurrencyNGN);
                      const receiveLine = receiveDraft.items?.find((line) => line.purchase_item_id === item.id);

                      return (
                        <div key={itemCard.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                            <div>
                              <p className="font-medium text-slate-900">{itemCard.title}</p>
                              <p className="text-sm text-slate-500">{itemCard.quantityLabel}</p>
                              <p className="text-sm text-slate-500">{itemCard.amountLabel}</p>
                            </div>
                            <p className="text-sm font-semibold text-slate-700">Remaining: {itemCard.remainingQuantity}</p>
                            {receiveLine ? (
                              <input
                                className="input max-w-[140px]"
                                value={receiveLine.quantity_received}
                                onChange={(event) => setReceiveDrafts((current) => ({
                                  ...current,
                                  [purchase.id]: {
                                    ...receiveDraft,
                                    items: receiveDraft.items.map((line) => (
                                      line.purchase_item_id === item.id
                                        ? { ...line, quantity_received: event.target.value }
                                        : line
                                    )),
                                  },
                                }))}
                                placeholder="Receive qty"
                              />
                            ) : (
                              <p className="text-sm text-emerald-700">Fully received</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                    <input
                      className="input"
                      value={receiveDraft.notes}
                      onChange={(event) => setReceiveDrafts((current) => ({
                        ...current,
                        [purchase.id]: {
                          ...receiveDraft,
                          notes: event.target.value,
                        },
                      }))}
                      placeholder="Goods received note"
                    />
                    <button
                      type="button"
                      className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
                      onClick={() => receivePurchase.mutate({
                        purchaseId: purchase.id,
                        payload: buildPurchaseReceivePayload(receiveDraft),
                      })}
                      disabled={purchase.status === 'received' || receivePurchase.isPending}
                    >
                      {purchase.status === 'received' ? 'Received' : 'Post GRN'}
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-[0.7fr_0.7fr_0.8fr_auto]">
                    <input
                      className="input"
                      value={paymentDraft.amount}
                      onChange={(event) => setPaymentDrafts((current) => ({
                        ...current,
                        [purchase.id]: { ...paymentDraft, amount: event.target.value },
                      }))}
                      placeholder="Payment amount"
                    />
                    <select
                      className="input"
                      value={paymentDraft.payment_method}
                      onChange={(event) => setPaymentDrafts((current) => ({
                        ...current,
                        [purchase.id]: { ...paymentDraft, payment_method: event.target.value },
                      }))}
                    >
                      <option value="transfer">Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="pos">POS</option>
                    </select>
                    <input
                      className="input"
                      value={paymentDraft.reference}
                      onChange={(event) => setPaymentDrafts((current) => ({
                        ...current,
                        [purchase.id]: { ...paymentDraft, reference: event.target.value },
                      }))}
                      placeholder="Reference"
                    />
                    <button
                      type="button"
                      className="h-11 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
                      onClick={() => recordPayment.mutate({
                        purchaseId: purchase.id,
                        payload: buildPurchasePaymentPayload(paymentDraft),
                      })}
                      disabled={Number(paymentDraft.amount || 0) <= 0 || recordPayment.isPending}
                    >
                      Record payment
                    </button>
                  </div>

                  {purchase.payments?.length ? (
                    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recent payments</p>
                      <div className="mt-2 space-y-2">
                        {purchase.payments.slice(0, 3).map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between gap-3 text-sm">
                            <p className="text-slate-600">
                              {payment.payment_method} {payment.reference ? `- ${payment.reference}` : ''}
                            </p>
                            <p className="font-semibold text-slate-900">{formatCurrencyNGN(payment.amount || 0)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
            {purchaseCards.length === 0 ? (
              <p className="text-sm text-slate-500">No purchases have been raised yet for this workspace.</p>
            ) : null}
          </div>
        </Card>
      </section>
    </div>
  );
}
