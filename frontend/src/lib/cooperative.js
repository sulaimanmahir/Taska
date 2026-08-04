import { formatCurrencyNGN, formatShortDate } from './financeFormatters.js';

const cooperativeFinancingStatuses = ['approved', 'disbursed', 'active_repayment', 'repaid', 'closed'];

function formatCooperativeLabel(value, fallback = 'Not set') {
  if (!value) {
    return fallback;
  }

  return String(value).replace(/_/g, ' ');
}

function shouldFormatCooperativeReportCurrency(key, value) {
  return typeof value === 'number' && (key.includes('balance') || key.includes('profit') || key.includes('value'));
}

export function buildCooperativeDashboardMetrics(summary = {}) {
  return [
    {
      label: 'Members',
      value: summary?.members || 0,
      helper: `${summary?.members_with_shares || 0} funded by shares`,
      tone: 'violet',
    },
    {
      label: 'Wallet Balance',
      value: formatCurrencyNGN(summary?.wallet_balance || 0),
      helper: `Share price ${formatCurrencyNGN(summary?.share_price || 0)}`,
      tone: 'emerald',
    },
    {
      label: 'Active Financing',
      value: summary?.active_financing || 0,
      helper: `${summary?.pending_admin_approvals || 0} pending admin approval`,
      tone: 'amber',
    },
    {
      label: 'Profit Distributed',
      value: formatCurrencyNGN(summary?.profit_distributed || 0),
      helper: `${summary?.pending_withdrawals || 0} pending withdrawals`,
      tone: 'sky',
    },
  ];
}

export function buildCooperativeWalletPresentation(wallet) {
  return {
    id: wallet?.id,
    label: formatCooperativeLabel(wallet?.wallet_type, 'wallet'),
    balanceLabel: formatCurrencyNGN(wallet?.balance || 0),
    lockedBalanceLabel: formatCurrencyNGN(wallet?.locked_balance || 0),
  };
}

export function buildCooperativeGovernanceSnapshot(cooperative = {}) {
  return {
    shariaNotes: cooperative?.sharia_notes || 'No compliance note yet.',
    brandingTier: cooperative?.brandingSettings?.branding_tier || 'basic',
  };
}

export function buildCooperativeMemberPresentation(member) {
  return {
    name: member?.customer?.name || member?.member_number || 'Member',
    meta: `${formatCooperativeLabel(member?.role, 'member')} | Joined ${formatShortDate(member?.joined_at)}`,
    memberNumber: member?.member_number || 'No member number',
  };
}

export function buildCooperativeShareOwnership(entries = []) {
  return entries.reduce((map, entry) => {
    const current = map.get(entry.member_id) || { units: 0, amount: 0, member: entry.member };
    const direction = entry.transaction_type === 'redeem' ? -1 : 1;

    current.units += direction * Number(entry.units || 0);
    current.amount += Number(entry.amount_paid || 0);
    current.member = entry.member;

    map.set(entry.member_id, current);
    return map;
  }, new Map());
}

export function createCooperativeShareSummary({
  shareOwnership,
  entries = [],
  sharePrice = 0,
} = {}) {
  const ownershipMap = shareOwnership instanceof Map
    ? shareOwnership
    : buildCooperativeShareOwnership(entries);

  return {
    totalOwnedShares: Array.from(ownershipMap.values()).reduce((sum, item) => sum + Number(item.units || 0), 0),
    treasuryFromShares: entries.reduce((sum, item) => sum + Number(item.amount_paid || 0), 0),
    sharePriceLabel: formatCurrencyNGN(sharePrice),
  };
}

export function buildCooperativeShareEntryPresentation(entry) {
  return {
    memberName: entry?.member?.customer?.name || 'Member',
    meta: `${formatCooperativeLabel(entry?.transaction_type, 'activity')} | ${formatShortDate(entry?.issued_at)}`,
    unitsLabel: `${Number(entry?.units || 0)} shares`,
    amountLabel: formatCurrencyNGN(entry?.amount_paid || 0),
  };
}

