import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card, { CardHeader } from '../components/Card';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import Toast from '../components/Toast';
import api from '../lib/api';
import { useBusinessType } from '../config';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/apiFeedback';
import {
  buildInventoryAdjustmentPayload,
  buildInventoryMovementRow,
  buildInventoryOverviewMetrics,
  buildInventoryRow,
  createInventoryAdjustmentForm,
  filterInventoryItems,
  validateInventoryAdjustmentPayload,
} from '../lib/inventory';
import FuelOps from './FuelOps';
import BuildingMaterialsOps from './BuildingMaterialsOps';
import CommodityOps from './CommodityOps';
import WarehouseOps from './WarehouseOps';
import BeautyOps from './BeautyOps';
import FarmOps from './FarmOps';
import PureWaterRetailOps from './PureWaterRetailOps';
import SMEOps from './SMEOps';

function InventorySkeletonRow() {
  return (
    <tr className="border-t border-slate-100">
      <td colSpan={7} className="px-5 py-4">
        <div className="h-12 skeleton rounded-2xl" />
      </td>
    </tr>
  );
}

function QueryErrorPanel({ message, onRetry }) {
  if (!message) {
    return null;
  }

  return (
    <div className="border-b border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p>{message}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start text-rose-700 hover:bg-rose-100"
          onClick={onRetry}
        >
          Retry
        </Button>
      </div>
    </div>
  );
}

