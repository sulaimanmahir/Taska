import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildHotelActiveBookingCard,
  buildHotelBookingMetrics,
  buildHotelBookingPayload,
  buildHotelCalendarCard,
  buildHotelCheckoutPayload,
  buildHotelHousekeepingLogCard,
  buildHotelHousekeepingPayload,
  buildHotelInspectionLogCard,
  buildHotelInspectionPayload,
  buildHotelMaintenancePayload,
  buildHotelMaintenanceRequestCard,
  buildHotelOccupancyTrendCard,
  buildHotelOverviewMetrics,
  buildHotelPaymentMethodCard,
  buildHotelRoomBlockPayload,
  buildHotelRoomCard,
  buildHotelRoomDeskMetrics,
  buildHotelRoomPayload,
  buildHotelShiftCard,
  buildHotelRoomReopenPayload,
  createHotelBookingForm,
  createHotelHousekeepingForm,
  createHotelInspectionForm,
  createHotelMaintenanceForm,
  createHotelRoomForm,
  createHotelShiftForm,
  filterHotelRooms,
} from '../src/lib/hotel.js';
import { formatCurrencyNGN } from '../src/lib/financeFormatters.js';

test('hotel form factories return stable room operations defaults', () => {
  assert.deepEqual(createHotelRoomForm(), {
    room_number: '101',
    category: 'Deluxe',
    floor: '1',
    base_rate: '45000',
    extra_guest_charge: '5000',
    late_checkout_charge: '8000',
    early_checkin_charge: '7000',
    status: 'available',
    cleaning_status: 'clean',
    blocked_reason: '',
  });

  assert.deepEqual(createHotelHousekeepingForm(), {
    room_id: '',
    status: 'cleaned',
    notes: '',
  });

  assert.deepEqual(createHotelMaintenanceForm(), {
    room_id: '',
    title: '',
    priority: 'medium',
    details: '',
  });

  assert.deepEqual(createHotelInspectionForm(), {
    room_id: '',
    status: 'pass',
    notes: '',
  });

  const fixedDate = new Date('2026-05-26T08:15:00.000Z');

  assert.deepEqual(createHotelBookingForm(fixedDate), {
    room_id: '',
    guest_name: 'Adaobi Nwosu',
    guest_phone: '08030009999',
    guest_email: 'adaobi.nwosu@example.com',
    check_in_date: '2026-05-26',
    check_out_date: '2026-05-27',
    adults: '2',
    extra_guests: '1',
    payment_method: 'transfer',
    amount_paid: '55000',
    apply_early_checkin_charge: false,
    apply_late_checkout_charge: false,
    notes: '',
  });

  assert.deepEqual(createHotelShiftForm(fixedDate), {
    staff_name: 'Grace Frontdesk',
    shift_role: 'Reception',
    started_at: '2026-05-26T08:15',
    ended_at: '',
    notes: '',
  });
});

test('hotel overview metrics keep occupancy, cleaning, maintenance, and readiness cards aligned', () => {
  assert.deepEqual(buildHotelOverviewMetrics({
    occupied_rooms: 12,
    total_rooms: 20,
    cleaning_attention: 4,
  }, 3), [
    {
      label: 'Occupied',
      value: '12/20',
      helper: 'Sellable rooms currently in use against the full room inventory.',
      tone: 'violet',
    },
    {
      label: 'Cleaning Queue',
      value: 4,
      helper: 'Rooms still needing housekeeping attention before they can turn cleanly.',
      tone: 'sky',
    },
    {
      label: 'Maintenance Open',
      value: 3,
      helper: 'Unresolved maintenance issues still affecting room readiness.',
      tone: 'amber',
    },
  ]);

  assert.deepEqual(buildHotelRoomDeskMetrics({
    occupied_rooms: 12,
    total_rooms: 20,
    cleaning_attention: 4,
  }, [
    { id: 1, status: 'blocked', cleaning_status: 'dirty' },
    { id: 2, status: 'available', cleaning_status: 'inspected' },
    { id: 3, status: 'out_of_service', cleaning_status: 'in_progress' },
  ], 3).slice(3), [
    {
      label: 'Blocked Rooms',
      value: 2,
      helper: 'Rooms currently withheld from sale because of blocking or out-of-service status.',
      tone: 'rose',
    },
    {
      label: 'Dirty or Turning',
      value: 2,
      helper: 'Rooms still in cleaning motion and not yet ready for clean front-desk release.',
      tone: 'amber',
    },
    {
      label: 'Inspected Ready',
      value: 1,
      helper: 'Rooms that have already passed cleaning inspection and are closest to sellable readiness.',
      tone: 'sky',
    },
  ]);

  assert.deepEqual(buildHotelBookingMetrics({
    checkins_today: 5,
    repeat_guests: 3,
    revenue_today: 275000,
    occupancy_rate: 60,
    shifts_active: 2,
  }, formatCurrencyNGN), [
    {
      label: 'Check-ins Today',
      value: 5,
      helper: 'Guests expected to arrive or already processed through the front desk today.',
      tone: 'violet',
    },
    {
      label: 'Repeat Guests',
      value: 3,
      helper: 'Returning guests whose history is helping drive occupancy and loyalty.',
      tone: 'sky',
    },
    {
      label: 'Revenue Today',
      value: formatCurrencyNGN(275000),
      helper: 'Booked and collected room revenue currently attributed to today.',
      tone: 'emerald',
    },
    {
      label: 'Occupancy Rate',
      value: '60%',
      helper: 'Share of rooms already occupied against your full live room inventory.',
      tone: 'amber',
    },
    {
      label: 'Active Shifts',
      value: 2,
      helper: 'Front desk or operations shifts currently still open on the hotel floor.',
      tone: 'sky',
    },
  ]);
});

