import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildComplaintQueueCards,
  buildDeliveryComplaintPayload,
  buildDeliveryDeliverPayload,
  buildDeliveryDisputePayload,
  buildDeliveryHeroAside,
  buildDeliveryFailPayload,
  buildDeliveryManifestPayload,
  buildInvestorPayoutCards,
  buildManifestCandidateCards,
  buildDeliveryOverviewMetrics,
  buildDeliveryOrderPresentation,
  buildDeliveryOtpPayload,
  buildDeliveryPickupPayload,
  buildDeliveryRemittancePayload,
  buildManifestSummaryCard,
  buildRiderScorecardCards,
  buildRemittanceHistoryCard,
  buildRouteEfficiencyCards,
  buildDeliveryRequestPayload,
  buildDeliverySettlementPayload,
  buildDeliveryVehiclePayload,
  buildWalletActivityCards,
  calculateDeliveryChargePreview,
  calculateDeliveryRemittanceDue,
  createDeliveryActionState,
  createDeliveryManifestForm,
  createDeliveryRequestForm,
  createDeliveryVehicleForm,
  formatDeliveryStatus,
} from '../src/lib/deliveries.js';
import { formatCurrencyNGN } from '../src/lib/financeFormatters.js';

test('delivery helpers preserve default forms and status formatting', () => {
  assert.equal(formatDeliveryStatus('pending_pickup'), 'pending pickup');

  assert.deepEqual(createDeliveryRequestForm(), {
    parcel_category: 'Parcel',
    pricing_model: 'distance',
    distance_km: '8',
    base_fee: '2500',
    distance_fee: '1000',
    urgent_fee: '0',
    cod_amount: '0',
    pickup_address: '15 Ahmadu Bello Way, Kaduna',
    dropoff_address: '7 Ali Akilu Road, Kaduna',
    sender_name: 'Amina Musa',
    sender_phone: '08030000001',
    recipient_name: 'Sani Bello',
    recipient_phone: '08030000002',
  });

  assert.deepEqual(createDeliveryVehicleForm(), {
    vehicle_type: 'motorcycle',
    ownership_model: 'company_owned',
    owner_name: 'Taska Fleet',
    purchase_value: '950000',
    fuel_responsibility: 'company',
    maintenance_responsibility: 'company',
    plate_number: '',
  });

  assert.deepEqual(createDeliveryManifestForm(), {
    title: 'Morning Dispatch Wave',
    status: 'draft',
    notes: '',
  });

  assert.deepEqual(createDeliveryActionState(), {
    proof_url: '',
    notes: '',
    failed_delivery_reason: 'Recipient unavailable',
    amount_remitted: '',
    otp_code: '',
    fuel_deduction: '0',
    maintenance_deduction: '0',
    dispute_category: 'damaged_parcel',
    dispute_summary: '',
    complaint_category: 'late_delivery',
    complaint_summary: '',
  });
});

test('delivery overview helpers keep courier metrics and charge previews aligned', () => {
  assert.equal(calculateDeliveryChargePreview({
    base_fee: '2500',
    distance_fee: '1000',
    urgent_fee: '500',
  }), 4000);

  assert.deepEqual(buildDeliveryOverviewMetrics({
    pickups_pending: 6,
    in_transit: 9,
    rider_payouts_pending: 15000,
    investor_payouts_pending: 25000,
    fraud_alerts: 2,
    ageing_parcels: 4,
  }, {
    routeEfficiency: { assigned_jobs: 20, delivered_jobs: 15 },
    walletBalances: [{ id: 1 }, { id: 2 }],
  }, formatCurrencyNGN), [
    { label: 'Pickups Pending', value: 6, helper: 'Awaiting rider collection.', tone: 'amber' },
    { label: 'In Transit', value: 9, helper: 'Active route workload.', tone: 'sky' },
    { label: 'Rider Payouts', value: formatCurrencyNGN(15000), helper: 'Not yet paid out.', tone: 'violet' },
    { label: 'Investor Payouts', value: formatCurrencyNGN(25000), helper: 'Owner-side obligations.', tone: 'emerald' },
    { label: 'Fraud Alerts', value: 2, helper: 'COD exceptions that need review.', tone: 'rose' },
    { label: 'Ageing Parcels', value: 4, helper: 'Parcels older than 24 hours.', tone: 'orange' },
    { label: 'Manifest Delivery Rate', value: '75%', helper: 'Delivered jobs from the active manifest pool.', tone: 'cyan' },
    { label: 'Wallet Balances', value: 2, helper: 'Riders with payout balance history.', tone: 'indigo' },
  ]);

  assert.equal(
    buildDeliveryHeroAside({ pending_remittance: 18000 }, 5, formatCurrencyNGN),
    `Pending remittance ${formatCurrencyNGN(18000)} | Active fleet 5`,
  );

  assert.equal(calculateDeliveryRemittanceDue({
    cod_amount: 12000,
    amount_remitted: 3000,
  }), 9000);
});

