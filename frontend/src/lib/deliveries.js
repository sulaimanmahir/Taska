import { formatCurrencyNGN } from './financeFormatters.js';

export function formatDeliveryStatus(status) {
  return (status ?? '').replaceAll('_', ' ');
}

export function createDeliveryRequestForm() {
  return {
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
  };
}

export function createDeliveryVehicleForm() {
  return {
    vehicle_type: 'motorcycle',
    ownership_model: 'company_owned',
    owner_name: 'Taska Fleet',
    purchase_value: '950000',
    fuel_responsibility: 'company',
    maintenance_responsibility: 'company',
    plate_number: '',
  };
}

export function createDeliveryManifestForm() {
  return {
    title: 'Morning Dispatch Wave',
    status: 'draft',
    notes: '',
  };
}

export function createDeliveryActionState() {
  return {
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
  };
}

export function buildDeliveryRequestPayload(form = {}, isOnline = true) {
  return {
    parcel_category: form.parcel_category,
    pricing_model: form.pricing_model,
    distance_km: Number(form.distance_km || 0),
    base_fee: Number(form.base_fee || 0),
    distance_fee: Number(form.distance_fee || 0),
    urgent_fee: Number(form.urgent_fee || 0),
    cod_amount: Number(form.cod_amount || 0),
    pickup_address: form.pickup_address,
    dropoff_address: form.dropoff_address,
    sender: {
      name: form.sender_name,
      phone: form.sender_phone,
      address: form.pickup_address,
    },
    recipient: {
      name: form.recipient_name,
      phone: form.recipient_phone,
      address: form.dropoff_address,
    },
    offline: {
      created_offline: !isOnline,
    },
  };
}

export function buildDeliveryVehiclePayload(form = {}) {
  return {
    vehicle_type: form.vehicle_type,
    ownership_model: form.ownership_model,
    owner_name: form.owner_name,
    purchase_value: Number(form.purchase_value || 0),
    fuel_responsibility: form.fuel_responsibility,
    maintenance_responsibility: form.maintenance_responsibility,
    plate_number: form.plate_number || null,
    is_active: true,
  };
}

export function buildDeliveryManifestPayload(form = {}, deliveryOrderIds = []) {
  return {
    ...form,
    delivery_order_ids: deliveryOrderIds,
  };
}

export function calculateDeliveryChargePreview(form = {}) {
  return Number(form.base_fee || 0) + Number(form.distance_fee || 0) + Number(form.urgent_fee || 0);
}

export function calculateDeliveryRemittanceDue(delivery = {}) {
  return Math.max(Number(delivery.cod_amount ?? 0) - Number(delivery.amount_remitted ?? 0), 0);
}

export function buildDeliveryOverviewMetrics(
  summary = {},
  { routeEfficiency = {}, walletBalances = [] } = {},
  formatCurrency = formatCurrencyNGN,
) {
  const deliveryRate = routeEfficiency.assigned_jobs
    ? Math.round(((routeEfficiency.delivered_jobs ?? 0) / routeEfficiency.assigned_jobs) * 100)
    : 0;

  return [
    { label: 'Pickups Pending', value: summary.pickups_pending ?? 0, helper: 'Awaiting rider collection.', tone: 'amber' },
    { label: 'In Transit', value: summary.in_transit ?? 0, helper: 'Active route workload.', tone: 'sky' },
    { label: 'Rider Payouts', value: formatCurrency(summary.rider_payouts_pending), helper: 'Not yet paid out.', tone: 'violet' },
    { label: 'Investor Payouts', value: formatCurrency(summary.investor_payouts_pending), helper: 'Owner-side obligations.', tone: 'emerald' },
    { label: 'Fraud Alerts', value: summary.fraud_alerts ?? 0, helper: 'COD exceptions that need review.', tone: 'rose' },
    { label: 'Ageing Parcels', value: summary.ageing_parcels ?? 0, helper: 'Parcels older than 24 hours.', tone: 'orange' },
    { label: 'Manifest Delivery Rate', value: `${deliveryRate}%`, helper: 'Delivered jobs from the active manifest pool.', tone: 'cyan' },
    { label: 'Wallet Balances', value: walletBalances.length, helper: 'Riders with payout balance history.', tone: 'indigo' },
  ];
}

