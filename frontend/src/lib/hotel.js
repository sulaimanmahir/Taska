export function createHotelRoomForm() {
  return {
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
  };
}

export function createHotelHousekeepingForm() {
  return {
    room_id: '',
    status: 'cleaned',
    notes: '',
  };
}

export function createHotelMaintenanceForm() {
  return {
    room_id: '',
    title: '',
    priority: 'medium',
    details: '',
  };
}

export function createHotelInspectionForm() {
  return {
    room_id: '',
    status: 'pass',
    notes: '',
  };
}

export function createHotelBookingForm(date = new Date()) {
  return {
    room_id: '',
    guest_name: 'Adaobi Nwosu',
    guest_phone: '08030009999',
    guest_email: 'adaobi.nwosu@example.com',
    check_in_date: date.toISOString().slice(0, 10),
    check_out_date: new Date(date.getTime() + 86400000).toISOString().slice(0, 10),
    adults: '2',
    extra_guests: '1',
    payment_method: 'transfer',
    amount_paid: '55000',
    apply_early_checkin_charge: false,
    apply_late_checkout_charge: false,
    notes: '',
  };
}

export function createHotelShiftForm(date = new Date()) {
  return {
    staff_name: 'Grace Frontdesk',
    shift_role: 'Reception',
    started_at: date.toISOString().slice(0, 16),
    ended_at: '',
    notes: '',
  };
}

export function buildHotelOverviewMetrics(summary = {}, maintenanceOpen = 0) {
  return [
    {
      label: 'Occupied',
      value: `${summary.occupied_rooms ?? 0}/${summary.total_rooms ?? 0}`,
      helper: 'Sellable rooms currently in use against the full room inventory.',
      tone: 'violet',
    },
    {
      label: 'Cleaning Queue',
      value: summary.cleaning_attention ?? 0,
      helper: 'Rooms still needing housekeeping attention before they can turn cleanly.',
      tone: 'sky',
    },
    {
      label: 'Maintenance Open',
      value: maintenanceOpen,
      helper: 'Unresolved maintenance issues still affecting room readiness.',
      tone: 'amber',
    },
  ];
}

export function buildHotelRoomDeskMetrics(summary = {}, rooms = [], maintenanceOpen = 0) {
  const blockedRooms = rooms.filter((room) => ['blocked', 'out_of_service'].includes(room.status)).length;
  const dirtyRooms = rooms.filter((room) => ['dirty', 'in_progress'].includes(room.cleaning_status)).length;
  const inspectedRooms = rooms.filter((room) => room.cleaning_status === 'inspected').length;

  return [
    ...buildHotelOverviewMetrics(summary, maintenanceOpen),
    {
      label: 'Blocked Rooms',
      value: blockedRooms,
      helper: 'Rooms currently withheld from sale because of blocking or out-of-service status.',
      tone: blockedRooms > 0 ? 'rose' : 'emerald',
    },
    {
      label: 'Dirty or Turning',
      value: dirtyRooms,
      helper: 'Rooms still in cleaning motion and not yet ready for clean front-desk release.',
      tone: dirtyRooms > 0 ? 'amber' : 'emerald',
    },
    {
      label: 'Inspected Ready',
      value: inspectedRooms,
      helper: 'Rooms that have already passed cleaning inspection and are closest to sellable readiness.',
      tone: 'sky',
    },
  ];
}

export function buildHotelBookingMetrics(summary = {}, formatCurrency) {
  return [
    {
      label: 'Check-ins Today',
      value: summary.checkins_today ?? 0,
      helper: 'Guests expected to arrive or already processed through the front desk today.',
      tone: 'violet',
    },
    {
      label: 'Repeat Guests',
      value: summary.repeat_guests ?? 0,
      helper: 'Returning guests whose history is helping drive occupancy and loyalty.',
      tone: 'sky',
    },
    {
      label: 'Revenue Today',
      value: formatCurrency(summary.revenue_today ?? 0),
      helper: 'Booked and collected room revenue currently attributed to today.',
      tone: 'emerald',
    },
    {
      label: 'Occupancy Rate',
      value: `${summary.occupancy_rate ?? 0}%`,
      helper: 'Share of rooms already occupied against your full live room inventory.',
      tone: 'amber',
    },
    {
      label: 'Active Shifts',
      value: summary.shifts_active ?? 0,
      helper: 'Front desk or operations shifts currently still open on the hotel floor.',
      tone: 'sky',
    },
  ];
}

