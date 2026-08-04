import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCooperativeDashboardMetrics,
  buildCooperativeFinancingPresentation,
  buildCooperativeGovernanceRecordPresentation,
  buildCooperativeGovernanceSnapshot,
  buildCooperativeProfitCyclePresentation,
  buildCooperativeReportCards,
  buildCooperativeShareEntryPresentation,
  buildCooperativeShareOwnership,
  buildCooperativeInvestmentPresentation,
  buildCooperativeMemberPresentation,
  buildCooperativeSettingsSummary,
  buildCooperativeWalletPresentation,
  buildCooperativeWithdrawalPresentation,
  createCooperativeShareSummary,
} from '../src/lib/cooperative.js';
import { formatCurrencyNGN } from '../src/lib/financeFormatters.js';

test('cooperative share ownership aggregates purchases and redemptions by member', () => {
  const ownership = buildCooperativeShareOwnership([
    {
      member_id: 1,
      transaction_type: 'purchase',
      units: 10,
      amount_paid: 10000,
      member: { customer: { name: 'Aisha Traders' } },
    },
    {
      member_id: 1,
      transaction_type: 'redeem',
      units: 2,
      amount_paid: 2000,
      member: { customer: { name: 'Aisha Traders' } },
    },
    {
      member_id: 2,
      transaction_type: 'purchase',
      units: 5,
      amount_paid: 5000,
      member: { customer: { name: 'Bello Foods' } },
    },
  ]);

  assert.equal(ownership.get(1).units, 8);
  assert.equal(ownership.get(1).amount, 12000);
  assert.equal(ownership.get(2).units, 5);
  assert.equal(ownership.get(2).member.customer.name, 'Bello Foods');
});

test('cooperative share summary keeps totals and labels aligned', () => {
  const entries = [
    { member_id: 1, transaction_type: 'purchase', units: 10, amount_paid: 10000 },
    { member_id: 1, transaction_type: 'redeem', units: 2, amount_paid: 2000 },
    { member_id: 2, transaction_type: 'purchase', units: 5, amount_paid: 5000 },
  ];
  const ownership = buildCooperativeShareOwnership(entries);
  const summary = createCooperativeShareSummary({
    shareOwnership: ownership,
    entries,
    sharePrice: 1500,
  });

  assert.equal(summary.totalOwnedShares, 13);
  assert.equal(summary.treasuryFromShares, 17000);
  assert.equal(summary.sharePriceLabel, formatCurrencyNGN(1500));
});

test('cooperative share entry presentation formats member, activity, and amount clearly', () => {
  const presentation = buildCooperativeShareEntryPresentation({
    member: { customer: { name: 'Aisha Traders' } },
    transaction_type: 'share_purchase',
    issued_at: '2026-05-25',
    units: 6,
    amount_paid: 9000,
  });

  assert.equal(presentation.memberName, 'Aisha Traders');
  assert.equal(presentation.meta, 'share purchase | 25 May 2026');
  assert.equal(presentation.unitsLabel, '6 shares');
  assert.equal(presentation.amountLabel, formatCurrencyNGN(9000));
});

test('cooperative financing presentation keeps guarantors and status actions aligned', () => {
  const presentation = buildCooperativeFinancingPresentation({
    member: { customer: { name: 'Musa Retail' } },
    financing_type: 'qard_hasan',
    business_description: '',
    status: 'active_repayment',
    amount_requested: 30000,
    repayment_due_date: '2026-06-15',
    guarantors: [
      {
        id: 11,
        guarantor_member_id: 4,
        status: 'pending',
        member: { customer: { name: 'Amina Support' } },
      },
      {
        id: 12,
        guarantor_member_id: 5,
        status: 'approved',
        member: { customer: { name: 'Bello Backup' } },
      },
    ],
  });

  assert.equal(presentation.title, 'Musa Retail | qard hasan');
  assert.equal(presentation.description, 'No business description yet.');
  assert.equal(presentation.statusLabel, 'active repayment');
  assert.equal(presentation.amountLabel, formatCurrencyNGN(30000));
  assert.equal(presentation.dueDateLabel, '15 Jun 2026');
  assert.equal(presentation.guarantors[0].pending, true);
  assert.equal(presentation.guarantors[1].statusLabel, 'approved');
  assert.deepEqual(
    presentation.statusActions.map((item) => item.status),
    ['approved', 'disbursed', 'active_repayment', 'repaid', 'closed'],
  );
});

test('cooperative profit cycle presentation limits preview rows and formats values', () => {
  const presentation = buildCooperativeProfitCyclePresentation({
    label: 'May Cycle',
    cycle_start: '2026-05-01',
    cycle_end: '2026-05-31',
    distributable_profit: 42000,
    status: 'ready',
    distributions: [
      { id: 1, member: { customer: { name: 'A' } }, amount: 1000 },
      { id: 2, member: { customer: { name: 'B' } }, amount: 2000 },
      { id: 3, member: { customer: { name: 'C' } }, amount: 3000 },
      { id: 4, member: { customer: { name: 'D' } }, amount: 4000 },
      { id: 5, member: { customer: { name: 'E' } }, amount: 5000 },
    ],
  });

  assert.equal(presentation.label, 'May Cycle');
  assert.equal(presentation.dateRangeLabel, '1 May 2026 - 31 May 2026');
  assert.equal(presentation.distributableProfitLabel, formatCurrencyNGN(42000));
  assert.equal(presentation.statusLabel, 'ready');
  assert.equal(presentation.distributionsPreview.length, 4);
  assert.deepEqual(
    presentation.distributionsPreview.map((item) => item.memberName),
    ['A', 'B', 'C', 'D'],
  );
});

