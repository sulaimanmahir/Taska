import { formatCurrencyNGN } from './financeFormatters.js';

export const serviceSectionTitles = {
  '/appointments': 'Bookings',
  '/products': 'Service Catalogue',
  '/customers': 'Clients',
  '/reports': 'Reports',
};

export function getServiceDefaultBookingTime(date = new Date()) {
  return new Date(date.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
}

export function getServiceActiveSection(pathname = '') {
  return serviceSectionTitles[pathname] || 'Dashboard';
}

export function createServiceOfferingForm() {
  return {
    name: '',
    category: 'Professional Service',
    duration_minutes: '60',
    base_price: '',
  };
}

export function createServiceStaffForm() {
  return { name: '', specialty: '', phone: '' };
}

export function createServiceBookingForm(date = new Date()) {
  return {
    customer_id: '',
    offering_id: '',
    scheduled_for: getServiceDefaultBookingTime(date),
    referral_source: '',
    notes: '',
  };
}

export function createServiceJobForm() {
  return {
    booking_id: '',
    customer_id: '',
    offering_id: '',
    staff_profile_id: '',
    quoted_amount: '',
    invoice_amount: '',
    amount_paid: '',
    due_date: '',
    notes: '',
  };
}

export function buildServiceOverviewMetrics(summary = {}, formatCurrency = formatCurrencyNGN, isLoading = false) {
  const loadingValue = isLoading ? '...' : null;

  return [
    {
      label: 'Bookings Today',
      value: loadingValue ?? (summary.bookings_today || 0),
      helper: 'Fresh client bookings already flowing through the current day.',
      tone: 'sky',
    },
    {
      label: 'Open Jobs',
      value: loadingValue ?? (summary.open_jobs || 0),
      helper: 'Work still active, assigned, or waiting for closure.',
      tone: 'violet',
    },
    {
      label: 'Revenue Today',
      value: loadingValue ?? formatCurrency(summary.revenue_today || 0),
      helper: 'Service revenue already captured from the live operating queue.',
      tone: 'emerald',
    },
    {
      label: 'Outstanding Invoices',
      value: loadingValue ?? formatCurrency(summary.invoices_outstanding || 0),
      helper: 'Invoice value still unrecovered from delivered work.',
      tone: 'amber',
    },
  ];
}

export function buildServiceOwnerFocusMetrics(summary = {}) {
  return [
    {
      label: 'Jobs Created Today',
      value: summary.jobs_created_today || 0,
      helper: 'New work opened during the current operating day.',
      tone: 'amber',
    },
    {
      label: 'Overdue Invoices',
      value: summary.overdue_invoices || 0,
      helper: 'Invoices that have crossed their due date and need follow-up.',
      tone: 'rose',
    },
    {
      label: 'Assigned Staff',
      value: summary.assigned_staff || 0,
      helper: 'Team members currently attached to active service jobs.',
      tone: 'emerald',
    },
  ];
}

export function buildServiceDeskMetrics(
  summary = {},
  bookings = [],
  jobs = [],
  staff = [],
  isLoading = false,
  formatCurrency = formatCurrencyNGN,
) {
  const loadingValue = isLoading ? '...' : null;
  const openJobs = getServiceOpenJobs(jobs);
  const unassignedJobs = openJobs.filter((job) => !job.staff_profile?.name).length;
  const overdueJobs = jobs.filter((job) => {
    if (!job.due_date || job.status === 'completed') {
      return false;
    }

    return new Date(job.due_date) < new Date();
  }).length;

  return [
    {
      label: 'Bookings Today',
      value: loadingValue ?? (summary.bookings_today || 0),
      helper: 'Fresh client bookings already flowing through the current day.',
      tone: 'sky',
    },
    {
      label: 'Open Jobs',
      value: loadingValue ?? openJobs.length,
      helper: 'Work still active, assigned, or waiting for closure.',
      tone: 'violet',
    },
    {
      label: 'Revenue Today',
      value: loadingValue ?? formatCurrency(summary.revenue_today || 0),
      helper: 'Service revenue already captured from the live operating queue.',
      tone: 'emerald',
    },
    {
      label: 'Outstanding Invoices',
      value: loadingValue ?? formatCurrency(summary.invoices_outstanding || 0),
      helper: 'Invoice value still unrecovered from delivered work.',
      tone: 'amber',
    },
    {
      label: 'Unassigned Jobs',
      value: loadingValue ?? unassignedJobs,
      helper: 'Active work that still needs a named owner before delivery slips.',
      tone: 'rose',
    },
    {
      label: 'Upcoming Bookings',
      value: loadingValue ?? bookings.filter((booking) => booking.status !== 'cancelled').length,
      helper: 'Visible booking pipeline ready to convert into billable service work.',
      tone: 'cyan',
    },
    {
      label: 'Staff Ready',
      value: loadingValue ?? staff.length,
      helper: 'Service staff profiles available for assignment and scheduling.',
      tone: 'emerald',
    },
    {
      label: 'Overdue Jobs',
      value: loadingValue ?? overdueJobs,
      helper: 'Jobs already past due date and likely to need delivery or collection follow-up.',
      tone: 'amber',
    },
  ];
}

export function getServiceOpenJobs(jobs = []) {
  return jobs.filter((job) => ['open', 'in_progress'].includes(job.status));
}

export function filterServiceOfferings(offerings = [], query = '') {
  const search = query.trim().toLowerCase();

  if (!search) {
    return offerings;
  }

  return offerings.filter((offering) =>
    [offering.name, offering.category, offering.description]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search))
  );
}

