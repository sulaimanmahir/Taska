import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Card, { CardHeader } from '../components/Card';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/apiFeedback';
import { formatCurrencyNGN } from '../lib/financeFormatters';
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
} from '../lib/commodity';

const formatCurrency = formatCurrencyNGN;

function QueryErrorPanel({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p>{message}</p>
        <button
          type="button"
          onClick={() => {
            void onRetry();
          }}
          className="self-start rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default function CommodityOps() {
  const queryClient = useQueryClient();
  const { toast, setToast, clearToast } = useToast();
  const [lotForm, setLotForm] = useState(createCommodityLotForm);
  const [priceForm, setPriceForm] = useState(createCommodityPriceForm);
  const [tradeForm, setTradeForm] = useState(createCommodityTradeForm);
  const [settlementForm, setSettlementForm] = useState(createCommoditySettlementForm);
  const [lotSearch, setLotSearch] = useState('');
  const [tradeSearch, setTradeSearch] = useState('');
  const [priceSearch, setPriceSearch] = useState('');

  const { data, error, refetch } = useQuery({
    queryKey: ['commodity-desk'],
    queryFn: async () => {
      const [overviewRes, productRes, customerRes, supplierRes, warehouseRes] = await Promise.all([
        api.get('/commodity/overview'),
        api.get('/products'),
        api.get('/customers'),
        api.get('/suppliers'),
        api.get('/warehouses'),
      ]);

      return {
        overview: overviewRes.data,
        products: productRes.data.data || productRes.data || [],
        customers: customerRes.data.data || customerRes.data || [],
        suppliers: supplierRes.data.data || supplierRes.data || [],
        warehouses: warehouseRes.data.data || warehouseRes.data || [],
      };
    },
    staleTime: 60000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['commodity-desk'] });
  };

  const saveLot = useMutation({
    mutationFn: (payload) => api.post('/commodity/lots', payload).then((response) => response.data),
    onSuccess: () => {
      setLotForm(createCommodityLotForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Commodity lot saved into the intake desk.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that commodity lot right now.') });
    },
  });

  const savePriceBoard = useMutation({
    mutationFn: (payload) => api.post('/commodity/price-board', payload).then((response) => response.data),
    onSuccess: () => {
      setPriceForm(createCommodityPriceForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Commodity price board updated for the live market desk.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not update the commodity price board right now.') });
    },
  });

  const saveTrade = useMutation({
    mutationFn: (payload) => api.post('/commodity/trades', payload).then((response) => response.data),
    onSuccess: () => {
      setTradeForm(createCommodityTradeForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Trade ticket captured into the commodity ledger.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that trade ticket right now.') });
    },
  });

  const saveSettlement = useMutation({
    mutationFn: ({ tradeId, payload }) => api.post(`/commodity/trades/${tradeId}/settlements`, payload).then((response) => response.data),
    onSuccess: () => {
      setSettlementForm(createCommoditySettlementForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Settlement recorded and exposure totals refreshed.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not record that settlement right now.') });
    },
  });

  const closeTrade = useMutation({
    mutationFn: (tradeId) => api.patch(`/commodity/trades/${tradeId}`, buildCommodityTradeClosurePayload()).then((response) => response.data),
    onSuccess: () => {
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Trade ticket closed on the live board.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not close that trade right now.') });
    },
  });

  const overview = data?.overview || null;
  const products = data?.products || [];
  const customers = data?.customers || [];
  const suppliers = data?.suppliers || [];
  const warehouses = data?.warehouses || [];
  const lots = overview?.lots || [];
  const trades = overview?.trades || [];
  const priceBoard = overview?.price_board || [];

  const overviewMetrics = useMemo(
    () => buildCommodityOverviewMetrics(overview?.summary, formatCurrency),
    [overview?.summary],
  );
  const deskMetrics = useMemo(
    () => buildCommodityDeskMetrics(overview?.summary, lots, trades, priceBoard, formatCurrency),
    [overview?.summary, lots, trades, priceBoard],
  );
  const filteredLots = useMemo(
    () => filterCommodityLots(lots, lotSearch).map((lot) => buildCommodityLotCard(lot, formatCurrency)),
    [lots, lotSearch],
  );
  const filteredTrades = useMemo(
    () => filterCommodityTrades(trades, tradeSearch).map((trade) => ({ source: trade, card: buildCommodityTradeBoardCard(trade, formatCurrency) })),
    [trades, tradeSearch],
  );
  const filteredPriceBoard = useMemo(
    () => filterCommodityPriceBoard(priceBoard, priceSearch).map((entry) => buildCommodityPriceBoardCard(entry, formatCurrency)),
    [priceBoard, priceSearch],
  );

  return (
    <div className="space-y-5">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Commodity operations feedback" />

      <PageHero
        eyebrow="Commodity Trading"
        title="Lots, market pricing, weigh-loss control, and supplier settlement in one stronger desk."
        description="Built for grain merchants, sesame traders, cocoa buyers, ginger exporters, and commodity warehouses that live or die on grade, moisture, and price timing."
      />

      {error ? (
        <QueryErrorPanel
          message={getErrorMessage(error, 'We could not load commodity operations right now.')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      <ResponsiveCardGrid variant="metrics">
        {overviewMetrics.map((metric) => (
          <OpsMetricCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
        ))}
      </ResponsiveCardGrid>

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-5">
        {deskMetrics.map((metric) => (
          <OpsMetricCard key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} tone={metric.tone} />
        ))}
      </ResponsiveCardGrid>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Lot Intake" subtitle="Capture moisture, origin, warehouse, shrinkage, and target sell posture." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveLot.mutate(buildCommodityLotPayload(lotForm));
            }}
          >
            <select className="input" value={lotForm.product_id} onChange={(event) => setLotForm({ ...lotForm, product_id: event.target.value })}>
              <option value="">Link product later</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <select className="input" value={lotForm.warehouse_id} onChange={(event) => setLotForm({ ...lotForm, warehouse_id: event.target.value })}>
              <option value="">Warehouse</option>
              {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
            </select>
            <input className="input" value={lotForm.commodity_name} onChange={(event) => setLotForm({ ...lotForm, commodity_name: event.target.value })} placeholder="Commodity name" />
            <input className="input" value={lotForm.origin_region} onChange={(event) => setLotForm({ ...lotForm, origin_region: event.target.value })} placeholder="Origin region" />
            <input className="input" value={lotForm.quality_grade} onChange={(event) => setLotForm({ ...lotForm, quality_grade: event.target.value })} placeholder="Quality grade" />
            <div className="grid grid-cols-2 gap-3">
              <input className="input" value={lotForm.bag_count} onChange={(event) => setLotForm({ ...lotForm, bag_count: event.target.value })} placeholder="Bag count" type="number" />
              <input className="input" value={lotForm.weight_kg} onChange={(event) => setLotForm({ ...lotForm, weight_kg: event.target.value })} placeholder="Weight kg" type="number" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="input" value={lotForm.moisture_percent} onChange={(event) => setLotForm({ ...lotForm, moisture_percent: event.target.value })} placeholder="Moisture %" type="number" />
              <input className="input" value={lotForm.shrinkage_allowance_percent} onChange={(event) => setLotForm({ ...lotForm, shrinkage_allowance_percent: event.target.value })} placeholder="Shrinkage %" type="number" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="input" value={lotForm.cost_per_kg} onChange={(event) => setLotForm({ ...lotForm, cost_per_kg: event.target.value })} placeholder="Cost per kg" type="number" />
              <input className="input" value={lotForm.selling_price_per_kg} onChange={(event) => setLotForm({ ...lotForm, selling_price_per_kg: event.target.value })} placeholder="Target sell per kg" type="number" />
            </div>
            <textarea className="input min-h-[108px] resize-y py-3" value={lotForm.notes} onChange={(event) => setLotForm({ ...lotForm, notes: event.target.value })} placeholder="Lot notes" />
            <button type="submit" className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
              {saveLot.isPending ? 'Saving lot...' : 'Save lot'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Price Board" subtitle="Track daily buying and selling movement by market and reason." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              savePriceBoard.mutate(buildCommodityPricePayload(priceForm));
            }}
          >
            <select className="input" value={priceForm.product_id} onChange={(event) => setPriceForm({ ...priceForm, product_id: event.target.value })}>
              <option value="">Product link optional</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <input className="input" value={priceForm.commodity_name} onChange={(event) => setPriceForm({ ...priceForm, commodity_name: event.target.value })} placeholder="Commodity" />
            <input className="input" value={priceForm.market_name} onChange={(event) => setPriceForm({ ...priceForm, market_name: event.target.value })} placeholder="Market name" />
            <div className="grid grid-cols-2 gap-3">
              <input className="input" value={priceForm.buying_price_per_kg} onChange={(event) => setPriceForm({ ...priceForm, buying_price_per_kg: event.target.value })} placeholder="Buy per kg" type="number" />
              <input className="input" value={priceForm.selling_price_per_kg} onChange={(event) => setPriceForm({ ...priceForm, selling_price_per_kg: event.target.value })} placeholder="Sell per kg" type="number" />
            </div>
            <input className="input" value={priceForm.effective_date} onChange={(event) => setPriceForm({ ...priceForm, effective_date: event.target.value })} type="date" />
            <textarea className="input min-h-[108px] resize-y py-3" value={priceForm.reason} onChange={(event) => setPriceForm({ ...priceForm, reason: event.target.value })} placeholder="Reason for update" />
            <button type="submit" className="w-full rounded-2xl bg-amber-700 px-4 py-3 text-sm font-semibold text-white">
              {savePriceBoard.isPending ? 'Updating board...' : 'Update price board'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Settlement Desk" subtitle="Record supplier and buyer settlements against live trade tickets." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!settlementForm.trade_id) return;
              clearToast();
              saveSettlement.mutate({
                tradeId: settlementForm.trade_id,
                payload: buildCommoditySettlementPayload(settlementForm),
              });
            }}
          >
            <select className="input" value={settlementForm.trade_id} onChange={(event) => setSettlementForm({ ...settlementForm, trade_id: event.target.value })}>
              <option value="">Trade ticket</option>
              {trades.map((trade) => <option key={trade.id} value={trade.id}>{trade.ticket_number} - {trade.commodity_name}</option>)}
            </select>
            <select className="input" value={settlementForm.party_type} onChange={(event) => setSettlementForm({ ...settlementForm, party_type: event.target.value })}>
              <option value="supplier">supplier</option>
              <option value="customer">customer</option>
            </select>
            <input className="input" value={settlementForm.amount} onChange={(event) => setSettlementForm({ ...settlementForm, amount: event.target.value })} placeholder="Settlement amount" type="number" />
            <input className="input" value={settlementForm.settled_on} onChange={(event) => setSettlementForm({ ...settlementForm, settled_on: event.target.value })} type="date" />
            <input className="input" value={settlementForm.reference} onChange={(event) => setSettlementForm({ ...settlementForm, reference: event.target.value })} placeholder="Reference" />
            <textarea className="input min-h-[108px] resize-y py-3" value={settlementForm.notes} onChange={(event) => setSettlementForm({ ...settlementForm, notes: event.target.value })} placeholder="Settlement notes" />
            <button type="submit" className="w-full rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white">
              {saveSettlement.isPending ? 'Recording settlement...' : 'Record settlement'}
            </button>
          </form>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader title="Trade Ticket Desk" subtitle="Run buy and sell tickets with lot, party, and settlement visibility in one form." />
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveTrade.mutate(buildCommodityTradePayload(tradeForm));
            }}
          >
            <select className="input" value={tradeForm.ticket_type} onChange={(event) => setTradeForm({ ...tradeForm, ticket_type: event.target.value })}>
              <option value="buy">buy</option>
              <option value="sell">sell</option>
            </select>
            <select className="input" value={tradeForm.commodity_lot_id} onChange={(event) => setTradeForm({ ...tradeForm, commodity_lot_id: event.target.value })}>
              <option value="">Lot optional</option>
              {lots.map((lot) => <option key={lot.id} value={lot.id}>{lot.commodity_name} - {lot.quality_grade || 'standard'}</option>)}
            </select>
            <select className="input" value={tradeForm.supplier_id} onChange={(event) => setTradeForm({ ...tradeForm, supplier_id: event.target.value })}>
              <option value="">Supplier</option>
              {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </select>
            <select className="input" value={tradeForm.customer_id} onChange={(event) => setTradeForm({ ...tradeForm, customer_id: event.target.value })}>
              <option value="">Buyer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            <input className="input" value={tradeForm.commodity_name} onChange={(event) => setTradeForm({ ...tradeForm, commodity_name: event.target.value })} placeholder="Commodity name" />
            <input className="input" value={tradeForm.quality_grade} onChange={(event) => setTradeForm({ ...tradeForm, quality_grade: event.target.value })} placeholder="Grade" />
            <input className="input" value={tradeForm.bag_count} onChange={(event) => setTradeForm({ ...tradeForm, bag_count: event.target.value })} placeholder="Bag count" type="number" />
            <input className="input" value={tradeForm.weight_kg} onChange={(event) => setTradeForm({ ...tradeForm, weight_kg: event.target.value })} placeholder="Weight kg" type="number" />
            <input className="input" value={tradeForm.unit_price} onChange={(event) => setTradeForm({ ...tradeForm, unit_price: event.target.value })} placeholder="Unit price" type="number" />
            <input className="input" value={tradeForm.paid_amount} onChange={(event) => setTradeForm({ ...tradeForm, paid_amount: event.target.value })} placeholder="Paid amount" type="number" />
            <input className="input" value={tradeForm.trade_date} onChange={(event) => setTradeForm({ ...tradeForm, trade_date: event.target.value })} type="date" />
            <input className="input" value={tradeForm.settlement_due_on} onChange={(event) => setTradeForm({ ...tradeForm, settlement_due_on: event.target.value })} type="date" />
            <select className="input md:col-span-2" value={tradeForm.channel} onChange={(event) => setTradeForm({ ...tradeForm, channel: event.target.value })}>
              {['warehouse_gate', 'market_yard', 'site_delivery', 'export_pickup'].map((channel) => <option key={channel} value={channel}>{channel}</option>)}
            </select>
            <textarea className="input min-h-[108px] resize-y py-3 md:col-span-2" value={tradeForm.notes} onChange={(event) => setTradeForm({ ...tradeForm, notes: event.target.value })} placeholder="Trade notes" />
            <button type="submit" className="rounded-2xl bg-orange-700 px-4 py-3 text-sm font-semibold text-white md:col-span-2">
              {saveTrade.isPending ? 'Saving trade ticket...' : 'Save trade ticket'}
            </button>
          </form>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader title="Lot Register" subtitle="Search quality, origin, moisture, and warehouse posture across live lots." className="mb-0" />
            <input className="input" placeholder="Search commodity, origin, grade, or warehouse..." value={lotSearch} onChange={(event) => setLotSearch(event.target.value)} />
          </div>
          <div className="mt-4 space-y-3">
            {filteredLots.slice(0, 6).map((lotCard) => (
              <div key={lotCard.id} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{lotCard.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{lotCard.meta}</p>
                    <p className="mt-1 text-xs text-slate-500">{lotCard.qualityLabel} | {lotCard.warehouseLabel}</p>
                  </div>
                  <p className="text-right text-sm font-semibold text-slate-900">{lotCard.valueLabel}</p>
                </div>
              </div>
            ))}
            {!filteredLots.length ? <p className="text-sm text-slate-500">No commodity lots matched the current search.</p> : null}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader title="Live Trade Board" subtitle="Search open trade tickets and keep settlement pressure visible." className="mb-0" />
            <input className="input" placeholder="Search ticket, commodity, party, status, or channel..." value={tradeSearch} onChange={(event) => setTradeSearch(event.target.value)} />
          </div>
          <div className="mt-4 space-y-3">
            {filteredTrades.slice(0, 6).map(({ source, card }) => (
              <div key={card.id} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{card.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{card.meta}</p>
                    <p className="mt-1 text-xs text-slate-500">{card.partyLabel} | {card.channelLabel}</p>
                    <p className="mt-1 text-xs text-slate-500">{card.balanceLabel}</p>
                  </div>
                  {card.canClose ? (
                    <button
                      type="button"
                      className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                      onClick={() => {
                        clearToast();
                        closeTrade.mutate(source.id);
                      }}
                    >
                      Close
                    </button>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Closed</span>
                  )}
                </div>
                <div className="mt-2 text-sm text-slate-600">{card.amountLabel}</div>
              </div>
            ))}
            {!filteredTrades.length ? <p className="text-sm text-slate-500">No trades matched the current search.</p> : null}
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader title="Market Price Board" subtitle="Search active market lines and spread posture from the live board." className="mb-0" />
            <input className="input" placeholder="Search commodity, market, reason, or linked product..." value={priceSearch} onChange={(event) => setPriceSearch(event.target.value)} />
          </div>
          <div className="mt-4 space-y-3">
            {filteredPriceBoard.slice(0, 6).map((entry) => (
              <div key={entry.id} className="rounded-2xl bg-amber-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-amber-900">{entry.label}</p>
                    <p className="mt-1 text-xs text-amber-700">{entry.helper}</p>
                    <p className="mt-1 text-xs text-amber-700">{entry.reasonLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-amber-900">{entry.value}</p>
                    <p className="text-xs text-amber-700">spread {entry.spreadLabel}</p>
                  </div>
                </div>
              </div>
            ))}
            {!filteredPriceBoard.length ? <p className="text-sm text-slate-500">No price-board entries matched the current search.</p> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
