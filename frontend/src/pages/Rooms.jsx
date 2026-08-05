import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useBusinessType } from '../config';
import Card, { CardHeader } from '../components/Card';
import Button from '../components/Button';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/apiFeedback';
import { ResponsiveCardGrid } from '../components/PageShell';
import {
  buildHotelHousekeepingLogCard,
  buildHotelHousekeepingPayload,
  buildHotelInspectionLogCard,
  buildHotelInspectionPayload,
  buildHotelMaintenancePayload,
  buildHotelMaintenanceRequestCard,
  buildHotelRoomBlockPayload,
  buildHotelRoomCard,
  buildHotelRoomDeskMetrics,
  buildHotelRoomPayload,
  buildHotelRoomReopenPayload,
  createHotelHousekeepingForm,
  createHotelInspectionForm,
  createHotelMaintenanceForm,
  createHotelRoomForm,
  filterHotelRooms,
} from '../lib/hotel';

function QueryErrorPanel({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p>{message}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start text-rose-700 hover:bg-rose-100"
          onClick={() => {
            void onRetry();
          }}
        >
          Retry
        </Button>
      </div>
    </div>
  );
}

export default function Rooms() {
  const { labels } = useBusinessType();
  const queryClient = useQueryClient();
  const { toast, setToast, clearToast } = useToast();
  const [roomForm, setRoomForm] = useState(createHotelRoomForm);
  const [housekeepingForm, setHousekeepingForm] = useState(createHotelHousekeepingForm);
  const [maintenanceForm, setMaintenanceForm] = useState(createHotelMaintenanceForm);
  const [inspectionForm, setInspectionForm] = useState(createHotelInspectionForm);
  const [roomSearch, setRoomSearch] = useState('');
  const [roomStatus, setRoomStatus] = useState('');
  const [roomCleaningStatus, setRoomCleaningStatus] = useState('');

  const overviewQuery = useQuery({
    queryKey: ['hotel-overview'],
    queryFn: () => api.get('/hotel/overview').then((response) => response.data),
  });

  const roomsQuery = useQuery({
    queryKey: ['hotel-rooms'],
    queryFn: () => api.get('/hotel/rooms').then((response) => response.data ?? []),
  });
  const roomQueries = [overviewQuery, roomsQuery];
  const overview = overviewQuery.data;
  const rooms = roomsQuery.data ?? [];

  const refreshHotel = () => {
    queryClient.invalidateQueries({ queryKey: ['hotel-overview'] });
    queryClient.invalidateQueries({ queryKey: ['hotel-rooms'] });
    queryClient.invalidateQueries({ queryKey: ['hotel-bookings'] });
  };

  const createRoom = useMutation({
    mutationFn: (payload) => api.post('/hotel/rooms', payload).then((response) => response.data),
    onSuccess: () => {
      refreshHotel();
      setRoomForm(createHotelRoomForm());
      clearToast();
      setToast({ tone: 'success', message: 'Room saved into the hotel inventory.' });
    },
    onError: (error) => {
      setToast({ tone: 'error', message: getErrorMessage(error, 'We could not save that room right now.') });
    },
  });

  const createHousekeeping = useMutation({
    mutationFn: (payload) => api.post('/hotel/housekeeping', payload).then((response) => response.data),
    onSuccess: () => {
      refreshHotel();
      setHousekeepingForm(createHotelHousekeepingForm());
      clearToast();
      setToast({ tone: 'success', message: 'Housekeeping update logged.' });
    },
    onError: (error) => {
      setToast({ tone: 'error', message: getErrorMessage(error, 'We could not log that housekeeping update right now.') });
    },
  });

  const createMaintenance = useMutation({
    mutationFn: (payload) => api.post('/hotel/maintenance-requests', payload).then((response) => response.data),
    onSuccess: () => {
      refreshHotel();
      setMaintenanceForm(createHotelMaintenanceForm());
      clearToast();
      setToast({ tone: 'success', message: 'Maintenance request opened.' });
    },
    onError: (error) => {
      setToast({ tone: 'error', message: getErrorMessage(error, 'We could not open that maintenance request right now.') });
    },
  });

  const createInspection = useMutation({
    mutationFn: (payload) => api.post('/hotel/inspections', payload).then((response) => response.data),
    onSuccess: () => {
      refreshHotel();
      setInspectionForm(createHotelInspectionForm());
      clearToast();
      setToast({ tone: 'success', message: 'Room inspection logged.' });
    },
    onError: (error) => {
      setToast({ tone: 'error', message: getErrorMessage(error, 'We could not log that inspection right now.') });
    },
  });

  const updateRoom = useMutation({
    mutationFn: ({ roomId, payload }) => api.patch(`/hotel/rooms/${roomId}`, payload).then((response) => response.data),
    onSuccess: () => {
      refreshHotel();
      clearToast();
      setToast({ tone: 'success', message: 'Room status updated.' });
    },
    onError: (error) => {
      setToast({ tone: 'error', message: getErrorMessage(error, 'We could not update that room right now.') });
    },
  });

  const summary = overview?.summary ?? {};
  const maintenanceOpen = overview?.maintenance_open ?? 0;
  const roomMetrics = buildHotelRoomDeskMetrics(summary, rooms, maintenanceOpen);
  const filteredRooms = filterHotelRooms(rooms, roomSearch, roomStatus, roomCleaningStatus);

  const housekeepingEntries = useMemo(
    () => rooms.flatMap((room) => (room.housekeeping_logs ?? []).map((entry) => buildHotelHousekeepingLogCard({ ...entry, room: { room_number: room.room_number } }))),
    [rooms],
  );
  const maintenanceEntries = useMemo(
    () => rooms.flatMap((room) => (room.maintenance_requests ?? []).map((entry) => buildHotelMaintenanceRequestCard({ ...entry, room: { room_number: room.room_number } }))),
    [rooms],
  );
  const inspectionEntries = useMemo(
    () => rooms.flatMap((room) => (room.inspections ?? []).map((entry) => buildHotelInspectionLogCard({ ...entry, room: { room_number: room.room_number } }))),
    [rooms],
  );

  const latestHousekeeping = housekeepingEntries.slice(0, 4);
  const latestMaintenance = maintenanceEntries.slice(0, 4);
  const latestInspections = inspectionEntries.slice(0, 4);
  const hasPageError = roomQueries.some((query) => query.isError);
  const loadError = getErrorMessage(
    roomQueries.find((query) => query.isError)?.error,
    'We could not load the room operations desk right now.',
  );

  return (
    <div className="space-y-5">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Room operations feedback" />

      <PageHero
        eyebrow="Hotel Operations"
        title={`${labels.rooms || 'Rooms'} and upkeep control`}
        description="Keep rooms sellable, track cleaning discipline, and surface maintenance bottlenecks before they hurt occupancy."
      />

      {hasPageError ? (
        <QueryErrorPanel
          message={loadError}
          onRetry={() => {
            roomQueries.forEach((query) => {
              void query.refetch();
            });
          }}
        />
      ) : null}

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-6">
        {roomMetrics.map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            tone={metric.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader title="Room Register" subtitle="Add sellable rooms with rate rules, cleaning defaults, and readiness status from one explicit setup flow." />
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              createRoom.mutate(buildHotelRoomPayload(roomForm));
            }}
          >
            <label className="space-y-2 text-sm text-slate-600">
              <span>Room number</span>
              <input
                className="input"
                value={roomForm.room_number}
                onChange={(event) => setRoomForm({ ...roomForm, room_number: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Category</span>
              <input
                className="input"
                value={roomForm.category}
                onChange={(event) => setRoomForm({ ...roomForm, category: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Floor</span>
              <input
                className="input"
                value={roomForm.floor}
                onChange={(event) => setRoomForm({ ...roomForm, floor: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Status</span>
              <select
                className="input"
                value={roomForm.status}
                onChange={(event) => setRoomForm({ ...roomForm, status: event.target.value })}
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="occupied">Occupied</option>
                <option value="cleaning">Cleaning</option>
                <option value="blocked">Blocked</option>
                <option value="out_of_service">Out of service</option>
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Cleaning status</span>
              <select
                className="input"
                value={roomForm.cleaning_status}
                onChange={(event) => setRoomForm({ ...roomForm, cleaning_status: event.target.value })}
              >
                <option value="clean">Clean</option>
                <option value="dirty">Dirty</option>
                <option value="in_progress">In progress</option>
                <option value="inspected">Inspected</option>
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Base rate</span>
              <input
                className="input"
                type="number"
                min="0"
                value={roomForm.base_rate}
                onChange={(event) => setRoomForm({ ...roomForm, base_rate: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Extra guest charge</span>
              <input
                className="input"
                type="number"
                min="0"
                value={roomForm.extra_guest_charge}
                onChange={(event) => setRoomForm({ ...roomForm, extra_guest_charge: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Early check-in charge</span>
              <input
                className="input"
                type="number"
                min="0"
                value={roomForm.early_checkin_charge}
                onChange={(event) => setRoomForm({ ...roomForm, early_checkin_charge: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Late checkout charge</span>
              <input
                className="input"
                type="number"
                min="0"
                value={roomForm.late_checkout_charge}
                onChange={(event) => setRoomForm({ ...roomForm, late_checkout_charge: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
              <span>Blocked reason</span>
              <input
                className="input"
                value={roomForm.blocked_reason}
                onChange={(event) => setRoomForm({ ...roomForm, blocked_reason: event.target.value })}
                placeholder="Optional unless the room is blocked"
              />
            </label>
            <Button type="submit" size="lg" className="md:col-span-2" disabled={createRoom.isPending}>
              {createRoom.isPending ? 'Saving room...' : `Add ${labels.room || 'Room'}`}
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Operational Actions" subtitle="Capture housekeeping, maintenance, and inspection work from the same live desk." />
          <div className="space-y-6">
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                clearToast();
                createHousekeeping.mutate(buildHotelHousekeepingPayload(housekeepingForm));
              }}
            >
              <p className="text-sm font-semibold text-slate-900">Housekeeping update</p>
              <select className="input" value={housekeepingForm.room_id} onChange={(event) => setHousekeepingForm({ ...housekeepingForm, room_id: event.target.value })}>
                <option value="">Select room</option>
                {rooms.map((room) => <option key={room.id} value={room.id}>{room.room_number}</option>)}
              </select>
              <select className="input" value={housekeepingForm.status} onChange={(event) => setHousekeepingForm({ ...housekeepingForm, status: event.target.value })}>
                <option value="pending">Pending</option>
                <option value="in_progress">In progress</option>
                <option value="cleaned">Cleaned</option>
                <option value="inspected">Inspected</option>
              </select>
              <input className="input" placeholder="Notes" value={housekeepingForm.notes} onChange={(event) => setHousekeepingForm({ ...housekeepingForm, notes: event.target.value })} />
              <Button type="submit" fullWidth variant="secondary" className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" disabled={createHousekeeping.isPending}>
                {createHousekeeping.isPending ? 'Logging...' : 'Log housekeeping'}
              </Button>
            </form>

            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                clearToast();
                createMaintenance.mutate(buildHotelMaintenancePayload(maintenanceForm));
              }}
            >
              <p className="text-sm font-semibold text-slate-900">Maintenance request</p>
              <select className="input" value={maintenanceForm.room_id} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, room_id: event.target.value })}>
                <option value="">Select room</option>
                {rooms.map((room) => <option key={room.id} value={room.id}>{room.room_number}</option>)}
              </select>
              <input className="input" placeholder="Issue title" value={maintenanceForm.title} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, title: event.target.value })} />
              <select className="input" value={maintenanceForm.priority} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, priority: event.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <textarea className="input min-h-[100px] resize-y py-3" placeholder="Details" value={maintenanceForm.details} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, details: event.target.value })} />
              <Button type="submit" fullWidth variant="secondary" className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" disabled={createMaintenance.isPending}>
                {createMaintenance.isPending ? 'Opening...' : 'Open maintenance request'}
              </Button>
            </form>

            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                clearToast();
                createInspection.mutate(buildHotelInspectionPayload(inspectionForm));
              }}
            >
              <p className="text-sm font-semibold text-slate-900">Room inspection</p>
              <select className="input" value={inspectionForm.room_id} onChange={(event) => setInspectionForm({ ...inspectionForm, room_id: event.target.value })}>
                <option value="">Select room</option>
                {rooms.map((room) => <option key={room.id} value={room.id}>{room.room_number}</option>)}
              </select>
              <select className="input" value={inspectionForm.status} onChange={(event) => setInspectionForm({ ...inspectionForm, status: event.target.value })}>
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
              </select>
              <input className="input" placeholder="Inspection notes" value={inspectionForm.notes} onChange={(event) => setInspectionForm({ ...inspectionForm, notes: event.target.value })} />
              <Button type="submit" fullWidth variant="secondary" className="border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100" disabled={createInspection.isPending}>
                {createInspection.isPending ? 'Logging...' : 'Log inspection'}
              </Button>
            </form>
          </div>
        </Card>
      </section>

      <Card padding={false} className="overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Room status board</p>
              <p className="mt-1 text-sm text-slate-500">
                Review sellable readiness, blocking reasons, charge posture, and upkeep history from the active room inventory.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 md:flex-row xl:w-auto">
              <input
                className="input min-w-[220px]"
                value={roomSearch}
                onChange={(event) => setRoomSearch(event.target.value)}
                placeholder="Search rooms..."
              />
              <select className="input min-w-[180px]" value={roomStatus} onChange={(event) => setRoomStatus(event.target.value)}>
                <option value="">All room statuses</option>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="occupied">Occupied</option>
                <option value="cleaning">Cleaning</option>
                <option value="blocked">Blocked</option>
                <option value="out_of_service">Out of service</option>
              </select>
              <select className="input min-w-[180px]" value={roomCleaningStatus} onChange={(event) => setRoomCleaningStatus(event.target.value)}>
                <option value="">All cleaning states</option>
                <option value="clean">Clean</option>
                <option value="dirty">Dirty</option>
                <option value="in_progress">In progress</option>
                <option value="inspected">Inspected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-2">
          {filteredRooms.map((room) => {
            const roomCard = buildHotelRoomCard(room);

            return (
              <div key={roomCard.id} className="rounded-3xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">{roomCard.roomNumberLabel}</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">{roomCard.title}</h3>
                    <p className="text-sm text-slate-500">{roomCard.statusLabel}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{roomCard.rateLabel}</p>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Cleaning</p>
                    <p className="mt-1 font-semibold text-slate-900">{roomCard.cleaningLabel}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Maintenance</p>
                    <p className="mt-1 font-semibold text-slate-900">{roomCard.maintenanceLabel}</p>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <p>{roomCard.chargesLabel}</p>
                  <p>{roomCard.housekeepingLabel} | {roomCard.inspectionLabel}</p>
                </div>

                {roomCard.blockedReasonLabel ? <p className="mt-3 text-sm text-rose-700">{roomCard.blockedReasonLabel}</p> : null}

                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      clearToast();
                      updateRoom.mutate({ roomId: room.id, payload: buildHotelRoomBlockPayload() });
                    }}
                    disabled={updateRoom.isPending}
                  >
                    Block room
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    onClick={() => {
                      clearToast();
                      updateRoom.mutate({ roomId: room.id, payload: buildHotelRoomReopenPayload() });
                    }}
                    disabled={updateRoom.isPending}
                  >
                    Reopen room
                  </Button>
                </div>
              </div>
            );
          })}

          {!filteredRooms.length ? (
            <p className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500 lg:col-span-2">
              No rooms matched the current search or readiness filters.
            </p>
          ) : null}
        </div>
      </Card>

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-3">
        <Card>
          <CardHeader title="Latest Housekeeping" subtitle="Recent cleaning updates across the active room floor." />
          <div className="space-y-3">
            {latestHousekeeping.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="font-semibold text-slate-900">{entry.title}</p>
                <p className="mt-1 text-sm text-slate-600">{entry.statusLabel}</p>
                <p className="mt-1 text-sm text-slate-600">{entry.assigneeLabel}</p>
                <p className="mt-1 text-xs text-slate-500">{entry.notesLabel}</p>
              </div>
            ))}
            {!latestHousekeeping.length ? <p className="text-sm text-slate-500">No housekeeping updates logged yet.</p> : null}
          </div>
        </Card>

        <Card>
          <CardHeader title="Open Maintenance" subtitle="Visible maintenance pressure still affecting room readiness." />
          <div className="space-y-3">
            {latestMaintenance.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="font-semibold text-slate-900">{entry.title}</p>
                <p className="mt-1 text-sm text-slate-600">{entry.issueLabel}</p>
                <p className="mt-1 text-sm text-slate-600">{entry.priorityLabel} | {entry.statusLabel}</p>
                <p className="mt-1 text-xs text-slate-500">{entry.detailsLabel}</p>
              </div>
            ))}
            {!latestMaintenance.length ? <p className="text-sm text-slate-500">No maintenance requests logged yet.</p> : null}
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent Inspections" subtitle="Latest pass or fail signals before rooms return to sellable use." />
          <div className="space-y-3">
            {latestInspections.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="font-semibold text-slate-900">{entry.title}</p>
                <p className="mt-1 text-sm text-slate-600">{entry.statusLabel}</p>
                <p className="mt-1 text-sm text-slate-600">{entry.inspectorLabel}</p>
                <p className="mt-1 text-xs text-slate-500">{entry.notesLabel}</p>
              </div>
            ))}
            {!latestInspections.length ? <p className="text-sm text-slate-500">No inspections logged yet.</p> : null}
          </div>
        </Card>
      </ResponsiveCardGrid>
    </div>
  );
}
