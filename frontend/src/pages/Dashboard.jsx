import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { buildInsightViewUrl, getInsightAction } from '../lib/aiInsights';
import { getDashboardAiAlertSummary } from '../lib/dashboardAiSummaries';
import { getDashboardOwnerFocusActions } from '../lib/dashboardOwnerFocusActions';
import { getDashboardQuickActions } from '../lib/dashboardQuickActions';
import { getDashboardOwnerFocusSections } from '../lib/dashboardOwnerFocus';
import {
  formatDashboardCurrency,
  formatDashboardDateTime,
  getDashboardActivityActionLabel,
} from '../lib/dashboardFormatters';
import {
  getAdasheDashboardState,
  getAdasheDashboardWatch,
  getCooperativeDashboardState,
  getCooperativeDashboardWatch,
  getTrustFundDashboardState,
  getTrustFundDashboardWatch,
} from '../lib/dashboardFinanceSummaries';
import { getDashboardVerticalActions } from '../lib/dashboardVerticalActions';
import { getDashboardVerticalSection } from '../lib/dashboardVerticalSections';
import { useBusinessType } from '../config';
import StatsCard from '../components/StatsCard';
import Card, { CardHeader } from '../components/Card';
import DashboardActionChipLink from '../components/DashboardActionChipLink';
import DashboardAiLensSummary from '../components/DashboardAiLensSummary';
import DashboardFinancePromptCard from '../components/DashboardFinancePromptCard';
import DashboardFinanceWatchCard from '../components/DashboardFinanceWatchCard';
import DashboardMetricGrid from '../components/DashboardMetricGrid';
import DashboardOwnerFocus from '../components/DashboardOwnerFocus';
import DashboardVerticalSection from '../components/DashboardVerticalSection';
import EmptyState from '../components/EmptyState';
import InsightActionItemCard from '../components/InsightActionItemCard';
import InsightGroupPreviewCard from '../components/InsightGroupPreviewCard';
import InsightLoadingState from '../components/InsightLoadingState';
import InsightStatePanel from '../components/InsightStatePanel';
import { ContentGrid, DashboardShell, PageHeader, ResponsiveCardGrid } from '../components/PageShell';
import Toast from '../components/Toast';
import {
  getInsightActionState,
  getInsightCardPresentationProps,
  useInsightActions,
} from '../hooks/useInsightActions';
import { getInsightGroupsOverview } from '../lib/aiInsights';

