export function createSchoolAttendanceForm(date = new Date()) {
  return {
    student_id: '',
    academic_term_id: '',
    attendance_date: date.toISOString().slice(0, 10),
    status: 'present',
    notes: '',
  };
}

export function createSchoolResultForm() {
  return {
    student_id: '',
    academic_term_id: '',
    school_subject_id: '',
    score: '78',
    teacher_comment: 'Strong performance and focus.',
  };
}

export function createSchoolSessionForm() {
  return {
    name: '2026/2027',
    starts_on: '2026-09-01',
    ends_on: '2027-07-30',
  };
}

export function createSchoolTermForm() {
  return {
    academic_session_id: '',
    name: 'First Term',
    starts_on: '2026-09-01',
    ends_on: '2026-12-15',
  };
}

export function createSchoolClassForm() {
  return {
    name: 'JSS 1',
    stream: 'Gold',
    department: 'Junior School',
    capacity: '35',
  };
}

export function createSchoolSubjectForm() {
  return {
    name: 'Mathematics',
    department: 'Junior School',
  };
}

export function createSchoolEnrollmentForm() {
  return {
    student_id: '',
    academic_session_id: '',
    academic_term_id: '',
    school_classroom_id: '',
  };
}

export function createSchoolStudentForm(date = new Date()) {
  return {
    full_name: 'Zainab Musa',
    gender: 'Female',
    date_of_birth: '2014-03-14',
    phone: '08035554444',
    email: 'zainab@example.com',
    admitted_on: date.toISOString().slice(0, 10),
    guardian_name: 'Musa Ibrahim',
    guardian_relationship: 'Father',
    guardian_phone: '08030001111',
    guardian_email: 'musa.ibrahim@example.com',
    guardian_address: 'Kawo, Kaduna',
  };
}

export function createSchoolFeeStructureForm() {
  return {
    academic_session_id: '',
    academic_term_id: '',
    school_classroom_id: '',
    name: 'Tuition',
    amount: '50000',
    discount_amount: '5000',
    scholarship_amount: '0',
  };
}

export function createSchoolFeePaymentForm(date = new Date()) {
  return {
    student_id: '',
    school_fee_structure_id: '',
    amount_paid: '30000',
    payment_method: 'transfer',
    paid_at: date.toISOString().slice(0, 10),
  };
}

export function buildSchoolOverviewMetrics(summary = {}) {
  return [
    { label: 'Attendance Rate', value: `${summary.attendance_rate ?? 0}%` },
    { label: 'Promoted', value: summary.students_promoted ?? 0 },
  ];
}

export function buildSchoolResultDeskMetrics(summary = {}, results = [], students = [], formatCurrency) {
  const averageScore = results.length
    ? Math.round(results.reduce((sum, entry) => sum + Number(entry.score || 0), 0) / results.length)
    : 0;
  const distinctions = results.filter((entry) => Number(entry.score || 0) >= 70).length;
  const activeStudents = students.filter((student) => (student.status || 'active') === 'active').length;

  return [
    {
      label: 'Attendance Rate',
      value: `${summary.attendance_rate ?? 0}%`,
      helper: 'Live school-wide presence signal still feeding the academic performance view.',
      tone: 'sky',
    },
    {
      label: 'Promoted',
      value: summary.students_promoted ?? 0,
      helper: 'Enrollments already marked promoted inside the current academic workflow.',
      tone: 'emerald',
    },
    {
      label: 'Average Score',
      value: `${averageScore}%`,
      helper: 'Mean result performance across the current academic ledger.',
      tone: averageScore >= 70 ? 'violet' : 'amber',
    },
    {
      label: 'High Scores',
      value: distinctions,
      helper: 'Result entries already landing in distinction-grade territory.',
      tone: 'violet',
    },
    {
      label: 'Active Learners',
      value: activeStudents,
      helper: 'Students still active in the school register and eligible for result entry.',
      tone: 'sky',
    },
  ];
}

