import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildingMaterialsCustomerRoleOptions,
  buildingMaterialsSectionTitles,
  buildBuildingMaterialsCreditCard,
  buildBuildingMaterialsDeskMetrics,
  buildBuildingMaterialsCustomerPayload,
  buildBuildingMaterialsDeliveryFeedCard,
  buildBuildingMaterialsDeliveryPayload,
  buildBuildingMaterialsDeliveryUpdatePayload,
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
} from '../src/lib/buildingMaterials.js';
import { formatCurrencyNGN } from '../src/lib/financeFormatters.js';

test('building materials section and form helpers return stable defaults', () => {
  assert.equal(getBuildingMaterialsActiveSection('/deliveries'), 'Deliveries');
  assert.equal(getBuildingMaterialsActiveSection('/unknown'), 'Dashboard');
  assert.equal(buildingMaterialsSectionTitles['/price-management'], 'Price Management');
  assert.equal(buildingMaterialsCustomerRoleOptions[1], 'contractor');

  assert.deepEqual(createBuildingMaterialForm(), {
    name: '',
    sku: '',
    category_id: '',
    subcategory: '',
    brand: '',
    unit_type: 'bag',
    cost_price: '',
    selling_price: '',
    wholesale_price: '',
    contractor_price: '',
    quantity: '',
    reorder_level: '',
    stock_location_type: 'warehouse',
  });
  assert.deepEqual(createBuildingMaterialsCustomerForm(), {
    name: '',
    phone: '',
    customer_role: 'contractor',
    pricing_tier: 'contractor',
    site_location: '',
    project_name: '',
    credit_limit: '',
    guarantor_notes: '',
  });
  assert.deepEqual(createBuildingMaterialsQuotationForm(), {
    customer_id: '',
    pricing_tier: 'contractor',
    valid_until: '',
    delivery_fee: '',
    discount_amount: '',
    notes: '',
    item_product_id: '',
    item_name: '',
    item_unit_type: 'bag',
    item_quantity: '',
    item_unit_price: '',
  });
  assert.deepEqual(createBuildingMaterialsDeliveryForm(), {
    customer_id: '',
    quotation_id: '',
    delivery_mode: 'delivery_to_site',
    destination_type: 'site',
    driver_name: '',
    loader_name: '',
    vehicle_reference: '',
    delivery_address: '',
  });
  assert.deepEqual(createBuildingMaterialsPriceForm(), {
    product_id: '',
    price_type: 'selling',
    new_price: '',
    reason: '',
  });
  assert.deepEqual(createBuildingMaterialsTransferForm(), {
    product_id: '',
    source_warehouse_id: '',
    destination_warehouse_id: '',
    unit_of_measure_id: '',
    quantity: '',
    notes: '',
  });
  assert.deepEqual(createBuildingMaterialsPaymentForm(), {
    account_id: '',
    amount: '',
    payment_method: 'cash',
    notes: '',
  });
});

