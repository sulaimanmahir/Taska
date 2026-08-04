import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildHealthBatchPayload,
  buildHealthAppointmentCard,
  buildHealthAppointmentPayload,
  buildHealthApprovalCard,
  buildHealthClinicalDeskMetrics,
  buildHealthConsultationCard,
  buildHealthConsultationDeskMetrics,
  buildHealthConsultationPayload,
  buildHealthControlledLogCard,
  buildHealthPharmacyDeskMetrics,
  buildHealthLabDeskMetrics,
  buildHealthPatientDeskMetrics,
  buildHealthDispensePayload,
  filterHealthAppointments,
  filterHealthBatches,
  filterHealthConsultations,
  filterHealthLabTests,
  filterHealthPatients,
  filterHealthPharmacyHistory,
  filterHealthLabRequests,
  buildHealthLabCatalogCard,
  buildHealthLabRequestPayload,
  buildHealthLabSampleCollectionPayload,
  buildHealthLabTestOptionLabel,
  buildHealthLabTestPayload,
  buildHealthLabWorkbenchCard,
  buildHealthNearExpiryCard,
  buildHealthOverviewMetrics,
  buildHealthPatientOverviewMetrics,
  buildHealthPatientPayload,
  buildHealthPatientRecordCard,
  buildHealthPharmacyOverviewMetrics,
  buildHealthPurchaseHistoryCard,
  buildHealthRejectedSpecimenCard,
  buildHealthResultDeskMetrics,
  buildHealthRefillReminderCard,
  buildHealthResultPayload,
  buildHealthSpecimenRejectionPayload,
  buildHealthSubstitutionCard,
  buildHealthSubstitutionPayload,
  createHealthAppointmentForm,
  createHealthBatchForm,
  createHealthConsultationForm,
  createHealthDispenseForm,
  createHealthLabRequestForm,
  createHealthLabTestForm,
  createHealthPatientForm,
  createHealthResultForm,
  createHealthSubstitutionForm,
  getHealthPendingApprovals,
  getHealthRejectedSpecimens,
} from '../src/lib/health.js';
import { formatCurrencyNGN, formatDateTimeLocal } from '../src/lib/financeFormatters.js';

test('health form factories return stable clinic and lab defaults', () => {
  const fixedDate = new Date('2026-05-26T08:15:00.000Z');

  assert.deepEqual(createHealthAppointmentForm(fixedDate), {
    patient_id: '',
    scheduled_for: '2026-05-26T09:15',
    reason: 'General consultation and fever review',
    referral_source: 'Walk-in',
  });
  assert.deepEqual(createHealthLabTestForm(), {
    name: 'Malaria Parasite Test',
    sample_type: 'Blood',
    reference_range: 'negative',
    price: '7500',
    turnaround_hours: '6',
  });
  assert.deepEqual(createHealthLabRequestForm(), {
    patient_id: '',
    consultation_id: '',
    test_id: '',
  });
  assert.deepEqual(createHealthResultForm({ is_abnormal: true }), {
    result_value: 'positive',
    rejection_reason: 'Insufficient specimen volume',
  });
  assert.deepEqual(createHealthPatientForm(), {
    full_name: 'Chinonso Obi',
    phone: '08035550000',
    email: 'chinonso.obi@example.com',
    date_of_birth: '1996-04-18',
    gender: 'Female',
    blood_group: 'O+',
    hmo_provider: 'Hygeia',
    insurance_number: 'HMO-001',
    guardian_name: 'Ngozi Obi',
    guardian_phone: '08036660000',
    medical_history: 'Asthma, seasonal allergies',
  });
  assert.deepEqual(createHealthConsultationForm(), {
    patient_id: '',
    doctor_notes: 'Patient complains of recurring fever and fatigue.',
    diagnosis: 'Malaria with mild dehydration',
    treatment_plan: 'Start ACTs, oral rehydration, and follow-up in 3 days.',
    follow_up_date: '',
    billing_amount: '18000',
    amount_paid: '10000',
    temperature: '38.2',
    blood_pressure: '120/80',
    pulse_rate: '88',
  });
  assert.deepEqual(createHealthBatchForm(), {
    product_id: '',
    batch_number: 'EMZ-001',
    expiry_date: '',
    quantity: '40',
    cost_per_unit: '400',
    near_expiry_discount_percent: '10',
    discounted_price: '800',
    supplier: 'Taska Pharma Supplier',
    manufacture_date: '',
  });
  assert.deepEqual(createHealthSubstitutionForm(), {
    product_id: '',
    substitute_product_id: '',
    reason: 'Use generic when brand is unavailable.',
    is_active: true,
  });
  assert.deepEqual(createHealthDispenseForm(), {
    customer_id: '',
    product_id: '',
    product_batch_id: '',
    substituted_from_product_id: '',
    quantity: '1',
    unit_price: '2500',
    prescription_reference: 'RX-2026-44',
    create_refill_reminder: true,
    notes: 'Controlled sale logged.',
  });
});

