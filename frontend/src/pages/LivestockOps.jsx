import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Card, { CardHeader } from '../components/Card';
import OpsMetricCard from '../components/OpsMetricCard';
import { ResponsiveCardGrid } from '../components/PageShell';
import PageHero from '../components/PageHero';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/apiFeedback';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import {
  buildLivestockBreedingPayload,
  buildLivestockDeskMetrics,
  buildLivestockDiseasePayload,
  buildLivestockGroupCard,
  buildLivestockGroupPayload,
  buildLivestockMedicationPayload,
  buildLivestockMilkPayload,
  buildLivestockOutbreakCard,
  buildLivestockOverviewMetrics,
  buildLivestockPenPayload,
  buildLivestockSaleCard,
  buildLivestockSalePayload,
  buildLivestockWeightPayload,
  createLivestockFormState,
  filterLivestockGroups,
  filterLivestockOutbreaks,
  filterLivestockSales,
} from '../lib/livestock';

async function fetchOverview() {
  const { data } = await api.get('/livestock/overview');
  return data;
}

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

function QuickForm({ title, fields, actionLabel, onSubmit, busy }) {
  const [form, setForm] = useState(createLivestockFormState(fields));

  const submit = async (event) => {
    event.preventDefault();
    await onSubmit(form);
    setForm(createLivestockFormState(fields));
  };

  return (
    <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 grid gap-3">
        {fields.map((field) => (
          <label key={field.name} className="space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{field.label}</span>
            <input
              type={field.type ?? 'text'}
              value={form[field.name]}
              onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              required={field.required ?? true}
              placeholder={field.placeholder}
            />
          </label>
        ))}
      </div>
      <button
        type="submit"
        disabled={busy}
        className="mt-4 inline-flex rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 disabled:opacity-60"
      >
        {busy ? 'Saving...' : actionLabel}
      </button>
    </form>
  );
}