export function buildHotelRoomPayload(form = {}) {
  return {
    ...form,
    base_rate: Number(form.base_rate || 0),
    extra_guest_charge: Number(form.extra_guest_charge || 0),
    late_checkout_charge: Number(form.late_checkout_charge || 0),
    early_checkin_charge: Number(form.early_checkin_charge || 0),
    blocked_reason: form.blocked_reason?.trim() || null,
  };
}

export function buildHotelHousekeepingPayload(form = {}) {
  return {
    ...form,
    room_id: Number(form.room_id),
  };
}

export function buildHotelMaintenancePayload(form = {}) {
  return {
    ...form,
    room_id: Number(form.room_id),
  };
}

export function buildHotelInspectionPayload(form = {}) {
  return {
    ...form,
    room_id: Number(form.room_id),
  };
}

export function buildHotelBookingPayload(form = {}) {
  return {
    ...form,
    room_id: Number(form.room_id),
    guest_name: form.guest_name?.trim() || '',
    guest_phone: form.guest_phone?.trim() || null,
    guest_email: form.guest_email?.trim() || null,
    adults: Number(form.adults || 1),
    extra_guests: Number(form.extra_guests || 0),
    amount_paid: Number(form.amount_paid || 0),
    notes: form.notes?.trim() || null,
  };
}

export function buildHotelCheckoutPayload(booking = {}) {
  return {
    late_checkout_charge_total: booking.late_checkout_charge_total,
    amount_paid: booking.total_amount,
  };
}

export function buildHotelRoomBlockPayload() {
  return {
    status: 'blocked',
    blocked_reason: 'Temporarily withheld for maintenance planning',
  };
}

export function buildHotelRoomReopenPayload() {
  return {
    status: 'available',
    blocked_reason: null,
  };
}

export function buildHotelRoomCard(room = {}) {
  const openMaintenance = room.maintenance_requests?.filter((item) => item.status !== 'resolved').length ?? 0;
  const housekeepingEntries = room.housekeeping_logs?.length ?? 0;
  const inspectionEntries = room.inspections?.length ?? 0;

  return {
    id: room.id,
    roomNumberLabel: room.room_number || 'Room',
    title: room.category || 'Room',
    statusLabel: `Floor ${room.floor || 'N/A'} | ${(room.status || 'unknown').replaceAll('_', ' ')}`,
    rateLabel: `NGN ${Number(room.base_rate || 0).toLocaleString()}`,
    cleaningLabel: (room.cleaning_status || 'unknown').replaceAll('_', ' '),
    maintenanceLabel: `${openMaintenance} open`,
    chargesLabel: `Extra guest NGN ${Number(room.extra_guest_charge || 0).toLocaleString()} | Early NGN ${Number(room.early_checkin_charge || 0).toLocaleString()} | Late NGN ${Number(room.late_checkout_charge || 0).toLocaleString()}`,
    housekeepingLabel: `${housekeepingEntries} housekeeping log${housekeepingEntries === 1 ? '' : 's'}`,
    inspectionLabel: `${inspectionEntries} inspection${inspectionEntries === 1 ? '' : 's'}`,
    blockedReasonLabel: room.blocked_reason ? `Blocked reason: ${room.blocked_reason}` : '',
  };
}

