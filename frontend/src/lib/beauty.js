import { formatCurrencyNGN } from './financeFormatters.js';

export const beautySectionTitles = {
  '/appointments': 'Appointments',
  '/products': 'Service Catalogue',
  '/inventory': 'Products Used',
  '/customers': 'Client Bookings',
};

export function getBeautyActiveSection(pathname = '') {
  return beautySectionTitles[pathname] || 'Dashboard';
}

export function getBeautyDefaultAppointmentAt(date = new Date()) {
  return new Date(date.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
}

export function createBeautyServiceForm() {
  return {
    name: '',
    category: 'Hair',
    duration_minutes: '60',
    price: '',
    commission_rate: '20',
  };
}

export function createBeautyStaffForm() {
  return { name: '', specialty: '', phone: '' };
}

export function createBeautyAppointmentForm(date = new Date()) {
  return {
    customer_id: '',
    service_id: '',
    staff_profile_id: '',
    appointment_at: getBeautyDefaultAppointmentAt(date),
    notes: '',
  };
}

export function buildBeautyOverviewMetrics(summary = {}, formatCurrency = formatCurrencyNGN, isLoading = false) {
  const loadingValue = isLoading ? '...' : null;

  return [
    {
      label: 'Appointments Today',
      value: loadingValue ?? (summary.appointments_today || 0),
      helper: 'Bookings already moving through the salon chair schedule.',
      tone: 'sky',
    },
    {
      label: 'Completed Today',
      value: loadingValue ?? (summary.completed_today || 0),
      helper: 'Services already closed out and ready for payout accounting.',
      tone: 'emerald',
    },
    {
      label: 'Revenue Today',
      value: loadingValue ?? formatCurrency(summary.revenue_today || 0),
      helper: 'Daily service revenue captured from the current salon flow.',
      tone: 'violet',
    },
    {
      label: 'Commissions Due',
      value: loadingValue ?? formatCurrency(summary.commissions_due || 0),
      helper: 'Stylist commission obligations still waiting for settlement.',
      tone: 'amber',
    },
  ];
}

export function buildBeautyOwnerFocusMetrics(summary = {}, formatCurrency = formatCurrencyNGN) {
  return [
    {
      label: 'Pending Queue',
      value: summary.pending_queue || 0,
      helper: 'Bookings still waiting for chair time or completion.',
      tone: 'amber',
    },
    {
      label: 'Product Cost Today',
      value: formatCurrency(summary.product_cost_today || 0),
      helper: 'Consumable usage cost already absorbed by today\'s service flow.',
      tone: 'rose',
    },
    {
      label: 'Repeat Clients',
      value: summary.repeat_clients || 0,
      helper: 'Returning clients helping stabilise salon demand.',
      tone: 'emerald',
    },
  ];
}

export function buildBeautyDeskMetrics(
  summary = {},
  appointments = [],
  staff = [],
  services = [],
  isLoading = false,
  formatCurrency = formatCurrencyNGN,
) {
  const loadingValue = isLoading ? '...' : null;
  const pendingQueue = getBeautyPendingAppointments(appointments);
  const unassigned = pendingQueue.filter((appointment) => !appointment.staff_profile?.name).length;
  const repeatClients = new Set(
    appointments.map((appointment) => appointment.customer?.id).filter(Boolean),
  ).size;

  return [
    ...buildBeautyOverviewMetrics(summary, formatCurrency, isLoading),
    {
      label: 'Queue Pressure',
      value: loadingValue ?? pendingQueue.length,
      helper: 'Live bookings still waiting for chair time or checkout on the salon floor.',
      tone: 'amber',
    },
    {
      label: 'Unassigned',
      value: loadingValue ?? unassigned,
      helper: 'Appointments still missing a named stylist or service owner.',
      tone: 'rose',
    },
    {
      label: 'Staff Ready',
      value: loadingValue ?? staff.length,
      helper: 'Active stylists and operators available to absorb the current booking flow.',
      tone: 'emerald',
    },
    {
      label: 'Service Lines',
      value: loadingValue ?? services.length,
      helper: 'Sellable beauty services already configured with price and timing.',
      tone: 'sky',
    },
    {
      label: 'Visible Clients',
      value: loadingValue ?? repeatClients,
      helper: 'Unique clients already visible in the active appointment ledger.',
      tone: 'violet',
    },
  ];
}

export function getBeautyPendingAppointments(appointments = []) {
  return appointments.filter((appointment) => ['scheduled', 'in_service'].includes(appointment.status));
}

export function filterBeautyServices(services = [], query = '') {
  const search = query.trim().toLowerCase();

  if (!search) {
    return services;
  }

  return services.filter((service) =>
    [service.name, service.category, service.duration_minutes, service.price]
      .some((field) => String(field ?? '').toLowerCase().includes(search))
  );
}

export function filterBeautyAppointments(appointments = [], query = '') {
  const search = query.trim().toLowerCase();

  if (!search) {
    return appointments;
  }

  return appointments.filter((appointment) =>
    [
      appointment.customer?.name,
      appointment.service?.name,
      appointment.staff_profile?.name,
      appointment.status,
      appointment.notes,
    ]
      .some((field) => String(field ?? '').toLowerCase().includes(search))
  );
}

export function buildBeautyQueueCard(appointment = {}) {
  return {
    id: appointment.id,
    clientLabel: appointment.customer?.name || 'Walk-in client',
    meta: `${appointment.service?.name || 'Service'} with ${appointment.staff_profile?.name || 'Unassigned stylist'}`,
    statusLabel: appointment.status || 'scheduled',
  };
}

export function buildBeautyServicePayload(serviceForm = {}) {
  return {
    ...serviceForm,
    duration_minutes: Number(serviceForm.duration_minutes || 60),
    price: Number(serviceForm.price || 0),
    commission_rate: Number(serviceForm.commission_rate || 0),
  };
}

export function buildBeautyAppointmentPayload(appointmentForm = {}) {
  return {
    customer_id: appointmentForm.customer_id || null,
    service_id: Number(appointmentForm.service_id),
    staff_profile_id: appointmentForm.staff_profile_id ? Number(appointmentForm.staff_profile_id) : null,
    appointment_at: appointmentForm.appointment_at,
    notes: appointmentForm.notes || null,
  };
}

export function buildBeautyServiceCard(service = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: service.id,
    title: service.name || 'Beauty service',
    categoryLabel: service.category || 'General',
    durationLabel: `${service.duration_minutes || 0} mins`,
    priceLabel: formatCurrency(service.price || 0),
    commissionLabel: `${service.commission_rate || 0}% commission`,
  };
}

