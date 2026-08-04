import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Button from '../components/Button';
import Card from '../components/Card';
import ConfirmDialog from '../components/ConfirmDialog';
import ModalShell, { ModalActions } from '../components/ModalShell';
import OpsMetricCard from '../components/OpsMetricCard';
import PageHero from '../components/PageHero';
import { ResponsiveCardGrid } from '../components/PageShell';
import { useModalShell } from '../components/ModalShellContext';
import {
  buildSupplierCard,
  buildSupplierOverviewMetrics,
  buildSupplierPayload,
  createSupplierForm,
  filterSuppliers,
} from '../lib/suppliers';
import { formatCurrencyNGN } from '../lib/financeFormatters';

function QueryErrorPanel({ message, onRetry }) {
  if (!message) {
    return null;
  }

  return (
    <div className="border-b border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p>{message}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start text-rose-700 hover:bg-rose-100"
          onClick={onRetry}
        >
          Retry
        </Button>
      </div>
    </div>
  );
}

export default function Suppliers() {
  const emptySupplierForm = createSupplierForm();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [pendingDeleteSupplier, setPendingDeleteSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptySupplierForm);
  const [supplierBaseline, setSupplierBaseline] = useState(emptySupplierForm);

  const suppliersQuery = useQuery({ queryKey: ['suppliers'], queryFn: () => api.get('/suppliers').then((response) => response.data) });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/suppliers', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      setShowModal(false);
      setForm(emptySupplierForm);
      setSupplierBaseline(emptySupplierForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/suppliers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      setShowModal(false);
      setEditingId(null);
      setForm(emptySupplierForm);
      setSupplierBaseline(emptySupplierForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      setPendingDeleteSupplier(null);
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: buildSupplierPayload(form) });
      return;
    }
    createMutation.mutate(buildSupplierPayload(form));
  };

  const openEdit = (supplier) => {
    const nextForm = {
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || '',
      state: supplier.state || '',
      contact_person: supplier.contact_person || '',
      is_active: supplier.is_active !== false,
    };
    setForm(nextForm);
    setSupplierBaseline(nextForm);
    setEditingId(supplier.id);
    setShowModal(true);
  };

  const resetSupplierForm = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptySupplierForm);
    setSupplierBaseline(emptySupplierForm);
  };
  const supplierModalBusy = createMutation.isPending || updateMutation.isPending;
  const supplierModalDirty = JSON.stringify(form) !== JSON.stringify(supplierBaseline);
  const suppliers = suppliersQuery.data;
  const supplierRecords = suppliers?.data ?? [];
  const filteredSuppliers = filterSuppliers(supplierRecords, searchTerm);
  const loadError = suppliersQuery.error ? 'We could not load suppliers right now. Please try again.' : '';

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Supplier Desk"
        title="Suppliers"
        description="Keep vendors, contact details, and purchasing relationships clean and easy to reach."
        actions={(
          <Button onClick={() => {
            setForm(emptySupplierForm);
            setSupplierBaseline(emptySupplierForm);
            setShowModal(true);
          }}>
            New supplier
          </Button>
        )}
      />

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-5">
        {buildSupplierOverviewMetrics(supplierRecords, formatCurrencyNGN).map((metric) => (
          <OpsMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            tone={metric.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <Card padding={false} className="overflow-hidden">
        <QueryErrorPanel
          message={loadError}
          onRetry={() => {
            void suppliersQuery.refetch();
          }}
        />

        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Supplier Register</p>
              <p className="mt-1 text-sm text-slate-500">
                Keep vendor contact coverage, procurement readiness, and payable exposure easy to review.
              </p>
            </div>
            <input
              className="input lg:max-w-sm"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search supplier register"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredSuppliers.map((supplier) => {
            const supplierCard = buildSupplierCard(supplier, formatCurrencyNGN);

            return (
              <Card key={supplierCard.id}>
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-soft)] font-bold text-[var(--color-brand)]">
                    {supplierCard.initial}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(supplier)} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={() => setPendingDeleteSupplier(supplier)} className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H6a1 1 0 00-1 1v3M8 7h8" /></svg>
                    </button>
                  </div>
                </div>
                <h3 className="mb-1 font-semibold text-slate-900">{supplierCard.title}</h3>
                <p className="text-sm text-slate-500">{supplierCard.phoneLabel}</p>
                <p className="text-sm text-slate-500">{supplierCard.emailLabel}</p>
                <p className="mt-2 text-sm text-slate-500">{supplierCard.contactPersonLabel}</p>
                <p className="text-sm text-slate-500">{supplierCard.locationLabel}</p>
                <p className="mt-2 text-sm text-slate-500">{supplierCard.addressLabel}</p>
                <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">{supplierCard.statusLabel}</span>
                  <span className="font-semibold text-slate-900">{supplierCard.balanceLabel}</span>
                </div>
              </Card>
            );
          })}

          {!filteredSuppliers.length ? (
            <Card className="col-span-full p-8 text-center text-slate-500">
              {supplierRecords.length ? 'No suppliers matched the current search.' : 'No suppliers yet'}
            </Card>
          ) : null}
        </div>
      </Card>

      {showModal ? (
        <ModalShell
          title={editingId ? 'Edit Supplier' : 'Save Supplier'}
          subtitle="Capture the supplier profile before the next purchase run."
          size="lg"
          tone="emerald"
          busy={supplierModalBusy}
          dismissPreset="guarded"
          busyDismissPreset="locked"
          draftState={supplierModalBusy ? 'saving' : supplierModalDirty ? 'dirty' : null}
          draftStatePreset="editor"
          closeGuardPreset="leaveEditor"
          scrollAreaClassName="pr-0"
          bodyClassName="pb-1"
          headerBadgePreset="profile"
          headerBadgeLabel="Supplier profile"
          onClose={resetSupplierForm}
        >
          <SupplierModalForm
            form={form}
            handleSubmit={handleSubmit}
            setForm={setForm}
            supplierModalBusy={supplierModalBusy}
          />
        </ModalShell>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDeleteSupplier)}
        title="Delete Supplier"
        copyPreset="deleteRecord"
        copyContext={{ noun: 'supplier' }}
        detailPreset="contactRecord"
        detailContext={{
          recordName: pendingDeleteSupplier?.name || 'Supplier record',
          phone: pendingDeleteSupplier?.phone,
          email: pendingDeleteSupplier?.email,
        }}
        detailsLayout="summary"
        isBusy={deleteMutation.isPending}
        onCancel={() => setPendingDeleteSupplier(null)}
        onConfirm={() => {
          if (pendingDeleteSupplier) {
            deleteMutation.mutate(pendingDeleteSupplier.id);
          }
        }}
      />
    </div>
  );
}