test('health overview and queue helpers keep clinic dashboard state aligned', () => {
  const metrics = buildHealthOverviewMetrics({
    appointments_today: 14,
    pending_approvals: 3,
    abnormal_results: 2,
    turnaround_hours: 7,
  });
  const requests = [
    { id: 1, status: 'review_pending' },
    { id: 2, status: 'rejected' },
    { id: 3, status: 'completed' },
    { id: 4, status: 'review_pending' },
  ];

  assert.deepEqual(metrics[0], {
    label: 'Appointments Today',
    value: 14,
    helper: 'Patient visits currently scheduled or already moving through the day queue.',
    tone: 'violet',
  });
  assert.equal(metrics[3].value, '7h');
  assert.deepEqual(
    buildHealthClinicalDeskMetrics(
      {
        appointments_today: 14,
        pending_approvals: 3,
        abnormal_results: 2,
        turnaround_hours: 7,
        upcoming_appointments: 9,
      },
      [{ id: 1, status: 'scheduled' }],
      [{ id: 1, sample_collected_at: '2026-05-26T09:00:00.000Z' }],
    ).slice(4),
    [
      {
        label: 'Upcoming Queue',
        value: 9,
        helper: 'Appointments still sitting in the active forward schedule and waiting to be processed.',
        tone: 'sky',
      },
      {
        label: 'Samples Collected',
        value: 1,
        helper: 'Lab requests that have already moved from intake into actual specimen collection.',
        tone: 'emerald',
      },
    ]
  );
  assert.deepEqual(getHealthPendingApprovals(requests).map((request) => request.id), [1, 4]);
  assert.deepEqual(getHealthRejectedSpecimens(requests).map((request) => request.id), [2]);
  assert.deepEqual(
    buildHealthLabDeskMetrics(
      {
        appointments_today: 14,
        pending_approvals: 3,
        abnormal_results: 2,
        turnaround_hours: 7,
      },
      [
        { id: 1, status: 'pending', sample_collected_at: '' },
        { id: 2, status: 'review_pending', sample_collected_at: '2026-05-26T09:00:00.000Z' },
        { id: 3, status: 'approved', sample_collected_at: '2026-05-26T10:00:00.000Z' },
      ],
      [
        { id: 1, price: 5000 },
        { id: 2, price: 0 },
      ],
    ).slice(4),
    [
      {
        label: 'Active Intake',
        value: 2,
        helper: 'Requests still moving through intake, collection, review, or rejection handling.',
        tone: 'sky',
      },
      {
        label: 'Catalogue Ready',
        value: 1,
        helper: 'Diagnostics already priced and ready for clean intake capture.',
        tone: 'emerald',
      },
      {
        label: 'Samples Collected',
        value: 2,
        helper: 'Requests that have already crossed from intake into actual specimen collection.',
        tone: 'violet',
      },
    ]
  );
  assert.deepEqual(
    buildHealthResultDeskMetrics(
      {
        appointments_today: 14,
        pending_approvals: 3,
        abnormal_results: 2,
        turnaround_hours: 7,
      },
      [
        { id: 1, status: 'review_pending' },
        { id: 2, status: 'approved' },
        { id: 3, status: 'rejected' },
      ],
    ).slice(4),
    [
      {
        label: 'Approved Results',
        value: 1,
        helper: 'Diagnostics already reviewed and released cleanly out of the approval queue.',
        tone: 'emerald',
      },
      {
        label: 'Review Queue',
        value: 1,
        helper: 'Results still waiting for sign-off before they can be considered released.',
        tone: 'amber',
      },
      {
        label: 'Rejected Specimens',
        value: 1,
        helper: 'Specimens that failed quality review and still need recollection or investigation.',
        tone: 'rose',
      },
    ],
  );

  assert.deepEqual(
    buildHealthPatientOverviewMetrics(
      {
        patients_count: 32,
        consultations_today: 7,
        unpaid_bills: 125000,
      },
      formatCurrencyNGN
    ),
    [
      {
        label: 'Patients',
        value: 32,
        helper: 'Registered patient identities currently available to the care team.',
        tone: 'violet',
      },
      {
        label: 'Consultations Today',
        value: 7,
        helper: 'Clinical reviews already recorded in the active day\'s workflow.',
        tone: 'sky',
      },
      {
        label: 'Unpaid Bills',
        value: formatCurrencyNGN(125000),
        helper: 'Outstanding clinical billing still waiting to be recovered.',
        tone: 'amber',
      },
    ]
  );
  assert.deepEqual(
    buildHealthPatientDeskMetrics(
      {
        patients_count: 32,
        consultations_today: 7,
        unpaid_bills: 125000,
      },
      [
        { id: 1, full_name: 'Chinonso Obi', hmo_provider: 'Hygeia', created_at: '2026-05-25T10:00:00.000000Z' },
        { id: 2, full_name: 'Amina Yusuf', hmo_provider: '', created_at: '2026-05-20T10:00:00.000000Z' },
      ],
      [
        { id: 1, follow_up_date: '2026-05-30' },
        { id: 2, follow_up_date: '' },
      ],
      formatCurrencyNGN
    ).slice(3),
    [
      {
        label: 'HMO Profiles',
        value: 1,
        helper: 'Patients currently carrying an insurance or HMO relationship on file.',
        tone: 'emerald',
      },
      {
        label: 'Follow-up Queue',
        value: 1,
        helper: 'Latest patient on file: Chinonso Obi.',
        tone: 'rose',
      },
    ]
  );
  assert.deepEqual(
    buildHealthConsultationDeskMetrics(
      {
        patients_count: 32,
        consultations_today: 7,
        unpaid_bills: 125000,
      },
      [{ id: 1 }, { id: 2 }, { id: 3 }],
      [
        { id: 1, patient: { id: 11 }, follow_up_date: '2026-05-30', billing_amount: 20000, amount_paid: 10000 },
        { id: 2, patient: { id: 12 }, follow_up_date: '', billing_amount: 10000, amount_paid: 10000 },
      ],
      formatCurrencyNGN,
    ).slice(3),
    [
      {
        label: 'Follow-up Queue',
        value: 1,
        helper: 'Consultations already carrying a next-step review date that still needs active follow-through.',
        tone: 'rose',
      },
      {
        label: 'Unpaid Cases',
        value: 1,
        helper: 'Clinical reviews with billing still open and recovery not yet complete.',
        tone: 'amber',
      },
      {
        label: 'Patients Seen',
        value: 2,
        helper: '2 of 3 patients already have consultation history on file.',
        tone: 'sky',
      },
    ],
  );
  assert.deepEqual(buildHealthPharmacyOverviewMetrics({
    near_expiry_batches: 5,
    discounted_batches: 3,
    controlled_logs: 11,
    refill_pending: 4,
  }), [
    {
      label: 'Near Expiry',
      value: 5,
      helper: 'Batches approaching expiry that need pricing or movement attention.',
      tone: 'amber',
    },
    {
      label: 'Discounted Batches',
      value: 3,
      helper: 'Medicines already discounted to protect cash recovery before expiry.',
      tone: 'sky',
    },
    {
      label: 'Controlled Logs',
      value: 11,
      helper: 'Tracked controlled-dispense records currently available for review.',
      tone: 'rose',
    },
    {
      label: 'Refill Pending',
      value: 4,
      helper: 'Patients with refill demand that still needs a follow-through action.',
      tone: 'emerald',
    },
  ]);
  assert.deepEqual(
    buildHealthPharmacyDeskMetrics(
      {
        near_expiry_batches: 5,
        discounted_batches: 3,
        controlled_logs: 11,
        refill_pending: 4,
        expired_units: 9,
      },
      [
        { id: 1, remaining_quantity: 4 },
        { id: 2, remaining_quantity: 0 },
        { id: 3, quantity: 5 },
      ],
      [{ id: 1 }, { id: 2 }],
      [
        { id: 1, customer: { id: 11 } },
        { id: 2, customer_id: 12 },
        { id: 3, customer: { id: 11 } },
      ],
    ).slice(4),
    [
      {
        label: 'Active Batches',
        value: 2,
        helper: 'Medicine batches still carrying live stock and requiring expiry-aware supervision.',
        tone: 'violet',
      },
      {
        label: 'Expired Units',
        value: 9,
        helper: 'Units already beyond expiry and now needing quarantine, write-off, or disposal review.',
        tone: 'rose',
      },
      {
        label: 'Controlled Patients',
        value: 2,
        helper: '2 refill reminders are still waiting for pharmacy follow-through.',
        tone: 'amber',
      },
    ],
  );
});

