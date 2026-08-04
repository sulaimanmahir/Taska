import { buildFinancePageUrl } from './financePageQuery.js';
import { formatDashboardCurrency, formatDashboardDate } from './dashboardFormatters.js';

function formatDashboardBadgeDate(dateString) {
  if (!dateString) {
    return null;
  }

  const parsed = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleDateString('en-NG', {
    month: 'short',
    day: 'numeric',
  });
}

export function getAdasheDashboardState(summary = {}) {
  const dueNow = summary.due_now || 0;
  const dueSoon = summary.due_soon || 0;
  const nextReviewDate = formatDashboardBadgeDate(summary.next_due_date);
  const riskLabel = dueNow > 0 ? 'High urgency' : dueSoon > 0 ? 'Due soon' : 'On schedule';
  const riskTone = dueNow > 0 ? 'amber' : dueSoon > 0 ? 'sky' : 'emerald';

  return {
    statusLabel: dueNow > 0 ? 'Collections need attention' : 'Cycle is on track',
    statusClass: dueNow > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700',
    summaryLabel: dueNow > 0 ? 'Collection urgency' : 'Collection rhythm',
    summaryTone: dueNow > 0 ? 'amber' : 'emerald',
    whatMatters:
      dueNow > 0
        ? `You have ${dueNow} due cycle${dueNow === 1 ? '' : 's'} that can affect payout confidence if collections slip.`
        : 'Contribution cycles are moving well. Keep the next collection date visible and protect the payout schedule.',
    overviewAction: {
      label: 'Open adashe desk',
      to: buildFinancePageUrl('/adashe'),
      tone: 'violet',
    },
    nextMove:
      dueNow > 0
        ? 'Call the due member, log the collection, and confirm the next route before new payout promises are made.'
        : 'Review the next due member, confirm the route plan, and keep weekly collection discipline visible to the team.',
    nextMoveAction: {
      label: dueNow > 0 ? 'Review due cycles' : 'Review next route',
      to: buildFinancePageUrl('/adashe', {
        view: dueNow > 0 ? 'due_now' : 'collecting',
        sort: 'priority',
      }),
      tone: dueNow > 0 ? 'amber' : 'violet',
    },
    overviewSecondaryBadges: [
      { label: riskLabel, tone: riskTone },
      nextReviewDate ? { label: `Review by ${nextReviewDate}`, tone: 'slate' } : null,
    ].filter(Boolean),
    nextMoveSecondaryBadges: [
      dueNow > 0 ? { label: 'Collection first', tone: 'amber' } : { label: 'Route check', tone: 'sky' },
      nextReviewDate ? { label: `Next due ${nextReviewDate}`, tone: 'slate' } : null,
    ].filter(Boolean),
  };
}

export function getTrustFundDashboardState(summary = {}) {
  const overdueAccounts = summary.overdue_accounts || 0;
  const highUtilizationAccounts = summary.high_utilization_accounts || 0;
  const riskLevel = overdueAccounts > 0 ? 'High risk' : highUtilizationAccounts > 0 ? 'Watch closely' : 'Low risk';
  const riskTone = overdueAccounts > 0 ? 'amber' : highUtilizationAccounts > 0 ? 'sky' : 'emerald';
  const leadReviewDate = formatDashboardBadgeDate(summary.lead_review_date);

  return {
    statusLabel: overdueAccounts > 0 ? 'Recoveries need attention' : 'Repayments are moving',
    statusClass: overdueAccounts > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700',
    summaryLabel: overdueAccounts > 0 ? 'Recovery pressure' : 'Recovery rhythm',
    summaryTone: overdueAccounts > 0 ? 'amber' : 'emerald',
    whatMatters:
      overdueAccounts > 0
        ? `You have ${overdueAccounts} overdue trust account${overdueAccounts === 1 ? '' : 's'} tying up recovery momentum and increasing exposure.`
        : highUtilizationAccounts > 0
          ? `${highUtilizationAccounts} active trust account${highUtilizationAccounts === 1 ? '' : 's'} are heavily utilized, so repayments should stay visible before more drawdowns are approved.`
          : 'Trust accounts are recovering in a steady pattern. Keep repayment discipline visible and protect fresh credit from drifting too wide.',
    overviewAction: {
      label: 'Open trust fund desk',
      to: buildFinancePageUrl('/trust-fund', {
        view: overdueAccounts > 0 ? 'overdue' : 'active_balance',
        sort: 'priority',
      }),
      tone: overdueAccounts > 0 ? 'amber' : 'violet',
    },
    nextMove:
      overdueAccounts > 0
        ? 'Start with the most overdue balance, log the repayment conversation, and avoid new exposure until recovery progress is clear.'
        : highUtilizationAccounts > 0
          ? 'Review the most utilized account, confirm the next repayment date, and keep new releases within available headroom.'
          : 'Check the active repayment queue, confirm the next collection touchpoint, and keep the clean accounts ready for disciplined redraws.',
    nextMoveAction: {
      label: overdueAccounts > 0 ? 'Review overdue accounts' : 'Review active balances',
      to: buildFinancePageUrl('/trust-fund', {
        view: overdueAccounts > 0 ? 'overdue' : 'active_balance',
        sort: 'priority',
      }),
      tone: overdueAccounts > 0 ? 'amber' : 'violet',
    },
    overviewSecondaryBadges: [
      { label: riskLevel, tone: riskTone },
      leadReviewDate ? { label: `Review by ${leadReviewDate}`, tone: 'slate' } : null,
    ].filter(Boolean),
    nextMoveSecondaryBadges: [
      overdueAccounts > 0 ? { label: 'Recovery first', tone: 'amber' } : { label: 'Exposure control', tone: 'sky' },
      leadReviewDate ? { label: `Next review ${leadReviewDate}`, tone: 'slate' } : null,
    ].filter(Boolean),
  };
}

