import test from 'node:test';
import assert from 'node:assert/strict';

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
} from '../src/lib/wholesale.js';
import { formatCurrencyNGN } from '../src/lib/financeFormatters.js';

test('wholesale form factories return clean default states', () => {
  assert.deepEqual(createWholesaleRepForm(), {
    name: '',
    phone: '',
    territory: '',
    target_amount: '',
  });
  assert.deepEqual(createWholesaleTierForm(), {
    customer_id: '',
    product_id: '',
    tier_name: '',
    minimum_quantity: '',
    unit_price: '',
  });
  assert.deepEqual(createWholesaleRouteForm(), {
    sales_rep_id: '',
    route_name: '',
    route_date: '',
    vehicle_reference: '',
    target_amount: '',
    stop_name: '',
    customer_id: '',
    expected_amount: '',
  });
  assert.deepEqual(createWholesaleOrderForm(), {
    customer_id: '',
    route_run_id: '',
    stop_name: '',
    product_id: '',
    quantity: '',
    paid: '',
    payment_method: 'transfer',
    notes: '',
  });
  assert.deepEqual(createWholesaleTransferForm(), {
    from_warehouse_id: '',
    to_warehouse_id: '',
    product_id: '',
    quantity: '',
    notes: '',
  });
});

test('wholesale overview metrics keep route and finance values aligned', () => {
  const metrics = buildWholesaleOverviewMetrics({
    route_runs_today: 6,
    active_reps: 4,
    bulk_orders_today: 18,
    route_collections_today: 420000,
    customer_debt: 185000,
    stock_transfers_today: 3,
  });

  assert.equal(metrics.length, 6);
  assert.deepEqual(metrics[0], { label: 'Route Runs Today', value: 6, tone: 'indigo' });
  assert.equal(metrics[3].value, formatCurrencyNGN(420000));
  assert.equal(metrics[4].value, formatCurrencyNGN(185000));
});

test('wholesale desk metrics summarize route pressure and debt exposure clearly', () => {
  const metrics = buildWholesaleDeskMetrics({
    route_runs: [
      { id: 1, status: 'planned', sales_rep: { name: 'Aisha' } },
      { id: 2, status: 'completed', sales_rep: null },
    ],
    sales_reps: [{ id: 1 }, { id: 2 }, { id: 3 }],
    debtors: [
      { id: 10, balance: 150000 },
      { id: 11, outstanding_balance: 50000 },
    ],
  });

  assert.equal(metrics.length, 6);
  assert.deepEqual(metrics[0], { label: 'Live Route Runs', value: 2, tone: 'indigo' });
  assert.deepEqual(metrics[1], { label: 'Assigned Runs', value: 1, tone: 'sky' });
  assert.equal(metrics[3].value, 1);
  assert.equal(metrics[5].value, formatCurrencyNGN(200000));
});

test('wholesale product and price-source helpers keep bulk order hints readable', () => {
  const products = [
    { id: 1, name: 'Rice 50kg' },
    { id: 2, name: 'Sugar 25kg' },
  ];

  assert.deepEqual(findWholesaleSelectedProduct(products, '2'), products[1]);
  assert.equal(findWholesaleSelectedProduct(products, '9'), null);
  assert.equal(buildWholesalePriceSourceLabel(products[0]), 'Price source: Rice 50kg and active tier if matched');
  assert.equal(buildWholesalePriceSourceLabel(null), 'Price source: Pick product and active tier if matched');
});

