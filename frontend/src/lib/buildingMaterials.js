import { formatCurrencyNGN } from './financeFormatters.js';

export const buildingMaterialsSectionTitles = {
  '/products': 'Inventory',
  '/inventory': 'Warehouse / Yard Stock',
  '/categories': 'Categories',
  '/customers': 'Customers',
  '/contractors': 'Contractors',
  '/quotations': 'Quotations',
  '/orders': 'Orders',
  '/deliveries': 'Deliveries',
  '/credit-sales': 'Credit Sales',
  '/yard-stock': 'Warehouse / Yard Stock',
  '/transfers': 'Transfers',
  '/price-management': 'Price Management',
};

export const buildingMaterialsCustomerRoleOptions = [
  'walk_in_customer',
  'contractor',
  'engineer',
  'site_foreman',
  'developer',
  'government_buyer',
  'repeat_customer',
];

export function getBuildingMaterialsActiveSection(pathname = '') {
  return buildingMaterialsSectionTitles[pathname] || 'Dashboard';
}

export function createBuildingMaterialForm() {
  return {
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
  };
}

export function createBuildingMaterialsCustomerForm() {
  return {
    name: '',
    phone: '',
    customer_role: 'contractor',
    pricing_tier: 'contractor',
    site_location: '',
    project_name: '',
    credit_limit: '',
    guarantor_notes: '',
  };
}

export function createBuildingMaterialsQuotationForm() {
  return {
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
  };
}

export function createBuildingMaterialsDeliveryForm() {
  return {
    customer_id: '',
    quotation_id: '',
    delivery_mode: 'delivery_to_site',
    destination_type: 'site',
    driver_name: '',
    loader_name: '',
    vehicle_reference: '',
    delivery_address: '',
  };
}

export function createBuildingMaterialsPriceForm() {
  return { product_id: '', price_type: 'selling', new_price: '', reason: '' };
}

export function createBuildingMaterialsTransferForm() {
  return { product_id: '', source_warehouse_id: '', destination_warehouse_id: '', unit_of_measure_id: '', quantity: '', notes: '' };
}

export function createBuildingMaterialsPaymentForm() {
  return { account_id: '', amount: '', payment_method: 'cash', notes: '' };
}

export function buildBuildingMaterialsOverviewMetrics(summary = {}, formatCurrency = formatCurrencyNGN, isLoading = false) {
  const loadingValue = isLoading ? '...' : null;

  return [
    {
      label: 'Today Sales',
      value: loadingValue ?? formatCurrency(summary.today_sales || 0),
      helper: 'Material revenue already recorded in the current trading day.',
      tone: 'emerald',
    },
    {
      label: 'Outstanding Debts',
      value: loadingValue ?? formatCurrency(summary.outstanding_debts || 0),
      helper: 'Credit still unrecovered from contractors and project buyers.',
      tone: 'rose',
    },
    {
      label: 'Pending Deliveries',
      value: loadingValue ?? (summary.pending_deliveries || 0),
      helper: 'Site drops still waiting for dispatch or delivery confirmation.',
      tone: 'sky',
    },
    {
      label: 'Quotations Pending',
      value: loadingValue ?? (summary.quotations_pending || 0),
      helper: 'Quotes still open before conversion into live project orders.',
      tone: 'violet',
    },
  ];
}

export function buildBuildingMaterialsOwnerMetrics(summary = {}, formatCurrency = formatCurrencyNGN) {
  return [
    {
      label: 'Low Cement Stock',
      value: summary.low_cement_stock || 0,
      helper: 'Fast-moving cement lines currently close to stock pressure.',
      tone: 'amber',
    },
    {
      label: 'Low Rod Stock',
      value: summary.low_rod_stock || 0,
      helper: 'Steel rod inventory needing replenishment attention.',
      tone: 'rose',
    },
    {
      label: 'Monthly Profit Estimate',
      value: formatCurrency(summary.monthly_profit_estimate || 0),
      helper: 'Current margin estimate based on recent material movement.',
      tone: 'emerald',
    },
  ];
}

