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
import {
  buildHealthApprovalCard,
  buildHealthLabWorkbenchCard,
  buildHealthRejectedSpecimenCard,
  buildHealthResultDeskMetrics,
  buildHealthResultPayload,
  createHealthResultForm,
  getHealthPendingApprovals,
  getHealthRejectedSpecimens,
} from '../lib/health';
import {
  buildSchoolResultCard,
  buildSchoolResultDeskMetrics,
  buildSchoolResultPayload,
  createSchoolResultForm,
  filterSchoolResults,
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

function SchoolResults() {
  const { color } = useBusinessType();
  const queryClient = useQueryClient();
  const { toast, setToast, clearToast } = useToast();
  const [resultForm, setResultForm] = useState(createSchoolResultForm);
  const [resultSearch, setResultSearch] = useState('');

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

  const resultsQuery = useQuery({
    queryKey: ['school-results'],
    queryFn: () => api.get('/school/results').then((response) => response.data ?? []),
  });
  const overview = overviewQuery.data;
  const students = studentsQuery.data || [];
  const terms = termsQuery.data || [];
  const subjects = subjectsQuery.data || [];
  const results = resultsQuery.data || [];
  const schoolResultQueries = [overviewQuery, studentsQuery, termsQuery, subjectsQuery, resultsQuery];
  const hasPageError = schoolResultQueries.some((query) => query.isError);
  const loadError = getErrorMessage(
    schoolResultQueries.find((query) => query.isError)?.error,
    'We could not load the academic results desk right now.',
  );

  const refresh = () => {
    ['school-overview', 'school-results'].forEach((key) =>
      queryClient.invalidateQueries({ queryKey: [key] }),
    );
  };

  const saveResult = useMutation({
    mutationFn: (payload) => api.post('/school/results', payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      setResultForm(createSchoolResultForm());
      clearToast();
      setToast({ tone: 'success', message: 'Academic result saved into the result ledger.' });
    },
    onError: (error) => {
      setToast({ tone: 'error', message: getErrorMessage(error, 'We could not save that academic result right now.') });
    },
  });

  const summary = overview?.summary ?? {};
  const resultMetrics = buildSchoolResultDeskMetrics(summary, results, students, (value) => value);
  const resultCards = useMemo(
    () => filterSchoolResults(results, resultSearch).map((entry) => buildSchoolResultCard(entry)),
    [results, resultSearch],
  );
  const bestPerformers = [...results]
    .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))
    .slice(0, 4)
    .map((entry) => buildSchoolResultCard(entry));

  return (
    <div className="space-y-5">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Academic result feedback" />

      <PageHero
        eyebrow="Academic Results"
        title="Result entry and promotion signal"
        description="Capture subject scores, teacher commentary, and recent performance trends in a dedicated academic results surface."
        accent={color}
      />

      {hasPageError ? (
        <QueryErrorPanel
          message={loadError}
          onRetry={() => {
            schoolResultQueries.forEach((query) => {
              void query.refetch();
            });
          }}
        />
      ) : null}

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-5">
        {resultMetrics.map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            tone={metric.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card>
          <CardHeader title="Enter Result" subtitle="Subject score, teacher comment, and term-aware result submission from one stronger academic form." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveResult.mutate(buildSchoolResultPayload(resultForm));
            }}
          >
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
            <input className="input" type="number" min="0" max="100" value={resultForm.score} onChange={(event) => setResultForm({ ...resultForm, score: event.target.value })} placeholder="Score" />
            <textarea className="input min-h-[112px] resize-y py-3" value={resultForm.teacher_comment} onChange={(event) => setResultForm({ ...resultForm, teacher_comment: event.target.value })} placeholder="Teacher comment" />
            <button type="submit" className="h-11 w-full rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700">
              {saveResult.isPending ? 'Saving result...' : 'Save result'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Top Performers" subtitle="A quick academic pulse on the strongest scores already recorded in the current ledger." />
          <div className="space-y-3">
            {bestPerformers.map((card) => (
              <div key={card.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="font-semibold text-slate-900">{card.title}</p>
                <p className="mt-1 text-sm text-slate-600">{card.admissionLabel}</p>
                <p className="mt-1 text-sm text-slate-600">{card.scoreLabel}</p>
                <p className="mt-1 text-xs text-slate-500">{card.termLabel} | {card.departmentLabel}</p>
              </div>
            ))}
            {!bestPerformers.length ? (
              <p className="text-sm text-slate-500">No result entries are available yet to rank top performers.</p>
            ) : null}
          </div>
        </Card>
      </section>

      <Card>
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <CardHeader title="Result Ledger" subtitle="Latest subject scores, grading output, and teacher commentary across the academic result stream." className="mb-0" />
          <input
            className="input md:min-w-[260px]"
            value={resultSearch}
            onChange={(event) => setResultSearch(event.target.value)}
            placeholder="Search results..."
          />
        </div>

        <div className="mt-4 space-y-3">
          {resultCards.map((card) => (
            <div key={card.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{card.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{card.admissionLabel}</p>
                  <p className="mt-1 text-sm text-slate-600">{card.scoreLabel}</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-sm font-semibold text-slate-900">{card.termLabel}</p>
                  <p className="mt-1 text-sm text-slate-600">{card.departmentLabel}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-500">{card.commentLabel}</p>
            </div>
          ))}
          {!resultCards.length ? (
            <p className="text-sm text-slate-500">No school results matched the current search.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

function LaboratoryResults() {
  const queryClient = useQueryClient();
  const { toast, setToast, clearToast } = useToast();
  const [resultForms, setResultForms] = useState({});

  const overviewQuery = useQuery({
    queryKey: ['health-overview'],
    queryFn: () => api.get('/health/overview').then((response) => response.data),
  });

  const labRequestsQuery = useQuery({
    queryKey: ['health-lab-requests'],
    queryFn: () => api.get('/health/lab-requests').then((response) => response.data ?? []),
  });
  const overview = overviewQuery.data;
  const labRequests = labRequestsQuery.data || [];
  const laboratoryResultQueries = [overviewQuery, labRequestsQuery];
  const hasPageError = laboratoryResultQueries.some((query) => query.isError);
  const loadError = getErrorMessage(
    laboratoryResultQueries.find((query) => query.isError)?.error,
    'We could not load the laboratory results desk right now.',
  );

  const refresh = () => {
    ['health-overview', 'health-lab-requests'].forEach((key) =>
      queryClient.invalidateQueries({ queryKey: [key] }),
    );
  };

  const submitResult = useMutation({
    mutationFn: ({ labRequestId, payload }) =>
      api.post(`/health/lab-requests/${labRequestId}/submit-result`, payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Result submitted into the release queue.' });
    },
    onError: (error) => {
      setToast({ tone: 'error', message: getErrorMessage(error, 'We could not submit that result right now.') });
    },
  });

  const approveResult = useMutation({
    mutationFn: (labRequestId) => api.post(`/health/lab-requests/${labRequestId}/approve`, {}).then((response) => response.data),
    onSuccess: () => {
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Result approved and released.' });
    },
    onError: (error) => {
      setToast({ tone: 'error', message: getErrorMessage(error, 'We could not approve that result right now.') });
    },
  });

  const summary = overview?.summary ?? {};
  const labMetrics = buildHealthResultDeskMetrics(summary, labRequests);
  const pendingApprovals = useMemo(
    () => getHealthPendingApprovals(labRequests).map((request) => ({
      request,
      card: buildHealthApprovalCard(request),
    })),
    [labRequests],
  );
  const rejectedSpecimens = useMemo(
    () => getHealthRejectedSpecimens(labRequests).map((request) => buildHealthRejectedSpecimenCard(request)),
    [labRequests],
  );
  const abnormalResults = useMemo(
    () =>
      labRequests
        .filter((request) => request.is_abnormal)
        .map((request) => ({
          request,
          card: buildHealthLabWorkbenchCard(request),
        })),
    [labRequests],
  );
  const approvedResults = useMemo(
    () =>
      labRequests
        .filter((request) => request.status === 'approved')
        .slice(0, 4)
        .map((request) => buildHealthLabWorkbenchCard(request)),
    [labRequests],
  );

  return (
    <div className="space-y-5">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Laboratory result feedback" />

      <PageHero
        eyebrow="Result Release Desk"
        title="Lab results, approvals, and abnormal follow-up"
        description="Keep the release queue visible, push pending findings through review, and surface abnormal diagnostics that need fast attention."
      />

      {hasPageError ? (
        <QueryErrorPanel
          message={loadError}
          onRetry={() => {
            laboratoryResultQueries.forEach((query) => {
              void query.refetch();
            });
          }}
        />
      ) : null}

      <ResponsiveCardGrid variant="metrics" className="xl:grid-cols-7">
        {labMetrics.map((metric) => (
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
          <CardHeader title="Approval Queue" subtitle="Review pending findings, submit missing values, and release results cleanly through one stronger queue." />
          <div className="space-y-4">
            {pendingApprovals.map(({ request, card }) => {
              const resultForm = resultForms[request.id] ?? createHealthResultForm(request);

              return (
                <div key={card.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="font-semibold text-slate-900">{card.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{card.testLabel}</p>
                  <p className="mt-1 text-sm text-slate-600">{card.resultLabel}</p>

                  <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_auto]">
                    <input
                      className="input bg-white"
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
                      className="h-11 rounded-xl bg-amber-500 px-4 text-sm font-semibold text-white hover:bg-amber-600"
                      onClick={() => {
                        clearToast();
                        submitResult.mutate({
                          labRequestId: request.id,
                          payload: buildHealthResultPayload(resultForm),
                        });
                      }}
                    >
                      Submit
                    </button>
                    <button
                      type="button"
                      className="h-11 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
                      onClick={() => {
                        clearToast();
                        approveResult.mutate(request.id);
                      }}
                    >
                      Approve
                    </button>
                  </div>
                </div>
              );
            })}
            {pendingApprovals.length === 0 ? (
              <p className="text-sm text-slate-500">No results are waiting for approval right now.</p>
            ) : null}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Approved Results" subtitle="Latest diagnostics already reviewed and released out of the approval stream." />
            <div className="space-y-3">
              {approvedResults.map((card) => (
                <div key={card.id} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="font-semibold text-slate-900">{card.title}</p>
                  <p className="text-sm text-slate-600">{card.testLabel}</p>
                  <p className="text-sm text-slate-600">{card.resultLabel}</p>
                </div>
              ))}
              {approvedResults.length === 0 ? (
                <p className="text-sm text-slate-500">No approved results are visible yet.</p>
              ) : null}
            </div>
          </Card>

          <Card>
            <CardHeader title="Abnormal Findings" subtitle="Results already flagged as abnormal and needing close follow-through." />
            <div className="space-y-3">
              {abnormalResults.map(({ card }) => (
                <div key={card.id} className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <p className="font-semibold text-slate-900">{card.title}</p>
                  <p className="text-sm text-slate-600">{card.testLabel}</p>
                  <p className="text-sm text-slate-600">{card.resultLabel}</p>
                  <p className="text-sm font-semibold text-rose-700">{card.abnormalLabel || 'Abnormal flagged'}</p>
                </div>
              ))}
              {abnormalResults.length === 0 ? (
                <p className="text-sm text-slate-500">No abnormal results are currently flagged.</p>
              ) : null}
            </div>
          </Card>

          <Card>
            <CardHeader title="Rejected Specimens" subtitle="Quality-control misses still waiting for recollection or owner review." />
            <div className="space-y-3">
              {rejectedSpecimens.map((card) => (
                <div key={card.id} className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <p className="font-semibold text-slate-900">{card.title}</p>
                  <p className="text-sm text-slate-600">{card.testLabel}</p>
                  <p className="text-sm text-rose-700">{card.rejectionLabel}</p>
                </div>
              ))}
              {rejectedSpecimens.length === 0 ? (
                <p className="text-sm text-slate-500">No rejected specimens recorded.</p>
              ) : null}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default function Results() {
  const { type } = useBusinessType();

  if (type === 'school') {
    return <SchoolResults />;
  }

  return <LaboratoryResults />;
}