test('delivery summary presenters keep manifests and remittance history readable', () => {
  assert.deepEqual(buildManifestSummaryCard({
    id: 7,
    title: 'Evening Wave',
    manifest_code: 'MNF-007',
    orders: [{ id: 1 }, { id: 2 }],
    status: 'in_progress',
  }), {
    id: 7,
    title: 'Evening Wave',
    metaLabel: 'MNF-007 - 2 jobs',
    statusLabel: 'in progress',
  });

  assert.deepEqual(buildRemittanceHistoryCard({
    id: 9,
    order: { tracking_code: 'DLV-902' },
    notes: 'COD remitted at close of shift.',
    user: { name: 'Rider A' },
  }), {
    id: 9,
    title: 'DLV-902',
    notesLabel: 'COD remitted at close of shift.',
    actorLabel: 'Rider A',
  });
});

test('delivery dashboard presenters keep scorecards, queues, and manifest candidates readable', () => {
  assert.deepEqual(buildRiderScorecardCards([{
    assigned_rider_id: 5,
    rider_name: 'Rider One',
    delivered_jobs: 8,
    failed_jobs: 1,
    total_jobs: 10,
    remittance_due: 12500,
  }], formatCurrencyNGN), [{
    id: '5-Rider One',
    riderName: 'Rider One',
    jobsLabel: '8 delivered - 1 failed',
    totalJobsLabel: '10 jobs',
    remittanceLabel: `Remittance due ${formatCurrencyNGN(12500)}`,
  }]);

  assert.deepEqual(buildInvestorPayoutCards([{
    owner_name: 'Investor A',
    routed_revenue: 45000,
    payout_due: 9000,
  }], formatCurrencyNGN), [{
    id: 'Investor A',
    ownerName: 'Investor A',
    revenueLabel: `Revenue routed ${formatCurrencyNGN(45000)}`,
    payoutLabel: formatCurrencyNGN(9000),
  }]);

  assert.deepEqual(buildWalletActivityCards([{
    id: 1,
    rider: { name: 'Rider A' },
    reason: 'Weekly payout',
    amount: 7000,
  }], formatCurrencyNGN), [{
    id: 1,
    riderName: 'Rider A',
    reasonLabel: 'Weekly payout',
    amountLabel: formatCurrencyNGN(7000),
  }]);

  assert.deepEqual(buildComplaintQueueCards([{
    id: 4,
    order: { tracking_code: 'DLV-004' },
    summary: 'Parcel came late',
    status: 'open_case',
  }]), [{
    id: 4,
    trackingCode: 'DLV-004',
    summary: 'Parcel came late',
    statusLabel: 'open case',
  }]);

  assert.deepEqual(buildRouteEfficiencyCards({
    manifest_count: 3,
    assigned_jobs: 11,
    delivered_jobs: 9,
  }), [
    { label: 'Manifest Count', value: 3 },
    { label: 'Assigned Jobs', value: 11 },
    { label: 'Delivered via Manifest', value: 9 },
  ]);

  assert.deepEqual(buildManifestCandidateCards([{
    id: 12,
    tracking_code: 'DLV-012',
    sender: { name: 'Amina' },
    recipient: { name: 'Sani' },
    status: 'pending_pickup',
  }], [12]), [{
    id: 12,
    trackingCode: 'DLV-012',
    contactLabel: 'Amina to Sani',
    statusLabel: 'pending pickup',
    isSelected: true,
  }]);
});

