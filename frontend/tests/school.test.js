import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSchoolAttendanceCard,
  buildSchoolAttendancePayload,
  buildSchoolAdmissionsMetrics,
  buildSchoolClassPayload,
  buildSchoolClassroomCard,
  buildSchoolStructureDeskMetrics,
  buildSchoolDebtorCard,
  buildSchoolEnrollmentCard,
  buildSchoolEnrollmentPayload,
  buildSchoolFeeMetrics,
  buildSchoolFeePaymentCard,
  buildSchoolFeePaymentPayload,
  buildSchoolFeeStructureCard,
  buildSchoolFeeStructurePayload,
  buildSchoolOverviewMetrics,
  buildSchoolResultDeskMetrics,
  buildSchoolPerformanceMetrics,
  buildSchoolResultCard,
  buildSchoolResultPayload,
  buildSchoolSessionCard,
  buildSchoolSessionPayload,
  buildSchoolStudentCard,
  buildSchoolStudentMetrics,
  buildSchoolStudentPayload,
  buildSchoolStructureMetrics,
  buildSchoolSubjectCard,
  buildSchoolTermCard,
  buildSchoolTermPayload,
  filterSchoolClasses,
  filterSchoolEnrollments,
  filterSchoolResults,
  filterSchoolSessions,
  filterSchoolSubjects,
  filterSchoolTerms,
  createSchoolAttendanceForm,
  createSchoolClassForm,
  createSchoolEnrollmentForm,
  createSchoolFeePaymentForm,
  createSchoolFeeStructureForm,
  createSchoolResultForm,
  createSchoolSessionForm,
  createSchoolStudentForm,
  createSchoolSubjectForm,
  createSchoolTermForm,
} from '../src/lib/school.js';
import { formatCurrencyNGN } from '../src/lib/financeFormatters.js';

test('school form factories return stable attendance and result defaults', () => {
  const fixedDate = new Date('2026-05-26T08:15:00.000Z');

  assert.deepEqual(createSchoolAttendanceForm(fixedDate), {
    student_id: '',
    academic_term_id: '',
    attendance_date: '2026-05-26',
    status: 'present',
    notes: '',
  });

  assert.deepEqual(createSchoolResultForm(), {
    student_id: '',
    academic_term_id: '',
    school_subject_id: '',
    score: '78',
    teacher_comment: 'Strong performance and focus.',
  });

  assert.deepEqual(createSchoolSessionForm(), {
    name: '2026/2027',
    starts_on: '2026-09-01',
    ends_on: '2027-07-30',
  });

  assert.deepEqual(createSchoolTermForm(), {
    academic_session_id: '',
    name: 'First Term',
    starts_on: '2026-09-01',
    ends_on: '2026-12-15',
  });

  assert.deepEqual(createSchoolClassForm(), {
    name: 'JSS 1',
    stream: 'Gold',
    department: 'Junior School',
    capacity: '35',
  });

  assert.deepEqual(createSchoolSubjectForm(), {
    name: 'Mathematics',
    department: 'Junior School',
  });

  assert.deepEqual(createSchoolEnrollmentForm(), {
    student_id: '',
    academic_session_id: '',
    academic_term_id: '',
    school_classroom_id: '',
  });

  assert.deepEqual(createSchoolStudentForm(fixedDate), {
    full_name: 'Zainab Musa',
    gender: 'Female',
    date_of_birth: '2014-03-14',
    phone: '08035554444',
    email: 'zainab@example.com',
    admitted_on: '2026-05-26',
    guardian_name: 'Musa Ibrahim',
    guardian_relationship: 'Father',
    guardian_phone: '08030001111',
    guardian_email: 'musa.ibrahim@example.com',
    guardian_address: 'Kawo, Kaduna',
  });

  assert.deepEqual(createSchoolFeeStructureForm(), {
    academic_session_id: '',
    academic_term_id: '',
    school_classroom_id: '',
    name: 'Tuition',
    amount: '50000',
    discount_amount: '5000',
    scholarship_amount: '0',
  });

  assert.deepEqual(createSchoolFeePaymentForm(fixedDate), {
    student_id: '',
    school_fee_structure_id: '',
    amount_paid: '30000',
    payment_method: 'transfer',
    paid_at: '2026-05-26',
  });
});

