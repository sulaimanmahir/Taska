import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useBusinessType } from '../config';
import Card, { CardHeader } from '../components/Card';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import { getErrorMessage } from '../lib/apiFeedback';
import {
  buildSchoolAttendanceCard,
  buildSchoolAttendancePayload,
  buildSchoolOverviewMetrics,
  buildSchoolPerformanceMetrics,
  buildSchoolResultCard,
  buildSchoolResultPayload,
  createSchoolAttendanceForm,
  createSchoolResultForm,
} from '../lib/school';

function QueryErrorPanel({ message, onRetry }) {
  return (
    <Card className="border-rose-200 bg-rose-50/60">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">Workspace issue</p>
          <p className="mt-2 text-sm text-rose-700">{message}</p>
        </div>
        <button
          type="button"
          className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
          onClick={onRetry}
        >
          Retry loading
        </button>
      </div>
    </Card>
  );
}

export default function Attendance() {
  const { color } = useBusinessType();
  const queryClient = useQueryClient();
  const [attendanceForm, setAttendanceForm] = useState(createSchoolAttendanceForm);
  const [resultForm, setResultForm] = useState(createSchoolResultForm);

  const overviewQuery = useQuery({
    queryKey: ['school-overview'],
    queryFn: () => api.get('/school/overview').then((response) => response.data),
  });

  const studentsQuery = useQuery({
    queryKey: ['school-students'],
    queryFn: () => api.get('/school/students').then((response) => response.data ?? []),
  });

  const termsQuery = useQuery({
    queryKey: ['school-terms'],
    queryFn: () => api.get('/school/terms').then((response) => response.data ?? []),
  });

  const subjectsQuery = useQuery({
    queryKey: ['school-subjects'],
    queryFn: () => api.get('/school/subjects').then((response) => response.data ?? []),
  });

  const attendanceQuery = useQuery({
    queryKey: ['school-attendance'],
    queryFn: () => api.get('/school/attendance').then((response) => response.data ?? []),
  });

  const resultsQuery = useQuery({
    queryKey: ['school-results'],
    queryFn: () => api.get('/school/results').then((response) => response.data ?? []),
  });

  const overview = overviewQuery.data;
  const students = studentsQuery.data ?? [];
  const terms = termsQuery.data ?? [];
  const subjects = subjectsQuery.data ?? [];
  const attendance = attendanceQuery.data ?? [];
  const results = resultsQuery.data ?? [];
  const attendanceQueries = [overviewQuery, studentsQuery, termsQuery, subjectsQuery, attendanceQuery, resultsQuery];

  const refresh = () => {
    ['school-overview', 'school-attendance', 'school-results'].forEach((key) =>
      queryClient.invalidateQueries({ queryKey: [key] })
    );
  };

  const saveAttendance = useMutation({
    mutationFn: (payload) => api.post('/school/attendance', payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      setAttendanceForm(createSchoolAttendanceForm());
    },
  });

  const saveResult = useMutation({
    mutationFn: (payload) => api.post('/school/results', payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      setResultForm(createSchoolResultForm());
    },
  });

  const summary = overview?.summary ?? {};
  const attendanceCards = attendance.map((entry) => buildSchoolAttendanceCard(entry));
  const resultCards = results.map((entry) => buildSchoolResultCard(entry));
  const loadError = getErrorMessage(
    attendanceQueries.find((query) => query.isError)?.error,
    'We could not load part of the attendance workspace right now. Please try again.'
  );

  return (
    <div className="space-y-5">
      {loadError ? (
        <QueryErrorPanel
          message={loadError}
          onRetry={() => {
            attendanceQueries.forEach((query) => {
              query.refetch();
            });
          }}
        />
      ) : null}

      <PageHero
        eyebrow="Daily learning signal"
        title="Attendance and results"
        description="Track class presence, score entry, and performance signals that drive promotion and owner confidence."
        accent={color}
        metrics={buildSchoolOverviewMetrics(summary)}
      />

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-5">
        {buildSchoolPerformanceMetrics(attendance, results, summary).map((metric) => (
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
          <CardHeader title="Mark Attendance" subtitle="Present, absent, late, or excused" />
          <form className="space-y-3" onSubmit={(event) => {
            event.preventDefault();
            saveAttendance.mutate(buildSchoolAttendancePayload(attendanceForm));
          }}>
            <select className="input" value={attendanceForm.student_id} onChange={(event) => setAttendanceForm({ ...attendanceForm, student_id: event.target.value })}>
              <option value="">Select student</option>
              {students.map((student) => <option key={student.id} value={student.id}>{student.full_name}</option>)}
            </select>
            <select className="input" value={attendanceForm.academic_term_id} onChange={(event) => setAttendanceForm({ ...attendanceForm, academic_term_id: event.target.value })}>
              <option value="">Select term</option>
              {terms.map((term) => <option key={term.id} value={term.id}>{term.name}</option>)}
            </select>
            <input className="input" type="date" value={attendanceForm.attendance_date} onChange={(event) => setAttendanceForm({ ...attendanceForm, attendance_date: event.target.value })} />
            <select className="input" value={attendanceForm.status} onChange={(event) => setAttendanceForm({ ...attendanceForm, status: event.target.value })}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </select>
            <textarea className="input min-h-[112px] resize-y py-3" value={attendanceForm.notes} onChange={(event) => setAttendanceForm({ ...attendanceForm, notes: event.target.value })} placeholder="Notes" />
            <button type="submit" className="h-11 w-full rounded-xl bg-[var(--color-brand)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-brand-strong)]">
              {saveAttendance.isPending ? 'Saving attendance...' : 'Save attendance'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Enter Result" subtitle="Score, grade, and teacher comment" />
          <form className="space-y-3" onSubmit={(event) => {
            event.preventDefault();
            saveResult.mutate(buildSchoolResultPayload(resultForm));
          }}>
            <select className="input" value={resultForm.student_id} onChange={(event) => setResultForm({ ...resultForm, student_id: event.target.value })}>
              <option value="">Select student</option>
              {students.map((student) => <option key={student.id} value={student.id}>{student.full_name}</option>)}
            </select>
            <select className="input" value={resultForm.academic_term_id} onChange={(event) => setResultForm({ ...resultForm, academic_term_id: event.target.value })}>
              <option value="">Select term</option>
              {terms.map((term) => <option key={term.id} value={term.id}>{term.name}</option>)}
            </select>
            <select className="input" value={resultForm.school_subject_id} onChange={(event) => setResultForm({ ...resultForm, school_subject_id: event.target.value })}>
              <option value="">Select subject</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
            <input className="input" value={resultForm.score} onChange={(event) => setResultForm({ ...resultForm, score: event.target.value })} placeholder="Score" />
            <textarea className="input min-h-[112px] resize-y py-3" value={resultForm.teacher_comment} onChange={(event) => setResultForm({ ...resultForm, teacher_comment: event.target.value })} placeholder="Teacher comment" />
            <button type="submit" className="h-11 w-full rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700">
              {saveResult.isPending ? 'Saving result...' : 'Save result'}
            </button>
          </form>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Attendance Log" subtitle="Latest roll-call records and classroom follow-up signal" />
          <div className="space-y-3">
            {attendanceCards.map((attendanceCard) => (
              <div key={attendanceCard.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{attendanceCard.title}</p>
                <p className="text-sm text-slate-500">{attendanceCard.statusLabel}</p>
                <p className="text-sm text-slate-500">{attendanceCard.termLabel}</p>
                <p className="text-sm text-slate-500">{attendanceCard.notesLabel}</p>
              </div>
            ))}
            {!attendanceCards.length ? (
              <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No attendance records have been captured yet.
              </p>
            ) : null}
          </div>
        </Card>

        <Card>
          <CardHeader title="Result Log" subtitle="Recent score entry, grading signal, and term context" />
          <div className="space-y-3">
            {resultCards.map((resultCard) => (
              <div key={resultCard.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{resultCard.title}</p>
                <p className="text-sm text-slate-500">{resultCard.scoreLabel}</p>
                <p className="text-sm text-slate-500">{resultCard.termLabel}</p>
                <p className="text-sm text-slate-500">{resultCard.commentLabel}</p>
              </div>
            ))}
            {!resultCards.length ? (
              <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No academic results have been entered yet.
              </p>
            ) : null}
          </div>
        </Card>
      </section>
    </div>
  );
}
