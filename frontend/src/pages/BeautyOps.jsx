import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Card, { CardHeader } from '../components/Card';
import EmptyState from '../components/EmptyState';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useBusinessType } from '../config';
import { getErrorMessage } from '../lib/apiFeedback';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import {
  buildBeautyAppointmentCard,
  buildBeautyAppointmentFloorCard,
  buildBeautyAppointmentPayload,
  buildBeautyCompletionPayload,
  buildBeautyDeskMetrics,
  buildBeautyOwnerFocusMetrics,
  buildBeautyQueueCard,
  buildBeautyServiceCard,
  buildBeautyServicePayload,
  buildBeautyStaffCard,
  createBeautyAppointmentForm,
  createBeautyCompletionForm,
  createBeautyServiceForm,
  createBeautyStaffForm,
  filterBeautyAppointments,
  filterBeautyServices,
  getBeautyActiveSection,
  getBeautyPendingAppointments,
} from '../lib/beauty';

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

const EMPTY_LIST = [];

export default function BeautyOps() {
  const { labels } = useBusinessType();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast, setToast, clearToast } = useToast();
  const activeSection = getBeautyActiveSection(location.pathname);
  const [serviceForm, setServiceForm] = useState(createBeautyServiceForm);
  const [staffForm, setStaffForm] = useState(createBeautyStaffForm);
  const [appointmentForm, setAppointmentForm] = useState(() => createBeautyAppointmentForm());
  const [completionForms, setCompletionForms] = useState({});
  const [serviceSearch, setServiceSearch] = useState('');
  const [appointmentSearch, setAppointmentSearch] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['beauty-overview'],
    queryFn: () => api.get('/beauty/overview').then((response) => response.data),
    staleTime: 60000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['beauty-overview'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const saveService = useMutation({
    mutationFn: (payload) => api.post('/beauty/services', payload).then((response) => response.data),
    onSuccess: () => {
      setServiceForm(createBeautyServiceForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Beauty service saved into the salon catalogue.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that beauty service right now.') });
    },
  });

  const saveStaff = useMutation({
    mutationFn: (payload) => api.post('/beauty/staff', payload).then((response) => response.data),
    onSuccess: () => {
      setStaffForm(createBeautyStaffForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Stylist profile added to the salon floor roster.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that stylist profile right now.') });
    },
  });

  const saveAppointment = useMutation({
    mutationFn: (payload) => api.post('/beauty/appointments', payload).then((response) => response.data),
    onSuccess: () => {
      setAppointmentForm(createBeautyAppointmentForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Appointment added to the live salon queue.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that salon appointment right now.') });
    },
  });

  const completeAppointment = useMutation({
    mutationFn: ({ id, payload }) => api.post(`/beauty/appointments/${id}/complete`, payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Appointment completed and salon floor totals refreshed.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not complete that salon appointment right now.') });
    },
  });

  const summary = useMemo(() => data?.summary || {}, [data?.summary]);
  const services = data?.services || [];
  const staff = data?.staff || [];
  const appointments = data?.appointments ?? EMPTY_LIST;
  const customers = data?.customers || [];
  const products = data?.products || [];

  const pendingAppointments = useMemo(() => getBeautyPendingAppointments(appointments), [appointments]);
  const deskMetrics = useMemo(
    () => buildBeautyDeskMetrics(summary, appointments, staff, services, isLoading, formatCurrencyNGN),
    [summary, appointments, staff, services, isLoading],
  );
  const ownerFocusMetrics = useMemo(
    () => buildBeautyOwnerFocusMetrics(summary, formatCurrencyNGN),
    [summary],
  );
  const serviceCards = useMemo(
    () => filterBeautyServices(services, serviceSearch).map((service) => buildBeautyServiceCard(service, formatCurrencyNGN)),
    [services, serviceSearch],
  );
  const appointmentCards = useMemo(
    () => filterBeautyAppointments(appointments, appointmentSearch).map((appointment) => buildBeautyAppointmentCard(appointment, formatCurrencyNGN)),
    [appointments, appointmentSearch],
  );

  return (
    <div className="space-y-5">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Beauty operations feedback" />

      <PageHero
        eyebrow="Beauty and Salon Edition"
        title={labels.dashboard}
        description="Run services, stylist capacity, bookings, product usage, and checkout posture from one stronger salon operating desk."
        aside={`Active section: ${activeSection}`}
      />

      {error ? (
        <QueryErrorPanel
          message={getErrorMessage(error, 'We could not load the beauty operations desk right now.')}
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
          <CardHeader title="Owner Focus" subtitle="Profit visibility for salons, braiding studios, spas, and barbing lounges." />
          <ResponsiveCardGrid variant="default" className="md:grid-cols-3">
            {ownerFocusMetrics.map((metric) => (
              <OpsMetricCard key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} tone={metric.tone} />
            ))}
          </ResponsiveCardGrid>
          <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Daily Decisions</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {(data?.insights?.daily_decisions || []).map((decision) => (
                <div key={decision} className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                  {decision}
                </div>
              ))}
              {!data?.insights?.daily_decisions?.length ? (
                <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500">
                  No daily salon decisions yet. This desk will surface them as more appointment history builds up.
                </div>
              ) : null}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Queue Watch" subtitle="Bookings that still need chair time, assignment, or checkout." />
          <div className="space-y-3">
            {pendingAppointments.slice(0, 5).map((appointment) => {
              const queueCard = buildBeautyQueueCard(appointment);
              return (
                <div key={queueCard.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{queueCard.clientLabel}</p>
                      <p className="mt-1 text-xs text-slate-500">{queueCard.meta}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {queueCard.statusLabel}
                    </span>
                  </div>
                </div>
              );
            })}
            {!pendingAppointments.length ? <p className="text-sm text-slate-500">No live queue pressure right now.</p> : null}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Service Catalogue" subtitle="Set pricing, timing, and commission logic with cleaner service-line control." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveService.mutate(buildBeautyServicePayload(serviceForm));
            }}
          >
            <input className="input" placeholder="Service name" value={serviceForm.name} onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })} />
            <input className="input" placeholder="Category" value={serviceForm.category} onChange={(event) => setServiceForm({ ...serviceForm, category: event.target.value })} />
            <div className="grid gap-3 md:grid-cols-2">
              <input className="input" type="number" min="5" placeholder="Duration minutes" value={serviceForm.duration_minutes} onChange={(event) => setServiceForm({ ...serviceForm, duration_minutes: event.target.value })} />
              <input className="input" type="number" min="0" placeholder="Price" value={serviceForm.price} onChange={(event) => setServiceForm({ ...serviceForm, price: event.target.value })} />
            </div>
            <input className="input" type="number" min="0" max="100" placeholder="Commission rate %" value={serviceForm.commission_rate} onChange={(event) => setServiceForm({ ...serviceForm, commission_rate: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white">
              {saveService.isPending ? 'Saving service...' : 'Save service'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Stylist Desk" subtitle="Track braiders, barbers, makeup artists, and commission wallets with better roster visibility." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveStaff.mutate(staffForm);
            }}
          >
            <input className="input" placeholder="Staff name" value={staffForm.name} onChange={(event) => setStaffForm({ ...staffForm, name: event.target.value })} />
            <input className="input" placeholder="Specialty" value={staffForm.specialty} onChange={(event) => setStaffForm({ ...staffForm, specialty: event.target.value })} />
            <input className="input" placeholder="Phone" value={staffForm.phone} onChange={(event) => setStaffForm({ ...staffForm, phone: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-violet-700 px-4 py-3 font-semibold text-white shadow-lg shadow-slate-900/10">
              {saveStaff.isPending ? 'Saving stylist...' : 'Save stylist'}
            </button>
          </form>
          <div className="mt-4 space-y-2">
            {staff.slice(0, 4).map((member) => {
              const staffCard = buildBeautyStaffCard(member, formatCurrencyNGN);
              return (
                <div key={staffCard.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="font-medium text-slate-900">{staffCard.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{staffCard.meta}</p>
                  <p className="mt-1 text-xs text-slate-500">{staffCard.phoneLabel}</p>
                </div>
              );
            })}
            {!staff.length ? <EmptyState icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" title="No stylist profiles yet" description="Add stylists to start assigning appointments and keeping the chair diary full." className="py-4" /> : null}
          </div>
        </Card>

        <Card>
          <CardHeader title="Book Appointment" subtitle="Schedule services, assign staff, and keep the chair diary full." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveAppointment.mutate(buildBeautyAppointmentPayload(appointmentForm));
            }}
          >
            <select className="input" value={appointmentForm.customer_id} onChange={(event) => setAppointmentForm({ ...appointmentForm, customer_id: event.target.value })}>
              <option value="">Client</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            <select className="input" value={appointmentForm.service_id} onChange={(event) => setAppointmentForm({ ...appointmentForm, service_id: event.target.value })}>
              <option value="">Service</option>
              {services.map((service) => <option key={service.id} value={service.id}>{service.name} - {formatCurrencyNGN(service.price)}</option>)}
            </select>
            <select className="input" value={appointmentForm.staff_profile_id} onChange={(event) => setAppointmentForm({ ...appointmentForm, staff_profile_id: event.target.value })}>
              <option value="">Stylist</option>
              {staff.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </select>
            <input className="input" type="datetime-local" value={appointmentForm.appointment_at} onChange={(event) => setAppointmentForm({ ...appointmentForm, appointment_at: event.target.value })} />
            <textarea className="input min-h-[108px] resize-y py-3" rows={3} placeholder="Notes" value={appointmentForm.notes} onChange={(event) => setAppointmentForm({ ...appointmentForm, notes: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-amber-500 px-4 py-3 font-semibold text-white">
              {saveAppointment.isPending ? 'Saving appointment...' : 'Save appointment'}
            </button>
          </form>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader
              title="Service Register"
              subtitle="Search your salon services with price, timing, and commission posture visible."
              className="mb-0"
            />
            <input
              className="input"
              value={serviceSearch}
              onChange={(event) => setServiceSearch(event.target.value)}
              placeholder="Search service, category, duration, or price..."
            />
          </div>
          <div className="mt-4 space-y-3">
            {serviceCards.slice(0, 6).map((serviceCard) => (
              <div key={serviceCard.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{serviceCard.title}</p>
                <p className="text-sm text-slate-500">{serviceCard.categoryLabel}</p>
                <p className="mt-1 text-xs text-slate-500">{serviceCard.durationLabel} | {serviceCard.priceLabel}</p>
                <p className="mt-1 text-xs text-slate-500">{serviceCard.commissionLabel}</p>
              </div>
            ))}
            {!serviceCards.length ? <p className="text-sm text-slate-500">No salon services matched the current search.</p> : null}
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader
              title="Appointment Register"
              subtitle="Search bookings across client, service, stylist, and current checkout posture."
              className="mb-0"
            />
            <input
              className="input"
              value={appointmentSearch}
              onChange={(event) => setAppointmentSearch(event.target.value)}
              placeholder="Search client, service, stylist, status, or notes..."
            />
          </div>
          <div className="mt-4 space-y-3">
            {appointmentCards.map((appointmentCard) => (
              <div key={appointmentCard.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{appointmentCard.clientLabel}</p>
                    <p className="mt-1 text-xs text-slate-500">{appointmentCard.serviceLabel} with {appointmentCard.staffLabel}</p>
                    <p className="mt-1 text-xs text-slate-500">{appointmentCard.bookedAtLabel}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">{appointmentCard.statusLabel}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{appointmentCard.notesLabel}</p>
                <p className="mt-1 text-xs text-slate-500">Expected revenue {appointmentCard.revenueLabel}</p>
              </div>
            ))}
            {!appointmentCards.length ? <p className="text-sm text-slate-500">No appointments matched the current search.</p> : null}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Salon Floor" subtitle="Close appointments with product usage, payout capture, and cleaner completion feedback." />
        <div className="space-y-4">
          {appointments.slice(0, 8).map((appointment) => {
            const form = completionForms[appointment.id] || createBeautyCompletionForm(appointment, products);
            const floorCard = buildBeautyAppointmentFloorCard(appointment, formatCurrencyNGN);

            return (
              <div key={appointment.id} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{floorCard.clientLabel}</p>
                    <p className="mt-1 text-sm text-slate-500">{floorCard.meta}</p>
                    <p className="mt-1 text-xs text-slate-500">{floorCard.appointmentAtLabel}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                    {floorCard.statusLabel}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <input className="input" type="number" min="0" placeholder="Service price" value={form.service_price} onChange={(event) => setCompletionForms({ ...completionForms, [appointment.id]: { ...form, service_price: event.target.value } })} />
                  <input className="input" type="number" min="0" max="100" placeholder="Commission %" value={form.commission_rate} onChange={(event) => setCompletionForms({ ...completionForms, [appointment.id]: { ...form, commission_rate: event.target.value } })} />
                  <select className="input" value={form.product_id} onChange={(event) => setCompletionForms({ ...completionForms, [appointment.id]: { ...form, product_id: event.target.value } })}>
                    <option value="">Product used</option>
                    {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <input className="input" type="number" min="0.001" step="0.001" placeholder="Qty" value={form.quantity} onChange={(event) => setCompletionForms({ ...completionForms, [appointment.id]: { ...form, quantity: event.target.value } })} />
                    <input className="input" type="number" min="0" placeholder="Unit cost" value={form.unit_cost} onChange={(event) => setCompletionForms({ ...completionForms, [appointment.id]: { ...form, unit_cost: event.target.value } })} />
                  </div>
                </div>

                {!floorCard.isCompleted ? (
                  <button
                    type="button"
                    className="mt-4 rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white"
                    onClick={() => completeAppointment.mutate({
                      id: appointment.id,
                      payload: buildBeautyCompletionPayload(form),
                    })}
                  >
                    Complete service
                  </button>
                ) : (
                  <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {floorCard.completedSummary}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
