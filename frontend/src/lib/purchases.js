import { formatCurrencyNGN } from './financeFormatters.js';

export function createPurchaseLine() {
  return {
    product_id: '',
    quantity_ordered: '1',
    unit_cost: '',
  };
}

export function createPurchaseForm() {
  return {
    supplier_id: '',
    warehouse_id: '',
    discount: '0',
    notes: '',
    items: [createPurchaseLine()],
  };
}

export function appendPurchaseLine(lines = []) {
  return [...lines, createPurchaseLine()];
}

export function updatePurchaseLine(lines = [], index, patch) {
  return lines.map((line, lineIndex) => (
    lineIndex === index ? { ...line, ...patch } : line
  ));
}

export function removePurchaseLine(lines = [], index) {
  if (lines.length <= 1) {
    return [createPurchaseLine()];
  }

  return lines.filter((_, lineIndex) => lineIndex !== index);
}

export function buildPurchasePayload(form = {}) {
  return {
    supplier_id: Number(form.supplier_id),
    warehouse_id: Number(form.warehouse_id),
    discount: Number(form.discount || 0),
    notes: form.notes || '',
    items: (form.items ?? []).map((item) => ({
      product_id: Number(item.product_id),
      quantity_ordered: Number(item.quantity_ordered || 0),
      unit_cost: Number(item.unit_cost || 0),
    })),
  };
}

export function createPurchaseReceiveDraft(purchase = {}) {
  return {
    notes: '',
    items: (purchase.items ?? [])
      .filter((item) => Number(item.quantity_ordered || 0) > Number(item.quantity_received || 0))
      .map((item) => ({
        purchase_item_id: item.id,
        quantity_received: String(
          Math.max(Number(item.quantity_ordered || 0) - Number(item.quantity_received || 0), 0)
        ),
      })),
  };
}

export function buildPurchaseReceivePayload(draft = {}) {
  return {
    notes: draft.notes || '',
    items: (draft.items ?? [])
      .filter((item) => Number(item.quantity_received || 0) > 0)
      .map((item) => ({
        purchase_item_id: Number(item.purchase_item_id),
        quantity_received: Number(item.quantity_received || 0),
      })),
  };
}

export function createPurchasePaymentDraft(purchase = {}) {
  return {
    amount: String(getPurchaseOutstandingBalance(purchase)),
    payment_method: 'transfer',
    reference: '',
    notes: '',
  };
}

export function buildPurchasePaymentPayload(draft = {}) {
  return {
    amount: Number(draft.amount || 0),
    payment_method: draft.payment_method || 'transfer',
    reference: draft.reference || '',
    notes: draft.notes || '',
  };
}

export function getPurchaseOutstandingBalance(purchase = {}) {
  return Math.max(Number(purchase.total || 0) - Number(purchase.paid || 0), 0);
}

export function buildPurchaseOverviewMetrics(summary = {}, formatCurrency = formatCurrencyNGN) {
  return [
    {
      label: 'Open Purchases',
      value: (Number(summary.pending_count || 0) + Number(summary.partial_count || 0)).toString(),
      helper: 'Purchase orders still waiting for full receipt into stock.',
      tone: 'amber',
    },
    {
      label: 'Outstanding Payables',
      value: formatCurrency(summary.outstanding_balance || 0),
      helper: 'Supplier balances still waiting to be settled.',
      tone: 'rose',
    },
    {
      label: 'Received Orders',
      value: Number(summary.received_count || 0).toString(),
      helper: 'Purchase orders already fully received into inventory.',
      tone: 'emerald',
    },
    {
      label: 'Purchase Value',
      value: formatCurrency(summary.total_value || 0),
      helper: 'Committed spend across the tracked purchase ledger.',
      tone: 'violet',
    },
  ];
}

export function buildPurchaseCard(purchase = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: purchase.id,
    title: purchase.purchase_number || 'Purchase order',
    supplierLabel: purchase.supplier?.name || 'Supplier not set',
    warehouseLabel: purchase.warehouse?.name || 'Warehouse not set',
    totalLabel: formatCurrency(purchase.total || 0),
    paidLabel: formatCurrency(purchase.paid || 0),
    outstandingLabel: formatCurrency(getPurchaseOutstandingBalance(purchase)),
    status: purchase.status || 'pending',
    statusTone: resolvePurchaseStatusTone(purchase.status),
    itemCountLabel: `${purchase.items?.length ?? 0} lines`,
  };
}

export function buildPurchaseItemCard(item = {}, formatCurrency = formatCurrencyNGN) {
  const ordered = Number(item.quantity_ordered || 0);
  const received = Number(item.quantity_received || 0);

  return {
    id: item.id,
    title: item.product?.name || 'Product',
    quantityLabel: `${received}/${ordered} received`,
    amountLabel: `${formatCurrency(item.unit_cost || 0)} each`,
    remainingQuantity: Math.max(ordered - received, 0),
  };
}

export function resolvePurchaseStatusTone(status = 'pending') {
  if (status === 'received') {
    return 'emerald';
  }

  if (status === 'partial') {
    return 'sky';
  }

  if (status === 'cancelled') {
    return 'slate';
  }

  return 'amber';
}
