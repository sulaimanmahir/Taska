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
  buildFuelAlertItem,
  buildFuelDeskMetrics,
  buildFuelDipPayload,
  buildFuelLossMetrics,
  buildFuelPriceChangePayload,
  buildFuelPumpCard,
  buildFuelPumpPayload,
  buildFuelReadingPayload,
  buildFuelShiftPayload,
  buildFuelTankCard,
  buildFuelTankPayload,
  createFuelDipForm,
  createFuelPriceForm,
  createFuelPumpForm,
  createFuelReadingForm,
  createFuelShiftForm,
  createFuelTankForm,
  filterFuelAlerts,
  fuelTypes,
} from '../lib/fuel';

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

export default function FuelOps() {
  const { labels } = useBusinessType();
  const queryClient = useQueryClient();
  const { toast, setToast, clearToast } = useToast();
  const [tankForm, setTankForm] = useState(createFuelTankForm);
  const [pumpForm, setPumpForm] = useState(createFuelPumpForm);
  const [readingForm, setReadingForm] = useState(() => createFuelReadingForm());
  const [dipForm, setDipForm] = useState(() => createFuelDipForm());
  const [shiftForm, setShiftForm] = useState(() => createFuelShiftForm());
  const [priceForm, setPriceForm] = useState(createFuelPriceForm);
  const [alertSearch, setAlertSearch] = useState('');

  const refresh = () => {
    ['fuel-overview', 'fuel-tanks', 'fuel-pumps', 'fuel-readings', 'fuel-dips', 'fuel-shifts', 'fuel-price-changes', 'fuel-alerts', 'fuel-desk'].forEach((key) => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  };

  const { data, error, refetch } = useQuery({
    queryKey: ['fuel-desk'],
    queryFn: async () => {
      const [overview, tanks, pumps, readings, dips, shifts, priceChanges, alerts] = await Promise.all([
        api.get('/fuel/overview').then((response) => response.data),
        api.get('/fuel/tanks').then((response) => response.data),
        api.get('/fuel/pumps').then((response) => response.data),
        api.get('/fuel/nozzle-readings').then((response) => response.data),
        api.get('/fuel/tank-dips').then((response) => response.data),
        api.get('/fuel/shifts').then((response) => response.data),
        api.get('/fuel/price-changes').then((response) => response.data),
        api.get('/fuel/alerts').then((response) => response.data),
      ]);

      return { overview, tanks, pumps, readings, dips, shifts, priceChanges, alerts };
    },
    staleTime: 60000,
  });

  const overview = data?.overview;
  const tanks = data?.tanks || [];
  const pumps = data?.pumps || [];
  const alerts = data?.alerts || [];

  const saveTank = useMutation({
    mutationFn: (payload) => api.post('/fuel/tanks', payload).then((response) => response.data),
    onSuccess: () => {
      setTankForm(createFuelTankForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Fuel tank saved into the wet-stock register.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that fuel tank right now.') });
    },
  });

  const savePump = useMutation({
    mutationFn: (payload) => api.post('/fuel/pumps', payload).then((response) => response.data),
    onSuccess: () => {
      setPumpForm(createFuelPumpForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Fuel pump saved into the forecourt register.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that fuel pump right now.') });
    },
  });

  const saveReading = useMutation({
    mutationFn: (payload) => api.post('/fuel/nozzle-readings', payload).then((response) => response.data),
    onSuccess: () => {
      setReadingForm(createFuelReadingForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Nozzle reading captured into the station ledger.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that nozzle reading right now.') });
    },
  });

  const saveDip = useMutation({
    mutationFn: (payload) => api.post('/fuel/tank-dips', payload).then((response) => response.data),
    onSuccess: () => {
      setDipForm(createFuelDipForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Tank dip logged into the wet-stock variance trail.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that tank dip right now.') });
    },
  });

  const saveShift = useMutation({
    mutationFn: (payload) => api.post('/fuel/shifts', payload).then((response) => response.data),
    onSuccess: () => {
      setShiftForm(createFuelShiftForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Shift close saved with cash and recovery context.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not close that shift right now.') });
    },
  });

  const savePriceChange = useMutation({
    mutationFn: (payload) => api.post('/fuel/price-changes', payload).then((response) => response.data),
    onSuccess: () => {
      setPriceForm(createFuelPriceForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Fuel price change recorded into the station history.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not log that price change right now.') });
    },
  });

  const deskMetrics = useMemo(
    () => buildFuelDeskMetrics(overview?.summary, tanks, pumps, alerts, formatCurrency),
    [overview?.summary, tanks, pumps, alerts],
  );
  const filteredAlerts = useMemo(
    () => filterFuelAlerts(alerts, alertSearch).map((alert) => buildFuelAlertItem(alert)),
    [alerts, alertSearch],
  );

  return (
    <div className="space-y-5">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Fuel operations feedback" />

      <PageHero
        eyebrow="Fuel Station Control"
        title={`${labels.inventory || 'Fuel operations'} command centre`}
        description="Watch tank stock, nozzle accuracy, wet-stock variance, attendant shortages, theft signals, and price changes from one stronger fuel operations desk."
      />

      {error ? (
        <QueryErrorPanel
          message={getErrorMessage(error, 'We could not load the fuel operations desk right now.')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-8">
        {deskMetrics.map((metric) => (
          <OpsMetricCard key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} tone={metric.tone} />
        ))}
      </ResponsiveCardGrid>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Nozzle and Shift Control" subtitle="Capture pump output, attendant remittance, and the exact leak point." />
          <form
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveReading.mutate(buildFuelReadingPayload(readingForm));
            }}
          >
            <select className="input" value={readingForm.fuel_pump_id} onChange={(event) => setReadingForm({ ...readingForm, fuel_pump_id: event.target.value })}>
              <option value="">Pump</option>
              {pumps.map((pump) => <option key={pump.id} value={pump.id}>{pump.name}{pump.tank ? ` - ${pump.tank.name}` : ''}</option>)}
            </select>
            <input className="input" placeholder="Attendant" value={readingForm.attendant_name} onChange={(event) => setReadingForm({ ...readingForm, attendant_name: event.target.value })} />
            <input className="input" type="date" value={readingForm.reading_date} onChange={(event) => setReadingForm({ ...readingForm, reading_date: event.target.value })} />
            <input className="input" placeholder="Shift name" value={readingForm.shift_name} onChange={(event) => setReadingForm({ ...readingForm, shift_name: event.target.value })} />
            <input className="input" type="number" min="0" step="0.01" placeholder="Opening meter" value={readingForm.opening_reading} onChange={(event) => setReadingForm({ ...readingForm, opening_reading: event.target.value })} />
            <input className="input" type="number" min="0" step="0.01" placeholder="Closing meter" value={readingForm.closing_reading} onChange={(event) => setReadingForm({ ...readingForm, closing_reading: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Price per litre" value={readingForm.unit_price} onChange={(event) => setReadingForm({ ...readingForm, unit_price: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Cash reported" value={readingForm.cash_reported} onChange={(event) => setReadingForm({ ...readingForm, cash_reported: event.target.value })} />
            <button type="submit" className="md:col-span-2 mt-1 w-full rounded-2xl bg-slate-900 px-4 py-4 font-semibold text-white shadow-lg shadow-slate-900/10">
              {saveReading.isPending ? 'Saving nozzle reading...' : 'Save nozzle reading'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Loss and Fraud Watch" subtitle="The controls owners check before closing the day." />
          <div className="space-y-3">
            <ResponsiveCardGrid variant="default" className="md:grid-cols-3">
              {buildFuelLossMetrics(overview?.summary, formatCurrency).map((metric) => (
                <OpsMetricCard key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} tone={metric.tone} />
              ))}
            </ResponsiveCardGrid>
            <input className="input" placeholder="Search alert type, severity, or detail..." value={alertSearch} onChange={(event) => setAlertSearch(event.target.value)} />
            <div className="space-y-2">
              {filteredAlerts.slice(0, 4).map((alertItem) => (
                <div key={alertItem.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900">{alertItem.title}</p>
                    <span className="text-xs font-semibold uppercase tracking-wide text-rose-700">{alertItem.severityLabel}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{alertItem.details}</p>
                </div>
              ))}
              {!filteredAlerts.length ? <p className="text-sm text-slate-500">No fuel alerts matched the current search.</p> : null}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <Card>
          <CardHeader title="Tank Register" subtitle="Know what should be inside each tank and where refill pressure sits." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveTank.mutate(buildFuelTankPayload(tankForm));
            }}
          >
            <input className="input" placeholder="Tank name" value={tankForm.name} onChange={(event) => setTankForm({ ...tankForm, name: event.target.value })} />
            <select className="input" value={tankForm.fuel_type} onChange={(event) => setTankForm({ ...tankForm, fuel_type: event.target.value })}>
              {fuelTypes.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}
            </select>
            <input className="input" type="number" min="0" placeholder="Capacity litres" value={tankForm.capacity_litres} onChange={(event) => setTankForm({ ...tankForm, capacity_litres: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Current stock litres" value={tankForm.current_stock_litres} onChange={(event) => setTankForm({ ...tankForm, current_stock_litres: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Reorder level litres" value={tankForm.reorder_level_litres} onChange={(event) => setTankForm({ ...tankForm, reorder_level_litres: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Price per litre" value={tankForm.price_per_litre} onChange={(event) => setTankForm({ ...tankForm, price_per_litre: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white">
              {saveTank.isPending ? 'Saving tank...' : 'Save tank'}
            </button>
          </form>
          <div className="mt-3 space-y-2">
            {tanks.slice(0, 4).map((tank) => {
              const tankCard = buildFuelTankCard(tank, formatCurrency);
              return (
                <div key={tankCard.id} className="rounded-2xl bg-slate-50 px-3 py-3">
                  <p className="font-medium text-slate-900">{tankCard.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{tankCard.fuelLabel}</p>
                  <p className="mt-1 text-xs text-slate-500">{tankCard.stockLabel}</p>
                  <p className="mt-1 text-xs text-slate-500">{tankCard.reorderLabel} | {tankCard.priceLabel}</p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Pump Setup" subtitle="Map pumps to tanks and attendants with live forecourt context." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              savePump.mutate(buildFuelPumpPayload(pumpForm));
            }}
          >
            <select className="input" value={pumpForm.fuel_tank_id} onChange={(event) => setPumpForm({ ...pumpForm, fuel_tank_id: event.target.value })}>
              <option value="">Linked tank</option>
              {tanks.map((tank) => <option key={tank.id} value={tank.id}>{tank.name}</option>)}
            </select>
            <input className="input" placeholder="Pump name" value={pumpForm.name} onChange={(event) => setPumpForm({ ...pumpForm, name: event.target.value })} />
            <input className="input" placeholder="Pump code" value={pumpForm.code} onChange={(event) => setPumpForm({ ...pumpForm, code: event.target.value })} />
            <input className="input" placeholder="Attendant" value={pumpForm.attendant_name} onChange={(event) => setPumpForm({ ...pumpForm, attendant_name: event.target.value })} />
            <input className="input" type="number" min="1" placeholder="Nozzle count" value={pumpForm.nozzle_count} onChange={(event) => setPumpForm({ ...pumpForm, nozzle_count: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Opening meter" value={pumpForm.meter_reading_start} onChange={(event) => setPumpForm({ ...pumpForm, meter_reading_start: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-emerald-700 px-4 py-3 font-semibold text-white">
              {savePump.isPending ? 'Saving pump...' : 'Save pump'}
            </button>
          </form>
          <div className="mt-3 space-y-2">
            {pumps.slice(0, 4).map((pump) => {
              const pumpCard = buildFuelPumpCard(pump);
              return (
                <div key={pumpCard.id} className="rounded-2xl bg-slate-50 px-3 py-3">
                  <p className="font-medium text-slate-900">{pumpCard.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{pumpCard.tankLabel}</p>
                  <p className="mt-1 text-xs text-slate-500">{pumpCard.attendantLabel} | {pumpCard.nozzleLabel}</p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Tank Dip Log" subtitle="Catch wet-stock variance before it becomes theft." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveDip.mutate(buildFuelDipPayload(dipForm));
            }}
          >
            <select className="input" value={dipForm.fuel_tank_id} onChange={(event) => setDipForm({ ...dipForm, fuel_tank_id: event.target.value })}>
              <option value="">Tank</option>
              {tanks.map((tank) => <option key={tank.id} value={tank.id}>{tank.name}</option>)}
            </select>
            <input className="input" type="datetime-local" value={dipForm.dipped_at} onChange={(event) => setDipForm({ ...dipForm, dipped_at: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Opening stock litres" value={dipForm.opening_stock_litres} onChange={(event) => setDipForm({ ...dipForm, opening_stock_litres: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Deliveries received litres" value={dipForm.deliveries_received_litres} onChange={(event) => setDipForm({ ...dipForm, deliveries_received_litres: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Closing stock litres" value={dipForm.closing_stock_litres} onChange={(event) => setDipForm({ ...dipForm, closing_stock_litres: event.target.value })} />
            <textarea className="input min-h-[108px] resize-y py-3" rows={3} placeholder="Notes" value={dipForm.notes} onChange={(event) => setDipForm({ ...dipForm, notes: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-amber-600 px-4 py-3 font-semibold text-white">
              {saveDip.isPending ? 'Saving dip...' : 'Save dip'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Price and Shift Close" subtitle="Protect price discipline and shortage recovery with cleaner end-of-day capture." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveShift.mutate(buildFuelShiftPayload(shiftForm));
            }}
          >
            <input className="input" placeholder="Attendant" value={shiftForm.attendant_name} onChange={(event) => setShiftForm({ ...shiftForm, attendant_name: event.target.value })} />
            <input className="input" placeholder="Shift name" value={shiftForm.shift_name} onChange={(event) => setShiftForm({ ...shiftForm, shift_name: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Cash expected" value={shiftForm.cash_expected} onChange={(event) => setShiftForm({ ...shiftForm, cash_expected: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Cash reported" value={shiftForm.cash_reported} onChange={(event) => setShiftForm({ ...shiftForm, cash_reported: event.target.value })} />
            <input className="input" type="number" min="0" placeholder="Recovery amount" value={shiftForm.recovery_amount} onChange={(event) => setShiftForm({ ...shiftForm, recovery_amount: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-rose-700 px-4 py-3 font-semibold text-white">
              {saveShift.isPending ? 'Closing shift...' : 'Close shift'}
            </button>
          </form>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                clearToast();
                savePriceChange.mutate(buildFuelPriceChangePayload(priceForm));
              }}
            >
              <select className="input" value={priceForm.fuel_type} onChange={(event) => setPriceForm({ ...priceForm, fuel_type: event.target.value })}>
                {fuelTypes.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}
              </select>
              <input className="input" type="number" min="0" placeholder="New price per litre" value={priceForm.new_price} onChange={(event) => setPriceForm({ ...priceForm, new_price: event.target.value })} />
              <input className="input" placeholder="Changed by" value={priceForm.changed_by_name} onChange={(event) => setPriceForm({ ...priceForm, changed_by_name: event.target.value })} />
              <input className="input" placeholder="Reason" value={priceForm.reason} onChange={(event) => setPriceForm({ ...priceForm, reason: event.target.value })} />
              <button type="submit" className="w-full rounded-2xl bg-violet-700 px-4 py-3 font-semibold text-white">
                {savePriceChange.isPending ? 'Logging price change...' : 'Log price change'}
              </button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
