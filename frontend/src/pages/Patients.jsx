import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useBusinessType } from '../config';
import Card, { CardHeader } from '../components/Card';
import EmptyState from '../components/EmptyState';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import { getErrorMessage } from '../lib/apiFeedback';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import {
  buildHealthConsultationCard,
  buildHealthConsultationPayload,
  buildHealthPatientDeskMetrics,
  buildHealthPatientPayload,
  buildHealthPatientRecordCard,
  createHealthConsultationForm,
  createHealthPatientForm,
  filterHealthPatients,
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

export default function Patients() {
  const { labels } = useBusinessType();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [patientForm, setPatientForm] = useState(createHealthPatientForm);
  const [consultationForm, setConsultationForm] = useState(createHealthConsultationForm);

  const healthOverviewQuery = useQuery({
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

  const healthOverview = healthOverviewQuery.data;
  const patients = patientsQuery.data ?? [];
  const consultations = consultationsQuery.data ?? [];
  const patientQueries = [healthOverviewQuery, patientsQuery, consultationsQuery];

  const refreshHealth = () => {
    queryClient.invalidateQueries({ queryKey: ['health-overview'] });
    queryClient.invalidateQueries({ queryKey: ['health-patients'] });
    queryClient.invalidateQueries({ queryKey: ['health-consultations'] });
    queryClient.invalidateQueries({ queryKey: ['health-appointments'] });
    queryClient.invalidateQueries({ queryKey: ['health-lab-requests'] });
  };

  const createPatient = useMutation({
    mutationFn: (payload) => api.post('/health/patients', payload).then((response) => response.data),
    onSuccess: () => {
      refreshHealth();
      setPatientForm(createHealthPatientForm());
    },
  });

  const createConsultation = useMutation({
    mutationFn: (payload) => api.post('/health/consultations', payload).then((response) => response.data),
    onSuccess: () => {
      refreshHealth();
      setConsultationForm(createHealthConsultationForm());
    },
  });

  const summary = healthOverview?.summary ?? {};
  const patientRecords = patients;
  const consultationRecords = consultations;
  const filteredPatients = filterHealthPatients(patientRecords, search);
  const overviewMetrics = buildHealthPatientDeskMetrics(summary, patientRecords, consultationRecords, formatCurrencyNGN);
  const loadError = getErrorMessage(
    patientQueries.find((query) => query.isError)?.error,
    'We could not load part of the patient workspace right now. Please try again.'
  );

  return (
    <div className="space-y-5">
      {loadError ? (
        <QueryErrorPanel
          message={loadError}
          onRetry={() => {
            patientQueries.forEach((query) => {
              query.refetch();
            });
          }}
        />
      ) : null}

      <PageHero
        eyebrow="Patient Command"
        title={`${labels.patients || 'Patients'} and clinical history`}
        description="Track patient identity, insurance cover, consultation follow-up, and billing posture from one stronger patient workspace."
      />

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-5">
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
          <CardHeader title="Register Patient" subtitle="Identity, HMO cover, guardian contact, and clinical baseline" />
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              createPatient.mutate(buildHealthPatientPayload(patientForm));
            }}
          >
            <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
              <span>Full name</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={patientForm.full_name}
                onChange={(event) => setPatientForm({ ...patientForm, full_name: event.target.value })}
                required
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Phone</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={patientForm.phone}
                onChange={(event) => setPatientForm({ ...patientForm, phone: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Email</span>
              <input
                type="email"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={patientForm.email}
                onChange={(event) => setPatientForm({ ...patientForm, email: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Date of birth</span>
              <input
                type="date"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={patientForm.date_of_birth}
                onChange={(event) => setPatientForm({ ...patientForm, date_of_birth: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Gender</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={patientForm.gender}
                onChange={(event) => setPatientForm({ ...patientForm, gender: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Blood group</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={patientForm.blood_group}
                onChange={(event) => setPatientForm({ ...patientForm, blood_group: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>HMO provider</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={patientForm.hmo_provider}
                onChange={(event) => setPatientForm({ ...patientForm, hmo_provider: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Insurance number</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={patientForm.insurance_number}
                onChange={(event) => setPatientForm({ ...patientForm, insurance_number: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Guardian name</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={patientForm.guardian_name}
                onChange={(event) => setPatientForm({ ...patientForm, guardian_name: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Guardian phone</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={patientForm.guardian_phone}
                onChange={(event) => setPatientForm({ ...patientForm, guardian_phone: event.target.value })}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
              <span>Medical history</span>
              <textarea
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                rows={4}
                value={patientForm.medical_history}
                onChange={(event) => setPatientForm({ ...patientForm, medical_history: event.target.value })}
              />
            </label>
            <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white md:col-span-2">
              {createPatient.isPending ? 'Saving patient...' : `Register ${labels.patient || 'Patient'}`}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Consultation Billing" subtitle="Triage, diagnosis, treatment, follow-up, and billing posture" />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              createConsultation.mutate(buildHealthConsultationPayload(consultationForm));
            }}
          >
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={consultationForm.patient_id}
              onChange={(event) => setConsultationForm({ ...consultationForm, patient_id: event.target.value })}
            >
              <option value="">Select patient</option>
              {patientRecords.map((patient) => <option key={patient.id} value={patient.id}>{patient.full_name}</option>)}
            </select>
            <textarea
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              rows={3}
              value={consultationForm.doctor_notes}
              onChange={(event) => setConsultationForm({ ...consultationForm, doctor_notes: event.target.value })}
            />
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={consultationForm.diagnosis}
              onChange={(event) => setConsultationForm({ ...consultationForm, diagnosis: event.target.value })}
              placeholder="Diagnosis"
            />
            <textarea
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              rows={3}
              value={consultationForm.treatment_plan}
              onChange={(event) => setConsultationForm({ ...consultationForm, treatment_plan: event.target.value })}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="date"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={consultationForm.follow_up_date}
                onChange={(event) => setConsultationForm({ ...consultationForm, follow_up_date: event.target.value })}
              />
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={consultationForm.temperature}
                onChange={(event) => setConsultationForm({ ...consultationForm, temperature: event.target.value })}
                placeholder="Temperature"
              />
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={consultationForm.blood_pressure}
                onChange={(event) => setConsultationForm({ ...consultationForm, blood_pressure: event.target.value })}
                placeholder="Blood pressure"
              />
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={consultationForm.pulse_rate}
                onChange={(event) => setConsultationForm({ ...consultationForm, pulse_rate: event.target.value })}
                placeholder="Pulse rate"
              />
              <input
                type="number"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={consultationForm.billing_amount}
                onChange={(event) => setConsultationForm({ ...consultationForm, billing_amount: event.target.value })}
                placeholder="Billing amount"
              />
              <input
                type="number"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={consultationForm.amount_paid}
                onChange={(event) => setConsultationForm({ ...consultationForm, amount_paid: event.target.value })}
                placeholder="Amount paid"
              />
            </div>
            <button type="submit" className="w-full rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-semibold text-white">
              {createConsultation.isPending ? 'Saving consultation...' : 'Save consultation'}
            </button>
          </form>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Patient Register" subtitle="Identity, insurance, clinical history, and visit footprint" />
          <div className="mb-4">
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="Search patients by name, code, phone, HMO, or guardian..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="space-y-3">
            {filteredPatients.length ? filteredPatients.map((patient) => {
              const patientCard = buildHealthPatientRecordCard(patient);

              return (
                <div key={patientCard.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900">{patientCard.title}</p>
                      <p className="text-sm text-slate-500">{patientCard.identityLabel}</p>
                      <p className="text-sm text-slate-500">{patientCard.contactLabel}</p>
                      <p className="text-sm text-slate-500">{patientCard.demographicLabel}</p>
                      <p className="text-sm text-slate-500">{patientCard.historyLabel}</p>
                      <p className="text-sm text-slate-500">{patientCard.guardianLabel}</p>
                    </div>
                    <div className="text-right text-sm text-slate-600">
                      <p>{patientCard.appointmentsLabel}</p>
                      <p>{patientCard.consultationsLabel}</p>
                      <p>{patientCard.labRequestsLabel}</p>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <EmptyState
                icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                title={patientRecords.length ? 'No patients matched your search' : 'No patient records yet'}
                description={
                  patientRecords.length
                    ? 'Try a different name or clear the search.'
                    : 'Patient records will appear here once customers are registered for care.'
                }
              />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent Consultations" subtitle="Doctor notes, diagnosis, follow-up, and billing signal" />
          <div className="space-y-3">
            {consultationRecords.length ? consultationRecords.map((consultation) => {
              const consultationCard = buildHealthConsultationCard(consultation, formatCurrencyNGN);

              return (
                <div key={consultationCard.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{consultationCard.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{consultationCard.diagnosisLabel}</p>
                  <p className="mt-1 text-sm text-slate-500">{consultationCard.treatmentLabel}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                    <span>{consultationCard.followUpLabel}</span>
                    <span>{consultationCard.outstandingLabel}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{consultationCard.billingLabel}</p>
                </div>
              );
            }) : (
              <EmptyState
                icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                title="No consultations yet"
                description="Consultations will build a history here as patients are seen."
              />
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
