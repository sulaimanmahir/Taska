import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildServiceBookingPayload,
  buildServiceBookingCard,
  buildServiceCompletionPayload,
  buildServiceDeskMetrics,
  buildServiceJobPayload,
  buildServiceOfferingCard,
  buildServiceOfferingPayload,
  buildServiceOpenJobCard,
  buildServiceOverviewMetrics,
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
  getServiceDefaultBookingTime,
  getServiceOpenJobs,
  serviceSectionTitles,
} from '../src/lib/service.js';
import { formatCurrencyNGN } from '../src/lib/financeFormatters.js';

test('service section and form helpers return stable defaults', () => {
  const fixedDate = new Date('2026-05-25T12:30:45.000Z');

  assert.equal(getServiceDefaultBookingTime(fixedDate), '2026-05-25T13:30');
  assert.equal(getServiceActiveSection('/appointments'), 'Bookings');
  assert.equal(getServiceActiveSection('/unknown'), 'Dashboard');
  assert.equal(serviceSectionTitles['/products'], 'Service Catalogue');
  assert.deepEqual(createServiceOfferingForm(), {
    name: '',
    category: 'Professional Service',
    duration_minutes: '60',
    base_price: '',
  });
  assert.deepEqual(createServiceStaffForm(), { name: '', specialty: '', phone: '' });
  assert.deepEqual(createServiceBookingForm(fixedDate), {
    customer_id: '',
    offering_id: '',
    scheduled_for: '2026-05-25T13:30',
    referral_source: '',
    notes: '',
  });
  assert.deepEqual(createServiceJobForm(), {
    booking_id: '',
    customer_id: '',
    offering_id: '',
    staff_profile_id: '',
    quoted_amount: '',
    invoice_amount: '',
    amount_paid: '',
    due_date: '',
    notes: '',
  });
});

test('service overview and owner focus helpers keep operational metrics aligned', () => {
  const metrics = buildServiceOverviewMetrics({
    bookings_today: 6,
    open_jobs: 4,
    revenue_today: 220000,
    invoices_outstanding: 85000,
  }, formatCurrencyNGN, false);
  const focus = buildServiceOwnerFocusMetrics({
    jobs_created_today: 3,
    overdue_invoices: 2,
    assigned_staff: 5,
  });

  assert.deepEqual(metrics[0], {
    label: 'Bookings Today',
    value: 6,
    helper: 'Fresh client bookings already flowing through the current day.',
    tone: 'sky',
  });
  assert.equal(metrics[2].value, formatCurrencyNGN(220000));
  assert.deepEqual(buildServiceOverviewMetrics({}, formatCurrencyNGN, true)[1].value, '...');
  assert.deepEqual(focus[1], {
    label: 'Overdue Invoices',
    value: 2,
    helper: 'Invoices that have crossed their due date and need follow-up.',
    tone: 'rose',
  });

  const deskMetrics = buildServiceDeskMetrics(
    {
      bookings_today: 6,
      revenue_today: 220000,
      invoices_outstanding: 85000,
    },
    [{ id: 1, status: 'scheduled' }],
    [
      { id: 1, status: 'open', due_date: '2026-05-20', staff_profile: null },
      { id: 2, status: 'completed', due_date: '2026-05-30' },
    ],
    [{ id: 4 }],
    false,
    formatCurrencyNGN,
  );

  assert.equal(deskMetrics[1].value, 1);
  assert.equal(deskMetrics[4].value, 1);
  assert.equal(deskMetrics[6].value, 1);
});

test('service open-job helpers keep watch cards readable', () => {
  const jobs = getServiceOpenJobs([
    { id: 1, status: 'open', customer: { name: 'Amina' }, offering: { name: 'Consulting' }, staff_profile: { name: 'Musa' } },
    { id: 2, status: 'completed' },
    { id: 3, status: 'in_progress', customer: null, offering: { name: 'Maintenance' }, staff_profile: null },
  ]);

  assert.equal(jobs.length, 2);
  assert.deepEqual(buildServiceOpenJobCard(jobs[0]), {
    id: 1,
    clientLabel: 'Amina',
    meta: 'Consulting - Musa',
    statusLabel: 'open',
    invoiceLabel: `Invoice ${formatCurrencyNGN(0)} | Paid ${formatCurrencyNGN(0)}`,
  });
  assert.deepEqual(buildServiceOpenJobCard(jobs[1]), {
    id: 3,
    clientLabel: 'Direct client job',
    meta: 'Maintenance - Unassigned staff',
    statusLabel: 'in_progress',
    invoiceLabel: `Invoice ${formatCurrencyNGN(0)} | Paid ${formatCurrencyNGN(0)}`,
  });
});

