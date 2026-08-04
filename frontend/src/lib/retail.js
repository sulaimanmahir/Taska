import { formatCurrencyNGN } from './financeFormatters.js';

const defaultPaymentSplits = [
  { payment_method: 'cash', amount: '', reference: '' },
  { payment_method: 'transfer', amount: '', reference: '' },
];

export function createRetailPaymentSplits() {
  return defaultPaymentSplits.map((split) => ({ ...split }));
}

export function filterRetailProducts(products = [], search = '') {
  const term = String(search || '').toLowerCase();

  return products.filter((product) =>
    product.name?.toLowerCase().includes(term) || product.barcode?.toLowerCase().includes(term),
  );
}

export function filterRetailOrders(orders = [], search = '') {
  const term = String(search || '').toLowerCase();

  if (!term) {
    return orders;
  }

  return orders.filter((order) =>
    [
      order.order_number,
      order.customer?.name,
      order.payment_method,
      order.cashier_name,
      order.notes,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(term),
  );
}

export function filterRetailLoyaltyCustomers(customers = [], search = '') {
  const term = String(search || '').toLowerCase();

  if (!term) {
    return customers;
  }

  return customers.filter((profile) =>
    [
      profile.customer?.name,
      profile.phone,
      profile.tier,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(term),
  );
}

export function calculateRetailCartTotal(cart = []) {
  return cart.reduce((sum, item) => sum + Number(item.total || 0), 0);
}

export function calculateRetailSplitTotal(paymentSplits = []) {
  return paymentSplits.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
}

export function getRetailProductStockState(product = {}) {
  const explicitAvailableQuantity = product?.available_quantity ?? product?.availableQuantity;
  const availableQuantity = explicitAvailableQuantity === null || explicitAvailableQuantity === undefined
    ? Number.POSITIVE_INFINITY
    : Number(explicitAvailableQuantity);
  const lowStockAlert = Number(product?.low_stock_alert ?? 0);
  const requestedStockStatus = product?.stock_status ?? product?.stockStatus;
  const stockStatus = requestedStockStatus
    || (availableQuantity <= 0 ? 'out_of_stock' : (lowStockAlert > 0 && availableQuantity <= lowStockAlert ? 'low_stock' : 'in_stock'));

  return {
    availableQuantity,
    stockStatus,
    isLowStock: stockStatus === 'low_stock',
    isOutOfStock: stockStatus === 'out_of_stock' || availableQuantity <= 0,
  };
}

export function getRetailProductStockMessage(product = {}) {
  const { availableQuantity, isLowStock, isOutOfStock } = getRetailProductStockState(product || {});

  if (isOutOfStock) {
    return 'Out of stock';
  }

  if (isLowStock) {
    return `Only ${Math.max(0, Math.floor(availableQuantity))} left in stock`;
  }

  if (Number.isFinite(availableQuantity)) {
    return 'In stock';
  }

  return 'In stock';
}

export function canAddRetailCartItem(cart = [], product = {}) {
  const { availableQuantity, isOutOfStock } = getRetailProductStockState(product || {});
  const existing = cart.find((item) => item.product_id === product?.id);
  const nextQuantity = (existing?.quantity || 0) + 1;

  if (isOutOfStock) {
    return false;
  }

  if (Number.isFinite(availableQuantity) && nextQuantity > availableQuantity) {
    return false;
  }

  return true;
}

export function canUpdateRetailCartQuantity(cart = [], productId, nextQuantity, availableQuantity = Infinity) {
  const item = cart.find((entry) => entry.product_id === productId);
  if (!item) {
    return true;
  }

  const normalizedAvailableQuantity = Number.isFinite(availableQuantity) ? availableQuantity : Infinity;
  if (normalizedAvailableQuantity !== Infinity && nextQuantity > normalizedAvailableQuantity) {
    return false;
  }

  return true;
}

export function addRetailCartItem(cart = [], product) {
  if (!canAddRetailCartItem(cart, product)) {
    return cart;
  }

  const existing = cart.find((item) => item.product_id === product?.id);

  if (existing) {
    const nextQuantity = existing.quantity + 1;

    return cart.map((item) =>
      item.product_id === product?.id
        ? { ...item, quantity: nextQuantity, total: nextQuantity * item.unit_price }
        : item,
    );
  }

  return [
    ...cart,
    {
      product_id: product?.id,
      name: product?.name,
      barcode: product?.barcode,
      quantity: 1,
      unit_price: Number(product?.selling_price),
      total: Number(product?.selling_price),
    },
  ];
}

export function updateRetailCartQuantity(cart = [], productId, nextQuantity, availableQuantity = Infinity) {
  if (nextQuantity <= 0) {
    return cart.filter((item) => item.product_id !== productId);
  }

  if (!canUpdateRetailCartQuantity(cart, productId, nextQuantity, availableQuantity)) {
    return cart;
  }

  return cart.map((item) =>
    item.product_id === productId
      ? { ...item, quantity: nextQuantity, total: nextQuantity * item.unit_price }
      : item,
  );
}

export function validateRetailCartAgainstStock(cart = [], products = []) {
  return cart.reduce((issues, item) => {
    const product = products.find((entry) => entry.id === item.product_id);
    const { availableQuantity } = getRetailProductStockState(product || {});

    if (Number.isFinite(availableQuantity) && item.quantity > availableQuantity) {
      issues.push({
        productId: item.product_id,
        name: item.name,
        message: `${item.name}: ${getRetailProductStockMessage(product || {})}`,
      });
    }

    return issues;
  }, []);
}

export function updateRetailPaymentSplit(paymentSplits = [], index, field, value) {
  return paymentSplits.map((split, splitIndex) =>
    splitIndex === index ? { ...split, [field]: value } : split,
  );
}

export function buildRetailOverviewMetrics(summary = {}, formatCurrency = formatCurrencyNGN) {
  return [
    { label: 'Today Sales', value: formatCurrency(summary?.today_sales), tone: 'violet' },
    { label: 'Cash Balance', value: formatCurrency(summary?.cash_balance), tone: 'sky' },
    { label: 'Debtors', value: formatCurrency(summary?.debtors), tone: 'amber' },
    { label: 'Stock Alerts', value: summary?.stock_alerts || 0, tone: 'rose' },
  ];
}

export function buildRetailDeskMetrics(summary = {}, openShift = null, orders = [], loyaltyCustomers = [], formatCurrency = formatCurrencyNGN) {
  const refundCount = orders.filter((order) => order.refunded_at || order.status === 'refunded').length;
  const creditOrders = orders.filter((order) => order.payment_method === 'credit').length;

  return [
    {
      label: 'Orders Today',
      value: orders.length,
      helper: 'Recent retail orders already flowing through the counter and refund desk.',
      tone: 'sky',
    },
    {
      label: 'Credit Tickets',
      value: creditOrders,
      helper: 'Orders currently leaning on credit instead of immediate settlement.',
      tone: 'amber',
    },
    {
      label: 'Refund Pressure',
      value: refundCount,
      helper: 'Refunded or reversed orders that need attention for margin protection.',
      tone: 'rose',
    },
    {
      label: 'Loyalty Base',
      value: loyaltyCustomers.length,
      helper: 'Named loyalty shoppers already attached to repeat checkout flow.',
      tone: 'fuchsia',
    },
    {
      label: 'Open Float',
      value: formatCurrency(openShift?.opening_float || 0),
      helper: 'Active cashier float currently sitting in the till.',
      tone: 'emerald',
    },
    {
      label: 'Net Counter Flow',
      value: formatCurrency(summary?.today_sales || 0),
      helper: 'Same-day sales value currently driving the retail desk.',
      tone: 'teal',
    },
  ];
}

export function buildRetailSalePayload(saleForm = {}, cart = [], cartTotal = 0, splitTotal = 0) {
  const activeSplits = (saleForm.payment_splits || []).filter((split) => Number(split.amount) > 0);

  return {
    customer_id: saleForm.customer_id || null,
    loyalty_profile_id: saleForm.loyalty_profile_id || null,
    items: cart.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
    })),
    subtotal: cartTotal,
    total: cartTotal,
    paid: splitTotal,
    change: Math.max(splitTotal - cartTotal, 0),
    payment_splits: activeSplits,
    payment_method: activeSplits.find((split) => Number(split.amount) > 0)?.payment_method || 'cash',
    notes: saleForm.notes || null,
  };
}

export function createRetailSaleForm() {
  return {
    customer_id: '',
    loyalty_profile_id: '',
    payment_splits: createRetailPaymentSplits(),
    notes: '',
  };
}

export function buildRetailRecentOrderPresentation(order, formatCurrency = formatCurrencyNGN) {
  return {
    id: order?.id,
    orderNumber: order?.order_number || 'Order',
    customerLabel: `${order?.customer?.name || 'Walk-in customer'} - ${formatCurrency(order?.total || 0)}`,
    paymentMethodLabel: order?.payment_method || 'cash',
    totalLabel: formatCurrency(order?.total || 0),
    cashierLabel: order?.cashier_name || 'Cashier pending',
    statusLabel: order?.status || 'completed',
  };
}

export function buildRetailLoyaltyOptionLabel(profile) {
  return `${profile?.customer?.name || profile?.phone} - ${profile?.tier}`;
}

export function buildRetailLoyaltyCard(profile) {
  return {
    id: profile?.id,
    title: profile?.customer?.name || profile?.phone || 'Loyalty customer',
    meta: `${profile?.phone || 'No phone'} | ${profile?.tier || 'standard'}`,
  };
}
