import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import Card, { CardHeader } from '../components/Card';
import ConfirmDialog from '../components/ConfirmDialog';
import OpsMetricCard from '../components/OpsMetricCard';
import { PageShell, ResponsiveCardGrid } from '../components/PageShell';
import PageHero from '../components/PageHero';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useAuthStore } from '../stores/authStore';
import { getErrorMessage } from '../lib/apiFeedback';
import {
  adminTabs,
  buildAdminStatsCards,
  filterAdminRecords,
  getAdminActionTargetLabel,
  getAdminCurrentTabLabel,
  getAdminLoadRequests,
  getAdminPendingActionLabel,
  getAdminPendingActionLabelDisplay,
  getAdminPendingRecordName,
} from '../lib/admin';
import { formatCurrencyNGN, formatShortDate } from '../lib/financeFormatters';
import api from '../lib/api';

function EmptyState({ title, description }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function StatusBadge({ label, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700',
    blue: 'bg-blue-100 text-blue-700',
    violet: 'bg-violet-100 text-violet-700',
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${tones[tone] || tones.slate}`}>
      {label}
    </span>
  );
}

function QueryErrorPanel({ message, onRetry }) {
  if (!message) {
    return null;
  }

  return (
    <div className="border-b border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p>{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="self-start rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [search, setSearch] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const { toast, setToast, clearToast } = useToast(3600);
  // Platform-wide admin dashboard - gated on is_platform_admin, not the
  // tenant-scoped business `role`, which every self-registered business
  // owner already has as "admin" of their own business.
  const isAdmin = Boolean(user?.is_platform_admin);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  const adminQuery = useQuery({
    queryKey: ['admin-page', activeTab],
    enabled: isAdmin,
    queryFn: async () => {
      const requestConfig = getAdminLoadRequests(activeTab);

      if (requestConfig.includeStats) {
        const [usersResponse, statsResponse] = await Promise.all([
          api.get(requestConfig.primary),
          api.get('/admin/stats'),
        ]);

        return {
          data: usersResponse.data?.data || [],
          stats: statsResponse.data?.data || null,
        };
      }

      if (requestConfig.primary) {
        const response = await api.get(requestConfig.primary);
        return {
          data: response.data?.data || [],
          stats: null,
        };
      }

      return {
        data: [],
        stats: null,
      };
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ action, item }) => api.post(`/admin/${action}`, { id: item.id }),
    onSuccess: async () => {
      await adminQuery.refetch();
      setPendingAction(null);
      setToast({
        tone: 'success',
        message: 'Admin action completed successfully.',
      });
    },
    onError: (error) => {
      setToast({
        tone: 'error',
        message: getErrorMessage(error, 'That admin action could not be completed.'),
      });
    },
  });

  const handleAction = async (action, item) => {
    clearToast();
    await actionMutation.mutateAsync({ action, item });
  };

  const data = adminQuery.data?.data || [];
  const stats = adminQuery.data?.stats || null;

  const actionTargetLabel = getAdminActionTargetLabel(activeTab);
  const pendingActionLabel = getAdminPendingActionLabel(pendingAction?.action);
  const pendingActionLabelDisplay = getAdminPendingActionLabelDisplay(pendingAction?.action);
  const pendingActionBusy = pendingAction
    ? actionMutation.isPending
      && actionMutation.variables?.action === pendingAction.action
      && actionMutation.variables?.item?.id === pendingAction.item.id
    : false;
  const pendingActionRecordName = pendingAction ? getAdminPendingRecordName(pendingAction.item) : 'Platform record';

  const filteredData = useMemo(() => filterAdminRecords(data, search), [data, search]);
  const statsCards = stats ? buildAdminStatsCards(stats, formatCurrencyNGN) : [];
  const currentTabLabel = getAdminCurrentTabLabel(activeTab, adminTabs);

  if (!isAdmin) {
    return null;
  }

  return (
    <PageShell width="wide" className="page-stack">
      <Toast
        tone={toast?.tone}
        message={toast?.message}
        groupAriaLabel="Admin feedback"
      />
      <PageHero
        eyebrow="System Control"
        title="Admin Dashboard"
        description="Review platform growth, support load, user activity, and business health from one cleaner admin surface."
        aside={(
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">{user?.name}</p>
            <p>Platform administrator</p>
          </div>
        )}
      />

      {stats ? (
        <ResponsiveCardGrid variant="metrics">
          {statsCards.map((card) => (
            <OpsMetricCard
              key={card.label}
              label={card.label}
              value={card.value}
              helper={card.helper}
              tone={card.tone}
            />
          ))}
        </ResponsiveCardGrid>
      ) : null}

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {adminTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder={`Search ${currentTabLabel.toLowerCase()}...`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 lg:max-w-sm"
          />
        </div>
      </Card>

      <Card padding={false} className="overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-5">
          <CardHeader
            title={currentTabLabel}
            subtitle={`Live administrative records for ${currentTabLabel.toLowerCase()}`}
            className="mb-0"
          />
        </div>

        <QueryErrorPanel
          message={adminQuery.isError ? getErrorMessage(adminQuery.error, `We could not load ${activeTab} right now.`) : ''}
          onRetry={() => {
            void adminQuery.refetch();
          }}
        />

        {adminQuery.isLoading ? (
          <div className="flex h-56 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-indigo-600" />
          </div>
        ) : null}

        {!adminQuery.isLoading && filteredData.length === 0 ? (
          <EmptyState
            title={`No ${currentTabLabel.toLowerCase()} found`}
            description="Try a different search term or switch to another admin tab."
          />
        ) : null}

        {!adminQuery.isLoading && filteredData.length > 0 && activeTab === 'users' ? (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">User</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Business</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Plan</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Joined</th>
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => {
                const isSuspended = item.is_active === false;

                return (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                          {item.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{item.name}</p>
                          <p className="text-sm text-slate-500">{item.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{item.business_name || '-'}</td>
                    <td className="px-5 py-4">
                      <StatusBadge
                        label={item.plan || 'free'}
                        tone={item.plan === 'free' ? 'slate' : item.plan === 'growth' ? 'emerald' : 'violet'}
                      />
                    </td>
                    <td className="px-5 py-4 text-slate-500">{formatShortDate(item.created_at, 'No date')}</td>
                    <td className="px-5 py-4 text-right">
                      {isSuspended ? (
                        <button
                          type="button"
                          onClick={() => setPendingAction({ action: 'activate', item })}
                          disabled={pendingActionBusy}
                          className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {pendingActionBusy && pendingAction?.item?.id === item.id && pendingAction?.action === 'activate' ? 'Activating...' : 'Activate'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPendingAction({ action: 'suspend', item })}
                          disabled={pendingActionBusy}
                          className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {pendingActionBusy && pendingAction?.item?.id === item.id && pendingAction?.action === 'suspend' ? 'Suspending...' : 'Suspend'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        ) : null}

        {!adminQuery.isLoading && filteredData.length > 0 && activeTab === 'businesses' ? (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Business</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Owner</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Type</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Created</th>
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-medium text-slate-900">{item.business_name}</td>
                  <td className="px-5 py-4 text-slate-600">{item.owner_name || '-'}</td>
                  <td className="px-5 py-4 text-slate-600">{item.business_type}</td>
                  <td className="px-5 py-4 text-slate-500">{formatShortDate(item.created_at, 'No date')}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setPendingAction({ action: 'suspend-business', item })}
                      disabled={pendingActionBusy}
                      className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pendingActionBusy && pendingAction?.item?.id === item.id && pendingAction?.action === 'suspend-business' ? 'Suspending...' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : null}

        {!adminQuery.isLoading && filteredData.length > 0 && activeTab === 'plans' ? (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Plan</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Slug</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Price</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Billing</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-medium text-slate-900">{item.name || item.plan_name || `Plan #${item.id}`}</td>
                  <td className="px-5 py-4 text-slate-600">{item.slug || '-'}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {item.monthly_price != null ? formatCurrencyNGN(item.monthly_price) : item.amount != null ? formatCurrencyNGN(item.amount) : '-'}
                  </td>
                  <td className="px-5 py-4 text-slate-500">{item.billing_cycle || 'Recurring'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : null}

        {!adminQuery.isLoading && filteredData.length > 0 && activeTab === 'transactions' ? (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">ID</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">User</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Amount</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-mono text-sm text-slate-600">#{item.id}</td>
                  <td className="px-5 py-4 text-slate-600">{item.user_name || '-'}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{formatCurrencyNGN(item.amount)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge
                      label={item.status}
                      tone={['success', 'paid'].includes(item.status) ? 'emerald' : item.status === 'pending' ? 'amber' : 'rose'}
                    />
                  </td>
                  <td className="px-5 py-4 text-slate-500">{formatShortDate(item.created_at, 'No date')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : null}

        {!adminQuery.isLoading && filteredData.length > 0 && activeTab === 'support' ? (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">ID</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Subject</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Created</th>
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-mono text-sm text-slate-600">#{item.id}</td>
                  <td className="px-5 py-4 text-slate-900">{item.subject}</td>
                  <td className="px-5 py-4">
                    <StatusBadge
                      label={item.status}
                      tone={item.status === 'open' ? 'blue' : item.status === 'resolved' ? 'emerald' : 'slate'}
                    />
                  </td>
                  <td className="px-5 py-4 text-slate-500">{formatShortDate(item.created_at, 'No date')}</td>
                  <td className="px-5 py-4 text-right">
                    {item.status === 'open' ? (
                      <button
                        type="button"
                        onClick={() => setPendingAction({ action: 'resolve-ticket', item })}
                        disabled={pendingActionBusy}
                        className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pendingActionBusy && pendingAction?.item?.id === item.id && pendingAction?.action === 'resolve-ticket' ? 'Resolving...' : 'Resolve'}
                      </button>
                    ) : (
                      <span className="text-sm text-slate-400">Resolved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : null}

        {!adminQuery.isLoading && filteredData.length > 0 && activeTab === 'referrals' ? (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Referrer</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Referred</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Commission</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 text-slate-900">{item.referrer_name || '-'}</td>
                  <td className="px-5 py-4 text-slate-600">{item.referred_name || '-'}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{formatCurrencyNGN(item.commission)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge label={item.status} tone={item.status === 'paid' ? 'emerald' : item.status === 'pending' ? 'amber' : 'slate'} />
                  </td>
                  <td className="px-5 py-4 text-slate-500">{formatShortDate(item.created_at, 'No date')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : null}
      </Card>

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction ? pendingActionLabelDisplay : 'Confirm admin action'}
        copyPreset="adminChange"
        copyContext={{
          actionLabel: pendingAction ? pendingActionLabelDisplay : 'Confirm',
          actionLabelLower: pendingAction ? pendingActionLabel : 'confirm',
          targetNoun: actionTargetLabel,
        }}
        detailPreset="adminAction"
        detailContext={{
          actionLabel: pendingActionLabelDisplay,
          targetType: actionTargetLabel.charAt(0).toUpperCase() + actionTargetLabel.slice(1),
          recordName: pendingActionRecordName,
          createdAt: pendingAction ? formatShortDate(pendingAction.item.created_at, 'No date') : 'No date',
        }}
        isBusy={pendingActionBusy}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (pendingAction) {
            void handleAction(pendingAction.action, pendingAction.item);
          }
        }}
      />
    </PageShell>
  );
}