test('school overview metrics keep attendance hero cards aligned', () => {
  assert.deepEqual(buildSchoolOverviewMetrics({
    attendance_rate: 92,
    students_promoted: 18,
  }), [
    { label: 'Attendance Rate', value: '92%' },
    { label: 'Promoted', value: 18 },
  ]);

  assert.deepEqual(buildSchoolStructureMetrics([{ id: 1 }, { id: 2 }], [{ id: 1 }], [{ id: 9 }], [{ id: 4 }, { id: 5 }], [{ id: 3 }]), [
    {
      label: 'Sessions',
      value: 2,
      helper: 'Academic calendars currently defined for the school workflow.',
      tone: 'violet',
    },
    {
      label: 'Enrollments',
      value: 1,
      helper: 'Students already placed into a session, term, and classroom structure.',
      tone: 'sky',
    },
    {
      label: 'Classes',
      value: 1,
      helper: 'Streams and classrooms currently available for placement and teaching operations.',
      tone: 'emerald',
    },
    {
      label: 'Subjects',
      value: 2,
      helper: 'Teaching subjects already configured for academic delivery and assessment.',
      tone: 'amber',
    },
    {
      label: 'Terms',
      value: 1,
      helper: 'Academic terms now active across the current school calendar setup.',
      tone: 'violet',
    },
  ]);

  assert.deepEqual(
    buildSchoolStructureDeskMetrics(
      [{ id: 1, is_active: true }, { id: 2, is_active: false }],
      [{ id: 1 }],
      [{ id: 9, capacity: 1, enrollments: [{ id: 1 }] }],
      [{ id: 4 }, { id: 5 }],
      [{ id: 3, is_active: true }],
      [{ id: 5, enrollments: [] }],
    ),
    [
      {
        label: 'Sessions',
        value: 2,
        helper: 'Academic calendars currently defined for the school workflow.',
        tone: 'violet',
      },
      {
        label: 'Enrollments',
        value: 1,
        helper: 'Students already placed into a session, term, and classroom structure.',
        tone: 'sky',
      },
      {
        label: 'Classes',
        value: 1,
        helper: 'Streams and classrooms currently available for placement and teaching operations.',
        tone: 'emerald',
      },
      {
        label: 'Subjects',
        value: 2,
        helper: 'Teaching subjects already configured for academic delivery and assessment.',
        tone: 'amber',
      },
      {
        label: 'Terms',
        value: 1,
        helper: 'Academic terms now active across the current school calendar setup.',
        tone: 'violet',
      },
      {
        label: 'Active Terms',
        value: 1,
        helper: 'Teaching windows currently active inside the academic calendar.',
        tone: 'sky',
      },
      {
        label: 'Unplaced Students',
        value: 1,
        helper: 'Students still registered but not yet attached to the class structure.',
        tone: 'amber',
      },
      {
        label: 'Full Classes',
        value: 1,
        helper: 'Classrooms already at or above visible capacity and likely to need balancing.',
        tone: 'rose',
      },
      {
        label: 'Active Sessions',
        value: 1,
        helper: 'Academic session windows currently live for planning and enrollment.',
        tone: 'violet',
      },
    ],
  );

  assert.deepEqual(buildSchoolStudentMetrics({
    enrolled_students: 120,
    fees_collected: 450000,
    attendance_rate: 94,
  }, formatCurrencyNGN), [
    {
      label: 'Enrolled',
      value: 120,
      helper: 'Students currently active in the academic register.',
      tone: 'violet',
    },
    {
      label: 'Fees Collected',
      value: formatCurrencyNGN(450000),
      helper: 'School fee revenue already captured in the current reporting view.',
      tone: 'emerald',
    },
    {
      label: 'Attendance Rate',
      value: '94%',
      helper: 'Overall presence signal available to school owners and admin staff.',
      tone: 'sky',
    },
  ]);

  assert.deepEqual(buildSchoolFeeMetrics({
    fees_collected: 450000,
    outstanding_fees: 125000,
  }, [{ id: 1 }, { id: 2 }, { id: 3 }], formatCurrencyNGN), [
    {
      label: 'Collected',
      value: formatCurrencyNGN(450000),
      helper: 'Fee revenue already captured across the current school finance cycle.',
      tone: 'emerald',
    },
    {
      label: 'Outstanding',
      value: formatCurrencyNGN(125000),
      helper: 'Student balances still unpaid and needing follow-up from the finance office.',
      tone: 'amber',
    },
    {
      label: 'Debtors',
      value: 3,
      helper: 'Students currently appearing on the active debtors report.',
      tone: 'rose',
    },
  ]);

  assert.deepEqual(buildSchoolPerformanceMetrics([
    { status: 'present' },
    { status: 'late' },
    { status: 'present' },
  ], [
    { score: 80 },
    { score: 60 },
  ], {
    students_promoted: 18,
  }), [
    {
      label: 'Attendance Entries',
      value: 3,
      helper: 'Roll-call records already captured for academic monitoring.',
      tone: 'sky',
    },
    {
      label: 'Present Today',
      value: 2,
      helper: 'Students marked present in the current attendance ledger.',
      tone: 'emerald',
    },
    {
      label: 'Late Cases',
      value: 1,
      helper: 'Attendance exceptions needing classroom follow-up.',
      tone: 'amber',
    },
    {
      label: 'Average Score',
      value: '70%',
      helper: 'Mean performance across the recorded result ledger.',
      tone: 'violet',
    },
    {
      label: 'High Scores',
      value: 1,
      helper: '18 students have already been promoted overall.',
      tone: 'violet',
    },
  ]);

  assert.deepEqual(buildSchoolAdmissionsMetrics([
    {
      full_name: 'Amina Bello',
      status: 'active',
      is_alumni: false,
      admitted_on: '2026-05-26',
      guardians: [{ id: 1 }],
      enrollments: [{ id: 1 }],
    },
    {
      full_name: 'Bashir Lawal',
      status: 'active',
      is_alumni: true,
      admitted_on: '2026-05-20',
      guardians: [],
      enrollments: [],
    },
  ]), [
    {
      label: 'Active Learners',
      value: 2,
      helper: 'Students currently active in the admissions register.',
      tone: 'emerald',
    },
    {
      label: 'Guardian Coverage',
      value: 1,
      helper: 'Student records already carrying at least one guardian contact.',
      tone: 'sky',
    },
    {
      label: 'Awaiting Placement',
      value: 1,
      helper: 'Students registered but not yet enrolled into class structure.',
      tone: 'amber',
    },
    {
      label: 'Alumni',
      value: 1,
      helper: 'Students already marked as graduated or alumni.',
      tone: 'violet',
    },
    {
      label: 'Latest Admission',
      value: 'Amina Bello',
      helper: 'Admitted on 2026-05-26.',
      tone: 'rose',
    },
  ]);

  assert.deepEqual(buildSchoolResultDeskMetrics(
    {
      attendance_rate: 92,
      students_promoted: 18,
    },
    [
      { score: 80 },
      { score: 60 },
    ],
    [
      { status: 'active' },
      { status: 'inactive' },
      { status: 'active' },
    ],
    formatCurrencyNGN,
  ), [
    {
      label: 'Attendance Rate',
      value: '92%',
      helper: 'Live school-wide presence signal still feeding the academic performance view.',
      tone: 'sky',
    },
    {
      label: 'Promoted',
      value: 18,
      helper: 'Enrollments already marked promoted inside the current academic workflow.',
      tone: 'emerald',
    },
    {
      label: 'Average Score',
      value: '70%',
      helper: 'Mean result performance across the current academic ledger.',
      tone: 'violet',
    },
    {
      label: 'High Scores',
      value: 1,
      helper: 'Result entries already landing in distinction-grade territory.',
      tone: 'violet',
    },
    {
      label: 'Active Learners',
      value: 2,
      helper: 'Students still active in the school register and eligible for result entry.',
      tone: 'sky',
    },
  ]);
});