export function buildSchoolPerformanceMetrics(attendance = [], results = [], summary = {}) {
  const attendanceCount = attendance.length;
  const presentCount = attendance.filter((entry) => entry.status === 'present').length;
  const lateCount = attendance.filter((entry) => entry.status === 'late').length;
  const averageScore = results.length
    ? Math.round(results.reduce((sum, entry) => sum + Number(entry.score || 0), 0) / results.length)
    : 0;
  const distinctions = results.filter((entry) => Number(entry.score || 0) >= 70).length;

  return [
    {
      label: 'Attendance Entries',
      value: attendanceCount,
      helper: 'Roll-call records already captured for academic monitoring.',
      tone: 'sky',
    },
    {
      label: 'Present Today',
      value: presentCount,
      helper: 'Students marked present in the current attendance ledger.',
      tone: 'emerald',
    },
    {
      label: 'Late Cases',
      value: lateCount,
      helper: 'Attendance exceptions needing classroom follow-up.',
      tone: 'amber',
    },
    {
      label: 'Average Score',
      value: `${averageScore}%`,
      helper: 'Mean performance across the recorded result ledger.',
      tone: averageScore >= 70 ? 'violet' : 'rose',
    },
    {
      label: 'High Scores',
      value: distinctions,
      helper: `${summary.students_promoted ?? 0} students have already been promoted overall.`,
      tone: 'violet',
    },
  ];
}

export function buildSchoolStructureMetrics(
  sessions = [],
  enrollments = [],
  classrooms = [],
  subjects = [],
  terms = [],
) {
  return [
    {
      label: 'Sessions',
      value: sessions?.length ?? 0,
      helper: 'Academic calendars currently defined for the school workflow.',
      tone: 'violet',
    },
    {
      label: 'Enrollments',
      value: enrollments?.length ?? 0,
      helper: 'Students already placed into a session, term, and classroom structure.',
      tone: 'sky',
    },
    {
      label: 'Classes',
      value: classrooms?.length ?? 0,
      helper: 'Streams and classrooms currently available for placement and teaching operations.',
      tone: 'emerald',
    },
    {
      label: 'Subjects',
      value: subjects?.length ?? 0,
      helper: 'Teaching subjects already configured for academic delivery and assessment.',
      tone: 'amber',
    },
    {
      label: 'Terms',
      value: terms?.length ?? 0,
      helper: 'Academic terms now active across the current school calendar setup.',
      tone: 'violet',
    },
  ];
}

export function buildSchoolStructureDeskMetrics(
  sessions = [],
  enrollments = [],
  classrooms = [],
  subjects = [],
  terms = [],
  students = [],
) {
  const activeSessions = sessions.filter((session) => session.is_active !== false).length;
  const activeTerms = terms.filter((term) => term.is_active !== false).length;
  const unplacedStudents = students.filter((student) => (student.enrollments?.length ?? 0) === 0).length;
  const fullClasses = classrooms.filter(
    (entry) => Number(entry.enrollments?.length ?? 0) >= Number(entry.capacity || 0) && Number(entry.capacity || 0) > 0,
  ).length;

  return [
    ...buildSchoolStructureMetrics(sessions, enrollments, classrooms, subjects, terms),
    {
      label: 'Active Terms',
      value: activeTerms,
      helper: 'Teaching windows currently active inside the academic calendar.',
      tone: 'sky',
    },
    {
      label: 'Unplaced Students',
      value: unplacedStudents,
      helper: 'Students still registered but not yet attached to the class structure.',
      tone: 'amber',
    },
    {
      label: 'Full Classes',
      value: fullClasses,
      helper: 'Classrooms already at or above visible capacity and likely to need balancing.',
      tone: 'rose',
    },
    {
      label: 'Active Sessions',
      value: activeSessions,
      helper: 'Academic session windows currently live for planning and enrollment.',
      tone: 'violet',
    },
  ];
}

export function buildSchoolStudentMetrics(summary = {}, formatCurrency) {
  return [
    {
      label: 'Enrolled',
      value: summary.enrolled_students ?? 0,
      helper: 'Students currently active in the academic register.',
      tone: 'violet',
    },
    {
      label: 'Fees Collected',
      value: formatCurrency(summary.fees_collected ?? 0),
      helper: 'School fee revenue already captured in the current reporting view.',
      tone: 'emerald',
    },
    {
      label: 'Attendance Rate',
      value: `${summary.attendance_rate ?? 0}%`,
      helper: 'Overall presence signal available to school owners and admin staff.',
      tone: 'sky',
    },
  ];
}

