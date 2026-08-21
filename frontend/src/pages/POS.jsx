import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import Button from '../components/Button';
import Card, { CardHeader } from '../components/Card';
import EmptyState from '../components/EmptyState';
import OpsMetricCard from '../components/OpsMetricCard';
import { PageShell, ResponsiveCardGrid } from '../components/PageShell';
import PageHero from '../components/PageHero';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/apiFeedback';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import { useBusinessType } from '../config';
import RestaurantPOS from './RestaurantPOS';
import BuildingMaterialsOps from './BuildingMaterialsOps';
import CommodityOps from './CommodityOps';
import WarehouseOps from './WarehouseOps';
import PureWaterRetailOps from './PureWaterRetailOps';
import RetailOps from './RetailOps';
import SMEOps from './SMEOps';
import WholesaleOps from './WholesaleOps';
import {
  addRetailCartItem,
  buildRetailSalePayload,
  calculateRetailCartTotal,
  canAddRetailCartItem,
  canUpdateRetailCartQuantity,
  filterRetailProducts,
  getRetailProductStockMessage,
  getRetailProductStockState,
  updateRetailCartQuantity,
  validateRetailCartAgainstStock,
} from '../lib/retail';

const paymentMethods = [
  { id: 'cash', label: 'Cash' },
  { id: 'transfer', label: 'Transfer' },
  { id: 'card', label: 'Card' },
];

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

