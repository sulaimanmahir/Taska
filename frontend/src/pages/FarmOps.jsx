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
  buildFarmCycleCard,
  buildFarmCycleOptionLabel,
  buildFarmCyclePayload,
  buildFarmDeskMetrics,
  buildFarmFieldPulseMetrics,
  buildFarmHarvestCard,
  buildFarmHarvestPayload,
  buildFarmInputPayload,
  buildFarmOverviewMetrics,
  buildFarmPlotCard,
  buildFarmPlotPayload,
  createFarmCycleForm,
  createFarmHarvestForm,
  createFarmInputForm,
  createFarmPlotForm,
  filterFarmCycles,
  filterFarmHarvests,
  filterFarmPlots,
} from '../lib/farm';

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

export default function FarmOps() {
  const queryClient = useQueryClient();
  const { toast, setToast, clearToast } = useToast();
  const [plotForm, setPlotForm] = useState(createFarmPlotForm);
  const [cycleForm, setCycleForm] = useState(createFarmCycleForm);
  const [inputForm, setInputForm] = useState(createFarmInputForm);
  const [harvestForm, setHarvestForm] = useState(createFarmHarvestForm);
  const [plotSearch, setPlotSearch] = useState('');
  const [cycleSearch, setCycleSearch] = useState('');
  const [harvestSearch, setHarvestSearch] = useState('');

  const { data: overview, error, refetch } = useQuery({
    queryKey: ['farm-overview'],
    queryFn: () => api.get('/farm/overview').then((response) => response.data),
    staleTime: 60000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['farm-overview'] });
  };

  const savePlot = useMutation({
    mutationFn: (payload) => api.post('/farm/plots', payload).then((response) => response.data),
    onSuccess: () => {
      setPlotForm(createFarmPlotForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Plot saved into the farm register.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that plot right now.') });
    },
  });

  const saveCycle = useMutation({
    mutationFn: (payload) => api.post('/farm/planting-cycles', payload).then((response) => response.data),
    onSuccess: () => {
      setCycleForm(createFarmCycleForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Planting cycle added to the field desk.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that planting cycle right now.') });
    },
  });

  const saveInput = useMutation({
    mutationFn: (payload) => api.post('/farm/input-logs', payload).then((response) => response.data),
    onSuccess: () => {
      setInputForm(createFarmInputForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Field input recorded into the crop log.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that input log right now.') });
    },
  });

  const saveHarvest = useMutation({
    mutationFn: (payload) => api.post('/farm/harvest-logs', payload).then((response) => response.data),
    onSuccess: () => {
      setHarvestForm(createFarmHarvestForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Harvest log captured with field yield and loss visibility.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that harvest log right now.') });
    },
  });

  const plots = overview?.plots || [];
  const plantingCycles = overview?.planting_cycles || [];
  const inputLogs = overview?.input_logs || [];
  const harvestLogs = overview?.harvest_logs || [];

  const overviewMetrics = useMemo(
    () => buildFarmOverviewMetrics(overview?.summary, formatCurrencyNGN),
    [overview?.summary],
  );
  const deskMetrics = useMemo(
    () => buildFarmDeskMetrics(overview?.summary, plots, plantingCycles, inputLogs, harvestLogs, formatCurrencyNGN),
    [overview?.summary, plots, plantingCycles, inputLogs, harvestLogs],
  );
  const fieldPulse = useMemo(
    () => buildFarmFieldPulseMetrics(overview?.summary),
    [overview?.summary],
  );
  const filteredPlots = useMemo(
    () => filterFarmPlots(plots, plotSearch).map((plot) => buildFarmPlotCard(plot)),
    [plots, plotSearch],
  );
  const filteredCycles = useMemo(
    () => filterFarmCycles(plantingCycles, cycleSearch).map((cycle) => buildFarmCycleCard(cycle)),
    [plantingCycles, cycleSearch],
  );
  const filteredHarvests = useMemo(
    () => filterFarmHarvests(harvestLogs, harvestSearch).map((harvest) => buildFarmHarvestCard(harvest, formatCurrencyNGN)),
    [harvestLogs, harvestSearch],
  );

  return (
    <div className="space-y-5">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Farm operations feedback" />

      <PageHero
        eyebrow="Crop Farming"
        title="Plots, planting cycles, inputs, and harvest yield in one stronger field console."
        description="Built for agribusiness owners who need to know where inputs are going, which plots are producing, and where losses are creeping in."
      />

      {error ? (
        <QueryErrorPanel
          message={getErrorMessage(error, 'We could not load farm operations right now.')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      <ResponsiveCardGrid variant="metrics">
        {overviewMetrics.map(([label, value, tone]) => (
          <OpsMetricCard key={label} label={label} value={value} tone={tone} />
        ))}
      </ResponsiveCardGrid>

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-6">
        {deskMetrics.map((metric) => (
          <OpsMetricCard key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} tone={metric.tone} />
        ))}
      </ResponsiveCardGrid>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Plot Register" subtitle="Map land, location, size, and soil posture into one field register." />
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              savePlot.mutate(buildFarmPlotPayload(plotForm));
            }}
          >
            <input value={plotForm.name} onChange={(event) => setPlotForm({ ...plotForm, name: event.target.value })} placeholder="Plot name" className="input" />
            <input value={plotForm.location} onChange={(event) => setPlotForm({ ...plotForm, location: event.target.value })} placeholder="Location" className="input" />
            <input value={plotForm.size_hectares} onChange={(event) => setPlotForm({ ...plotForm, size_hectares: event.target.value })} placeholder="Hectares" type="number" className="input" />
            <input value={plotForm.soil_type} onChange={(event) => setPlotForm({ ...plotForm, soil_type: event.target.value })} placeholder="Soil type" className="input" />
            <button type="submit" disabled={savePlot.isPending} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white md:col-span-2">
              {savePlot.isPending ? 'Saving plot...' : 'Save plot'}
            </button>
          </form>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader title="Plot Watch" subtitle="Search live field coverage by plot, location, and soil type." className="mb-0" />
            <input className="input" placeholder="Search plot, location, or soil type..." value={plotSearch} onChange={(event) => setPlotSearch(event.target.value)} />
          </div>
          <div className="mt-4 space-y-3">
            {filteredPlots.slice(0, 6).map((plotCard) => (
              <div key={plotCard.id} className="rounded-3xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{plotCard.title}</p>
                <p className="mt-1 text-xs text-slate-500">{plotCard.meta}</p>
              </div>
            ))}
            {!filteredPlots.length ? <p className="text-sm text-slate-500">No plots matched the current search.</p> : null}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader title="Planting Cycle" subtitle="Track crop, season, plot, and expected harvest timing in one active cycle desk." />
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveCycle.mutate(buildFarmCyclePayload(cycleForm));
            }}
          >
            <select value={cycleForm.plot_id} onChange={(event) => setCycleForm({ ...cycleForm, plot_id: event.target.value })} className="input">
              <option value="">Select plot</option>
              {plots.map((plot) => <option key={plot.id} value={plot.id}>{plot.name}</option>)}
            </select>
            <input value={cycleForm.crop_name} onChange={(event) => setCycleForm({ ...cycleForm, crop_name: event.target.value })} placeholder="Crop name" className="input" />
            <input value={cycleForm.season_name} onChange={(event) => setCycleForm({ ...cycleForm, season_name: event.target.value })} placeholder="Season" className="input" />
            <select value={cycleForm.status} onChange={(event) => setCycleForm({ ...cycleForm, status: event.target.value })} className="input">
              <option value="planned">planned</option>
              <option value="planted">planted</option>
              <option value="growing">growing</option>
            </select>
            <input value={cycleForm.planting_date} onChange={(event) => setCycleForm({ ...cycleForm, planting_date: event.target.value })} type="date" className="input" />
            <input value={cycleForm.expected_harvest_date} onChange={(event) => setCycleForm({ ...cycleForm, expected_harvest_date: event.target.value })} type="date" className="input" />
            <input value={cycleForm.planted_area_hectares} onChange={(event) => setCycleForm({ ...cycleForm, planted_area_hectares: event.target.value })} placeholder="Cultivated area" type="number" className="input md:col-span-2" />
            <button type="submit" disabled={saveCycle.isPending} className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white md:col-span-2">
              {saveCycle.isPending ? 'Saving planting cycle...' : 'Save planting cycle'}
            </button>
          </form>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader title="Cycle Watch" subtitle="Search active crop cycles by crop, season, plot, or status." className="mb-0" />
            <input className="input" placeholder="Search crop, season, plot, or status..." value={cycleSearch} onChange={(event) => setCycleSearch(event.target.value)} />
          </div>
          <div className="mt-4 space-y-3">
            {filteredCycles.slice(0, 6).map((cycleCard) => (
              <div key={cycleCard.id} className="rounded-3xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{cycleCard.title}</p>
                <p className="mt-1 text-xs text-slate-500">{cycleCard.meta}</p>
                <p className="mt-1 text-xs text-slate-500">{cycleCard.dateLabel}</p>
              </div>
            ))}
            {!filteredCycles.length ? <p className="text-sm text-slate-500">No planting cycles matched the current search.</p> : null}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader title="Input Application" subtitle="Capture fertilizer, chemicals, seeds, and field spend with cycle linkage." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveInput.mutate(buildFarmInputPayload(inputForm));
            }}
          >
            <select value={inputForm.planting_cycle_id} onChange={(event) => setInputForm({ ...inputForm, planting_cycle_id: event.target.value })} className="input">
              <option value="">Select cycle</option>
              {plantingCycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{buildFarmCycleOptionLabel(cycle)}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input value={inputForm.input_type} onChange={(event) => setInputForm({ ...inputForm, input_type: event.target.value })} placeholder="Input type" className="input" />
              <input value={inputForm.input_name} onChange={(event) => setInputForm({ ...inputForm, input_name: event.target.value })} placeholder="Input name" className="input" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input value={inputForm.quantity} onChange={(event) => setInputForm({ ...inputForm, quantity: event.target.value })} placeholder="Quantity" type="number" className="input" />
              <input value={inputForm.unit} onChange={(event) => setInputForm({ ...inputForm, unit: event.target.value })} placeholder="Unit" className="input" />
              <input value={inputForm.cost} onChange={(event) => setInputForm({ ...inputForm, cost: event.target.value })} placeholder="Cost" type="number" className="input" />
            </div>
            <input value={inputForm.applied_on} onChange={(event) => setInputForm({ ...inputForm, applied_on: event.target.value })} type="date" className="input" />
            <button type="submit" disabled={saveInput.isPending} className="w-full rounded-2xl bg-lime-700 px-4 py-3 text-sm font-semibold text-white">
              {saveInput.isPending ? 'Saving input log...' : 'Save input log'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Harvest Log and Field Pulse" subtitle="Capture yield, losses, and revenue while keeping the harvest desk searchable." />
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveHarvest.mutate(buildFarmHarvestPayload(harvestForm));
            }}
          >
            <select value={harvestForm.planting_cycle_id} onChange={(event) => setHarvestForm({ ...harvestForm, planting_cycle_id: event.target.value })} className="input md:col-span-2">
              <option value="">Select cycle</option>
              {plantingCycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{buildFarmCycleOptionLabel(cycle)}</option>)}
            </select>
            <input value={harvestForm.quantity_harvested} onChange={(event) => setHarvestForm({ ...harvestForm, quantity_harvested: event.target.value })} placeholder="Harvest quantity" type="number" className="input" />
            <input value={harvestForm.unit} onChange={(event) => setHarvestForm({ ...harvestForm, unit: event.target.value })} placeholder="Unit" className="input" />
            <input value={harvestForm.estimated_revenue} onChange={(event) => setHarvestForm({ ...harvestForm, estimated_revenue: event.target.value })} placeholder="Estimated revenue" type="number" className="input" />
            <input value={harvestForm.loss_quantity} onChange={(event) => setHarvestForm({ ...harvestForm, loss_quantity: event.target.value })} placeholder="Loss quantity" type="number" className="input" />
            <input value={harvestForm.harvested_on} onChange={(event) => setHarvestForm({ ...harvestForm, harvested_on: event.target.value })} type="date" className="input md:col-span-2" />
            <button type="submit" disabled={saveHarvest.isPending} className="rounded-2xl bg-emerald-800 px-4 py-3 text-sm font-semibold text-white md:col-span-2">
              {saveHarvest.isPending ? 'Saving harvest log...' : 'Save harvest log'}
            </button>
          </form>

          <ResponsiveCardGrid variant="default" className="mt-6 md:grid-cols-2">
            {fieldPulse.map((metric) => (
              <OpsMetricCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
            ))}
          </ResponsiveCardGrid>

          <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-5">
            <input className="input" placeholder="Search crop, plot, unit, or harvest date..." value={harvestSearch} onChange={(event) => setHarvestSearch(event.target.value)} />
            <div className="space-y-3">
              {filteredHarvests.slice(0, 5).map((harvestCard) => (
                <div key={harvestCard.id} className="rounded-3xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{harvestCard.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{harvestCard.meta}</p>
                      <p className="mt-1 text-xs text-rose-600">{harvestCard.lossLabel}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{harvestCard.revenueLabel}</p>
                  </div>
                </div>
              ))}
              {!filteredHarvests.length ? <p className="text-sm text-slate-500">No harvest logs matched the current search.</p> : null}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
