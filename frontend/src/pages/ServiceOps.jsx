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
import {
  buildServiceBookingCard,
  buildServiceBookingPayload,
  buildServiceCompletionPayload,
  buildServiceDeskMetrics,
  buildServiceJobPayload,
  buildServiceOfferingCard,
  buildServiceOfferingPayload,
  buildServiceOpenJobCard,
  buildServiceOwnerFocusMetrics,
  buildServiceRecentJobCard,
  buildServiceStaffCard,
  createServiceBookingForm,
  createServiceJobForm,
  createServiceOfferingForm,
  createServiceStaffForm,
  filterServiceBookings,
  filterServiceJobs,
  filterServiceOfferings,
  getServiceActiveSection,
  getServiceOpenJobs,
} from '../lib/service';

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

export default function ServiceOps() {
  const { labels } = useBusinessType();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast, setToast, clearToast } = useToast();
  const activeSection = getServiceActiveSection(location.pathname);
  const [offeringForm, setOfferingForm] = useState(createServiceOfferingForm);
  const [staffForm, setStaffForm] = useState(createServiceStaffForm);
  const [bookingForm, setBookingForm] = useState(() => createServiceBookingForm());
  const [jobForm, setJobForm] = useState(createServiceJobForm);
  const [offeringSearch, setOfferingSearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [jobSearch, setJobSearch] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['service-business-overview'],
    queryFn: () => api.get('/service-business/overview').then((response) => response.data),
    staleTime: 60000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['service-business-overview'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const saveOffering = useMutation({
    mutationFn: (payload) => api.post('/service-business/offerings', payload).then((response) => response.data),
    onSuccess: () => {
      setOfferingForm(createServiceOfferingForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Service offering saved into the catalogue desk.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that service offering right now.') });
    },
  });

  const saveStaff = useMutation({
    mutationFn: (payload) => api.post('/service-business/staff', payload).then((response) => response.data),
    onSuccess: () => {
      setStaffForm(createServiceStaffForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Staff profile added to the assignment desk.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that staff profile right now.') });
    },
  });

  const saveBooking = useMutation({
    mutationFn: (payload) => api.post('/service-business/bookings', payload).then((response) => response.data),
    onSuccess: () => {
      setBookingForm(createServiceBookingForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Booking captured into the live service pipeline.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that service booking right now.') });
    },
  });

  const saveJob = useMutation({
    mutationFn: (payload) => api.post('/service-business/jobs', payload).then((response) => response.data),
    onSuccess: () => {
      setJobForm(createServiceJobForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Service job added to the billable work queue.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not create that service job right now.') });
    },
  });

  const updateJob = useMutation({
    mutationFn: ({ id, payload }) => api.patch(`/service-business/jobs/${id}`, payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Service job marked complete and collections view refreshed.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not update that service job right now.') });
    },
  });

  const summary = data?.summary || {};
  const offerings = data?.offerings || [];
  const staff = data?.staff || [];
  const bookings = data?.bookings || [];
  const jobs = data?.jobs ?? EMPTY_LIST;
  const clients = data?.clients || [];

  const openJobs = useMemo(() => getServiceOpenJobs(jobs), [jobs]);
  const deskMetrics = useMemo(
    () => buildServiceDeskMetrics(summary, bookings, jobs, staff, isLoading),
    [summary, bookings, jobs, staff, isLoading],
  );
  const ownerFocusMetrics = useMemo(() => buildServiceOwnerFocusMetrics(summary), [summary]);
  const offeringCards = useMemo(
    () => filterServiceOfferings(offerings, offeringSearch).map((offering) => buildServiceOfferingCard(offering)),
    [offerings, offeringSearch],
  );
  const bookingCards = useMemo(
    () => filterServiceBookings(bookings, bookingSearch).map((booking) => buildServiceBookingCard(booking)),
    [bookings, bookingSearch],
  );
  const jobCards = useMemo(
    () => filterServiceJobs(jobs, jobSearch).map((job) => ({ ...job, card: buildServiceRecentJobCard(job) })),
    [jobs, jobSearch],
  );

  return (
    <div className="space-y-5">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Service operations feedback" />

      <PageHero
        eyebrow="Service Business Edition"
        title={labels.dashboard}
        description="Run service catalogue setup, bookings, staffing, delivery follow-up, and invoice visibility from one stronger service operations desk."
        aside={`Active section: ${activeSection}`}
      />

      {error ? (
        <QueryErrorPanel
          message={getErrorMessage(error, 'We could not load the service operations desk right now.')}
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
          <CardHeader title="Owner Focus" subtitle="Visibility for agencies, workshops, consultancies, installers, and field-service teams." />
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
                  No service-specific decision prompts yet. As activity grows, this desk will surface better follow-up signals.
                </div>
              ) : null}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Open Job Watch" subtitle="Delivery work still waiting on assignment, closure, or collection discipline." />
          <div className="space-y-3">
            {openJobs.slice(0, 5).map((job) => {
              const jobCard = buildServiceOpenJobCard(job);

              return (
                <div key={jobCard.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{jobCard.clientLabel}</p>
                      <p className="mt-1 text-xs text-slate-500">{jobCard.meta}</p>
                      <p className="mt-1 text-xs text-slate-500">{jobCard.invoiceLabel}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {jobCard.statusLabel}
                    </span>
                  </div>
                </div>
              );
            })}
            {!openJobs.length ? <p className="text-sm text-slate-500">No open jobs right now.</p> : null}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Service Catalogue" subtitle="Define sellable services with pricing and duration so quoting and bookings stay consistent." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveOffering.mutate(buildServiceOfferingPayload(offeringForm));
            }}
          >
            <input className="input" placeholder="Service name" value={offeringForm.name} onChange={(event) => setOfferingForm({ ...offeringForm, name: event.target.value })} />
            <input className="input" placeholder="Category" value={offeringForm.category} onChange={(event) => setOfferingForm({ ...offeringForm, category: event.target.value })} />
            <div className="grid gap-3 md:grid-cols-2">
              <input className="input" type="number" min="5" placeholder="Duration minutes" value={offeringForm.duration_minutes} onChange={(event) => setOfferingForm({ ...offeringForm, duration_minutes: event.target.value })} />
              <input className="input" type="number" min="0" placeholder="Base price" value={offeringForm.base_price} onChange={(event) => setOfferingForm({ ...offeringForm, base_price: event.target.value })} />
            </div>
            <button type="submit" className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white">
              {saveOffering.isPending ? 'Saving service...' : 'Save service'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Staff Assignment Desk" subtitle="Maintain a live roster of delivery capability before jobs start piling on one person." />
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
            <button type="submit" className="w-full rounded-2xl bg-violet-700 px-4 py-3 font-semibold text-white">
              {saveStaff.isPending ? 'Saving staff...' : 'Save staff profile'}
            </button>
          </form>
          <div className="mt-4 space-y-2">
            {staff.slice(0, 4).map((member) => {
              const memberCard = buildServiceStaffCard(member);

              return (
                <div key={memberCard.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="font-medium text-slate-900">{memberCard.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{memberCard.specialtyLabel}</p>
                  <p className="mt-1 text-xs text-slate-500">{memberCard.phoneLabel}</p>
                </div>
              );
            })}
            {!staff.length ? <EmptyState icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" title="No staff profiles yet" description="Add staff profiles to start assigning bookings and tracking specialties." className="py-4" /> : null}
          </div>
        </Card>

        <Card>
          <CardHeader title="Booking Desk" subtitle="Capture inbound work before it escapes into calls, chats, and memory." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveBooking.mutate(buildServiceBookingPayload(bookingForm));
            }}
          >
            <select className="input" value={bookingForm.customer_id} onChange={(event) => setBookingForm({ ...bookingForm, customer_id: event.target.value })}>
              <option value="">Client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            <select className="input" value={bookingForm.offering_id} onChange={(event) => setBookingForm({ ...bookingForm, offering_id: event.target.value })}>
              <option value="">Service</option>
              {offerings.map((offering) => (
                <option key={offering.id} value={offering.id}>
                  {offering.name}
                </option>
              ))}
            </select>
            <input className="input" type="datetime-local" value={bookingForm.scheduled_for} onChange={(event) => setBookingForm({ ...bookingForm, scheduled_for: event.target.value })} />
            <input className="input" placeholder="Referral source" value={bookingForm.referral_source} onChange={(event) => setBookingForm({ ...bookingForm, referral_source: event.target.value })} />
            <textarea className="input min-h-[108px] resize-y py-3" rows={3} placeholder="Notes" value={bookingForm.notes} onChange={(event) => setBookingForm({ ...bookingForm, notes: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-amber-500 px-4 py-3 font-semibold text-white">
              {saveBooking.isPending ? 'Saving booking...' : 'Save booking'}
            </button>
          </form>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader title="Job Board" subtitle="Convert bookings into billable work with pricing, staff ownership, and due-date discipline." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveJob.mutate(buildServiceJobPayload(jobForm));
            }}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <select className="input" value={jobForm.booking_id} onChange={(event) => setJobForm({ ...jobForm, booking_id: event.target.value })}>
                <option value="">Booking</option>
                {bookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {(booking.customer?.name || 'Direct client')} - {booking.offering?.name || 'Service'}
                  </option>
                ))}
              </select>
              <select className="input" value={jobForm.customer_id} onChange={(event) => setJobForm({ ...jobForm, customer_id: event.target.value })}>
                <option value="">Client override</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <select className="input" value={jobForm.offering_id} onChange={(event) => setJobForm({ ...jobForm, offering_id: event.target.value })}>
                <option value="">Service</option>
                {offerings.map((offering) => (
                  <option key={offering.id} value={offering.id}>
                    {offering.name}
                  </option>
                ))}
              </select>
              <select className="input" value={jobForm.staff_profile_id} onChange={(event) => setJobForm({ ...jobForm, staff_profile_id: event.target.value })}>
                <option value="">Assigned staff</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              <input className="input" type="number" min="0" placeholder="Quoted amount" value={jobForm.quoted_amount} onChange={(event) => setJobForm({ ...jobForm, quoted_amount: event.target.value })} />
              <input className="input" type="number" min="0" placeholder="Invoice amount" value={jobForm.invoice_amount} onChange={(event) => setJobForm({ ...jobForm, invoice_amount: event.target.value })} />
              <input className="input" type="number" min="0" placeholder="Amount paid" value={jobForm.amount_paid} onChange={(event) => setJobForm({ ...jobForm, amount_paid: event.target.value })} />
              <input className="input" type="date" value={jobForm.due_date} onChange={(event) => setJobForm({ ...jobForm, due_date: event.target.value })} />
              <textarea className="input min-h-[108px] resize-y py-3 md:col-span-2" rows={3} placeholder="Notes" value={jobForm.notes} onChange={(event) => setJobForm({ ...jobForm, notes: event.target.value })} />
            </div>
            <button type="submit" className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white">
              {saveJob.isPending ? 'Creating job...' : 'Create job'}
            </button>
          </form>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader
              title="Service Register"
              subtitle="Search what you currently sell, with price and duration context ready for quotes and bookings."
              className="mb-0"
            />
            <input
              className="input"
              value={offeringSearch}
              onChange={(event) => setOfferingSearch(event.target.value)}
              placeholder="Search service name or category..."
            />
          </div>
          <div className="mt-4 space-y-3">
            {offeringCards.slice(0, 6).map((offeringCard) => (
              <div key={offeringCard.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{offeringCard.title}</p>
                <p className="text-sm text-slate-500">{offeringCard.categoryLabel}</p>
                <p className="mt-1 text-xs text-slate-500">{offeringCard.durationLabel} | {offeringCard.priceLabel}</p>
              </div>
            ))}
            {!offeringCards.length ? <p className="text-sm text-slate-500">No services matched the current search.</p> : null}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader
              title="Booking Register"
              subtitle="Upcoming and recent bookings with client, channel, and note context visible before assignment."
              className="mb-0"
            />
            <input
              className="input"
              value={bookingSearch}
              onChange={(event) => setBookingSearch(event.target.value)}
              placeholder="Search client, service, notes, or source..."
            />
          </div>
          <div className="mt-4 space-y-3">
            {bookingCards.map((bookingCard) => (
              <div key={bookingCard.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{bookingCard.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{bookingCard.serviceLabel}</p>
                    <p className="mt-1 text-xs text-slate-500">{bookingCard.scheduleLabel}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">{bookingCard.statusLabel}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{bookingCard.referralLabel}</p>
                <p className="mt-1 text-xs text-slate-500">{bookingCard.notesLabel}</p>
              </div>
            ))}
            {!bookingCards.length ? <p className="text-sm text-slate-500">No bookings matched the current search.</p> : null}
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader
              title="Recent Jobs"
              subtitle="Delivery, billing, and collection posture for the work already on your service ledger."
              className="mb-0"
            />
            <input
              className="input"
              value={jobSearch}
              onChange={(event) => setJobSearch(event.target.value)}
              placeholder="Search client, service, staff, or status..."
            />
          </div>
          <div className="mt-4 space-y-3">
            {jobCards.map(({ id, card, ...job }) => (
              <div key={id} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{card.clientLabel}</p>
                    <p className="mt-1 text-xs text-slate-500">{card.meta}</p>
                    <p className="mt-1 text-xs text-slate-500">{card.invoiceLabel}</p>
                    <p className="mt-1 text-xs text-slate-500">{card.balanceLabel} | {card.dueLabel}</p>
                    <p className="mt-2 text-sm text-slate-600">{card.notesLabel}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{card.statusLabel}</span>
                    {card.canMarkComplete ? (
                      <button
                        type="button"
                        className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                        onClick={() => updateJob.mutate({
                          id,
                          payload: buildServiceCompletionPayload(job),
                        })}
                      >
                        Mark complete
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            {!jobCards.length ? <p className="text-sm text-slate-500">No jobs matched the current search.</p> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