test('health payload helpers normalize appointment, diagnostics, and specimen actions consistently', () => {
  assert.deepEqual(buildHealthPatientPayload({
    full_name: ' Ada Okafor ',
    phone: ' 08030001111 ',
    email: ' ada@example.com ',
    date_of_birth: '1998-04-10',
    gender: ' Female ',
    blood_group: ' A+ ',
    hmo_provider: ' AXA ',
    insurance_number: ' HMO-200 ',
    guardian_name: ' Chika Okafor ',
    guardian_phone: ' 08031112222 ',
    medical_history: ' Peanut allergy ',
  }), {
    full_name: 'Ada Okafor',
    phone: '08030001111',
    email: 'ada@example.com',
    date_of_birth: '1998-04-10',
    gender: 'Female',
    blood_group: 'A+',
    medical_history: 'Peanut allergy',
    hmo_provider: 'AXA',
    insurance_number: 'HMO-200',
    guardian_name: 'Chika Okafor',
    guardian_phone: '08031112222',
  });

  assert.deepEqual(buildHealthConsultationPayload({
    patient_id: '6',
    doctor_notes: 'Recurring fever',
    diagnosis: 'Malaria',
    treatment_plan: 'Start ACT',
    follow_up_date: '2026-05-29',
    billing_amount: '18000',
    amount_paid: '9000',
    temperature: '38.4',
    blood_pressure: '118/78',
    pulse_rate: '92',
  }), {
    patient_id: 6,
    doctor_notes: 'Recurring fever',
    diagnosis: 'Malaria',
    treatment_plan: 'Start ACT',
    follow_up_date: '2026-05-29',
    billing_amount: 18000,
    amount_paid: 9000,
    triage_vitals: {
      temperature: '38.4',
      blood_pressure: '118/78',
      pulse_rate: '92',
    },
  });
  assert.deepEqual(buildHealthBatchPayload({
    product_id: '4',
    batch_number: 'PH-004',
    expiry_date: '2026-10-01',
    quantity: '25',
    cost_per_unit: '420',
    near_expiry_discount_percent: '8',
    discounted_price: '760',
    supplier: 'Taska Pharma Supplier',
    manufacture_date: '2026-01-01',
  }), {
    product_id: 4,
    batch_number: 'PH-004',
    expiry_date: '2026-10-01',
    quantity: 25,
    cost_per_unit: 420,
    near_expiry_discount_percent: 8,
    discounted_price: 760,
    supplier: 'Taska Pharma Supplier',
    manufacture_date: '2026-01-01',
  });
  assert.deepEqual(buildHealthSubstitutionPayload({
    product_id: '8',
    substitute_product_id: '3',
    reason: 'Generic fallback',
    is_active: false,
  }), {
    product_id: 8,
    substitute_product_id: 3,
    reason: 'Generic fallback',
    is_active: false,
  });
  assert.deepEqual(buildHealthDispensePayload({
    customer_id: '2',
    product_id: '9',
    product_batch_id: '12',
    substituted_from_product_id: '',
    quantity: '2',
    unit_price: '2500',
    prescription_reference: 'RX-100',
    create_refill_reminder: true,
    notes: 'Controlled sale logged.',
  }), {
    customer_id: 2,
    product_id: 9,
    product_batch_id: 12,
    substituted_from_product_id: null,
    quantity: 2,
    unit_price: 2500,
    prescription_reference: 'RX-100',
    create_refill_reminder: true,
    notes: 'Controlled sale logged.',
  });

  assert.deepEqual(buildHealthAppointmentPayload({
    patient_id: '6',
    scheduled_for: '2026-05-26T09:15',
    reason: 'Review',
    referral_source: 'Walk-in',
  }), {
    patient_id: 6,
    scheduled_for: '2026-05-26T09:15',
    reason: 'Review',
    referral_source: 'Walk-in',
  });

  assert.deepEqual(buildHealthLabTestPayload({
    name: 'FBC',
    sample_type: 'Blood',
    reference_range: 'normal',
    price: '12000',
    turnaround_hours: '4',
  }), {
    name: 'FBC',
    sample_type: 'Blood',
    reference_range: 'normal',
    price: 12000,
    turnaround_hours: 4,
  });

  assert.deepEqual(buildHealthLabRequestPayload({
    patient_id: '2',
    consultation_id: '',
    test_id: '9',
  }), {
    patient_id: 2,
    consultation_id: null,
    test_id: 9,
  });

  assert.deepEqual(buildHealthLabSampleCollectionPayload(), {});
  assert.deepEqual(buildHealthResultPayload({ result_value: 'High reactive' }), {
    result_value: 'High reactive',
    is_abnormal: true,
  });
  assert.deepEqual(buildHealthSpecimenRejectionPayload({ rejection_reason: '' }), {
    rejection_reason: 'Insufficient specimen volume',
  });
});

