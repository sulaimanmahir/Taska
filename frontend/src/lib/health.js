import { formatCurrencyNGN, formatDateTimeLocal } from './financeFormatters.js';

export function createHealthAppointmentForm(date = new Date()) {
  return {
    patient_id: '',
    scheduled_for: new Date(date.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16),
    reason: 'General consultation and fever review',
    referral_source: 'Walk-in',
  };
}

export function createHealthLabTestForm() {
  return {
    name: 'Malaria Parasite Test',
    sample_type: 'Blood',
    reference_range: 'negative',
    price: '7500',
    turnaround_hours: '6',
  };
}

export function createHealthLabRequestForm() {
  return {
    patient_id: '',
    consultation_id: '',
    test_id: '',
  };
}

export function createHealthResultForm(request = {}) {
  return {
    result_value: request.is_abnormal ? 'positive' : '',
    rejection_reason: 'Insufficient specimen volume',
  };
}

export function createHealthPatientForm() {
  return {
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
  };
}

export function createHealthConsultationForm() {
  return {
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
  };
}

export function createHealthBatchForm() {
  return {
    product_id: '',
    batch_number: 'EMZ-001',
    expiry_date: '',
    quantity: '40',
    cost_per_unit: '400',
    near_expiry_discount_percent: '10',
    discounted_price: '800',
    supplier: 'Taska Pharma Supplier',
    manufacture_date: '',
  };
}

export function createHealthSubstitutionForm() {
  return {
    product_id: '',
    substitute_product_id: '',
    reason: 'Use generic when brand is unavailable.',
    is_active: true,
  };
}

export function createHealthDispenseForm() {
  return {
    customer_id: '',
    product_id: '',
    product_batch_id: '',
    substituted_from_product_id: '',
    quantity: '1',
    unit_price: '2500',
    prescription_reference: 'RX-2026-44',
    create_refill_reminder: true,
    notes: 'Controlled sale logged.',
  };
}

export function buildHealthOverviewMetrics(summary = {}) {
  return [
    {
      label: 'Appointments Today',
      value: summary.appointments_today ?? 0,
      helper: 'Patient visits currently scheduled or already moving through the day queue.',
      tone: 'violet',
    },
    {
      label: 'Pending Lab Approval',
      value: summary.pending_approvals ?? 0,
      helper: 'Results still waiting for clinician or lab-lead review before release.',
      tone: 'amber',
    },
    {
      label: 'Abnormal Results',
      value: summary.abnormal_results ?? 0,
      helper: 'Flagged findings that may need faster follow-up and owner awareness.',
      tone: 'rose',
    },
    {
      label: 'Turnaround',
      value: `${summary.turnaround_hours ?? 0}h`,
      helper: 'Observed diagnostics turnaround used to track service responsiveness.',
      tone: 'sky',
    },
  ];
}

export function buildHealthClinicalDeskMetrics(summary = {}, appointments = [], labRequests = []) {
  const scheduledAppointments = appointments.filter((appointment) => appointment.status === 'scheduled');
  const collectedSamples = labRequests.filter((request) => Boolean(request.sample_collected_at));

  return [
    ...buildHealthOverviewMetrics(summary),
    {
      label: 'Upcoming Queue',
      value: summary.upcoming_appointments ?? scheduledAppointments.length,
      helper: 'Appointments still sitting in the active forward schedule and waiting to be processed.',
      tone: 'sky',
    },
    {
      label: 'Samples Collected',
      value: collectedSamples.length,
      helper: 'Lab requests that have already moved from intake into actual specimen collection.',
      tone: 'emerald',
    },
  ];
}

export function buildHealthLabDeskMetrics(summary = {}, labRequests = [], labTests = []) {
  const queuedRequests = labRequests.filter((request) => request.status !== 'approved');
  const collectedSamples = labRequests.filter((request) => Boolean(request.sample_collected_at));
  const catalogWithPricing = labTests.filter((test) => Number(test.price || 0) > 0);

  return [
    ...buildHealthOverviewMetrics(summary),
    {
      label: 'Active Intake',
      value: queuedRequests.length,
      helper: 'Requests still moving through intake, collection, review, or rejection handling.',
      tone: queuedRequests.length > 0 ? 'sky' : 'emerald',
    },
    {
      label: 'Catalogue Ready',
      value: catalogWithPricing.length,
      helper: 'Diagnostics already priced and ready for clean intake capture.',
      tone: 'emerald',
    },
    {
      label: 'Samples Collected',
      value: collectedSamples.length,
      helper: 'Requests that have already crossed from intake into actual specimen collection.',
      tone: 'violet',
    },
  ];
}

