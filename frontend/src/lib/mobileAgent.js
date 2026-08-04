import { formatCurrencyNGN } from './financeFormatters.js';

export function createMobileAgentTierForm() {
  return {
    name: '',
    service_type: 'transfer',
    minimum_volume: 0,
    maximum_volume: '',
    commission_rate: '',
    flat_bonus: '',
  };
}

export function createMobileAgentFloatForm() {
  return { agent_name: '', requested_amount: '', reason: '' };
}

export function createMobileAgentTransactionForm() {
  return {
    agent_name: '',
    service_type: 'transfer',
    transaction_amount: '',
    cash_delta: '',
    float_delta: '',
    commission_tier_id: '',
    notes: '',
  };
}

export function createMobileAgentReversalForm() {
  return { mobile_agent_transaction_id: '', reason: '' };
}

export function createMobileAgentShortageForm() {
  return { agent_name: '', shortage_amount: '', recovered_amount: '', reason: '' };
}

export function buildMobileAgentOverviewMetrics(summary = {}, formatCurrency = formatCurrencyNGN) {
  return [
    { label: 'Volume Today', value: formatCurrency(summary?.volume_today || 0), tone: 'sky' },
    { label: 'Commissions Today', value: formatCurrency(summary?.commissions_today || 0), tone: 'emerald' },
    { label: 'Pending Float', value: summary?.float_requests_pending || 0, tone: 'amber' },
    { label: 'Fraud Alerts', value: summary?.fraud_alerts_open || 0, tone: 'rose' },
  ];
}

export function buildMobileAgentDeskMetrics(
  summary = {},
  floatRequests = [],
  transactions = [],
  shortages = [],
  fraudAlerts = [],
  formatCurrency = formatCurrencyNGN,
) {
  const pendingFloat = floatRequests.filter((request) => (request.status || 'pending') === 'pending').length;
  const openShortages = shortages.filter((shortage) => (shortage.status || 'open') !== 'resolved').length;
  const transferCount = transactions.filter((transaction) => transaction.service_type === 'transfer').length;

  return [
    ...buildMobileAgentOverviewMetrics(summary, formatCurrency),
    { label: 'Transfer Count', value: transferCount, tone: 'violet' },
    { label: 'Open Shortages', value: openShortages, tone: 'rose' },
    { label: 'Requests Live', value: pendingFloat, tone: 'amber' },
    { label: 'Alert Queue', value: fraudAlerts.length, tone: 'sky' },
  ];
}

export function buildMobileAgentTierPayload(tierForm = {}) {
  return {
    ...tierForm,
    minimum_volume: Number(tierForm.minimum_volume || 0),
    maximum_volume: tierForm.maximum_volume === '' ? null : Number(tierForm.maximum_volume),
    commission_rate: Number(tierForm.commission_rate || 0),
    flat_bonus: Number(tierForm.flat_bonus || 0),
  };
}

export function buildMobileAgentFloatRequestPayload(floatForm = {}) {
  return {
    ...floatForm,
    requested_amount: Number(floatForm.requested_amount || 0),
  };
}

export function buildMobileAgentFloatApprovalPayload(request = {}) {
  return { approved_amount: request.requested_amount };
}

export function buildMobileAgentTransactionPayload(transactionForm = {}) {
  return {
    ...transactionForm,
    commission_tier_id: transactionForm.commission_tier_id || null,
    transaction_amount: Number(transactionForm.transaction_amount || 0),
    cash_delta: Number(transactionForm.cash_delta || 0),
    float_delta: Number(transactionForm.float_delta || 0),
  };
}

export function buildMobileAgentShortagePayload(shortageForm = {}) {
  return {
    ...shortageForm,
    shortage_amount: Number(shortageForm.shortage_amount || 0),
    recovered_amount: Number(shortageForm.recovered_amount || 0),
  };
}

