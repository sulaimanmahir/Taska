import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useBusinessType } from '../config';
import Card, { CardHeader } from '../components/Card';
import EmptyState from '../components/EmptyState';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/apiFeedback';
import {
  buildSchoolClassPayload,
  buildSchoolClassroomCard,
  buildSchoolEnrollmentCard,
  buildSchoolEnrollmentPayload,
  buildSchoolSessionCard,
  buildSchoolSessionPayload,
  buildSchoolStructureDeskMetrics,
  buildSchoolSubjectCard,
  buildSchoolTermCard,
  buildSchoolTermPayload,
  createSchoolClassForm,
  createSchoolEnrollmentForm,
  createSchoolSessionForm,
  createSchoolSubjectForm,
  createSchoolTermForm,
  filterSchoolClasses,
  filterSchoolEnrollments,
  filterSchoolSessions,
  filterSchoolSubjects,
  filterSchoolTerms,
} from '../lib/school';

function QueryErrorPanel({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p>{message}</p>
        <button
          type="button"
          onClick={() => {
            void onRetry();
          }}
          className="self-start rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default function Classes() {
  const { labels } = useBusinessType();
  const queryClient = useQueryClient();
  const { toast, setToast, clearToast } = useToast();
  const [sessionForm, setSessionForm] = useState(createSchoolSessionForm);
  const [termForm, setTermForm] = useState(createSchoolTermForm);
  const [classForm, setClassForm] = useState(createSchoolClassForm);
  const [subjectForm, setSubjectForm] = useState(createSchoolSubjectForm);
  const [enrollmentForm, setEnrollmentForm] = useState(createSchoolEnrollmentForm);
  const [sessionSearch, setSessionSearch] = useState('');
  const [termSearch, setTermSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [classSearch, setClassSearch] = useState('');
  const [enrollmentSearch, setEnrollmentSearch] = useState('');

  const { data, error, refetch } = useQuery({
    queryKey: ['school-structure-desk'],
    queryFn: async () => {
      const [sessions, terms, classrooms, subjects, students, enrollments] = await Promise.all([
        api.get('/school/sessions').then((response) => response.data ?? []),
        api.get('/school/terms').then((response) => response.data ?? []),
        api.get('/school/classes').then((response) => response.data ?? []),
        api.get('/school/subjects').then((response) => response.data ?? []),
        api.get('/school/students').then((response) => response.data ?? []),
        api.get('/school/enrollments').then((response) => response.data ?? []),
      ]);

      return { sessions, terms, classrooms, subjects, students, enrollments };
    },
    staleTime: 60000,
  });

  const refresh = () => {
    [
      'school-structure-desk',
      'school-sessions',
      'school-terms',
      'school-classes',
      'school-subjects',
      'school-enrollments',
      'school-students',
      'school-overview',
    ].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
  };

  const createSession = useMutation({
    mutationFn: (payload) => api.post('/school/sessions', payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      setSessionForm(createSchoolSessionForm());
      clearToast();
      setToast({ tone: 'success', message: 'Academic session saved into the school structure desk.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that academic session right now.') });
    },
  });

  const createTerm = useMutation({
    mutationFn: (payload) => api.post('/school/terms', payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      setTermForm(createSchoolTermForm());
      clearToast();
      setToast({ tone: 'success', message: 'Academic term saved into the active planning calendar.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that academic term right now.') });
    },
  });

  const createClassroom = useMutation({
    mutationFn: (payload) => api.post('/school/classes', payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      setClassForm(createSchoolClassForm());
      clearToast();
      setToast({ tone: 'success', message: 'Classroom saved into the placement structure.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that classroom right now.') });
    },
  });

  const createSubject = useMutation({
    mutationFn: (payload) => api.post('/school/subjects', payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      setSubjectForm(createSchoolSubjectForm());
      clearToast();
      setToast({ tone: 'success', message: 'Subject added to the curriculum register.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that subject right now.') });
    },
  });

  const createEnrollment = useMutation({
    mutationFn: (payload) => api.post('/school/enrollments', payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      setEnrollmentForm(createSchoolEnrollmentForm());
      clearToast();
      setToast({ tone: 'success', message: 'Student enrolled into the academic structure successfully.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that student enrollment right now.') });
    },
  });

  const sessions = data?.sessions || [];
  const terms = data?.terms || [];
  const classrooms = data?.classrooms || [];
  const subjects = data?.subjects || [];
  const students = data?.students || [];
  const enrollments = data?.enrollments || [];

  const metrics = useMemo(
    () => buildSchoolStructureDeskMetrics(sessions, enrollments, classrooms, subjects, terms, students),
    [sessions, enrollments, classrooms, subjects, terms, students],
  );
  const sessionCards = useMemo(
    () => filterSchoolSessions(sessions, sessionSearch).map((session) => buildSchoolSessionCard(
      session,
      terms.filter((term) => term.academic_session_id === session.id).length,
    )),
    [sessions, sessionSearch, terms],
  );
  const termCards = useMemo(
    () => filterSchoolTerms(terms, termSearch).map((term) => buildSchoolTermCard(term)),
    [terms, termSearch],
  );
  const subjectCards = useMemo(
    () => filterSchoolSubjects(subjects, subjectSearch).map((subject) => buildSchoolSubjectCard(subject)),
    [subjects, subjectSearch],
  );
  const classCards = useMemo(
    () => filterSchoolClasses(classrooms, classSearch).map((entry) => buildSchoolClassroomCard(entry, subjects.length)),
    [classrooms, classSearch, subjects.length],
  );
  const enrollmentCards = useMemo(
    () => filterSchoolEnrollments(enrollments, enrollmentSearch).map((entry) => buildSchoolEnrollmentCard(entry)),
    [enrollments, enrollmentSearch],
  );

  return (
    <div className="space-y-5">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Academic structure feedback" />

      <PageHero
        eyebrow="Academic Structure"
        title={`${labels.classes || 'Classes'}, sessions, and subjects`}
        description="Shape the academic calendar, curriculum, class balance, and student placement from one stronger school structure workspace."
      />

      {error ? (
        <QueryErrorPanel
          message={getErrorMessage(error, 'We could not load the academic structure desk right now.')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-9">
        {metrics.map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            tone={metric.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Academic Calendar" subtitle="Create session windows and teaching terms with cleaner planning control." />
          <div className="space-y-5">
            <form
              className="grid gap-3 md:grid-cols-3"
              onSubmit={(event) => {
                event.preventDefault();
                clearToast();
                createSession.mutate(buildSchoolSessionPayload(sessionForm));
              }}
            >
              <input className="input md:col-span-3" value={sessionForm.name} onChange={(event) => setSessionForm({ ...sessionForm, name: event.target.value })} placeholder="Academic session name" />
              <input className="input" type="date" value={sessionForm.starts_on} onChange={(event) => setSessionForm({ ...sessionForm, starts_on: event.target.value })} />
              <input className="input" type="date" value={sessionForm.ends_on} onChange={(event) => setSessionForm({ ...sessionForm, ends_on: event.target.value })} />
              <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white">
                {createSession.isPending ? 'Saving session...' : 'Save session'}
              </button>
            </form>

            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                clearToast();
                createTerm.mutate(buildSchoolTermPayload(termForm));
              }}
            >
              <select className="input md:col-span-2" value={termForm.academic_session_id} onChange={(event) => setTermForm({ ...termForm, academic_session_id: event.target.value })}>
                <option value="">Select session</option>
                {sessions.map((session) => <option key={session.id} value={session.id}>{session.name}</option>)}
              </select>
              <input className="input md:col-span-2" value={termForm.name} onChange={(event) => setTermForm({ ...termForm, name: event.target.value })} placeholder="Term name" />
              <input className="input" type="date" value={termForm.starts_on} onChange={(event) => setTermForm({ ...termForm, starts_on: event.target.value })} />
              <input className="input" type="date" value={termForm.ends_on} onChange={(event) => setTermForm({ ...termForm, ends_on: event.target.value })} />
              <button type="submit" className="rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-semibold text-white md:col-span-2">
                {createTerm.isPending ? 'Saving term...' : 'Save term'}
              </button>
            </form>
          </div>
        </Card>

        <Card>
          <CardHeader title="Classes and Subjects" subtitle="Build class streams and curriculum structure without the older generic form pattern." />
          <div className="space-y-5">
            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                clearToast();
                createClassroom.mutate(buildSchoolClassPayload(classForm));
              }}
            >
              <input className="input" value={classForm.name} onChange={(event) => setClassForm({ ...classForm, name: event.target.value })} placeholder="Class name" />
              <input className="input" value={classForm.stream} onChange={(event) => setClassForm({ ...classForm, stream: event.target.value })} placeholder="Stream" />
              <input className="input" value={classForm.department} onChange={(event) => setClassForm({ ...classForm, department: event.target.value })} placeholder="Department" />
              <input className="input" type="number" min="1" value={classForm.capacity} onChange={(event) => setClassForm({ ...classForm, capacity: event.target.value })} placeholder="Capacity" />
              <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white md:col-span-2">
                {createClassroom.isPending ? 'Saving class...' : 'Save class'}
              </button>
            </form>

            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                clearToast();
                createSubject.mutate(subjectForm);
              }}
            >
              <input className="input" value={subjectForm.name} onChange={(event) => setSubjectForm({ ...subjectForm, name: event.target.value })} placeholder="Subject name" />
              <input className="input" value={subjectForm.department} onChange={(event) => setSubjectForm({ ...subjectForm, department: event.target.value })} placeholder="Department" />
              <button type="submit" className="rounded-2xl bg-cyan-700 px-5 py-4 text-sm font-semibold text-white md:col-span-2">
                {createSubject.isPending ? 'Saving subject...' : 'Save subject'}
              </button>
            </form>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader title="Enroll Student" subtitle="Place learners into the current academic session, term, and class structure." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              createEnrollment.mutate(buildSchoolEnrollmentPayload(enrollmentForm));
            }}
          >
            <select className="input" value={enrollmentForm.student_id} onChange={(event) => setEnrollmentForm({ ...enrollmentForm, student_id: event.target.value })}>
              <option value="">Select student</option>
              {students.map((student) => <option key={student.id} value={student.id}>{student.full_name}</option>)}
            </select>
            <select className="input" value={enrollmentForm.academic_session_id} onChange={(event) => setEnrollmentForm({ ...enrollmentForm, academic_session_id: event.target.value })}>
              <option value="">Select session</option>
              {sessions.map((session) => <option key={session.id} value={session.id}>{session.name}</option>)}
            </select>
            <select className="input" value={enrollmentForm.academic_term_id} onChange={(event) => setEnrollmentForm({ ...enrollmentForm, academic_term_id: event.target.value })}>
              <option value="">Select term</option>
              {terms.map((term) => <option key={term.id} value={term.id}>{term.name}</option>)}
            </select>
            <select className="input" value={enrollmentForm.school_classroom_id} onChange={(event) => setEnrollmentForm({ ...enrollmentForm, school_classroom_id: event.target.value })}>
              <option value="">Select class</option>
              {classrooms.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}{entry.stream ? ` - ${entry.stream}` : ''}</option>)}
            </select>
            <button type="submit" className="w-full rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-semibold text-white">
              {createEnrollment.isPending ? 'Saving enrollment...' : 'Save enrollment'}
            </button>
          </form>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader
              title="Class Register"
              subtitle="Current classes with capacity pressure and visible seat balance."
              className="mb-0"
            />
            <input
              className="input"
              value={classSearch}
              onChange={(event) => setClassSearch(event.target.value)}
              placeholder="Search class, stream, department, or capacity..."
            />
          </div>
          <div className="mt-4 space-y-4">
            {classCards.map((classroomCard) => (
              <div key={classroomCard.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{classroomCard.title}</p>
                    <p className="text-sm text-slate-500">{classroomCard.departmentLabel}</p>
                    <p className="text-sm text-slate-500">{classroomCard.enrollmentLabel}</p>
                  </div>
                  <div className="text-right text-sm text-slate-600">
                    <p>{classroomCard.subjectLabel}</p>
                    <p className="mt-1 text-xs text-slate-500">{classroomCard.balanceLabel}</p>
                  </div>
                </div>
              </div>
            ))}
            {!classCards.length ? (
              <EmptyState
                icon="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                title="No classes matched your search"
                description="Try a different search term to find the class you're looking for."
              />
            ) : null}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader
              title="Academic Sessions"
              subtitle="Calendar years and planning windows with live search."
              className="mb-0"
            />
            <input
              className="input"
              value={sessionSearch}
              onChange={(event) => setSessionSearch(event.target.value)}
              placeholder="Search session, dates, or status..."
            />
          </div>
          <div className="mt-4 space-y-3">
            {sessionCards.map((sessionCard) => (
              <div key={sessionCard.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{sessionCard.title}</p>
                <p className="mt-1 text-sm text-slate-500">{sessionCard.durationLabel}</p>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  <span>{sessionCard.termLabel}</span>
                  <span>{sessionCard.statusLabel}</span>
                </div>
              </div>
            ))}
            {!sessionCards.length ? (
              <EmptyState
                icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                title="No academic sessions matched your search"
                description="Try a different search term."
                className="py-4"
              />
            ) : null}
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader
              title="Terms and Subjects"
              subtitle="Search teaching windows and curriculum structure from one panel."
              className="mb-0"
            />
            <input
              className="input"
              value={termSearch}
              onChange={(event) => setTermSearch(event.target.value)}
              placeholder="Search term, session, dates, or status..."
            />
          </div>
          <div className="mt-4 space-y-4">
            <div className="space-y-3">
              {termCards.map((termCard) => (
                <div key={termCard.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{termCard.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{termCard.sessionLabel}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    <span>{termCard.durationLabel}</span>
                    <span>{termCard.statusLabel}</span>
                  </div>
                </div>
              ))}
              {!termCards.length ? (
                <EmptyState
                  icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  title="No academic terms matched your search"
                  description="Try a different search term."
                  className="py-4"
                />
              ) : null}
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <input
                className="input"
                value={subjectSearch}
                onChange={(event) => setSubjectSearch(event.target.value)}
                placeholder="Search subject, department, or teacher..."
              />
              {subjectCards.map((subjectCard) => (
                <div key={subjectCard.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{subjectCard.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{subjectCard.departmentLabel}</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    {subjectCard.teacherLabel}
                  </p>
                </div>
              ))}
              {!subjectCards.length ? (
                <EmptyState
                  icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s4.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  title="No subjects matched your search"
                  description="Try a different search term."
                  className="py-4"
                />
              ) : null}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader
              title="Enrollment Register"
              subtitle="Who is placed where across the current academic structure."
              className="mb-0"
            />
            <input
              className="input"
              value={enrollmentSearch}
              onChange={(event) => setEnrollmentSearch(event.target.value)}
              placeholder="Search student, class, term, session, or status..."
            />
          </div>
          <div className="mt-4 space-y-3">
            {enrollmentCards.map((enrollmentCard) => (
              <div key={enrollmentCard.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{enrollmentCard.title}</p>
                <p className="mt-1 text-sm text-slate-500">{enrollmentCard.classLabel}</p>
                <p className="mt-1 text-sm text-slate-500">{enrollmentCard.termLabel}</p>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  <span>{enrollmentCard.sessionLabel}</span>
                  <span>{enrollmentCard.statusLabel}</span>
                </div>
              </div>
            ))}
            {!enrollmentCards.length ? (
              <EmptyState
                icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                title="No enrollments matched your search"
                description="Try a different student, class, term, session, or status."
                className="py-4"
              />
            ) : null}
          </div>
        </Card>
      </section>
    </div>
  );
}
