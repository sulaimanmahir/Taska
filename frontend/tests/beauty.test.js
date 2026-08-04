import test from 'node:test';
import assert from 'node:assert/strict';

import {
  beautySectionTitles,
  buildBeautyAppointmentCard,
  buildBeautyAppointmentFloorCard,
  buildBeautyAppointmentPayload,
  buildBeautyCompletionPayload,
  buildBeautyDeskMetrics,
  buildBeautyOverviewMetrics,
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
  getBeautyDefaultAppointmentAt,
  getBeautyPendingAppointments,
} from '../src/lib/beauty.js';
import { formatCurrencyNGN } from '../src/lib/financeFormatters.js';

test('beauty section and form helpers return stable defaults', () => {
  const fixedDate = new Date('2026-05-25T12:30:45.000Z');

  assert.equal(getBeautyDefaultAppointmentAt(fixedDate), '2026-05-25T13:30');
  assert.equal(getBeautyActiveSection('/appointments'), 'Appointments');
  assert.equal(getBeautyActiveSection('/unknown'), 'Dashboard');
  assert.equal(beautySectionTitles['/products'], 'Service Catalogue');
  assert.deepEqual(createBeautyServiceForm(), {
    name: '',
    category: 'Hair',
    duration_minutes: '60',
    price: '',
    commission_rate: '20',
  });
  assert.deepEqual(createBeautyStaffForm(), { name: '', specialty: '', phone: '' });
  assert.deepEqual(createBeautyAppointmentForm(fixedDate), {
    customer_id: '',
    service_id: '',
    staff_profile_id: '',
    appointment_at: '2026-05-25T13:30',
    notes: '',
  });
});

test('beauty overview and owner focus helpers keep salon metrics aligned', () => {
  const metrics = buildBeautyOverviewMetrics({
    appointments_today: 8,
    completed_today: 5,
    revenue_today: 125000,
    commissions_due: 28000,
  }, formatCurrencyNGN, false);
  const ownerFocus = buildBeautyOwnerFocusMetrics({
    pending_queue: 3,
    product_cost_today: 12000,
    repeat_clients: 7,
  }, formatCurrencyNGN);

  assert.deepEqual(metrics[0], {
    label: 'Appointments Today',
    value: 8,
    helper: 'Bookings already moving through the salon chair schedule.',
    tone: 'sky',
  });
  assert.equal(metrics[2].value, formatCurrencyNGN(125000));
  assert.equal(buildBeautyOverviewMetrics({}, formatCurrencyNGN, true)[1].value, '...');
  assert.deepEqual(ownerFocus[1], {
    label: 'Product Cost Today',
    value: formatCurrencyNGN(12000),
    helper: 'Consumable usage cost already absorbed by today\'s service flow.',
    tone: 'rose',
  });

  const deskMetrics = buildBeautyDeskMetrics(
    { appointments_today: 8, completed_today: 5, revenue_today: 125000, commissions_due: 28000 },
    [{ id: 1, status: 'scheduled', customer: { id: 2 } }, { id: 2, status: 'in_service' }],
    [{ id: 1 }, { id: 2 }],
    [{ id: 1 }],
    false,
    formatCurrencyNGN,
  );

  assert.equal(deskMetrics[4].value, 2);
  assert.equal(deskMetrics[5].value, 2);
  assert.equal(deskMetrics[6].value, 2);
  assert.equal(deskMetrics[7].value, 1);
});

test('beauty queue and staff helpers keep salon watch cards readable', () => {
  const pending = getBeautyPendingAppointments([
    { id: 1, status: 'scheduled', customer: { name: 'Amina' }, service: { name: 'Braids' }, staff_profile: { name: 'Ngozi' } },
    { id: 2, status: 'completed' },
    { id: 3, status: 'in_service', customer: null, service: { name: 'Wash' }, staff_profile: null },
  ]);

  assert.equal(pending.length, 2);
  assert.deepEqual(buildBeautyQueueCard(pending[0]), {
    id: 1,
    clientLabel: 'Amina',
    meta: 'Braids with Ngozi',
    statusLabel: 'scheduled',
  });
  assert.deepEqual(buildBeautyStaffCard({ id: 4, name: 'Ngozi', specialty: '', commission_wallet: 8500 }, formatCurrencyNGN), {
    id: 4,
    title: 'Ngozi',
    meta: `General stylist - Wallet ${formatCurrencyNGN(8500)}`,
    phoneLabel: 'No phone on file',
  });
});

