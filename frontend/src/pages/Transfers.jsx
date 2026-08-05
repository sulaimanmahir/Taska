import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBusinessType } from '../config';
import Card, { CardHeader } from '../components/Card';
import EmptyState from '../components/EmptyState';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import api from '../lib/api';
import { getErrorMessage } from '../lib/apiFeedback';
import {
  buildTransferMovementCard,
  buildTransferOverviewMetrics,
  buildTransferWarehouseCard,
} from '../lib/transfers';
import MobileAgentOps from './MobileAgentOps';
import BuildingMaterialsOps from './BuildingMaterialsOps';
import PureWaterRetailOps from './PureWaterRetailOps';
import WholesaleOps from './WholesaleOps';

function QueryErrorPanel({ message, onRetry }) {
  return (
    <Card className="border-rose-200 bg-rose-50/60">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">Workspace issue</p>
          <p className="mt-2 text-sm text-rose-700">{message}</p>
        </div>
        <button
          type="button"
          className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
          onClick={onRetry}
        >
          Retry loading
        </button>
      </div>
    </Card>
  );
}

export default function Transfers() {
  const { labels, type } = useBusinessType();
  const warehousesQuery = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.get('/warehouses').then((response) => response.data),
    staleTime: 60000,
  });
  const inventoryQuery = useQuery({
    queryKey: ['inventory-transfer-surface'],
    queryFn: () => api.get('/inventory').then((response) => response.data),
    staleTime: 60000,
  });
  const movementQuery = useQuery({
    queryKey: ['inventory-movements-transfer-surface'],
    queryFn: () => api.get('/inventory/movements').then((response) => response.data),
    staleTime: 60000,
  });

  const warehousesResponse = warehousesQuery.data;
  const inventoryResponse = inventoryQuery.data;
  const movementResponse = movementQuery.data;
  const warehouses = warehousesResponse?.data || warehousesResponse || [];
  const inventoryItems = inventoryResponse?.data || inventoryResponse || [];
  const movements = movementResponse?.data || movementResponse || [];
  const loading = warehousesQuery.isLoading || inventoryQuery.isLoading || movementQuery.isLoading;
  const transferQueries = [warehousesQuery, inventoryQuery, movementQuery];
  const overviewMetrics = useMemo(
    () => buildTransferOverviewMetrics({ warehouses, inventoryItems, movements }),
    [warehouses, inventoryItems, movements]
  );
  const warehouseCards = useMemo(
    () => warehouses.map((warehouse) => buildTransferWarehouseCard(warehouse, inventoryItems)),
    [warehouses, inventoryItems]
  );
  const movementCards = useMemo(
    () => movements.slice(0, 6).map((movement) => buildTransferMovementCard(movement)),
    [movements]
  );
  const loadError = getErrorMessage(
    transferQueries.find((query) => query.isError)?.error,
    'We could not load part of the transfer workspace right now. Please try again.'
  );

  if (type === 'mobile_agent') {
    return <MobileAgentOps />;
  }

  if (type === 'construction') {
    return <BuildingMaterialsOps />;
  }

  if (type === 'wholesale') {
    return <WholesaleOps />;
  }

  if (type === 'pure_water_retail') {
    return <PureWaterRetailOps />;
  }

  return (
    <div className="space-y-5">
      {loadError ? (
        <QueryErrorPanel
          message={loadError}
          onRetry={() => {
            transferQueries.forEach((query) => {
              query.refetch();
            });
          }}
        />
      ) : null}

      <PageHero
        eyebrow="Transfer Control"
        title={labels.transfers || 'Transfers'}
        description="Review warehouse coverage, stock pressure, and recent internal movement activity before deciding where stock should move next."
      />

      <ResponsiveCardGrid variant="metrics">
        {overviewMetrics.map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={loading ? '...' : metric.value}
            helper={metric.helper}
            tone={metric.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader title="Warehouse Coverage" subtitle="Which internal locations are ready to send or receive stock" />
          <div className="space-y-3">
            {warehouseCards.map((warehouse) => (
              <div key={warehouse.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{warehouse.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{warehouse.branchLabel}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {warehouse.isDefault ? (
                      <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">Default</span>
                    ) : null}
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${warehouse.statusLabel === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                      {warehouse.statusLabel}
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl bg-white px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tracked SKUs</p>
                    <p className="mt-1 font-semibold text-slate-900">{warehouse.trackedSkus}</p>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Units</p>
                    <p className="mt-1 font-semibold text-slate-900">{warehouse.totalUnits}</p>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Low Stock</p>
                    <p className="mt-1 font-semibold text-amber-700">{warehouse.lowStockCount}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-500">{warehouse.description}</p>
              </div>
            ))}

            {!loading && warehouseCards.length === 0 ? (
              <EmptyState
                icon="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                title="No warehouses ready yet"
                description="Create and activate warehouses first so Taska can support internal transfer planning with real locations."
                className="max-w-none px-0 py-2"
              />
            ) : null}
          </div>
        </Card>

        <Card>
          <CardHeader title="Movement Ledger" subtitle="Recent internal stock activity that informs the next rebalancing decision" />
          <div className="space-y-3">
            {movementCards.map((movement) => (
              <div key={movement.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{movement.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{movement.warehouseLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{movement.quantityLabel}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-sky-700">{movement.movementTypeLabel}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600">{movement.notesLabel}</p>
                {movement.timestampLabel ? (
                  <p className="mt-2 text-xs text-slate-400">{movement.timestampLabel}</p>
                ) : null}
              </div>
            ))}

            {!loading && movementCards.length === 0 ? (
              <EmptyState
                icon="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                title="No movement history yet"
                description="Inventory adjustments and warehouse activity will start forming a transfer-ready ledger here."
                className="max-w-none px-0 py-2"
              />
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
