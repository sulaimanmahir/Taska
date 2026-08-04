import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useBusinessType } from '../config';
import Card, { CardHeader } from '../components/Card';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import { getErrorMessage } from '../lib/apiFeedback';
import { formatCurrencyNGN } from '../lib/financeFormatters';
import {
  buildSchoolDebtorCard,
  buildSchoolFeeMetrics,
  buildSchoolFeePaymentCard,
  buildSchoolFeePaymentPayload,
  buildSchoolFeeStructureCard,
  buildSchoolFeeStructurePayload,
  createSchoolFeePaymentForm,
  createSchoolFeeStructureForm,
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

export default function Fees() {
  useBusinessType();
  const queryClient = useQueryClient();
  const [structureForm, setStructureForm] = useState(() => createSchoolFeeStructureForm());
  const [paymentForm, setPaymentForm] = useState(() => createSchoolFeePaymentForm());

  const overviewQuery = useQuery({
    queryKey: ['school-overview'],
    queryFn: () => api.get('/school/overview').then((response) => response.data),
  });

  const sessionsQuery = useQuery({
    queryKey: ['school-sessions'],
    queryFn: () => api.get('/school/sessions').then((response) => response.data ?? []),
  });

  const termsQuery = useQuery({
    queryKey: ['school-terms'],
    queryFn: () => api.get('/school/terms').then((response) => response.data ?? []),
  });

  const classroomsQuery = useQuery({
    queryKey: ['school-classes'],
    queryFn: () => api.get('/school/classes').then((response) => response.data ?? []),
  });

  const studentsQuery = useQuery({
    queryKey: ['school-students'],
    queryFn: () => api.get('/school/students').then((response) => response.data ?? []),
  });

  const structuresQuery = useQuery({
    queryKey: ['school-fee-structures'],
    queryFn: () => api.get('/school/fee-structures').then((response) => response.data ?? []),
  });

  const paymentsQuery = useQuery({
    queryKey: ['school-fee-payments'],
    queryFn: () => api.get('/school/fee-payments').then((response) => response.data ?? []),
  });

  const debtorsQuery = useQuery({
    queryKey: ['school-debtors'],
    queryFn: () => api.get('/school/debtors').then((response) => response.data ?? []),
  });

  const overview = overviewQuery.data;
  const sessions = sessionsQuery.data ?? [];
  const terms = termsQuery.data ?? [];
  const classrooms = classroomsQuery.data ?? [];
  const students = studentsQuery.data ?? [];
  const structures = structuresQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];
  const debtors = debtorsQuery.data ?? [];
  const feeQueries = [
    overviewQuery,
    sessionsQuery,
    termsQuery,
    classroomsQuery,
    studentsQuery,
    structuresQuery,
    paymentsQuery,
    debtorsQuery,
  ];

  const refresh = () => {
    ['school-overview', 'school-fee-structures', 'school-fee-payments', 'school-debtors'].forEach((key) =>
      queryClient.invalidateQueries({ queryKey: [key] })
    );
  };

  const createStructure = useMutation({
    mutationFn: (payload) => api.post('/school/fee-structures', payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      setStructureForm(createSchoolFeeStructureForm());
    },
  });

  const createPayment = useMutation({
    mutationFn: (payload) => api.post('/school/fee-payments', payload).then((response) => response.data),
    onSuccess: () => {
      refresh();
      setPaymentForm(createSchoolFeePaymentForm());
    },
  });

  const summary = overview?.summary ?? {};
  const feeMetrics = buildSchoolFeeMetrics(summary, debtors, formatCurrencyNGN);
  const debtorCards = debtors.map((debtor) => buildSchoolDebtorCard(debtor, formatCurrencyNGN));
  const paymentCards = payments.map((payment) => buildSchoolFeePaymentCard(payment, formatCurrencyNGN));
  const structureCards = structures.map((structure) => buildSchoolFeeStructureCard(structure, formatCurrencyNGN));
  const loadError = getErrorMessage(
    feeQueries.find((query) => query.isError)?.error,
    'We could not load part of the fees workspace right now. Please try again.'
  );

  return (
    <div className="space-y-5">
      {loadError ? (
        <QueryErrorPanel
          message={loadError}
          onRetry={() => {
            feeQueries.forEach((query) => {
              query.refetch();
            });
          }}
        />
      ) : null}

      <PageHero
        eyebrow="Finance Office"
        title="Fees, debtors, and discounts"
        description="Control class-level fee structures, scholarships, payments, and outstanding balances before they quietly choke cash flow."
      />

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-3">
        {feeMetrics.map((metric) => (
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
          <CardHeader title="Fee Structure" subtitle="Tuition, discounts, and scholarships" />
          <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => {
            event.preventDefault();
            createStructure.mutate(buildSchoolFeeStructurePayload(structureForm));
          }}>
            <select className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" value={structureForm.academic_session_id} onChange={(event) => setStructureForm({ ...structureForm, academic_session_id: event.target.value })}>
              <option value="">Select session</option>
              {sessions.map((session) => <option key={session.id} value={session.id}>{session.name}</option>)}
            </select>
            <select className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" value={structureForm.academic_term_id} onChange={(event) => setStructureForm({ ...structureForm, academic_term_id: event.target.value })}>
              <option value="">Select term</option>
              {terms.map((term) => <option key={term.id} value={term.id}>{term.name}</option>)}
            </select>
            <select className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" value={structureForm.school_classroom_id} onChange={(event) => setStructureForm({ ...structureForm, school_classroom_id: event.target.value })}>
              <option value="">Select class (optional)</option>
              {classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name}</option>)}
            </select>
            <input className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" value={structureForm.name} onChange={(event) => setStructureForm({ ...structureForm, name: event.target.value })} placeholder="Fee name" />
            <input className="rounded-2xl border border-slate-200 px-4 py-3" value={structureForm.amount} onChange={(event) => setStructureForm({ ...structureForm, amount: event.target.value })} placeholder="Base amount" />
            <input className="rounded-2xl border border-slate-200 px-4 py-3" value={structureForm.discount_amount} onChange={(event) => setStructureForm({ ...structureForm, discount_amount: event.target.value })} placeholder="Discount amount" />
            <input className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" value={structureForm.scholarship_amount} onChange={(event) => setStructureForm({ ...structureForm, scholarship_amount: event.target.value })} placeholder="Scholarship amount" />
            <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white md:col-span-2">
              {createStructure.isPending ? 'Saving fee structure...' : 'Save fee structure'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Record Payment" subtitle="Receipts and payment methods" />
          <form className="space-y-3" onSubmit={(event) => {
            event.preventDefault();
            createPayment.mutate(buildSchoolFeePaymentPayload(paymentForm));
          }}>
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={paymentForm.student_id} onChange={(event) => setPaymentForm({ ...paymentForm, student_id: event.target.value })}>
              <option value="">Select student</option>
              {students.map((student) => <option key={student.id} value={student.id}>{student.full_name}</option>)}
            </select>
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={paymentForm.school_fee_structure_id} onChange={(event) => setPaymentForm({ ...paymentForm, school_fee_structure_id: event.target.value })}>
              <option value="">Select fee structure</option>
              {structures.map((structure) => <option key={structure.id} value={structure.id}>{structure.name} - {structure.classroom?.name || 'General'}</option>)}
            </select>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={paymentForm.amount_paid} onChange={(event) => setPaymentForm({ ...paymentForm, amount_paid: event.target.value })} placeholder="Amount paid" />
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={paymentForm.payment_method} onChange={(event) => setPaymentForm({ ...paymentForm, payment_method: event.target.value })}>
              <option value="cash">Cash</option>
              <option value="transfer">Transfer</option>
              <option value="bank">Bank</option>
            </select>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="date" value={paymentForm.paid_at} onChange={(event) => setPaymentForm({ ...paymentForm, paid_at: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-semibold text-white">
              {createPayment.isPending ? 'Saving payment...' : 'Save payment'}
            </button>
          </form>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Fee Structure Register" subtitle="Expected value, discounts, scholarships, and collection progress" />
          <div className="space-y-3">
            {structureCards.map((structure) => (
              <div key={structure.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{structure.title}</p>
                    <p className="text-sm text-slate-500">{structure.classLabel}</p>
                    <p className="mt-1 text-sm text-slate-500">Base {structure.amountLabel} | Discount {structure.discountLabel}</p>
                    <p className="text-sm text-slate-500">Scholarship {structure.scholarshipLabel}</p>
                  </div>
                  <div className="text-right text-sm text-slate-600">
                    <p>Expected {structure.expectedLabel}</p>
                    <p>Collected {structure.collectedLabel}</p>
                    <p className="font-semibold text-amber-700">Outstanding {structure.outstandingLabel}</p>
                  </div>
                </div>
              </div>
            ))}
            {!structureCards.length ? (
              <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No fee structures have been configured yet.
              </p>
            ) : null}
          </div>
        </Card>

        <Card>
          <CardHeader title="Debtor Report" subtitle="Students needing fee follow-up" />
          <div className="space-y-3">
            {debtorCards.map((debtor) => (
              <div key={debtor.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-semibold text-slate-900">{debtor.title}</p>
                <p className="text-sm text-slate-600">{debtor.classroomLabel}</p>
                <p className="text-sm text-slate-600">{debtor.expectedVsPaidLabel}</p>
                <p className="text-sm font-semibold text-amber-700">{debtor.balanceLabel}</p>
              </div>
            ))}
            {!debtorCards.length ? (
              <p className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-700">
                No active fee debtors right now.
              </p>
            ) : null}
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent Fee Payments" subtitle="Latest receipts and payment mix" />
          <div className="space-y-3">
            {paymentCards.map((payment) => (
              <div key={payment.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{payment.title}</p>
                <p className="text-sm text-slate-500">{payment.methodLabel}</p>
                <p className="text-sm text-slate-500">{payment.contextLabel}</p>
                <p className="text-sm text-slate-500">{payment.paidAtLabel}</p>
                <p className="text-sm font-semibold text-slate-900">{payment.amountLabel}</p>
              </div>
            ))}
            {!paymentCards.length ? (
              <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No fee payments have been recorded yet.
              </p>
            ) : null}
          </div>
        </Card>
      </section>
    </div>
  );
}
