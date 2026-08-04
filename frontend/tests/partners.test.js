import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPartnerAgentRow,
  buildPartnerCommissionRow,
  buildPartnerMetrics,
  buildPartnerPayload,
  buildPartnerPayoutPayload,
  buildPartnerPayoutRow,
  buildPartnerProfilePayload,
  buildPartnerTierCard,
  createPartnerForm,
  createPartnerPayoutForm,
  createPartnerProfileForm,
  filterPartnerAgents,
  getPartnerStatusBadge,
  getPartnerTierBadge,
  partnerAgentTypeOptions,
  partnerTabs,
} from '../src/lib/partners.js';
import { formatCurrencyNGN, formatShortDate } from '../src/lib/financeFormatters.js';

test('partner tabs, agent types, and badge helpers stay aligned with the page sections', () => {
  assert.deepEqual(partnerTabs, [
    { id: 'agents', label: 'Partners' },
    { id: 'commissions', label: 'Commissions' },
    { id: 'payouts', label: 'Payouts' },
  ]);

  assert.deepEqual(partnerAgentTypeOptions, [
    { value: 'affiliate', label: 'Affiliate' },
    { value: 'introducer', label: 'Introducer' },
    { value: 'reseller', label: 'Reseller' },
  ]);

  assert.equal(getPartnerTierBadge('gold'), 'bg-yellow-100 text-yellow-700 border-yellow-200');
  assert.equal(getPartnerTierBadge('missing'), 'bg-amber-100 text-amber-700 border-amber-200');
  assert.equal(getPartnerStatusBadge('processing'), 'bg-blue-100 text-blue-700');
  assert.equal(getPartnerStatusBadge('missing'), 'bg-slate-100 text-slate-700');
});

test('partner forms and payload builders normalize registration, payout profile, and payout creation data', () => {
  assert.deepEqual(createPartnerForm(), {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    agent_type: 'affiliate',
  });

  assert.deepEqual(createPartnerProfileForm({
    payment_method: 'wallet',
    bank_name: 'Zenith Bank',
    account_name: 'Amina Bello',
    bank_code: '057',
  }), {
    payment_method: 'wallet',
    bank_name: 'Zenith Bank',
    account_number: '',
    account_name: 'Amina Bello',
    bank_code: '057',
  });

  assert.deepEqual(createPartnerPayoutForm('9'), {
    agent_id: '9',
    amount: '',
  });

  assert.deepEqual(buildPartnerPayload({
    first_name: '  Amina ',
    last_name: ' Bello  ',
    email: '  amina@example.com ',
    phone: ' ',
    agent_type: 'reseller',
  }), {
    first_name: 'Amina',
    last_name: 'Bello',
    email: 'amina@example.com',
    phone: null,
    agent_type: 'reseller',
  });

  assert.deepEqual(buildPartnerProfilePayload({
    payment_method: 'bank_transfer',
    bank_name: ' Access Bank ',
    account_number: ' 0123456789 ',
    account_name: ' Amina Bello ',
    bank_code: ' 044 ',
  }), {
    payment_method: 'bank_transfer',
    bank_name: 'Access Bank',
    account_number: '0123456789',
    account_name: 'Amina Bello',
    bank_code: '044',
  });

  assert.deepEqual(buildPartnerProfilePayload({
    payment_method: 'wallet',
    bank_name: 'Ignore me',
    account_number: '123',
    account_name: 'Ignore me',
    bank_code: '044',
  }), {
    payment_method: 'wallet',
    bank_name: null,
    account_number: null,
    account_name: null,
    bank_code: null,
  });

  assert.deepEqual(buildPartnerPayoutPayload({
    agent_id: '7',
    amount: '45000',
  }), {
    agent_id: 7,
    amount: 45000,
  });
});

test('partner metrics, tiers, and filtering make the growth desk readable', () => {
  assert.deepEqual(buildPartnerMetrics({
    total_agents: 18,
    active_agents: 9,
    total_commissions: 125000,
    pending_payouts: 40000,
    total_paid: 85000,
  }, formatCurrencyNGN), [
    {
      label: 'Total Partners',
      value: '18',
      helper: 'Partner accounts linked to this business',
      tone: 'violet',
    },
    {
      label: 'Active',
      value: '9',
      helper: 'Partners already approved and live',
      tone: 'emerald',
    },
    {
      label: 'Total Earned',
      value: formatCurrencyNGN(125000),
      helper: 'Commissions generated so far',
      tone: 'sky',
    },
    {
      label: 'Pending Payouts',
      value: formatCurrencyNGN(40000),
      helper: 'Cash still waiting to be released',
      tone: 'amber',
    },
    {
      label: 'Total Paid',
      value: formatCurrencyNGN(85000),
      helper: 'Payouts already completed',
      tone: 'fuchsia',
    },
  ]);

  assert.deepEqual(buildPartnerTierCard({
    id: 3,
    name: 'Gold',
    slug: 'gold',
    min_referrals: 11,
    max_referrals: null,
    commission_rate: 15,
    recurring_rate: 5,
  }), {
    id: 3,
    name: 'Gold',
    slug: 'gold',
    tierBadgeClassName: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    rangeLabel: '11+ referrals',
    commissionRateLabel: '15% one-time',
    recurringRateLabel: '5% recurring',
  });

  assert.deepEqual(filterPartnerAgents([
    {
      id: 1,
      full_name: 'Amina Bello',
      email: 'amina@example.com',
      phone: '0801',
      referral_code: 'RS100',
      agent_type: 'affiliate',
      tier: 'silver',
      status: 'active',
    },
    {
      id: 2,
      full_name: 'Grace Musa',
      email: 'grace@example.com',
      phone: '0802',
      referral_code: 'RS200',
      agent_type: 'reseller',
      tier: 'gold',
      status: 'pending',
    },
  ], 'grace', 'pending').map((agent) => agent.id), [2]);
});

