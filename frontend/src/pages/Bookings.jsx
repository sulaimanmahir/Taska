import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useBusinessType } from '../config';
import Card, { CardHeader } from '../components/Card';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import { getErrorMessage } from '../lib/apiFeedback';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import {
  buildHotelActiveBookingCard,
  buildHotelBookingMetrics,
  buildHotelBookingPayload,
  buildHotelCalendarCard,
  buildHotelCheckoutPayload,
  buildHotelOccupancyTrendCard,
  buildHotelPaymentMethodCard,
  buildHotelShiftCard,
  createHotelBookingForm,
  createHotelShiftForm,
} from '../lib/hotel';

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

export default function Bookings() {
  const { labels } = useBusinessType();
  const queryClient = useQueryClient();
  const [bookingForm, setBookingForm] = useState(createHotelBookingForm);
  const [shiftForm, setShiftForm] = useState(createHotelShiftForm);

  const overviewQuery = useQuery({
    queryKey: ['hotel-overview'],
    queryFn: () => api.get('/hotel/overview').then((response) => response.data),
  });

  const roomsQuery = useQuery({
    queryKey: ['hotel-rooms'],
    queryFn: () => api.get('/hotel/rooms').then((response) => response.data ?? []),
  });

  const bookingsQuery = useQuery({
    queryKey: ['hotel-bookings'],
    queryFn: () => api.get('/hotel/bookings').then((response) => response.data ?? []),
  });

  const reservationCalendarQuery = useQuery({
    queryKey: ['hotel-calendar'],
    queryFn: () => api.get('/hotel/reservation-calendar').then((response) => response.data ?? []),
  });

  const overview = overviewQuery.data;
  const rooms = roomsQuery.data ?? [];
  const bookings = bookingsQuery.data ?? [];
  const reservationCalendar = reservationCalendarQuery.data ?? [];
  const bookingQueries = [overviewQuery, roomsQuery, bookingsQuery, reservationCalendarQuery];

  const refreshHotel = () => {
    queryClient.invalidateQueries({ queryKey: ['hotel-overview'] });
    queryClient.invalidateQueries({ queryKey: ['hotel-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['hotel-calendar'] });
    queryClient.invalidateQueries({ queryKey: ['hotel-rooms'] });
  };

  const createBooking = useMutation({
    mutationFn: (payload) => api.post('/hotel/bookings', payload).then((response) => response.data),
    onSuccess: () => {
      refreshHotel();
      setBookingForm(createHotelBookingForm());
    },
  });

  const checkIn = useMutation({
    mutationFn: (bookingId) => api.post(`/hotel/bookings/${bookingId}/check-in`).then((response) => response.data),
    onSuccess: refreshHotel,
  });

  const checkOut = useMutation({
    mutationFn: ({ bookingId, payload }) => api.post(`/hotel/bookings/${bookingId}/check-out`, payload).then((response) => response.data),
    onSuccess: refreshHotel,
  });

  const createShift = useMutation({
    mutationFn: (payload) => api.post('/hotel/shifts', payload).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel-overview'] });
      setShiftForm(createHotelShiftForm());
    },
  });

  const summary = overview?.summary ?? {};
  const paymentMethodReport = overview?.payment_method_report ?? [];
  const occupancyTrends = overview?.occupancy_trends ?? [];
  const activeShifts = overview?.shifts_active ?? 0;
  const availableRooms = rooms.filter((room) => ['available', 'reserved'].includes(room.status));
  const activeBookings = bookings;
  const repeatGuests = activeBookings.filter((booking) => booking.is_repeat_guest);
  const loadError = getErrorMessage(
    bookingQueries.find((query) => query.isError)?.error,
    'We could not load part of the booking workspace right now. Please try again.'
  );

  return (
    <div className="space-y-5">
      {loadError ? (
        <QueryErrorPanel
          message={loadError}
          onRetry={() => {
            bookingQueries.forEach((query) => {
              query.refetch();
            });
          }}
        />
      ) : null}

      <PageHero
        eyebrow="Front Desk Control"
        title={`${labels.bookings || 'Bookings'} and guest revenue`}
        description="Track reservations, check-ins, guest contact readiness, repeat guests, shift coverage, and payment performance from one stronger hotel workspace."
      />

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-5">
        {buildHotelBookingMetrics({ ...summary, shifts_active: activeShifts }, formatCurrencyNGN).map((metric) => (
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
          <CardHeader title="Reservation Intake" subtitle="Capture guest contact, stay dates, extra guest charges, and payment setup" />
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              createBooking.mutate(buildHotelBookingPayload(bookingForm));
            }}
          >
            <label className="space-y-2 text-sm text-slate-600">
              <span>Room</span>
              <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={bookingForm.room_id} onChange={(event) => setBookingForm({ ...bookingForm, room_id: event.target.value })}>
                <option value="">Select room</option>
                {availableRooms.map((room) => <option key={room.id} value={room.id}>{room.room_number} | {room.category}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Guest name</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={bookingForm.guest_name} onChange={(event) => setBookingForm({ ...bookingForm, guest_name: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Guest phone</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={bookingForm.guest_phone} onChange={(event) => setBookingForm({ ...bookingForm, guest_phone: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Guest email</span>
              <input type="email" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={bookingForm.guest_email} onChange={(event) => setBookingForm({ ...bookingForm, guest_email: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Check-in date</span>
              <input type="date" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={bookingForm.check_in_date} onChange={(event) => setBookingForm({ ...bookingForm, check_in_date: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Check-out date</span>
              <input type="date" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={bookingForm.check_out_date} onChange={(event) => setBookingForm({ ...bookingForm, check_out_date: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Adults</span>
              <input type="number" min="1" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={bookingForm.adults} onChange={(event) => setBookingForm({ ...bookingForm, adults: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Extra guests</span>
              <input type="number" min="0" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={bookingForm.extra_guests} onChange={(event) => setBookingForm({ ...bookingForm, extra_guests: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Payment method</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={bookingForm.payment_method} onChange={(event) => setBookingForm({ ...bookingForm, payment_method: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Amount paid</span>
              <input type="number" min="0" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={bookingForm.amount_paid} onChange={(event) => setBookingForm({ ...bookingForm, amount_paid: event.target.value })} />
            </label>
            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input type="checkbox" checked={bookingForm.apply_early_checkin_charge} onChange={(event) => setBookingForm({ ...bookingForm, apply_early_checkin_charge: event.target.checked })} />
              Apply early check-in charge
            </label>
            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input type="checkbox" checked={bookingForm.apply_late_checkout_charge} onChange={(event) => setBookingForm({ ...bookingForm, apply_late_checkout_charge: event.target.checked })} />
              Pre-mark late checkout charge
            </label>
            <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
              <span>Notes</span>
              <textarea className="w-full rounded-2xl border border-slate-200 px-4 py-3" rows={3} value={bookingForm.notes} onChange={(event) => setBookingForm({ ...bookingForm, notes: event.target.value })} />
            </label>
            <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white md:col-span-2">
              {createBooking.isPending ? 'Saving reservation...' : 'Save reservation'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Shift Log" subtitle="Front desk coverage and handover visibility for the live hotel floor" />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              createShift.mutate(shiftForm);
            }}
          >
            <label className="space-y-2 text-sm text-slate-600">
              <span>Staff name</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={shiftForm.staff_name} onChange={(event) => setShiftForm({ ...shiftForm, staff_name: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Shift role</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={shiftForm.shift_role} onChange={(event) => setShiftForm({ ...shiftForm, shift_role: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Started at</span>
              <input type="datetime-local" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={shiftForm.started_at} onChange={(event) => setShiftForm({ ...shiftForm, started_at: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Ended at</span>
              <input type="datetime-local" className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={shiftForm.ended_at} onChange={(event) => setShiftForm({ ...shiftForm, ended_at: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Notes</span>
              <textarea className="w-full rounded-2xl border border-slate-200 px-4 py-3" rows={3} value={shiftForm.notes} onChange={(event) => setShiftForm({ ...shiftForm, notes: event.target.value })} />
            </label>
            <button type="submit" className="w-full rounded-2xl bg-violet-600 px-5 py-4 text-sm font-semibold text-white">
              {createShift.isPending ? 'Saving staff shift...' : 'Save staff shift'}
            </button>
          </form>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Shift coverage</p>
            <p className="mt-1 text-sm text-slate-500">{activeShifts} active shift{activeShifts === 1 ? '' : 's'} currently open.</p>
            {activeShifts ? (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="font-semibold text-slate-900">{buildHotelShiftCard(shiftForm).title}</p>
                <p className="text-sm text-slate-500">{buildHotelShiftCard(shiftForm).roleLabel}</p>
                <p className="text-sm text-slate-500">{buildHotelShiftCard(shiftForm).windowLabel}</p>
              </div>
            ) : null}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Reservation Calendar" subtitle="Upcoming bookings, room occupancy flow, and stay timing at a glance" />
          <div className="space-y-3">
            {reservationCalendar.length ? reservationCalendar.map((entry) => {
              const calendarCard = buildHotelCalendarCard(entry);

              return (
                <div key={calendarCard.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{calendarCard.title}</p>
                      <p className="text-sm text-slate-500">{calendarCard.stayLabel}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600">
                      {calendarCard.statusLabel}
                    </span>
                  </div>
                </div>
              );
            }) : <p className="text-sm text-slate-500">No reservation calendar entries yet.</p>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Payment Methods" subtitle="Revenue collection mix across active room bookings" />
          <div className="space-y-3">
            {paymentMethodReport.length ? paymentMethodReport.map((item) => {
              const paymentCard = buildHotelPaymentMethodCard(item, formatCurrencyNGN);

              return (
                <div key={paymentCard.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{paymentCard.title}</p>
                      <p className="text-sm text-slate-500">{paymentCard.bookingsLabel}</p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-700">{paymentCard.amountLabel}</p>
                  </div>
                </div>
              );
            }) : <p className="text-sm text-slate-500">No payment report yet.</p>}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Occupancy Trend" subtitle="Recent check-in movement and daily front-desk momentum" />
          <div className="space-y-3">
            {occupancyTrends.length ? occupancyTrends.map((trend) => {
              const trendCard = buildHotelOccupancyTrendCard(trend);

              return (
                <div key={trendCard.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-600">{trendCard.title}</p>
                  <p className="font-semibold text-slate-900">{trendCard.checkinsLabel}</p>
                </div>
              );
            }) : <p className="text-sm text-slate-500">No occupancy trend yet.</p>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Active Bookings" subtitle="Check-in and checkout actions with guest contact, stay, and payment posture" />
          <div className="space-y-3">
            {activeBookings.length ? activeBookings.map((booking) => {
              const bookingCard = buildHotelActiveBookingCard(booking, formatCurrencyNGN);

              return (
                <div key={bookingCard.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{bookingCard.title}</p>
                      <p className="text-sm text-slate-500">{bookingCard.roomLabel}</p>
                      <p className="text-sm text-slate-500">{bookingCard.guestMetaLabel}</p>
                      <p className="text-sm text-slate-500">{bookingCard.stayLabel}</p>
                      <p className="mt-1 text-sm text-slate-500">{bookingCard.chargeLabel}</p>
                      <p className="text-sm font-semibold text-slate-900">{bookingCard.amountLabel}</p>
                    </div>
                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${booking.is_repeat_guest ? 'bg-violet-50 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
                        {bookingCard.repeatGuestLabel}
                      </span>
                      <div className="flex flex-wrap gap-3">
                        {bookingCard.canCheckIn ? (
                          <button type="button" className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white" onClick={() => checkIn.mutate(booking.id)}>
                            Check in
                          </button>
                        ) : null}
                        {bookingCard.canCheckOut ? (
                          <button
                            type="button"
                            className="rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white"
                            onClick={() => checkOut.mutate({ bookingId: booking.id, payload: buildHotelCheckoutPayload(booking) })}
                          >
                            Check out
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }) : <p className="text-sm text-slate-500">No bookings recorded yet.</p>}
          </div>
        </Card>
      </section>

      <Card>
        <CardHeader title="Repeat Guest Focus" subtitle="Quick view of returning guests currently helping loyalty and occupancy" />
        <div className="space-y-3">
          {repeatGuests.length ? repeatGuests.map((booking) => {
            const bookingCard = buildHotelActiveBookingCard(booking, formatCurrencyNGN);

            return (
              <div key={`repeat-${bookingCard.id}`} className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                <p className="font-semibold text-slate-900">{bookingCard.title}</p>
                <p className="text-sm text-slate-600">{bookingCard.roomLabel}</p>
                <p className="text-sm text-slate-600">{bookingCard.chargeLabel}</p>
              </div>
            );
          }) : <p className="text-sm text-slate-500">No repeat guests are visible in the active booking list yet.</p>}
        </div>
      </Card>
    </div>
  );
}