export function buildBeautyStaffCard(member = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: member.id,
    title: member.name || 'Stylist',
    meta: `${member.specialty || 'General stylist'} - Wallet ${formatCurrency(member.commission_wallet || 0)}`,
    phoneLabel: member.phone || 'No phone on file',
  };
}

export function buildBeautyAppointmentCard(appointment = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: appointment.id,
    clientLabel: appointment.customer?.name || 'Walk-in client',
    serviceLabel: appointment.service?.name || 'Service pending',
    staffLabel: appointment.staff_profile?.name || 'Unassigned stylist',
    bookedAtLabel: appointment.appointment_at
      ? new Date(appointment.appointment_at).toLocaleString('en-NG')
      : 'Schedule pending',
    statusLabel: (appointment.status || 'scheduled').replaceAll('_', ' '),
    revenueLabel: formatCurrency(appointment.service_price || appointment.service?.price || 0),
    notesLabel: appointment.notes || 'No notes captured yet.',
  };
}

export function createBeautyCompletionForm(appointment = {}, products = []) {
  return {
    service_price: appointment.service_price || appointment.service?.price || '',
    commission_rate: appointment.service?.commission_rate || '',
    product_id: products[0]?.id || '',
    quantity: '1',
    unit_cost: products[0]?.cost_price || '',
  };
}

export function buildBeautyCompletionPayload(form = {}) {
  return {
    service_price: Number(form.service_price || 0),
    commission_rate: Number(form.commission_rate || 0),
    product_usages: form.product_id
      ? [{
        product_id: Number(form.product_id),
        quantity: Number(form.quantity || 0),
        unit_cost: Number(form.unit_cost || 0),
      }]
      : [],
  };
}

export function buildBeautyAppointmentFloorCard(appointment = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: appointment.id,
    clientLabel: appointment.customer?.name || 'Walk-in client',
    meta: `${appointment.service?.name || 'Service'} with ${appointment.staff_profile?.name || 'Unassigned stylist'}`,
    appointmentAtLabel: new Date(appointment.appointment_at).toLocaleString('en-NG'),
    statusLabel: (appointment.status || 'scheduled').replaceAll('_', ' '),
    isCompleted: appointment.status === 'completed',
    completedSummary: `Completed: revenue ${formatCurrency(appointment.service_price || 0)} | commission ${formatCurrency(appointment.commission_amount || 0)} | products ${formatCurrency(appointment.product_cost || 0)}`,
  };
}