export function buildHealthResultDeskMetrics(summary = {}, labRequests = []) {
  const pendingApprovals = labRequests.filter((request) => request.status === 'review_pending').length;
  const rejectedSpecimens = labRequests.filter((request) => request.status === 'rejected').length;
  const approvedResults = labRequests.filter((request) => request.status === 'approved').length;

  return [
    ...buildHealthOverviewMetrics(summary),
    {
      label: 'Approved Results',
      value: approvedResults,
      helper: 'Diagnostics already reviewed and released cleanly out of the approval queue.',
      tone: 'emerald',
    },
    {
      label: 'Review Queue',
      value: pendingApprovals,
      helper: 'Results still waiting for sign-off before they can be considered released.',
      tone: pendingApprovals > 0 ? 'amber' : 'emerald',
    },
    {
      label: 'Rejected Specimens',
      value: rejectedSpecimens,
      helper: 'Specimens that failed quality review and still need recollection or investigation.',
      tone: rejectedSpecimens > 0 ? 'rose' : 'sky',
    },
  ];
}

export function buildHealthPatientOverviewMetrics(summary = {}, formatCurrency = formatCurrencyNGN) {
  return [
    {
      label: 'Patients',
      value: summary.patients_count ?? 0,
      helper: 'Registered patient identities currently available to the care team.',
      tone: 'violet',
    },
    {
      label: 'Consultations Today',
      value: summary.consultations_today ?? 0,
      helper: 'Clinical reviews already recorded in the active day\'s workflow.',
      tone: 'sky',
    },
    {
      label: 'Unpaid Bills',
      value: formatCurrency(summary.unpaid_bills ?? 0),
      helper: 'Outstanding clinical billing still waiting to be recovered.',
      tone: 'amber',
    },
  ];
}

export function buildHealthPatientDeskMetrics(summary = {}, patients = [], consultations = [], formatCurrency = formatCurrencyNGN) {
  const hmoPatients = patients.filter((patient) => Boolean(patient.hmo_provider));
  const followUps = consultations.filter((consultation) => Boolean(consultation.follow_up_date));
  const recentPatient = [...patients]
    .sort((left, right) => String(right.created_at || '').localeCompare(String(left.created_at || '')))[0];

  return [
    ...buildHealthPatientOverviewMetrics(summary, formatCurrency),
    {
      label: 'HMO Profiles',
      value: hmoPatients.length,
      helper: 'Patients currently carrying an insurance or HMO relationship on file.',
      tone: 'emerald',
    },
    {
      label: 'Follow-up Queue',
      value: followUps.length,
      helper: recentPatient?.full_name
        ? `Latest patient on file: ${recentPatient.full_name}.`
        : 'No patient record has been registered yet.',
      tone: followUps.length > 0 ? 'rose' : 'sky',
    },
  ];
}

export function buildHealthConsultationDeskMetrics(summary = {}, patients = [], consultations = [], formatCurrency = formatCurrencyNGN) {
  const followUps = consultations.filter((consultation) => Boolean(consultation.follow_up_date));
  const unpaidCases = consultations.filter(
    (consultation) => Number(consultation.billing_amount || 0) > Number(consultation.amount_paid || 0),
  );
  const patientsSeen = new Set(
    consultations
      .map((consultation) => consultation.patient?.id ?? consultation.patient_id)
      .filter(Boolean),
  );

  return [
    ...buildHealthPatientOverviewMetrics(summary, formatCurrency),
    {
      label: 'Follow-up Queue',
      value: followUps.length,
      helper: 'Consultations already carrying a next-step review date that still needs active follow-through.',
      tone: followUps.length > 0 ? 'rose' : 'emerald',
    },
    {
      label: 'Unpaid Cases',
      value: unpaidCases.length,
      helper: 'Clinical reviews with billing still open and recovery not yet complete.',
      tone: unpaidCases.length > 0 ? 'amber' : 'emerald',
    },
    {
      label: 'Patients Seen',
      value: patientsSeen.size,
      helper: patients.length
        ? `${patientsSeen.size} of ${patients.length} patients already have consultation history on file.`
        : 'No patients have been registered into the clinical desk yet.',
      tone: 'sky',
    },
  ];
}

