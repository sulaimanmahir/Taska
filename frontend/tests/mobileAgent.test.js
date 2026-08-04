import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildMobileAgentDeskMetrics,
  buildMobileAgentFloatApprovalPayload,
  buildMobileAgentFloatRequestItem,
  buildMobileAgentFloatRequestPayload,
  buildMobileAgentFraudAlertItem,
  buildMobileAgentOverviewMetrics,
  buildMobileAgentRankingItem,
  buildMobileAgentReversalItem,
  buildMobileAgentShortageItem,
  buildMobileAgentShortagePayload,
  buildMobileAgentTierItem,
  buildMobileAgentTierPayload,
  buildMobileAgentTransactionItem,
  buildMobileAgentTransactionPayload,
  createMobileAgentFloatForm,
  createMobileAgentReversalForm,
  createMobileAgentShortageForm,
  createMobileAgentTierForm,
  createMobileAgentTransactionForm,
  filterMobileAgentFloatRequests,
  filterMobileAgentFraudAlerts,
  filterMobileAgentShortages,
  filterMobileAgentTransactions,
} from '../src/lib/mobileAgent.js';
import { formatCurrencyNGN } from '../src/lib/financeFormatters.js';

test('mobile agent form factories return clean default states', () => {
  assert.deepEqual(createMobileAgentTierForm(), {
    name: '',
    service_type: 'transfer',
    minimum_volume: 0,
    maximum_volume: '',
    commission_rate: '',
    flat_bonus: '',
  });
  assert.deepEqual(createMobileAgentFloatForm(), { agent_name: '', requested_amount: '', reason: '' });
  assert.deepEqual(createMobileAgentTransactionForm(), {
    agent_name: '',
    service_type: 'transfer',
    transaction_amount: '',
    cash_delta: '',
    float_delta: '',
    commission_tier_id: '',
    notes: '',
  });
  assert.deepEqual(createMobileAgentReversalForm(), { mobile_agent_transaction_id: '', reason: '' });
  assert.deepEqual(createMobileAgentShortageForm(), {
    agent_name: '',
    shortage_amount: '',
    recovered_amount: '',
    reason: '',
  });
});

test('mobile agent overview metrics keep finance and alert values aligned', () => {
  const metrics = buildMobileAgentOverviewMetrics({
    volume_today: 850000,
    commissions_today: 46000,
    float_requests_pending: 3,
    fraud_alerts_open: 2,
  });

  assert.deepEqual(metrics[0], {
    label: 'Volume Today',
    value: formatCurrencyNGN(850000),
    tone: 'sky',
  });
  assert.equal(metrics[1].value, formatCurrencyNGN(46000));
  assert.equal(metrics[2].value, 3);

  const deskMetrics = buildMobileAgentDeskMetrics(
    {
      volume_today: 850000,
      commissions_today: 46000,
      float_requests_pending: 3,
      fraud_alerts_open: 2,
    },
    [{ id: 1, status: 'pending' }],
    [{ id: 1, service_type: 'transfer' }, { id: 2, service_type: 'cash_out' }],
    [{ id: 1, status: 'open' }],
    [{ id: 9 }],
  );

  assert.equal(deskMetrics[4].value, 1);
  assert.equal(deskMetrics[5].value, 1);
  assert.equal(deskMetrics[6].value, 1);
  assert.equal(deskMetrics[7].value, 1);
});

test('mobile agent payload helpers normalize numeric and nullable fields consistently', () => {
  assert.deepEqual(buildMobileAgentTierPayload({
    name: 'Transfer Gold',
    service_type: 'transfer',
    minimum_volume: '500000',
    maximum_volume: '',
    commission_rate: '1.5',
    flat_bonus: '250',
  }), {
    name: 'Transfer Gold',
    service_type: 'transfer',
    minimum_volume: 500000,
    maximum_volume: null,
    commission_rate: 1.5,
    flat_bonus: 250,
  });

  assert.deepEqual(buildMobileAgentFloatRequestPayload({
    agent_name: 'Aisha',
    requested_amount: '120000',
    reason: 'Morning demand',
  }), {
    agent_name: 'Aisha',
    requested_amount: 120000,
    reason: 'Morning demand',
  });

  assert.deepEqual(buildMobileAgentFloatApprovalPayload({ requested_amount: 120000 }), {
    approved_amount: 120000,
  });

  assert.deepEqual(buildMobileAgentTransactionPayload({
    agent_name: 'Aisha',
    service_type: 'cash_out',
    transaction_amount: '45000',
    cash_delta: '-45000',
    float_delta: '45000',
    commission_tier_id: '',
    notes: 'Busy market run',
  }), {
    agent_name: 'Aisha',
    service_type: 'cash_out',
    transaction_amount: 45000,
    cash_delta: -45000,
    float_delta: 45000,
    commission_tier_id: null,
    notes: 'Busy market run',
  });

  assert.deepEqual(buildMobileAgentShortagePayload({
    agent_name: 'Aisha',
    shortage_amount: '18000',
    recovered_amount: '5000',
    reason: 'End-of-day mismatch',
  }), {
    agent_name: 'Aisha',
    shortage_amount: 18000,
    recovered_amount: 5000,
    reason: 'End-of-day mismatch',
  });
});

