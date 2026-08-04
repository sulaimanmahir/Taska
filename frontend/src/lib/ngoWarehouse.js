export function createNgoDonorForm() {
  return {
    name: 'Relief Support Network',
    contact_person: 'Amina Yusuf',
    phone: '08030000000',
    compliance_reference: 'REL-2026-001',
  };
}

export function createNgoRequestForm() {
  return {
    partner_name: 'Mercy Relief',
    request_notes: 'Emergency food support for displaced households.',
    needed_by: new Date().toISOString().slice(0, 10),
    status: 'pending',
  };
}

export function createNgoDistributionForm() {
  return {
    partner_request_id: '',
    donor_source_id: '',
    beneficiary_name: '',
    destination_location: '',
    driver_name: '',
    vehicle_reference: '',
    status: 'dispatched',
    distributed_on: new Date().toISOString().slice(0, 10),
    item_product_id: '',
    item_quantity: '',
  };
}

export function createNgoSignatureForm() {
  return {
    distribution_id: '',
    beneficiary_name: '',
    signed_by: '',
    signature_reference: '',
  };
}

export function buildNgoOverviewMetrics(summary = {}, isLoading = false) {
  const valueOrLoading = (value) => (isLoading ? '...' : value);

  return [
    {
      label: 'Sources',
      value: valueOrLoading(summary.donor_sources || 0),
      helper: 'Approved stock sources tracked for clean warehouse accountability and audit clarity.',
      tone: 'violet',
    },
    {
      label: 'Pending Requests',
      value: valueOrLoading(summary.partner_requests_pending || 0),
      helper: 'Requests still waiting for warehouse review or release planning.',
      tone: 'amber',
    },
    {
      label: 'Distributions Today',
      value: valueOrLoading(summary.distributions_today || 0),
      helper: 'Stock releases already logged in the current operating day.',
      tone: 'sky',
    },
    {
      label: 'Expiry Alerts',
      value: valueOrLoading(summary.expiry_alerts || 0),
      helper: 'Expiry-sensitive items currently needing warehouse attention.',
      tone: 'rose',
    },
  ];
}

export function buildNgoDeskMetrics(summary = {}, partnerRequests = [], distributions = [], inventory = [], isLoading = false) {
  const valueOrLoading = (value) => (isLoading ? '...' : value);
  const pendingSignatures = summary.signatures_pending ?? distributions.filter((distribution) => !(distribution.signatures?.length)).length;
  const activeRequests = partnerRequests.filter((request) => request.status === 'pending').length;
  const lowVisibilityStock = inventory.filter((item) => Number(item.available_quantity ?? item.quantity_on_hand ?? item.quantity ?? 0) <= 0).length;

  return [
    ...buildNgoOverviewMetrics(summary, isLoading),
    {
      label: 'Pending Signatures',
      value: valueOrLoading(pendingSignatures),
      helper: 'Releases already sent out but still missing signed beneficiary confirmation for audit closure.',
      tone: pendingSignatures > 0 ? 'amber' : 'emerald',
    },
    {
      label: 'Active Requests',
      value: valueOrLoading(activeRequests),
      helper: 'Partner requests still sitting inside the active warehouse pipeline.',
      tone: activeRequests > 0 ? 'sky' : 'emerald',
    },
    {
      label: 'Stock Visibility Gaps',
      value: valueOrLoading(summary.stock_accountability_gap ?? lowVisibilityStock),
      helper: 'Inventory lines that still need tighter reference or movement accountability.',
      tone: Number(summary.stock_accountability_gap ?? lowVisibilityStock) > 0 ? 'rose' : 'emerald',
    },
  ];
}

export function buildNgoDistributionPayload(form = {}) {
  return {
    partner_request_id: form.partner_request_id || null,
    donor_source_id: form.donor_source_id || null,
    beneficiary_name: form.beneficiary_name,
    destination_location: form.destination_location || null,
    driver_name: form.driver_name || null,
    vehicle_reference: form.vehicle_reference || null,
    status: form.status || 'dispatched',
    distributed_on: form.distributed_on || null,
    items: [
      {
        product_id: form.item_product_id,
        quantity: Number(form.item_quantity || 0),
      },
    ],
  };
}

export function buildNgoPartnerRequestCard(request = {}) {
  return {
    id: request.id,
    title: request.partner_name || 'Partner request',
    detailLabel: `${request.request_reference || 'No reference'} - ${request.status || 'pending'}`,
    neededByLabel: request.needed_by || 'No target date',
    notesLabel: request.request_notes || 'No request notes captured',
  };
}

export function buildNgoDistributionCard(distribution = {}) {
  return {
    id: distribution.id,
    title: distribution.distribution_reference || 'Warehouse release',
    detailLabel: `${distribution.beneficiary_name || 'No beneficiary'} - ${distribution.signatures?.length || 0} signature(s)`,
    destinationLabel: distribution.destination_location || 'No destination captured',
    statusLabel: distribution.status || 'dispatched',
    distributedOnLabel: distribution.distributed_on || 'No release date',
    itemCountLabel: `${distribution.items?.length || 0} release item${distribution.items?.length === 1 ? '' : 's'}`,
  };
}

export function buildNgoInventoryCard(item = {}) {
  const availableQuantity = item.available_quantity ?? item.quantity_on_hand ?? item.quantity ?? 0;

  return {
    id: item.id ?? item.product_id,
    title: item.product?.name || 'Inventory item',
    warehouseLabel: item.warehouse?.name || 'Warehouse not linked',
    quantityLabel: `${availableQuantity} available`,
    reorderLabel: item.reorder_level ? `Reorder level ${item.reorder_level}` : 'No reorder level',
    expiryLabel: item.expiry_date || item.batch?.expiry_date || 'No expiry date',
  };
}

export function filterNgoRequests(requests = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return requests;
  }

  return requests.filter((request) => {
    const fields = [
      request.partner_name,
      request.request_reference,
      request.status,
      request.request_notes,
      request.needed_by,
    ];

    return fields.some((field) => String(field ?? '').toLowerCase().includes(query));
  });
}

export function filterNgoDistributions(distributions = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return distributions;
  }

  return distributions.filter((distribution) => {
    const itemNames = (distribution.items ?? []).map((item) => item.product?.name).join(' ');
    const fields = [
      distribution.distribution_reference,
      distribution.beneficiary_name,
      distribution.destination_location,
      distribution.status,
      distribution.distributed_on,
      itemNames,
    ];

    return fields.some((field) => String(field ?? '').toLowerCase().includes(query));
  });
}

export function filterNgoInventory(items = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return items;
  }

  return items.filter((item) => {
    const fields = [
      item.product?.name,
      item.product?.sku,
      item.warehouse?.name,
      item.expiry_date,
      item.batch?.expiry_date,
    ];

    return fields.some((field) => String(field ?? '').toLowerCase().includes(query));
  });
}