test('health presenter helpers keep appointment and lab workbench cards readable', () => {
  assert.equal(
    buildHealthLabTestOptionLabel({ name: 'Typhoid', price: 5000 }, formatCurrencyNGN),
    `Typhoid - ${formatCurrencyNGN(5000)}`
  );

  const appointmentCard = buildHealthAppointmentCard({
    id: 7,
    patient: { full_name: 'Chinonso Obi', patient_code: 'PT-007' },
    reason: '',
    scheduled_for: '2026-05-26T09:15:00.000Z',
    referral_source: '',
    status: 'scheduled',
    consultation: { receipt_number: 'RCPT-7' },
  });
  assert.equal(appointmentCard.title, 'Chinonso Obi');
  assert.equal(appointmentCard.patientCodeLabel, 'PT-007');
  assert.equal(appointmentCard.reason, 'General review');
  assert.match(appointmentCard.meta, /Walk-in$/);
  assert.equal(appointmentCard.consultationLabel, 'RCPT-7');

  assert.deepEqual(buildHealthLabWorkbenchCard({
    id: 8,
    patient: { full_name: 'Amina Yusuf', patient_code: 'PT-008' },
    test: { name: 'Malaria', sample_type: 'Blood', reference_range: 'negative', turnaround_hours: 6 },
    sample_barcode: 'LAB-008',
    status: 'review_pending',
    is_abnormal: true,
    consultation: { diagnosis: 'Fever workup' },
    result_value: 'positive',
    sample_collected_at: '2026-05-26T08:00:00.000Z',
    technician: { name: 'Maryam Aliyu' },
  }), {
    id: 8,
    title: 'Amina Yusuf',
    patientCodeLabel: 'PT-008',
    testLabel: 'Malaria - Blood',
    barcodeLabel: 'Barcode: LAB-008',
    referenceLabel: 'Reference: negative',
    turnaroundLabel: '6h target turnaround',
    consultationLabel: 'Fever workup',
    resultLabel: 'positive',
    sampleCollectionLabel: 'Sample collected',
    technicianLabel: 'Maryam Aliyu',
    status: 'review_pending',
    statusTone: 'amber',
    abnormalLabel: 'Abnormal flagged',
  });

  assert.deepEqual(buildHealthApprovalCard({
    id: 9,
    patient: { full_name: 'Bala Musa' },
    test: { name: 'FBC' },
    result_value: '',
  }), {
    id: 9,
    title: 'Bala Musa',
    testLabel: 'FBC',
    resultLabel: 'Result: Awaiting entry',
  });

  assert.deepEqual(buildHealthRejectedSpecimenCard({
    id: 10,
    patient: { full_name: 'Ngozi' },
    test: { name: 'U&E' },
    rejection_reason: '',
  }), {
    id: 10,
    title: 'Ngozi',
    testLabel: 'U&E',
    rejectionLabel: 'No rejection reason captured.',
  });

  assert.deepEqual(buildHealthPatientRecordCard({
    id: 11,
    full_name: 'Musa Bello',
    patient_code: 'PT-011',
    phone: '08034445555',
    email: 'musa@example.com',
    gender: 'Male',
    blood_group: 'O+',
    date_of_birth: '1990-01-12',
    hmo_provider: '',
    medical_history: '',
    guardian_name: 'Aisha Bello',
    guardian_phone: '08039998888',
    appointments: [{ id: 7 }],
    consultations: [{ id: 1 }, { id: 2 }],
    lab_requests: [{ id: 1 }],
  }), {
    id: 11,
    title: 'Musa Bello',
    identityLabel: 'PT-011 | Self-pay',
    contactLabel: '08034445555 | musa@example.com',
    demographicLabel: 'Male | O+ | 1990-01-12',
    historyLabel: 'No major medical history captured yet.',
    guardianLabel: 'Aisha Bello - 08039998888',
    appointmentsLabel: '1 appointments',
    consultationsLabel: '2 consultations',
    labRequestsLabel: '1 lab requests',
  });

  assert.deepEqual(buildHealthConsultationCard({
    id: 12,
    patient: { full_name: 'Fatima Aliyu', patient_code: 'PT-012' },
    diagnosis: '',
    treatment_plan: '',
    doctor_notes: '',
    receipt_number: 'RCPT-12',
    triage_vitals: {
      temperature: '38.4',
      blood_pressure: '118/78',
      pulse_rate: '92',
    },
    lab_requests_count: 2,
    follow_up_date: '2026-05-30',
    billing_amount: 15000,
    amount_paid: 5000,
  }, formatCurrencyNGN), {
    id: 12,
    title: 'Fatima Aliyu',
    patientCodeLabel: 'PT-012',
    receiptLabel: 'RCPT-12',
    diagnosisLabel: 'Diagnosis pending',
    treatmentLabel: 'Treatment plan not yet set',
    billingLabel: `${formatCurrencyNGN(15000)} billed | ${formatCurrencyNGN(5000)} paid`,
    followUpLabel: '2026-05-30',
    outstandingLabel: `${formatCurrencyNGN(10000)} outstanding`,
    vitalsLabel: 'Temp 38.4 | BP 118/78 | Pulse 92',
    notesLabel: 'No doctor note recorded',
    labRequestsLabel: '2 linked lab requests',
  });
  assert.deepEqual(buildHealthNearExpiryCard({
    id: 13,
    product: { name: 'Artemether' },
    batch_number: 'EMZ-013',
    remaining_quantity: 6,
    expiry_date: '2026-06-10',
    near_expiry_discount_percent: 10,
    discounted_price: 800,
  }, formatCurrencyNGN), {
    id: 13,
    title: 'Artemether',
    batchLabel: 'Batch EMZ-013 - 6 units left',
    expiryLabel: 'Expiry: 2026-06-10',
    discountLabel: `Discount: 10% at ${formatCurrencyNGN(800)}`,
  });
  assert.deepEqual(buildHealthSubstitutionCard({
    id: 14,
    product: { name: 'Amatem' },
    substitute: { name: 'Coartem' },
    reason: '',
    is_active: false,
  }), {
    id: 14,
    title: 'Amatem',
    substituteLabel: 'Substitute: Coartem',
    reasonLabel: 'No reason provided',
    statusLabel: 'Inactive rule',
  });
  assert.deepEqual(buildHealthControlledLogCard({
    id: 15,
    product: { name: 'Tramadol' },
    customer: { name: 'Ibrahim Ali' },
    quantity: 3,
    prescription_reference: '',
    batch: { batch_number: 'TRM-15' },
    created_at: '2026-05-26T08:00:00.000Z',
  }), {
    id: 15,
    title: 'Tramadol',
    quantityLabel: 'Ibrahim Ali - 3 units',
    prescriptionLabel: 'No prescription reference',
    batchLabel: 'Batch TRM-15',
    dateLabel: formatDateTimeLocal('2026-05-26T08:00:00.000Z'),
  });
  assert.deepEqual(buildHealthRefillReminderCard({
    id: 16,
    customer: { name: 'Amina Lawal' },
    product: { name: 'Metformin' },
    due_on: '2026-06-01',
    status: 'pending',
  }), {
    id: 16,
    title: 'Amina Lawal',
    productLabel: 'Metformin',
    dueLabel: 'Due 2026-06-01',
    statusLabel: 'pending',
  });
  assert.deepEqual(buildHealthPurchaseHistoryCard({
    id: 17,
    customer: null,
    product: { name: 'Paracetamol' },
    total_amount: 4500,
    substituted_from: { name: 'Panadol' },
    batch: { batch_number: 'PARA-17' },
    quantity: 2,
    dispensed_at: '2026-05-26T09:30:00.000Z',
  }, formatCurrencyNGN), {
    id: 17,
    title: 'Walk-in',
    amountLabel: `Paracetamol - ${formatCurrencyNGN(4500)}`,
    contextLabel: 'Substituted from Panadol',
    batchLabel: 'Batch PARA-17',
    quantityLabel: '2 units dispensed',
    dateLabel: formatDateTimeLocal('2026-05-26T09:30:00.000Z'),
  });

  assert.deepEqual(buildHealthLabCatalogCard({
    id: 19,
    name: 'Typhoid Test',
    sample_type: 'Blood',
    price: 7000,
    turnaround_hours: 5,
    reference_range: 'negative',
  }, formatCurrencyNGN), {
    id: 19,
    title: 'Typhoid Test',
    sampleTypeLabel: 'Blood',
    priceLabel: formatCurrencyNGN(7000),
    turnaroundLabel: '5h turnaround',
    referenceLabel: 'negative',
  });

  const patients = [
    { id: 1, full_name: 'Chinonso Obi', patient_code: 'PT-001', phone: '0803', email: 'chi@example.com', hmo_provider: 'Hygeia', guardian_name: 'Ngozi', gender: 'Female', blood_group: 'O+' },
    { id: 2, full_name: 'Amina Yusuf', patient_code: 'PT-002', phone: '0904', email: 'amina@example.com', hmo_provider: '', guardian_name: 'Musa', gender: 'Female', blood_group: 'A+' },
  ];

  assert.deepEqual(filterHealthPatients(patients, 'hygeia').map((patient) => patient.id), [1]);
  assert.deepEqual(filterHealthPatients(patients, '0904').map((patient) => patient.id), [2]);
  assert.deepEqual(filterHealthPatients(patients, 'PT-001').map((patient) => patient.id), [1]);

  const appointments = [
    { id: 1, patient: { full_name: 'Chinonso Obi', patient_code: 'PT-001' }, reason: 'Fever', referral_source: 'Walk-in', status: 'scheduled' },
    { id: 2, patient: { full_name: 'Amina Yusuf', patient_code: 'PT-002' }, reason: 'Review', referral_source: 'Referral', status: 'checked_in' },
  ];
  assert.deepEqual(filterHealthAppointments(appointments, 'referral').map((appointment) => appointment.id), [2]);
  assert.deepEqual(filterHealthAppointments(appointments, 'PT-001').map((appointment) => appointment.id), [1]);

  const consultations = [
    {
      id: 1,
      patient: { full_name: 'Chinonso Obi', patient_code: 'PT-001' },
      diagnosis: 'Malaria',
      treatment_plan: 'ACTs',
      doctor_notes: 'Recurring fever',
      receipt_number: 'RCPT-001',
      follow_up_date: '2026-05-29',
      appointment: { appointment_code: 'APT-001' },
    },
    {
      id: 2,
      patient: { full_name: 'Amina Yusuf', patient_code: 'PT-002' },
      diagnosis: 'Typhoid',
      treatment_plan: 'Antibiotics',
      doctor_notes: 'Abdominal pain',
      receipt_number: 'RCPT-002',
      follow_up_date: '',
      appointment: { appointment_code: 'APT-002' },
    },
  ];
  assert.deepEqual(filterHealthConsultations(consultations, 'RCPT-002').map((consultation) => consultation.id), [2]);
  assert.deepEqual(filterHealthConsultations(consultations, 'malaria').map((consultation) => consultation.id), [1]);

  const labRequests = [
    { id: 1, patient: { full_name: 'Chinonso Obi', patient_code: 'PT-001' }, test: { name: 'Malaria', sample_type: 'Blood' }, status: 'review_pending', sample_barcode: 'LAB-001', consultation: { diagnosis: 'Fever' } },
    { id: 2, patient: { full_name: 'Amina Yusuf', patient_code: 'PT-002' }, test: { name: 'FBC', sample_type: 'Blood' }, status: 'completed', sample_barcode: 'LAB-002', consultation: { diagnosis: 'Anemia' } },
  ];
  assert.deepEqual(filterHealthLabRequests(labRequests, 'LAB-002').map((request) => request.id), [2]);
  assert.deepEqual(filterHealthLabRequests(labRequests, 'anemia').map((request) => request.id), [2]);
  assert.deepEqual(filterHealthLabTests([
    { id: 1, name: 'Malaria', sample_type: 'Blood', reference_range: 'negative', turnaround_hours: 6, price: 5000 },
    { id: 2, name: 'Urinalysis', sample_type: 'Urine', reference_range: 'normal', turnaround_hours: 3, price: 3500 },
  ], 'urine').map((test) => test.id), [2]);
  assert.deepEqual(filterHealthBatches([
    { id: 1, product: { name: 'Amatem', sku: 'AMT-1' }, batch_number: 'B-01', supplier: 'Taska Pharma', expiry_date: '2026-07-01' },
    { id: 2, product: { name: 'Metformin', sku: 'MET-2' }, batch_number: 'B-02', supplier: 'Lifeline', expiry_date: '2026-09-01' },
  ], 'taska').map((batch) => batch.id), [1]);
  assert.deepEqual(filterHealthPharmacyHistory([
    { id: 1, customer: { name: 'Amina' }, product: { name: 'Metformin' }, batch: { batch_number: 'MET-1' }, prescription_reference: 'RX-11', status: 'pending' },
    { id: 2, customer: { name: 'Bala' }, product: { name: 'Paracetamol' }, batch: { batch_number: 'PAR-2' }, prescription_reference: 'RX-12', status: 'done' },
  ], 'PAR-2').map((entry) => entry.id), [2]);
});