export function buildBuildingMaterialsDeskMetrics(
  summary = {},
  items = [],
  quotations = [],
  deliveries = [],
  credits = [],
  formatCurrency = formatCurrencyNGN,
) {
  const openDeliveries = deliveries.filter((delivery) => delivery.status !== 'delivered').length;
  const lowStockCount = items.filter((item) => Number(item.quantity_on_hand || 0) <= Number(item.low_stock_alert || 0)).length;
  const overdueCredits = credits.filter((credit) => Number(credit.outstanding_amount || 0) > 0).length;
  const liveQuotations = quotations.filter((quotation) => quotation.status !== 'converted').length;

  return [
    {
      label: 'Material Lines',
      value: items.length,
      helper: 'Tracked cement, rod, tile, plumbing, and other tradable lines on this desk.',
      tone: 'slate',
    },
    {
      label: 'Credit Exposure',
      value: formatCurrency(summary.outstanding_debts || 0),
      helper: 'Unrecovered contractor and project credit still sitting outside cash.',
      tone: 'rose',
    },
    {
      label: 'Open Quotations',
      value: liveQuotations,
      helper: 'Quotes still live before they close or convert into site orders.',
      tone: 'violet',
    },
    {
      label: 'Active Deliveries',
      value: openDeliveries,
      helper: 'Site drops still moving through dispatch, transit, or confirmation.',
      tone: 'sky',
    },
    {
      label: 'Low Stock Alerts',
      value: lowStockCount,
      helper: 'Material lines already near their reorder pressure point.',
      tone: 'amber',
    },
    {
      label: 'Debtor Accounts',
      value: overdueCredits,
      helper: 'Project accounts with an outstanding balance still needing follow-up.',
      tone: 'emerald',
    },
  ];
}

export function getBuildingMaterialsHighlightedItems(items = []) {
  return items
    .filter((item) => Number(item.quantity_on_hand || 0) <= Number(item.low_stock_alert || 0))
    .slice(0, 5);
}