export function getCooperativeDashboardState(summary = {}) {
  const pendingApprovals = summary.pending_approvals || 0;
  const pendingProfitCycles = summary.pending_profit_cycles || 0;
  const reviewLabel = pendingApprovals > 0 ? 'Approval first' : pendingProfitCycles > 0 ? 'Distribution next' : 'Treasury stable';
  const reviewTone = pendingApprovals > 0 ? 'amber' : pendingProfitCycles > 0 ? 'sky' : 'emerald';
  const nextDistributionLabel = summary.next_distribution_label ? `Next cycle ${summary.next_distribution_label}` : null;

  return {
    summaryLabel:
      pendingApprovals > 0
        ? 'Approval queue'
        : pendingProfitCycles > 0
          ? 'Distribution review'
          : 'Treasury steady',
    summaryTone:
      pendingApprovals > 0
        ? 'amber'
        : pendingProfitCycles > 0
          ? 'sky'
          : 'emerald',
    whatMatters:
      pendingApprovals > 0
        ? `You have ${pendingApprovals} financing approval item${pendingApprovals === 1 ? '' : 's'} slowing member decisions.`
        : 'Approval flow is clear right now. Keep treasury discipline and member communication visible.',
    overviewAction: {
      label: 'Open cooperative',
      to: '/cooperative',
      tone: pendingApprovals > 0 ? 'sky' : 'emerald',
    },
    nextMove:
      pendingProfitCycles > 0
        ? 'Review the open profit cycle, confirm reserve and charity allocations, and prepare the next distribution resolution.'
        : 'Track active financing performance, keep guarantor follow-up tidy, and maintain healthy reserve coverage.',
    nextMoveAction: {
      label: pendingApprovals > 0 ? 'Open approvals' : 'Review profit cycle',
      to: pendingApprovals > 0 ? '/cooperative?section=financing' : '/cooperative?section=profits',
      tone: pendingApprovals > 0 ? 'amber' : 'violet',
    },
    overviewSecondaryBadges: [
      { label: reviewLabel, tone: reviewTone },
      nextDistributionLabel ? { label: nextDistributionLabel, tone: 'slate' } : null,
    ].filter(Boolean),
    nextMoveSecondaryBadges: [
      pendingApprovals > 0 ? { label: 'Decision queue', tone: 'amber' } : pendingProfitCycles > 0 ? { label: 'Distribution prep', tone: 'sky' } : { label: 'Member follow-up', tone: 'emerald' },
      summary.next_distribution_amount > 0
        ? { label: `Distributable ${Math.round(summary.next_distribution_amount).toLocaleString('en-NG')}`, tone: 'slate' }
        : null,
    ].filter(Boolean),
  };
}

