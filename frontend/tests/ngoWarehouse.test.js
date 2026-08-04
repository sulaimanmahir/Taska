import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildNgoDeskMetrics,
  buildNgoDistributionCard,
  buildNgoInventoryCard,
  buildNgoDistributionPayload,
  buildNgoOverviewMetrics,
  buildNgoPartnerRequestCard,
  createNgoDistributionForm,
  createNgoDonorForm,
  createNgoRequestForm,
  createNgoSignatureForm,
  filterNgoDistributions,
  filterNgoInventory,
  filterNgoRequests,
} from '../src/lib/ngoWarehouse.js';

test('warehouse form factories return stable release-workflow defaults', () => {
  assert.deepEqual(createNgoDonorForm(), {
    name: 'Relief Support Network',
    contact_person: 'Amina Yusuf',
    phone: '08030000000',
    compliance_reference: 'REL-2026-001',
  });
  assert.deepEqual(createNgoRequestForm(), {
    partner_name: 'Mercy Relief',
    request_notes: 'Emergency food support for displaced households.',
    needed_by: new Date().toISOString().slice(0, 10),
    status: 'pending',
  });
  assert.deepEqual(createNgoDistributionForm(), {
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
  });
  assert.deepEqual(createNgoSignatureForm(), {
    distribution_id: '',
    beneficiary_name: '',
    signed_by: '',
    signature_reference: '',
  });
});

test('warehouse overview metrics keep accountability cards aligned', () => {
  assert.deepEqual(buildNgoOverviewMetrics({
    donor_sources: 6,
    partner_requests_pending: 4,
    distributions_today: 3,
    expiry_alerts: 2,
  }, false), [
    {
      label: 'Sources',
      value: 6,
      helper: 'Approved stock sources tracked for clean warehouse accountability and audit clarity.',
      tone: 'violet',
    },
    {
      label: 'Pending Requests',
      value: 4,
      helper: 'Requests still waiting for warehouse review or release planning.',
      tone: 'amber',
    },
    {
      label: 'Distributions Today',
      value: 3,
      helper: 'Stock releases already logged in the current operating day.',
      tone: 'sky',
    },
    {
      label: 'Expiry Alerts',
      value: 2,
      helper: 'Expiry-sensitive items currently needing warehouse attention.',
      tone: 'rose',
    },
  ]);

  assert.equal(buildNgoOverviewMetrics({}, true)[0].value, '...');
  assert.deepEqual(
    buildNgoDeskMetrics(
      {
        donor_sources: 6,
        partner_requests_pending: 4,
        distributions_today: 3,
        expiry_alerts: 2,
        signatures_pending: 2,
        stock_accountability_gap: 1,
      },
      [{ id: 1, status: 'pending' }],
      [{ id: 1, signatures: [] }],
      [{ id: 7 }],
      false,
    ).slice(4),
    [
      {
        label: 'Pending Signatures',
        value: 2,
        helper: 'Releases already sent out but still missing signed beneficiary confirmation for audit closure.',
        tone: 'amber',
      },
      {
        label: 'Active Requests',
        value: 1,
        helper: 'Partner requests still sitting inside the active warehouse pipeline.',
        tone: 'sky',
      },
      {
        label: 'Stock Visibility Gaps',
        value: 1,
        helper: 'Inventory lines that still need tighter reference or movement accountability.',
        tone: 'rose',
      },
    ],
  );
});

test('warehouse distribution payload helper normalizes item quantity and nullable links', () => {
  assert.deepEqual(buildNgoDistributionPayload({
    partner_request_id: '',
    donor_source_id: '8',
    beneficiary_name: 'Amina Yusuf',
    destination_location: '',
    driver_name: 'Bello',
    vehicle_reference: '',
    status: 'draft',
    distributed_on: '2026-05-25',
    item_product_id: '17',
    item_quantity: '42.5',
  }), {
    partner_request_id: null,
    donor_source_id: '8',
    beneficiary_name: 'Amina Yusuf',
    destination_location: null,
    driver_name: 'Bello',
    vehicle_reference: null,
    status: 'draft',
    distributed_on: '2026-05-25',
    items: [
      {
        product_id: '17',
        quantity: 42.5,
      },
    ],
  });
});

test('warehouse presenters keep request and distribution feed labels readable', () => {
  assert.deepEqual(buildNgoPartnerRequestCard({
    id: 3,
    partner_name: 'Mercy Relief',
    request_reference: 'REQ-003',
    status: 'pending',
    needed_by: '2026-06-01',
  }), {
    id: 3,
    title: 'Mercy Relief',
    detailLabel: 'REQ-003 - pending',
    neededByLabel: '2026-06-01',
    notesLabel: 'No request notes captured',
  });

  assert.deepEqual(buildNgoDistributionCard({
    id: 4,
    distribution_reference: 'DIST-004',
    beneficiary_name: 'Musa Garba',
    destination_location: 'Kebbi camp',
    status: 'dispatched',
    distributed_on: '2026-05-25',
    items: [{ id: 1 }, { id: 2 }],
    signatures: [{ id: 1 }, { id: 2 }],
  }), {
    id: 4,
    title: 'DIST-004',
    detailLabel: 'Musa Garba - 2 signature(s)',
    destinationLabel: 'Kebbi camp',
    statusLabel: 'dispatched',
    distributedOnLabel: '2026-05-25',
    itemCountLabel: '2 release items',
  });

  assert.deepEqual(buildNgoInventoryCard({
    id: 7,
    product: { name: 'Rice', sku: 'RIC-01' },
    warehouse: { name: 'Central Warehouse' },
    quantity: 42,
    reorder_level: 20,
    expiry_date: '2026-06-30',
  }), {
    id: 7,
    title: 'Rice',
    warehouseLabel: 'Central Warehouse',
    quantityLabel: '42 available',
    reorderLabel: 'Reorder level 20',
    expiryLabel: '2026-06-30',
  });

  assert.deepEqual(filterNgoRequests([
    { id: 1, partner_name: 'Mercy Relief', request_reference: 'REQ-001', status: 'pending', request_notes: 'Food kits' },
    { id: 2, partner_name: 'Hope Aid', request_reference: 'REQ-002', status: 'approved', request_notes: 'Shelter materials' },
  ], 'shelter').map((entry) => entry.id), [2]);

  assert.deepEqual(filterNgoDistributions([
    { id: 1, distribution_reference: 'DIST-001', beneficiary_name: 'Musa', destination_location: 'Abuja', status: 'draft', items: [] },
    { id: 2, distribution_reference: 'DIST-002', beneficiary_name: 'Amina', destination_location: 'Kebbi camp', status: 'dispatched', items: [{ product: { name: 'Rice' } }] },
  ], 'rice').map((entry) => entry.id), [2]);

  assert.deepEqual(filterNgoInventory([
    { id: 1, product: { name: 'Rice', sku: 'RIC-01' }, warehouse: { name: 'Central Warehouse' } },
    { id: 2, product: { name: 'Beans', sku: 'BEA-02' }, warehouse: { name: 'Field Depot' } },
  ], 'field').map((entry) => entry.id), [2]);
});