export function buildCooperativeFinancingPresentation(item) {
  return {
    title: `${item?.member?.customer?.name || 'Member'} | ${formatCooperativeLabel(item?.financing_type, 'financing')}`,
    description: item?.business_description || 'No business description yet.',
    statusLabel: formatCooperativeLabel(item?.status, 'pending'),
    amountLabel: formatCurrencyNGN(item?.amount_requested || item?.capital_amount || item?.cooperative_capital || 0),
    dueDateLabel: formatShortDate(item?.repayment_due_date || item?.submitted_at),
    guarantors: (item?.guarantors || []).map((guarantor) => ({
      id: guarantor.id,
      memberName: guarantor?.member?.customer?.name || 'Guarantor',
      guarantorMemberId: guarantor?.guarantor_member_id,
      status: guarantor?.status || 'pending',
      statusLabel: formatCooperativeLabel(guarantor?.status, 'pending'),
      pending: guarantor?.status === 'pending',
    })),
    statusActions: cooperativeFinancingStatuses.map((status) => ({
      status,
      label: `Mark ${formatCooperativeLabel(status)}`,
    })),
  };
}

export function buildCooperativeProfitCyclePresentation(cycle) {
  return {
    label: cycle?.label || 'Profit cycle',
    dateRangeLabel: `${formatShortDate(cycle?.cycle_start)} - ${formatShortDate(cycle?.cycle_end)}`,
    distributableProfitLabel: formatCurrencyNGN(cycle?.distributable_profit || 0),
    statusLabel: cycle?.status || 'draft',
    distributionsPreview: (cycle?.distributions || []).slice(0, 4).map((distribution) => ({
      id: distribution.id,
      memberName: distribution?.member?.customer?.name || 'Member',
      amountLabel: formatCurrencyNGN(distribution?.amount || 0),
    })),
  };
}

export function buildCooperativeInvestmentPresentation(investment) {
  return {
    name: investment?.name || 'Investment',
    meta: `${formatCooperativeLabel(investment?.category, 'investment')} | ${formatCooperativeLabel(investment?.status, 'draft')}`,
    amountLabel: formatCurrencyNGN(investment?.amount || 0),
    currentValueLabel: formatCurrencyNGN(investment?.current_value || investment?.amount || 0),
  };
}

export function buildCooperativeWithdrawalPresentation(item) {
  return {
    memberName: item?.member?.customer?.name || 'Member',
    meta: `${formatCooperativeLabel(item?.withdrawal_type, 'withdrawal')} | ${formatCooperativeLabel(item?.status, 'pending')}`,
    amountLabel: formatCurrencyNGN(item?.amount || 0),
  };
}

export function buildCooperativeGovernanceRecordPresentation(record) {
  return {
    title: record?.title || 'Governance record',
    meta: `${formatCooperativeLabel(record?.record_type, 'record')} | ${formatCooperativeLabel(record?.status, 'scheduled')} | ${formatShortDate(record?.record_date)}`,
    summary: record?.summary || '',
  };
}

export function buildCooperativeReportCards(reportData = {}) {
  return Object.entries(reportData).map(([key, value]) => ({
    key,
    label: formatCooperativeLabel(key),
    value: shouldFormatCooperativeReportCurrency(key, value) ? formatCurrencyNGN(value) : String(value),
  }));
}

export function buildCooperativeSettingsSummary(cooperative = {}) {
  return {
    coreSetup: [
      { label: 'Name', value: cooperative?.name || 'Not set' },
      { label: 'Profit cycle', value: cooperative?.profit_cycle || 'Not set' },
      { label: 'Share price', value: formatCurrencyNGN(cooperative?.share_price || 0) },
      { label: 'Minimum member shares', value: String(cooperative?.minimum_member_shares ?? 'Not set') },
    ],
    qardHasanRules: [
      { label: 'Required guarantors', value: String(cooperative?.loanSettings?.required_guarantors ?? 'Not set') },
      { label: 'Min shares per guarantor', value: String(cooperative?.loanSettings?.min_shares_per_guarantor ?? 'Not set') },
      { label: 'Combined guarantor shares', value: String(cooperative?.loanSettings?.min_combined_guarantor_shares ?? 'Not set') },
      { label: 'Borrower minimum shares', value: String(cooperative?.loanSettings?.borrower_min_shares ?? 'Not set') },
    ],
  };
}
