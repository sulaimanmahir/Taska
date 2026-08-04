import { formatCurrencyNGN } from './financeFormatters.js';

export function createTextileMeasurementForm() {
  return {
    customer_id: '',
    measurement_profile: '',
    chest: '',
    waist: '',
    hip: '',
    shoulder: '',
    sleeve: '',
    length: '',
  };
}

export function createTextileVariantForm() {
  return {
    product_id: '',
    color_name: '',
    shade_code: '',
    unit_type: 'yard',
    available_quantity: '',
    retail_price: '',
    wholesale_price: '',
  };
}

export function createTextileStyleForm() {
  return {
    customer_id: '',
    measurement_id: '',
    variant_id: '',
    style_name: '',
    garment_type: '',
    fabric_quantity: '',
    fabric_unit: 'yard',
    labour_charge: '',
    due_date: '',
    assigned_tailor: '',
  };
}

export function createTextileConsignmentForm() {
  return {
    product_id: '',
    variant_id: '',
    partner_name: '',
    quantity_sent: '',
    settlement_due: '',
    sent_date: '',
  };
}

export function createTextileInvoiceForm() {
  return {
    customer_id: '',
    style_order_id: '',
    quantity: '',
    rate: '',
    amount_paid: '',
    unit_type: 'yard',
  };
}

export function buildTextileOverviewMetrics(summary = {}, formatCurrency = formatCurrencyNGN, isLoading = false) {
  const loadingValue = isLoading ? '...' : null;

  return [
    {
      label: 'Active Jobs',
      value: loadingValue ?? (summary.active_jobs || 0),
      tone: 'fuchsia',
    },
    {
      label: 'Overdue Jobs',
      value: loadingValue ?? (summary.overdue_jobs || 0),
      tone: 'rose',
    },
    {
      label: 'Consignment Open',
      value: loadingValue ?? (summary.consignment_open || 0),
      tone: 'amber',
    },
    {
      label: 'Debtor Exposure',
      value: loadingValue ?? formatCurrency(summary.debtor_exposure || 0),
      tone: 'sky',
    },
  ];
}

export function buildTextileDeskMetrics(summary = {}, jobs = [], styleOrders = [], consignments = [], variants = [], formatCurrency = formatCurrencyNGN) {
  const openJobs = jobs.filter((job) => job.stage !== 'completed').length;
  const assignedJobs = jobs.filter((job) => job.assigned_tailor).length;
  const openOrders = styleOrders.filter((order) => order.status !== 'completed' && order.status !== 'collected').length;
  const openConsignments = consignments.filter((consignment) => Number(consignment.settlement_due || 0) > 0).length;
  const lowVariantStock = variants.filter((variant) => Number(variant.available_quantity || 0) <= 5).length;

  return [
    {
      label: 'Open Style Orders',
      value: openOrders,
      helper: 'Customer orders still moving through cutting, sewing, finishing, or collection.',
      tone: 'sky',
    },
    {
      label: 'Tailors Engaged',
      value: assignedJobs,
      helper: 'Live job cards already assigned to a named tailor on the floor.',
      tone: 'fuchsia',
    },
    {
      label: 'Open Consignments',
      value: openConsignments,
      helper: 'Fabric or style stock still sitting outside the shop with settlement exposure.',
      tone: 'amber',
    },
    {
      label: 'Receivable Risk',
      value: formatCurrency(summary.debtor_exposure || 0),
      helper: 'Open customer balances still waiting for invoice recovery or delivery closeout.',
      tone: 'rose',
    },
    {
      label: 'Low Variant Stock',
      value: lowVariantStock,
      helper: 'Fast-moving color lines close to a silent stockout.',
      tone: 'emerald',
    },
    {
      label: 'Jobs In Queue',
      value: openJobs,
      helper: 'Tailoring jobs still active before completion and customer release.',
      tone: 'slate',
    },
  ];
}

export function buildTextileMeasurementPayload(measurementForm = {}) {
  return {
    ...measurementForm,
    chest: measurementForm.chest === '' ? null : Number(measurementForm.chest),
    waist: measurementForm.waist === '' ? null : Number(measurementForm.waist),
    hip: measurementForm.hip === '' ? null : Number(measurementForm.hip),
    shoulder: measurementForm.shoulder === '' ? null : Number(measurementForm.shoulder),
    sleeve: measurementForm.sleeve === '' ? null : Number(measurementForm.sleeve),
    length: measurementForm.length === '' ? null : Number(measurementForm.length),
  };
}