test('building materials overview and owner metrics keep dashboard cards aligned', () => {
  const overviewMetrics = buildBuildingMaterialsOverviewMetrics({
    today_sales: 850000,
    outstanding_debts: 215000,
    pending_deliveries: 6,
    quotations_pending: 3,
  }, formatCurrencyNGN, false);
  const loadingMetrics = buildBuildingMaterialsOverviewMetrics({}, formatCurrencyNGN, true);
  const ownerMetrics = buildBuildingMaterialsOwnerMetrics({
    low_cement_stock: 12,
    low_rod_stock: 4,
    monthly_profit_estimate: 1325000,
  }, formatCurrencyNGN);

  assert.deepEqual(overviewMetrics[0], {
    label: 'Today Sales',
    value: formatCurrencyNGN(850000),
    helper: 'Material revenue already recorded in the current trading day.',
    tone: 'emerald',
  });
  assert.equal(overviewMetrics[2].value, 6);
  assert.equal(loadingMetrics[1].value, '...');
  assert.deepEqual(ownerMetrics[2], {
    label: 'Monthly Profit Estimate',
    value: formatCurrencyNGN(1325000),
    helper: 'Current margin estimate based on recent material movement.',
    tone: 'emerald',
  });

  const deskMetrics = buildBuildingMaterialsDeskMetrics(
    { outstanding_debts: 215000 },
    [
      { quantity_on_hand: 5, low_stock_alert: 10 },
      { quantity_on_hand: 12, low_stock_alert: 4 },
    ],
    [{ status: 'approved' }, { status: 'converted' }],
    [{ status: 'pending' }, { status: 'delivered' }],
    [{ outstanding_amount: 2500 }, { outstanding_amount: 0 }],
    formatCurrencyNGN,
  );

  assert.deepEqual(deskMetrics[1], {
    label: 'Credit Exposure',
    value: formatCurrencyNGN(215000),
    helper: 'Unrecovered contractor and project credit still sitting outside cash.',
    tone: 'rose',
  });
  assert.equal(deskMetrics[3].value, 1);
  assert.equal(deskMetrics[4].value, 1);
});

test('building materials payload helpers normalize inventory, quotation, and ops forms', () => {
  assert.deepEqual(buildBuildingMaterialsMaterialPayload({
    name: 'Dangote Cement 50kg',
    sku: 'CEM-001',
    category_id: '',
    subcategory: 'Cement',
    brand: 'Dangote',
    unit_type: 'bag',
    cost_price: '9200',
    selling_price: '9800',
    wholesale_price: '9600',
    contractor_price: '',
    quantity: '150',
    reorder_level: '40',
    stock_location_type: 'warehouse',
  }), {
    name: 'Dangote Cement 50kg',
    sku: 'CEM-001',
    category_id: null,
    subcategory: 'Cement',
    brand: 'Dangote',
    unit_type: 'bag',
    cost_price: 9200,
    selling_price: 9800,
    wholesale_price: 9600,
    contractor_price: null,
    quantity: 150,
    reorder_level: 40,
    stock_location_type: 'warehouse',
  });

  assert.deepEqual(buildBuildingMaterialsCustomerPayload({
    name: 'Prime Build Ltd',
    phone: '08030000000',
    customer_role: 'contractor',
    pricing_tier: 'contractor',
    site_location: 'Abuja',
    project_name: 'Estate Phase 2',
    credit_limit: '2500000',
    guarantor_notes: 'Approved by owner',
  }), {
    name: 'Prime Build Ltd',
    phone: '08030000000',
    customer_role: 'contractor',
    pricing_tier: 'contractor',
    site_location: 'Abuja',
    project_name: 'Estate Phase 2',
    credit_limit: 2500000,
    guarantor_notes: 'Approved by owner',
  });

  assert.deepEqual(buildBuildingMaterialsQuotationPayload({
    customer_id: '',
    pricing_tier: 'contractor',
    valid_until: '2026-05-31',
    delivery_fee: '50000',
    discount_amount: '15000',
    notes: '',
    item_product_id: '14',
    item_name: '16mm Rod',
    item_unit_type: 'piece',
    item_quantity: '120',
    item_unit_price: '14500',
  }), {
    customer_id: null,
    pricing_tier: 'contractor',
    valid_until: '2026-05-31',
    delivery_fee: 50000,
    discount_amount: 15000,
    notes: null,
    items: [{
      product_id: '14',
      item_name: '16mm Rod',
      unit_type: 'piece',
      quantity: 120,
      unit_price: 14500,
    }],
  });

  assert.deepEqual(buildBuildingMaterialsDeliveryPayload({
    customer_id: '',
    quotation_id: '7',
    delivery_mode: 'delivery_to_site',
    destination_type: 'site',
    driver_name: 'Musa',
    loader_name: 'Tunde',
    vehicle_reference: 'KJA-221XY',
    delivery_address: 'Kubwa site',
  }), {
    customer_id: null,
    quotation_id: '7',
    delivery_mode: 'delivery_to_site',
    destination_type: 'site',
    driver_name: 'Musa',
    loader_name: 'Tunde',
    vehicle_reference: 'KJA-221XY',
    delivery_address: 'Kubwa site',
  });

  assert.deepEqual(buildBuildingMaterialsPricePayload({
    product_id: '9',
    price_type: 'wholesale',
    new_price: '17250',
    reason: 'Supplier increase',
  }), {
    product_id: '9',
    price_type: 'wholesale',
    new_price: 17250,
    reason: 'Supplier increase',
  });

  assert.deepEqual(buildBuildingMaterialsTransferPayload({
    product_id: '4',
    source_warehouse_id: '1',
    destination_warehouse_id: '2',
    unit_of_measure_id: '',
    quantity: '32.5',
    notes: 'Yard restock',
  }), {
    product_id: '4',
    source_warehouse_id: '1',
    destination_warehouse_id: '2',
    unit_of_measure_id: null,
    quantity: 32.5,
    notes: 'Yard restock',
  });

  assert.deepEqual(buildBuildingMaterialsPaymentPayload({
    account_id: '18',
    amount: '600000',
    payment_method: 'transfer',
    notes: 'Part payment',
  }), {
    account_id: '18',
    amount: 600000,
    payment_method: 'transfer',
    notes: 'Part payment',
  });
});