test('beauty payload and floor helpers normalize salon workflows consistently', () => {
  assert.deepEqual(buildBeautyServicePayload({
    name: 'Braids',
    category: 'Hair',
    duration_minutes: '120',
    price: '25000',
    commission_rate: '30',
  }), {
    name: 'Braids',
    category: 'Hair',
    duration_minutes: 120,
    price: 25000,
    commission_rate: 30,
  });

  assert.deepEqual(buildBeautyAppointmentPayload({
    customer_id: '',
    service_id: '5',
    staff_profile_id: '2',
    appointment_at: '2026-05-25T13:30',
    notes: '',
  }), {
    customer_id: null,
    service_id: 5,
    staff_profile_id: 2,
    appointment_at: '2026-05-25T13:30',
    notes: null,
  });

  assert.deepEqual(createBeautyCompletionForm(
    { service: { price: 18000, commission_rate: 25 } },
    [{ id: 9, cost_price: 1200 }],
  ), {
    service_price: 18000,
    commission_rate: 25,
    product_id: 9,
    quantity: '1',
    unit_cost: 1200,
  });

  assert.deepEqual(buildBeautyCompletionPayload({
    service_price: '18000',
    commission_rate: '25',
    product_id: '9',
    quantity: '2',
    unit_cost: '1200',
  }), {
    service_price: 18000,
    commission_rate: 25,
    product_usages: [{ product_id: 9, quantity: 2, unit_cost: 1200 }],
  });

  const floorCard = buildBeautyAppointmentFloorCard({
    id: 6,
    customer: { name: 'Bisi' },
    service: { name: 'Pedicure' },
    staff_profile: {},
    appointment_at: '2026-05-25T13:30:00.000Z',
    status: 'completed',
    service_price: 14000,
    commission_amount: 2800,
    product_cost: 1500,
  }, formatCurrencyNGN);

  assert.equal(floorCard.clientLabel, 'Bisi');
  assert.equal(floorCard.meta, 'Pedicure with Unassigned stylist');
  assert.equal(floorCard.statusLabel, 'completed');
  assert.equal(floorCard.isCompleted, true);
  assert.equal(
    floorCard.completedSummary,
    `Completed: revenue ${formatCurrencyNGN(14000)} | commission ${formatCurrencyNGN(2800)} | products ${formatCurrencyNGN(1500)}`
  );

  assert.deepEqual(buildBeautyServiceCard({
    id: 4,
    name: 'Pedicure',
    category: 'Spa',
    duration_minutes: 45,
    price: 14000,
    commission_rate: 20,
  }, formatCurrencyNGN), {
    id: 4,
    title: 'Pedicure',
    categoryLabel: 'Spa',
    durationLabel: '45 mins',
    priceLabel: formatCurrencyNGN(14000),
    commissionLabel: '20% commission',
  });

  assert.deepEqual(buildBeautyAppointmentCard({
    id: 7,
    customer: { name: 'Bisi' },
    service: { name: 'Pedicure', price: 14000 },
    staff_profile: { name: 'Ngozi' },
    appointment_at: '2026-05-25T13:30:00.000Z',
    status: 'in_service',
    notes: 'Handle cuticles carefully',
  }, formatCurrencyNGN), {
    id: 7,
    clientLabel: 'Bisi',
    serviceLabel: 'Pedicure',
    staffLabel: 'Ngozi',
    bookedAtLabel: new Date('2026-05-25T13:30:00.000Z').toLocaleString('en-NG'),
    statusLabel: 'in service',
    revenueLabel: formatCurrencyNGN(14000),
    notesLabel: 'Handle cuticles carefully',
  });

  assert.deepEqual(filterBeautyServices([
    { id: 1, name: 'Pedicure', category: 'Spa' },
    { id: 2, name: 'Braids', category: 'Hair' },
  ], 'spa').map((item) => item.id), [1]);

  assert.deepEqual(filterBeautyAppointments([
    { id: 1, customer: { name: 'Bisi' }, service: { name: 'Pedicure' }, status: 'scheduled' },
    { id: 2, customer: { name: 'Amina' }, service: { name: 'Braids' }, staff_profile: { name: 'Ngozi' } },
  ], 'ngozi').map((item) => item.id), [2]);
});