export function buildTextileVariantPayload(variantForm = {}) {
  return {
    ...variantForm,
    available_quantity: Number(variantForm.available_quantity || 0),
    retail_price: Number(variantForm.retail_price || 0),
    wholesale_price: Number(variantForm.wholesale_price || 0),
  };
}

export function buildTextileStyleOrderPayload(styleForm = {}) {
  return {
    ...styleForm,
    measurement_id: styleForm.measurement_id || null,
    variant_id: styleForm.variant_id || null,
    fabric_quantity: Number(styleForm.fabric_quantity || 0),
    labour_charge: Number(styleForm.labour_charge || 0),
  };
}

export function buildTextileConsignmentPayload(consignmentForm = {}) {
  return {
    ...consignmentForm,
    variant_id: consignmentForm.variant_id || null,
    quantity_sent: Number(consignmentForm.quantity_sent || 0),
    settlement_due: Number(consignmentForm.settlement_due || 0),
  };
}

export function buildTextileInvoicePayload(invoiceForm = {}) {
  return {
    ...invoiceForm,
    style_order_id: invoiceForm.style_order_id || null,
    quantity: Number(invoiceForm.quantity || 0),
    rate: Number(invoiceForm.rate || 0),
    amount_paid: Number(invoiceForm.amount_paid || 0),
  };
}

export function getTextileTailorQueue(jobs = []) {
  return jobs.filter((job) => job.stage !== 'completed');
}

export function filterTextileStyleOrders(styleOrders = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return styleOrders;

  return styleOrders.filter((order) =>
    [
      order.style_name,
      order.garment_type,
      order.customer?.name,
      order.status,
      order.assigned_tailor,
      order.order_number,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query)
  );
}

export function filterTextileJobs(jobs = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return jobs;

  return jobs.filter((job) =>
    [
      job.stage,
      job.assigned_tailor,
      job.style_order?.style_name,
      job.style_order?.customer?.name,
      job.style_order?.order_number,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query)
  );
}

export function filterTextileConsignments(consignments = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return consignments;

  return consignments.filter((consignment) =>
    [
      consignment.partner_name,
      consignment.product?.name,
      consignment.variant?.color_name,
      consignment.sent_date,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query)
  );
}

export function buildTextileJobCard(job = {}) {
  return {
    id: job.id,
    customerLabel: job.style_order?.customer?.name || 'Customer',
    meta: `${job.style_order?.style_name || 'Style order'} | ${job.stage || 'queued'} | ${job.assigned_tailor || 'Unassigned'}`,
    stageLabel: job.stage || 'queued',
    tailorLabel: job.assigned_tailor || 'Unassigned',
    dueLabel: job.style_order?.due_date || 'No due date',
  };
}

export function buildTextileJobCompletionPayload() {
  return { stage: 'completed' };
}

export function buildTextileStyleOrderCard(order = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: order.id,
    title: order.style_name || 'Style order',
    meta: `${order.customer?.name || 'Customer'} | ${order.fabric_quantity || 0} ${order.fabric_unit || 'yard'} | ${order.status || 'pending'}`,
    totalAmountLabel: formatCurrency(order.total_amount || 0),
    garmentLabel: order.garment_type || 'Garment',
    tailorLabel: order.assigned_tailor || 'Tailor pending',
    dueLabel: order.due_date || 'No due date',
  };
}

export function buildTextileExposureMetrics() {
  return [
    {
      label: 'Silent killers',
      value: 'Margin leaks',
      helper: 'Wrong measurements, stalled tailoring jobs, unreturned consignment stock, and unpaid fabric balances quietly drain margin.',
      tone: 'rose',
    },
    {
      label: 'Monthly focus',
      value: 'Recovery and flow',
      helper: 'Track job turnaround, color-variant movement, consignment exposure, and yard-based invoice recovery by customer segment.',
      tone: 'amber',
    },
  ];
}

export function buildTextileConsignmentCard(consignment = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: consignment.id,
    partnerLabel: consignment.partner_name || 'Consignment partner',
    meta: `${consignment.quantity_sent || 0} sent | settlement ${formatCurrency(consignment.settlement_due || 0)}`,
    productLabel: consignment.product?.name || consignment.variant?.product?.name || 'Fabric line',
    variantLabel: consignment.variant?.color_name || 'Variant pending',
  };
}
