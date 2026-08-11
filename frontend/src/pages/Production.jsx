import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useBusinessType } from '../config';
import Button from '../components/Button';
import Card, { CardHeader } from '../components/Card';
import EmptyState from '../components/EmptyState';
import OpsMetricCard from '../components/OpsMetricCard';
import { PageShell, ResponsiveCardGrid } from '../components/PageShell';
import PageHero from '../components/PageHero';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/apiFeedback';
import {
  buildProductionBatchPayload,
  buildProductionBatchPresentation,
  buildProductionCostTrendPresentation,
  buildProductionDeskMetrics,
  buildProductionEnergyPayload,
  buildProductionLowStockPresentation,
  buildProductionMaterialPayload,
  buildProductionPurchasePayload,
  buildProductionSpendPresentation,
  buildProductionSupplierBalancePresentation,
  buildProductionWastagePayload,
  createProductionBatchForm,
  createProductionEnergyForm,
  createProductionMaterialForm,
  createProductionMaterialUsageLine,
  createProductionOutputLine,
  createProductionPurchaseForm,
  createProductionWastageForm,
  filterProductionBatches,
  filterProductionMaterials,
  updateProductionFormListItem,
} from '../lib/production';

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

export default function Production() {
  const { color } = useBusinessType();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { toast, setToast, clearToast } = useToast();
  const [materialForm, setMaterialForm] = useState(createProductionMaterialForm);
  const [purchaseForm, setPurchaseForm] = useState(createProductionPurchaseForm);
  const [batchForm, setBatchForm] = useState(createProductionBatchForm);
  const [energyForm, setEnergyForm] = useState(createProductionEnergyForm);
  const [wastageForm, setWastageForm] = useState(createProductionWastageForm);
  const [materialSearch, setMaterialSearch] = useState('');
  const [batchSearch, setBatchSearch] = useState('');
  const batchSectionRef = useRef(null);

  const overviewQuery = useQuery({
    queryKey: ['production-overview'],
    queryFn: () => api.get('/production/overview').then((response) => response.data),
  });

  const batchesQuery = useQuery({
    queryKey: ['production-batches'],
    queryFn: () => api.get('/production/batches').then((response) => response.data.data ?? response.data ?? []),
  });

  const materialsQuery = useQuery({
    queryKey: ['production-materials'],
    queryFn: () => api.get('/raw-materials').then((response) => response.data.data ?? response.data ?? []),
  });

  const productsQuery = useQuery({
    queryKey: ['production-products'],
    queryFn: () => api.get('/products?limit=50').then((response) => response.data.data ?? response.data ?? []),
  });
  const productionQueries = [overviewQuery, batchesQuery, materialsQuery, productsQuery];
  const overview = overviewQuery.data;
  const batches = batchesQuery.data ?? [];
  const materials = materialsQuery.data ?? [];
  const products = productsQuery.data ?? [];

  const refreshProduction = () => {
    ['production-overview', 'production-batches', 'production-materials', 'dashboard-stats', 'inventory'].forEach((key) =>
      queryClient.invalidateQueries({ queryKey: [key] }),
    );
  };

  const createMaterial = useMutation({
    mutationFn: (payload) => api.post('/raw-materials', payload).then((response) => response.data),
    onSuccess: () => {
      refreshProduction();
      setMaterialForm(createProductionMaterialForm());
      clearToast();
      setToast({ tone: 'success', message: 'Raw material saved into the factory input register.' });
    },
    onError: (error) => {
      setToast({ tone: 'error', message: getErrorMessage(error, 'We could not save that raw material right now.') });
    },
  });

  const createPurchase = useMutation({
    mutationFn: (payload) => api.post('/production/purchases', payload).then((response) => response.data),
    onSuccess: () => {
      refreshProduction();
      setPurchaseForm(createProductionPurchaseForm());
      clearToast();
      setToast({ tone: 'success', message: 'Supplier purchase logged into the packaging spend ledger.' });
    },
    onError: (error) => {
      setToast({ tone: 'error', message: getErrorMessage(error, 'We could not save that supplier purchase right now.') });
    },
  });

  const createBatch = useMutation({
    mutationFn: (payload) => api.post('/production/batches', payload).then((response) => response.data),
    onSuccess: () => {
      refreshProduction();
      setBatchForm(createProductionBatchForm());
      clearToast();
      setToast({ tone: 'success', message: 'Production batch saved into the factory run ledger.' });
    },
    onError: (error) => {
      setToast({ tone: 'error', message: getErrorMessage(error, 'We could not save that production batch right now.') });
    },
  });

  const createEnergyLog = useMutation({
    mutationFn: (payload) => api.post('/production/energy-logs', payload).then((response) => response.data),
    onSuccess: () => {
      refreshProduction();
      setEnergyForm(createProductionEnergyForm());
      clearToast();
      setToast({ tone: 'success', message: 'Energy log recorded for the production desk.' });
    },
    onError: (error) => {
      setToast({ tone: 'error', message: getErrorMessage(error, 'We could not save that energy log right now.') });
    },
  });

  const createWastageLog = useMutation({
    mutationFn: (payload) => api.post('/production/wastage-logs', payload).then((response) => response.data),
    onSuccess: () => {
      refreshProduction();
      setWastageForm(createProductionWastageForm());
      clearToast();
      setToast({ tone: 'success', message: 'Wastage log recorded for production follow-through.' });
    },
    onError: (error) => {
      setToast({ tone: 'error', message: getErrorMessage(error, 'We could not save that wastage log right now.') });
    },
  });

  const startBatch = useMutation({
    mutationFn: (batchId) => api.post(`/production/batches/${batchId}/start`, {}).then((response) => response.data),
    onSuccess: () => {
      refreshProduction();
      clearToast();
      setToast({ tone: 'success', message: 'Production batch started.' });
    },
    onError: (error) => {
      setToast({ tone: 'error', message: getErrorMessage(error, 'We could not start that batch right now.') });
    },
  });

  const completeBatch = useMutation({
    mutationFn: (batchId) => api.post(`/production/batches/${batchId}/complete`, {
      damaged_quantity: 0,
      wastage_quantity: 0,
    }).then((response) => response.data),
    onSuccess: () => {
      refreshProduction();
      clearToast();
      setToast({ tone: 'success', message: 'Production batch completed and closed.' });
    },
    onError: (error) => {
      setToast({ tone: 'error', message: getErrorMessage(error, 'We could not complete that batch right now.') });
    },
  });

  const summary = overview?.summary ?? {};
  const reports = overview?.reports ?? {};
  const lowStockMaterials = overview?.low_stock_materials ?? [];
  const overviewMetrics = buildProductionDeskMetrics(summary, batches, lowStockMaterials);
  const materialCards = useMemo(
    () => filterProductionMaterials(materials, materialSearch).map((material) => buildProductionLowStockPresentation(material)),
    [materialSearch, materials],
  );
  const lowStockPresentations = lowStockMaterials.map((material) => buildProductionLowStockPresentation(material));
  const batchPresentations = useMemo(
    () => filterProductionBatches(batches, batchSearch).map((batch) => ({ raw: batch, ...buildProductionBatchPresentation(batch) })),
    [batchSearch, batches],
  );
  const packagingSpendPresentations = (reports.packaging_spend ?? []).map((entry) => buildProductionSpendPresentation(entry));
  const supplierBalancePresentations = (reports.supplier_spend ?? []).map((entry) => buildProductionSupplierBalancePresentation(entry));
  const costTrendPresentations = (reports.cost_per_bag_trend ?? []).map((entry) => buildProductionCostTrendPresentation(entry));
  const hasPageError = productionQueries.some((query) => query.isError);
  const loadError = getErrorMessage(
    productionQueries.find((query) => query.isError)?.error,
    'We could not load the production desk right now.',
  );

  useEffect(() => {
    if (searchParams.get('section') === 'batches' && batchSectionRef.current) {
      batchSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchParams]);

  return (
    <PageShell width="wide" className="page-stack">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Production feedback" />

      <PageHero
        eyebrow="Factory Command"
        title="Pure water production economics"
        description="Track energy, packaging, wastage, and margin so daily output never hides quiet profit leaks."
        aside={<span style={{ color }}>Today's output pulse</span>}
      />

      {hasPageError ? (
        <QueryErrorPanel
          message={loadError}
          onRetry={() => {
            productionQueries.forEach((query) => {
              void query.refetch();
            });
          }}
        />
      ) : null}

      <ResponsiveCardGrid variant="metrics" className="xl:grid-cols-9">
        {overviewMetrics.map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            tone={metric.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader title="Register Material" subtitle="Packaging, chemicals, supplier posture, and reorder controls captured explicitly for cleaner factory planning." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              createMaterial.mutate(buildProductionMaterialPayload(materialForm));
            }}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <input className="input" value={materialForm.name} onChange={(event) => setMaterialForm({ ...materialForm, name: event.target.value })} placeholder="Material name" />
              <input className="input" value={materialForm.sku} onChange={(event) => setMaterialForm({ ...materialForm, sku: event.target.value })} placeholder="SKU" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="input" value={materialForm.unit} onChange={(event) => setMaterialForm({ ...materialForm, unit: event.target.value })} placeholder="Unit" />
              <select className="input" value={materialForm.material_category} onChange={(event) => setMaterialForm({ ...materialForm, material_category: event.target.value })}>
                <option value="packaging">Packaging</option>
                <option value="chemical">Chemical</option>
                <option value="consumable">Consumable</option>
                <option value="spare_part">Spare part</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <input className="input" value={materialForm.quantity} onChange={(event) => setMaterialForm({ ...materialForm, quantity: event.target.value })} placeholder="Opening quantity" />
              <input className="input" value={materialForm.cost_per_unit} onChange={(event) => setMaterialForm({ ...materialForm, cost_per_unit: event.target.value })} placeholder="Cost per unit" />
              <input className="input" value={materialForm.reorder_level} onChange={(event) => setMaterialForm({ ...materialForm, reorder_level: event.target.value })} placeholder="Reorder level" />
              <input className="input" value={materialForm.low_stock_threshold} onChange={(event) => setMaterialForm({ ...materialForm, low_stock_threshold: event.target.value })} placeholder="Critical threshold" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="input" value={materialForm.supplier_name} onChange={(event) => setMaterialForm({ ...materialForm, supplier_name: event.target.value })} placeholder="Supplier name" />
              <input className="input" value={materialForm.supplier_phone} onChange={(event) => setMaterialForm({ ...materialForm, supplier_phone: event.target.value })} placeholder="Supplier phone" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="input" value={materialForm.supplier_balance} onChange={(event) => setMaterialForm({ ...materialForm, supplier_balance: event.target.value })} placeholder="Supplier balance" />
              <input className="input" value={materialForm.last_purchase_cost} onChange={(event) => setMaterialForm({ ...materialForm, last_purchase_cost: event.target.value })} placeholder="Last purchase cost" />
            </div>
            <textarea className="input min-h-[108px] resize-y py-3" value={materialForm.description} onChange={(event) => setMaterialForm({ ...materialForm, description: event.target.value })} placeholder="Material notes" />
            <Button type="submit" size="lg" className="w-full rounded-2xl">
              {createMaterial.isPending ? 'Saving raw material...' : 'Save raw material'}
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Log Supplier Purchase" subtitle="Track replenishment cost, amount paid, and supplier exposure inside the production spend flow." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              createPurchase.mutate(buildProductionPurchasePayload(purchaseForm));
            }}
          >
            <select className="input" value={purchaseForm.raw_material_id} onChange={(event) => setPurchaseForm({ ...purchaseForm, raw_material_id: event.target.value })}>
              <option value="">Select material</option>
              {materials.map((material) => <option key={material.id} value={material.id}>{material.name}</option>)}
            </select>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="input" value={purchaseForm.supplier_name} onChange={(event) => setPurchaseForm({ ...purchaseForm, supplier_name: event.target.value })} placeholder="Supplier name" />
              <input className="input" value={purchaseForm.supplier_phone} onChange={(event) => setPurchaseForm({ ...purchaseForm, supplier_phone: event.target.value })} placeholder="Supplier phone" />
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <input className="input" value={purchaseForm.quantity} onChange={(event) => setPurchaseForm({ ...purchaseForm, quantity: event.target.value })} placeholder="Quantity" />
              <input className="input" value={purchaseForm.unit_cost} onChange={(event) => setPurchaseForm({ ...purchaseForm, unit_cost: event.target.value })} placeholder="Unit cost" />
              <input className="input" value={purchaseForm.amount_paid} onChange={(event) => setPurchaseForm({ ...purchaseForm, amount_paid: event.target.value })} placeholder="Amount paid" />
              <input className="input" type="date" value={purchaseForm.purchased_at} onChange={(event) => setPurchaseForm({ ...purchaseForm, purchased_at: event.target.value })} />
            </div>
            <textarea className="input min-h-[108px] resize-y py-3" value={purchaseForm.notes} onChange={(event) => setPurchaseForm({ ...purchaseForm, notes: event.target.value })} placeholder="Purchase notes" />
            <Button type="submit" size="lg" className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700">
              {createPurchase.isPending ? 'Saving supplier purchase...' : 'Save supplier purchase'}
            </Button>
          </form>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
            <CardHeader
              title="Material Register"
              subtitle="Factory inputs already on hand with supplier, threshold, and unit-cost context for the next production call."
              className="mb-0"
            />
            <input
              className="input md:min-w-[280px]"
              value={materialSearch}
              onChange={(event) => setMaterialSearch(event.target.value)}
              placeholder="Search material, supplier, SKU, or category..."
            />
          </div>
          <div className="mt-4 space-y-3">
            {materialCards.map((material) => (
              <div key={material.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">{material.title}</p>
                    <p className="text-sm text-slate-500">{material.meta}</p>
                    <p className="text-sm text-slate-500">Supplier: {material.supplierLabel}</p>
                  </div>
                  <div className="space-y-1 text-left md:text-right">
                    <p className="text-sm font-semibold text-slate-900">{material.unitCostLabel}</p>
                    <p className="text-xs text-slate-500">{material.reorderLabel}</p>
                    <p className="text-xs text-slate-500">{material.thresholdLabel}</p>
                  </div>
                </div>
              </div>
            ))}
            {!materialCards.length ? (
              <p className="text-sm text-slate-500">No raw materials matched the current search.</p>
            ) : null}
          </div>
        </Card>

        <Card>
          <CardHeader title="Low Stock Pressure" subtitle="Packaging and chemicals that can quietly stop output if replenishment slips." />
          <div className="space-y-3">
            {lowStockPresentations.length > 0 ? lowStockPresentations.map((material) => (
              <div key={material.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-semibold text-slate-900">{material.title}</p>
                <p className="text-sm text-slate-600">{material.meta}</p>
                <p className="text-sm text-amber-700">Supplier: {material.supplierLabel}</p>
                <p className="mt-1 text-xs text-slate-500">{material.reorderLabel} | {material.thresholdLabel}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No low-stock raw materials right now.</p>}
          </div>
        </Card>
      </section>

      <section ref={batchSectionRef} className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader title="Create Production Batch" subtitle="Capture packaging, power mix, labour, losses, and finished output in one stronger factory-run save flow." />
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              createBatch.mutate(buildProductionBatchPayload(batchForm));
            }}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <input className="input" type="date" value={batchForm.production_date} onChange={(event) => setBatchForm({ ...batchForm, production_date: event.target.value })} />
              <input className="input" value={batchForm.machine_runtime_hours} onChange={(event) => setBatchForm({ ...batchForm, machine_runtime_hours: event.target.value })} placeholder="Machine runtime hours" />
              <input className="input" value={batchForm.downtime_minutes} onChange={(event) => setBatchForm({ ...batchForm, downtime_minutes: event.target.value })} placeholder="Downtime minutes" />
              <input className="input" value={batchForm.public_power_hours} onChange={(event) => setBatchForm({ ...batchForm, public_power_hours: event.target.value })} placeholder="Public power hours" />
              <input className="input" value={batchForm.electricity_cost} onChange={(event) => setBatchForm({ ...batchForm, electricity_cost: event.target.value })} placeholder="Electricity cost" />
              <input className="input" value={batchForm.generator_runtime_hours} onChange={(event) => setBatchForm({ ...batchForm, generator_runtime_hours: event.target.value })} placeholder="Generator runtime hours" />
              <input className="input" value={batchForm.generator_fuel_cost} onChange={(event) => setBatchForm({ ...batchForm, generator_fuel_cost: event.target.value })} placeholder="Generator fuel cost" />
              <input className="input" value={batchForm.labour_cost} onChange={(event) => setBatchForm({ ...batchForm, labour_cost: event.target.value })} placeholder="Labour cost" />
              <input className="input" value={batchForm.loading_cost} onChange={(event) => setBatchForm({ ...batchForm, loading_cost: event.target.value })} placeholder="Loading cost" />
              <input className="input" value={batchForm.maintenance_allocation} onChange={(event) => setBatchForm({ ...batchForm, maintenance_allocation: event.target.value })} placeholder="Maintenance allocation" />
              <input className="input" value={batchForm.sachets_per_bag} onChange={(event) => setBatchForm({ ...batchForm, sachets_per_bag: event.target.value })} placeholder="Sachets per bag" />
              <input className="input" value={batchForm.leakage_losses} onChange={(event) => setBatchForm({ ...batchForm, leakage_losses: event.target.value })} placeholder="Leakage losses" />
              <input className="input" value={batchForm.torn_sacks} onChange={(event) => setBatchForm({ ...batchForm, torn_sacks: event.target.value })} placeholder="Torn sacks" />
              <input className="input" value={batchForm.damaged_nylon} onChange={(event) => setBatchForm({ ...batchForm, damaged_nylon: event.target.value })} placeholder="Damaged nylon" />
            </div>

            <textarea className="input min-h-[108px] resize-y py-3" value={batchForm.notes} onChange={(event) => setBatchForm({ ...batchForm, notes: event.target.value })} placeholder="Batch notes" />

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-slate-900">Material usage</p>
                  <Button type="button" variant="ghost" size="sm" className="px-0 text-slate-600 hover:bg-transparent" onClick={() => setBatchForm({ ...batchForm, materials: [...batchForm.materials, createProductionMaterialUsageLine()] })}>
                    Add line
                  </Button>
                </div>
                <div className="space-y-3">
                  {batchForm.materials.map((material, index) => (
                    <div key={`material-${index}`} className="grid gap-3 md:grid-cols-3">
                      <select className="input" value={material.raw_material_id} onChange={(event) => setBatchForm({ ...batchForm, materials: updateProductionFormListItem(batchForm.materials, index, 'raw_material_id', event.target.value) })}>
                        <option value="">Select material</option>
                        {materials.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
                      </select>
                      <input className="input" value={material.quantity_used} onChange={(event) => setBatchForm({ ...batchForm, materials: updateProductionFormListItem(batchForm.materials, index, 'quantity_used', event.target.value) })} placeholder="Qty used" />
                      <input className="input" value={material.cost_per_unit} onChange={(event) => setBatchForm({ ...batchForm, materials: updateProductionFormListItem(batchForm.materials, index, 'cost_per_unit', event.target.value) })} placeholder="Cost per unit" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-slate-900">Finished output</p>
                  <Button type="button" variant="ghost" size="sm" className="px-0 text-slate-600 hover:bg-transparent" onClick={() => setBatchForm({ ...batchForm, outputs: [...batchForm.outputs, createProductionOutputLine()] })}>
                    Add line
                  </Button>
                </div>
                <div className="space-y-3">
                  {batchForm.outputs.map((output, index) => (
                    <div key={`output-${index}`} className="grid gap-3 md:grid-cols-3">
                      <select className="input" value={output.product_id} onChange={(event) => setBatchForm({ ...batchForm, outputs: updateProductionFormListItem(batchForm.outputs, index, 'product_id', event.target.value) })}>
                        <option value="">Select product</option>
                        {products.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
                      </select>
                      <input className="input" value={output.quantity_produced} onChange={(event) => setBatchForm({ ...batchForm, outputs: updateProductionFormListItem(batchForm.outputs, index, 'quantity_produced', event.target.value) })} placeholder="Qty produced" />
                      <input className="input" value={output.selling_price} onChange={(event) => setBatchForm({ ...batchForm, outputs: updateProductionFormListItem(batchForm.outputs, index, 'selling_price', event.target.value) })} placeholder="Selling price" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full rounded-2xl bg-cyan-700 hover:bg-cyan-800">
              {createBatch.isPending ? 'Saving production batch...' : 'Save production batch'}
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Operational Logs" subtitle="Capture outages, fuel burn, and packaging damage while the run is still fresh." />
            <div className="space-y-6">
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  clearToast();
                  createEnergyLog.mutate(buildProductionEnergyPayload(energyForm));
                }}
              >
                <p className="text-sm font-semibold text-slate-900">Energy log</p>
                <select className="input" value={energyForm.production_batch_id} onChange={(event) => setEnergyForm({ ...energyForm, production_batch_id: event.target.value })}>
                  <option value="">Attach batch (optional)</option>
                  {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.batch_number}</option>)}
                </select>
                <select className="input" value={energyForm.energy_source} onChange={(event) => setEnergyForm({ ...energyForm, energy_source: event.target.value })}>
                  <option value="generator">Generator</option>
                  <option value="public_power">Public power</option>
                  <option value="solar_backup">Solar backup</option>
                </select>
                <div className="grid gap-3 md:grid-cols-2">
                  <input className="input" value={energyForm.runtime_hours} onChange={(event) => setEnergyForm({ ...energyForm, runtime_hours: event.target.value })} placeholder="Runtime hours" />
                  <input className="input" value={energyForm.cost} onChange={(event) => setEnergyForm({ ...energyForm, cost: event.target.value })} placeholder="Cost" />
                  <input className="input" value={energyForm.fuel_litres} onChange={(event) => setEnergyForm({ ...energyForm, fuel_litres: event.target.value })} placeholder="Fuel litres" />
                  <input className="input" value={energyForm.outage_minutes} onChange={(event) => setEnergyForm({ ...energyForm, outage_minutes: event.target.value })} placeholder="Outage minutes" />
                </div>
                <input className="input" type="date" value={energyForm.logged_at} onChange={(event) => setEnergyForm({ ...energyForm, logged_at: event.target.value })} />
                <textarea className="input min-h-[96px] resize-y py-3" value={energyForm.notes} onChange={(event) => setEnergyForm({ ...energyForm, notes: event.target.value })} placeholder="Energy notes" />
                <Button type="submit" size="lg" className="w-full rounded-2xl">
                  {createEnergyLog.isPending ? 'Saving energy log...' : 'Save energy log'}
                </Button>
              </form>

              <form
                className="space-y-3 border-t border-slate-100 pt-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  clearToast();
                  createWastageLog.mutate(buildProductionWastagePayload(wastageForm));
                }}
              >
                <p className="text-sm font-semibold text-slate-900">Wastage log</p>
                <select className="input" value={wastageForm.production_batch_id} onChange={(event) => setWastageForm({ ...wastageForm, production_batch_id: event.target.value })}>
                  <option value="">Attach batch (optional)</option>
                  {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.batch_number}</option>)}
                </select>
                <select className="input" value={wastageForm.raw_material_id} onChange={(event) => setWastageForm({ ...wastageForm, raw_material_id: event.target.value })}>
                  <option value="">Select material</option>
                  {materials.map((material) => <option key={material.id} value={material.id}>{material.name}</option>)}
                </select>
                <select className="input" value={wastageForm.loss_type} onChange={(event) => setWastageForm({ ...wastageForm, loss_type: event.target.value })}>
                  <option value="leakage">Leakage</option>
                  <option value="torn_sacks">Torn sacks</option>
                  <option value="damaged_nylon">Damaged nylon</option>
                  <option value="general_waste">General waste</option>
                </select>
                <div className="grid gap-3 md:grid-cols-2">
                  <input className="input" value={wastageForm.quantity} onChange={(event) => setWastageForm({ ...wastageForm, quantity: event.target.value })} placeholder="Quantity" />
                  <input className="input" value={wastageForm.estimated_cost} onChange={(event) => setWastageForm({ ...wastageForm, estimated_cost: event.target.value })} placeholder="Estimated cost" />
                </div>
                <input className="input" type="date" value={wastageForm.logged_at} onChange={(event) => setWastageForm({ ...wastageForm, logged_at: event.target.value })} />
                <textarea className="input min-h-[96px] resize-y py-3" value={wastageForm.notes} onChange={(event) => setWastageForm({ ...wastageForm, notes: event.target.value })} placeholder="Wastage notes" />
                <Button type="submit" size="lg" className="w-full rounded-2xl bg-rose-600 hover:bg-rose-700">
                  {createWastageLog.isPending ? 'Saving wastage log...' : 'Save wastage log'}
                </Button>
              </form>
            </div>
          </Card>

          <Card>
            <CardHeader title="Cost Trend" subtitle="Recent cost-per-bag and margin direction across the latest factory runs." />
            <div className="space-y-3">
              {costTrendPresentations.length ? costTrendPresentations.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{entry.dateLabel}</p>
                      <p className="text-sm text-slate-500">Cost per bag: {entry.costPerBagLabel}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{entry.marginLabel}</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Revenue {entry.revenueLabel} | Total cost {entry.totalCostLabel}</p>
                </div>
              )) : <EmptyState icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14" title="No production trend yet" description="Trend data will build here as batches are completed." className="py-4" />}
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
            <CardHeader
              title="Production Batches"
              subtitle="Watch margin, losses, output, and operational stage across each recorded production run."
              className="mb-0"
            />
            <input
              className="input md:min-w-[280px]"
              value={batchSearch}
              onChange={(event) => setBatchSearch(event.target.value)}
              placeholder="Search batch, notes, output, or material..."
            />
          </div>
          <div className="mt-4 space-y-4">
            {batchPresentations.map((batch) => (
              <div key={batch.id} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{batch.batchNumber}</p>
                    <p className="text-sm text-slate-500">{batch.productionDate}</p>
                    <p className="text-sm text-slate-500">Output: {batch.outputLabel} | Packaging: {batch.packagingCostLabel}</p>
                    <p className="mt-1 text-xs text-slate-500">{batch.runtimeLabel}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${batch.statusTone}`}>
                    {batch.statusLabel}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  {batch.metrics.map((metric) => (
                    <div key={metric.label} className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{metric.label}</p>
                      <p className="mt-2 font-semibold text-slate-900">{metric.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Losses</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{batch.lossesLabel}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Material Lines</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{batch.materialCountLabel}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Output Lines</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{batch.outputCountLabel}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600">{batch.notesLabel}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {batch.canStart ? (
                    <Button type="button" size="lg" className="rounded-2xl bg-sky-600 hover:bg-sky-700" onClick={() => {
                      clearToast();
                      startBatch.mutate(batch.raw.id);
                    }}>
                      {startBatch.isPending ? 'Starting batch...' : 'Start batch'}
                    </Button>
                  ) : null}
                  {batch.canComplete ? (
                    <Button type="button" size="lg" className="rounded-2xl bg-emerald-600 hover:bg-emerald-700" onClick={() => {
                      clearToast();
                      completeBatch.mutate(batch.raw.id);
                    }}>
                      {completeBatch.isPending ? 'Completing batch...' : 'Complete batch'}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
            {!batchPresentations.length ? (
              <EmptyState
                icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                title="No production batches matched your search"
                description="Try a different search, or log a new batch above."
                className="py-4"
              />
            ) : null}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Packaging Spend" subtitle="Who is currently consuming the packaging budget inside the factory supply chain." />
            <div className="space-y-3">
              {packagingSpendPresentations.length ? packagingSpendPresentations.map((entry) => (
                <div key={entry.supplierName} className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{entry.supplierName}</p>
                  <p className="text-sm text-slate-600">{entry.totalSpendLabel}</p>
                </div>
              )) : <p className="text-sm text-slate-500">No packaging spend has been recorded yet.</p>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Supplier Balances" subtitle="Outstanding production-input spend that still needs settlement control." />
            <div className="space-y-3">
              {supplierBalancePresentations.length ? supplierBalancePresentations.map((entry) => (
                <div key={entry.supplierName} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{entry.supplierName}</p>
                  <p className="text-sm text-slate-600">Spend: {entry.spendLabel}</p>
                  <p className="text-sm text-amber-700">Outstanding: {entry.outstandingLabel}</p>
                </div>
              )) : <p className="text-sm text-slate-500">No supplier balance exposure has been recorded yet.</p>}
            </div>
          </Card>
        </div>
      </section>
    </PageShell>
  );
}
