import { useEffect, useState } from 'react';
import api from '../lib/api';
import Button from './Button';
import Card, { CardHeader } from './Card';
import { ResponsiveCardGrid } from './PageShell';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';
import { getSettingsSubmitError } from '../lib/settingsForms';
import {
  buildApprovalSettingsPayload,
  buildSettingsApprovalMetrics,
  buildSettingsApprovalSettingsDefaults,
  formatApprovalActionType,
  hasSettingsApprovalSettingsChanges,
} from '../lib/settingsApprovals';
import OpsMetricCard from './OpsMetricCard';

function formatDateTime(value) {
  if (!value) return '';

  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const STATUS_BADGE_CLASS = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  declined: 'bg-slate-100 text-slate-600',
};

export default function SettingsApprovalsPanel({ content }) {
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState(buildSettingsApprovalSettingsDefaults());
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [decidingId, setDecidingId] = useState(null);
  const { toast, setToast, clearToast } = useToast();

  const metrics = buildSettingsApprovalMetrics(approvals);
  const pendingApprovals = approvals.filter((approval) => approval.status === 'pending');
  const decidedApprovals = approvals.filter((approval) => approval.status !== 'pending');

  const loadData = async () => {
    setLoading(true);
    setLoadError('');

    try {
      const [settingsResponse, approvalsResponse] = await Promise.all([
        api.get('/approvals/settings'),
        api.get('/approvals'),
      ]);

      setSettings(settingsResponse.data);
      setDraft(buildSettingsApprovalSettingsDefaults(settingsResponse.data));
      setApprovals(approvalsResponse.data?.data ?? []);
    } catch (error) {
      setSettings(null);
      setApprovals([]);
      setLoadError(getSettingsSubmitError(error, 'We could not load approval controls right now.'));
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

  const handleDraftChange = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSaveSettings = async (event) => {
    event.preventDefault();
    clearToast();
    setSavingSettings(true);

    try {
      const { data } = await api.patch('/approvals/settings', buildApprovalSettingsPayload(draft));
      setSettings(data);
      setDraft(buildSettingsApprovalSettingsDefaults(data));
      setToast({ tone: 'success', message: data.message || 'Approval settings updated successfully.' });
    } catch (error) {
      setToast({ tone: 'error', message: getSettingsSubmitError(error, 'We could not save approval settings right now.') });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleApprove = async (approval) => {
    clearToast();
    setDecidingId(approval.id);

    try {
      const { data } = await api.post(`/approvals/${approval.id}/approve`);
      setToast({ tone: 'success', message: data.message || 'Request approved.' });
      await loadData();
    } catch (error) {
      setToast({ tone: 'error', message: getSettingsSubmitError(error, 'We could not approve that request right now.') });
    } finally {
      setDecidingId(null);
    }
  };

  const handleDecline = async (approval) => {
    clearToast();
    setDecidingId(approval.id);

    try {
      const { data } = await api.post(`/approvals/${approval.id}/decline`);
      setToast({ tone: 'success', message: data.message || 'Request declined.' });
      await loadData();
    } catch (error) {
      setToast({ tone: 'error', message: getSettingsSubmitError(error, 'We could not decline that request right now.') });
    } finally {
      setDecidingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[18rem] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Approval settings feedback" />

      {loadError ? (
        <Card className="border-rose-200 bg-rose-50/70">
          <CardHeader title="Approval controls are unavailable" subtitle="This settings section only works for active business owners right now" />
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

          <Card>
            <CardHeader title="Approval thresholds" subtitle="Leave a threshold blank to let that action always go through immediately" />
            <form className="space-y-4" onSubmit={handleSaveSettings}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  <span>Expense approval threshold</span>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="No threshold set"
                    value={draft.expense_approval_threshold}
                    onChange={(event) => handleDraftChange('expense_approval_threshold', event.target.value)}
                  />
                  <span className="block text-xs font-normal text-slate-500">
                    Expenses above this amount need approval before they post.
                  </span>
                </label>

                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  <span>Discount approval threshold</span>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="No threshold set"
                    value={draft.discount_approval_threshold}
                    onChange={(event) => handleDraftChange('discount_approval_threshold', event.target.value)}
                  />
                  <span className="block text-xs font-normal text-slate-500">
                    Sales with a discount above this amount cannot complete until approved.
                  </span>
                </label>
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  checked={draft.require_inventory_adjustment_approval}
                  onChange={(event) => handleDraftChange('require_inventory_adjustment_approval', event.target.checked)}
                />
                <span>
                  <span className="block font-semibold text-slate-900">Require approval for manual inventory adjustments</span>
                  <span className="mt-1 block text-slate-600">
                    Stock count corrections made from the Inventory page won't change quantities until approved.
                  </span>
                </span>
              </label>

              <div className="flex justify-end border-t border-slate-200 pt-4">
                <Button
                  type="submit"
                  disabled={savingSettings || !hasSettingsApprovalSettingsChanges(settings, draft)}
                >
                  {savingSettings ? 'Saving...' : 'Save approval settings'}
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <CardHeader title="Pending review" subtitle="Blocked until you approve or decline" />
            {pendingApprovals.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing is waiting for review right now.</p>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((approval) => (
                  <div key={approval.id} className="rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{approval.summary || formatApprovalActionType(approval.action_type)}</p>
                        <p className="mt-1 text-xs text-slate-600">
                          {formatApprovalActionType(approval.action_type)} · Requested by {approval.requested_by?.name ?? 'a team member'} · {formatDateTime(approval.created_at)}
                          {approval.branch_name ? ` · ${approval.branch_name}` : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={decidingId === approval.id}
                          onClick={() => handleDecline(approval)}
                        >
                          Decline
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={decidingId === approval.id}
                          onClick={() => handleApprove(approval)}
                        >
                          {decidingId === approval.id ? 'Working...' : 'Approve'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {decidedApprovals.length > 0 ? (
            <Card>
              <CardHeader title="Recent decisions" subtitle="Already approved or declined" />
              <div className="space-y-2">
                {decidedApprovals.slice(0, 10).map((approval) => (
                  <div key={approval.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{approval.summary || formatApprovalActionType(approval.action_type)}</p>
                      <p className="text-xs text-slate-500">
                        Decided by {approval.decided_by?.name ?? 'a business owner'} · {formatDateTime(approval.decided_at)}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${STATUS_BADGE_CLASS[approval.status] ?? STATUS_BADGE_CLASS.declined}`}>
                      {approval.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
