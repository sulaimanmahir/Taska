import { formatCurrencyNGN } from './financeFormatters.js';

export function createWholesaleRepForm() {
  return { name: '', phone: '', territory: '', target_amount: '' };
}

export function createWholesaleTierForm() {
  return { customer_id: '', product_id: '', tier_name: '', minimum_quantity: '', unit_price: '' };
}

export function createWholesaleRouteForm() {
  return {
    sales_rep_id: '',
    route_name: '',
    route_date: '',
    vehicle_reference: '',
    target_amount: '',
    stop_name: '',
    customer_id: '',
    expected_amount: '',
  };
}

export function createWholesaleOrderForm() {
  return {
    customer_id: '',
    route_run_id: '',
    stop_name: '',
    product_id: '',
    quantity: '',
    paid: '',
    payment_method: 'transfer',
    notes: '',
  };
}

export function createWholesaleTransferForm() {
  return { from_warehouse_id: '', to_warehouse_id: '', product_id: '', quantity: '', notes: '' };
}

export function buildWholesaleOverviewMetrics(summary = {}, formatCurrency = formatCurrencyNGN) {
  return [
    { label: 'Route Runs Today', value: summary?.route_runs_today || 0, tone: 'indigo' },
    { label: 'Active Reps', value: summary?.active_reps || 0, tone: 'sky' },
    { label: 'Bulk Orders Today', value: summary?.bulk_orders_today || 0, tone: 'violet' },
    { label: 'Route Collections', value: formatCurrency(summary?.route_collections_today || 0), tone: 'emerald' },
    { label: 'Customer Debt', value: formatCurrency(summary?.customer_debt || 0), tone: 'amber' },
    { label: 'Depot Transfers', value: summary?.stock_transfers_today || 0, tone: 'teal' },
  ];
}

export function buildWholesaleDeskMetrics(overview = {}, formatCurrency = formatCurrencyNGN) {
  const routeRuns = Array.isArray(overview?.route_runs) ? overview.route_runs : [];
  const salesReps = Array.isArray(overview?.sales_reps) ? overview.sales_reps : [];
  const debtors = Array.isArray(overview?.debtors) ? overview.debtors : [];
  const overdueRoutes = routeRuns.filter((routeRun) => routeRun?.status && routeRun.status !== 'completed').length;
  const assignedRoutes = routeRuns.filter((routeRun) => routeRun?.sales_rep?.name).length;
  const debtExposure = debtors.reduce((total, debtor) => total + Number(debtor?.balance || debtor?.outstanding_balance || 0), 0);

  return [
    { label: 'Live Route Runs', value: routeRuns.length, tone: 'indigo' },
    { label: 'Assigned Runs', value: assignedRoutes, tone: 'sky' },
    { label: 'Reps On Desk', value: salesReps.length, tone: 'violet' },
    { label: 'Outstanding Routes', value: overdueRoutes, tone: overdueRoutes > 0 ? 'amber' : 'emerald' },
    { label: 'Debtor Accounts', value: debtors.length, tone: debtors.length > 0 ? 'amber' : 'emerald' },
    { label: 'Debt Exposure', value: formatCurrency(debtExposure), tone: debtExposure > 0 ? 'rose' : 'emerald' },
  ];
}

export function findWholesaleSelectedProduct(products = [], productId = '') {
  return products.find((product) => String(product.id) === String(productId)) || null;
}

export function buildWholesalePriceSourceLabel(selectedProduct) {
  return `Price source: ${selectedProduct ? selectedProduct.name : 'Pick product'} and active tier if matched`;
}

export function buildWholesaleSalesRepPayload(repForm = {}) {
  return {
    ...repForm,
    target_amount: Number(repForm.target_amount || 0),
  };
}

export function buildWholesalePriceTierPayload(tierForm = {}) {
  return {
    ...tierForm,
    customer_id: tierForm.customer_id || null,
    minimum_quantity: Number(tierForm.minimum_quantity || 0),
    unit_price: Number(tierForm.unit_price || 0),
  };
}