test('school payload helpers normalize attendance and result forms consistently', () => {
  assert.deepEqual(buildSchoolAttendancePayload({
    student_id: '4',
    academic_term_id: '2',
    attendance_date: '2026-05-26',
    status: 'late',
    notes: 'Arrived after assembly',
  }), {
    student_id: 4,
    academic_term_id: 2,
    attendance_date: '2026-05-26',
    status: 'late',
    notes: 'Arrived after assembly',
  });

  assert.deepEqual(buildSchoolResultPayload({
    student_id: '4',
    academic_term_id: '2',
    school_subject_id: '9',
    score: '81',
    teacher_comment: 'Strong improvement',
  }), {
    student_id: 4,
    academic_term_id: 2,
    school_subject_id: 9,
    score: 81,
    teacher_comment: 'Strong improvement',
  });

  assert.deepEqual(buildSchoolSessionPayload({
    name: '2026/2027',
    starts_on: '2026-09-01',
    ends_on: '2027-07-30',
  }), {
    name: '2026/2027',
    starts_on: '2026-09-01',
    ends_on: '2027-07-30',
    is_active: true,
  });

  assert.deepEqual(buildSchoolTermPayload({
    academic_session_id: '3',
    name: 'Second Term',
    starts_on: '2027-01-10',
    ends_on: '2027-04-03',
  }), {
    academic_session_id: 3,
    name: 'Second Term',
    starts_on: '2027-01-10',
    ends_on: '2027-04-03',
    is_active: true,
  });

  assert.deepEqual(buildSchoolClassPayload({
    name: 'SS 1',
    stream: 'Blue',
    department: 'Senior School',
    capacity: '40',
  }), {
    name: 'SS 1',
    stream: 'Blue',
    department: 'Senior School',
    capacity: 40,
  });

  assert.deepEqual(buildSchoolEnrollmentPayload({
    student_id: '6',
    academic_session_id: '2',
    academic_term_id: '5',
    school_classroom_id: '9',
  }), {
    student_id: 6,
    academic_session_id: 2,
    academic_term_id: 5,
    school_classroom_id: 9,
  });

  assert.deepEqual(buildSchoolStudentPayload({
    full_name: 'Amina Bello',
    date_of_birth: '2014-01-02',
    gender: 'Female',
    phone: '08032221111',
    email: 'amina@example.com',
    admitted_on: '2026-05-26',
    guardian_name: 'Bello Musa',
    guardian_relationship: 'Father',
    guardian_phone: '08030009999',
    guardian_email: 'bello@example.com',
    guardian_address: 'Tudun Wada',
  }), {
    full_name: 'Amina Bello',
    date_of_birth: '2014-01-02',
    gender: 'Female',
    phone: '08032221111',
    email: 'amina@example.com',
    admitted_on: '2026-05-26',
    guardian: {
      full_name: 'Bello Musa',
      relationship: 'Father',
      phone: '08030009999',
      email: 'bello@example.com',
      address: 'Tudun Wada',
    },
  });

  assert.deepEqual(buildSchoolFeeStructurePayload({
    academic_session_id: '2',
    academic_term_id: '5',
    school_classroom_id: '',
    name: 'Boarding',
    amount: '120000',
    discount_amount: '10000',
    scholarship_amount: '5000',
  }), {
    academic_session_id: 2,
    academic_term_id: 5,
    school_classroom_id: null,
    name: 'Boarding',
    amount: 120000,
    discount_amount: 10000,
    scholarship_amount: 5000,
  });

  assert.deepEqual(buildSchoolFeePaymentPayload({
    student_id: '8',
    school_fee_structure_id: '4',
    amount_paid: '25000',
    payment_method: 'cash',
    paid_at: '2026-05-26',
  }), {
    student_id: 8,
    school_fee_structure_id: 4,
    amount_paid: 25000,
    payment_method: 'cash',
    paid_at: '2026-05-26',
  });
});