export default function POS() {
  const { hasActiveType } = useBusinessType();
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');
  const searchRef = useRef(null);
  const { toast, setToast, clearToast } = useToast();

  const posQuery = useQuery({
    queryKey: ['pos-desk'],
    queryFn: async () => {
      const [productResponse, customerResponse] = await Promise.all([
        api.get('/products'),
        api.get('/customers'),
      ]);

      return {
        products: productResponse.data?.data || [],
        customers: customerResponse.data?.data || customerResponse.data || [],
      };
    },
  });

  const saleMutation = useMutation({
    mutationFn: async (payload) => api.post('/orders', payload),
    onSuccess: (response) => {
      if (response?.data?.approval_pending) {
        setToast({
          tone: 'error',
          message: response.data.message || 'This discount exceeds the approval threshold. The sale is pending review before it completes - do not hand over the goods yet.',
        });
        return;
      }

      setToast({
        tone: 'success',
        message: 'Sale completed successfully.',
      });
      setCart([]);
      setCustomerId('');
      setAmountPaid('');
      setNotes('');
    },
    onError: (error) => {
      setToast({
        tone: 'error',
        message: getErrorMessage(error, 'We could not complete that sale right now.'),
      });
    },
  });

  useEffect(() => {
    if (searchRef.current) {
      searchRef.current.focus();
    }
  }, []);

  const products = posQuery.data?.products || [];
  const customers = posQuery.data?.customers || [];
  const filteredProducts = useMemo(() => filterRetailProducts(products, search), [products, search]);
  const cartTotal = useMemo(() => calculateRetailCartTotal(cart), [cart]);
  const amountReceived = Number(amountPaid || 0);
  const change = amountReceived - cartTotal;
  const isPaid = amountReceived >= cartTotal && cartTotal > 0;
  const selectedCustomer = useMemo(
    () => customers.find((customer) => String(customer.id) === String(customerId)) || null,
    [customerId, customers],
  );

  const addToCart = (product) => {
    const { isOutOfStock } = getRetailProductStockState(product);

    if (isOutOfStock) {
      setToast({
        tone: 'error',
        message: `${product.name} is out of stock.`,
      });
      return;
    }

    if (!canAddRetailCartItem(cart, product)) {
      setToast({
        tone: 'error',
        message: `${product.name}: ${getRetailProductStockMessage(product)}`,
      });
      return;
    }

    setCart((currentCart) => addRetailCartItem(currentCart, product));
  };

  const removeFromCart = (productId) => {
    setCart((currentCart) => currentCart.filter((item) => item.product_id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    const product = products.find((item) => item.id === productId);
    const { availableQuantity } = getRetailProductStockState(product || {});

    if (!canUpdateRetailCartQuantity(cart, productId, quantity, availableQuantity)) {
      setToast({
        tone: 'error',
        message: `${product?.name || 'This item'}: ${getRetailProductStockMessage(product || {})}`,
      });
      return;
    }

    setCart((currentCart) => updateRetailCartQuantity(currentCart, productId, quantity, availableQuantity));
  };

  const processSale = async () => {
    if (cart.length === 0 || !isPaid || saleMutation.isPending) {
      return;
    }

    const stockIssues = validateRetailCartAgainstStock(cart, products);
    if (stockIssues.length > 0) {
      setToast({
        tone: 'error',
        message: stockIssues[0].message,
      });
      return;
    }

    clearToast();
    const payload = buildRetailSalePayload(
      {
        customer_id: customerId,
        payment_splits: [
          {
            payment_method: paymentMethod,
            amount: String(amountReceived),
            reference: '',
          },
        ],
        notes,
      },
      cart,
      cartTotal,
      amountReceived,
    );

    await saleMutation.mutateAsync(payload);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setCart([]);
      setAmountPaid('');
      setNotes('');
      setCustomerId('');
    }
  };

  if (hasActiveType('construction')) {
    return <BuildingMaterialsOps />;
  }

  if (hasActiveType('commodity')) {
    return <CommodityOps />;
  }

  if (hasActiveType('warehouse')) {
    return <WarehouseOps />;
  }

  if (hasActiveType('restaurant')) {
    return <RestaurantPOS />;
  }

  if (hasActiveType('retail') || hasActiveType('supermarket')) {
    return <RetailOps />;
  }

  if (hasActiveType('wholesale')) {
    return <WholesaleOps />;
  }

  if (hasActiveType('pure_water_retail')) {
    return <PureWaterRetailOps />;
  }

  if (hasActiveType('mixed') || hasActiveType('general')) {
    return <SMEOps />;
  }

  return (
    <PageShell width="wide" className="page-stack" onKeyDown={handleKeyDown}>
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="POS feedback" />
      <PageHero
        eyebrow="Checkout Desk"
        title="Point of Sale"
        description="Fast search, clean checkout, and payment capture for walk-in transactions and daily front-desk sales."
        actions={(
          <ResponsiveCardGrid variant="default" className="xl:grid-cols-2">
            <OpsMetricCard
              label="Cart Items"
              value={cart.length.toLocaleString()}
              helper="Products currently queued for checkout."
              tone="sky"
            />
            <OpsMetricCard
              label="Current Total"
              value={formatCurrencyNGN(cartTotal)}
              helper={selectedCustomer ? `Customer: ${selectedCustomer.name}` : 'Walk-in sale in progress.'}
              tone="violet"
            />
          </ResponsiveCardGrid>
        )}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.22fr)_minmax(360px,0.78fr)]">
        <Card className="overflow-hidden">
          <QueryErrorPanel
            message={posQuery.isError ? getErrorMessage(posQuery.error, 'We could not load checkout products right now. Please try again.') : ''}
            onRetry={() => {
              void posQuery.refetch();
            }}
          />
          <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-5">
            <CardHeader
              title="Product Shelf"
              subtitle="Search active products and tap to add them into the current sale."
              className="mb-0"
            />
            <div className="relative mt-4">
              <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search products by name or barcode..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-base text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="max-h-[calc(100vh-22rem)] overflow-auto p-5">
            {posQuery.isLoading ? (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 12 }).map((_, index) => (
                  <div key={index} className="h-40 skeleton rounded-3xl" />
                ))}
              </div>
            ) : null}

            {!posQuery.isLoading && filteredProducts.length === 0 ? (
              <EmptyState
                icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                title="No products found"
                description="Try another search term or stock the product first."
                className="py-16"
              />
            ) : null}

            {!posQuery.isLoading && filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-4">
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
                      type="button"
                      onClick={() => addToCart(product)}
                      className="group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl"
                    >
                      <div className="mb-4 flex h-16 w-full items-center justify-center rounded-2xl bg-slate-100">
                        <svg className="h-8 w-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <p className="min-h-[2.5rem] text-sm font-semibold text-slate-900 line-clamp-2">{product.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{product.barcode || 'No barcode'}</p>
                      <p className="mt-2 text-lg font-bold text-indigo-600">{formatCurrencyNGN(product.selling_price)}</p>
                      <p className="mt-2 text-xs text-slate-500">{stockLabel}</p>
                      <p className="mt-2 text-xs text-slate-500">Tap to add to the current sale</p>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-5">
            <CardHeader
              title="Current Sale"
              subtitle={`${cart.length} item${cart.length === 1 ? '' : 's'} currently in the basket`}
              action={(
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-sm font-semibold text-slate-500 transition hover:text-slate-900"
                >
                  Clear all
                </button>
              )}
              className="mb-0"
            />
          </div>

          <div className="flex max-h-[calc(100vh-22rem)] flex-col">
            <div className="flex-1 overflow-auto p-4">
              {cart.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100">
                    <svg className="h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.19 1.732.707 1.732H17m0 0a2 2 0 002-2V5a2 2 0 00-2-2H7.859" />
                    </svg>
                  </div>
                  <p className="font-semibold text-slate-900">Cart is empty</p>
                  <p className="mt-1 text-sm text-slate-500">Select products from the shelf to begin checkout.</p>
                </div>
              ) : null}

              {cart.length > 0 ? (
                <div className="space-y-3">
                  {cart.map((item) => {
                    const cartProduct = products.find((product) => product.id === item.product_id);
                    const remainingMessage = cartProduct ? getRetailProductStockMessage(cartProduct) : null;

                    return (
                      <div key={item.product_id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-slate-900">{item.name}</p>
                            <p className="mt-1 text-sm text-slate-500">{formatCurrencyNGN(item.unit_price)} each</p>
                            {remainingMessage ? <p className="mt-1 text-xs text-slate-400">{remainingMessage}</p> : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product_id)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-500 transition hover:bg-rose-100"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-bold text-slate-600 transition hover:bg-slate-50"
                            >
                              -
                            </button>
                            <span className="w-10 text-center text-lg font-bold text-slate-900">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-bold text-slate-600 transition hover:bg-slate-50"
                            >
                              +
                            </button>
                          </div>
                          <p className="text-right text-lg font-bold text-slate-900">{formatCurrencyNGN(item.total)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="border-t border-slate-200 bg-slate-50/70 p-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-slate-600">Total</span>
                  <span className="text-[clamp(1.75rem,0.8vw+1.3rem,2.2rem)] font-bold text-indigo-600">{formatCurrencyNGN(cartTotal)}</span>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-600">Customer</label>
                  <select
                    value={customerId}
                    onChange={(event) => setCustomerId(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  >
                    <option value="">Walk-in customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-600">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                          paymentMethod === method.id
                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-600">Amount Received</label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(event) => setAmountPaid(event.target.value)}
                    className="input h-12 px-4 text-lg font-bold text-slate-900"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-600">Sale Note</label>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                    placeholder="Optional note for this checkout"
                    rows={3}
                  />
                </div>

                {change > 0 ? (
                  <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                    <span className="font-semibold text-emerald-700">Change Due</span>
                    <span className="text-xl font-bold text-emerald-700">{formatCurrencyNGN(change)}</span>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    void processSale();
                  }}
                  disabled={cart.length === 0 || !isPaid || saleMutation.isPending}
                  className={`inline-flex w-full items-center justify-center rounded-2xl px-5 py-5 text-lg font-bold transition ${
                    cart.length > 0 && isPaid && !saleMutation.isPending
                      ? 'bg-[var(--color-brand)] text-white shadow-xl shadow-indigo-500/20 hover:-translate-y-0.5 hover:bg-[var(--color-brand-strong)]'
                      : 'cursor-not-allowed bg-slate-200 text-slate-400'
                  }`}
                >
                  {saleMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing sale...
                    </span>
                  ) : (
                    `Complete Sale - ${formatCurrencyNGN(cartTotal)}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
