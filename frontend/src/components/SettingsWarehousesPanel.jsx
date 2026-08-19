import { useEffect, useState } from 'react';
import api from '../lib/api';
import Button from './Button';
import Card, { CardHeader } from './Card';
import { FinanceFormError } from './FinanceFormFeedback';
import { ResponsiveCardGrid } from './PageShell';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';
import { getSettingsSubmitError } from '../lib/settingsForms';
import {
  buildSettingsWarehouseCreateDefaults,
  buildSettingsWarehouseDrafts,
  buildSettingsWarehouseMetrics,
  buildSettingsWarehouseStatusNote,
  formatSettingsWarehouseBranchLabel,
  hasSettingsWarehouseDraftChanges,
  sortSettingsWarehouses,
} from '../lib/settingsWarehouses';
import OpsMetricCard from './OpsMetricCard';

export default function SettingsWarehousesPanel({ content }) {
  const [warehouses, setWarehouses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [createForm, setCreateForm] = useState(buildSettingsWarehouseCreateDefaults());
  const [createError, setCreateError] = useState('');
  const [warehouseDrafts, setWarehouseDrafts] = useState({});
  const [creating, setCreating] = useState(false);
  const [savingWarehouseId, setSavingWarehouseId] = useState(null);
  const { toast, setToast, clearToast } = useToast();

  const sortedWarehouses = sortSettingsWarehouses(warehouses);
  const metrics = buildSettingsWarehouseMetrics(warehouses);

  const loadData = async ({ resetCreateForm = false } = {}) => {
    setLoading(true);
    setLoadError('');

    try {
      const [warehouseResponse, branchResponse] = await Promise.all([
        api.get('/warehouses'),
        api.get('/branches'),
      ]);

      const nextWarehouses = warehouseResponse.data?.data ?? [];
      setWarehouses(nextWarehouses);
      setWarehouseDrafts(buildSettingsWarehouseDrafts(nextWarehouses));
      setBranches(branchResponse.data?.branches ?? []);

      if (resetCreateForm) {
        setCreateForm(buildSettingsWarehouseCreateDefaults());
      }
    } catch (error) {
      setWarehouses([]);
      setWarehouseDrafts({});
      setLoadError(getSettingsSubmitError(error, 'We could not load warehouse controls right now.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadOnMount = async () => {
      await loadData();
    };

    void loadOnMount();
  }, []);

  const handleCreateChange = (key, value) => {
    setCreateForm((current) => ({ ...current, [key]: value }));
  };

  const handleCreateWarehouse = async (event) => {
    event.preventDefault();
    setCreateError('');
    clearToast();

    if (!createForm.name.trim()) {
      setCreateError('Warehouse name is required before you can create another warehouse.');
      return;
    }

    setCreating(true);

    try {
      const { data } = await api.post('/warehouses', {
        name: createForm.name.trim(),
        branch_id: createForm.branch_id || null,
        description: createForm.description.trim(),
        address: createForm.address.trim(),
        is_default: createForm.is_default,
      });

      await loadData({ resetCreateForm: true });
      setToast({ tone: 'success', message: data.message || 'Warehouse created successfully.' });
    } catch (error) {
      const message = getSettingsSubmitError(error, 'We could not create that warehouse right now.');
      setCreateError(message);
      setToast({ tone: 'error', message });
    } finally {
      setCreating(false);
    }
  };

  const handleDraftChange = (warehouseId, key, value) => {
    setWarehouseDrafts((current) => ({
      ...current,
      [warehouseId]: { ...current[warehouseId], [key]: value },
    }));
  };

  const handleSaveWarehouse = async (warehouse) => {
    const draft = warehouseDrafts[warehouse.id];

    if (!draft || !hasSettingsWarehouseDraftChanges(warehouse, draft)) {
      return;
    }

    if (!draft.name.trim()) {
      setToast({ tone: 'error', message: 'Warehouse name is required before you can save changes.' });
      return;
    }

    clearToast();
    setSavingWarehouseId(warehouse.id);

    try {
      const { data } = await api.patch(`/warehouses/${warehouse.id}`, {
        name: draft.name.trim(),
        branch_id: draft.branch_id || null,
        description: draft.description.trim(),
        address: draft.address.trim(),
        is_active: draft.is_active,
        ...(draft.is_default ? { is_default: true } : {}),
      });

      await loadData();
      setToast({ tone: 'success', message: data.message || 'Warehouse updated successfully.' });
    } catch (error) {
      setToast({ tone: 'error', message: getSettingsSubmitError(error, 'We could not update that warehouse right now.') });
    } finally {
      setSavingWarehouseId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[18rem] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Warehouse settings feedback" />

      {loadError ? (
        <Card className="border-rose-200 bg-rose-50/70">
          <CardHeader title="Warehouse controls are unavailable" subtitle="Please try again" />
          <p className="text-sm text-rose-900">{loadError}</p>
        </Card>
      ) : (
        <>
          {content?.intro ? <p className="text-sm text-slate-600">{content.intro}</p> : null}

          <ResponsiveCardGrid variant="metrics">
            {metrics.map((metric) => (
              <OpsMetricCard key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} tone={metric.tone} />
            ))}
          </ResponsiveCardGrid>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <Card>
              <CardHeader title="Add warehouse" subtitle="Register another stock location and tie it to a branch" />
              <FinanceFormError message={createError} />
              <form className="space-y-4" onSubmit={handleCreateWarehouse}>
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  <span>Warehouse name</span>
                  <input
                    className="input"
                    value={createForm.name}
                    onChange={(event) => handleCreateChange('name', event.target.value)}
                  />
                </label>

                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  <span>Branch</span>
                  <select
                    className="input"
                    value={createForm.branch_id}
                    onChange={(event) => handleCreateChange('branch_id', event.target.value)}
                  >
                    <option value="">Not assigned to a branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  <span>Address</span>
                  <input
                    className="input"
                    value={createForm.address}
                    onChange={(event) => handleCreateChange('address', event.target.value)}
                  />
                </label>

                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  <span>Description</span>
                  <textarea
                    className="input"
                    rows={2}
                    value={createForm.description}
                    onChange={(event) => handleCreateChange('description', event.target.value)}
                  />
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    checked={createForm.is_default}
                    onChange={(event) => handleCreateChange('is_default', event.target.checked)}
                  />
                  <span>
                    <span className="block font-semibold text-slate-900">Make this the default warehouse</span>
                    <span className="mt-1 block text-slate-600">
                      Used business-wide whenever a sale or purchase doesn't resolve a more specific warehouse.
                    </span>
                  </span>
                </label>

                <div className="flex justify-end border-t border-slate-200 pt-4">
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Creating warehouse...' : 'Create warehouse'}
                  </Button>
                </div>
              </form>
            </Card>

            <div className="space-y-4">
              {sortedWarehouses.length === 0 ? (
                <Card>
                  <p className="text-sm text-slate-500">No warehouses yet. Create the first one to start routing stock.</p>
                </Card>
              ) : sortedWarehouses.map((warehouse) => {
                const draft = warehouseDrafts[warehouse.id] || {};
                const isDirty = hasSettingsWarehouseDraftChanges(warehouse, draft);
                const isSaving = savingWarehouseId === warehouse.id;

                return (
                  <Card key={warehouse.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{warehouse.name}</p>
                        <p className="text-xs text-slate-500">{formatSettingsWarehouseBranchLabel(warehouse)}</p>
                      </div>
                      {warehouse.is_default ? (
                        <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">Default</span>
                      ) : null}
                    </div>

                    <p className="mt-2 text-xs text-slate-500">{buildSettingsWarehouseStatusNote(warehouse)}</p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1 text-xs font-semibold text-slate-600">
                        <span>Branch</span>
                        <select
                          className="input"
                          value={draft.branch_id ?? ''}
                          onChange={(event) => handleDraftChange(warehouse.id, 'branch_id', event.target.value)}
                        >
                          <option value="">Not assigned to a branch</option>
                          {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                          ))}
                        </select>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 sm:justify-self-end">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          checked={draft.is_active ?? true}
                          onChange={(event) => handleDraftChange(warehouse.id, 'is_active', event.target.checked)}
                        />
                        Active
                      </label>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        disabled={!isDirty || isSaving}
                        onClick={() => handleSaveWarehouse(warehouse)}
                      >
                        {isSaving ? 'Saving...' : 'Save changes'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