test('school presenter helpers keep attendance and result logs readable', () => {
  assert.deepEqual(buildSchoolAttendanceCard({
    id: 7,
    student: { full_name: 'Amina Musa' },
    attendance_date: '2026-05-26',
    status: 'present',
    notes: '',
    term: { name: 'First Term' },
  }), {
    id: 7,
    title: 'Amina Musa',
    statusLabel: '2026-05-26 - present',
    termLabel: 'First Term',
    notesLabel: 'No notes',
  });

  assert.deepEqual(buildSchoolResultCard({
    id: 8,
    student: { full_name: 'Bala Yusuf', admission_number: 'ADM-008' },
    subject: { name: 'Mathematics', department: 'Junior School' },
    score: 88,
    grade: 'A',
    teacher_comment: '',
    term: { name: 'Second Term' },
  }), {
    id: 8,
    title: 'Bala Yusuf',
    admissionLabel: 'ADM-008',
    scoreLabel: 'Mathematics - 88% (A)',
    termLabel: 'Second Term',
    departmentLabel: 'Junior School',
    commentLabel: 'No comment',
  });

  assert.deepEqual(filterSchoolResults([
    {
      id: 1,
      student: { full_name: 'Amina Bello', admission_number: 'ADM-001' },
      subject: { name: 'Mathematics', department: 'Junior School' },
      term: { name: 'First Term' },
      teacher_comment: 'Strong focus',
      grade: 'A',
      score: 88,
    },
    {
      id: 2,
      student: { full_name: 'Bala Yusuf', admission_number: 'ADM-002' },
      subject: { name: 'English', department: 'Senior School' },
      term: { name: 'Second Term' },
      teacher_comment: 'Needs improvement',
      grade: 'C',
      score: 62,
    },
  ], 'senior').map((entry) => entry.id), [2]);

  assert.deepEqual(buildSchoolClassroomCard({
    id: 10,
    name: 'JSS 1',
    stream: 'Gold',
    department: 'Junior School',
    capacity: 35,
    enrollments: [{ id: 1 }, { id: 2 }, { id: 3 }],
  }, 12), {
    id: 10,
    title: 'JSS 1 - Gold',
    departmentLabel: 'Junior School - Capacity 35',
    enrollmentLabel: '3 students enrolled',
    subjectLabel: '12 subjects',
    balanceLabel: '32 seats left',
  });

  assert.deepEqual(buildSchoolSessionCard({
    id: 12,
    name: '2026/2027',
    starts_on: '2026-09-01',
    ends_on: '2027-07-30',
    is_active: true,
  }, 3), {
    id: 12,
    title: '2026/2027',
    durationLabel: '2026-09-01 - 2027-07-30',
    termLabel: '3 terms linked',
    statusLabel: 'Active session',
  });

  assert.deepEqual(buildSchoolTermCard({
    id: 13,
    name: 'Second Term',
    starts_on: '2027-01-10',
    ends_on: '2027-04-03',
    is_active: false,
    session: { name: '2026/2027' },
  }), {
    id: 13,
    title: 'Second Term',
    sessionLabel: '2026/2027',
    durationLabel: '2027-01-10 - 2027-04-03',
    statusLabel: 'Inactive term',
  });

  assert.deepEqual(buildSchoolSubjectCard({
    id: 14,
    name: 'Mathematics',
    department: 'Junior School',
    teacher: { name: 'Mrs. Danladi' },
  }), {
    id: 14,
    title: 'Mathematics',
    departmentLabel: 'Junior School',
    teacherLabel: 'Mrs. Danladi',
  });

  assert.deepEqual(buildSchoolEnrollmentCard({
    id: 15,
    enrollment_status: 'enrolled',
    student: { full_name: 'Amina Bello' },
    classroom: { name: 'JSS 1' },
    term: { name: 'First Term' },
    session: { name: '2026/2027' },
  }), {
    id: 15,
    title: 'Amina Bello',
    classLabel: 'JSS 1',
    termLabel: 'First Term',
    sessionLabel: '2026/2027',
    statusLabel: 'enrolled',
  });

  assert.deepEqual(buildSchoolStudentCard({
    id: 11,
    full_name: 'Amina Bello',
    admission_number: 'ADM-011',
    admitted_on: '2026-05-26',
    phone: '08032221111',
    enrollments: [{ classroom: { name: 'JSS 1' } }],
    guardians: [{ full_name: 'Bello Musa', phone: '08030009999', relationship: 'Father', email: 'bello@example.com' }],
    status: 'active',
    is_alumni: false,
    fee_payments: [{ id: 1 }, { id: 2 }],
  }), {
    id: 11,
    title: 'Amina Bello',
    admissionLabel: 'ADM-011 - JSS 1',
    guardianLabel: 'Guardian: Bello Musa - 08030009999',
    guardianSupportLabel: 'Father - bello@example.com',
    contactLabel: '08032221111',
    admittedOnLabel: '2026-05-26',
    statusLabel: 'active',
    alumniLabel: 'Current student',
    feePaymentsLabel: '2 fee payments',
  });

  assert.deepEqual(buildSchoolDebtorCard({
    student_id: 14,
    full_name: 'Hauwa Ali',
    classroom: '',
    expected: 80000,
    paid: 30000,
    balance: 50000,
  }, formatCurrencyNGN), {
    id: 14,
    title: 'Hauwa Ali',
    classroomLabel: 'No class assigned',
    expectedVsPaidLabel: `Expected: ${formatCurrencyNGN(80000)} - Paid: ${formatCurrencyNGN(30000)}`,
    balanceLabel: `Balance: ${formatCurrencyNGN(50000)}`,
  });

  assert.deepEqual(buildSchoolFeePaymentCard({
    id: 16,
    student: { full_name: 'Bashir Lawal' },
    structure: { name: 'Tuition', classroom: { name: 'JSS 1' } },
    payment_method: 'transfer',
    receipt_number: 'FEE-123',
    paid_at: '2026-05-26T08:00:00.000000Z',
    amount_paid: 45000,
  }, formatCurrencyNGN), {
    id: 16,
    title: 'Bashir Lawal',
    methodLabel: 'Tuition - transfer',
    contextLabel: 'JSS 1 - FEE-123',
    paidAtLabel: '2026-05-26T08:00:00.000000Z',
    amountLabel: formatCurrencyNGN(45000),
  });

  assert.deepEqual(buildSchoolFeeStructureCard({
    id: 17,
    name: 'Boarding',
    amount: 120000,
    discount_amount: 10000,
    scholarship_amount: 5000,
    classroom: { name: 'SS 1' },
    payments: [{ amount_paid: 45000 }, { amount_paid: 30000 }],
  }, formatCurrencyNGN), {
    id: 17,
    title: 'Boarding',
    classLabel: 'SS 1',
    amountLabel: formatCurrencyNGN(120000),
    discountLabel: formatCurrencyNGN(10000),
    scholarshipLabel: formatCurrencyNGN(5000),
    expectedLabel: formatCurrencyNGN(105000),
    collectedLabel: formatCurrencyNGN(75000),
    outstandingLabel: formatCurrencyNGN(30000),
  });

  assert.deepEqual(filterSchoolSessions([
    { id: 1, name: '2026/2027', starts_on: '2026-09-01', is_active: true },
    { id: 2, name: '2025/2026', starts_on: '2025-09-01', is_active: false },
  ], 'inactive').map((entry) => entry.id), [2]);

  assert.deepEqual(filterSchoolTerms([
    { id: 3, name: 'First Term', session: { name: '2026/2027' } },
    { id: 4, name: 'Second Term', session: { name: '2025/2026' } },
  ], 'second').map((entry) => entry.id), [4]);

  assert.deepEqual(filterSchoolSubjects([
    { id: 5, name: 'Mathematics', department: 'Junior School', teacher: { name: 'Mrs. Danladi' } },
    { id: 6, name: 'Biology', department: 'Senior School' },
  ], 'danladi').map((entry) => entry.id), [5]);

  assert.deepEqual(filterSchoolClasses([
    { id: 7, name: 'JSS 1', stream: 'Gold', department: 'Junior School' },
    { id: 8, name: 'SS 1', stream: 'Blue', department: 'Senior School' },
  ], 'blue').map((entry) => entry.id), [8]);

  assert.deepEqual(filterSchoolEnrollments([
    { id: 9, student: { full_name: 'Amina Bello' }, classroom: { name: 'JSS 1' }, enrollment_status: 'enrolled' },
    { id: 10, student: { full_name: 'Bashir Lawal' }, classroom: { name: 'SS 1' }, enrollment_status: 'transferred' },
  ], 'transferred').map((entry) => entry.id), [10]);
});