export function buildSchoolAdmissionsMetrics(students = []) {
  const activeStudents = students.filter((student) => (student.status || 'active') === 'active').length;
  const alumniStudents = students.filter((student) => Boolean(student.is_alumni)).length;
  const withGuardians = students.filter((student) => (student.guardians?.length ?? 0) > 0).length;
  const unplacedStudents = students.filter((student) => (student.enrollments?.length ?? 0) === 0).length;
  const latestAdmission = [...students]
    .sort((left, right) => String(right.admitted_on || '').localeCompare(String(left.admitted_on || '')))[0];

  return [
    {
      label: 'Active Learners',
      value: activeStudents,
      helper: 'Students currently active in the admissions register.',
      tone: 'emerald',
    },
    {
      label: 'Guardian Coverage',
      value: withGuardians,
      helper: 'Student records already carrying at least one guardian contact.',
      tone: 'sky',
    },
    {
      label: 'Awaiting Placement',
      value: unplacedStudents,
      helper: 'Students registered but not yet enrolled into class structure.',
      tone: 'amber',
    },
    {
      label: 'Alumni',
      value: alumniStudents,
      helper: 'Students already marked as graduated or alumni.',
      tone: 'violet',
    },
    {
      label: 'Latest Admission',
      value: latestAdmission?.full_name || 'No admissions yet',
      helper: latestAdmission?.admitted_on
        ? `Admitted on ${latestAdmission.admitted_on}.`
        : 'No recent admissions have been captured yet.',
      tone: latestAdmission ? 'rose' : 'slate',
    },
  ];
}

export function buildSchoolFeeMetrics(summary = {}, debtors = [], formatCurrency) {
  return [
    {
      label: 'Collected',
      value: formatCurrency(summary.fees_collected ?? 0),
      helper: 'Fee revenue already captured across the current school finance cycle.',
      tone: 'emerald',
    },
    {
      label: 'Outstanding',
      value: formatCurrency(summary.outstanding_fees ?? 0),
      helper: 'Student balances still unpaid and needing follow-up from the finance office.',
      tone: 'amber',
    },
    {
      label: 'Debtors',
      value: debtors?.length ?? 0,
      helper: 'Students currently appearing on the active debtors report.',
      tone: 'rose',
    },
  ];
}

export function buildSchoolAttendancePayload(form = {}) {
  return {
    student_id: Number(form.student_id),
    academic_term_id: Number(form.academic_term_id),
    attendance_date: form.attendance_date,
    status: form.status,
    notes: form.notes,
  };
}

export function buildSchoolResultPayload(form = {}) {
  return {
    student_id: Number(form.student_id),
    academic_term_id: Number(form.academic_term_id),
    school_subject_id: Number(form.school_subject_id),
    score: Number(form.score || 0),
    teacher_comment: form.teacher_comment,
  };
}

export function buildSchoolSessionPayload(form = {}) {
  return {
    ...form,
    is_active: true,
  };
}

export function buildSchoolTermPayload(form = {}) {
  return {
    academic_session_id: Number(form.academic_session_id),
    name: form.name,
    starts_on: form.starts_on,
    ends_on: form.ends_on,
    is_active: true,
  };
}

export function buildSchoolClassPayload(form = {}) {
  return {
    ...form,
    capacity: Number(form.capacity || 0),
  };
}

export function buildSchoolEnrollmentPayload(form = {}) {
  return {
    student_id: Number(form.student_id),
    academic_session_id: Number(form.academic_session_id),
    academic_term_id: Number(form.academic_term_id),
    school_classroom_id: Number(form.school_classroom_id),
  };
}

export function buildSchoolStudentPayload(form = {}) {
  return {
    full_name: form.full_name,
    date_of_birth: form.date_of_birth || null,
    gender: form.gender,
    phone: form.phone,
    email: form.email || null,
    admitted_on: form.admitted_on,
    guardian: {
      full_name: form.guardian_name,
      relationship: form.guardian_relationship,
      phone: form.guardian_phone,
      email: form.guardian_email || null,
      address: form.guardian_address || null,
    },
  };
}

export function buildSchoolFeeStructurePayload(form = {}) {
  return {
    academic_session_id: Number(form.academic_session_id),
    academic_term_id: Number(form.academic_term_id),
    school_classroom_id: form.school_classroom_id ? Number(form.school_classroom_id) : null,
    name: form.name,
    amount: Number(form.amount || 0),
    discount_amount: Number(form.discount_amount || 0),
    scholarship_amount: Number(form.scholarship_amount || 0),
  };
}