export function buildHealthPharmacyOverviewMetrics(summary = {}) {
  return [
    {
      label: 'Near Expiry',
      value: summary.near_expiry_batches ?? 0,
      helper: 'Batches approaching expiry that need pricing or movement attention.',
      tone: 'amber',
    },
    {
      label: 'Discounted Batches',
      value: summary.discounted_batches ?? 0,
      helper: 'Medicines already discounted to protect cash recovery before expiry.',
      tone: 'sky',
    },
    {
      label: 'Controlled Logs',
      value: summary.controlled_logs ?? 0,
      helper: 'Tracked controlled-dispense records currently available for review.',
      tone: 'rose',
    },
    {
      label: 'Refill Pending',
      value: summary.refill_pending ?? 0,
      helper: 'Patients with refill demand that still needs a follow-through action.',
      tone: 'emerald',
    },
  ];
}

export function buildHealthPharmacyDeskMetrics(summary = {}, batches = [], reminders = [], controlledLogs = []) {
  const activeBatches = batches.filter((batch) => Number(batch.remaining_quantity ?? batch.quantity ?? 0) > 0);
  const controlledPatients = new Set(
    controlledLogs
      .map((entry) => entry.customer?.id ?? entry.customer_id)
      .filter(Boolean),
  );

  return [
    ...buildHealthPharmacyOverviewMetrics(summary),
    {
      label: 'Active Batches',
      value: activeBatches.length,
      helper: 'Medicine batches still carrying live stock and requiring expiry-aware supervision.',
      tone: activeBatches.length > 0 ? 'violet' : 'sky',
    },
    {
      label: 'Expired Units',
      value: summary.expired_units ?? 0,
      helper: 'Units already beyond expiry and now needing quarantine, write-off, or disposal review.',
      tone: Number(summary.expired_units ?? 0) > 0 ? 'rose' : 'emerald',
    },
    {
      label: 'Controlled Patients',
      value: controlledPatients.size,
      helper: reminders.length
        ? `${reminders.length} refill reminders are still waiting for pharmacy follow-through.`
        : 'No refill reminders are currently waiting on the pharmacy team.',
      tone: controlledPatients.size > 0 ? 'amber' : 'sky',
    },
  ];
}

export function buildHealthPatientPayload(patientForm = {}) {
  return {
    full_name: patientForm.full_name?.trim() || '',
    phone: patientForm.phone?.trim() || null,
    email: patientForm.email?.trim() || null,
    date_of_birth: patientForm.date_of_birth || null,
    gender: patientForm.gender?.trim() || null,
    blood_group: patientForm.blood_group?.trim() || null,
    medical_history: patientForm.medical_history?.trim() || null,
    hmo_provider: patientForm.hmo_provider?.trim() || null,
    insurance_number: patientForm.insurance_number?.trim() || null,
    guardian_name: patientForm.guardian_name?.trim() || null,
    guardian_phone: patientForm.guardian_phone?.trim() || null,
  };
}

export function buildHealthConsultationPayload(consultationForm = {}) {
  return {
    patient_id: Number(consultationForm.patient_id),
    doctor_notes: consultationForm.doctor_notes,
    diagnosis: consultationForm.diagnosis,
    treatment_plan: consultationForm.treatment_plan,
    follow_up_date: consultationForm.follow_up_date || null,
    billing_amount: Number(consultationForm.billing_amount || 0),
    amount_paid: Number(consultationForm.amount_paid || 0),
    triage_vitals: {
      temperature: consultationForm.temperature,
      blood_pressure: consultationForm.blood_pressure,
      pulse_rate: consultationForm.pulse_rate,
    },
  };
}

export function buildHealthBatchPayload(batchForm = {}) {
  return {
    ...batchForm,
    product_id: Number(batchForm.product_id),
    quantity: Number(batchForm.quantity || 0),
    cost_per_unit: Number(batchForm.cost_per_unit || 0),
    near_expiry_discount_percent: Number(batchForm.near_expiry_discount_percent || 0),
    discounted_price: Number(batchForm.discounted_price || 0),
  };
}

export function buildHealthSubstitutionPayload(substitutionForm = {}) {
  return {
    product_id: Number(substitutionForm.product_id),
    substitute_product_id: Number(substitutionForm.substitute_product_id),
    reason: substitutionForm.reason,
    is_active: substitutionForm.is_active !== false,
  };
}