export function filterHotelRooms(rooms = [], searchTerm = '', status = '', cleaningStatus = '') {
  const query = searchTerm.trim().toLowerCase();

  return rooms.filter((room) => {
    if (status && room.status !== status) {
      return false;
    }

    if (cleaningStatus && room.cleaning_status !== cleaningStatus) {
      return false;
    }

    if (!query) {
      return true;
    }

    const fields = [
      room.room_number,
      room.category,
      room.floor,
      room.status,
      room.cleaning_status,
      room.blocked_reason,
    ];

    return fields.some((field) => String(field ?? '').toLowerCase().includes(query));
  });
}

export function buildHotelHousekeepingLogCard(entry = {}) {
  return {
    id: entry.id,
    title: entry.room?.room_number || 'Room',
    statusLabel: (entry.status || 'unknown').replaceAll('_', ' '),
    assigneeLabel: entry.assigned_to?.name || 'No assignee',
    notesLabel: entry.notes || 'No housekeeping note captured',
  };
}

export function buildHotelMaintenanceRequestCard(entry = {}) {
  return {
    id: entry.id,
    title: entry.room?.room_number || 'Room',
    issueLabel: entry.title || 'Maintenance issue',
    priorityLabel: entry.priority || 'medium',
    statusLabel: (entry.status || 'open').replaceAll('_', ' '),
    detailsLabel: entry.details || 'No maintenance detail captured',
  };
}

export function buildHotelInspectionLogCard(entry = {}) {
  return {
    id: entry.id,
    title: entry.room?.room_number || 'Room',
    statusLabel: entry.status || 'pass',
    inspectorLabel: entry.inspected_by?.name || 'Inspector not captured',
    notesLabel: entry.notes || 'No inspection note captured',
  };
}

export function buildHotelCalendarCard(entry = {}) {
  return {
    id: entry.id,
    title: entry.guest_name || 'Guest',
    stayLabel: `${entry.room_number || 'Room'} | ${entry.check_in_date} to ${entry.check_out_date}`,
    statusLabel: (entry.status || 'unknown').replaceAll('_', ' '),
  };
}

export function buildHotelPaymentMethodCard(item = {}, formatCurrency) {
  return {
    id: item.payment_method || 'payment-method',
    title: item.payment_method || 'Unknown',
    bookingsLabel: `${item.booking_count ?? 0} bookings`,
    amountLabel: formatCurrency(item.amount_paid ?? 0),
  };
}

export function buildHotelOccupancyTrendCard(trend = {}) {
  return {
    id: trend.date_label || 'trend',
    title: trend.date_label || 'Date',
    checkinsLabel: `${trend.checkins ?? 0} check-ins`,
  };
}

export function buildHotelActiveBookingCard(booking = {}, formatCurrency) {
  const outstanding = Number(booking.total_amount || 0) - Number(booking.amount_paid || 0);

  return {
    id: booking.id,
    title: booking.guest_name || 'Guest',
    roomLabel: `${booking.room?.room_number || 'Room'} | ${booking.reservation_code || 'No reservation code'}`,
    amountLabel: `${formatCurrency(booking.total_amount ?? 0)} | ${booking.payment_method || 'No payment method'}`,
    guestMetaLabel: [booking.guest_phone, booking.guest_email].filter(Boolean).join(' | ') || 'No guest contact on file',
    stayLabel: `${booking.check_in_date || 'Check-in'} to ${booking.check_out_date || 'Check-out'}`,
    chargeLabel: `${formatCurrency(booking.amount_paid ?? 0)} paid | ${formatCurrency(outstanding)} outstanding`,
    repeatGuestLabel: booking.is_repeat_guest ? 'Repeat guest' : 'First-time guest',
    canCheckIn: booking.status === 'reserved',
    canCheckOut: booking.status === 'checked_in',
  };
}

export function buildHotelShiftCard(shift = {}) {
  return {
    id: shift.id,
    title: shift.staff_name || 'Staff',
    roleLabel: shift.shift_role || 'Shift',
    windowLabel: `${shift.started_at || 'No start'}${shift.ended_at ? ` -> ${shift.ended_at}` : ' -> Active'}`,
    notesLabel: shift.notes || 'No handover note captured',
  };
}