export function filterServiceBookings(bookings = [], query = '') {
  const search = query.trim().toLowerCase();

  if (!search) {
    return bookings;
  }

  return bookings.filter((booking) =>
    [
      booking.customer?.name,
      booking.offering?.name,
      booking.referral_source,
      booking.notes,
      booking.status,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search))
  );
}

export function filterServiceJobs(jobs = [], query = '') {
  const search = query.trim().toLowerCase();

  if (!search) {
    return jobs;
  }

  return jobs.filter((job) =>
    [
      job.customer?.name,
      job.offering?.name,
      job.staff_profile?.name,
      job.status,
      job.notes,
      job.reference,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search))
  );
}

export function buildServiceOpenJobCard(job = {}) {
  return {
    id: job.id,
    clientLabel: job.customer?.name || 'Direct client job',
    meta: `${job.offering?.name || 'Service job'} - ${job.staff_profile?.name || 'Unassigned staff'}`,
    statusLabel: job.status || 'open',
    invoiceLabel: `Invoice ${formatCurrencyNGN(job.invoice_amount || 0)} | Paid ${formatCurrencyNGN(job.amount_paid || 0)}`,
  };
}

export function buildServiceOfferingPayload(offeringForm = {}) {
  return {
    ...offeringForm,
    duration_minutes: Number(offeringForm.duration_minutes || 60),
    base_price: Number(offeringForm.base_price || 0),
  };
}

export function buildServiceBookingPayload(bookingForm = {}) {
  return {
    customer_id: bookingForm.customer_id || null,
    offering_id: Number(bookingForm.offering_id),
    scheduled_for: bookingForm.scheduled_for,
    referral_source: bookingForm.referral_source || null,
    notes: bookingForm.notes || null,
  };
}

export function buildServiceOfferingCard(offering = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: offering.id,
    title: offering.name || 'Untitled service',
    categoryLabel: offering.category || 'Professional Service',
    durationLabel: `${offering.duration_minutes || 0} mins`,
    priceLabel: formatCurrency(offering.base_price || 0),
  };
}

export function buildServiceStaffCard(member = {}) {
  return {
    id: member.id,
    title: member.name || 'Unnamed staff',
    specialtyLabel: member.specialty || 'General service delivery',
    phoneLabel: member.phone || 'No phone on file',
  };
}

export function buildServiceBookingCard(booking = {}) {
  return {
    id: booking.id,
    title: booking.customer?.name || 'Direct client booking',
    serviceLabel: booking.offering?.name || 'Service pending selection',
    scheduleLabel: booking.scheduled_for ? new Date(booking.scheduled_for).toLocaleString() : 'Schedule pending',
    referralLabel: booking.referral_source || 'Direct booking',
    notesLabel: booking.notes || 'No notes provided yet.',
    statusLabel: booking.status || 'scheduled',
  };
}

export function buildServiceJobPayload(jobForm = {}) {
  return {
    booking_id: jobForm.booking_id ? Number(jobForm.booking_id) : null,
    customer_id: jobForm.customer_id ? Number(jobForm.customer_id) : null,
    offering_id: Number(jobForm.offering_id),
    staff_profile_id: jobForm.staff_profile_id ? Number(jobForm.staff_profile_id) : null,
    quoted_amount: jobForm.quoted_amount ? Number(jobForm.quoted_amount) : null,
    invoice_amount: jobForm.invoice_amount ? Number(jobForm.invoice_amount) : null,
    amount_paid: Number(jobForm.amount_paid || 0),
    due_date: jobForm.due_date || null,
    notes: jobForm.notes || null,
  };
}

export function buildServiceRecentJobCard(job = {}, formatCurrency = formatCurrencyNGN) {
  const balance = Math.max((job.invoice_amount || 0) - (job.amount_paid || 0), 0);

  return {
    id: job.id,
    clientLabel: job.customer?.name || 'Direct client',
    meta: `${job.offering?.name || 'Service job'} - ${job.staff_profile?.name || 'No staff yet'}`,
    invoiceLabel: `Invoice ${formatCurrency(job.invoice_amount)} | Paid ${formatCurrency(job.amount_paid)}`,
    balanceLabel: `Outstanding ${formatCurrency(balance)}`,
    dueLabel: job.due_date ? `Due ${job.due_date}` : 'No due date set',
    notesLabel: job.notes || 'No delivery notes yet.',
    statusLabel: job.status || 'open',
    canMarkComplete: job.status !== 'completed',
  };
}

export function buildServiceCompletionPayload(job = {}) {
  return {
    status: 'completed',
    amount_paid: job.amount_paid,
    notes: job.notes,
  };
}