test('hotel payload helpers normalize room, housekeeping, maintenance, and inspection forms consistently', () => {
  assert.deepEqual(buildHotelRoomPayload({
    room_number: '204',
    category: 'Executive',
    floor: '2',
    base_rate: '60000',
    extra_guest_charge: '7500',
    late_checkout_charge: '9000',
    early_checkin_charge: '8000',
    status: 'blocked',
    cleaning_status: 'dirty',
    blocked_reason: ' Air-conditioner repair ',
  }), {
    room_number: '204',
    category: 'Executive',
    floor: '2',
    base_rate: 60000,
    extra_guest_charge: 7500,
    late_checkout_charge: 9000,
    early_checkin_charge: 8000,
    status: 'blocked',
    cleaning_status: 'dirty',
    blocked_reason: 'Air-conditioner repair',
  });

  assert.deepEqual(buildHotelHousekeepingPayload({
    room_id: '4',
    status: 'cleaned',
    notes: 'Turned down',
  }), {
    room_id: 4,
    status: 'cleaned',
    notes: 'Turned down',
  });

  assert.deepEqual(buildHotelMaintenancePayload({
    room_id: '3',
    title: 'AC fault',
    priority: 'high',
    details: 'Cooling not working',
  }), {
    room_id: 3,
    title: 'AC fault',
    priority: 'high',
    details: 'Cooling not working',
  });

  assert.deepEqual(buildHotelInspectionPayload({
    room_id: '5',
    status: 'fail',
    notes: 'Linen incomplete',
  }), {
    room_id: 5,
    status: 'fail',
    notes: 'Linen incomplete',
  });

  assert.deepEqual(buildHotelRoomBlockPayload(), {
    status: 'blocked',
    blocked_reason: 'Temporarily withheld for maintenance planning',
  });

  assert.deepEqual(buildHotelRoomReopenPayload(), {
    status: 'available',
    blocked_reason: null,
  });

  assert.deepEqual(buildHotelBookingPayload({
    room_id: '7',
    guest_name: ' Adaobi Nwosu ',
    guest_phone: ' 08030009999 ',
    guest_email: ' adaobi@example.com ',
    check_in_date: '2026-05-26',
    check_out_date: '2026-05-27',
    adults: '2',
    extra_guests: '1',
    payment_method: 'transfer',
    amount_paid: '55000',
    apply_early_checkin_charge: false,
    apply_late_checkout_charge: true,
    notes: 'VIP guest',
  }), {
    room_id: 7,
    guest_name: 'Adaobi Nwosu',
    guest_phone: '08030009999',
    guest_email: 'adaobi@example.com',
    check_in_date: '2026-05-26',
    check_out_date: '2026-05-27',
    adults: 2,
    extra_guests: 1,
    payment_method: 'transfer',
    amount_paid: 55000,
    apply_early_checkin_charge: false,
    apply_late_checkout_charge: true,
    notes: 'VIP guest',
  });

  assert.deepEqual(buildHotelCheckoutPayload({
    late_checkout_charge_total: 8000,
    total_amount: 63000,
  }), {
    late_checkout_charge_total: 8000,
    amount_paid: 63000,
  });
});

