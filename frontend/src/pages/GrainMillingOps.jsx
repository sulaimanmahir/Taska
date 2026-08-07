import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Card, { CardHeader } from '../components/Card';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import { useBusinessType } from '../config';
import {
  buildGrainMillingBatchCard,
  buildGrainMillingBatchPayload,
  buildGrainMillingOverviewMetrics,
  createGrainMillingBatchForm,
  grainTypeOptions,
} from '../lib/grainMilling';
import { formatCurrencyNGN } from '../lib/financeFormatters';

function QueryErrorPanel({ message, onRetry }) {
  if (!message) {
    return null;
  }

  return (
    <Card className="border-rose-200 bg-rose-50">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-rose-800">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
        >
          Retry
        </button>
      </div>
    </Card>
  );
}

export default function GrainMillingOps() {
  const { color = '#7C3AED' } = useBusinessType();
  const accentColor = color || '#7C3AED';
  const queryClient = useQueryClient();
  const [batchForm, setBatchForm] = useState(createGrainMillingBatchForm);

  const overviewQuery = useQuery({
    queryKey: ['grain-milling-overview'],
    queryFn: () => api.get('/grain-milling/overview').then((response) => response.data),
  });

  const batchesQuery = useQuery({
    queryKey: ['grain-milling-batches'],
    queryFn: () => api.get('/grain-milling/batches').then((response) => response.data ?? []),
  });

  const batches = batchesQuery.data ?? [];
  const summary = overviewQuery.data?.summary ?? {};
  const millingQueries = [overviewQuery, batchesQuery];
  const millingError = millingQueries.find((query) => query.isError)?.error;

  const refreshMillingQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['grain-milling-overview'] });
    queryClient.invalidateQueries({ queryKey: ['grain-milling-batches'] });
  };

  const handleRetry = () => {
    millingQueries.forEach((query) => {
      void query.refetch();
    });
  };

  const createBatch = useMutation({
    mutationFn: (payload) => api.post('/grain-milling/batches', payload).then((response) => response.data),
    onSuccess: () => {
      refreshMillingQueries();
      setBatchForm(createGrainMillingBatchForm());
    },
  });

  const overviewMetrics = buildGrainMillingOverviewMetrics(summary, formatCurrencyNGN);
  const batchCards = batches.map((batch) => buildGrainMillingBatchCard(batch, formatCurrencyNGN));

  const handleBatchSubmit = (event) => {
    event.preventDefault();
    createBatch.mutate(buildGrainMillingBatchPayload(batchForm));
  };

  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="Grain Milling Desk"
        title="Track input, output, and yield on every milling run"
        description="Log each milling batch with grain intake, processed output, byproduct recovery, and wastage so yield stays visible run over run."
      />

      <ResponsiveCardGrid variant="metrics" className="2xl:grid-cols-3">
        {overviewMetrics.map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            tone={metric.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <QueryErrorPanel
        message={millingError ? 'We could not load part of the grain milling workspace right now. Please try again.' : ''}
        onRetry={handleRetry}
      />

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader title="Log Milling Batch" subtitle="Record grain in, processed output, and byproduct/waste split" />
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleBatchSubmit}>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Milling Date</span>
              <input
                type="date"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={batchForm.milling_date}
                onChange={(event) => setBatchForm({ ...batchForm, milling_date: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Grain Type</span>
              <select
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={batchForm.grain_type}
                onChange={(event) => setBatchForm({ ...batchForm, grain_type: event.target.value })}
              >
                {grainTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Input Quantity (kg)</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={batchForm.input_quantity_kg}
                onChange={(event) => setBatchForm({ ...batchForm, input_quantity_kg: event.target.value })}
                placeholder="e.g. 1000"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Output Quantity (kg)</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={batchForm.output_quantity_kg}
                onChange={(event) => setBatchForm({ ...batchForm, output_quantity_kg: event.target.value })}
                placeholder="e.g. 780"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Byproduct Quantity (kg)</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={batchForm.byproduct_quantity_kg}
                onChange={(event) => setBatchForm({ ...batchForm, byproduct_quantity_kg: event.target.value })}
                placeholder="e.g. 180"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Wastage Quantity (kg)</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={batchForm.wastage_quantity_kg}
                onChange={(event) => setBatchForm({ ...batchForm, wastage_quantity_kg: event.target.value })}
                placeholder="e.g. 40"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Labour Cost</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={batchForm.labour_cost}
                onChange={(event) => setBatchForm({ ...batchForm, labour_cost: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Electricity Cost</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={batchForm.electricity_cost}
                onChange={(event) => setBatchForm({ ...batchForm, electricity_cost: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
              <span>Packaging Cost</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={batchForm.packaging_cost}
                onChange={(event) => setBatchForm({ ...batchForm, packaging_cost: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
              <span>Notes</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={batchForm.notes}
                onChange={(event) => setBatchForm({ ...batchForm, notes: event.target.value })}
                placeholder="Optional batch notes"
              />
            </label>
            <button
              type="submit"
              disabled={createBatch.isPending}
              className="rounded-2xl px-5 py-4 text-sm font-semibold text-white shadow-lg md:col-span-2"
              style={{ background: createBatch.isPending ? '#94a3b8' : accentColor }}
            >
              {createBatch.isPending ? 'Saving batch...' : 'Save milling batch'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Recent Batches" subtitle="Yield, byproduct, and cost per run" />
          <div className="space-y-3">
            {batchCards.length ? batchCards.map((card) => (
              <div key={card.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{card.batchNumber}</p>
                    <p className="text-sm text-slate-500">{card.grainTypeLabel} · {card.millingDate}</p>
                  </div>
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold uppercase text-violet-700">
                    {card.yieldLabel}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-4">
                  <span>{card.inputLabel}</span>
                  <span>{card.outputLabel}</span>
                  <span>{card.byproductLabel}</span>
                  <span>{card.wastageLabel}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">Total cost: {card.totalCostLabel}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No milling batches logged yet.</p>}
          </div>
        </Card>
      </section>
    </div>
  );
}
