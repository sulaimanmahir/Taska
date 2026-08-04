import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import Button from './Button';
import Card, { CardHeader } from './Card';
import { FinanceFormError } from './FinanceFormFeedback';
import OpsMetricCard from './OpsMetricCard';
import { ResponsiveCardGrid } from './PageShell';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';
import { getSettingsSubmitError } from '../lib/settingsForms';
import {
  buildSettingsBranchCreateDefaults,
  buildSettingsBranchDrafts,
  buildSettingsBranchMetrics,
  buildSettingsBranchStatusNote,
  formatSettingsBranchFootprint,
  hasSettingsBranchDraftChanges,
  sortSettingsBranches,
} from '../lib/settingsBranches';

const EMPTY_BRANCH_STATE = {
  business: null,
  summary: {
    branch_count: 0,
    active_branch_count: 0,
    inactive_branch_count: 0,
    branch_coverage_count: 0,
    warehouse_count: 0,
  },
  branches: [],
};

function buildBranchState(payload = {}) {
  return {
    business: payload.business ?? null,
    summary: payload.summary ?? EMPTY_BRANCH_STATE.summary,
    branches: sortSettingsBranches(payload.branches ?? []),
  };
}

export default function SettingsBranchesPanel({ content }) {
  const [branchState, setBranchState] = useState(EMPTY_BRANCH_STATE);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [createForm, setCreateForm] = useState(buildSettingsBranchCreateDefaults());
  const [createError, setCreateError] = useState('');
  const [branchDrafts, setBranchDrafts] = useState({});
  const [creating, setCreating] = useState(false);
  const [savingBranchId, setSavingBranchId] = useState(null);
  const { toast, setToast, clearToast } = useToast();

  const metrics = useMemo(
    () => buildSettingsBranchMetrics({
      summary: branchState.summary,
      branches: branchState.branches,
    }),
    [branchState.branches, branchState.summary],
  );

  const syncBranchState = (payload, { resetCreateForm = false } = {}) => {
    const nextState = buildBranchState(payload);
    setBranchState(nextState);
    setBranchDrafts(buildSettingsBranchDrafts(nextState.branches));

    if (resetCreateForm) {
      setCreateForm(buildSettingsBranchCreateDefaults());
    }
  };

  useEffect(() => {
    let isActive = true;

    const loadBranches = async () => {
      setLoading(true);
      setLoadError('');

      try {
        const { data } = await api.get('/branches');

        if (!isActive) {
          return;
        }

        syncBranchState(data, { resetCreateForm: true });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setBranchState(EMPTY_BRANCH_STATE);
        setBranchDrafts({});
        setLoadError(getSettingsSubmitError(error, 'We could not load branch controls right now.'));
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadBranches();

    return () => {
      isActive = false;
    };
  }, []);

  const handleCreateChange = (key, value) => {
    setCreateForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleCreateBranch = async (event) => {
    event.preventDefault();
    setCreateError('');
    clearToast();

    if (!createForm.name.trim()) {
      setCreateError('Branch name is required before you can create another operating location.');
      return;
    }

    setCreating(true);

    try {
      const { data } = await api.post('/branches', {
        name: createForm.name.trim(),
        phone: createForm.phone.trim(),
        city: createForm.city.trim(),
        state: createForm.state.trim(),
        address: createForm.address.trim(),
        is_primary: createForm.is_primary,
      });

      syncBranchState(data, { resetCreateForm: true });
      setToast({
        tone: 'success',
        message: data.message || 'Branch created successfully.',
      });
    } catch (error) {
      const message = getSettingsSubmitError(error, 'We could not create that branch right now.');
      setCreateError(message);
      setToast({
        tone: 'error',
        message,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDraftChange = (branchId, key, value) => {
    setBranchDrafts((current) => ({
      ...current,
      [branchId]: {
        ...current[branchId],
        [key]: value,
      },
    }));
  };

  const handleSaveBranch = async (branch) => {
    const draft = branchDrafts[branch.id];

    if (!draft || !hasSettingsBranchDraftChanges(branch, draft)) {
      return;
    }

    if (!draft.name.trim()) {
      setToast({
        tone: 'error',
        message: 'Branch name is required before you can save changes.',
      });
      return;
    }

    clearToast();
    setSavingBranchId(branch.id);

    try {
      const payload = {
        name: draft.name.trim(),
        phone: draft.phone.trim(),
        city: draft.city.trim(),
        state: draft.state.trim(),
        address: draft.address.trim(),
        is_active: draft.is_active,
        ...(draft.is_primary ? { is_primary: true } : {}),
      };
      const { data } = await api.patch(`/branches/${branch.id}`, payload);

      syncBranchState(data);
      setToast({
        tone: 'success',
        message: data.message || 'Branch updated successfully.',
      });
    } catch (error) {
      setToast({
        tone: 'error',
        message: getSettingsSubmitError(error, 'We could not update that branch right now.'),
      });
    } finally {
      setSavingBranchId(null);
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
      <Toast
        tone={toast?.tone}
        message={toast?.message}
        groupAriaLabel="Branch settings feedback"
      />

      {loadError ? (
        <Card className="border-rose-200 bg-rose-50/70">
          <CardHeader
            title="Branch controls are unavailable"
            subtitle="This settings section only works for active business owners right now"
          />
          <div className="space-y-4 text-sm text-rose-900">
            <p>{loadError}</p>
            <p>
              If you expected access here, confirm that your current workspace role is still an active
              <span className="font-semibold"> Business Owner</span>.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <ResponsiveCardGrid variant="metrics">
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

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <Card>
              <CardHeader
                title="Add branch"
                subtitle="Create another operating location inside the current workspace"
              />
              <p className="text-sm text-slate-600">{content?.intro}</p>
              <FinanceFormError message={createError} />
              <form className="space-y-4" onSubmit={handleCreateBranch}>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    <span>Branch name</span>
                    <input
                      className="input"
                      value={createForm.name}
                      onChange={(event) => handleCreateChange('name', event.target.value)}
                      autoComplete="organization"
                    />
                  </label>

                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    <span>Phone number</span>
                    <input
                      className="input"
                      type="tel"
                      value={createForm.phone}
                      onChange={(event) => handleCreateChange('phone', event.target.value)}
                      autoComplete="tel"
                    />
                  </label>

                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    <span>City</span>
                    <input
                      className="input"
                      value={createForm.city}
                      onChange={(event) => handleCreateChange('city', event.target.value)}
                      autoComplete="address-level2"
                    />
                  </label>

                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    <span>State</span>
                    <input
                      className="input"
                      value={createForm.state}
                      onChange={(event) => handleCreateChange('state', event.target.value)}
                      autoComplete="address-level1"
                    />
                  </label>

                  <label className="space-y-2 text-sm font-semibold text-slate-700 md:col-span-2">
                    <span>Address</span>
                    <textarea
                      className="input"
                      rows={3}
                      value={createForm.address}
                      onChange={(event) => handleCreateChange('address', event.target.value)}
                      autoComplete="street-address"
                    />
                  </label>
                </div>

                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    checked={createForm.is_primary}
                    onChange={(event) => handleCreateChange('is_primary', event.target.checked)}
                  />
                  <span>
                    <span className="block font-semibold text-slate-900">Make this the primary branch</span>
                    <span className="mt-1 block text-slate-600">
                      Primary branch changes affect the default location shown in admin surfaces and workspace summaries.
                    </span>
                  </span>
                </label>

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Branches stay tenant-scoped, and branch activation only works cleanly when team assignments are under control.
                  </p>
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Creating branch...' : 'Create branch'}
                  </Button>
                </div>
              </form>
            </Card>

            <div className="space-y-6">
              <Card className="border-emerald-200 bg-emerald-50/60">
                <CardHeader
                  title={content?.calloutTitle}
                  subtitle={branchState.business?.name || 'Current workspace branch model'}
                />
                <div className="space-y-3 text-sm text-emerald-950">
                  <p>{content?.calloutCopy}</p>
                  <p className="text-emerald-800">
                    The current workspace type is <span className="font-semibold">{branchState.business?.business_type_label || branchState.business?.business_type}</span>, so branch visibility now stays aligned with the same tenant-aware access model used by team settings.
                  </p>
                </div>
              </Card>

              <Card className={content?.roadmapClassName}>
                <CardHeader
                  title={content?.roadmapTitle}
                  subtitle={content?.roadmapSubtitle}
                />
                <ul className={`space-y-2 text-sm ${content?.roadmapTextClassName}`}>
                  {(content?.roadmapItems ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader
              title="Workspace branches"
              subtitle="Review location details, team coverage, and whether each branch is primary or inactive"
            />
            <div className="space-y-4">
              {branchState.branches.map((branch) => {
                const draft = branchDrafts[branch.id];
                const isSaving = savingBranchId === branch.id;
                const hasChanges = hasSettingsBranchDraftChanges(branch, draft);

                return (
                  <div key={branch.id} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-slate-900">{branch.name}</p>
                          {branch.is_primary ? (
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                              Primary
                            </span>
                          ) : null}
                          {branch.is_current_user_branch ? (
                            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
                              Your branch
                            </span>
                          ) : null}
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                            branch.is_active
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {branch.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-slate-600">
                          <p>{branch.location || 'No branch location saved yet'}</p>
                          <p>{branch.phone || 'No branch phone saved yet'}</p>
                          <p>Slug: {branch.slug}</p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                          <p className="font-semibold text-slate-900">Operational footprint</p>
                          <p className="mt-1">{formatSettingsBranchFootprint(branch)}</p>
                          <p className="mt-2 text-slate-500">{buildSettingsBranchStatusNote(branch)}</p>
                        </div>
                      </div>

                      <div className="grid w-full gap-3 lg:max-w-3xl md:grid-cols-2">
                        <label className="space-y-2 text-sm font-semibold text-slate-700">
                          <span>Branch name</span>
                          <input
                            className="input"
                            value={draft?.name ?? ''}
                            onChange={(event) => handleDraftChange(branch.id, 'name', event.target.value)}
                          />
                        </label>

                        <label className="space-y-2 text-sm font-semibold text-slate-700">
                          <span>Phone number</span>
                          <input
                            className="input"
                            type="tel"
                            value={draft?.phone ?? ''}
                            onChange={(event) => handleDraftChange(branch.id, 'phone', event.target.value)}
                          />
                        </label>

                        <label className="space-y-2 text-sm font-semibold text-slate-700">
                          <span>City</span>
                          <input
                            className="input"
                            value={draft?.city ?? ''}
                            onChange={(event) => handleDraftChange(branch.id, 'city', event.target.value)}
                          />
                        </label>

                        <label className="space-y-2 text-sm font-semibold text-slate-700">
                          <span>State</span>
                          <input
                            className="input"
                            value={draft?.state ?? ''}
                            onChange={(event) => handleDraftChange(branch.id, 'state', event.target.value)}
                          />
                        </label>

                        <label className="space-y-2 text-sm font-semibold text-slate-700 md:col-span-2">
                          <span>Address</span>
                          <textarea
                            className="input"
                            rows={3}
                            value={draft?.address ?? ''}
                            onChange={(event) => handleDraftChange(branch.id, 'address', event.target.value)}
                          />
                        </label>

                        <label className="space-y-2 text-sm font-semibold text-slate-700">
                          <span>Status</span>
                          <select
                            className="input"
                            value={draft?.is_active ? 'active' : 'inactive'}
                            onChange={(event) => handleDraftChange(branch.id, 'is_active', event.target.value === 'active')}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </label>

                        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            checked={draft?.is_primary ?? false}
                            onChange={(event) => handleDraftChange(branch.id, 'is_primary', event.target.checked)}
                            disabled={branch.is_primary}
                          />
                          <span>
                            <span className="block font-semibold text-slate-900">
                              {branch.is_primary ? 'Primary branch' : 'Promote to primary on save'}
                            </span>
                            <span className="mt-1 block text-slate-500">
                              {branch.is_primary
                                ? 'Another branch must be promoted before this one can stop being primary.'
                                : 'Saving with this checked will make this the new primary branch.'}
                            </span>
                          </span>
                        </label>

                        <div className="md:col-span-2 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-slate-500">
                            {!draft?.is_active && branch.deactivation_block_reason
                              ? branch.deactivation_block_reason
                              : 'Changes here update only the active workspace and preserve strict tenant isolation.'}
                          </p>
                          <Button
                            type="button"
                            onClick={() => void handleSaveBranch(branch)}
                            disabled={isSaving || !hasChanges}
                          >
                            {isSaving ? 'Saving branch...' : 'Save branch'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
