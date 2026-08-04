import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useBusinessType } from '../config';
import Card, { CardHeader } from '../components/Card';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/apiFeedback';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import {
  buildHealthLabCatalogCard,
  buildHealthLabDeskMetrics,
  buildHealthLabRequestPayload,
  buildHealthLabSampleCollectionPayload,
  buildHealthLabTestOptionLabel,
  buildHealthLabTestPayload,
  buildHealthLabWorkbenchCard,
  buildHealthResultPayload,
  buildHealthSpecimenRejectionPayload,
  createHealthLabRequestForm,
  createHealthLabTestForm,
  createHealthResultForm,
  filterHealthLabRequests,
  filterHealthLabTests,
} from '../lib/health';

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

export default function LabRequests() {
  const { labels } = useBusinessType();
  const queryClient = useQueryClient();
  const { toast, setToast, clearToast } = useToast();
  const [labTestForm, setLabTestForm] = useState(createHealthLabTestForm);
  const [labRequestForm, setLabRequestForm] = useState(createHealthLabRequestForm);
  const [resultForms, setResultForms] = useState({});
  const [labTestSearch, setLabTestSearch] = useState('');
  const [labRequestSearch, setLabRequestSearch] = useState('');
  const [labRequestStatus, setLabRequestStatus] = useState('');

  const overviewQuery = useQuery({
    queryKey: ['health-overview'],
    queryFn: () => api.get('/health/overview').then((response) => response.data),
  });

  const patientsQuery = useQuery({
    queryKey: ['health-patients'],
    queryFn: () => api.get('/health/patients').then((response) => response.data ?? []),
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
  const patients = patientsQuery.data || [];
  const consultations = consultationsQuery.data || [];
  const labTests = labTestsQuery.data || [];
  const labRequests = labRequestsQuery.data || [];
  const diagnosticsQueries = [overviewQuery, patientsQuery, consultationsQuery, labTestsQuery, labRequestsQuery];
  const hasPageError = diagnosticsQueries.some((query) => query.isError);
  const loadError = getErrorMessage(
    diagnosticsQueries.find((query) => query.isError)?.error,
    'We could not load the diagnostics desk right now.',
  );

  const refresh = () => {
    ['health-overview', 'health-lab-tests', 'health-lab-requests', 'health-consultations', 'health-patients'].forEach((key) =>
      queryClient.invalidateQueries({ queryKey: [key] })
    );
  };

  const createLabTest = useMutation({
    mutationFn: (payload) => api.post('/health/lab-tests', payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      setLabTestForm(createHealthLabTestForm());
      clearToast();
      setToast({ tone: 'success', message: 'Diagnostics catalogue updated with the new lab test.' });
    },
    onError: (error) => {
      setToast({ tone: 'error', message: getErrorMessage(error, 'We could not save that lab test right now.') });
    },
  });

  const createLabRequest = useMutation({
    mutationFn: (payload) => api.post('/health/lab-requests', payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      setLabRequestForm(createHealthLabRequestForm());
      clearToast();
      setToast({ tone: 'success', message: 'Lab request saved into the active specimen intake queue.' });
    },
    onError: (error) => {
      setToast({ tone: 'error', message: getErrorMessage(error, 'We could not save that lab request right now.') });
    },
  });

  const collectSample = useMutation({
    mutationFn: (labRequestId) =>
      api.post(`/health/lab-requests/${labRequestId}/collect-sample`, buildHealthLabSampleCollectionPayload()).then((response) => response.data),
    onSuccess: () => {
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Sample collection has been recorded.' });
    },
    onError: (error) => {
      setToast({ tone: 'error', message: getErrorMessage(error, 'We could not record sample collection right now.') });
    },
  });

  const submitResult = useMutation({
    mutationFn: ({ labRequestId, payload }) =>
      api.post(`/health/lab-requests/${labRequestId}/submit-result`, payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Lab result submitted into the review workflow.' });
    },
    onError: (error) => {
      setToast({ tone: 'error', message: getErrorMessage(error, 'We could not submit that lab result right now.') });
    },
  });

  const rejectSpecimen = useMutation({
    mutationFn: ({ labRequestId, rejection_reason }) =>
      api.post(`/health/lab-requests/${labRequestId}/reject`, { rejection_reason }).then((response) => response.data),
    onSuccess: () => {
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Specimen rejection has been logged for follow-up.' });
    },
    onError: (error) => {
      setToast({ tone: 'error', message: getErrorMessage(error, 'We could not reject that specimen right now.') });
    },
  });

  const summary = overview?.summary ?? {};
  const diagnosticsMetrics = buildHealthLabDeskMetrics(summary, labRequests, labTests);
  const catalogCards = filterHealthLabTests(labTests, labTestSearch).map((test) => buildHealthLabCatalogCard(test, formatCurrencyNGN));
  const activeRequestItems = useMemo(() => {
    const filteredRequests = filterHealthLabRequests(labRequests, labRequestSearch);
    return filteredRequests
      .filter((request) => (labRequestStatus ? request.status === labRequestStatus : true))
      .filter((request) => request.status !== 'approved')
      .map((request) => ({
        request,
        card: buildHealthLabWorkbenchCard(request),
      }));
  }, [labRequestSearch, labRequestStatus, labRequests]);

  return (
    <div className="space-y-5">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Lab workflow feedback" />

      <PageHero
        eyebrow="Diagnostics Intake"
        title={`${labels.labRequests || 'Lab Requests'} and specimen queue`}
        description="Capture requests, maintain a pricing-ready diagnostics catalogue, and move specimens cleanly from intake into review."
      />

      {hasPageError ? (
        <QueryErrorPanel
          message={loadError}
          onRetry={() => {
            diagnosticsQueries.forEach((query) => {
              void query.refetch();
            });
          }}
        />
      ) : null}

      <ResponsiveCardGrid variant="metrics" className="xl:grid-cols-7">
        {diagnosticsMetrics.map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            tone={metric.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader
            title="Request Lab Test"
            subtitle="Link patients, consultations, and priced diagnostics into one active specimen intake flow."
          />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              createLabRequest.mutate(buildHealthLabRequestPayload(labRequestForm));
            }}
          >
            <select
              className="input"
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
              className="input"
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
              className="input"
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

            <button type="submit" className="h-11 w-full rounded-xl bg-cyan-700 px-5 text-sm font-semibold text-white hover:bg-cyan-800">
              {createLabRequest.isPending ? 'Saving lab request...' : 'Save lab request'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader
            title="Diagnostics Catalogue"
            subtitle="Maintain test naming, specimen type, reference range, pricing, and turnaround expectations from one control surface."
          />
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              createLabTest.mutate(buildHealthLabTestPayload(labTestForm));
            }}
          >
            <label className="space-y-2 text-sm text-slate-600">
              <span>Test name</span>
              <input
                className="input"
                value={labTestForm.name}
                onChange={(event) => setLabTestForm({ ...labTestForm, name: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Sample type</span>
              <input
                className="input"
                value={labTestForm.sample_type}
                onChange={(event) => setLabTestForm({ ...labTestForm, sample_type: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Reference range</span>
              <input
                className="input"
                value={labTestForm.reference_range}
                onChange={(event) => setLabTestForm({ ...labTestForm, reference_range: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Price</span>
              <input
                className="input"
                type="number"
                min="0"
                value={labTestForm.price}
                onChange={(event) => setLabTestForm({ ...labTestForm, price: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
              <span>Turnaround hours</span>
              <input
                className="input"
                type="number"
                min="1"
                value={labTestForm.turnaround_hours}
                onChange={(event) => setLabTestForm({ ...labTestForm, turnaround_hours: event.target.value })}
              />
            </label>
            <button type="submit" className="h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 md:col-span-2">
              {createLabTest.isPending ? 'Saving lab test...' : 'Save lab test'}
            </button>
          </form>

          <div className="mt-5 border-t border-slate-200 pt-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Live test catalogue</p>
                <p className="mt-1 text-sm text-slate-500">Search active diagnostics already configured for intake.</p>
              </div>
              <input
                className="input md:max-w-xs"
                value={labTestSearch}
                onChange={(event) => setLabTestSearch(event.target.value)}
                placeholder="Search lab tests..."
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {catalogCards.map((card) => (
                <div key={card.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="font-semibold text-slate-900">{card.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{card.sampleTypeLabel}</p>
                  <p className="mt-1 text-sm text-slate-600">{card.referenceLabel}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                    <span className="rounded-full bg-white px-3 py-1 font-semibold">{card.priceLabel}</span>
                    <span className="rounded-full bg-white px-3 py-1 font-semibold">{card.turnaroundLabel}</span>
                  </div>
                </div>
              ))}
              {!catalogCards.length ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500 md:col-span-2">
                  No diagnostics tests matched the current catalogue search.
                </p>
              ) : null}
            </div>
          </div>
        </Card>
      </section>

      <Card>
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <CardHeader
            title="Specimen Queue"
            subtitle="Collect samples, enter early findings, and reject weak specimens before they become turnaround failures."
            className="mb-0"
          />
          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
            <input
              className="input md:min-w-[240px]"
              value={labRequestSearch}
              onChange={(event) => setLabRequestSearch(event.target.value)}
              placeholder="Search patient, test, barcode..."
            />
            <select
              className="input md:min-w-[220px]"
              value={labRequestStatus}
              onChange={(event) => setLabRequestStatus(event.target.value)}
            >
              <option value="">All active statuses</option>
              <option value="pending">Pending</option>
              <option value="sample_collected">Sample collected</option>
              <option value="review_pending">Review pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {activeRequestItems.map(({ card, request }) => {
            const resultForm = resultForms[request.id] ?? createHealthResultForm(request);
            const statusToneClass = card.statusTone === 'rose'
              ? 'bg-rose-100 text-rose-700'
              : card.statusTone === 'amber'
                ? 'bg-amber-100 text-amber-700'
                : card.statusTone === 'emerald'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-sky-100 text-sky-700';

            return (
              <div key={card.id} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{card.title}</p>
                    <p className="text-sm text-slate-500">{card.patientCodeLabel} - {card.testLabel}</p>
                    <p className="text-sm text-slate-500">{card.barcodeLabel}</p>
                    <p className="text-sm text-slate-500">{card.referenceLabel}</p>
                    <p className="text-sm text-slate-500">{card.consultationLabel}</p>
                  </div>
                  <div className="text-right">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusToneClass}`}>
                      {card.status}
                    </span>
                    <p className="mt-2 text-xs text-slate-500">{card.turnaroundLabel}</p>
                    {card.abnormalLabel ? (
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">{card.abnormalLabel}</p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sample</p>
                    <p className="mt-1 font-semibold text-slate-900">{card.sampleCollectionLabel}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Result</p>
                    <p className="mt-1 font-semibold text-slate-900">{card.resultLabel}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Technician</p>
                    <p className="mt-1 font-semibold text-slate-900">{card.technicianLabel}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
                  <input
                    className="input"
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
                    className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
                    onClick={() => {
                      clearToast();
                      collectSample.mutate(request.id);
                    }}
                  >
                    Collect sample
                  </button>
                  <button
                    type="button"
                    className="h-11 rounded-xl bg-amber-500 px-4 text-sm font-semibold text-white hover:bg-amber-600"
                    onClick={() => {
                      clearToast();
                      submitResult.mutate({
                        labRequestId: request.id,
                        payload: buildHealthResultPayload(resultForm),
                      });
                    }}
                  >
                    Submit result
                  </button>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                  <input
                    className="input"
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
                    className="h-11 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700"
                    onClick={() => {
                      clearToast();
                      rejectSpecimen.mutate({
                        labRequestId: request.id,
                        ...buildHealthSpecimenRejectionPayload(resultForm),
                      });
                    }}
                  >
                    Reject specimen
                  </button>
                </div>
              </div>
            );
          })}

          {activeRequestItems.length === 0 ? (
            <p className="text-sm text-slate-500">No active lab requests matched the current search or status filter.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
