import { formatCurrencyNGN } from './financeFormatters.js';

export function createCommodityLotForm() {
  return {
    product_id: '',
    warehouse_id: '',
    commodity_name: '',
    commodity_group: 'grains',
    origin_region: '',
    quality_grade: '',
    moisture_percent: '',
    bag_count: '',
    weight_kg: '',
    cost_per_kg: '',
    selling_price_per_kg: '',
    shrinkage_allowance_percent: '',
    notes: '',
  };
}

export function createCommodityPriceForm() {
  return {
    product_id: '',
    commodity_name: '',
    market_name: 'Kano Dawanau',
    buying_price_per_kg: '',
    selling_price_per_kg: '',
    effective_date: '',
    reason: '',
  };
}

export function createCommodityTradeForm() {
  return {
    commodity_lot_id: '',
    supplier_id: '',
    customer_id: '',
    ticket_type: 'buy',
    commodity_name: '',
    quality_grade: '',
    bag_count: '',
    weight_kg: '',
    unit_price: '',
    paid_amount: '',
    trade_date: '',
    settlement_due_on: '',
    channel: 'warehouse_gate',
    notes: '',
  };
}

export function createCommoditySettlementForm() {
  return {
    trade_id: '',
    party_type: 'supplier',
    amount: '',
    payment_method: 'transfer',
    settled_on: '',
    reference: '',
    notes: '',
  };
}

export function buildCommodityOverviewMetrics(summary = {}, formatCurrency = formatCurrencyNGN) {
  return [
    { label: 'Open Lots', value: summary?.lots_open || 0, tone: 'amber' },
    { label: 'Stock Weight', value: `${Number(summary?.stock_weight_kg || 0).toFixed(1)} kg`, tone: 'sky' },
    { label: 'Revenue Today', value: formatCurrency(summary?.revenue_today || 0), tone: 'emerald' },
    { label: 'Supplier Payables', value: formatCurrency(summary?.supplier_payables || 0), tone: 'rose' },
    { label: 'Shrinkage Today', value: `${Number(summary?.shrinkage_today_kg || 0).toFixed(1)} kg`, tone: 'orange' },
  ];
}

export function buildCommodityDeskMetrics(
  summary = {},
  lots = [],
  trades = [],
  priceBoard = [],
  formatCurrency = formatCurrencyNGN,
) {
  const openTrades = trades.filter((trade) => trade.status !== 'closed').length;
  const unsettledTrades = trades.filter((trade) => Number(trade.balance_due || 0) > 0).length;
  const highMoistureLots = lots.filter((lot) => Number(lot.moisture_percent || 0) >= 10).length;

  return [
    {
      label: 'Live Trades',
      value: openTrades,
      helper: 'Open buy and sell tickets still moving through settlement and closure.',
      tone: 'sky',
    },
    {
      label: 'Unsettled Value',
      value: formatCurrency(summary.customer_receivables || summary.supplier_payables || 0),
      helper: 'Trade value still exposed across receivables and supplier settlement pressure.',
      tone: 'rose',
    },
    {
      label: 'Price Boards',
      value: priceBoard.length,
      helper: 'Commodity market lines currently being watched for margin decisions.',
      tone: 'amber',
    },
    {
      label: 'High Moisture Lots',
      value: highMoistureLots,
      helper: 'Lots that need closer quality attention before margin starts leaking.',
      tone: 'orange',
    },
    {
      label: 'Settlement Queue',
      value: unsettledTrades,
      helper: 'Trade tickets still carrying unpaid exposure or balance due.',
      tone: 'emerald',
    },
  ];
}

export function buildCommodityLotPayload(lotForm = {}) {
  return {
    ...lotForm,
    product_id: lotForm.product_id || null,
    warehouse_id: lotForm.warehouse_id || null,
    moisture_percent: Number(lotForm.moisture_percent || 0),
    bag_count: Number(lotForm.bag_count || 0),
    weight_kg: Number(lotForm.weight_kg || 0),
    cost_per_kg: Number(lotForm.cost_per_kg || 0),
    selling_price_per_kg: Number(lotForm.selling_price_per_kg || 0),
    shrinkage_allowance_percent: Number(lotForm.shrinkage_allowance_percent || 0),
  };
}