export default function Inventory() {
  const { hasActiveType } = useBusinessType();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [adjustmentForm, setAdjustmentForm] = useState(createInventoryAdjustmentForm());
  const [adjustmentError, setAdjustmentError] = useState('');
  const queryClient = useQueryClient();
  const { toast, setToast, clearToast } = useToast();

  const warehousesQuery = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.get('/warehouses').then((response) => response.data.data || response.data || []),
  });

  const inventoryQuery = useQuery({
    queryKey: ['inventory', warehouseFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (warehouseFilter) {
        params.append('warehouse_id', warehouseFilter);
      }

      const suffix = params.toString() ? `?${params}` : '';
      return api.get(`/inventory${suffix}`).then((response) => response.data);
    },
    staleTime: 60000,
  });

  const movementQuery = useQuery({
    queryKey: ['inventory-movements'],
    queryFn: () => api.get('/inventory/movements').then((response) => response.data),
    staleTime: 30000,
  });

  const warehouses = warehousesQuery.data || [];
  const inventoryResponse = inventoryQuery.data;
  const isLoading = inventoryQuery.isLoading;
  const movementResponse = movementQuery.data;
  const inventoryQueries = [warehousesQuery, inventoryQuery, movementQuery];

  const adjustInventory = useMutation({
    mutationFn: (payload) => api.post('/inventory/adjust', payload).then((response) => response.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      setAdjustmentForm(createInventoryAdjustmentForm());

      if (data?.approval_pending) {
        setToast({
          tone: 'success',
          message: data.message || 'This business requires approval for manual inventory adjustments. Your request is pending review.',
        });
        return;
      }

      clearToast();
    },
    onError: (mutationError) => {
      setToast({
        tone: 'error',
        message: getErrorMessage(mutationError, 'We could not adjust inventory right now.'),
      });
    },
  });

  if (hasActiveType('fuel_business')) {
    return <FuelOps />;
  }

  if (hasActiveType('construction')) {
    return <BuildingMaterialsOps />;
  }

  if (hasActiveType('commodity')) {
    return <CommodityOps />;
  }

  if (hasActiveType('warehouse')) {
    return <WarehouseOps />;
  }

  if (hasActiveType('beauty')) {
    return <BeautyOps />;
  }

  if (hasActiveType('pure_water_retail')) {
    return <PureWaterRetailOps />;
  }

  if (hasActiveType('farm')) {
    return <FarmOps />;
  }

  if (hasActiveType('mixed') || hasActiveType('general')) {
    return <SMEOps />;
  }

  const inventoryItems = inventoryResponse?.data || inventoryResponse || [];
  const movementItems = movementResponse?.data || movementResponse || [];
  const filteredItems = filterInventoryItems(inventoryItems, search, filter);
  const loadError = inventoryQueries.find((query) => query.isError)?.error
    ? getErrorMessage(inventoryQueries.find((query) => query.isError)?.error, 'We could not load inventory right now. Please try again.')
    : '';

  return (
    <div className="space-y-6">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Inventory feedback" />

      <PageHero
        eyebrow="Stock Control"
        title="Inventory"
        description="Watch stock position, warehouse coverage, replenishment pressure, and adjustment activity from one stronger inventory surface."
        actions={(
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Stock', count: inventoryItems.length },
              { key: 'low', label: 'Low Stock', count: inventoryItems.filter((item) => Number(item.quantity || 0) > 0 && Number(item.quantity || 0) <= Number(item.reorder_point || 0)).length },
              { key: 'out', label: 'Out of Stock', count: inventoryItems.filter((item) => Number(item.quantity || 0) <= 0).length },
            ].map((entry) => {
              const isActive = filter === entry.key;

              return (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => setFilter(entry.key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-[0_14px_28px_rgba(15,23,42,0.14)]'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {entry.label} ({entry.count})
                </button>
              );
            })}
          </div>
        )}
      />

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-5">
        {buildInventoryOverviewMetrics(inventoryItems).map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            tone={metric.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card padding={false} className="overflow-hidden">
          <QueryErrorPanel
            message={loadError}
            onRetry={() => {
              inventoryQueries.forEach((query) => {
                void query.refetch();
              });
            }}
          />

          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Inventory Register</p>
                <p className="mt-1 text-sm text-slate-500">
                  Review each stock line by product, warehouse, available quantity, reorder point, and current stock posture.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 md:flex-row xl:w-auto">
                <input
                  type="text"
                  placeholder="Search product, SKU, category, or warehouse..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="input min-w-[300px]"
                />
                <select
                  value={warehouseFilter}
                  onChange={(event) => setWarehouseFilter(event.target.value)}
                  className="input min-w-[220px]"
                >
                  <option value="">All warehouses</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Product</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Warehouse</th>
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">On Hand</th>
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reserved</th>
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Available</th>
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reorder</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 5 }).map((_, index) => <InventorySkeletonRow key={index} />) : null}

              {!isLoading && !filteredItems.length ? (
                <tr className="border-t border-slate-100">
                  <td colSpan={7} className="px-5 py-6">
                    <EmptyState
                      icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      title={inventoryItems.length ? 'No inventory lines matched your filters' : 'No inventory lines yet'}
                      description={
                        inventoryItems.length
                          ? 'Try a different search or clear the stock filter to see everything.'
                          : 'Inventory lines appear here once products have stock recorded against a warehouse.'
                      }
                    />
                  </td>
                </tr>
              ) : null}

              {!isLoading ? filteredItems.map((item) => {
                const row = buildInventoryRow(item);
                const toneClass = row.statusTone === 'rose'
                  ? 'bg-rose-50 text-rose-700'
                  : row.statusTone === 'amber'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-emerald-50 text-emerald-700';

                return (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">{row.title}</p>
                      <p className="text-sm text-slate-500">{row.skuLabel}</p>
                      <p className="text-sm text-slate-500">{row.categoryLabel}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{row.warehouseLabel}</td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-900">{row.quantityLabel}</td>
                    <td className="px-5 py-4 text-right text-slate-500">{row.reservedLabel}</td>
                    <td className="px-5 py-4 text-right text-slate-500">{row.availableLabel}</td>
                    <td className="px-5 py-4 text-right text-slate-500">{row.reorderPointLabel}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>
                        {row.statusLabel}
                      </span>
                      <p className="mt-2 text-xs text-slate-500">{row.pricingLabel}</p>
                    </td>
                  </tr>
                );
              }) : null}
            </tbody>
          </table>
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {isLoading ? (
              Array(3).fill(0).map((_, index) => (
                <div key={index} className="h-24 skeleton rounded-2xl"></div>
              ))
            ) : !filteredItems.length ? (
              <EmptyState
                icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                title={inventoryItems.length ? 'No inventory lines matched your filters' : 'No inventory lines yet'}
                description={
                  inventoryItems.length
                    ? 'Try a different search or clear the stock filter to see everything.'
                    : 'Inventory lines appear here once products have stock recorded against a warehouse.'
                }
              />
            ) : filteredItems.map((item) => {
              const row = buildInventoryRow(item);
              const toneClass = row.statusTone === 'rose'
                ? 'bg-rose-50 text-rose-700'
                : row.statusTone === 'amber'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-emerald-50 text-emerald-700';

              return (
                <div key={row.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{row.title}</p>
                      <p className="text-sm text-slate-500">{row.skuLabel}</p>
                      <p className="text-sm text-slate-500">{row.warehouseLabel}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>
                      {row.statusLabel}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">On hand</p>
                      <p className="mt-0.5 font-semibold text-slate-900">{row.quantityLabel}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Reserved</p>
                      <p className="mt-0.5 font-medium text-slate-900">{row.reservedLabel}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Available</p>
                      <p className="mt-0.5 font-medium text-slate-900">{row.availableLabel}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Stock Adjustment" subtitle="Record additions, removals, and stock sets against a live inventory line" />
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                const payload = buildInventoryAdjustmentPayload(adjustmentForm);
                const validation = validateInventoryAdjustmentPayload(payload);

                if (!validation.isValid) {
                  setAdjustmentError(validation.error);
                  return;
                }

                setAdjustmentError('');
                adjustInventory.mutate(payload);
              }}
            >
              <select
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={adjustmentForm.inventory_item_id}
                onChange={(event) => setAdjustmentForm({ ...adjustmentForm, inventory_item_id: event.target.value })}
                required
              >
                <option value="">Select inventory line</option>
                {inventoryItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {(item.product?.name || 'Product')} - {(item.warehouse?.name || 'Warehouse')}
                  </option>
                ))}
              </select>

              <div className="grid gap-3 md:grid-cols-2">
                <select
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  value={adjustmentForm.type}
                  onChange={(event) => setAdjustmentForm({ ...adjustmentForm, type: event.target.value })}
                >
                  <option value="add">Add stock</option>
                  <option value="remove">Remove stock</option>
                  <option value="set">Set quantity</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  placeholder="Quantity"
                  value={adjustmentForm.quantity}
                  onChange={(event) => setAdjustmentForm({ ...adjustmentForm, quantity: event.target.value })}
                  required
                />
              </div>

              <textarea
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                rows={3}
                value={adjustmentForm.reason}
                onChange={(event) => setAdjustmentForm({ ...adjustmentForm, reason: event.target.value })}
                placeholder="Adjustment reason"
                required
              />

              {adjustmentError ? (
                <p className="text-sm text-rose-700">{adjustmentError}</p>
              ) : null}

              <Button type="submit" disabled={adjustInventory.isPending}>
                {adjustInventory.isPending ? 'Saving adjustment...' : 'Save adjustment'}
              </Button>
            </form>
          </Card>

          <Card>
            <CardHeader title="Recent Movements" subtitle="Latest inventory changes captured across your stock locations" />
            <div className="space-y-3">
              {movementItems.length ? movementItems.slice(0, 6).map((movement) => {
                const row = buildInventoryMovementRow(movement);

                return (
                  <div key={row.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{row.title}</p>
                        <p className="text-sm text-slate-500">{row.warehouseLabel}</p>
                        <p className="mt-1 text-sm text-slate-500">{row.notesLabel}</p>
                      </div>
                      <div className="text-right text-sm text-slate-600">
                        <p className="capitalize">{row.typeLabel}</p>
                        <p>{row.quantityLabel} units</p>
                        <p>{row.beforeAfterLabel}</p>
                        <p>{row.valueHint}</p>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <EmptyState
                  icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                  title="No movement history yet"
                  description="Stock adjustments, sales, and transfers will build a history here as they happen."
                  className="py-4"
                />
              )}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