test('service payload and recent-job helpers normalize service workflow data', () => {
  assert.deepEqual(buildServiceOfferingPayload({
    name: 'Consultation',
    category: 'Professional Service',
    duration_minutes: '90',
    base_price: '35000',
  }), {
    name: 'Consultation',
    category: 'Professional Service',
    duration_minutes: 90,
    base_price: 35000,
  });

  assert.deepEqual(buildServiceBookingPayload({
    customer_id: '',
    offering_id: '7',
    scheduled_for: '2026-05-25T13:30',
    referral_source: '',
    notes: 'Urgent',
  }), {
    customer_id: null,
    offering_id: 7,
    scheduled_for: '2026-05-25T13:30',
    referral_source: null,
    notes: 'Urgent',
  });

  assert.deepEqual(buildServiceJobPayload({
    booking_id: '4',
    customer_id: '',
    offering_id: '7',
    staff_profile_id: '3',
    quoted_amount: '50000',
    invoice_amount: '',
    amount_paid: '10000',
    due_date: '',
    notes: 'Split billing',
  }), {
    booking_id: 4,
    customer_id: null,
    offering_id: 7,
    staff_profile_id: 3,
    quoted_amount: 50000,
    invoice_amount: null,
    amount_paid: 10000,
    due_date: null,
    notes: 'Split billing',
  });

  const recentJob = buildServiceRecentJobCard({
    id: 5,
    customer: { name: 'Bala Ventures' },
    offering: { name: 'Maintenance' },
    staff_profile: {},
    invoice_amount: 45000,
    amount_paid: 15000,
    status: 'open',
  }, formatCurrencyNGN);

  assert.deepEqual(recentJob, {
    id: 5,
    clientLabel: 'Bala Ventures',
    meta: 'Maintenance - No staff yet',
    invoiceLabel: `Invoice ${formatCurrencyNGN(45000)} | Paid ${formatCurrencyNGN(15000)}`,
    balanceLabel: `Outstanding ${formatCurrencyNGN(30000)}`,
    dueLabel: 'No due date set',
    notesLabel: 'No delivery notes yet.',
    statusLabel: 'open',
    canMarkComplete: true,
  });

  assert.deepEqual(buildServiceCompletionPayload({ amount_paid: 15000, notes: 'Done' }), {
    status: 'completed',
    amount_paid: 15000,
    notes: 'Done',
  });
});

test('service search and card helpers keep the desk readable', () => {
  const offerings = filterServiceOfferings(
    [
      { id: 1, name: 'AC Repair', category: 'Maintenance' },
      { id: 2, name: 'Business Advisory', category: 'Consulting' },
    ],
    'repair',
  );
  const bookings = filterServiceBookings(
    [
      { id: 3, customer: { name: 'Amina Holdings' }, offering: { name: 'AC Repair' }, notes: 'Urgent leak' },
      { id: 4, customer: { name: 'Musa Stores' }, offering: { name: 'Branding' } },
    ],
    'leak',
  );
  const jobs = filterServiceJobs(
    [
      { id: 5, customer: { name: 'Amina Holdings' }, offering: { name: 'AC Repair' }, staff_profile: { name: 'Hassan' }, status: 'open' },
      { id: 6, customer: { name: 'Musa Stores' }, offering: { name: 'Branding' }, status: 'completed' },
    ],
    'hassan',
  );

  assert.equal(offerings.length, 1);
  assert.equal(bookings.length, 1);
  assert.equal(jobs.length, 1);

  assert.deepEqual(buildServiceOfferingCard({ id: 2, name: 'Business Advisory', category: 'Consulting', duration_minutes: 90, base_price: 125000 }, formatCurrencyNGN), {
    id: 2,
    title: 'Business Advisory',
    categoryLabel: 'Consulting',
    durationLabel: '90 mins',
    priceLabel: formatCurrencyNGN(125000),
  });

  assert.deepEqual(buildServiceStaffCard({ id: 7, name: 'Maryam', specialty: 'Design', phone: '0801' }), {
    id: 7,
    title: 'Maryam',
    specialtyLabel: 'Design',
    phoneLabel: '0801',
  });

  assert.deepEqual(buildServiceBookingCard({
    id: 8,
    customer: { name: 'Amina Holdings' },
    offering: { name: 'AC Repair' },
    scheduled_for: '2026-05-25T13:30:00Z',
    referral_source: 'Referral',
    notes: 'Urgent leak',
    status: 'scheduled',
  }), {
    id: 8,
    title: 'Amina Holdings',
    serviceLabel: 'AC Repair',
    scheduleLabel: new Date('2026-05-25T13:30:00Z').toLocaleString(),
    referralLabel: 'Referral',
    notesLabel: 'Urgent leak',
    statusLabel: 'scheduled',
  });
});