export function buildSchoolFeePaymentPayload(form = {}) {
  return {
    student_id: Number(form.student_id),
    school_fee_structure_id: Number(form.school_fee_structure_id),
    amount_paid: Number(form.amount_paid || 0),
    payment_method: form.payment_method,
    paid_at: form.paid_at || null,
  };
}

export function buildSchoolAttendanceCard(entry = {}) {
  return {
    id: entry.id,
    title: entry.student?.full_name || 'Student',
    statusLabel: `${entry.attendance_date} - ${entry.status}`,
    termLabel: entry.term?.name || 'No term linked',
    notesLabel: entry.notes || 'No notes',
  };
}

export function buildSchoolResultCard(entry = {}) {
  return {
    id: entry.id,
    title: entry.student?.full_name || 'Student',
    admissionLabel: entry.student?.admission_number || 'No admission number',
    scoreLabel: `${entry.subject?.name || 'Subject'} - ${entry.score}% (${entry.grade})`,
    termLabel: entry.term?.name || 'No term linked',
    departmentLabel: entry.subject?.department || 'No department linked',
    commentLabel: entry.teacher_comment || 'No comment',
  };
}

export function filterSchoolResults(results = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return results;
  }

  return results.filter((entry) => {
    const fields = [
      entry.student?.full_name,
      entry.student?.admission_number,
      entry.subject?.name,
      entry.subject?.department,
      entry.term?.name,
      entry.teacher_comment,
      entry.grade,
      entry.score,
    ];

    return fields.some((field) => String(field ?? '').toLowerCase().includes(query));
  });
}

export function filterSchoolSessions(sessions = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return sessions;
  }

  return sessions.filter((session) =>
    [session.name, session.starts_on, session.ends_on, session.is_active ? 'active' : 'inactive']
      .some((field) => String(field ?? '').toLowerCase().includes(query))
  );
}

export function filterSchoolTerms(terms = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return terms;
  }

  return terms.filter((term) =>
    [term.name, term.session?.name, term.starts_on, term.ends_on, term.is_active ? 'active' : 'inactive']
      .some((field) => String(field ?? '').toLowerCase().includes(query))
  );
}

export function filterSchoolSubjects(subjects = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return subjects;
  }

  return subjects.filter((subject) =>
    [subject.name, subject.department, subject.teacher?.name]
      .some((field) => String(field ?? '').toLowerCase().includes(query))
  );
}

export function filterSchoolClasses(classrooms = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return classrooms;
  }

  return classrooms.filter((entry) =>
    [entry.name, entry.stream, entry.department, entry.capacity]
      .some((field) => String(field ?? '').toLowerCase().includes(query))
  );
}

export function filterSchoolEnrollments(enrollments = [], searchTerm = '') {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return enrollments;
  }

  return enrollments.filter((entry) =>
    [
      entry.student?.full_name,
      entry.classroom?.name,
      entry.term?.name,
      entry.session?.name,
      entry.enrollment_status,
    ]
      .some((field) => String(field ?? '').toLowerCase().includes(query))
  );
}

export function buildSchoolClassroomCard(entry = {}, subjectCount = 0) {
  return {
    id: entry.id,
    title: `${entry.name || 'Class'}${entry.stream ? ` - ${entry.stream}` : ''}`,
    departmentLabel: `${entry.department || 'General'} - Capacity ${entry.capacity || 0}`,
    enrollmentLabel: `${entry.enrollments?.length ?? 0} students enrolled`,
    subjectLabel: `${subjectCount} subjects`,
    balanceLabel:
      Number(entry.capacity || 0) > 0
        ? `${Math.max(Number(entry.capacity || 0) - Number(entry.enrollments?.length ?? 0), 0)} seats left`
        : 'Capacity not set',
  };
}

export function buildSchoolSessionCard(session = {}, termCount = 0) {
  return {
    id: session.id,
    title: session.name || 'Academic session',
    durationLabel: `${session.starts_on || 'No start date'} - ${session.ends_on || 'No end date'}`,
    termLabel: `${termCount} terms linked`,
    statusLabel: session.is_active ? 'Active session' : 'Inactive session',
  };
}