test('hotel room and operations presenters keep the status board readable', () => {
  assert.deepEqual(buildHotelRoomCard({
    id: 7,
    room_number: '204',
    category: 'Executive',
    floor: '2',
    status: 'available',
    base_rate: 60000,
    extra_guest_charge: 7500,
    early_checkin_charge: 8000,
    late_checkout_charge: 9000,
    cleaning_status: 'in_progress',
    housekeeping_logs: [{ id: 1 }],
    inspections: [{ id: 1 }, { id: 2 }],
    maintenance_requests: [{ status: 'open' }, { status: 'resolved' }],
    blocked_reason: '',
  }), {
    id: 7,
    roomNumberLabel: '204',
    title: 'Executive',
    statusLabel: 'Floor 2 | available',
    rateLabel: 'NGN 60,000',
    cleaningLabel: 'in progress',
    maintenanceLabel: '1 open',
    chargesLabel: 'Extra guest NGN 7,500 | Early NGN 8,000 | Late NGN 9,000',
    housekeepingLabel: '1 housekeeping log',
    inspectionLabel: '2 inspections',
    blockedReasonLabel: '',
  });

  assert.deepEqual(filterHotelRooms([
    { id: 1, room_number: '101', category: 'Deluxe', floor: '1', status: 'available', cleaning_status: 'clean', blocked_reason: '' },
    { id: 2, room_number: '205', category: 'Executive', floor: '2', status: 'blocked', cleaning_status: 'dirty', blocked_reason: 'Leakage' },
  ], 'leak', 'blocked', 'dirty').map((room) => room.id), [2]);

  assert.deepEqual(buildHotelHousekeepingLogCard({
    id: 30,
    room: { room_number: '204' },
    status: 'cleaned',
    assigned_to: { name: 'Joy Housekeeper' },
    notes: '',
  }), {
    id: 30,
    title: '204',
    statusLabel: 'cleaned',
    assigneeLabel: 'Joy Housekeeper',
    notesLabel: 'No housekeeping note captured',
  });

  assert.deepEqual(buildHotelMaintenanceRequestCard({
    id: 31,
    room: { room_number: '205' },
    title: 'AC fault',
    priority: 'high',
    status: 'in_progress',
    details: '',
  }), {
    id: 31,
    title: '205',
    issueLabel: 'AC fault',
    priorityLabel: 'high',
    statusLabel: 'in progress',
    detailsLabel: 'No maintenance detail captured',
  });

  assert.deepEqual(buildHotelInspectionLogCard({
    id: 32,
    room: { room_number: '206' },
    status: 'fail',
    inspected_by: { name: 'Musa Supervisor' },
    notes: '',
  }), {
    id: 32,
    title: '206',
    statusLabel: 'fail',
    inspectorLabel: 'Musa Supervisor',
    notesLabel: 'No inspection note captured',
  });

  assert.deepEqual(buildHotelCalendarCard({
    id: 9,
    guest_name: 'Adaobi Nwosu',
    room_number: '204',
    check_in_date: '2026-05-26',
    check_out_date: '2026-05-27',
    status: 'checked_in',
  }), {
    id: 9,
    title: 'Adaobi Nwosu',
    stayLabel: '204 | 2026-05-26 to 2026-05-27',
    statusLabel: 'checked in',
  });

  assert.deepEqual(buildHotelPaymentMethodCard({
    payment_method: 'transfer',
    booking_count: 4,
    amount_paid: 180000,
  }, formatCurrencyNGN), {
    id: 'transfer',
    title: 'transfer',
    bookingsLabel: '4 bookings',
    amountLabel: formatCurrencyNGN(180000),
  });

  assert.deepEqual(buildHotelOccupancyTrendCard({
    date_label: 'Mon 26 May',
    checkins: 5,
  }), {
    id: 'Mon 26 May',
    title: 'Mon 26 May',
    checkinsLabel: '5 check-ins',
  });

  assert.deepEqual(buildHotelActiveBookingCard({
    id: 12,
    guest_name: 'Adaobi Nwosu',
    guest_phone: '08030009999',
    guest_email: 'adaobi@example.com',
    room: { room_number: '204' },
    reservation_code: 'RSV-204',
    check_in_date: '2026-05-26',
    check_out_date: '2026-05-27',
    total_amount: 63000,
    amount_paid: 55000,
    payment_method: 'transfer',
    is_repeat_guest: true,
    status: 'checked_in',
  }, formatCurrencyNGN), {
    id: 12,
    title: 'Adaobi Nwosu',
    roomLabel: '204 | RSV-204',
    amountLabel: `${formatCurrencyNGN(63000)} | transfer`,
    guestMetaLabel: '08030009999 | adaobi@example.com',
    stayLabel: '2026-05-26 to 2026-05-27',
    chargeLabel: `${formatCurrencyNGN(55000)} paid | ${formatCurrencyNGN(8000)} outstanding`,
    repeatGuestLabel: 'Repeat guest',
    canCheckIn: false,
    canCheckOut: true,
  });

  assert.deepEqual(buildHotelShiftCard({
    id: 22,
    staff_name: 'Grace Frontdesk',
    shift_role: 'Reception',
    started_at: '2026-05-26T08:15',
    ended_at: '',
    notes: '',
  }), {
    id: 22,
    title: 'Grace Frontdesk',
    roleLabel: 'Reception',
    windowLabel: '2026-05-26T08:15 -> Active',
    notesLabel: 'No handover note captured',
  });
});
