import { formatCurrencyNGN, formatShortDate } from './financeFormatters.js';

export function formatDashboardCurrency(amount) {
  if (!amount && amount !== 0) return 'NGN 0';

  return formatCurrencyNGN(amount);
}

export function formatDashboardDate(value) {
  return formatShortDate(value, 'No due date set');
}

export function formatDashboardDateTime(value) {
  if (!value) return 'Recent activity';

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'Recent activity';
  }

  return parsed.toLocaleString('en-NG', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getDashboardActivityActionLabel(item) {
  if (!item?.action_path) return null;

  const typeLabels = {
    order: 'Open POS',
    expense: 'Open expenses',
    trust_transaction: item?.action_path === '/adashe' ? 'Open Adashe' : 'Open Trust Fund',
    delivery_order: 'Open dispatch desk',
    logistics_trip: 'Open trip desk',
    production_batch: 'Open batch desk',
    restaurant_ticket: 'Open ticket desk',
    warehouse_distribution: 'Open warehouse',
    pharmacy_dispense: 'Open dispense desk',
    pharmacy_refill: 'Open refill queue',
    cooperative_financing: 'Open financing',
    cooperative_profit_cycle: 'Open profit cycle',
  };

  return typeLabels[item.type] || 'Open workspace';
}
