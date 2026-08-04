import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useBusinessType } from '../config';
import Card, { CardHeader } from '../components/Card';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import {
  buildSchoolAdmissionsMetrics,
  buildSchoolStudentCard,
  buildSchoolStudentMetrics,
  buildSchoolStudentPayload,
  createSchoolStudentForm,
} from '../lib/school';

function QueryErrorPanel({ message, onRetry }) {
  if (!message) {
    return null;
  }

  return (
    <Card className="border-rose-200 bg-rose-50">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-rose-800">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
        >
          Retry
        </button>
      </div>
    </Card>
  );
}

export default function Students() {
  const { labels } = useBusinessType();
  const queryClient = useQueryClient();
  const [studentForm, setStudentForm] = useState(createSchoolStudentForm);

  const overviewQuery = useQuery({
    queryKey: ['school-overview'],
    queryFn: () => api.get('/school/overview').then((response) => response.data),
  });

  const studentsQuery = useQuery({
    queryKey: ['school-students'],
    queryFn: () => api.get('/school/students').then((response) => response.data ?? []),
  });

  const overview = overviewQuery.data;
  const students = studentsQuery.data;
  const schoolQueries = [overviewQuery, studentsQuery];
  const loadError = schoolQueries.find((query) => query.isError)?.error
    ? 'We could not load part of the admissions desk right now. Please try again.'
    : '';

  const refreshSchool = () => {
    ['school-overview', 'school-students', 'school-enrollments', 'school-debtors'].forEach((key) =>
      queryClient.invalidateQueries({ queryKey: [key] })
    );
  };

  const createStudent = useMutation({
    mutationFn: (payload) => api.post('/school/students', payload).then((response) => response.data),
    onSuccess: () => {
      refreshSchool();
      setStudentForm(createSchoolStudentForm());
    },
  });

  const summary = overview?.summary ?? {};

  return (
    <div className="space-y-5">
      <PageHero
        eyebrow="Admissions Desk"
        title={`${labels.students || 'Students'} and guardian records`}
        description="Capture admissions, parent contacts, active learners, and the fee pressure that owners need to watch daily."
      />

      <QueryErrorPanel
        message={loadError}
        onRetry={() => {
          schoolQueries.forEach((query) => {
            void query.refetch();
          });
        }}
      />

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-3">
        {buildSchoolStudentMetrics(summary, formatCurrencyNGN).map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            tone={metric.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-5">
        {buildSchoolAdmissionsMetrics(students ?? []).map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            tone={metric.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader title="Register Student" subtitle="Admissions profile with guardian detail" />
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              createStudent.mutate(buildSchoolStudentPayload(studentForm));
            }}
          >
            <label className="space-y-2 text-sm text-slate-600">
              <span>Full name</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={studentForm.full_name} onChange={(event) => setStudentForm({ ...studentForm, full_name: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Gender</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={studentForm.gender} onChange={(event) => setStudentForm({ ...studentForm, gender: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Date of birth</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="date" value={studentForm.date_of_birth} onChange={(event) => setStudentForm({ ...studentForm, date_of_birth: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Student phone</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={studentForm.phone} onChange={(event) => setStudentForm({ ...studentForm, phone: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
              <span>Student email</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="email" value={studentForm.email} onChange={(event) => setStudentForm({ ...studentForm, email: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
              <span>Admission date</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="date" value={studentForm.admitted_on} onChange={(event) => setStudentForm({ ...studentForm, admitted_on: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Guardian name</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={studentForm.guardian_name} onChange={(event) => setStudentForm({ ...studentForm, guardian_name: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Relationship</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={studentForm.guardian_relationship} onChange={(event) => setStudentForm({ ...studentForm, guardian_relationship: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Guardian phone</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={studentForm.guardian_phone} onChange={(event) => setStudentForm({ ...studentForm, guardian_phone: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Guardian email</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="email" value={studentForm.guardian_email} onChange={(event) => setStudentForm({ ...studentForm, guardian_email: event.target.value })} />
            </label>
            <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
              <span>Guardian address</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={studentForm.guardian_address} onChange={(event) => setStudentForm({ ...studentForm, guardian_address: event.target.value })} />
            </label>
            <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white md:col-span-2">
              {createStudent.isPending ? 'Saving student...' : `Register ${labels.student || 'Student'}`}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Student Register" subtitle="Admissions number, guardian, and finance footprint" />
          <div className="space-y-3">
            {(students ?? []).map((student) => {
              const studentCard = buildSchoolStudentCard(student);

              return (
              <div key={studentCard.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{studentCard.title}</p>
                    <p className="text-sm text-slate-500">{studentCard.admissionLabel}</p>
                    <p className="text-sm text-slate-500">{studentCard.guardianLabel}</p>
                    <p className="text-sm text-slate-500">{studentCard.guardianSupportLabel}</p>
                    <p className="text-sm text-slate-500">{studentCard.contactLabel}</p>
                  </div>
                  <div className="text-right text-sm text-slate-600">
                    <p>{studentCard.statusLabel}</p>
                    <p>{studentCard.alumniLabel}</p>
                    <p>{studentCard.admittedOnLabel}</p>
                    <p>{studentCard.feePaymentsLabel}</p>
                  </div>
                </div>
              </div>
              );
            })}
            {!students?.length ? (
              <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No student admissions have been recorded yet.
              </p>
            ) : null}
          </div>
        </Card>
      </section>
    </div>
  );
}
