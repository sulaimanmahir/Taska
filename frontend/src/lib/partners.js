import { formatCurrencyNGN, formatShortDate } from './financeFormatters.js';

const PARTNER_TIER_BADGES = {
  bronze: 'bg-amber-100 text-amber-700 border-amber-200',
  silver: 'bg-slate-100 text-slate-700 border-slate-200',
  gold: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  platinum: 'bg-zinc-100 text-zinc-700 border-zinc-200',
};

const PARTNER_STATUS_BADGES = {
  active: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  suspended: 'bg-rose-100 text-rose-700',
  terminated: 'bg-slate-100 text-slate-700',
  approved: 'bg-sky-100 text-sky-700',
  paid: 'bg-emerald-100 text-emerald-700',
  processing: 'bg-blue-100 text-blue-700',
  failed: 'bg-rose-100 text-rose-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-100 text-slate-700',
};

export const partnerTabs = [
  { id: 'agents', label: 'Partners' },
  { id: 'commissions', label: 'Commissions' },
  { id: 'payouts', label: 'Payouts' },
];

export const partnerAgentTypeOptions = [
  { value: 'affiliate', label: 'Affiliate' },
  { value: 'introducer', label: 'Introducer' },
  { value: 'reseller', label: 'Reseller' },
];

export const partnerStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'terminated', label: 'Terminated' },
];

export const partnerCommissionStatusOptions = [
  { value: 'pending', label: 'Pending approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const partnerCommissionTypeOptions = [
  { value: 'first_purchase', label: 'First purchase' },
  { value: 'recurring', label: 'Recurring' },
  { value: 'bonus', label: 'Bonus' },
];

export const partnerPayoutStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const partnerPaymentMethodOptions = [
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'wallet', label: 'Wallet' },
];

export function getPartnerTierBadge(tier) {
  return PARTNER_TIER_BADGES[tier] || PARTNER_TIER_BADGES.bronze;
}

export function getPartnerStatusBadge(status) {
  return PARTNER_STATUS_BADGES[status] || 'bg-slate-100 text-slate-700';
}

export function createPartnerForm() {
  return {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    agent_type: 'affiliate',
  };
}

export function createPartnerProfileForm(agent = {}) {
  return {
    payment_method: agent.payment_method || 'bank_transfer',
    bank_name: agent.bank_name || '',
    account_number: '',
    account_name: agent.account_name || '',
    bank_code: agent.bank_code || '',
  };
}

export function createPartnerPayoutForm(agentId = '') {
  return {
    agent_id: agentId ? String(agentId) : '',
    amount: '',
  };
}

export function buildPartnerPayload(form = {}) {
  return {
    first_name: String(form.first_name || '').trim(),
    last_name: String(form.last_name || '').trim(),
    email: normalizeNullableField(form.email),
    phone: normalizeNullableField(form.phone),
    agent_type: form.agent_type || 'affiliate',
  };
}

export function buildPartnerProfilePayload(form = {}) {
  const paymentMethod = form.payment_method || 'bank_transfer';

  return {
    payment_method: paymentMethod,
    bank_name: paymentMethod === 'wallet' ? null : normalizeNullableField(form.bank_name),
    account_number: paymentMethod === 'wallet' ? null : normalizeNullableField(form.account_number),
    account_name: paymentMethod === 'wallet' ? null : normalizeNullableField(form.account_name),
    bank_code: paymentMethod === 'wallet' ? null : normalizeNullableField(form.bank_code),
  };
}

export function buildPartnerPayoutPayload(form = {}) {
  return {
    agent_id: Number(form.agent_id),
    amount: Number(form.amount),
  };
}

export function buildPartnerMetrics(stats = {}, formatCurrency = formatCurrencyNGN) {
  return [
    {
      label: 'Total Partners',
      value: (stats.total_agents || 0).toLocaleString(),
      helper: 'Partner accounts linked to this business',
      tone: 'violet',
    },
    {
      label: 'Active',
      value: (stats.active_agents || 0).toLocaleString(),
      helper: 'Partners already approved and live',
      tone: 'emerald',
    },
    {
      label: 'Total Earned',
      value: formatCurrency(stats.total_commissions || 0),
      helper: 'Commissions generated so far',
      tone: 'sky',
    },
    {
      label: 'Pending Payouts',
      value: formatCurrency(stats.pending_payouts || 0),
      helper: 'Cash still waiting to be released',
      tone: 'amber',
    },
    {
      label: 'Total Paid',
      value: formatCurrency(stats.total_paid || 0),
      helper: 'Payouts already completed',
      tone: 'fuchsia',
    },
  ];
}

export function filterPartnerAgents(agents = [], search = '', status = '') {
  const normalizedSearch = String(search || '').trim().toLowerCase();

  return agents.filter((agent) => {
    if (status && agent.status !== status) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    const haystack = [
      agent.full_name,
      agent.email,
      agent.phone,
      agent.referral_code,
      agent.agent_type,
      agent.tier,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedSearch);
  });
}