export function buildHealthDispensePayload(dispenseForm = {}) {
  return {
    customer_id: dispenseForm.customer_id ? Number(dispenseForm.customer_id) : null,
    product_id: Number(dispenseForm.product_id),
    product_batch_id: Number(dispenseForm.product_batch_id),
    substituted_from_product_id: dispenseForm.substituted_from_product_id ? Number(dispenseForm.substituted_from_product_id) : null,
    quantity: Number(dispenseForm.quantity || 0),
    unit_price: Number(dispenseForm.unit_price || 0),
    prescription_reference: dispenseForm.prescription_reference,
    create_refill_reminder: Boolean(dispenseForm.create_refill_reminder),
    notes: dispenseForm.notes,
  };
}

export function buildHealthAppointmentPayload(appointmentForm = {}) {
  return {
    patient_id: Number(appointmentForm.patient_id),
    scheduled_for: appointmentForm.scheduled_for,
    reason: appointmentForm.reason,
    referral_source: appointmentForm.referral_source,
  };
}

export function buildHealthLabTestPayload(labTestForm = {}) {
  return {
    name: labTestForm.name,
    sample_type: labTestForm.sample_type,
    reference_range: labTestForm.reference_range,
    price: Number(labTestForm.price || 0),
    turnaround_hours: Number(labTestForm.turnaround_hours || 24),
  };
}

export function buildHealthLabRequestPayload(labRequestForm = {}) {
  return {
    patient_id: Number(labRequestForm.patient_id),
    consultation_id: labRequestForm.consultation_id ? Number(labRequestForm.consultation_id) : null,
    test_id: Number(labRequestForm.test_id),
  };
}

export function buildHealthLabSampleCollectionPayload() {
  return {};
}

export function buildHealthResultPayload(resultForm = {}) {
  return {
    result_value: resultForm.result_value || 'negative',
    is_abnormal: /positive|high|reactive/i.test(resultForm.result_value || ''),
  };
}

export function buildHealthSpecimenRejectionPayload(resultForm = {}, fallbackReason = 'Insufficient specimen volume') {
  return {
    rejection_reason: resultForm.rejection_reason || fallbackReason,
  };
}

export function getHealthPendingApprovals(labRequests = []) {
  return labRequests.filter((request) => request.status === 'review_pending');
}

export function getHealthRejectedSpecimens(labRequests = []) {
  return labRequests.filter((request) => request.status === 'rejected');
}

export function buildHealthAppointmentCard(appointment = {}) {
  return {
    id: appointment.id,
    title: appointment.patient?.full_name || 'Patient',
    patientCodeLabel: appointment.patient?.patient_code || 'No patient code',
    reason: appointment.reason || 'General review',
    meta: `${formatDateTimeLocal(appointment.scheduled_for)} - ${appointment.referral_source || 'Walk-in'}`,
    status: appointment.status || 'scheduled',
    consultationLabel: appointment.consultation?.receipt_number || 'Consultation not yet linked',
  };
}

export function buildHealthLabWorkbenchCard(request = {}) {
  const status = request.status || 'pending';

  return {
    id: request.id,
    title: request.patient?.full_name || 'Patient',
    patientCodeLabel: request.patient?.patient_code || 'No patient code',
    testLabel: `${request.test?.name || 'Lab test'} - ${request.test?.sample_type || 'Sample pending type'}`,
    barcodeLabel: `Barcode: ${request.sample_barcode || 'Not assigned'}`,
    referenceLabel: `Reference: ${request.test?.reference_range || 'No range set'}`,
    turnaroundLabel: `${request.test?.turnaround_hours || 0}h target turnaround`,
    consultationLabel: request.consultation?.diagnosis || 'No consultation diagnosis linked',
    resultLabel: request.result_value || 'Result not entered',
    sampleCollectionLabel: request.sample_collected_at ? 'Sample collected' : 'Sample not yet collected',
    technicianLabel: request.technician?.name || 'Technician not assigned',
    status,
    statusTone: status === 'rejected'
      ? 'rose'
      : status === 'review_pending'
        ? 'amber'
        : status === 'approved'
          ? 'emerald'
          : 'sky',
    abnormalLabel: request.is_abnormal ? 'Abnormal flagged' : '',
  };
}

export function buildHealthApprovalCard(request = {}) {
  return {
    id: request.id,
    title: request.patient?.full_name || 'Patient',
    testLabel: request.test?.name || 'Lab test',
    resultLabel: `Result: ${request.result_value || 'Awaiting entry'}`,
  };
}

