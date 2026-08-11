import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import Button from '../components/Button';
import Card, { CardHeader } from '../components/Card';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import OpsMetricCard from '../components/OpsMetricCard';
import { PageHeader, ResponsiveCardGrid, SectionShell } from '../components/PageShell';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useAuthStore } from '../stores/authStore';
import { getErrorMessage } from '../lib/apiFeedback';
import { formatCurrencyNGN, formatShortDate } from '../lib/financeFormatters';
import {
  buildBillingCancelDetailContext,
  buildBillingInvoiceRows,
  buildBillingMethodPresentation,
  buildBillingMethodRemovalDetailContext,
  buildBillingOverviewMetrics,
  buildBillingUsageItems,
  getBillingDefaultMethodLabel,
  getBillingPendingConfirmBusy,
  getBillingStatusClass,
} from '../lib/billing';
import api from '../lib/api';

function QueryErrorPanel({ message, onRetry }) {
  if (!message) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-[1.3rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800 md:flex-row md:items-center md:justify-between">
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
  );
}

export default function BillingSettings() {
  const { subscription, fetchProfile } = useAuthStore();
  const [pendingConfirm, setPendingConfirm] = useState(null);
  const { toast, setToast, clearToast } = useToast();

  const billingQuery = useQuery({
    queryKey: ['billing-settings'],
    queryFn: async () => {
      const [invoiceResponse, methodsResponse] = await Promise.all([
        api.get('/billing/invoices'),
        api.get('/billing/payment-methods'),
      ]);

      return {
        invoices: invoiceResponse.data?.data || [],
        methods: methodsResponse.data?.data || [],
      };
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => api.post('/billing/cancel'),
    onSuccess: async () => {
      await fetchProfile();
      setPendingConfirm(null);
      setToast({
        tone: 'success',
        message: 'Subscription cancelled successfully.',
      });
    },
    onError: (error) => {
      setToast({
        tone: 'error',
        message: getErrorMessage(error, 'We could not cancel the subscription right now.'),
      });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (methodId) => api.post(`/billing/payment-methods/${methodId}/default`),
    onSuccess: async () => {
      await billingQuery.refetch();
      setToast({
        tone: 'success',
        message: 'Default payment method updated.',
      });
    },
    onError: (error) => {
      setToast({
        tone: 'error',
        message: getErrorMessage(error, 'We could not update the default payment method right now.'),
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (methodId) => api.delete(`/billing/payment-methods/${methodId}`),
    onSuccess: async () => {
      await billingQuery.refetch();
      setPendingConfirm(null);
      setToast({
        tone: 'success',
        message: 'Payment method removed.',
      });
    },
    onError: (error) => {
      setToast({
        tone: 'error',
        message: getErrorMessage(error, 'We could not remove that payment method right now.'),
      });
    },
  });

  const invoices = billingQuery.data?.invoices || [];
  const methods = billingQuery.data?.methods || [];
  const usage = subscription?.usage || [];
  const usageItems = useMemo(() => buildBillingUsageItems(usage), [usage]);
  const overview = useMemo(() => buildBillingOverviewMetrics(subscription, invoices, formatCurrencyNGN), [invoices, subscription]);
  const defaultMethodLabel = useMemo(() => getBillingDefaultMethodLabel(methods), [methods]);
  const invoiceRows = useMemo(() => buildBillingInvoiceRows(invoices, formatCurrencyNGN, formatShortDate), [invoices]);

  const pendingConfirmBusy = getBillingPendingConfirmBusy(
    pendingConfirm,
    cancelMutation.isPending,
    removeMutation.variables ?? null,
  );

  const handleCancel = async () => {
    clearToast();
    await cancelMutation.mutateAsync();
  };

  const handleSetDefault = async (methodId) => {
    clearToast();
    await setDefaultMutation.mutateAsync(methodId);
  };

  const handleRemoveMethod = async (methodId) => {
    clearToast();
    await removeMutation.mutateAsync(methodId);
  };

  if (billingQuery.isLoading) {
    return (
      <div className="flex min-h-[18rem] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Billing feedback" />
      <SectionShell>
        <PageHeader
          eyebrow="Revenue Controls"
          title="Billing and Subscription"
          description="Review your active plan, usage, invoices, and saved payment methods from one cleaner billing surface."
          actions={(
            <>
              <Button as={Link} to="/pricing">Review plans</Button>
              {subscription?.status === 'active' ? (
                <Button
                  type="button"
                  onClick={() => setPendingConfirm({ type: 'cancel' })}
                  disabled={cancelMutation.isPending}
                  variant="dangerOutline"
                >
                  {cancelMutation.isPending ? 'Cancelling...' : 'Cancel plan'}
                </Button>
              ) : null}
            </>
          )}
        />
      </SectionShell>

      <QueryErrorPanel
        message={billingQuery.isError ? getErrorMessage(billingQuery.error, 'We could not load billing details right now. Please try again.') : ''}
        onRetry={() => {
          void billingQuery.refetch();
        }}
      />

      <ResponsiveCardGrid variant="metrics">
        {overview.cards.map((card) => (
          <OpsMetricCard
            key={card.label}
            label={card.label}
            value={card.value}
            helper={card.helper}
            tone={card.tone}
          />
        ))}
      </ResponsiveCardGrid>

      <Card>
        <CardHeader
          title="Current Subscription"
          subtitle="Your live plan status, renewal timing, and plan controls"
        />

        {subscription ? (
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-2xl font-semibold text-slate-900">{subscription.plan?.name}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${getBillingStatusClass(subscription.status)}`}>
                  {subscription.status}
                </span>
              </div>
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                <p>
                  Billing cycle: <span className="font-medium capitalize text-slate-900">{subscription.billing_cycle}</span>
                </p>
                <p>
                  Renews on <span className="font-medium text-slate-900">{formatShortDate(subscription.ends_at, 'No renewal date set')}</span>
                </p>
                <p>
                  {subscription.days_remaining} day{subscription.days_remaining === 1 ? '' : 's'} remaining in this cycle
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600 xl:max-w-sm">
              <p className="font-semibold text-slate-900">Plan management</p>
              <p className="mt-1">
                Upgrade, downgrade, or change billing cadence from the pricing page. This workspace will keep its billing context in sync after plan changes.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8">
            <p className="font-semibold text-slate-900">No active subscription</p>
            <p className="mt-2 text-sm text-slate-600">
              This business is not attached to an active paid plan right now. You can open pricing to start a plan or return to the free path.
            </p>
            <div className="mt-4">
              <Button as={Link} to="/pricing" size="lg">Choose a plan</Button>
            </div>
          </div>
        )}
      </Card>

      {usage.length > 0 ? (
        <Card>
          <CardHeader
            title="Usage"
            subtitle="Track how close the workspace is to its current plan limits"
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {usageItems.map((item) => (
              <div key={item.feature_key} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {item.currentValue}
                  <span className="ml-2 text-sm font-normal text-slate-500">/ {item.limit}</span>
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[var(--color-brand)]"
                    style={{ width: `${item.ratio}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="Payment Methods"
          subtitle="Use live actions for default selection and cleanup"
          action={(
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {methods.length} saved
            </span>
          )}
        />

        {methods.length > 0 ? (
          <div className="space-y-3">
            {methods.map((method) => {
              const methodPresentation = buildBillingMethodPresentation(method, {
                settingDefaultId: setDefaultMutation.variables ?? null,
                removingId: removeMutation.variables ?? null,
              });

              return (
                <div key={method.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-14 items-center justify-center rounded-xl text-xs font-bold ${methodPresentation.badgeClassName}`}>
                      {methodPresentation.badgeLabel}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{methodPresentation.primaryLabel}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {methodPresentation.secondary.text}
                        {methodPresentation.secondary.isDefault ? <span className="ml-2 font-semibold text-violet-600">Default</span> : null}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {!method.is_default ? (
                      <Button
                        type="button"
                        onClick={() => {
                          void handleSetDefault(method.id);
                        }}
                        disabled={methodPresentation.isSettingDefault || methodPresentation.isRemoving}
                        variant="ghost"
                        size="sm"
                      >
                        {methodPresentation.isSettingDefault ? 'Saving...' : 'Set default'}
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      onClick={() => setPendingConfirm({
                        type: 'remove-method',
                        methodId: method.id,
                        methodLabel: methodPresentation.confirmLabel,
                      })}
                      disabled={methodPresentation.isSettingDefault || methodPresentation.isRemoving}
                      variant="textDanger"
                      size="sm"
                    >
                      {methodPresentation.isRemoving ? 'Removing...' : 'Remove'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8">
            <p className="font-semibold text-slate-900">No payment methods added</p>
            <p className="mt-2 text-sm text-slate-600">
              Payment method capture is not exposed in this screen yet because the gateway token flow still needs a proper secure setup step. Once it lands, it should be added here instead of a fake button.
            </p>
          </div>
        )}
      </Card>

      <Card padding={false} className="overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-5">
          <CardHeader
            title="Invoices"
            subtitle="Recent billing records for this business"
            className="mb-0"
          />
        </div>

        {invoices.length > 0 ? (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Invoice</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Amount</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Date</th>
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoiceRows.map((invoice) => (
                <tr key={invoice.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-medium text-slate-900">{invoice.invoiceNumber}</td>
                  <td className="px-5 py-4 text-slate-600">{invoice.totalLabel}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${invoice.statusClassName}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{invoice.dateLabel}</td>
                  <td className="px-5 py-4 text-right">
                    <a href={invoice.viewHref} className="text-sm font-semibold text-violet-600 transition hover:text-violet-700">
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            title="No invoices yet"
            description="Billing invoices will appear here once they're generated."
          />
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(pendingConfirm)}
        title={pendingConfirm?.type === 'cancel' ? 'Cancel Subscription' : 'Remove Payment Method'}
        copyPreset={pendingConfirm?.type === 'cancel' ? 'cancelSubscription' : 'removePaymentMethod'}
        description={pendingConfirm?.type === 'remove-method' && pendingConfirm?.methodLabel
          ? `Remove ${pendingConfirm.methodLabel} from the business profile?`
          : undefined}
        detailPreset={pendingConfirm?.type === 'cancel' ? 'billingCancel' : 'billingMethodRemoval'}
        detailContext={pendingConfirm?.type === 'cancel'
          ? buildBillingCancelDetailContext(subscription, overview.activePlanName, formatShortDate)
          : buildBillingMethodRemovalDetailContext(pendingConfirm, methods, defaultMethodLabel)}
        isBusy={pendingConfirmBusy}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => {
          if (pendingConfirm?.type === 'cancel') {
            void handleCancel();
            return;
          }

          if (pendingConfirm?.type === 'remove-method') {
            void handleRemoveMethod(pendingConfirm.methodId);
          }
        }}
      />
    </div>
  );
}