export function filterBuildingMaterialsItems(items = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return items;
  }

  return items.filter((item) => {
    const haystack = [
      item.name,
      item.sku,
      item.brand,
      item.subcategory,
      item.category?.name,
      item.stock_location_type,
      item.unit_type,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function filterBuildingMaterialsQuotations(quotations = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return quotations;
  }

  return quotations.filter((quotation) => {
    const haystack = [
      quotation.quotation_number,
      quotation.customer?.name,
      quotation.status,
      quotation.pricing_tier,
      quotation.notes,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function filterBuildingMaterialsDeliveries(deliveries = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return deliveries;
  }

  return deliveries.filter((delivery) => {
    const haystack = [
      delivery.customer?.name,
      delivery.driver_name,
      delivery.loader_name,
      delivery.vehicle_reference,
      delivery.delivery_address,
      delivery.status,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function filterBuildingMaterialsCredits(credits = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return credits;
  }

  return credits.filter((credit) => {
    const haystack = [
      credit.customer?.name,
      credit.status,
      credit.customer?.project_name,
      credit.customer?.site_location,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function buildBuildingMaterialsMaterialPayload(materialForm = {}) {
  return {
    ...materialForm,
    category_id: materialForm.category_id || null,
    cost_price: Number(materialForm.cost_price || 0),
    selling_price: Number(materialForm.selling_price || 0),
    wholesale_price: materialForm.wholesale_price ? Number(materialForm.wholesale_price) : null,
    contractor_price: materialForm.contractor_price ? Number(materialForm.contractor_price) : null,
    quantity: Number(materialForm.quantity || 0),
    reorder_level: Number(materialForm.reorder_level || 0),
  };
}

export function buildBuildingMaterialsCustomerPayload(customerForm = {}) {
  return {
    ...customerForm,
    credit_limit: Number(customerForm.credit_limit || 0),
  };
}

export function buildBuildingMaterialsQuotationPayload(quotationForm = {}) {
  return {
    customer_id: quotationForm.customer_id || null,
    pricing_tier: quotationForm.pricing_tier,
    valid_until: quotationForm.valid_until || null,
    delivery_fee: Number(quotationForm.delivery_fee || 0),
    discount_amount: Number(quotationForm.discount_amount || 0),
    notes: quotationForm.notes || null,
    items: [{
      product_id: quotationForm.item_product_id || null,
      item_name: quotationForm.item_name || null,
      unit_type: quotationForm.item_unit_type,
      quantity: Number(quotationForm.item_quantity || 0),
      unit_price: quotationForm.item_unit_price ? Number(quotationForm.item_unit_price) : null,
    }],
  };
}

export function buildBuildingMaterialsQuotationConversionPayload() {
  return { payment_method: 'credit', paid: 0 };
}

export function buildBuildingMaterialsDeliveryPayload(deliveryForm = {}) {
  return {
    ...deliveryForm,
    customer_id: deliveryForm.customer_id || null,
    quotation_id: deliveryForm.quotation_id || null,
  };
}

export function buildBuildingMaterialsPricePayload(priceForm = {}) {
  return {
    ...priceForm,
    new_price: Number(priceForm.new_price || 0),
  };
}

export function buildBuildingMaterialsTransferPayload(transferForm = {}) {
  return {
    ...transferForm,
    unit_of_measure_id: transferForm.unit_of_measure_id || null,
    quantity: Number(transferForm.quantity || 0),
  };
}

export function buildBuildingMaterialsPaymentPayload(paymentForm = {}) {
  return {
    ...paymentForm,
    amount: Number(paymentForm.amount || 0),
  };
}

export function buildBuildingMaterialsDeliveryUpdatePayload() {
  return { status: 'delivered', confirmed_by: 'Taska Ops' };
}

export function buildBuildingMaterialsLowStockCard(item = {}) {
  return {
    id: item.id,
    title: item.name || 'Material',
    meta: `${item.unit_type || 'unit'} - ${Number(item.quantity_on_hand || 0).toFixed(2)} left`,
    priceLabel: formatCurrencyNGN(item.selling_price || 0),
    locationLabel: item.stock_location_type || 'warehouse',
  };
}

export function buildBuildingMaterialsQuotationCard(quotation = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: quotation.id,
    title: quotation.quotation_number || 'Quotation',
    meta: `${quotation.customer?.name || 'Walk-in'} - ${formatCurrency(quotation.total || 0)}`,
    isConverted: quotation.status === 'converted',
    statusLabel: (quotation.status || 'draft').replaceAll('_', ' '),
    totalLabel: formatCurrency(quotation.total || 0),
    detail: `${quotation.pricing_tier || 'retail'} pricing${quotation.valid_until ? ` | valid till ${quotation.valid_until}` : ''}`,
  };
}

export function buildBuildingMaterialsDeliveryFeedCard(delivery = {}) {
  return {
    id: delivery.id,
    title: delivery.customer?.name || 'Site Delivery',
    meta: `${(delivery.status || 'pending').replaceAll('_', ' ')} - ${delivery.driver_name || 'No driver yet'}`,
    canMarkDelivered: delivery.status !== 'delivered',
    driverLabel: delivery.driver_name || 'No driver yet',
    vehicleLabel: delivery.vehicle_reference || 'Vehicle pending',
    addressLabel: delivery.delivery_address || 'No destination yet',
    statusLabel: (delivery.status || 'pending').replaceAll('_', ' '),
  };
}

export function buildBuildingMaterialsPriceChangeCard(change = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: change.id,
    title: change.product?.name || 'Material',
    meta: `${change.price_type || 'selling'} ${formatCurrency(change.previous_price || 0)} to ${formatCurrency(change.new_price || 0)}`,
    reasonLabel: change.reason || 'No reason captured',
  };
}

export function buildBuildingMaterialsTransferCard(transfer = {}) {
  return {
    id: transfer.id,
    title: transfer.product?.name || 'Transfer',
    meta: `${transfer.quantity || 0} moved - converted ${transfer.converted_quantity || 0}`,
    routeLabel: `${transfer.sourceWarehouse?.name || transfer.source_warehouse?.name || 'Unknown source'} to ${transfer.destinationWarehouse?.name || transfer.destination_warehouse?.name || 'Unknown destination'}`,
  };
}

export function buildBuildingMaterialsCreditCard(credit = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: credit.id,
    title: credit.customer?.name || 'Project account',
    outstandingLabel: formatCurrency(credit.outstanding_amount || 0),
    limitLabel: formatCurrency(credit.customer?.credit_limit || 0),
    meta: `${credit.customer?.project_name || 'No project name'} | ${credit.customer?.site_location || 'No site location'}`,
    statusLabel: (credit.status || 'open').replaceAll('_', ' '),
  };
}