test('mobile agent presenters keep rankings, requests, and risk items readable', () => {
  assert.deepEqual(buildMobileAgentRankingItem({
    agent_name: 'Kabiru',
    commission: 12500,
    transactions_count: 18,
    volume: 620000,
  }, 1), {
    key: 'Kabiru',
    label: '2. Kabiru',
    commissionLabel: formatCurrencyNGN(12500),
    meta: `18 transactions | volume ${formatCurrencyNGN(620000)}`,
  });

  assert.deepEqual(buildMobileAgentFloatRequestItem({
    id: 4,
    agent_name: 'Maryam',
    status: 'pending',
    requested_amount: 90000,
    reason: 'Morning demand',
  }), {
    id: 4,
    agentName: 'Maryam',
    status: 'pending',
    requestedAmountLabel: `${formatCurrencyNGN(90000)} requested`,
    reasonLabel: 'Morning demand',
  });

  assert.deepEqual(buildMobileAgentTierItem({
    id: 5,
    name: 'Airtime Boost',
    service_type: 'airtime',
    commission_rate: 2,
    flat_bonus: 100,
  }), {
    id: 5,
    name: 'Airtime Boost',
    meta: `airtime | 2% + ${formatCurrencyNGN(100)}`,
  });

  assert.deepEqual(buildMobileAgentReversalItem({
    id: 6,
    status: 'open',
    amount: 12000,
    transaction: { transaction_reference: 'TRX-101' },
  }), {
    id: 6,
    reference: 'TRX-101',
    meta: `open | ${formatCurrencyNGN(12000)}`,
  });

  assert.deepEqual(buildMobileAgentShortageItem({
    id: 7,
    agent_name: 'Kabiru',
    shortage_amount: 8000,
    status: 'recovering',
    reason: 'Cash short',
  }), {
    id: 7,
    agentName: 'Kabiru',
    meta: `${formatCurrencyNGN(8000)} | recovering`,
    reasonLabel: 'Cash short',
  });

  assert.deepEqual(buildMobileAgentTransactionItem({
    id: 8,
    agent_name: 'Maryam',
    service_type: 'transfer',
    transaction_reference: 'TRX-202',
    transaction_amount: 55000,
    commission_amount: 850,
    cash_delta: -55000,
    float_delta: 55000,
  }), {
    id: 8,
    agentName: 'Maryam',
    referenceLabel: 'transfer | TRX-202',
    amountLabel: formatCurrencyNGN(55000),
    commissionLabel: `commission ${formatCurrencyNGN(850)}`,
    balanceLabel: `cash ${formatCurrencyNGN(-55000)} | float ${formatCurrencyNGN(55000)}`,
  });

  assert.deepEqual(buildMobileAgentFraudAlertItem({
    id: 9,
    agent_name: '',
    severity: 'high',
    alert_type: 'negative_float',
    details: 'Float dropped below approved threshold',
  }), {
    id: 9,
    agentName: 'Unassigned agent',
    severityLabel: 'high',
    alertTypeLabel: 'negative float',
    details: 'Float dropped below approved threshold',
  });

  assert.deepEqual(filterMobileAgentTransactions([
    { id: 1, agent_name: 'Maryam', service_type: 'transfer' },
    { id: 2, agent_name: 'Kabiru', service_type: 'cash_out' },
  ], 'kabiru').map((item) => item.id), [2]);

  assert.deepEqual(filterMobileAgentFloatRequests([
    { id: 3, agent_name: 'Maryam', reason: 'Morning demand' },
    { id: 4, agent_name: 'Kabiru', reason: 'Weekend float' },
  ], 'weekend').map((item) => item.id), [4]);

  assert.deepEqual(filterMobileAgentShortages([
    { id: 5, agent_name: 'Maryam', status: 'open' },
    { id: 6, agent_name: 'Kabiru', status: 'resolved' },
  ], 'resolved').map((item) => item.id), [6]);

  assert.deepEqual(filterMobileAgentFraudAlerts([
    { id: 7, agent_name: 'Maryam', alert_type: 'negative_float' },
    { id: 8, agent_name: 'Kabiru', alert_type: 'high_reversal' },
  ], 'reversal').map((item) => item.id), [8]);
});