export function buildHealthRejectedSpecimenCard(request = {}) {
  return {
    id: request.id,
    title: request.patient?.full_name || 'Patient',
    testLabel: request.test?.name || 'Lab test',
    rejectionLabel: request.rejection_reason || 'No rejection reason captured.',
  };
}

export function buildHealthLabCatalogCard(test = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: test.id,
    title: test.name || 'Lab test',
    sampleTypeLabel: test.sample_type || 'Sample type not captured',
    priceLabel: formatCurrency(test.price || 0),
    turnaroundLabel: `${test.turnaround_hours || 0}h turnaround`,
    referenceLabel: test.reference_range || 'No reference range',
  };
}

export function buildHealthLabTestOptionLabel(test = {}, formatCurrency = formatCurrencyNGN) {
  return `${test.name} - ${formatCurrency(test.price || 0)}`;
}

export function buildHealthPatientRecordCard(patient = {}) {
  return {
    id: patient.id,
    title: patient.full_name || 'Patient',
    identityLabel: `${patient.patient_code || 'No code'} | ${patient.hmo_provider || 'Self-pay'}`,
    contactLabel: [patient.phone || 'No phone', patient.email || 'No email'].join(' | '),
    demographicLabel: [patient.gender, patient.blood_group, patient.date_of_birth].filter(Boolean).join(' | ') || 'Demographic profile still incomplete.',
    historyLabel: patient.medical_history || 'No major medical history captured yet.',
    guardianLabel: patient.guardian_name ? `${patient.guardian_name}${patient.guardian_phone ? ` - ${patient.guardian_phone}` : ''}` : 'No guardian or next of kin captured.',
    consultationsLabel: `${patient.consultations?.length ?? 0} consultations`,
    labRequestsLabel: `${patient.lab_requests?.length ?? 0} lab requests`,
    appointmentsLabel: `${patient.appointments?.length ?? 0} appointments`,
  };
}

export function buildHealthConsultationCard(consultation = {}, formatCurrency = formatCurrencyNGN) {
  const outstanding = Number(consultation.billing_amount || 0) - Number(consultation.amount_paid || 0);

  return {
    id: consultation.id,
    title: consultation.patient?.full_name || 'Patient',
    patientCodeLabel: consultation.patient?.patient_code || 'No patient code',
    receiptLabel: consultation.receipt_number || 'No receipt number',
    diagnosisLabel: consultation.diagnosis || 'Diagnosis pending',
    treatmentLabel: consultation.treatment_plan || 'Treatment plan not yet set',
    billingLabel: `${formatCurrency(consultation.billing_amount || 0)} billed | ${formatCurrency(consultation.amount_paid || 0)} paid`,
    followUpLabel: consultation.follow_up_date || 'No follow-up booked',
    outstandingLabel: `${formatCurrency(outstanding)} outstanding`,
    vitalsLabel: [
      consultation.triage_vitals?.temperature ? `Temp ${consultation.triage_vitals.temperature}` : null,
      consultation.triage_vitals?.blood_pressure ? `BP ${consultation.triage_vitals.blood_pressure}` : null,
      consultation.triage_vitals?.pulse_rate ? `Pulse ${consultation.triage_vitals.pulse_rate}` : null,
    ].filter(Boolean).join(' | ') || 'No triage vitals captured',
    notesLabel: consultation.doctor_notes || 'No doctor note recorded',
    labRequestsLabel: `${consultation.lab_requests_count ?? 0} linked lab request${consultation.lab_requests_count === 1 ? '' : 's'}`,
  };
}

export function filterHealthConsultations(consultations = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return consultations;
  }

  return consultations.filter((consultation) => {
    const fields = [
      consultation.patient?.full_name,
      consultation.patient?.patient_code,
      consultation.diagnosis,
      consultation.treatment_plan,
      consultation.doctor_notes,
      consultation.receipt_number,
      consultation.follow_up_date,
      consultation.appointment?.appointment_code,
    ];

    return fields.some((field) => String(field ?? '').toLowerCase().includes(query));
  });
}

export function filterHealthPatients(patients = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return patients;
  }

  return patients.filter((patient) => {
    const fields = [
      patient.full_name,
      patient.patient_code,
      patient.phone,
      patient.email,
      patient.hmo_provider,
      patient.guardian_name,
      patient.gender,
      patient.blood_group,
    ];

    return fields.some((field) => String(field ?? '').toLowerCase().includes(query));
  });
}

