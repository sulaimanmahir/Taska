import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Card, { CardHeader } from '../components/Card';
import OpsMetricCard from '../components/OpsMetricCard';
import { ResponsiveCardGrid } from '../components/PageShell';
import PageHero from '../components/PageHero';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../lib/apiFeedback';
import { useBusinessType } from '../config';
import {
  buildNgoDeskMetrics as buildWarehouseDeskMetrics,
  buildNgoDistributionCard as buildWarehouseDistributionCard,
  buildNgoDistributionPayload as buildWarehouseDistributionPayload,
  buildNgoInventoryCard as buildWarehouseInventoryCard,
  buildNgoPartnerRequestCard as buildWarehouseRequestCard,
  createNgoDistributionForm as createWarehouseDistributionForm,
  createNgoDonorForm as createWarehouseSourceForm,
  createNgoRequestForm as createWarehouseRequestForm,
  createNgoSignatureForm as createWarehouseSignatureForm,
  filterNgoDistributions as filterWarehouseDistributions,
  filterNgoInventory as filterWarehouseInventory,
  filterNgoRequests as filterWarehouseRequests,
} from '../lib/ngoWarehouse';

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

export default function WarehouseOps() {
  const { labels } = useBusinessType();
  const queryClient = useQueryClient();
  const { toast, setToast, clearToast } = useToast();
  const [donorForm, setDonorForm] = useState(createWarehouseSourceForm);
  const [requestForm, setRequestForm] = useState(createWarehouseRequestForm);
  const [distributionForm, setDistributionForm] = useState(createWarehouseDistributionForm);
  const [signatureForm, setSignatureForm] = useState(createWarehouseSignatureForm);
  const [requestSearch, setRequestSearch] = useState('');
  const [distributionSearch, setDistributionSearch] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['warehouse-overview'],
    queryFn: () => api.get('/warehouse/overview').then((response) => response.data),
    staleTime: 60000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['warehouse-overview'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  };

  const saveDonor = useMutation({
    mutationFn: (payload) => api.post('/warehouse/donors', payload).then((response) => response.data),
    onSuccess: () => {
      setDonorForm(createWarehouseSourceForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Warehouse source saved into the accountability register.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that warehouse source right now.') });
    },
  });

  const saveRequest = useMutation({
    mutationFn: (payload) => api.post('/warehouse/partner-requests', payload).then((response) => response.data),
    onSuccess: () => {
      setRequestForm(createWarehouseRequestForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Warehouse request saved into the active release queue.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that warehouse request right now.') });
    },
  });

  const saveDistribution = useMutation({
    mutationFn: (payload) => api.post('/warehouse/distributions', payload).then((response) => response.data),
    onSuccess: () => {
      setDistributionForm(createWarehouseDistributionForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Warehouse release saved into the dispatch ledger.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that warehouse release right now.') });
    },
  });

  const saveSignature = useMutation({
    mutationFn: (payload) => api.post(`/warehouse/distributions/${payload.distribution_id}/signatures`, payload).then((response) => response.data),
    onSuccess: () => {
      setSignatureForm(createWarehouseSignatureForm());
      refresh();
      clearToast();
      setToast({ tone: 'success', message: 'Release signature captured for warehouse accountability.' });
    },
    onError: (mutationError) => {
      setToast({ tone: 'error', message: getErrorMessage(mutationError, 'We could not save that release signature right now.') });
    },
  });

  const summary = data?.summary || {};
  const donors = data?.donors || [];
  const partnerRequests = data?.partner_requests || [];
  const distributions = data?.distributions || [];
  const inventory = data?.inventory || [];

  const metrics = buildWarehouseDeskMetrics(summary, partnerRequests, distributions, inventory, isLoading);
  const requestCards = useMemo(
    () => filterWarehouseRequests(partnerRequests, requestSearch).map((request) => buildWarehouseRequestCard(request)),
    [partnerRequests, requestSearch],
  );
  const distributionCards = useMemo(
    () => filterWarehouseDistributions(distributions, distributionSearch).map((distribution) => buildWarehouseDistributionCard(distribution)),
    [distributionSearch, distributions],
  );
  const inventoryCards = useMemo(
    () => filterWarehouseInventory(inventory, inventorySearch).map((item) => buildWarehouseInventoryCard(item)),
    [inventory, inventorySearch],
  );

  return (
    <div className="space-y-5">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Warehouse feedback" />

      <PageHero
        eyebrow="Warehouse Edition"
        title={labels.dashboard}
        description="Track source accountability, request intake, stock releases, signatures, waybills, and expiry-sensitive inventory from one stronger warehouse operations desk."
      />

      {error ? (
        <QueryErrorPanel
          message={getErrorMessage(error, 'We could not load the warehouse desk right now.')}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-7">
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Source" subtitle="Capture every inbound stock source with contact and compliance context for audit-grade accountability." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveDonor.mutate(donorForm);
            }}
          >
            <input className="input" placeholder="Source name" value={donorForm.name} onChange={(event) => setDonorForm({ ...donorForm, name: event.target.value })} />
            <input className="input" placeholder="Contact person" value={donorForm.contact_person} onChange={(event) => setDonorForm({ ...donorForm, contact_person: event.target.value })} />
            <input className="input" placeholder="Phone" value={donorForm.phone} onChange={(event) => setDonorForm({ ...donorForm, phone: event.target.value })} />
            <input className="input" placeholder="Compliance reference" value={donorForm.compliance_reference} onChange={(event) => setDonorForm({ ...donorForm, compliance_reference: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white">
              {saveDonor.isPending ? 'Saving source...' : 'Save source'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Warehouse Request" subtitle="Log demand before any release leaves the warehouse so planning and approvals stay visible." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveRequest.mutate(requestForm);
            }}
          >
            <input className="input" placeholder="Requestor name" value={requestForm.partner_name} onChange={(event) => setRequestForm({ ...requestForm, partner_name: event.target.value })} />
            <textarea className="input min-h-[108px] resize-y py-3" placeholder="Request notes" value={requestForm.request_notes} onChange={(event) => setRequestForm({ ...requestForm, request_notes: event.target.value })} />
            <div className="grid gap-3 md:grid-cols-2">
              <input className="input" type="date" value={requestForm.needed_by} onChange={(event) => setRequestForm({ ...requestForm, needed_by: event.target.value })} />
              <select className="input" value={requestForm.status} onChange={(event) => setRequestForm({ ...requestForm, status: event.target.value })}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button type="submit" className="w-full rounded-2xl bg-cyan-700 px-4 py-3 font-semibold text-white">
              {saveRequest.isPending ? 'Saving request...' : 'Save warehouse request'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Release Signature" subtitle="Capture signed beneficiary confirmation so released stock closes the accountability loop." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveSignature.mutate(signatureForm);
            }}
          >
            <select className="input" value={signatureForm.distribution_id} onChange={(event) => setSignatureForm({ ...signatureForm, distribution_id: event.target.value })}>
              <option value="">Release</option>
              {distributions.map((distribution) => <option key={distribution.id} value={distribution.id}>{distribution.distribution_reference}</option>)}
            </select>
            <input className="input" placeholder="Recipient name" value={signatureForm.beneficiary_name} onChange={(event) => setSignatureForm({ ...signatureForm, beneficiary_name: event.target.value })} />
            <input className="input" placeholder="Signed by" value={signatureForm.signed_by} onChange={(event) => setSignatureForm({ ...signatureForm, signed_by: event.target.value })} />
            <input className="input" placeholder="Signature reference" value={signatureForm.signature_reference} onChange={(event) => setSignatureForm({ ...signatureForm, signature_reference: event.target.value })} />
            <button type="submit" className="w-full rounded-2xl bg-violet-700 px-4 py-3 font-semibold text-white">
              {saveSignature.isPending ? 'Saving signature...' : 'Save release signature'}
            </button>
          </form>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader title="Release Desk" subtitle="Create accountable stock releases with source, request, destination, and dispatch context in one save flow." />
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              clearToast();
              saveDistribution.mutate(buildWarehouseDistributionPayload(distributionForm));
            }}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <select className="input" value={distributionForm.partner_request_id} onChange={(event) => setDistributionForm({ ...distributionForm, partner_request_id: event.target.value })}>
                <option value="">Request</option>
                {partnerRequests.map((request) => <option key={request.id} value={request.id}>{request.request_reference} - {request.partner_name}</option>)}
              </select>
              <select className="input" value={distributionForm.donor_source_id} onChange={(event) => setDistributionForm({ ...distributionForm, donor_source_id: event.target.value })}>
                <option value="">Source</option>
                {donors.map((donor) => <option key={donor.id} value={donor.id}>{donor.name}</option>)}
              </select>
              <input className="input" placeholder="Recipient name" value={distributionForm.beneficiary_name} onChange={(event) => setDistributionForm({ ...distributionForm, beneficiary_name: event.target.value })} />
              <input className="input" placeholder="Destination location" value={distributionForm.destination_location} onChange={(event) => setDistributionForm({ ...distributionForm, destination_location: event.target.value })} />
              <input className="input" placeholder="Driver" value={distributionForm.driver_name} onChange={(event) => setDistributionForm({ ...distributionForm, driver_name: event.target.value })} />
              <input className="input" placeholder="Vehicle" value={distributionForm.vehicle_reference} onChange={(event) => setDistributionForm({ ...distributionForm, vehicle_reference: event.target.value })} />
              <select className="input" value={distributionForm.status} onChange={(event) => setDistributionForm({ ...distributionForm, status: event.target.value })}>
                <option value="dispatched">Dispatched</option>
                <option value="draft">Draft</option>
              </select>
              <input className="input" type="date" value={distributionForm.distributed_on} onChange={(event) => setDistributionForm({ ...distributionForm, distributed_on: event.target.value })} />
              <select className="input" value={distributionForm.item_product_id} onChange={(event) => setDistributionForm({ ...distributionForm, item_product_id: event.target.value })}>
                <option value="">Item</option>
                {inventory.map((item) => <option key={item.product_id || item.id} value={item.product_id}>{item.product?.name}</option>)}
              </select>
              <input className="input" type="number" min="0" step="0.001" placeholder="Quantity" value={distributionForm.item_quantity} onChange={(event) => setDistributionForm({ ...distributionForm, item_quantity: event.target.value })} />
            </div>
            <button type="submit" className="w-full rounded-2xl bg-emerald-700 px-4 py-4 font-semibold text-white">
              {saveDistribution.isPending ? 'Saving release...' : 'Save release'}
            </button>
          </form>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader
              title="Inventory Watch"
              subtitle="Stock lines, warehouse location, and expiry context for the items likely to support the next request."
              className="mb-0"
            />
            <input
              className="input"
              value={inventorySearch}
              onChange={(event) => setInventorySearch(event.target.value)}
              placeholder="Search inventory, SKU, warehouse, or expiry..."
            />
          </div>
          <div className="mt-4 space-y-3">
            {inventoryCards.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-500">{item.warehouseLabel}</p>
                <p className="text-sm text-slate-500">{item.quantityLabel}</p>
                <p className="text-xs text-slate-500">{item.reorderLabel} | {item.expiryLabel}</p>
              </div>
            ))}
            {!inventoryCards.length ? (
              <p className="text-sm text-slate-500">No warehouse inventory matched the current search.</p>
            ) : null}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader
              title="Request Register"
              subtitle="Partner demand currently in the warehouse pipeline with target date and note context."
              className="mb-0"
            />
            <input
              className="input"
              value={requestSearch}
              onChange={(event) => setRequestSearch(event.target.value)}
              placeholder="Search requestor, reference, status, or notes..."
            />
          </div>
          <div className="mt-4 space-y-3">
            {requestCards.map((requestCard) => (
              <div key={requestCard.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="font-medium text-slate-900">{requestCard.title}</p>
                <p className="mt-1 text-xs text-slate-500">{requestCard.detailLabel}</p>
                <p className="mt-1 text-xs text-slate-500">{requestCard.neededByLabel}</p>
                <p className="mt-2 text-sm text-slate-600">{requestCard.notesLabel}</p>
              </div>
            ))}
            {!requestCards.length ? (
              <p className="text-sm text-slate-500">No warehouse requests matched the current search.</p>
            ) : null}
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
            <CardHeader
              title="Distribution Feed"
              subtitle="Recent releases with destination, signature, and dispatch state all visible in one ledger."
              className="mb-0"
            />
            <input
              className="input"
              value={distributionSearch}
              onChange={(event) => setDistributionSearch(event.target.value)}
              placeholder="Search release, beneficiary, destination, or item..."
            />
          </div>
          <div className="mt-4 space-y-3">
            {distributionCards.map((distributionCard) => (
              <div key={distributionCard.id} className="rounded-2xl bg-cyan-50 px-4 py-3">
                <p className="font-medium text-cyan-900">{distributionCard.title}</p>
                <p className="mt-1 text-xs text-cyan-700">{distributionCard.detailLabel}</p>
                <p className="mt-1 text-xs text-cyan-700">{distributionCard.destinationLabel}</p>
                <p className="mt-2 text-sm text-cyan-900">{distributionCard.statusLabel} | {distributionCard.distributedOnLabel}</p>
                <p className="mt-1 text-xs text-cyan-700">{distributionCard.itemCountLabel}</p>
              </div>
            ))}
            {!distributionCards.length ? (
              <p className="text-sm text-slate-500">No warehouse releases matched the current search.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
