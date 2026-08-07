import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useBusinessType } from '../config';
import Card, { CardHeader } from '../components/Card';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import { getErrorMessage } from '../lib/apiFeedback';
import BeautyOps from './BeautyOps';
import ServiceOps from './ServiceOps';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import {
  buildHealthAppointmentCard,
  buildHealthAppointmentPayload,
  buildHealthApprovalCard,
  buildHealthClinicalDeskMetrics,
  buildHealthLabCatalogCard,
  buildHealthLabRequestPayload,
  buildHealthLabSampleCollectionPayload,
  buildHealthLabTestOptionLabel,
  buildHealthLabTestPayload,
  buildHealthLabWorkbenchCard,
  buildHealthRejectedSpecimenCard,
  buildHealthResultPayload,
  buildHealthSpecimenRejectionPayload,
  createHealthAppointmentForm,
  createHealthLabRequestForm,
  createHealthLabTestForm,
  createHealthResultForm,
  filterHealthAppointments,
  filterHealthLabRequests,
  getHealthPendingApprovals,
  getHealthRejectedSpecimens,
} from '../lib/health';

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

function AppointmentsGeneral({ labels }) {
  const queryClient = useQueryClient();
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [labSearch, setLabSearch] = useState('');
  const [appointmentForm, setAppointmentForm] = useState(() => createHealthAppointmentForm());
  const [labTestForm, setLabTestForm] = useState(createHealthLabTestForm);
  const [labRequestForm, setLabRequestForm] = useState(createHealthLabRequestForm);
  const [resultForms, setResultForms] = useState({});

  const overviewQuery = useQuery({
    queryKey: ['health-overview'],
    queryFn: () => api.get('/health/overview').then((response) => response.data),
  });

  const patientsQuery = useQuery({
    queryKey: ['health-patients'],
    queryFn: () => api.get('/health/patients').then((response) => response.data ?? []),
  });

  const appointmentsQuery = useQuery({
    queryKey: ['health-appointments'],
    queryFn: () => api.get('/health/appointments').then((response) => response.data ?? []),
  });

  const consultationsQuery = useQuery({
    queryKey: ['health-consultations'],
    queryFn: () => api.get('/health/consultations').then((response) => response.data ?? []),
  });

  const labTestsQuery = useQuery({
    queryKey: ['health-lab-tests'],
    queryFn: () => api.get('/health/lab-tests').then((response) => response.data ?? []),
  });

  const labRequestsQuery = useQuery({
    queryKey: ['health-lab-requests'],
    queryFn: () => api.get('/health/lab-requests').then((response) => response.data ?? []),
  });

  const overview = overviewQuery.data;
  const patients = patientsQuery.data ?? [];
  const appointments = appointmentsQuery.data ?? [];
  const consultations = consultationsQuery.data ?? [];
  const labTests = labTestsQuery.data ?? [];
  const labRequests = labRequestsQuery.data ?? [];
  const appointmentQueries = [
    overviewQuery,
    patientsQuery,
    appointmentsQuery,
    consultationsQuery,
    labTestsQuery,
    labRequestsQuery,
  ];

  const refreshHealth = () => {
    [
      'health-overview',
      'health-patients',
      'health-appointments',
      'health-consultations',
      'health-lab-tests',
      'health-lab-requests',
    ].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
  };

  const createAppointment = useMutation({
    mutationFn: (payload) => api.post('/health/appointments', payload).then((response) => response.data),
    onSuccess: () => {
      refreshHealth();
      setAppointmentForm(createHealthAppointmentForm());
    },
  });

  const createLabTest = useMutation({
    mutationFn: (payload) => api.post('/health/lab-tests', payload).then((response) => response.data),
    onSuccess: () => {
      refreshHealth();
      setLabTestForm(createHealthLabTestForm());
    },
  });

  const createLabRequest = useMutation({
    mutationFn: (payload) => api.post('/health/lab-requests', payload).then((response) => response.data),
    onSuccess: () => {
      refreshHealth();
      setLabRequestForm(createHealthLabRequestForm());
    },
  });

  const collectSample = useMutation({
    mutationFn: (labRequestId) => api.post(`/health/lab-requests/${labRequestId}/collect-sample`, buildHealthLabSampleCollectionPayload()).then((response) => response.data),
    onSuccess: refreshHealth,
  });

  const submitResult = useMutation({
    mutationFn: ({ labRequestId, payload }) =>
      api.post(`/health/lab-requests/${labRequestId}/submit-result`, payload).then((response) => response.data),
    onSuccess: refreshHealth,
  });

  const approveResult = useMutation({
    mutationFn: (labRequestId) => api.post(`/health/lab-requests/${labRequestId}/approve`, {}).then((response) => response.data),
    onSuccess: refreshHealth,
  });

  const rejectSpecimen = useMutation({
    mutationFn: ({ labRequestId, rejection_reason }) =>
      api.post(`/health/lab-requests/${labRequestId}/reject`, { rejection_reason }).then((response) => response.data),
    onSuccess: refreshHealth,
  });

  const summary = overview?.summary ?? {};
  const appointmentRecords = appointments;
  const labRequestRecords = labRequests;
  const overviewMetrics = buildHealthClinicalDeskMetrics(summary, appointmentRecords, labRequestRecords);
  const loadError = getErrorMessage(
    appointmentQueries.find((query) => query.isError)?.error,
    'We could not load part of the appointments workspace right now. Please try again.'
  );

  const pendingApprovals = useMemo(
    () => getHealthPendingApprovals(labRequestRecords),
    [labRequestRecords]
  );

  const rejectedSpecimens = useMemo(
    () => getHealthRejectedSpecimens(labRequestRecords),
    [labRequestRecords]
  );

  const visibleAppointments = filterHealthAppointments(appointmentRecords, appointmentSearch);
  const visibleLabRequests = filterHealthLabRequests(labRequestRecords, labSearch);

  return (
    <div className="space-y-5">
      {loadError ? (
        <QueryErrorPanel
          message={loadError}
          onRetry={() => {
            appointmentQueries.forEach((query) => {
              query.refetch();
            });
          }}
        />
      ) : null}

      <PageHero
        eyebrow="Clinical Operations"
        title={`${labels.appointments || 'Appointments'} and diagnostics flow`}
        description="Schedule patient visits, register tests, manage specimen work, and keep abnormal follow-up visible from one stronger clinical desk."
      />

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-6">
        {overviewMetrics.map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            tone={metric.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader title="Schedule Appointment" subtitle="Queue visits, referrals, and front-desk timing in a structured way" />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              createAppointment.mutate(buildHealthAppointmentPayload(appointmentForm));
            }}
          >
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={appointmentForm.patient_id}
              onChange={(event) => setAppointmentForm({ ...appointmentForm, patient_id: event.target.value })}
            >
              <option value="">Select patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={appointmentForm.scheduled_for}
              onChange={(event) => setAppointmentForm({ ...appointmentForm, scheduled_for: event.target.value })}
            />
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={appointmentForm.reason}
              onChange={(event) => setAppointmentForm({ ...appointmentForm, reason: event.target.value })}
              placeholder="Reason for visit"
            />
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={appointmentForm.referral_source}
              onChange={(event) => setAppointmentForm({ ...appointmentForm, referral_source: event.target.value })}
              placeholder="Referral source"
            />
            <button type="submit" className="w-full rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white">
              {createAppointment.isPending ? 'Saving appointment...' : 'Save appointment'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Diagnostics Catalogue" subtitle="Build the lab menu with specimen type, turnaround, and pricing visibility" />
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              createLabTest.mutate(buildHealthLabTestPayload(labTestForm));
            }}
          >
            <label className="space-y-2 text-sm text-slate-600">
              <span>Name</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={labTestForm.name}
                onChange={(event) => setLabTestForm({ ...labTestForm, name: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Sample type</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={labTestForm.sample_type}
                onChange={(event) => setLabTestForm({ ...labTestForm, sample_type: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
              <span>Reference range</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={labTestForm.reference_range}
                onChange={(event) => setLabTestForm({ ...labTestForm, reference_range: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Price</span>
              <input
                type="number"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={labTestForm.price}
                onChange={(event) => setLabTestForm({ ...labTestForm, price: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Turnaround hours</span>
              <input
                type="number"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={labTestForm.turnaround_hours}
                onChange={(event) => setLabTestForm({ ...labTestForm, turnaround_hours: event.target.value })}
              />
            </label>
            <button type="submit" className="rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-semibold text-white md:col-span-2">
              {createLabTest.isPending ? 'Saving lab test...' : 'Save lab test'}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            {labTests.slice(0, 4).map((test) => {
              const testCard = buildHealthLabCatalogCard(test, formatCurrencyNGN);

              return (
                <div key={testCard.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{testCard.title}</p>
                      <p className="text-sm text-slate-500">{testCard.sampleTypeLabel}</p>
                      <p className="text-sm text-slate-500">{testCard.referenceLabel}</p>
                    </div>
                    <div className="text-right text-sm text-slate-600">
                      <p>{testCard.turnaroundLabel}</p>
                      <p className="font-semibold text-emerald-700">{testCard.priceLabel}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader title="Request Lab Test" subtitle="Link patients and consultations directly into specimen intake" />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              createLabRequest.mutate(buildHealthLabRequestPayload(labRequestForm));
            }}
          >
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={labRequestForm.patient_id}
              onChange={(event) => setLabRequestForm({ ...labRequestForm, patient_id: event.target.value })}
            >
              <option value="">Select patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={labRequestForm.consultation_id}
              onChange={(event) => setLabRequestForm({ ...labRequestForm, consultation_id: event.target.value })}
            >
              <option value="">Attach consultation (optional)</option>
              {consultations.map((consultation) => (
                <option key={consultation.id} value={consultation.id}>
                  {consultation.patient?.full_name} - {consultation.diagnosis || 'Consultation'}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={labRequestForm.test_id}
              onChange={(event) => setLabRequestForm({ ...labRequestForm, test_id: event.target.value })}
            >
              <option value="">Select test</option>
              {labTests.map((test) => (
                <option key={test.id} value={test.id}>
                  {buildHealthLabTestOptionLabel(test, formatCurrencyNGN)}
                </option>
              ))}
            </select>
            <button type="submit" className="w-full rounded-2xl bg-cyan-700 px-5 py-4 text-sm font-semibold text-white">
              {createLabRequest.isPending ? 'Saving lab request...' : 'Save lab request'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Appointment Register" subtitle="Reason, referral source, patient code, and current desk status" />
          <div className="mb-4">
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="Search patient, code, reason, referral, or status..."
              value={appointmentSearch}
              onChange={(event) => setAppointmentSearch(event.target.value)}
            />
          </div>
          <div className="space-y-3">
            {visibleAppointments.length ? visibleAppointments.map((appointment) => {
              const appointmentCard = buildHealthAppointmentCard(appointment);

              return (
                <div key={appointmentCard.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{appointmentCard.title}</p>
                      <p className="text-sm text-slate-500">{appointmentCard.patientCodeLabel}</p>
                      <p className="text-sm text-slate-500">{appointmentCard.reason}</p>
                      <p className="text-sm text-slate-500">{appointmentCard.meta}</p>
                      <p className="text-sm text-slate-500">{appointmentCard.consultationLabel}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                      {appointmentCard.status}
                    </span>
                  </div>
                </div>
              );
            }) : <p className="text-sm text-slate-500">No appointments matched the current search.</p>}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader title="Lab Workbench" subtitle="Collect samples, submit results, approve findings, and reject bad specimens" />
          <div className="mb-4">
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="Search patient, test, barcode, diagnosis, or lab status..."
              value={labSearch}
              onChange={(event) => setLabSearch(event.target.value)}
            />
          </div>
          <div className="space-y-4">
            {visibleLabRequests.length ? visibleLabRequests.map((request) => {
              const resultForm = resultForms[request.id] ?? createHealthResultForm(request);
              const workbenchCard = buildHealthLabWorkbenchCard(request);

              return (
                <div key={workbenchCard.id} className="rounded-3xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{workbenchCard.title}</p>
                      <p className="text-sm text-slate-500">{workbenchCard.testLabel}</p>
                      <p className="text-sm text-slate-500">{workbenchCard.barcodeLabel}</p>
                      <p className="text-sm text-slate-500">{workbenchCard.referenceLabel}</p>
                      <p className="text-sm text-slate-500">{workbenchCard.turnaroundLabel}</p>
                      <p className="text-sm text-slate-500">{workbenchCard.consultationLabel}</p>
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                        {workbenchCard.status}
                      </span>
                      {workbenchCard.abnormalLabel ? (
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">{workbenchCard.abnormalLabel}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
                    <input
                      className="rounded-2xl border border-slate-200 px-4 py-3"
                      value={resultForm.result_value}
                      onChange={(event) =>
                        setResultForms((current) => ({
                          ...current,
                          [request.id]: {
                            ...resultForm,
                            result_value: event.target.value,
                          },
                        }))
                      }
                      placeholder="Result value"
                    />
                    <button
                      type="button"
                      className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                      onClick={() => collectSample.mutate(request.id)}
                    >
                      Collect sample
                    </button>
                    <button
                      type="button"
                      className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white"
                      onClick={() =>
                        submitResult.mutate({
                          labRequestId: request.id,
                          payload: buildHealthResultPayload(resultForm),
                        })
                      }
                    >
                      Submit result
                    </button>
                    <button
                      type="button"
                      className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
                      onClick={() => approveResult.mutate(request.id)}
                    >
                      Approve
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                    <input
                      className="rounded-2xl border border-slate-200 px-4 py-3"
                      value={resultForm.rejection_reason}
                      onChange={(event) =>
                        setResultForms((current) => ({
                          ...current,
                          [request.id]: {
                            ...resultForm,
                            rejection_reason: event.target.value,
                          },
                        }))
                      }
                      placeholder="Specimen rejection reason"
                    />
                    <button
                      type="button"
                      className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white"
                      onClick={() =>
                        rejectSpecimen.mutate({
                          labRequestId: request.id,
                          ...buildHealthSpecimenRejectionPayload(resultForm),
                        })
                      }
                    >
                      Reject specimen
                    </button>
                  </div>
                </div>
              );
            }) : <p className="text-sm text-slate-500">No lab requests matched the current search.</p>}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Approval Queue" subtitle="Results waiting for clinician or lab lead approval" />
            <div className="space-y-3">
              {pendingApprovals.map((request) => {
                const approvalCard = buildHealthApprovalCard(request);

                return (
                  <div key={approvalCard.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="font-semibold text-slate-900">{approvalCard.title}</p>
                    <p className="text-sm text-slate-600">{approvalCard.testLabel}</p>
                    <p className="text-sm text-slate-600">{approvalCard.resultLabel}</p>
                  </div>
                );
              })}
              {pendingApprovals.length === 0 ? <p className="text-sm text-slate-500">No pending approvals right now.</p> : null}
            </div>
          </Card>

          <Card>
            <CardHeader title="Rejected Specimens" subtitle="Quality control issues that can quietly damage turnaround and trust" />
            <div className="space-y-3">
              {rejectedSpecimens.map((request) => {
                const rejectedCard = buildHealthRejectedSpecimenCard(request);

                return (
                  <div key={rejectedCard.id} className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <p className="font-semibold text-slate-900">{rejectedCard.title}</p>
                    <p className="text-sm text-slate-600">{rejectedCard.testLabel}</p>
                    <p className="text-sm text-rose-700">{rejectedCard.rejectionLabel}</p>
                  </div>
                );
              })}
              {rejectedSpecimens.length === 0 ? <p className="text-sm text-slate-500">No rejected specimens recorded.</p> : null}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default function Appointments() {
  const { labels, color, hasActiveType } = useBusinessType();

  if (hasActiveType('beauty')) {
    return <BeautyOps />;
  }

  if (hasActiveType('service')) {
    return <ServiceOps />;
  }

  return <AppointmentsGeneral labels={labels} color={color} />;
}
