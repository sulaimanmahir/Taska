import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Card, { CardHeader } from '../components/Card';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useBusinessType } from '../config';
import { getErrorMessage } from '../lib/apiFeedback';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import {
  buildAgroAdvisoryCard,
  buildAgroAdvisoryPayload,
  buildAgroDeskMetrics,
  buildAgroForecastCard,
  buildAgroForecastPayload,
  buildAgroPressureMetrics,
  buildAgroProgrammeSaleCard,
  buildAgroRecoveryCard,
  buildAgroRecoveryCompletionPayload,
  buildAgroRecoveryPayload,
  buildAgroSubsidySalePayload,
  createAgroAdvisoryForm,
  createAgroForecastForm,
  createAgroRecoveryForm,
  createAgroSubsidyForm,
  filterAgroAdvisories,
  filterAgroForecasts,
  filterAgroRecoveries,
  filterAgroSubsidySales,
} from '../lib/agro';

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

export default function AgroOps() {
  const { labels } = useBusinessType();
  const queryClient = useQueryClient();
  const { toast, setToast, clearToast } = useToast();
  const [forecastForm, setForecastForm] = useState(createAgroForecastForm);
  const [subsidyForm, setSubsidyForm] = useState(() => createAgroSubsidyForm());
  const [recoveryForm, setRecoveryForm] = useState(createAgroRecoveryForm);
  const [advisoryForm, setAdvisoryForm] = useState(() => createAgroAdvisoryForm());
  const [saleSearch, setSaleSearch] = useState('');
  const [recoverySearch, setRecoverySearch] = useState('');
  const [forecastSearch, setForecastSearch] = useState('');
  const [advisorySearch, setAdvisorySearch] = useState('');

  const refresh = () => {
    ['agro-overview', 'agro-forecasts', 'agro-subsidy-sales', 'agro-recoveries', 'agro-advisories', 'customers', 'products'].forEach((key) => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  };

  const { data, error, refetch } = useQuery({
    queryKey: ['agro-desk'],
    queryFn: async () => {
      const [overview, customers, products, forecasts, subsidySales, recoveries, advisories] = await Promise.all([
        api.get('/agro/overview').then((response) => response.data),
        api.get('/customers').then((response) => response.data.data || response.data || []),
        api.get('/products').then((response) => response.data.data || response.data || []),
        api.get('/agro/forecasts').then((response) => response.data),
        api.get('/agro/subsidy-sales').then((response) => response.data),
        api.get('/agro/recoveries').then((response) => response.data),
        api.get('/agro/advisories').then((response) => response.data),
      ]);

      return { overview, customers, products, forecasts, subsidySales, recoveries, advisories };
    },
    staleTime: 60000,
  });

  const saveForecast = useMutation({
    mutationFn: (payload) => api.post('/agro/forecasts', payload).then((response) => response.data),
    onSuccess: () => {
      setForecastForm(createAgroForecastForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Seasonal forecast saved into the agro planning desk.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that seasonal forecast right now.') });
    },
  });

  const saveSubsidySale = useMutation({
    mutationFn: (payload) => api.post('/agro/subsidy-sales', payload).then((response) => response.data),
    onSuccess: () => {
      setSubsidyForm(createAgroSubsidyForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Programme sale saved into the subsidy ledger.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that programme sale right now.') });
    },
  });

  const saveRecovery = useMutation({
    mutationFn: (payload) => api.post('/agro/recoveries', payload).then((response) => response.data),
    onSuccess: () => {
      setRecoveryForm(createAgroRecoveryForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Farmer recovery case added to the collections queue.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that recovery case right now.') });
    },
  });

  const updateRecovery = useMutation({
    mutationFn: ({ id, payload }) => api.patch(`/agro/recoveries/${id}`, payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Recovery case marked settled and queue totals refreshed.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not update that recovery case right now.') });
    },
  });

  const saveAdvisory = useMutation({
    mutationFn: (payload) => api.post('/agro/advisories', payload).then((response) => response.data),
    onSuccess: () => {
      setAdvisoryForm(createAgroAdvisoryForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Field advisory captured into the regional intelligence log.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that field advisory right now.') });
    },
  });

  const overview = data?.overview;
  const customers = data?.customers || [];
  const products = data?.products || [];
  const forecasts = data?.forecasts || [];
  const subsidySales = data?.subsidySales || [];
  const recoveries = data?.recoveries || [];
  const advisories = data?.advisories || [];

  const deskMetrics = useMemo(
    () => buildAgroDeskMetrics(overview?.summary, forecasts, subsidySales, recoveries, advisories, formatCurrency),
    [overview?.summary, forecasts, subsidySales, recoveries, advisories],
  );
  const filteredSales = useMemo(
    () => filterAgroSubsidySales(subsidySales, saleSearch).map((sale) => buildAgroProgrammeSaleCard(sale, formatCurrency)),
    [subsidySales, saleSearch],
  );
  const filteredRecoveries = useMemo(
    () => filterAgroRecoveries(recoveries, recoverySearch).map((recovery) => ({
      source: recovery,
      card: buildAgroRecoveryCard(recovery, formatCurrency),
    })),
    [recoveries, recoverySearch],
  );
  const filteredForecasts = useMemo(
    () => filterAgroForecasts(forecasts, forecastSearch).map((forecast) => buildAgroForecastCard(forecast)),
    [forecasts, forecastSearch],
  );
  const filteredAdvisories = useMemo(
    () => filterAgroAdvisories(advisories, advisorySearch).map((advisory) => buildAgroAdvisoryCard(advisory)),
    [advisories, advisorySearch],
  );

  return (
    <div className="space-y-5">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Agro operations feedback" />

      <PageHero
        eyebrow="Agro Dealer Control"
        title={`${labels.customers || 'Agro operations'} command centre`}
        description="Plan seasonal demand, track programme-driven sales, recover farmer credit, and turn field guidance into regional buying intelligence from one stronger desk."
      />

      {error ? (
        <QueryErrorPanel
          message={getErrorMessage(error, 'We could not load the agro operations desk right now.')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-9">
        {deskMetrics.map((metric) => (
          <OpsMetricCard key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} tone={metric.tone} />
        ))}
      </ResponsiveCardGrid>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Government and Programme Sales" subtitle="Track subsidy fulfilment, receivables, and regional programme flow with a cleaner ledger capture." />
          <form
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveSubsidySale.mutate(buildAgroSubsidySalePayload(subsidyForm));
            }}
          >
            <select className="input" value={subsidyForm.customer_id} onChange={(event) => setSubsidyForm({ ...subsidyForm, customer_id: event.target.value })}>
              <option value="">Farmer customer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            <select className="input" value={subsidyForm.product_id} onChange={(event) => setSubsidyForm({ ...subsidyForm, product_id: event.target.value })}>
              <option value="">Input product</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <input className="input" placeholder="Programme name" value={subsidyForm.programme_name} onChange={(event) => setSubsidyForm({ ...subsidyForm, programme_name: event.target.value })} />
            <input className="input" placeholder="Agency" value={subsidyForm.agency_name} onChange={(event) => setSubsidyForm({ ...subsidyForm, agency_name: event.target.value })} />
            <input className="input" placeholder="Region" value={subsidyForm.region_name} onChange={(event) => setSubsidyForm({ ...subsidyForm, region_name: event.target.value })} />
            <input className="input" placeholder="Season" value={subsidyForm.season_name} onChange={(event) => setSubsidyForm({ ...subsidyForm, season_name: event.target.value })} />
            <input className="input" placeholder="Input category" value={subsidyForm.input_category} onChange={(event) => setSubsidyForm({ ...subsidyForm, input_category: event.target.value })} />
            <input className="input" type="number" min="0" step="0.01" placeholder="Quantity" value={subsidyForm.quantity} onChange={(event) => setSubsidyForm({ ...subsidyForm, quantity: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Unit price" value={subsidyForm.unit_price} onChange={(event) => setSubsidyForm({ ...subsidyForm, unit_price: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Amount received" value={subsidyForm.amount_received} onChange={(event) => setSubsidyForm({ ...subsidyForm, amount_received: event.target.value })} />
            <input className="input md:col-span-2" type="date" value={subsidyForm.sale_date} onChange={(event) => setSubsidyForm({ ...subsidyForm, sale_date: event.target.value })} />
            <button type="submit" className="md:col-span-2 mt-1 w-full rounded-2xl bg-slate-900 px-4 py-4 font-semibold text-white shadow-lg shadow-slate-900/10">
              {saveSubsidySale.isPending ? 'Saving programme sale...' : 'Save programme sale'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Owner Pressure" subtitle="What quietly drains agro cash flow or weakens the next cycle." />
          <div className="space-y-3">
            <ResponsiveCardGrid variant="default">
              {buildAgroPressureMetrics(overview?.summary, formatCurrency).map((metric) => (
                <OpsMetricCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
              ))}
            </ResponsiveCardGrid>
            <div className="space-y-2">
              {filteredSales.slice(0, 3).map((saleCard) => (
                <div key={saleCard.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="font-medium text-slate-900">{saleCard.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{saleCard.meta}</p>
                  <p className="mt-1 text-xs text-slate-500">{saleCard.detailLabel}</p>
                </div>
              ))}
              {!filteredSales.length ? <p className="text-sm text-slate-500">No programme sales matched the current search.</p> : null}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Seasonal Forecast" subtitle="Plan the buying season before stock turns dead or misaligned by region." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveForecast.mutate(buildAgroForecastPayload(forecastForm));
            }}
          >
            <select className="input" value={forecastForm.product_id} onChange={(event) => setForecastForm({ ...forecastForm, product_id: event.target.value })}>
              <option value="">Input product</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <input className="input" placeholder="Season" value={forecastForm.season_name} onChange={(event) => setForecastForm({ ...forecastForm, season_name: event.target.value })} />
            <input className="input" placeholder="Region" value={forecastForm.region_name} onChange={(event) => setForecastForm({ ...forecastForm, region_name: event.target.value })} />
            <input className="input" type="number" min="0" step="0.01" placeholder="Forecast quantity" value={forecastForm.forecast_quantity} onChange={(event) => setForecastForm({ ...forecastForm, forecast_quantity: event.target.value })} />
            <input className="input" type="number" min="0" step="0.01" placeholder="Reserved quantity" value={forecastForm.reserved_quantity} onChange={(event) => setForecastForm({ ...forecastForm, reserved_quantity: event.target.value })} />
            <input className="input" type="number" min="0" max="100" placeholder="Confidence score" value={forecastForm.confidence_score} onChange={(event) => setForecastForm({ ...forecastForm, confidence_score: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white">
              {saveForecast.isPending ? 'Saving forecast...' : 'Save forecast'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Farmer Credit Recovery" subtitle="Keep field credit from swallowing margin or blocking the next sales cycle." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveRecovery.mutate(buildAgroRecoveryPayload(recoveryForm));
            }}
          >
            <select className="input" value={recoveryForm.customer_id} onChange={(event) => setRecoveryForm({ ...recoveryForm, customer_id: event.target.value })}>
              <option value="">Farmer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            <input className="input" placeholder="Region" value={recoveryForm.region_name} onChange={(event) => setRecoveryForm({ ...recoveryForm, region_name: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Credit amount" value={recoveryForm.credit_amount} onChange={(event) => setRecoveryForm({ ...recoveryForm, credit_amount: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Recovered amount" value={recoveryForm.recovered_amount} onChange={(event) => setRecoveryForm({ ...recoveryForm, recovered_amount: event.target.value })} />
            <input className="input" type="date" value={recoveryForm.due_date} onChange={(event) => setRecoveryForm({ ...recoveryForm, due_date: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-rose-700 px-4 py-3 font-semibold text-white">
              {saveRecovery.isPending ? 'Saving recovery case...' : 'Save recovery case'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Advisory Log" subtitle="Turn field advice into visible regional and product intelligence." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveAdvisory.mutate(buildAgroAdvisoryPayload(advisoryForm));
            }}
          >
            <select className="input" value={advisoryForm.customer_id} onChange={(event) => setAdvisoryForm({ ...advisoryForm, customer_id: event.target.value })}>
              <option value="">Farmer customer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            <input className="input" placeholder="Farmer name" value={advisoryForm.farmer_name} onChange={(event) => setAdvisoryForm({ ...advisoryForm, farmer_name: event.target.value })} />
            <input className="input" placeholder="Region" value={advisoryForm.region_name} onChange={(event) => setAdvisoryForm({ ...advisoryForm, region_name: event.target.value })} />
            <input className="input" placeholder="Advisory type" value={advisoryForm.advisory_type} onChange={(event) => setAdvisoryForm({ ...advisoryForm, advisory_type: event.target.value })} />
            <input className="input" placeholder="Crop or input" value={advisoryForm.crop_or_input} onChange={(event) => setAdvisoryForm({ ...advisoryForm, crop_or_input: event.target.value })} />
            <textarea className="input min-h-[108px] resize-y py-3" rows={3} placeholder="Recommendation" value={advisoryForm.recommendation} onChange={(event) => setAdvisoryForm({ ...advisoryForm, recommendation: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-emerald-700 px-4 py-3 font-semibold text-white">
              {saveAdvisory.isPending ? 'Saving advisory...' : 'Save advisory'}
            </button>
          </form>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader
              title="Recovery Queue"
              subtitle="The farmer balances that need a decision today, with searchable queue visibility."
              className="mb-0"
            />
            <input
              className="input"
              value={recoverySearch}
              onChange={(event) => setRecoverySearch(event.target.value)}
              placeholder="Search farmer, region, reference, status, or due date..."
            />
          </div>
          <div className="mt-4 space-y-3">
            {filteredRecoveries.map(({ source, card }) => (
              <div key={card.id} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{card.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{card.meta}</p>
                    <p className="mt-1 text-xs text-slate-500">{card.dueLabel}</p>
                  </div>
                  {!card.isRecovered ? (
                    <button
                      type="button"
                      className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                      onClick={() => updateRecovery.mutate({ id: source.id, payload: buildAgroRecoveryCompletionPayload(source) })}
                    >
                      Mark recovered
                    </button>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Recovered</span>
                  )}
                </div>
              </div>
            ))}
            {!filteredRecoveries.length ? <p className="text-sm text-slate-500">No recovery cases matched the current search.</p> : null}
          </div>
        </Card>

        <Card>
          <div className="space-y-5">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
              <CardHeader
                title="Regional Intelligence"
                subtitle="What owners should review before buying the next cycle."
                className="mb-0"
              />
              <input
                className="input"
                value={forecastSearch}
                onChange={(event) => setForecastSearch(event.target.value)}
                placeholder="Search forecast region, season, product, or quantity..."
              />
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              {filteredForecasts.slice(0, 4).map((forecastCard) => (
                <div key={forecastCard.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="font-medium text-slate-900">{forecastCard.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{forecastCard.meta}</p>
                  <p className="mt-1 text-xs text-slate-500">{forecastCard.confidenceLabel}</p>
                </div>
              ))}
              {!filteredForecasts.length ? <p className="text-sm text-slate-500">No forecasts matched the current search.</p> : null}
            </div>

            <div className="border-t border-slate-100 pt-5">
              <input
                className="input"
                value={advisorySearch}
                onChange={(event) => setAdvisorySearch(event.target.value)}
                placeholder="Search advisory type, region, farmer, or crop..."
              />
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                {filteredAdvisories.slice(0, 4).map((advisoryCard) => (
                  <div key={advisoryCard.id} className="rounded-2xl bg-lime-50 px-4 py-3">
                    <p className="font-medium text-lime-900">{advisoryCard.title}</p>
                    <p className="mt-1 text-xs text-lime-700">{advisoryCard.meta}</p>
                    <p className="mt-1 text-xs text-lime-700">{advisoryCard.farmerLabel}</p>
                  </div>
                ))}
                {!filteredAdvisories.length ? <p className="text-sm text-slate-500">No advisories matched the current search.</p> : null}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <input
                className="input"
                value={saleSearch}
                onChange={(event) => setSaleSearch(event.target.value)}
                placeholder="Search programme, agency, region, farmer, or product..."
              />
              <div className="mt-4 space-y-3">
                {filteredSales.slice(0, 4).map((saleCard) => (
                  <div key={saleCard.id} className="rounded-2xl bg-amber-50 px-4 py-3">
                    <p className="font-medium text-amber-900">{saleCard.title}</p>
                    <p className="mt-1 text-xs text-amber-700">{saleCard.meta}</p>
                    <p className="mt-1 text-xs text-amber-700">{saleCard.detailLabel}</p>
                  </div>
                ))}
                {!filteredSales.length ? <p className="text-sm text-slate-500">No programme sales matched the current search.</p> : null}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