export function buildWholesaleRouteRunPayload(routeForm = {}) {
  const firstStop = routeForm.stop_name
    ? [{
      customer_id: routeForm.customer_id || null,
      stop_name: routeForm.stop_name,
      expected_amount: Number(routeForm.expected_amount || 0),
    }]
    : [];

  return {
    sales_rep_id: routeForm.sales_rep_id || null,
    route_name: routeForm.route_name,
    route_date: routeForm.route_date,
    vehicle_reference: routeForm.vehicle_reference || null,
    target_amount: Number(routeForm.target_amount || 0),
    stops: firstStop,
  };
}

export function buildWholesaleOrderPayload(orderForm = {}) {
  return {
    customer_id: orderForm.customer_id || null,
    route_run_id: orderForm.route_run_id || null,
    stop_name: orderForm.stop_name || null,
    items: [{
      product_id: Number(orderForm.product_id),
      quantity: Number(orderForm.quantity),
    }],
    paid: Number(orderForm.paid || 0),
    payment_method: orderForm.payment_method,
    notes: orderForm.notes || null,
  };
}

export function buildWholesaleTransferPayload(transferForm = {}) {
  return {
    ...transferForm,
    quantity: Number(transferForm.quantity || 0),
  };
}

export function buildWholesaleRouteBoardItem(routeRun, formatCurrency = formatCurrencyNGN) {
  const status = routeRun?.status || 'planned';
  const expectedAmount = routeRun?.expected_amount || routeRun?.stops?.[0]?.expected_amount || 0;

  return {
    id: routeRun?.id,
    routeName: routeRun?.route_name || 'Route run',
    repAndDateLabel: `${routeRun?.sales_rep?.name || 'Unassigned rep'} - ${routeRun?.route_date || 'Date pending'}`,
    statusLabel: status.replaceAll('_', ' '),
    targetAmountLabel: formatCurrency(routeRun?.target_amount || 0),
    expectedAmountLabel: formatCurrency(expectedAmount),
    territoryLabel: routeRun?.sales_rep?.territory || routeRun?.vehicle_reference || 'Territory pending',
    stopCountLabel: `${Array.isArray(routeRun?.stops) ? routeRun.stops.length : 0} stop${Array.isArray(routeRun?.stops) && routeRun.stops.length === 1 ? '' : 's'}`,
    isCompletable: status !== 'completed',
  };
}

export function buildWholesaleCustomerCard(customer, formatCurrency = formatCurrencyNGN) {
  const balance = Number(customer?.balance || customer?.outstanding_balance || 0);
  const creditLimit = Number(customer?.credit_limit || 0);
  return {
    id: customer?.id,
    name: customer?.name || 'Wholesale customer',
    phoneLabel: customer?.phone || customer?.contact_phone || 'Phone pending',
    locationLabel: [customer?.city, customer?.state, customer?.address].filter(Boolean).join(', ') || customer?.type || 'Route customer',
    debtLabel: formatCurrency(balance),
    creditLimitLabel: formatCurrency(creditLimit),
    tone: balance > 0 ? 'amber' : 'emerald',
  };
}

export function filterWholesaleRoutes(routeRuns = [], query = '') {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) {
    return routeRuns;
  }

  return routeRuns.filter((routeRun) =>
    [
      routeRun?.route_name,
      routeRun?.status,
      routeRun?.route_date,
      routeRun?.vehicle_reference,
      routeRun?.sales_rep?.name,
      routeRun?.sales_rep?.territory,
      ...(Array.isArray(routeRun?.stops) ? routeRun.stops.flatMap((stop) => [stop?.stop_name, stop?.customer?.name]) : []),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery))
  );
}

export function filterWholesaleCustomers(customers = [], query = '') {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) {
    return customers;
  }

  return customers.filter((customer) =>
    [
      customer?.name,
      customer?.phone,
      customer?.contact_phone,
      customer?.email,
      customer?.city,
      customer?.state,
      customer?.address,
      customer?.type,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery))
  );
}