export function filterHealthAppointments(appointments = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return appointments;
  }

  return appointments.filter((appointment) => {
    const fields = [
      appointment.patient?.full_name,
      appointment.patient?.patient_code,
      appointment.reason,
      appointment.referral_source,
      appointment.status,
    ];

    return fields.some((field) => String(field ?? '').toLowerCase().includes(query));
  });
}

export function filterHealthLabRequests(labRequests = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return labRequests;
  }

  return labRequests.filter((request) => {
    const fields = [
      request.patient?.full_name,
      request.patient?.patient_code,
      request.test?.name,
      request.test?.sample_type,
      request.status,
      request.sample_barcode,
      request.consultation?.diagnosis,
    ];

    return fields.some((field) => String(field ?? '').toLowerCase().includes(query));
  });
}

export function filterHealthLabTests(labTests = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return labTests;
  }

  return labTests.filter((test) => {
    const fields = [
      test.name,
      test.sample_type,
      test.reference_range,
      test.turnaround_hours,
      test.price,
    ];

    return fields.some((field) => String(field ?? '').toLowerCase().includes(query));
  });
}

export function filterHealthBatches(batches = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return batches;
  }

  return batches.filter((batch) => {
    const fields = [
      batch.product?.name,
      batch.batch_number,
      batch.supplier,
      batch.expiry_date,
      batch.manufacture_date,
      batch.product?.sku,
    ];

    return fields.some((field) => String(field ?? '').toLowerCase().includes(query));
  });
}

export function filterHealthPharmacyHistory(entries = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return entries;
  }

  return entries.filter((entry) => {
    const fields = [
      entry.customer?.name,
      entry.product?.name,
      entry.batch?.batch_number,
      entry.substituted_from?.name,
      entry.prescription_reference,
      entry.due_on,
      entry.status,
    ];

    return fields.some((field) => String(field ?? '').toLowerCase().includes(query));
  });
}

export function buildHealthNearExpiryCard(batch = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: batch.id,
    title: batch.product?.name || 'Medicine',
    batchLabel: `Batch ${batch.batch_number} - ${batch.remaining_quantity ?? 0} units left`,
    expiryLabel: `Expiry: ${batch.expiry_date || 'Not set'}`,
    discountLabel: `Discount: ${batch.near_expiry_discount_percent ?? 0}%${batch.discounted_price > 0 ? ` at ${formatCurrency(batch.discounted_price)}` : ''}`,
  };
}

export function buildHealthSubstitutionCard(rule = {}) {
  return {
    id: rule.id,
    title: rule.product?.name || 'Medicine',
    substituteLabel: `Substitute: ${rule.substitute?.name || 'Not set'}`,
    reasonLabel: rule.reason || 'No reason provided',
    statusLabel: rule.is_active === false ? 'Inactive rule' : 'Active rule',
  };
}

export function buildHealthControlledLogCard(entry = {}) {
  return {
    id: entry.id,
    title: entry.product?.name || 'Medicine',
    quantityLabel: `${entry.customer?.name || 'No patient'} - ${entry.quantity ?? 0} units`,
    prescriptionLabel: entry.prescription_reference || 'No prescription reference',
    batchLabel: entry.batch?.batch_number ? `Batch ${entry.batch.batch_number}` : 'Batch not linked',
    dateLabel: entry.created_at ? formatDateTimeLocal(entry.created_at) : 'No log time captured',
  };
}

export function buildHealthRefillReminderCard(entry = {}) {
  return {
    id: entry.id,
    title: entry.customer?.name || 'Patient',
    productLabel: entry.product?.name || 'Medicine',
    dueLabel: `Due ${entry.due_on || 'Date not set'}`,
    statusLabel: entry.status || 'pending',
  };
}

export function buildHealthPurchaseHistoryCard(entry = {}, formatCurrency = formatCurrencyNGN) {
  return {
    id: entry.id,
    title: entry.customer?.name || 'Walk-in',
    amountLabel: `${entry.product?.name || 'Medicine'} - ${formatCurrency(entry.total_amount || 0)}`,
    contextLabel: entry.substituted_from ? `Substituted from ${entry.substituted_from.name}` : entry.prescription_reference || 'No prescription ref',
    batchLabel: entry.batch?.batch_number ? `Batch ${entry.batch.batch_number}` : 'Batch not linked',
    quantityLabel: `${entry.quantity ?? 0} unit${Number(entry.quantity ?? 0) === 1 ? '' : 's'} dispensed`,
    dateLabel: entry.dispensed_at ? formatDateTimeLocal(entry.dispensed_at) : 'Dispense time not captured',
  };
}
