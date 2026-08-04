import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Card, { CardHeader } from '../components/Card';
import OpsMetricCard from '../components/OpsMetricCard';
import { useBusinessType } from '../config';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import { getErrorDetails, getErrorMessage } from '../lib/apiFeedback';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import {
  addRetailCartItem,
  buildRetailDeskMetrics,
  buildRetailLoyaltyCard,
  canAddRetailCartItem,
  canUpdateRetailCartQuantity,
  buildRetailLoyaltyOptionLabel,
  buildRetailOverviewMetrics,
  buildRetailRecentOrderPresentation,
  buildRetailSalePayload,
  calculateRetailCartTotal,
  calculateRetailSplitTotal,
  createRetailSaleForm,
  filterRetailLoyaltyCustomers,
  filterRetailOrders,
  filterRetailProducts,
  getRetailProductStockMessage,
  getRetailProductStockState,
  updateRetailCartQuantity,
  updateRetailPaymentSplit,
  validateRetailCartAgainstStock,
} from '../lib/retail';

const paymentMethods = ['cash', 'transfer', 'card', 'wallet', 'credit'];
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

export default function RetailOps() {
  const { type } = useBusinessType();
  const queryClient = useQueryClient();
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [loyaltySearch, setLoyaltySearch] = useState('');
  const [openingFloat, setOpeningFloat] = useState('10000');
  const [actualCash, setActualCash] = useState('');
  const [loyaltyForm, setLoyaltyForm] = useState({ name: '', phone: '', tier: 'standard' });
  const [pettyCashForm, setPettyCashForm] = useState({ entry_type: 'spend', category: '', amount: '', notes: '' });
  const [saleForm, setSaleForm] = useState(createRetailSaleForm);
  const [refundReason, setRefundReason] = useState({});
  const { toast, setToast, clearToast } = useToast();

  const { data, error, refetch } = useQuery({
    queryKey: ['retail-desk'],
    queryFn: async () => {
      const [overviewRes, productRes] = await Promise.all([
        api.get('/retail/overview'),
        api.get('/products'),
      ]);

      return {
        overview: overviewRes.data,
        products: productRes.data.data || [],
      };
    },
    staleTime: 60000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['retail-desk'] });
  };

  const filteredProducts = useMemo(() => filterRetailProducts(data?.products || [], search), [data?.products, search]);
  const cartTotal = useMemo(() => calculateRetailCartTotal(cart), [cart]);
  const splitTotal = useMemo(() => calculateRetailSplitTotal(saleForm.payment_splits), [saleForm.payment_splits]);
  const overviewMetrics = useMemo(() => buildRetailOverviewMetrics(data?.overview?.summary, formatCurrency), [data?.overview?.summary]);
  const deskMetrics = useMemo(
    () => buildRetailDeskMetrics(data?.overview?.summary, data?.overview?.open_shift, data?.overview?.recent_orders || [], data?.overview?.loyalty_customers || [], formatCurrency),
    [data?.overview],
  );
  const recentOrderPresentations = useMemo(
    () => filterRetailOrders(data?.overview?.recent_orders || [], orderSearch).slice(0, 6).map((order) => buildRetailRecentOrderPresentation(order, formatCurrency)),
    [data?.overview?.recent_orders, orderSearch],
  );
  const loyaltyPresentations = useMemo(
    () => filterRetailLoyaltyCustomers(data?.overview?.loyalty_customers || [], loyaltySearch).slice(0, 6).map((profile) => buildRetailLoyaltyCard(profile)),
    [data?.overview?.loyalty_customers, loyaltySearch],
  );

  const createMutation = useMutation({
    mutationFn: async ({ endpoint, payload }) => api.post(endpoint, payload),
    onSuccess: refresh,
  });

  const runMutation = async ({ endpoint, payload, successMessage, reset }) => {
    clearToast();
    try {
      await createMutation.mutateAsync({ endpoint, payload });
      if (reset) {
        reset();
      }
      setToast({ tone: 'success', message: successMessage });
    } catch (mutationError) {
      const detail = getErrorDetails(mutationError, 'We could not complete that retail action right now.');
      setToast({ tone: 'error', message: detail });
    }
  };

  const addToCart = (product) => {
    if (!canAddRetailCartItem(cart, product)) {
      setToast({ tone: 'error', message: `${product.name}: ${getRetailProductStockMessage(product)}` });
      return;
    }

    setCart((current) => addRetailCartItem(current, product));
  };

  const updateCartQuantity = (productId, nextQuantity) => {
    const product = data?.products?.find((entry) => entry.id === productId);
    const { availableQuantity } = getRetailProductStockState(product || {});

    if (!canUpdateRetailCartQuantity(cart, productId, nextQuantity, availableQuantity)) {
      setToast({ tone: 'error', message: `${product?.name || 'This item'}: ${getRetailProductStockMessage(product || {})}` });
      return;
    }

    setCart((current) => updateRetailCartQuantity(current, productId, nextQuantity, availableQuantity));
  };

  const updateSplit = (index, field, value) => {
    setSaleForm((current) => ({
      ...current,
      payment_splits: updateRetailPaymentSplit(current.payment_splits, index, field, value),
    }));
  };

  const submitShiftOpen = async () => {
    await runMutation({
      endpoint: '/retail/shifts/open',
      payload: { opening_float: Number(openingFloat || 0) },
      successMessage: 'Cashier shift opened and till float recorded.',
    });
  };

  const submitShiftClose = async () => {
    if (!data?.overview?.open_shift) return;

    await runMutation({
      endpoint: `/retail/shifts/${data.overview.open_shift.id}/close`,
      payload: { actual_cash: Number(actualCash || 0) },
      successMessage: 'Cashier shift closed and variance refreshed.',
      reset: () => setActualCash(''),
    });
  };

  const registerLoyalty = async (event) => {
    event.preventDefault();
    await runMutation({
      endpoint: '/retail/loyalty-customers',
      payload: loyaltyForm,
      successMessage: 'Loyalty customer saved into the repeat-shopper desk.',
      reset: () => setLoyaltyForm({ name: '', phone: '', tier: 'standard' }),
    });
  };

  const recordPettyCash = async (event) => {
    event.preventDefault();
    await runMutation({
      endpoint: '/retail/petty-cash',
      payload: {
        ...pettyCashForm,
        amount: Number(pettyCashForm.amount || 0),
        shift_id: data?.overview?.open_shift?.id || null,
      },
      successMessage: 'Petty cash entry recorded on the counter desk.',
      reset: () => setPettyCashForm({ entry_type: 'spend', category: '', amount: '', notes: '' }),
    });
  };

  const processSale = async () => {
    if (!cart.length || splitTotal < cartTotal) return;

    const stockIssues = validateRetailCartAgainstStock(cart, data?.products || []);
    if (stockIssues.length > 0) {
      setToast({ tone: 'error', message: stockIssues[0].message });
      return;
    }

    await runMutation({
      endpoint: '/retail/sales',
      payload: buildRetailSalePayload(saleForm, cart, cartTotal, splitTotal),
      successMessage: 'Retail sale completed and recent orders refreshed.',
      reset: () => {
        setCart([]);
        setSaleForm(createRetailSaleForm());
      },
    });
  };

  const processRefund = async (orderId) => {
    const reason = refundReason[orderId];
    if (!reason) return;

    await runMutation({
      endpoint: `/retail/orders/${orderId}/refund`,
      payload: { reason },
      successMessage: 'Refund processed and margin watch updated.',
      reset: () => setRefundReason((current) => ({ ...current, [orderId]: '' })),
    });
  };

  return (
    <div className="space-y-5">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Retail operations feedback" />

      <PageHero
        eyebrow={type === 'supermarket' ? 'Supermarket Control' : 'Retail Control'}
        title="Cashier discipline, margin protection, and faster checkout."
        description="Run barcode-led selling, loyalty, petty cash, and refund controls from one premium counter view."
      />

      {error ? (
        <QueryErrorPanel
          message={getErrorMessage(error, 'We could not load retail operations right now.')}
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Retail Counter</h2>
                <p className="text-sm text-slate-500">Search by product name or barcode and collect split payments safely.</p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {data?.overview?.open_shift ? 'Shift Open' : 'Shift Closed'}
              </div>
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products or scan barcode"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-0 transition focus:border-violet-400"
            />

            <div className="mt-4 grid max-h-[22rem] grid-cols-2 gap-3 overflow-auto lg:grid-cols-3">
              {filteredProducts.map((product) => {
                const stockState = getRetailProductStockState(product);
                const stockLabel = stockState.isOutOfStock
                  ? 'Out of stock'
                  : stockState.isLowStock
                    ? 'Low stock'
                    : stockState.availableQuantity === Number.POSITIVE_INFINITY
                      ? 'In stock'
                      : `${stockState.availableQuantity.toLocaleString()} in stock`;

                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={stockState.isOutOfStock}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{product.barcode || 'No barcode yet'}</p>
                    <p className="mt-3 text-lg font-semibold text-violet-700">{formatCurrency(product.selling_price)}</p>
                    <p className="mt-2 text-xs text-slate-500">{stockLabel}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Cart</h3>
                  <button onClick={() => setCart([])} className="text-sm text-slate-500">Clear</button>
                </div>

                <div className="space-y-3">
                  {cart.map((item) => {
                    const cartProduct = (data?.products || []).find((product) => product.id === item.product_id);
                    const remainingMessage = cartProduct ? getRetailProductStockMessage(cartProduct) : null;

                    return (
                      <div key={item.product_id} className="flex items-center gap-3 rounded-2xl bg-white p-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">{formatCurrency(item.unit_price)}</p>
                          {remainingMessage ? <p className="text-xs text-slate-400">{remainingMessage}</p> : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)} className="h-8 w-8 rounded-xl border border-slate-200">-</button>
                          <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)} className="h-8 w-8 rounded-xl border border-slate-200">+</button>
                        </div>
                        <div className="text-sm font-semibold text-slate-900">{formatCurrency(item.total)}</div>
                      </div>
                    );
                  })}
                  {!cart.length ? <p className="text-sm text-slate-500">No items in the cart yet.</p> : null}
                </div>
              </div>

              <div className="rounded-3xl border border-violet-100 bg-violet-50/70 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-900">Checkout</h3>
                <div className="mt-3 space-y-3">
                  <select
                    value={saleForm.loyalty_profile_id}
                    onChange={(event) => setSaleForm((current) => ({ ...current, loyalty_profile_id: event.target.value }))}
                    className="w-full rounded-2xl border border-violet-200 bg-white px-3 py-3 text-sm"
                  >
                    <option value="">No loyalty customer</option>
                    {(data?.overview?.loyalty_customers || []).map((profile) => (
                      <option key={profile.id} value={profile.id}>{buildRetailLoyaltyOptionLabel(profile)}</option>
                    ))}
                  </select>

                  {saleForm.payment_splits.map((split, index) => (
                    <div key={`${split.payment_method}-${index}`} className="grid grid-cols-[1fr_1fr] gap-2">
                      <select
                        value={split.payment_method}
                        onChange={(event) => updateSplit(index, 'payment_method', event.target.value)}
                        className="rounded-2xl border border-violet-200 bg-white px-3 py-3 text-sm"
                      >
                        {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
                      </select>
                      <input
                        value={split.amount}
                        onChange={(event) => updateSplit(index, 'amount', event.target.value)}
                        placeholder="Amount"
                        type="number"
                        className="rounded-2xl border border-violet-200 bg-white px-3 py-3 text-sm"
                      />
                    </div>
                  ))}

                  <textarea
                    value={saleForm.notes}
                    onChange={(event) => setSaleForm((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Sale note"
                    className="h-24 w-full rounded-2xl border border-violet-200 bg-white px-3 py-3 text-sm"
                  />

                  <ResponsiveCardGrid variant="default" className="sm:grid-cols-2">
                    <OpsMetricCard label="Total" value={formatCurrency(cartTotal)} tone="slate" />
                    <OpsMetricCard label="Collected" value={formatCurrency(splitTotal)} tone="violet" />
                  </ResponsiveCardGrid>

                  <button
                    onClick={processSale}
                    disabled={createMutation.isPending || !cart.length || splitTotal < cartTotal}
                    className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Complete Sale
                  </button>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Recent Sales and Refunds</h2>
                <p className="text-sm text-slate-500">Keep returns controlled and visible to reduce silent leakage.</p>
              </div>
            </div>
            <input
              value={orderSearch}
              onChange={(event) => setOrderSearch(event.target.value)}
              placeholder="Search order no, customer, cashier, method, or notes"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-0 transition focus:border-violet-400"
            />

            <div className="mt-4 space-y-4">
              {recentOrderPresentations.map((order) => (
                <div key={order.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{order.orderNumber}</p>
                      <p className="text-xs text-slate-500">{order.customerLabel}</p>
                      <p className="text-xs text-slate-500">{order.cashierLabel} | {order.statusLabel}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{order.paymentMethodLabel}</div>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{order.totalLabel}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={refundReason[order.id] || ''}
                      onChange={(event) => setRefundReason((current) => ({ ...current, [order.id]: event.target.value }))}
                      placeholder="Refund reason"
                      className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => processRefund(order.id)}
                      className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Refund
                    </button>
                  </div>
                </div>
              ))}
              {!recentOrderPresentations.length ? <p className="text-sm text-slate-500">No recent orders matched the current search.</p> : null}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Cashier Shift</h2>
            <p className="mt-1 text-sm text-slate-500">Open and close tills with clear cash variance visibility.</p>

            {!data?.overview?.open_shift ? (
              <div className="mt-4 space-y-3">
                <input
                  value={openingFloat}
                  onChange={(event) => setOpeningFloat(event.target.value)}
                  placeholder="Opening float"
                  type="number"
                  className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm"
                />
                <button onClick={submitShiftOpen} disabled={createMutation.isPending} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                  Save shift opening
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <OpsMetricCard
                  label={data.overview.open_shift.shift_code}
                  value={formatCurrency(data.overview.open_shift.opening_float)}
                  helper="Opening float for the active cashier shift"
                  tone="emerald"
                />
                <input
                  value={actualCash}
                  onChange={(event) => setActualCash(event.target.value)}
                  placeholder="Actual cash at close"
                  type="number"
                  className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm"
                />
                <button onClick={submitShiftClose} disabled={createMutation.isPending} className="w-full rounded-2xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white">
                  Close Shift
                </button>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Loyalty Customers</h2>
            <form className="mt-4 space-y-3" onSubmit={registerLoyalty}>
              <input value={loyaltyForm.name} onChange={(event) => setLoyaltyForm((current) => ({ ...current, name: event.target.value }))} placeholder="Customer name" className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm" />
              <input value={loyaltyForm.phone} onChange={(event) => setLoyaltyForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone number" className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm" />
              <select value={loyaltyForm.tier} onChange={(event) => setLoyaltyForm((current) => ({ ...current, tier: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm">
                <option value="standard">standard</option>
                <option value="silver">silver</option>
                <option value="gold">gold</option>
              </select>
              <button disabled={createMutation.isPending} className="w-full rounded-2xl bg-fuchsia-600 px-4 py-3 text-sm font-semibold text-white">
                Save loyalty customer
              </button>
            </form>
            <div className="mt-4 border-t border-slate-200 pt-4">
              <input
                value={loyaltySearch}
                onChange={(event) => setLoyaltySearch(event.target.value)}
                placeholder="Search loyalty customer, phone, or tier"
                className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm"
              />
              <div className="mt-3 space-y-2">
                {loyaltyPresentations.map((profile) => (
                  <div key={profile.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="font-medium text-slate-900">{profile.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{profile.meta}</p>
                  </div>
                ))}
                {!loyaltyPresentations.length ? <p className="text-sm text-slate-500">No loyalty customers matched the current search.</p> : null}
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-slate-900">Petty Cash</h2>
            <form className="mt-4 space-y-3" onSubmit={recordPettyCash}>
              <select value={pettyCashForm.entry_type} onChange={(event) => setPettyCashForm((current) => ({ ...current, entry_type: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm">
                <option value="spend">spend</option>
                <option value="funding">funding</option>
              </select>
              <input value={pettyCashForm.category} onChange={(event) => setPettyCashForm((current) => ({ ...current, category: event.target.value }))} placeholder="Category" className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm" />
              <input value={pettyCashForm.amount} onChange={(event) => setPettyCashForm((current) => ({ ...current, amount: event.target.value }))} placeholder="Amount" type="number" className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm" />
              <textarea value={pettyCashForm.notes} onChange={(event) => setPettyCashForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Notes" className="h-24 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm" />
              <button disabled={createMutation.isPending} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                Save petty cash entry
              </button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