export default function LivestockOps() {
  const queryClient = useQueryClient();
  const { toast, setToast, clearToast } = useToast();
  const [groupSearch, setGroupSearch] = useState('');
  const [outbreakSearch, setOutbreakSearch] = useState('');
  const [saleSearch, setSaleSearch] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['livestock-overview'],
    queryFn: fetchOverview,
    staleTime: 60000,
  });

  const createMutation = useMutation({
    mutationFn: async ({ endpoint, payload }) => api.post(endpoint, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livestock-overview'] });
    },
  });

  const submit = (endpoint, payloadBuilder = (payload) => payload, successMessage) => async (payload) => {
    clearToast();
    try {
      await createMutation.mutateAsync({ endpoint, payload: payloadBuilder(payload) });
      setToast({ tone: 'success', message: successMessage });
    } catch (mutationError) {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that livestock record right now.') });
      throw mutationError;
    }
  };

  const stats = data?.totals ?? {};
  const groups = data?.groups ?? [];
  const outbreaks = data?.outbreaks ?? [];
  const sales = data?.sales ?? [];

  const deskMetrics = useMemo(
    () => buildLivestockDeskMetrics(stats, groups, outbreaks, sales, formatCurrencyNGN),
    [stats, groups, outbreaks, sales],
  );
  const filteredGroups = useMemo(
    () => filterLivestockGroups(groups, groupSearch).map((group) => buildLivestockGroupCard(group)),
    [groups, groupSearch],
  );
  const filteredOutbreaks = useMemo(
    () => filterLivestockOutbreaks(outbreaks, outbreakSearch).map((outbreak) => buildLivestockOutbreakCard(outbreak)),
    [outbreaks, outbreakSearch],
  );
  const filteredSales = useMemo(
    () => filterLivestockSales(sales, saleSearch).map((sale) => buildLivestockSaleCard(sale, formatCurrencyNGN)),
    [sales, saleSearch],
  );

  return (
    <div className="space-y-5">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Livestock operations feedback" />

      <PageHero
        eyebrow="Livestock Operations"
        title="Weight, milk, disease, breeding, and slaughter control"
        description="Track what drives margin in a livestock business and surface the losses that usually hide in poor health control, weak breeding performance, and untracked sales."
      />

      {error ? (
        <QueryErrorPanel
          message={getErrorMessage(error, 'We could not load livestock operations right now.')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      <ResponsiveCardGrid variant="metrics">
        {buildLivestockOverviewMetrics(stats, formatCurrencyNGN).map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            tone={metric.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-6">
        {deskMetrics.map((metric) => (
          <OpsMetricCard key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} tone={metric.tone} />
        ))}
      </ResponsiveCardGrid>

      <div className="grid gap-5 xl:grid-cols-3">
        <QuickForm
          title="Add Pen"
          actionLabel="Save pen"
          busy={createMutation.isPending}
          onSubmit={submit('/livestock/pens', buildLivestockPenPayload, 'Pen saved into the livestock register.')}
          fields={[
            { name: 'name', label: 'Pen name', placeholder: 'North Pen A' },
            { name: 'section', label: 'Section', required: false, placeholder: 'Dairy Wing' },
            { name: 'capacity', label: 'Capacity', type: 'number', placeholder: '40', defaultValue: 0 },
          ]}
        />
        <QuickForm
          title="Register Animal Group"
          actionLabel="Save group"
          busy={createMutation.isPending}
          onSubmit={submit('/livestock/groups', buildLivestockGroupPayload, 'Animal group added to the herd desk.')}
          fields={[
            { name: 'name', label: 'Group name', placeholder: 'Milking Herd 1' },
            { name: 'species', label: 'Species', placeholder: 'Cattle' },
            { name: 'breed', label: 'Breed', required: false, placeholder: 'Friesian' },
            { name: 'production_type', label: 'Production type', required: false, placeholder: 'milk' },
            { name: 'animal_count', label: 'Animal count', type: 'number', placeholder: '18', defaultValue: 0 },
            { name: 'average_weight_kg', label: 'Average weight', type: 'number', placeholder: '210', defaultValue: 0 },
            { name: 'pen_id', label: 'Pen ID', type: 'number', required: false, placeholder: '1' },
          ]}
        />
        <QuickForm
          title="Record Slaughter or Live Sale"
          actionLabel="Save sale"
          busy={createMutation.isPending}
          onSubmit={submit('/livestock/sales', buildLivestockSalePayload, 'Livestock sale recorded into the revenue desk.')}
          fields={[
            { name: 'animal_group_id', label: 'Group ID', type: 'number', required: false, placeholder: '1' },
            { name: 'sale_type', label: 'Sale type', placeholder: 'slaughter_sale' },
            { name: 'quantity', label: 'Quantity', type: 'number', placeholder: '3', defaultValue: 0 },
            { name: 'revenue', label: 'Revenue', type: 'number', placeholder: '450000', defaultValue: 0 },
            { name: 'customer_name', label: 'Customer', required: false, placeholder: 'Abattoir One' },
            { name: 'sold_on', label: 'Sold on', type: 'date' },
          ]}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-4">
        <QuickForm
          title="Weight Check"
          actionLabel="Save weight"
          busy={createMutation.isPending}
          onSubmit={submit('/livestock/weights', buildLivestockWeightPayload, 'Weight check saved to the herd performance log.')}
          fields={[
            { name: 'animal_group_id', label: 'Group ID', type: 'number', placeholder: '1' },
            { name: 'weight_kg', label: 'Weight kg', type: 'number', placeholder: '245' },
            { name: 'sample_size', label: 'Sample size', type: 'number', defaultValue: 1, placeholder: '4' },
          ]}
        />
        <QuickForm
          title="Milk Production"
          actionLabel="Save milk log"
          busy={createMutation.isPending}
          onSubmit={submit('/livestock/milk-logs', buildLivestockMilkPayload, 'Milk production log posted into the daily output desk.')}
          fields={[
            { name: 'animal_group_id', label: 'Group ID', type: 'number', placeholder: '1' },
            { name: 'litres', label: 'Litres', type: 'number', placeholder: '85' },
            { name: 'recorded_on', label: 'Recorded on', type: 'date' },
          ]}
        />
        <QuickForm
          title="Disease Outbreak"
          actionLabel="Log outbreak"
          busy={createMutation.isPending}
          onSubmit={submit('/livestock/disease-logs', buildLivestockDiseasePayload, 'Disease outbreak logged into the health alert queue.')}
          fields={[
            { name: 'animal_group_id', label: 'Group ID', type: 'number', required: false, placeholder: '1' },
            { name: 'disease_name', label: 'Disease', placeholder: 'Foot and Mouth' },
            { name: 'severity', label: 'Severity', required: false, placeholder: 'high' },
            { name: 'status', label: 'Status', required: false, placeholder: 'open' },
            { name: 'affected_count', label: 'Affected count', type: 'number', placeholder: '6', defaultValue: 0 },
            { name: 'recorded_on', label: 'Recorded on', type: 'date' },
          ]}
        />
        <QuickForm
          title="Medication or Breeding"
          actionLabel="Save record"
          busy={createMutation.isPending}
          onSubmit={async (payload) => {
            if (payload.record_type === 'breeding') {
              await submit('/livestock/breeding-records', buildLivestockBreedingPayload, 'Breeding record saved into the cycle tracker.')(payload);
              return;
            }

            await submit('/livestock/medications', buildLivestockMedicationPayload, 'Medication record saved into the treatment log.')(payload);
          }}
          fields={[
            { name: 'record_type', label: 'Type', placeholder: 'medication or breeding' },
            { name: 'animal_group_id', label: 'Group ID', type: 'number', placeholder: '1' },
            { name: 'medication_name', label: 'Medication name', required: false, placeholder: 'Oxytetracycline' },
            { name: 'treated_count', label: 'Treated count', type: 'number', required: false, defaultValue: 0, placeholder: '12' },
            { name: 'cost', label: 'Medication cost', type: 'number', required: false, defaultValue: 0, placeholder: '28000' },
            { name: 'administered_on', label: 'Medication date', type: 'date', required: false, defaultValue: new Date().toISOString().slice(0, 10) },
            { name: 'cycle_name', label: 'Breeding cycle', required: false, placeholder: 'Cycle Q2' },
            { name: 'paired_count', label: 'Paired count', type: 'number', required: false, defaultValue: 0, placeholder: '8' },
            { name: 'successful_births', label: 'Successful births', type: 'number', required: false, defaultValue: 0, placeholder: '6' },
            { name: 'expected_delivery_date', label: 'Expected delivery', type: 'date', required: false },
          ]}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader title="Animal Groups" subtitle="Search species, breed, pen, and production posture across active herds." className="mb-0" />
            <input className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" placeholder="Search group, species, breed, pen, or production type..." value={groupSearch} onChange={(event) => setGroupSearch(event.target.value)} />
          </div>
          <div className="mt-4 space-y-3">
            {(isLoading ? [] : filteredGroups).map((groupCard) => (
              <div key={groupCard.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{groupCard.title}</p>
                    <p className="text-xs text-slate-500">{groupCard.speciesLabel}</p>
                    <p className="mt-1 text-xs text-slate-500">{groupCard.productionLabel}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">{groupCard.status}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm text-slate-600">
                  <p>Count: <span className="font-semibold text-slate-900">{groupCard.countLabel}</span></p>
                  <p>Avg Wt: <span className="font-semibold text-slate-900">{groupCard.weightLabel}</span></p>
                  <p>Pen: <span className="font-semibold text-slate-900">{groupCard.penLabel}</span></p>
                </div>
              </div>
            ))}
            {!filteredGroups.length && !isLoading ? <p className="text-sm text-slate-500">No animal groups matched the current search.</p> : null}
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
              <CardHeader title="Open Disease Alerts" subtitle="Search severity, status, disease, and affected group." className="mb-0" />
              <input className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" placeholder="Search disease, severity, status, or group..." value={outbreakSearch} onChange={(event) => setOutbreakSearch(event.target.value)} />
            </div>
            <div className="mt-4 space-y-3">
              {filteredOutbreaks.map((outbreakCard) => (
                <div key={outbreakCard.id} className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                  <p className="text-sm font-semibold text-rose-900">{outbreakCard.title}</p>
                  <p className="mt-1 text-xs text-rose-700">{outbreakCard.detailLabel}</p>
                  <p className="mt-1 text-xs text-rose-700">{outbreakCard.groupLabel}</p>
                </div>
              ))}
              {!filteredOutbreaks.length ? <p className="text-sm text-slate-500">No outbreak alerts matched the current search.</p> : null}
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
              <CardHeader title="Recent Sales" subtitle="Search slaughter and live-sale activity with group and customer context." className="mb-0" />
              <input className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" placeholder="Search sale type, date, group, or customer..." value={saleSearch} onChange={(event) => setSaleSearch(event.target.value)} />
            </div>
            <div className="mt-4 space-y-3">
              {filteredSales.map((saleCard) => (
                <div key={saleCard.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{saleCard.title}</p>
                  <p className="mt-1 text-xs text-slate-600">{saleCard.detailLabel}</p>
                  <p className="mt-1 text-xs text-slate-500">{saleCard.groupLabel}</p>
                </div>
              ))}
              {!filteredSales.length ? <p className="text-sm text-slate-500">No sales matched the current search.</p> : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
