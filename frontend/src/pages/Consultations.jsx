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
import { formatCurrencyNGN } from '../lib/financeFormatters';
import {
  buildHealthConsultationCard,
  buildHealthConsultationDeskMetrics,
  buildHealthConsultationPayload,
  createHealthConsultationForm,
  filterHealthConsultations,
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

export default function Consultations() {
  const { labels } = useBusinessType();
  const queryClient = useQueryClient();
  const { toast, setToast, clearToast } = useToast();
  const [consultationForm, setConsultationForm] = useState(createHealthConsultationForm);
  const [consultationSearch, setConsultationSearch] = useState('');

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
  const overview = overviewQuery.data;
  const patients = patientsQuery.data || [];
  const consultations = consultationsQuery.data || [];
  const consultationQueries = [overviewQuery, patientsQuery, consultationsQuery];
  const hasPageError = consultationQueries.some((query) => query.isError);
  const loadError = getErrorMessage(
    consultationQueries.find((query) => query.isError)?.error,
    'We could not load the consultation desk right now.',
  );

  const refresh = () => {
    ['health-overview', 'health-consultations', 'health-patients', 'health-lab-requests'].forEach((key) =>
      queryClient.invalidateQueries({ queryKey: [key] }),
    );
  };

  const createConsultation = useMutation({
    mutationFn: (payload) => api.post('/health/consultations', payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      setConsultationForm(createHealthConsultationForm());
      clearToast();
      setToast({ tone: 'success', message: 'Consultation saved into the clinical review ledger.' });
    },
    onError: (error) => {
      setToast({ tone: 'error', message: getErrorMessage(error, 'We could not save that consultation right now.') });
    },
  });

  const summary = overview?.summary ?? {};
  const consultationMetrics = buildHealthConsultationDeskMetrics(summary, patients, consultations, formatCurrencyNGN);
  const consultationCards = useMemo(
    () => filterHealthConsultations(consultations, consultationSearch).map((consultation) => buildHealthConsultationCard(consultation, formatCurrencyNGN)),
    [consultationSearch, consultations],
  );
  const recentPatients = patients.slice(0, 4);

  return (
    <div className="space-y-5">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Consultation feedback" />

      <PageHero
        eyebrow="Clinical Review Desk"
        title={`${labels.consultations || 'Consultations'} and treatment follow-through`}
        description="Capture triage vitals, diagnoses, treatment plans, and billing recovery in one stronger clinical review surface."
      />

      {hasPageError ? (
        <QueryErrorPanel
          message={loadError}
          onRetry={() => {
            consultationQueries.forEach((query) => {
              void query.refetch();
            });
          }}
        />
      ) : null}

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-6">
        {consultationMetrics.map((metric) => (
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
          <CardHeader
            title="Record Consultation"
            subtitle="Doctor notes, diagnosis, triage vitals, follow-up timing, and billing recovery in one clinical save flow."
          />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              createConsultation.mutate(buildHealthConsultationPayload(consultationForm));
            }}
          >
            <select
              className="input"
              value={consultationForm.patient_id}
              onChange={(event) => setConsultationForm({ ...consultationForm, patient_id: event.target.value })}
            >
              <option value="">Select patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name}
                </option>
              ))}
            </select>

            <textarea
              className="input min-h-[112px] resize-y py-3"
              value={consultationForm.doctor_notes}
              onChange={(event) => setConsultationForm({ ...consultationForm, doctor_notes: event.target.value })}
              placeholder="Doctor notes"
            />
            <input
              className="input"
              value={consultationForm.diagnosis}
              onChange={(event) => setConsultationForm({ ...consultationForm, diagnosis: event.target.value })}
              placeholder="Diagnosis"
            />
            <textarea
              className="input min-h-[112px] resize-y py-3"
              value={consultationForm.treatment_plan}
              onChange={(event) => setConsultationForm({ ...consultationForm, treatment_plan: event.target.value })}
              placeholder="Treatment plan"
            />

            <div className="grid gap-3 md:grid-cols-3">
              <input
                className="input"
                value={consultationForm.temperature}
                onChange={(event) => setConsultationForm({ ...consultationForm, temperature: event.target.value })}
                placeholder="Temperature"
              />
              <input
                className="input"
                value={consultationForm.blood_pressure}
                onChange={(event) => setConsultationForm({ ...consultationForm, blood_pressure: event.target.value })}
                placeholder="Blood pressure"
              />
              <input
                className="input"
                value={consultationForm.pulse_rate}
                onChange={(event) => setConsultationForm({ ...consultationForm, pulse_rate: event.target.value })}
                placeholder="Pulse rate"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <input
                className="input"
                type="date"
                value={consultationForm.follow_up_date}
                onChange={(event) => setConsultationForm({ ...consultationForm, follow_up_date: event.target.value })}
              />
              <input
                className="input"
                value={consultationForm.billing_amount}
                onChange={(event) => setConsultationForm({ ...consultationForm, billing_amount: event.target.value })}
                placeholder="Billing amount"
              />
              <input
                className="input"
                value={consultationForm.amount_paid}
                onChange={(event) => setConsultationForm({ ...consultationForm, amount_paid: event.target.value })}
                placeholder="Amount paid"
              />
            </div>

            <button type="submit" className="h-11 w-full rounded-xl bg-[var(--color-brand)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-brand-strong)]">
              {createConsultation.isPending ? 'Saving consultation...' : 'Save consultation'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader
            title="Patient Coverage"
            subtitle="Quick patient context so review and billing follow-through stay grounded in who has already entered care."
          />
          <div className="space-y-3">
            {recentPatients.map((patient) => (
              <div key={patient.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="font-semibold text-slate-900">{patient.full_name}</p>
                <p className="mt-1 text-sm text-slate-600">{patient.patient_code || 'No patient code'} | {patient.hmo_provider || 'Self-pay'}</p>
                <p className="mt-1 text-sm text-slate-600">{patient.phone || 'No phone'}{patient.gender ? ` | ${patient.gender}` : ''}</p>
                <p className="mt-1 text-xs text-slate-500">{patient.medical_history || 'No medical history note captured yet.'}</p>
              </div>
            ))}
            {!recentPatients.length ? (
              <EmptyState
                icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                title="No patients yet"
                description="Patient records will appear here once they're registered for care."
                className="py-4"
              />
            ) : null}
          </div>
        </Card>
      </section>

      <Card>
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <CardHeader
            title="Consultation Ledger"
            subtitle="Diagnoses, treatment decisions, triage context, and billing recovery across recent patient reviews."
            className="mb-0"
          />
          <input
            className="input md:min-w-[260px]"
            value={consultationSearch}
            onChange={(event) => setConsultationSearch(event.target.value)}
            placeholder="Search consultations..."
          />
        </div>

        <div className="mt-4 space-y-3">
          {consultationCards.map((card) => (
            <div key={card.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900">{card.title}</p>
                  <p className="text-sm text-slate-500">{card.patientCodeLabel} | {card.receiptLabel}</p>
                  <p className="text-sm text-slate-500">{card.diagnosisLabel}</p>
                  <p className="text-sm text-slate-500">{card.treatmentLabel}</p>
                  <p className="text-xs text-slate-500">{card.notesLabel}</p>
                </div>
                <div className="space-y-1 text-left md:text-right">
                  <p className="text-sm font-semibold text-slate-900">{card.billingLabel}</p>
                  <p className="text-sm text-amber-700">{card.outstandingLabel}</p>
                  <p className="text-xs text-slate-500">{card.followUpLabel}</p>
                  <p className="text-xs text-slate-500">{card.labRequestsLabel}</p>
                </div>
              </div>

              <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {card.vitalsLabel}
              </div>
            </div>
          ))}
          {!consultationCards.length ? (
            <p className="text-sm text-slate-500">No consultations matched the current search.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