function QueryErrorPanel({ message, onRetry }) {
  if (!message) {
    return null;
  }

  return (
    <Card className="border-rose-200 bg-rose-50">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-rose-800">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
        >
          Retry
        </button>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { labels, color, edition, type } = useBusinessType();
  const { toast, markReadMutation, dismissMutation, restoreMutation } = useInsightActions();

  const statsQuery = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard').then((r) => r.data),
    staleTime: 60000,
  });

  const recentOrdersQuery = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => api.get('/orders?limit=5').then((r) => r.data.data || r.data || []),
    staleTime: 30000,
  });

  const lowStockProductsQuery = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => api.get('/products?low_stock=true&limit=5').then((r) => r.data.data || r.data || []),
    staleTime: 60000,
  });

  const stats = statsQuery.data;
  const statsLoading = statsQuery.isLoading;
  const recentOrders = recentOrdersQuery.data;
  const ordersLoading = recentOrdersQuery.isLoading;
  const lowStockProducts = lowStockProductsQuery.data;
  const dashboardQueries = [statsQuery, recentOrdersQuery, lowStockProductsQuery];
  const dashboardError = dashboardQueries.find((query) => query.isError)?.error;

  const handleRetry = () => {
    dashboardQueries.forEach((query) => {
      void query.refetch();
    });
  };

  const quickActions = getDashboardQuickActions({ labels, color, type });
  const {
    activeGroups: activeInsightGroups,
    unreadCount: aiUnreadCount,
    criticalCount: aiCriticalCount,
    hasSignals: hasGroupedInsightSignals,
  } = getInsightGroupsOverview(stats?.ai?.groups || []);
  const dailyActions = stats?.ai?.daily_actions || [];
  const hasAiSignals = hasGroupedInsightSignals || dailyActions.length > 0;
  const adasheSummary = stats?.adashe;
  const showAdasheWidget = (adasheSummary?.member_accounts || 0) > 0;
  const trustFundSummary = stats?.trust_fund;
  const showTrustFundWidget = (trustFundSummary?.account_count || 0) > 0;
  const cooperativeSummary = stats?.cooperative;
  const showCooperativeWidget = (cooperativeSummary?.members || 0) > 0;
  const adasheDashboardState = getAdasheDashboardState(adasheSummary);
  const trustFundDashboardState = getTrustFundDashboardState(trustFundSummary);
  const cooperativeDashboardState = getCooperativeDashboardState(cooperativeSummary);
  const adasheWatch = getAdasheDashboardWatch(adasheSummary, adasheDashboardState);
  const trustFundWatch = getTrustFundDashboardWatch(trustFundSummary, trustFundDashboardState);
  const cooperativeWatch = getCooperativeDashboardWatch(cooperativeSummary, cooperativeDashboardState);
  const aiAlertSummary = getDashboardAiAlertSummary({
    totalInsights: stats?.ai?.total || 0,
    unreadCount: aiUnreadCount,
    criticalCount: aiCriticalCount,
    activeGroupCount: activeInsightGroups.length,
    dailyActionCount: dailyActions.length,
  });
  const renderPromptAction = (action) => (
    action ? (
      <DashboardActionChipLink
        to={action.to}
        tone={action.tone}
        label={action.label}
      />
    ) : null
  );
  const ownerFocusSections = getDashboardOwnerFocusSections(stats?.owner_focus);
  const activeBusinessType = stats?.business_type || type;
  const ownerFocusActions = getDashboardOwnerFocusActions(activeBusinessType);
  const activeVerticalSection = getDashboardVerticalSection(activeBusinessType);
  const activeVerticalActions = getDashboardVerticalActions(activeBusinessType);
  const topProducts = stats?.top_products || [];
  const recentActivity = stats?.recent_activity || [];

  return (
    <DashboardShell>
      <Toast
        tone={toast?.tone}
        message={toast?.message}
        actionLabel={toast?.actionLabel}
        onAction={toast?.onAction}
      />
      <PageHeader
        eyebrow="Business command center"
        title={labels.dashboard}
        description="Welcome back. Track what changed, what needs attention, and what to do next across sales, stock, customers, operations, and finance."
        actions={(
          <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: `${color}18`, color }}>
            {edition}
          </span>
        )}
      />

      <QueryErrorPanel
        message={dashboardError ? 'We could not load part of the dashboard right now. Please try again.' : ''}
        onRetry={handleRetry}
      />

      <ResponsiveCardGrid variant="metrics">
        <StatsCard title="Today's Revenue" value={stats?.today_sales || 0} format="currency" change={12} trend="up" icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 0L9 6m3-2l3 2" loading={statsLoading} />
        <StatsCard title="Orders Today" value={stats?.today_orders || 0} change={8} trend="up" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" loading={statsLoading} />
        <StatsCard title={labels.customers || 'Customers'} value={stats?.customers_count || 0} change={5} trend="up" icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" loading={statsLoading} />
        <StatsCard title={labels.lowStock || 'Low Stock'} value={stats?.low_stock_count || 0} change={-3} trend={stats?.low_stock_count > 0 ? 'down' : 'up'} icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.16 17c-.78 1.333.192 3 1.732 3z" loading={statsLoading} />
      </ResponsiveCardGrid>

      <ContentGrid columns="split">
        <Card className="lg:col-span-2">
          <CardHeader
            title={labels.recentSales || 'Recent Sales'}
            action={(
              <Link to="/pos" className="flex items-center gap-1 text-sm font-medium hover:opacity-80" style={{ color }}>
                View All
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          />

          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 rounded-xl bg-slate-50 p-3.5">
                  <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-200" />
                  <div className="flex-1">
                    <div className="mb-2 h-4 w-32 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                  </div>
                  <div className="h-6 w-20 animate-pulse rounded bg-slate-200" />
                </div>
              ))}
            </div>
          ) : recentOrders?.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 transition-colors hover:bg-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: `${color}15` }}>
                      <span className="text-sm font-semibold" style={{ color }}>#{order.id}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{order.customer?.name || 'Walk-in sale'}</p>
                      <p className="text-xs text-slate-500">{order.items?.length || 0} items</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-800">{formatDashboardCurrency(order.total)}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${order.status === 'completed' || order.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {order.status || 'Completed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              title={labels.noData || 'No sales recorded yet'}
              description={`Record your first ${labels.product?.toLowerCase() || 'sale'} to start building live dashboard visibility.`}
              action={{ label: labels.newSale, onClick: () => {}, icon: 'M12 4v16m8-8H4' }}
            />
          )}
        </Card>

        <Card>
          <CardHeader title="Quick Actions" />
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link key={action.label} to={action.path} className="group flex min-h-[112px] flex-col items-center gap-2 rounded-xl bg-slate-50 p-3.5 transition-all hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-105" style={{ background: action.color }}>
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={action.icon} />
                  </svg>
                </div>
                <span className="text-center text-sm font-medium text-slate-700">{action.label}</span>
              </Link>
            ))}
          </div>

          {lowStockProducts?.length > 0 ? (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-xs font-semibold text-slate-600">{labels.lowStock || 'Low Stock Alert'}</span>
              </div>
              <div className="space-y-2">
                {lowStockProducts.slice(0, 3).map((product) => (
                  <div key={product.id} className="flex items-center justify-between text-sm">
                    <span className="mr-2 flex-1 truncate text-slate-600">{product.name}</span>
                    <span className="font-medium text-amber-600">{product.stock} left</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      </ContentGrid>

      <DashboardOwnerFocus ownerFocus={ownerFocusSections} color={color} actions={ownerFocusActions} />

      {statsLoading ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader
              title="AI Alert Center"
              subtitle="Grouped daily decisions across cash, stock, operations, and risk"
              action={(
                <Link
                  to={buildInsightViewUrl({ activePreset: 'all_signals' })}
                  className="text-sm font-medium hover:opacity-80"
                  style={{ color }}
                >
                  Open insights
                </Link>
              )}
            />
            <InsightLoadingState groups={1} cardsPerGroup={2} />
          </Card>

          <Card>
            <CardHeader title="Daily Action List" />
            <div className="space-y-3">
              {[1, 2, 3].map((itemIndex) => (
                <div key={itemIndex} className="animate-pulse rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-slate-200" />
                      <div className="h-3 w-1/2 rounded bg-slate-100" />
                    </div>
                    <div className="h-5 w-16 rounded-full bg-slate-200" />
                  </div>
                  <div className="mt-3 h-3 w-5/6 rounded bg-slate-100" />
                  <div className="mt-4 flex gap-2">
                    <div className="h-7 w-20 rounded-full bg-slate-200" />
                    <div className="h-7 w-20 rounded-full bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : hasAiSignals ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader
              title="AI Alert Center"
              subtitle="Grouped daily decisions across cash, stock, operations, and risk"
              action={<Link to="/ai-insights" className="text-sm font-medium hover:opacity-80" style={{ color }}>Open insights</Link>}
            />
            <DashboardMetricGrid
              className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
              metrics={aiAlertSummary.metrics}
              ariaLabel="AI alert center metrics"
            />

            <DashboardAiLensSummary lenses={aiAlertSummary.lenses} ariaLabel="AI alert center lens summaries" />

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {aiAlertSummary.quickLinks.map((link) => (
                <DashboardActionChipLink
                  key={link.label}
                  to={link.to}
                  tone={link.tone}
                  label={link.label}
                />
              ))}
            </div>

            <ResponsiveCardGrid variant="cards" className="mt-4 md:grid-cols-2 xl:grid-cols-2">
              {activeInsightGroups.map((group) => (
                <InsightGroupPreviewCard
                  key={group.key}
                  group={group}
                  getInsightAction={getInsightAction}
                  getInsightCardPresentationProps={getInsightCardPresentationProps}
                  markReadMutation={markReadMutation}
                  dismissMutation={dismissMutation}
                  restoreMutation={restoreMutation}
                />
              ))}
            </ResponsiveCardGrid>
          </Card>

          <Card>
            <CardHeader
              title="Daily Action List"
              action={(
                <Link
                  to={buildInsightViewUrl({ activePreset: 'needs_review' })}
                  className="text-sm font-medium hover:opacity-80"
                  style={{ color }}
                >
                  Open review queue
                </Link>
              )}
            />
            {dailyActions.length > 0 ? (
              <div className="space-y-3">
                {dailyActions.map((action, index) => {
                  const { isMarkingRead, isDismissing, isBusy } = getInsightActionState(action.id, {
                    markReadMutation,
                    dismissMutation,
                    restoreMutation,
                  });

                  return (
                    <InsightActionItemCard
                      key={`${action.group}-${index}`}
                      action={action}
                      isBusy={isBusy}
                      isMarkingRead={isMarkingRead}
                      isDismissing={isDismissing}
                      onMarkRead={() => markReadMutation.mutate(action.id)}
                      onDismiss={() => dismissMutation.mutate(action.id)}
                    />
                  );
                })}
              </div>
            ) : (
              <InsightStatePanel
                title="No owner actions queued"
                description="Fresh AI recommendations will appear here as new signals develop across cash, stock, operations, and risk."
                tone="emerald"
              />
            )}
          </Card>
        </div>
      ) : (
        <InsightStatePanel
          title="AI watch is quiet right now"
          description="There are no active alert groups or owner actions waiting at the moment. As business activity changes, Taska will surface new explainable signals here."
          tone="emerald"
        />
      )}

      {showAdasheWidget ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <DashboardFinanceWatchCard
            title={adasheWatch.title}
            subtitle={adasheWatch.subtitle}
            action={{ ...adasheWatch.action, color }}
            metrics={adasheWatch.metrics}
            spotlight={adasheWatch.spotlight}
          />

          <DashboardFinancePromptCard
            title="Collection Prompt"
            state={adasheDashboardState}
            renderAction={renderPromptAction}
          />
        </div>
      ) : null}

      {showTrustFundWidget ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <DashboardFinanceWatchCard
            title={trustFundWatch.title}
            subtitle={trustFundWatch.subtitle}
            action={{ ...trustFundWatch.action, color }}
            metrics={trustFundWatch.metrics}
            spotlight={trustFundWatch.spotlight}
          />

          <DashboardFinancePromptCard
            title="Recovery Prompt"
            state={trustFundDashboardState}
            renderAction={renderPromptAction}
          />
        </div>
      ) : null}

      {showCooperativeWidget ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <DashboardFinanceWatchCard
            title={cooperativeWatch.title}
            subtitle={cooperativeWatch.subtitle}
            action={{ ...cooperativeWatch.action, color }}
            metrics={cooperativeWatch.metrics}
            detailTiles={cooperativeWatch.detailTiles}
          />

          <DashboardFinancePromptCard
            title="Cooperative Prompt"
            state={cooperativeDashboardState}
            renderAction={renderPromptAction}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={labels.topSelling || 'Top Products'} action={<Link to="/products" className="text-sm font-medium hover:opacity-80" style={{ color }}>View All</Link>} />
          {statsLoading ? (
            <div className="space-y-3 px-6 pb-6">
              {[1, 2, 3, 4].map((itemIndex) => (
                <div key={itemIndex} className="animate-pulse rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 rounded bg-slate-200" />
                      <div className="h-3 w-1/2 rounded bg-slate-100" />
                    </div>
                    <div className="h-5 w-20 rounded-full bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : topProducts.length > 0 ? (
            <div className="space-y-3 px-6 pb-6">
              {topProducts.map((product, index) => (
                <div key={product.id || `${product.name}-${index}`} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white" style={{ background: color }}>
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {Number(product.units_sold || 0).toLocaleString()} units sold across {Number(product.order_count || 0).toLocaleString()} order{Number(product.order_count || 0) === 1 ? '' : 's'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{formatDashboardCurrency(product.revenue || 0)}</p>
                      <p className="mt-1 text-xs text-slate-500">Revenue contribution</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-sm font-medium text-slate-700">Top-product insights will appear here as sales history grows.</p>
              <p className="mt-2 text-sm text-slate-500">Keep sales and product movement flowing to unlock clearer demand ranking and margin signals.</p>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Recent Activity" />
          {statsLoading ? (
            <div className="space-y-3 px-6 pb-6">
              {[1, 2, 3, 4].map((itemIndex) => (
                <div key={itemIndex} className="animate-pulse rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-slate-200" />
                      <div className="h-3 w-1/2 rounded bg-slate-100" />
                      <div className="h-3 w-2/3 rounded bg-slate-100" />
                    </div>
                    <div className="h-5 w-16 rounded-full bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-3 px-6 pb-6">
              {recentActivity.map((item, index) => {
                const toneClasses = {
                  emerald: 'bg-emerald-100 text-emerald-700',
                  amber: 'bg-amber-100 text-amber-700',
                  sky: 'bg-sky-100 text-sky-700',
                  violet: 'bg-violet-100 text-violet-700',
                  slate: 'bg-slate-100 text-slate-700',
                };
                const actionLabel = getDashboardActivityActionLabel(item);
                const typeLabels = {
                  order: 'Sale',
                  expense: 'Expense',
                  trust_transaction: 'Finance',
                  delivery_order: 'Delivery',
                  logistics_trip: 'Logistics',
                  production_batch: 'Production',
                  pharmacy_dispense: 'Pharmacy',
                  pharmacy_refill: 'Refill',
                  restaurant_ticket: 'Restaurant',
                  cooperative_financing: 'Cooperative',
                  cooperative_profit_cycle: 'Profit cycle',
                  warehouse_distribution: 'Distribution',
                };
                const hasAmount = item.amount !== null && item.amount !== undefined;

                return (
                  <div key={`${item.type}-${index}-${item.occurred_at || 'now'}`} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClasses[item.tone] || toneClasses.slate}`}>
                            {typeLabels[item.type] || 'Activity'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span>{formatDashboardDateTime(item.occurred_at)}</span>
                          {item.action_path && actionLabel ? (
                            <Link to={item.action_path} className="font-semibold hover:opacity-80" style={{ color }}>
                              {actionLabel}
                            </Link>
                          ) : null}
                        </div>
                      </div>
                      {hasAmount ? (
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">{formatDashboardCurrency(item.amount || 0)}</p>
                          <p className="mt-1 text-xs text-slate-500">Latest amount</p>
                        </div>
                      ) : (
                        <div className="text-right">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Ops event</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-sm font-medium text-slate-700">Your operational feed will show here as the workspace gets busier.</p>
              <p className="mt-2 text-sm text-slate-500">Sales, stock movement, team actions, and finance events will roll up into one daily timeline.</p>
            </div>
          )}
        </Card>
      </div>

      <DashboardVerticalSection section={activeVerticalSection} stats={stats} actions={activeVerticalActions} />
    </DashboardShell>
  );
}
