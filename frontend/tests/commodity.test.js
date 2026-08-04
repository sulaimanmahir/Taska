import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCommodityDeskMetrics,
  buildCommodityLotCard,
  buildCommodityLotPayload,
  buildCommodityOverviewMetrics,
  buildCommodityPriceBoardCard,
  buildCommodityPricePayload,
  buildCommoditySettlementPayload,
  buildCommodityTradeBoardCard,
  buildCommodityTradeClosurePayload,
  buildCommodityTradePayload,
  createCommodityLotForm,
  createCommodityPriceForm,
  createCommoditySettlementForm,
  createCommodityTradeForm,
  filterCommodityLots,
  filterCommodityPriceBoard,
  filterCommodityTrades,
} from '../src/lib/commodity.js';
import { formatCurrencyNGN } from '../src/lib/financeFormatters.js';

test('commodity form factories return stable defaults', () => {
  assert.deepEqual(createCommodityLotForm(), {
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
  });
  assert.deepEqual(createCommodityPriceForm(), {
    product_id: '',
    commodity_name: '',
    market_name: 'Kano Dawanau',
    buying_price_per_kg: '',
    selling_price_per_kg: '',
    effective_date: '',
    reason: '',
  });
  assert.deepEqual(createCommodityTradeForm(), {
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
  });
  assert.deepEqual(createCommoditySettlementForm(), {
    trade_id: '',
    party_type: 'supplier',
    amount: '',
    payment_method: 'transfer',
    settled_on: '',
    reference: '',
    notes: '',
  });
});

test('commodity overview metrics keep weights and finance values aligned', () => {
  const metrics = buildCommodityOverviewMetrics({
    lots_open: 4,
    stock_weight_kg: 12750.456,
    revenue_today: 680000,
    supplier_payables: 220000,
    shrinkage_today_kg: 18.4,
  });

  assert.deepEqual(metrics[0], { label: 'Open Lots', value: 4, tone: 'amber' });
  assert.equal(metrics[1].value, '12750.5 kg');
  assert.equal(metrics[2].value, formatCurrencyNGN(680000));
  assert.equal(metrics[4].value, '18.4 kg');

  const deskMetrics = buildCommodityDeskMetrics(
    { supplier_payables: 220000 },
    [{ moisture_percent: 11.4 }, { moisture_percent: 8.1 }],
    [{ status: 'open', balance_due: 4000 }, { status: 'closed', balance_due: 0 }],
    [{ id: 1 }, { id: 2 }, { id: 3 }],
    formatCurrencyNGN,
  );

  assert.deepEqual(deskMetrics[1], {
    label: 'Unsettled Value',
    value: formatCurrencyNGN(220000),
    helper: 'Trade value still exposed across receivables and supplier settlement pressure.',
    tone: 'rose',
  });
  assert.equal(deskMetrics[3].value, 1);
});

test('commodity payload helpers normalize lot, price, trade, and settlement forms', () => {
  assert.deepEqual(buildCommodityLotPayload({
    product_id: '',
    warehouse_id: '2',
    commodity_name: 'Sesame',
    commodity_group: 'oilseeds',
    origin_region: 'Kebbi',
    quality_grade: 'export',
    moisture_percent: '7.5',
    bag_count: '40',
    weight_kg: '2400',
    cost_per_kg: '1200',
    selling_price_per_kg: '1450',
    shrinkage_allowance_percent: '1.5',
    notes: 'Clean lot',
  }), {
    product_id: null,
    warehouse_id: '2',
    commodity_name: 'Sesame',
    commodity_group: 'oilseeds',
    origin_region: 'Kebbi',
    quality_grade: 'export',
    moisture_percent: 7.5,
    bag_count: 40,
    weight_kg: 2400,
    cost_per_kg: 1200,
    selling_price_per_kg: 1450,
    shrinkage_allowance_percent: 1.5,
    notes: 'Clean lot',
  });

  assert.deepEqual(buildCommodityPricePayload({
    product_id: '',
    commodity_name: 'Sesame',
    market_name: 'Dawanau',
    buying_price_per_kg: '1200',
    selling_price_per_kg: '1450',
    effective_date: '2026-05-25',
    reason: 'Export demand',
  }), {
    product_id: null,
    commodity_name: 'Sesame',
    market_name: 'Dawanau',
    buying_price_per_kg: 1200,
    selling_price_per_kg: 1450,
    effective_date: '2026-05-25',
    reason: 'Export demand',
  });

  assert.deepEqual(buildCommodityTradePayload({
    commodity_lot_id: '',
    supplier_id: '3',
    customer_id: '',
    ticket_type: 'buy',
    commodity_name: 'Sesame',
    quality_grade: 'export',
    bag_count: '20',
    weight_kg: '1200',
    unit_price: '1300',
    paid_amount: '500000',
    trade_date: '2026-05-25',
    settlement_due_on: '2026-05-30',
    channel: 'warehouse_gate',
    notes: 'Partial payment',
  }), {
    commodity_lot_id: null,
    supplier_id: '3',
    customer_id: null,
    ticket_type: 'buy',
    commodity_name: 'Sesame',
    quality_grade: 'export',
    bag_count: 20,
    weight_kg: 1200,
    unit_price: 1300,
    paid_amount: 500000,
    trade_date: '2026-05-25',
    settlement_due_on: '2026-05-30',
    channel: 'warehouse_gate',
    notes: 'Partial payment',
  });

  assert.deepEqual(buildCommoditySettlementPayload({
    trade_id: '7',
    party_type: 'supplier',
    amount: '250000',
    payment_method: 'transfer',
    settled_on: '2026-05-26',
    reference: '',
    notes: 'Second tranche',
  }), {
    party_type: 'supplier',
    amount: 250000,
    payment_method: 'transfer',
    settled_on: '2026-05-26',
    reference: null,
    notes: 'Second tranche',
  });
});