export function filterMobileAgentTransactions(transactions = [], query = '') {
  const search = query.trim().toLowerCase();

  if (!search) {
    return transactions;
  }

  return transactions.filter((transaction) =>
    [
      transaction.agent_name,
      transaction.service_type,
      transaction.transaction_reference,
      transaction.notes,
    ].some((field) => String(field ?? '').toLowerCase().includes(search))
  );
}

export function filterMobileAgentFloatRequests(floatRequests = [], query = '') {
  const search = query.trim().toLowerCase();

  if (!search) {
    return floatRequests;
  }

  return floatRequests.filter((request) =>
    [request.agent_name, request.reason, request.status]
      .some((field) => String(field ?? '').toLowerCase().includes(search))
  );
}

export function filterMobileAgentShortages(shortages = [], query = '') {
  const search = query.trim().toLowerCase();

  if (!search) {
    return shortages;
  }

  return shortages.filter((shortage) =>
    [shortage.agent_name, shortage.reason, shortage.status]
      .some((field) => String(field ?? '').toLowerCase().includes(search))
  );
}

export function filterMobileAgentFraudAlerts(alerts = [], query = '') {
  const search = query.trim().toLowerCase();

  if (!search) {
    return alerts;
  }

  return alerts.filter((alert) =>
    [alert.agent_name, alert.alert_type, alert.details, alert.severity]
      .some((field) => String(field ?? '').toLowerCase().includes(search))
  );
}

export function buildMobileAgentRankingItem(agent = {}, index = 0, formatCurrency = formatCurrencyNGN) {
  return {
    key: agent.agent_name || `agent-${index}`,
    label: `${index + 1}. ${agent.agent_name || 'Unnamed agent'}`,
    commissionLabel: formatCurrency(agent.commission || 0),
    meta: `${agent.transactions_count || 0} transactions | volume ${formatCurrency(agent.volume || 0)}`,
  };
}

export function buildMobileAgentFloatRequestItem(request = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: request.id,
    agentName: request.agent_name || 'Unassigned agent',
    status: request.status || 'pending',
    requestedAmountLabel: `${formatCurrency(request.requested_amount || 0)} requested`,
    reasonLabel: request.reason || 'No reason provided',
  };
}

export function buildMobileAgentTierItem(tier = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: tier.id,
    name: tier.name || 'Commission tier',
    meta: `${tier.service_type || 'transfer'} | ${tier.commission_rate || 0}% + ${formatCurrency(tier.flat_bonus || 0)}`,
  };
}

export function buildMobileAgentReversalItem(reversal = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: reversal.id,
    reference: reversal.transaction?.transaction_reference || 'Reference pending',
    meta: `${reversal.status || 'pending'} | ${formatCurrency(reversal.amount || 0)}`,
  };
}

export function buildMobileAgentShortageItem(shortage = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: shortage.id,
    agentName: shortage.agent_name || 'Unassigned agent',
    meta: `${formatCurrency(shortage.shortage_amount || 0)} | ${shortage.status || 'open'}`,
    reasonLabel: shortage.reason || 'No reason provided',
  };
}

export function buildMobileAgentTransactionItem(transaction = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: transaction.id,
    agentName: transaction.agent_name || 'Unassigned agent',
    referenceLabel: `${transaction.service_type || 'transfer'} | ${transaction.transaction_reference || 'Reference pending'}`,
    amountLabel: formatCurrency(transaction.transaction_amount || 0),
    commissionLabel: `commission ${formatCurrency(transaction.commission_amount || 0)}`,
    balanceLabel: `cash ${formatCurrency(transaction.cash_delta || 0)} | float ${formatCurrency(transaction.float_delta || 0)}`,
  };
}

export function buildMobileAgentFraudAlertItem(alert = {}) {
  return {
    id: alert.id,
    agentName: alert.agent_name || 'Unassigned agent',
    severityLabel: alert.severity || 'medium',
    alertTypeLabel: (alert.alert_type || 'alert').replaceAll('_', ' '),
    details: alert.details || '',
  };
}