test('delivery payload builders normalize request, vehicle, manifest, and action data consistently', () => {
  assert.deepEqual(buildDeliveryRequestPayload({
    parcel_category: 'Food',
    pricing_model: 'distance',
    distance_km: '12',
    base_fee: '3000',
    distance_fee: '1500',
    urgent_fee: '500',
    cod_amount: '8000',
    pickup_address: 'Pickup',
    dropoff_address: 'Dropoff',
    sender_name: 'Amina',
    sender_phone: '0803',
    recipient_name: 'Sani',
    recipient_phone: '0804',
  }, false), {
    parcel_category: 'Food',
    pricing_model: 'distance',
    distance_km: 12,
    base_fee: 3000,
    distance_fee: 1500,
    urgent_fee: 500,
    cod_amount: 8000,
    pickup_address: 'Pickup',
    dropoff_address: 'Dropoff',
    sender: { name: 'Amina', phone: '0803', address: 'Pickup' },
    recipient: { name: 'Sani', phone: '0804', address: 'Dropoff' },
    offline: { created_offline: true },
  });

  assert.deepEqual(buildDeliveryVehiclePayload({
    vehicle_type: 'van',
    ownership_model: 'investor_owned',
    owner_name: 'Taska Fleet',
    purchase_value: '1500000',
    fuel_responsibility: 'owner',
    maintenance_responsibility: 'company',
    plate_number: '',
  }), {
    vehicle_type: 'van',
    ownership_model: 'investor_owned',
    owner_name: 'Taska Fleet',
    purchase_value: 1500000,
    fuel_responsibility: 'owner',
    maintenance_responsibility: 'company',
    plate_number: null,
    is_active: true,
  });

  assert.deepEqual(buildDeliveryManifestPayload({
    title: 'Wave',
    status: 'draft',
    notes: 'Fragile',
  }, [4, 8]), {
    title: 'Wave',
    status: 'draft',
    notes: 'Fragile',
    delivery_order_ids: [4, 8],
  });

  const actionState = {
    proof_url: 'https://proof',
    notes: '',
    failed_delivery_reason: '',
    amount_remitted: '6000',
    otp_code: '9988',
    fuel_deduction: '500',
    maintenance_deduction: '250',
    dispute_category: 'cash_shortage',
    dispute_summary: 'Short by 500',
    complaint_category: 'late_delivery',
    complaint_summary: 'Reached after closing time',
  };

  assert.deepEqual(buildDeliveryPickupPayload(actionState), {
    proof_url: 'https://proof',
    notes: 'Parcel collected from sender.',
  });
  assert.deepEqual(buildDeliveryDeliverPayload(actionState, { amount_remitted: 0 }), {
    proof_url: 'https://proof',
    notes: 'Parcel delivered successfully.',
    amount_remitted: 6000,
  });
  assert.deepEqual(buildDeliveryFailPayload(actionState), {
    failed_delivery_reason: 'Delivery attempt failed.',
  });
  assert.deepEqual(buildDeliveryRemittancePayload(actionState, { cod_amount: 9000 }), {
    amount_remitted: 6000,
    notes: 'COD remittance reconciled.',
    proof_url: 'https://proof',
  });
  assert.deepEqual(buildDeliveryOtpPayload(actionState), { otp_code: '9988' });
  assert.deepEqual(buildDeliverySettlementPayload(actionState), {
    fuel_deduction: 500,
    maintenance_deduction: 250,
    status: 'approved',
  });
  assert.deepEqual(buildDeliveryDisputePayload(actionState), {
    category: 'cash_shortage',
    summary: 'Short by 500',
  });
  assert.deepEqual(buildDeliveryComplaintPayload(actionState), {
    source: 'internal',
    category: 'late_delivery',
    summary: 'Reached after closing time',
  });
});

test('delivery order presentation keeps action-state decisions and settlement summaries aligned', () => {
  assert.deepEqual(buildDeliveryOrderPresentation({
    id: 11,
    tracking_code: 'DLV-011',
    parcel_category: 'Parcel',
    sender: { name: 'Amina' },
    recipient: { name: 'Sani' },
    pickup_address: 'Pickup',
    dropoff_address: 'Dropoff',
    total_fee: 4500,
    cod_amount: 12000,
    amount_remitted: 2000,
    status: 'delivered',
    delivery_otp_verified_at: null,
    settlement: {
      status: 'approved',
      net_rider_payout: 1500,
      net_owner_payout: 900,
      company_retained_earnings: 2100,
    },
    complaints: [{ id: 1, category: 'late_delivery', summary: 'Delayed' }],
  }, [{ id: 3, delivery_order_id: 11, category: 'damaged_parcel', summary: 'Box crushed' }], formatCurrencyNGN), {
    id: 11,
    trackingCode: 'DLV-011',
    parcelCategory: 'Parcel',
    contactLabel: 'Amina to Sani',
    routeLabel: 'Pickup to Dropoff',
    chargeLabel: formatCurrencyNGN(4500),
    remittanceDueLabel: formatCurrencyNGN(10000),
    remittanceDue: 10000,
    statusLabel: 'delivered',
    settlementStatusLabel: 'approved',
    hasSettlement: true,
    settlementSummary: [
      {
        label: 'Rider Payout',
        value: formatCurrencyNGN(1500),
        toneClassName: 'bg-emerald-50 text-emerald-900',
        accentClassName: 'text-emerald-700',
      },
      {
        label: 'Investor Payout',
        value: formatCurrencyNGN(900),
        toneClassName: 'bg-blue-50 text-blue-900',
        accentClassName: 'text-blue-700',
      },
      {
        label: 'Company Retained',
        value: formatCurrencyNGN(2100),
        toneClassName: 'bg-violet-50 text-violet-900',
        accentClassName: 'text-violet-700',
      },
    ],
    disputeCards: [{ id: 3, categoryLabel: 'damaged parcel', summary: 'Box crushed' }],
    complaintCards: [{ id: 1, categoryLabel: 'late delivery', summary: 'Delayed' }],
    canMarkPickup: false,
    canMarkDelivered: false,
    canRecordFailure: false,
    canReconcileRemittance: true,
    canConfirmOtp: true,
    canCreateSettlement: false,
    canMarkSettlementPaid: true,
  });
});