test('building materials presentation helpers keep watchlists and operations feed readable', () => {
  const highlightedItems = getBuildingMaterialsHighlightedItems([
    { id: 1, quantity_on_hand: 5, low_stock_alert: 10 },
    { id: 2, quantity_on_hand: 20, low_stock_alert: 5 },
    { id: 3, quantity_on_hand: 8, low_stock_alert: 8 },
    { id: 4, quantity_on_hand: 2, low_stock_alert: 6 },
    { id: 5, quantity_on_hand: 1, low_stock_alert: 4 },
    { id: 6, quantity_on_hand: 3, low_stock_alert: 5 },
  ]);

  assert.deepEqual(highlightedItems.map((item) => item.id), [1, 3, 4, 5, 6]);
  assert.deepEqual(buildBuildingMaterialsLowStockCard({
    id: 4,
    name: '12mm Rod',
    unit_type: 'piece',
    quantity_on_hand: 18.5,
    selling_price: 14500,
    stock_location_type: 'yard',
  }), {
    id: 4,
    title: '12mm Rod',
    meta: 'piece - 18.50 left',
    priceLabel: formatCurrencyNGN(14500),
    locationLabel: 'yard',
  });

  assert.deepEqual(buildBuildingMaterialsQuotationCard({
    id: 10,
    quotation_number: 'QTN-010',
    customer: { name: 'Prime Build Ltd' },
    total: 430000,
    status: 'approved',
  }, formatCurrencyNGN), {
    id: 10,
    title: 'QTN-010',
    meta: `Prime Build Ltd - ${formatCurrencyNGN(430000)}`,
    isConverted: false,
    statusLabel: 'approved',
    totalLabel: formatCurrencyNGN(430000),
    detail: 'retail pricing',
  });

  assert.deepEqual(buildBuildingMaterialsQuotationConversionPayload(), {
    payment_method: 'credit',
    paid: 0,
  });

  assert.deepEqual(buildBuildingMaterialsDeliveryFeedCard({
    id: 11,
    customer: { name: 'Estate Site B' },
    status: 'in_transit',
    driver_name: '',
    vehicle_reference: 'ABJ-221-KD',
    delivery_address: 'Kubwa site',
  }), {
    id: 11,
    title: 'Estate Site B',
    meta: 'in transit - No driver yet',
    canMarkDelivered: true,
    driverLabel: 'No driver yet',
    vehicleLabel: 'ABJ-221-KD',
    addressLabel: 'Kubwa site',
    statusLabel: 'in transit',
  });

  assert.deepEqual(buildBuildingMaterialsDeliveryUpdatePayload(), {
    status: 'delivered',
    confirmed_by: 'Taska Ops',
  });

  assert.deepEqual(buildBuildingMaterialsPriceChangeCard({
    id: 12,
    product: { name: 'Sharp Sand' },
    price_type: 'selling',
    previous_price: 180000,
    new_price: 195000,
    reason: 'Rainy season scarcity',
  }, formatCurrencyNGN), {
    id: 12,
    title: 'Sharp Sand',
    meta: `selling ${formatCurrencyNGN(180000)} to ${formatCurrencyNGN(195000)}`,
    reasonLabel: 'Rainy season scarcity',
  });

  assert.deepEqual(buildBuildingMaterialsTransferCard({
    id: 13,
    product: { name: 'Tiles' },
    quantity: 45,
    converted_quantity: 45,
    source_warehouse: { name: 'Main yard' },
    destination_warehouse: { name: 'Wuse branch' },
  }), {
    id: 13,
    title: 'Tiles',
    meta: '45 moved - converted 45',
    routeLabel: 'Main yard to Wuse branch',
  });

  assert.deepEqual(buildBuildingMaterialsCreditCard({
    id: 14,
    status: 'overdue',
    outstanding_amount: 360000,
    customer: {
      name: 'Prime Build Ltd',
      credit_limit: 1000000,
      project_name: 'Estate Phase 2',
      site_location: 'Kubwa',
    },
  }, formatCurrencyNGN), {
    id: 14,
    title: 'Prime Build Ltd',
    outstandingLabel: formatCurrencyNGN(360000),
    limitLabel: formatCurrencyNGN(1000000),
    meta: 'Estate Phase 2 | Kubwa',
    statusLabel: 'overdue',
  });
});