export function buildDeliveryHeroAside(summary = {}, activeFleet = 0, formatCurrency = formatCurrencyNGN) {
  return `Pending remittance ${formatCurrency(summary.pending_remittance)} | Active fleet ${activeFleet}`;
}

export function buildManifestSummaryCard(manifest = {}) {
  return {
    id: manifest.id,
    title: manifest.title,
    metaLabel: `${manifest.manifest_code} - ${manifest.orders?.length ?? 0} jobs`,
    statusLabel: formatDeliveryStatus(manifest.status),
  };
}

export function buildRemittanceHistoryCard(entry = {}) {
  return {
    id: entry.id,
    title: entry.order?.tracking_code,
    notesLabel: entry.notes,
    actorLabel: entry.user?.name ?? 'System',
  };
}

export function buildRiderScorecardCards(
  riderScorecards = [],
  formatCurrency = formatCurrencyNGN,
) {
  return riderScorecards.map((rider) => ({
    id: `${rider.assigned_rider_id}-${rider.rider_name}`,
    riderName: rider.rider_name,
    jobsLabel: `${rider.delivered_jobs} delivered - ${rider.failed_jobs} failed`,
    totalJobsLabel: `${rider.total_jobs} jobs`,
    remittanceLabel: `Remittance due ${formatCurrency(rider.remittance_due)}`,
  }));
}

export function buildInvestorPayoutCards(
  investorPayouts = [],
  formatCurrency = formatCurrencyNGN,
) {
  return investorPayouts.map((investor) => ({
    id: investor.owner_name,
    ownerName: investor.owner_name,
    revenueLabel: `Revenue routed ${formatCurrency(investor.routed_revenue)}`,
    payoutLabel: formatCurrency(investor.payout_due),
  }));
}

export function buildWalletActivityCards(
  walletActivity = [],
  formatCurrency = formatCurrencyNGN,
) {
  return walletActivity.slice(0, 5).map((entry) => ({
    id: entry.id,
    riderName: entry.rider?.name ?? 'Unassigned rider',
    reasonLabel: entry.reason,
    amountLabel: formatCurrency(entry.amount),
  }));
}

export function buildComplaintQueueCards(complaints = []) {
  return complaints.slice(0, 5).map((complaint) => ({
    id: complaint.id,
    trackingCode: complaint.order?.tracking_code,
    summary: complaint.summary,
    statusLabel: formatDeliveryStatus(complaint.status),
  }));
}

export function buildRouteEfficiencyCards(routeEfficiency = {}) {
  return [
    {
      label: 'Manifest Count',
      value: routeEfficiency.manifest_count ?? 0,
    },
    {
      label: 'Assigned Jobs',
      value: routeEfficiency.assigned_jobs ?? 0,
    },
    {
      label: 'Delivered via Manifest',
      value: routeEfficiency.delivered_jobs ?? 0,
    },
  ];
}

export function buildManifestCandidateCards(
  manifestCandidates = [],
  selectedManifestOrders = [],
) {
  return manifestCandidates.slice(0, 8).map((candidate) => ({
    id: candidate.id,
    trackingCode: candidate.tracking_code,
    contactLabel: `${candidate.sender?.name} to ${candidate.recipient?.name}`,
    statusLabel: formatDeliveryStatus(candidate.status),
    isSelected: selectedManifestOrders.includes(candidate.id),
  }));
}