test('commodity trade board and price board presenters keep trading copy readable', () => {
  assert.deepEqual(buildCommodityLotCard({
    id: 5,
    commodity_name: 'Sesame',
    quality_grade: 'export',
    origin_region: 'Kebbi',
    weight_kg: 2400,
    selling_price_per_kg: 1450,
    moisture_percent: 7.5,
    warehouse: { name: 'Main silo' },
  }), {
    id: 5,
    title: 'Sesame',
    meta: 'export | Kebbi | 2400.0 kg',
    valueLabel: formatCurrencyNGN(3480000),
    qualityLabel: '7.5% moisture',
    warehouseLabel: 'Main silo',
  });

  assert.deepEqual(buildCommodityTradeBoardCard({
    id: 8,
    ticket_number: 'TRD-008',
    commodity_name: 'Cocoa',
    ticket_type: 'sell',
    weight_kg: 850.25,
    payment_status: 'part_paid',
    total_amount: 1800000,
    paid_amount: 950000,
    balance_due: 850000,
    customer: { name: 'Export buyer' },
    channel: 'export_pickup',
    status: 'open',
  }), {
    id: 8,
    title: 'TRD-008 - Cocoa',
    meta: 'sell | 850.3 kg | part_paid',
    amountLabel: `${formatCurrencyNGN(1800000)} | paid ${formatCurrencyNGN(950000)}`,
    balanceLabel: `balance ${formatCurrencyNGN(850000)}`,
    partyLabel: 'Export buyer',
    channelLabel: 'export_pickup',
    canClose: true,
  });

  assert.deepEqual(buildCommodityPriceBoardCard({
    id: 9,
    commodity_name: 'Ginger',
    market_name: 'Dawanau',
    selling_price_per_kg: 1750,
    buying_price_per_kg: 1500,
    reason: 'Export demand',
  }), {
    id: 9,
    label: 'Ginger',
    value: formatCurrencyNGN(1750),
    helper: `Dawanau | buy ${formatCurrencyNGN(1500)}`,
    spreadLabel: formatCurrencyNGN(250),
    reasonLabel: 'Export demand',
    tone: 'amber',
  });

  assert.deepEqual(buildCommodityTradeClosurePayload(), {
    status: 'closed',
  });
});

test('commodity filters keep lot, trade, and market board search stable', () => {
  assert.deepEqual(
    filterCommodityLots(
      [
        { id: 1, commodity_name: 'Sesame', origin_region: 'Kebbi', quality_grade: 'export' },
        { id: 2, commodity_name: 'Millet', origin_region: 'Kano', quality_grade: 'domestic' },
      ],
      'kebbi',
    ).map((item) => item.id),
    [1],
  );

  assert.deepEqual(
    filterCommodityTrades(
      [
        { id: 3, ticket_number: 'TRD-001', commodity_name: 'Sesame', ticket_type: 'buy', supplier: { name: 'Amina' } },
        { id: 4, ticket_number: 'TRD-002', commodity_name: 'Ginger', ticket_type: 'sell', customer: { name: 'Blue Exports' } },
      ],
      'blue',
    ).map((item) => item.id),
    [4],
  );

  assert.deepEqual(
    filterCommodityPriceBoard(
      [
        { id: 5, commodity_name: 'Sesame', market_name: 'Dawanau', reason: 'Export demand' },
        { id: 6, commodity_name: 'Millet', market_name: 'Kasuwan Gwari', reason: 'Rainfall pressure' },
      ],
      'rainfall',
    ).map((item) => item.id),
    [6],
  );
});