test('cooperative dashboard helpers keep metrics, wallets, and governance snapshot aligned', () => {
  const metrics = buildCooperativeDashboardMetrics({
    members: 12,
    members_with_shares: 9,
    wallet_balance: 88000,
    share_price: 1500,
    active_financing: 4,
    pending_admin_approvals: 2,
    profit_distributed: 12000,
    pending_withdrawals: 3,
  });
  const wallet = buildCooperativeWalletPresentation({
    id: 7,
    wallet_type: 'reserve_fund',
    balance: 25000,
    locked_balance: 5000,
  });
  const snapshot = buildCooperativeGovernanceSnapshot({
    sharia_notes: '',
    brandingSettings: { branding_tier: 'premium' },
  });

  assert.equal(metrics[0].helper, '9 funded by shares');
  assert.equal(metrics[1].value, formatCurrencyNGN(88000));
  assert.equal(metrics[2].helper, '2 pending admin approval');
  assert.equal(wallet.label, 'reserve fund');
  assert.equal(wallet.balanceLabel, formatCurrencyNGN(25000));
  assert.equal(wallet.lockedBalanceLabel, formatCurrencyNGN(5000));
  assert.equal(snapshot.shariaNotes, 'No compliance note yet.');
  assert.equal(snapshot.brandingTier, 'premium');
});

test('cooperative withdrawal, governance, and report helpers format owner-facing cards safely', () => {
  const withdrawal = buildCooperativeWithdrawalPresentation({
    member: { customer: { name: 'Aisha Traders' } },
    withdrawal_type: 'profit_withdrawal',
    status: 'pending_review',
    amount: 3200,
  });
  const record = buildCooperativeGovernanceRecordPresentation({
    title: 'Monthly audit',
    record_type: 'audit',
    status: 'scheduled',
    record_date: '2026-05-25',
    summary: 'Review reserve and charity allocations.',
  });
  const reportCards = buildCooperativeReportCards({
    treasury_balance: 42000,
    active_members: 19,
    current_value: 15000,
  });

  assert.equal(withdrawal.memberName, 'Aisha Traders');
  assert.equal(withdrawal.meta, 'profit withdrawal | pending review');
  assert.equal(withdrawal.amountLabel, formatCurrencyNGN(3200));
  assert.equal(record.meta, 'audit | scheduled | 25 May 2026');
  assert.equal(record.summary, 'Review reserve and charity allocations.');
  assert.deepEqual(reportCards, [
    { key: 'treasury_balance', label: 'treasury balance', value: formatCurrencyNGN(42000) },
    { key: 'active_members', label: 'active members', value: '19' },
    { key: 'current_value', label: 'current value', value: formatCurrencyNGN(15000) },
  ]);
});

test('cooperative member, investment, and settings helpers keep remaining cards aligned', () => {
  const member = buildCooperativeMemberPresentation({
    customer: { name: 'Aisha Traders' },
    role: 'treasurer',
    joined_at: '2026-05-25',
    member_number: 'TC-004',
  });
  const investment = buildCooperativeInvestmentPresentation({
    name: 'Rice pool',
    category: 'halal_trade',
    status: 'active',
    amount: 22000,
    current_value: 24500,
  });
  const settings = buildCooperativeSettingsSummary({
    name: 'Coorperative',
    profit_cycle: 'monthly',
    share_price: 1500,
    minimum_member_shares: 3,
    loanSettings: {
      required_guarantors: 2,
      min_shares_per_guarantor: 4,
      min_combined_guarantor_shares: 8,
      borrower_min_shares: 3,
    },
  });

  assert.equal(member.name, 'Aisha Traders');
  assert.equal(member.meta, 'treasurer | Joined 25 May 2026');
  assert.equal(member.memberNumber, 'TC-004');
  assert.equal(investment.meta, 'halal trade | active');
  assert.equal(investment.amountLabel, formatCurrencyNGN(22000));
  assert.equal(investment.currentValueLabel, formatCurrencyNGN(24500));
  assert.deepEqual(settings.coreSetup, [
    { label: 'Name', value: 'Coorperative' },
    { label: 'Profit cycle', value: 'monthly' },
    { label: 'Share price', value: formatCurrencyNGN(1500) },
    { label: 'Minimum member shares', value: '3' },
  ]);
  assert.deepEqual(settings.qardHasanRules, [
    { label: 'Required guarantors', value: '2' },
    { label: 'Min shares per guarantor', value: '4' },
    { label: 'Combined guarantor shares', value: '8' },
    { label: 'Borrower minimum shares', value: '3' },
  ]);
});