test('wholesale payload helpers normalize sales rep, tier, route, order, and transfer forms', () => {
  assert.deepEqual(buildWholesaleSalesRepPayload({
    name: 'Binta',
    phone: '08030000000',
    territory: 'Kano North',
    target_amount: '2500000',
  }), {
    name: 'Binta',
    phone: '08030000000',
    territory: 'Kano North',
    target_amount: 2500000,
  });

  assert.deepEqual(buildWholesalePriceTierPayload({
    customer_id: '',
    product_id: '7',
    tier_name: 'Dealer Tier',
    minimum_quantity: '15',
    unit_price: '9800',
  }), {
    customer_id: null,
    product_id: '7',
    tier_name: 'Dealer Tier',
    minimum_quantity: 15,
    unit_price: 9800,
  });

  assert.deepEqual(buildWholesaleRouteRunPayload({
    sales_rep_id: '5',
    route_name: 'Sabon Gari Tuesday Run',
    route_date: '2026-05-25',
    vehicle_reference: '',
    target_amount: '350000',
    stop_name: 'Singer Market',
    customer_id: '11',
    expected_amount: '95000',
  }), {
    sales_rep_id: '5',
    route_name: 'Sabon Gari Tuesday Run',
    route_date: '2026-05-25',
    vehicle_reference: null,
    target_amount: 350000,
    stops: [
      {
        customer_id: '11',
        stop_name: 'Singer Market',
        expected_amount: 95000,
      },
    ],
  });

  assert.deepEqual(buildWholesaleOrderPayload({
    customer_id: '',
    route_run_id: '4',
    stop_name: '',
    product_id: '8',
    quantity: '20',
    paid: '150000',
    payment_method: 'transfer',
    notes: '',
  }), {
    customer_id: null,
    route_run_id: '4',
    stop_name: null,
    items: [{ product_id: 8, quantity: 20 }],
    paid: 150000,
    payment_method: 'transfer',
    notes: null,
  });

  assert.deepEqual(buildWholesaleTransferPayload({
    from_warehouse_id: '1',
    to_warehouse_id: '2',
    product_id: '9',
    quantity: '45',
    notes: 'Top up city depot',
  }), {
    from_warehouse_id: '1',
    to_warehouse_id: '2',
    product_id: '9',
    quantity: 45,
    notes: 'Top up city depot',
  });
});

test('wholesale route board presenter keeps route, status, and target labels aligned', () => {
  const routeBoardItem = buildWholesaleRouteBoardItem({
    id: 6,
    route_name: 'Ring Road Morning Run',
    route_date: '2026-05-25',
    status: 'in_progress',
    target_amount: 275000,
    expected_amount: 95000,
    stops: [{ stop_name: 'Bompai Market' }, { stop_name: 'Sabon Gari' }],
    sales_rep: { name: 'Nasiru', territory: 'Kano Central' },
  });

  assert.deepEqual(routeBoardItem, {
    id: 6,
    routeName: 'Ring Road Morning Run',
    repAndDateLabel: 'Nasiru - 2026-05-25',
    statusLabel: 'in progress',
    targetAmountLabel: formatCurrencyNGN(275000),
    expectedAmountLabel: formatCurrencyNGN(95000),
    territoryLabel: 'Kano Central',
    stopCountLabel: '2 stops',
    isCompletable: true,
  });
});

test('wholesale customer presenter keeps debt watch readable', () => {
  const card = buildWholesaleCustomerCard({
    id: 4,
    name: 'Sabon Gari Dealers',
    phone: '08050000000',
    city: 'Kano',
    state: 'Kano',
    balance: 125000,
    credit_limit: 300000,
  });

  assert.deepEqual(card, {
    id: 4,
    name: 'Sabon Gari Dealers',
    phoneLabel: '08050000000',
    locationLabel: 'Kano, Kano',
    debtLabel: formatCurrencyNGN(125000),
    creditLimitLabel: formatCurrencyNGN(300000),
    tone: 'amber',
  });
});

test('wholesale filters keep route and debtor searches stable', () => {
  const routes = [
    {
      id: 1,
      route_name: 'Kano Monday',
      status: 'planned',
      route_date: '2026-06-01',
      vehicle_reference: 'TRK-01',
      sales_rep: { name: 'Amina', territory: 'Kano' },
      stops: [{ stop_name: 'Singer Market', customer: { name: 'Singer Stores' } }],
    },
    {
      id: 2,
      route_name: 'Kaduna Tuesday',
      status: 'completed',
      sales_rep: { name: 'Yusuf', territory: 'Kaduna' },
      stops: [],
    },
  ];
  const customers = [
    { id: 1, name: 'Singer Stores', phone: '0801', city: 'Kano', type: 'wholesale' },
    { id: 2, name: 'Railway Depot', phone: '0802', city: 'Kaduna', type: 'depot' },
  ];

  assert.deepEqual(filterWholesaleRoutes(routes, 'singer'), [routes[0]]);
  assert.deepEqual(filterWholesaleRoutes(routes, 'kaduna'), [routes[1]]);
  assert.deepEqual(filterWholesaleCustomers(customers, 'kano'), [customers[0]]);
  assert.deepEqual(filterWholesaleCustomers(customers, 'depot'), [customers[1]]);
});