export function getAdasheDashboardWatch(summary = {}, state = {}) {
  return {
    title: 'Adashe Watch',
    subtitle: 'Collection rhythm, payout readiness, and next due cycle at a glance',
    action: {
      to: state?.overviewAction?.to || buildFinancePageUrl('/adashe'),
      label: 'Open adashe',
    },
    metrics: [
      {
        label: 'Member Cycles',
        value: summary.member_accounts || 0,
        helper: `${summary.average_frequency_days || 0} day average cycle`,
        tone: 'violet',
      },
      {
        label: 'Collected Pot',
        value: formatDashboardCurrency(summary.total_collected || 0),
        helper: `${summary.completion_rate || 0}% of target funded`,
        tone: 'emerald',
      },
      {
        label: 'Due Now',
        value: summary.due_now || 0,
        helper: `${summary.due_soon || 0} more due within 48 hours`,
        tone: 'amber',
      },
      {
        label: 'Paid Out',
        value: formatDashboardCurrency(summary.total_paid_out || 0),
        helper: `Target pot ${formatDashboardCurrency(summary.total_target || 0)}`,
        tone: 'sky',
      },
    ],
    spotlight: {
      eyebrow: 'Next due cycle',
      title: summary.lead_cycle_name || 'Contribution cycle',
      description: `${summary.next_due_member || 'No member selected'} is next up on ${formatDashboardDate(summary.next_due_date)}`,
      statusLabel: state?.statusLabel,
      statusClass: state?.statusClass,
    },
  };
}

export function getTrustFundDashboardWatch(summary = {}, state = {}) {
  return {
    title: 'Trust Fund Watch',
    subtitle: 'Exposure, repayment momentum, and overdue recovery visibility',
    action: {
      to: state?.overviewAction?.to || buildFinancePageUrl('/trust-fund'),
      label: 'Open trust fund',
    },
    metrics: [
      {
        label: 'Active Accounts',
        value: summary.active_balance_accounts || 0,
        helper: `${summary.account_count || 0} total trust accounts`,
        tone: 'violet',
      },
      {
        label: 'Outstanding',
        value: formatDashboardCurrency(summary.total_outstanding || 0),
        helper: `Limit base ${formatDashboardCurrency(summary.total_extended || 0)}`,
        tone: 'amber',
      },
      {
        label: 'Overdue',
        value: summary.overdue_accounts || 0,
        helper: `${summary.high_utilization_accounts || 0} highly utilized`,
        tone: 'rose',
      },
      {
        label: 'Recovered',
        value: formatDashboardCurrency(summary.total_collected || 0),
        helper: 'Total repayments logged to date',
        tone: 'emerald',
      },
    ],
    spotlight: {
      eyebrow: 'Recovery focus',
      title: summary.lead_customer_name || 'Trust account review',
      description: summary.lead_customer_name
        ? `${summary.lead_customer_name} currently carries ${formatDashboardCurrency(summary.lead_balance || 0)} outstanding${summary.lead_last_payment_date ? `, last paid on ${formatDashboardDate(summary.lead_last_payment_date)}` : ''}.`
        : 'No outstanding trust balance needs review right now.',
      statusLabel: state?.statusLabel,
      statusClass: state?.statusClass,
    },
  };
}

export function getCooperativeDashboardWatch(summary = {}) {
  return {
    title: 'Cooperative Watch',
    subtitle: 'Treasury health, approval flow, and profit-cycle readiness',
    action: {
      to: '/cooperative',
      label: 'Open cooperative',
    },
    metrics: [
      {
        label: 'Members',
        value: summary.members || 0,
        helper: `${summary.active_financing || 0} active financing lines`,
        tone: 'violet',
      },
      {
        label: 'Main Wallet',
        value: formatDashboardCurrency(summary.main_wallet_balance || 0),
        helper: `Reserve ${formatDashboardCurrency(summary.reserve_wallet_balance || 0)}`,
        tone: 'emerald',
      },
      {
        label: 'Pending Approvals',
        value: summary.pending_approvals || 0,
        helper: `${summary.pending_profit_cycles || 0} profit cycles awaiting action`,
        tone: 'amber',
      },
      {
        label: 'Charity Wallet',
        value: formatDashboardCurrency(summary.charity_wallet_balance || 0),
        helper: `${summary.distributed_cycles || 0} cycles distributed`,
        tone: 'sky',
      },
    ],
    detailTiles: [
      {
        eyebrow: 'Last distribution',
        title: summary.last_distribution_label || 'No distribution yet',
        description: formatDashboardDate(summary.last_distribution_date),
      },
      {
        eyebrow: 'Next profit cycle',
        title: summary.next_distribution_label || 'No open cycle',
        description: summary.next_distribution_label
          ? `${formatDashboardCurrency(summary.next_distribution_amount || 0)} waiting for review`
          : 'Create or approve a cycle to prepare member distributions.',
      },
    ],
  };
}