export function buildCommodityPricePayload(priceForm = {}) {
  return {
    ...priceForm,
    product_id: priceForm.product_id || null,
    buying_price_per_kg: Number(priceForm.buying_price_per_kg || 0),
    selling_price_per_kg: Number(priceForm.selling_price_per_kg || 0),
  };
}

export function buildCommodityTradePayload(tradeForm = {}) {
  return {
    ...tradeForm,
    commodity_lot_id: tradeForm.commodity_lot_id || null,
    supplier_id: tradeForm.supplier_id || null,
    customer_id: tradeForm.customer_id || null,
    bag_count: Number(tradeForm.bag_count || 0),
    weight_kg: Number(tradeForm.weight_kg || 0),
    unit_price: Number(tradeForm.unit_price || 0),
    paid_amount: Number(tradeForm.paid_amount || 0),
  };
}

export function buildCommoditySettlementPayload(settlementForm = {}) {
  return {
    party_type: settlementForm.party_type,
    amount: Number(settlementForm.amount || 0),
    payment_method: settlementForm.payment_method,
    settled_on: settlementForm.settled_on,
    reference: settlementForm.reference || null,
    notes: settlementForm.notes || null,
  };
}

export function buildCommodityTradeClosurePayload() {
  return { status: 'closed' };
}

export function filterCommodityLots(lots = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return lots;
  }

  return lots.filter((lot) =>
    [
      lot.commodity_name,
      lot.commodity_group,
      lot.origin_region,
      lot.quality_grade,
      lot.warehouse?.name,
      lot.product?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query)
  );
}

export function filterCommodityTrades(trades = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return trades;
  }

  return trades.filter((trade) =>
    [
      trade.ticket_number,
      trade.commodity_name,
      trade.ticket_type,
      trade.payment_status,
      trade.status,
      trade.customer?.name,
      trade.supplier?.name,
      trade.channel,
      trade.notes,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query)
  );
}

export function filterCommodityPriceBoard(priceBoard = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return priceBoard;
  }

  return priceBoard.filter((entry) =>
    [
      entry.commodity_name,
      entry.market_name,
      entry.reason,
      entry.product?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query)
  );
}

export function buildCommodityLotCard(lot = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: lot.id,
    title: lot.commodity_name || 'Commodity lot',
    meta: `${lot.quality_grade || 'standard'} | ${lot.origin_region || 'unknown origin'} | ${Number(lot.weight_kg || 0).toFixed(1)} kg`,
    valueLabel: formatCurrency(Number(lot.weight_kg || 0) * Number(lot.selling_price_per_kg || 0)),
    qualityLabel: `${Number(lot.moisture_percent || 0).toFixed(1)}% moisture`,
    warehouseLabel: lot.warehouse?.name || 'Warehouse pending',
  };
}

export function buildCommodityTradeBoardCard(trade = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: trade.id,
    title: `${trade.ticket_number || 'Ticket'} - ${trade.commodity_name || 'Commodity'}`,
    meta: `${trade.ticket_type || 'buy'} | ${Number(trade.weight_kg || 0).toFixed(1)} kg | ${trade.payment_status || 'pending'}`,
    amountLabel: `${formatCurrency(trade.total_amount || 0)} | paid ${formatCurrency(trade.paid_amount || 0)}`,
    balanceLabel: `balance ${formatCurrency(trade.balance_due || Math.max(Number(trade.total_amount || 0) - Number(trade.paid_amount || 0), 0))}`,
    partyLabel: trade.ticket_type === 'sell' ? (trade.customer?.name || 'Buyer pending') : (trade.supplier?.name || 'Supplier pending'),
    channelLabel: trade.channel || 'warehouse_gate',
    canClose: trade.status !== 'closed',
  };
}

export function buildCommodityPriceBoardCard(entry = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: entry.id,
    label: entry.commodity_name || 'Commodity',
    value: formatCurrency(entry.selling_price_per_kg || 0),
    helper: `${entry.market_name || 'Market'} | buy ${formatCurrency(entry.buying_price_per_kg || 0)}`,
    spreadLabel: formatCurrency(Number(entry.selling_price_per_kg || 0) - Number(entry.buying_price_per_kg || 0)),
    reasonLabel: entry.reason || 'No reason captured',
    tone: 'amber',
  };
}