export function buildPartnerTierCard(tier = {}) {
  const minReferrals = Number(tier.min_referrals || 0);
  const maxReferrals = tier.max_referrals ?? null;
  const tierKey = tier.slug || tier.name?.toLowerCase() || 'bronze';

  return {
    id: tier.id || tier.slug || tier.name,
    name: tier.name || 'Partner tier',
    slug: tier.slug || '',
    tierBadgeClassName: getPartnerTierBadge(tierKey),
    rangeLabel: maxReferrals === null
      ? `${minReferrals}+ referrals`
      : `${minReferrals}-${maxReferrals} referrals`,
    commissionRateLabel: `${Number(tier.commission_rate || 0)}% one-time`,
    recurringRateLabel: `${Number(tier.recurring_rate || 0)}% recurring`,
  };
}

export function buildPartnerAgentRow(
  agent = {},
  { approvingAgentId = null } = {},
  formatCurrency = formatCurrencyNGN,
  formatDate = formatShortDate,
) {
  const recentCommissions = Array.isArray(agent.commissions) ? agent.commissions : [];
  const paymentMethodLabel = agent.payment_method
    ? agent.payment_method.replace(/_/g, ' ')
    : 'Not configured';

  return {
    id: agent.id,
    fullName: agent.full_name,
    contactLabel: [agent.email, agent.phone].filter(Boolean).join(' | ') || 'No contact detail',
    referralCodeLabel: agent.referral_code ? `Code ${agent.referral_code}` : 'Referral code pending',
    agentTypeLabel: agent.agent_type,
    tierLabel: agent.tier,
    tierBadgeClassName: getPartnerTierBadge(agent.tier),
    statusLabel: agent.status,
    statusBadgeClassName: getPartnerStatusBadge(agent.status),
    totalEarningsLabel: formatCurrency(agent.total_earnings),
    pendingPayoutLabel: formatCurrency(agent.pending_payout),
    totalPaidLabel: formatCurrency(agent.total_paid),
    paymentMethodLabel,
    accountLabel: agent.account_name || agent.account_number || 'No payout profile yet',
    joinedAtLabel: formatDate(agent.created_at, 'No date'),
    approvedAtLabel: formatDate(agent.approved_at, 'Not approved'),
    recentCommissionCountLabel: `${recentCommissions.length} recent commission${recentCommissions.length === 1 ? '' : 's'}`,
    isPendingApproval: agent.status === 'pending',
    isApproving: approvingAgentId === agent.id,
  };
}

export function buildPartnerCommissionRow(
  commission = {},
  { approvingId = null } = {},
  formatCurrency = formatCurrencyNGN,
  formatDate = formatShortDate,
) {
  return {
    id: commission.id,
    agentId: commission.agent?.id ?? commission.agent_id ?? null,
    agentName: commission.agent?.name || 'Partner agent',
    businessAndTypeLabel: `${commission.referred_business?.name || 'Referred business'} | ${commission.type?.replace(/_/g, ' ') || 'commission'}`,
    metaLabel: `Rate ${commission.rate_applied}% | ${formatDate(commission.created_at, 'No date')}`,
    descriptionLabel: commission.description || 'No extra commission note',
    amountLabel: formatCurrency(commission.amount),
    statusLabel: commission.status,
    statusBadgeClassName: getPartnerStatusBadge(commission.status),
    isPendingApproval: commission.status === 'pending',
    isApproving: approvingId === commission.id,
  };
}

export function buildPartnerPayoutRow(
  payout = {},
  { processingId = null } = {},
  formatCurrency = formatCurrencyNGN,
  formatDate = formatShortDate,
) {
  return {
    id: payout.id,
    agentId: payout.agent?.id ?? payout.agent_id ?? null,
    payoutNumber: payout.payout_number,
    agentName: payout.agent?.name || 'Partner agent',
    createdAtLabel: formatDate(payout.created_at, 'No date'),
    processedAtLabel: formatDate(payout.processed_at, 'Not processed'),
    amountLabel: formatCurrency(payout.amount),
    feesLabel: formatCurrency(payout.fees),
    netAmountLabel: formatCurrency(payout.net_amount),
    statusLabel: payout.status,
    statusBadgeClassName: getPartnerStatusBadge(payout.status),
    paymentMethodLabel: payout.payment_method?.replace(/_/g, ' ') || 'Not specified',
    accountLabel: payout.account_name || payout.account_number || 'No account detail',
    failureReasonLabel: payout.failure_reason || '',
    gatewayReferenceLabel: payout.gateway_reference || 'No gateway reference',
    isPendingProcess: payout.status === 'pending',
    isProcessing: processingId === payout.id,
  };
}

function normalizeNullableField(value) {
  const normalized = String(value || '').trim();
  return normalized ? normalized : null;
}