function SupplierModalForm({ form, handleSubmit, setForm, supplierModalBusy }) {
  const modal = useModalShell();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">Name</label>
        <input type="text" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="input" placeholder="Supplier name" data-autofocus="true" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">Email</label>
        <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="input" placeholder="email@example.com" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">Phone</label>
        <input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="input" placeholder="+234..." />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">Address</label>
        <textarea value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="input min-h-[96px] resize-y py-3" rows={2} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">Contact person</label>
        <input type="text" value={form.contact_person} onChange={(event) => setForm({ ...form, contact_person: event.target.value })} className="input" placeholder="Primary vendor contact" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">City</label>
          <input type="text" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="input" placeholder="City" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">State</label>
          <input type="text" value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} className="input" placeholder="State" />
        </div>
      </div>
      <label className="flex items-center gap-3 text-sm font-medium text-slate-600">
        <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
        Supplier is active for purchasing
      </label>
      <ModalActions tone="emerald" preset="form">
        <Button type="button" variant="secondary" size="lg" fullWidth onClick={modal.requestClose} disabled={supplierModalBusy} data-modal-dismiss="true">Cancel</Button>
        <Button type="submit" size="lg" fullWidth disabled={supplierModalBusy}>{supplierModalBusy ? 'Saving supplier...' : 'Save supplier'}</Button>
      </ModalActions>
    </form>
  );
}