export function buildSchoolTermCard(term = {}) {
  return {
    id: term.id,
    title: term.name || 'Academic term',
    sessionLabel: term.session?.name || 'No session linked',
    durationLabel: `${term.starts_on || 'No start date'} - ${term.ends_on || 'No end date'}`,
    statusLabel: term.is_active ? 'Active term' : 'Inactive term',
  };
}

export function buildSchoolSubjectCard(subject = {}) {
  return {
    id: subject.id,
    title: subject.name || 'Subject',
    departmentLabel: subject.department || 'General department',
    teacherLabel: subject.teacher?.name || 'Teacher not assigned',
  };
}

export function buildSchoolEnrollmentCard(enrollment = {}) {
  return {
    id: enrollment.id,
    title: enrollment.student?.full_name || 'Student',
    classLabel: enrollment.classroom?.name || 'No class assigned',
    termLabel: enrollment.term?.name || 'No term linked',
    sessionLabel: enrollment.session?.name || 'No session linked',
    statusLabel: enrollment.enrollment_status || 'enrolled',
  };
}

export function buildSchoolStudentCard(student = {}) {
  const latestEnrollment = student.enrollments?.at(-1);
  const latestGuardian = student.guardians?.[0];

  return {
    id: student.id,
    title: student.full_name || 'Student',
    admissionLabel: `${student.admission_number || 'No admission number'} - ${latestEnrollment?.classroom?.name || 'Not yet enrolled'}`,
    guardianLabel: `Guardian: ${latestGuardian?.full_name || 'Not captured'}${latestGuardian?.phone ? ` - ${latestGuardian.phone}` : ''}`,
    guardianSupportLabel: latestGuardian?.relationship
      ? `${latestGuardian.relationship}${latestGuardian.email ? ` - ${latestGuardian.email}` : ''}`
      : latestGuardian?.email || 'No guardian support detail',
    contactLabel: student.phone || student.email || 'No student contact',
    admittedOnLabel: student.admitted_on || 'Admission date not captured',
    statusLabel: student.status || 'Unknown',
    alumniLabel: student.is_alumni ? 'Alumni' : 'Current student',
    feePaymentsLabel: `${student.fee_payments?.length ?? 0} fee payments`,
  };
}

export function buildSchoolDebtorCard(debtor = {}, formatCurrency) {
  return {
    id: debtor.student_id,
    title: debtor.full_name || 'Student',
    classroomLabel: debtor.classroom || 'No class assigned',
    expectedVsPaidLabel: `Expected: ${formatCurrency(debtor.expected)} - Paid: ${formatCurrency(debtor.paid)}`,
    balanceLabel: `Balance: ${formatCurrency(debtor.balance)}`,
  };
}

export function buildSchoolFeePaymentCard(payment = {}, formatCurrency) {
  return {
    id: payment.id,
    title: payment.student?.full_name || 'Student',
    methodLabel: `${payment.structure?.name || 'Fee structure'} - ${payment.payment_method || 'cash'}`,
    contextLabel: `${payment.structure?.classroom?.name || 'General'}${payment.receipt_number ? ` - ${payment.receipt_number}` : ''}`,
    paidAtLabel: payment.paid_at || 'Payment date not captured',
    amountLabel: formatCurrency(payment.amount_paid),
  };
}

export function buildSchoolFeeStructureCard(structure = {}, formatCurrency) {
  const expected = Math.max(
    Number(structure.amount || 0) - Number(structure.discount_amount || 0) - Number(structure.scholarship_amount || 0),
    0
  );
  const collected = Number(structure.payments?.reduce((sum, payment) => sum + Number(payment.amount_paid || 0), 0) || 0);
  const outstanding = Math.max(expected - collected, 0);

  return {
    id: structure.id,
    title: structure.name || 'Fee structure',
    classLabel: structure.classroom?.name || 'General fee structure',
    amountLabel: formatCurrency(structure.amount || 0),
    discountLabel: formatCurrency(structure.discount_amount || 0),
    scholarshipLabel: formatCurrency(structure.scholarship_amount || 0),
    expectedLabel: formatCurrency(expected),
    collectedLabel: formatCurrency(collected),
    outstandingLabel: formatCurrency(outstanding),
  };
}