export function buildDeliveryOrderPresentation(
  delivery = {},
  disputes = [],
  formatCurrency = formatCurrencyNGN,
) {
  const remittanceDue = calculateDeliveryRemittanceDue(delivery);
  const hasSettlement = Boolean(delivery.settlement);

  return {
    id: delivery.id,
    trackingCode: delivery.tracking_code,
    parcelCategory: delivery.parcel_category,
    contactLabel: `${delivery.sender?.name} to ${delivery.recipient?.name}`,
    routeLabel: `${delivery.pickup_address} to ${delivery.dropoff_address}`,
    chargeLabel: formatCurrency(delivery.total_fee),
    remittanceDueLabel: formatCurrency(remittanceDue),
    remittanceDue,
    statusLabel: formatDeliveryStatus(delivery.status),
    settlementStatusLabel: hasSettlement ? formatDeliveryStatus(delivery.settlement.status) : 'not created',
    hasSettlement,
    settlementSummary: hasSettlement
      ? [
          {
            label: 'Rider Payout',
            value: formatCurrency(delivery.settlement.net_rider_payout),
            toneClassName: 'bg-emerald-50 text-emerald-900',
            accentClassName: 'text-emerald-700',
          },
          {
            label: 'Investor Payout',
            value: formatCurrency(delivery.settlement.net_owner_payout),
            toneClassName: 'bg-blue-50 text-blue-900',
            accentClassName: 'text-blue-700',
          },
          {
            label: 'Company Retained',
            value: formatCurrency(delivery.settlement.company_retained_earnings),
            toneClassName: 'bg-violet-50 text-violet-900',
            accentClassName: 'text-violet-700',
          },
        ]
      : [],
    disputeCards: disputes
      .filter((dispute) => dispute.delivery_order_id === delivery.id)
      .map((dispute) => ({
        id: dispute.id,
        categoryLabel: formatDeliveryStatus(dispute.category),
        summary: dispute.summary,
      })),
    complaintCards: (delivery.complaints ?? []).map((complaint) => ({
      id: complaint.id,
      categoryLabel: formatDeliveryStatus(complaint.category),
      summary: complaint.summary,
    })),
    canMarkPickup: delivery.status === 'pending_pickup',
    canMarkDelivered: ['picked_up', 'in_transit', 'rescheduled'].includes(delivery.status),
    canRecordFailure: ['picked_up', 'in_transit', 'rescheduled'].includes(delivery.status),
    canReconcileRemittance: delivery.status === 'delivered' && remittanceDue > 0,
    canConfirmOtp: delivery.status === 'delivered' && !delivery.delivery_otp_verified_at,
    canCreateSettlement: delivery.status === 'delivered' && !hasSettlement,
    canMarkSettlementPaid: hasSettlement && delivery.settlement.status !== 'paid',
  };
}

export function buildDeliveryPickupPayload(actionState = {}) {
  return {
    proof_url: actionState.proof_url || undefined,
    notes: actionState.notes || 'Parcel collected from sender.',
  };
}

export function buildDeliveryDeliverPayload(actionState = {}, delivery = {}) {
  return {
    proof_url: actionState.proof_url || undefined,
    notes: actionState.notes || 'Parcel delivered successfully.',
    amount_remitted: Number(actionState.amount_remitted || delivery.amount_remitted || 0),
  };
}

export function buildDeliveryFailPayload(actionState = {}) {
  return {
    failed_delivery_reason: actionState.failed_delivery_reason || 'Delivery attempt failed.',
  };
}

export function buildDeliveryRemittancePayload(actionState = {}, delivery = {}) {
  return {
    amount_remitted: Number(actionState.amount_remitted || delivery.cod_amount || 0),
    notes: actionState.notes || 'COD remittance reconciled.',
    proof_url: actionState.proof_url || undefined,
  };
}

export function buildDeliveryOtpPayload(actionState = {}) {
  return {
    otp_code: actionState.otp_code,
  };
}

export function buildDeliverySettlementPayload(actionState = {}) {
  return {
    fuel_deduction: Number(actionState.fuel_deduction || 0),
    maintenance_deduction: Number(actionState.maintenance_deduction || 0),
    status: 'approved',
  };
}

export function buildDeliveryDisputePayload(actionState = {}) {
  return {
    category: actionState.dispute_category,
    summary: actionState.dispute_summary,
  };
}

export function buildDeliveryComplaintPayload(actionState = {}) {
  return {
    source: 'internal',
    category: actionState.complaint_category,
    summary: actionState.complaint_summary,
  };
}