test('partner row presenters keep agent, commission, and payout cards readable', () => {
  assert.deepEqual(buildPartnerAgentRow({
    id: 4,
    full_name: 'Amina Bello',
    email: 'amina@example.com',
    phone: '0801 000 0000',
    referral_code: 'RS400',
    agent_type: 'affiliate',
    tier: 'silver',
    status: 'pending',
    payment_method: 'bank_transfer',
    account_name: 'Amina Bello',
    total_earnings: 50000,
    pending_payout: 12000,
    total_paid: 38000,
    approved_at: '2026-05-30',
    created_at: '2026-05-21',
    commissions: [{ id: 1 }, { id: 2 }],
  }, { approvingAgentId: 4 }, formatCurrencyNGN, formatShortDate), {
    id: 4,
    fullName: 'Amina Bello',
    contactLabel: 'amina@example.com | 0801 000 0000',
    referralCodeLabel: 'Code RS400',
    agentTypeLabel: 'affiliate',
    tierLabel: 'silver',
    tierBadgeClassName: 'bg-slate-100 text-slate-700 border-slate-200',
    statusLabel: 'pending',
    statusBadgeClassName: 'bg-amber-100 text-amber-700',
    totalEarningsLabel: formatCurrencyNGN(50000),
    pendingPayoutLabel: formatCurrencyNGN(12000),
    totalPaidLabel: formatCurrencyNGN(38000),
    paymentMethodLabel: 'bank transfer',
    accountLabel: 'Amina Bello',
    joinedAtLabel: formatShortDate('2026-05-21', 'No date'),
    approvedAtLabel: formatShortDate('2026-05-30', 'Not approved'),
    recentCommissionCountLabel: '2 recent commissions',
    isPendingApproval: true,
    isApproving: true,
  });

  assert.deepEqual(buildPartnerCommissionRow({
    id: 7,
    agent: { id: 4, name: 'Grace Musa' },
    referred_business: { name: 'Taska Foods' },
    type: 'recurring',
    rate_applied: 12,
    created_at: '2026-05-26',
    amount: 18000,
    description: 'May renewal payout',
    status: 'pending',
  }, { approvingId: 7 }, formatCurrencyNGN, formatShortDate), {
    id: 7,
    agentId: 4,
    agentName: 'Grace Musa',
    businessAndTypeLabel: 'Taska Foods | recurring',
    metaLabel: `Rate 12% | ${formatShortDate('2026-05-26', 'No date')}`,
    descriptionLabel: 'May renewal payout',
    amountLabel: formatCurrencyNGN(18000),
    statusLabel: 'pending',
    statusBadgeClassName: 'bg-amber-100 text-amber-700',
    isPendingApproval: true,
    isApproving: true,
  });

  assert.deepEqual(buildPartnerPayoutRow({
    id: 10,
    agent: { id: 4, name: 'Grace Musa' },
    payout_number: 'PAY-1004',
    created_at: '2026-05-25',
    processed_at: '2026-05-26',
    amount: 25000,
    fees: 500,
    net_amount: 24500,
    payment_method: 'bank_transfer',
    account_name: 'Grace Musa',
    gateway_reference: 'trx_123',
    failure_reason: '',
    status: 'processing',
  }, { processingId: 10 }, formatCurrencyNGN, formatShortDate), {
    id: 10,
    agentId: 4,
    payoutNumber: 'PAY-1004',
    agentName: 'Grace Musa',
    createdAtLabel: formatShortDate('2026-05-25', 'No date'),
    processedAtLabel: formatShortDate('2026-05-26', 'Not processed'),
    amountLabel: formatCurrencyNGN(25000),
    feesLabel: formatCurrencyNGN(500),
    netAmountLabel: formatCurrencyNGN(24500),
    statusLabel: 'processing',
    statusBadgeClassName: 'bg-blue-100 text-blue-700',
    paymentMethodLabel: 'bank transfer',
    accountLabel: 'Grace Musa',
    failureReasonLabel: '',
    gatewayReferenceLabel: 'trx_123',
    isPendingProcess: false,
    isProcessing: true,
  });
});