test('building materials filters keep the stronger desk search surfaces stable', () => {
  assert.deepEqual(
    filterBuildingMaterialsItems(
      [
        { id: 1, name: 'Dangote Cement', sku: 'CEM-1', brand: 'Dangote', subcategory: 'Cement', stock_location_type: 'warehouse', unit_type: 'bag' },
        { id: 2, name: 'Binding Wire', sku: 'WIRE-1', brand: 'Prime', subcategory: 'Wire', stock_location_type: 'yard', unit_type: 'roll' },
      ],
      'dangote',
    ).map((item) => item.id),
    [1],
  );

  assert.deepEqual(
    filterBuildingMaterialsQuotations(
      [
        { id: 3, quotation_number: 'QTN-001', customer: { name: 'Prime Build' }, status: 'approved', pricing_tier: 'contractor' },
        { id: 4, quotation_number: 'QTN-002', customer: { name: 'Walk in' }, status: 'converted', pricing_tier: 'retail' },
      ],
      'prime',
    ).map((quotation) => quotation.id),
    [3],
  );

  assert.deepEqual(
    filterBuildingMaterialsDeliveries(
      [
        { id: 5, customer: { name: 'Prime Build' }, driver_name: 'Musa', vehicle_reference: 'ABJ-22', delivery_address: 'Kubwa', status: 'in_transit' },
        { id: 6, customer: { name: 'Bridge Site' }, driver_name: 'Uche', vehicle_reference: 'KAN-10', delivery_address: 'Zaria', status: 'delivered' },
      ],
      'musa',
    ).map((delivery) => delivery.id),
    [5],
  );

  assert.deepEqual(
    filterBuildingMaterialsCredits(
      [
        { id: 7, customer: { name: 'Prime Build', project_name: 'Estate', site_location: 'Abuja' }, status: 'overdue' },
        { id: 8, customer: { name: 'Blue Rock', project_name: 'Bridge', site_location: 'Kaduna' }, status: 'open' },
      ],
      'estate',
    ).map((credit) => credit.id),
    [7],
  );
});
