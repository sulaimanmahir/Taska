import { useDeferredValue, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Card, { CardHeader } from '../components/Card';
import InsightCardList from '../components/InsightCardList';
import InsightGroupFilters from '../components/InsightGroupFilters';
import InsightGroupActions from '../components/InsightGroupActions';
import InsightLoadingState from '../components/InsightLoadingState';
import InsightStatePanel from '../components/InsightStatePanel';
import OpsMetricCard from '../components/OpsMetricCard';
import { PageShell, ResponsiveCardGrid } from '../components/PageShell';
import PageHero from '../components/PageHero';
import Toast from '../components/Toast';
import {
  getInsightCardPresentationProps,
  useInsightActions,
} from '../hooks/useInsightActions';
import { useInsightGroupState } from '../hooks/useInsightGroupState';
import { usePersistentState } from '../hooks/usePersistentState';
import { useToast } from '../hooks/useToast';
import { formatShortDate } from '../lib/financeFormatters';
import api from '../lib/api';
import {
  buildInsightViewUrl,
  buildInsightSearchParams,
  captureResetFiltersState,
  captureSortAndFilterState,
  createAiInsightsSavedViewsToast,
  createAiInsightsSuccessToast,
  createAiInsightsUndoToast,
  extractInsightHighlights,
  getFilteredInsightGroups,
  getHiddenSavedViewCount,
  getFocusedInsightGroups,
  getInsightGlobalFilterCounts,
  getInsightAction,
  getInsightGroupsOverview,
  getInsightResultSummary,
  getSortedInsightGroups,
  getVisibleSavedViews,
  shouldCollapseSavedViews,
} from '../lib/aiInsights';

const GLOBAL_FILTER_OPTIONS = [
  { key: 'all', label: 'All signals' },
  { key: 'unread', label: 'Unread' },
  { key: 'actionable', label: 'Actionable' },
  { key: 'critical', label: 'Critical' },
];

const GROUP_FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'actionable', label: 'Actionable' },
];

const GLOBAL_SORT_OPTIONS = [
  {
    key: 'priority',
    label: 'Most urgent',
    description: 'Critical severity, unread count, and fresh activity rise to the top first.',
  },
  {
    key: 'newest',
    label: 'Newest',
    description: 'Groups with the most recently updated signals appear first.',
  },
  {
    key: 'actionable',
    label: 'Most actionable',
    description: 'Groups with the highest concentration of practical next steps appear first.',
  },
];

const GLOBAL_PRESET_OPTIONS = [
  {
    key: 'all_signals',
    label: 'All signals',
    description: 'See the full explainable signal set with urgency-first ordering.',
    filter: 'all',
    sort: 'priority',
  },
  {
    key: 'needs_review',
    label: 'Needs review',
    description: 'Focus on unread signals that still need an owner decision.',
    filter: 'unread',
    sort: 'priority',
  },
  {
    key: 'high_risk',
    label: 'High risk',
    description: 'Jump straight to critical signals with the highest urgency first.',
    filter: 'critical',
    sort: 'priority',
  },
  {
    key: 'recommended_actions',
    label: 'Recommended actions',
    description: 'Review signals that already have practical next steps attached.',
    filter: 'actionable',
    sort: 'actionable',
  },
];

function QueryErrorPanel({ message, onRetry }) {
  return (
    <InsightStatePanel
      title="Could not load insights"
      description={message}
      tone="rose"
      onRetry={onRetry}
      retryLabel="Try again"
    />
  );
}

export default function AIInsights() {
  const { toast: shareToast, setToast: setShareToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = usePersistentState('taska.ai-insights-search-term', '');
  const [activeVisibilityFilter, setActiveVisibilityFilter] = usePersistentState('taska.ai-insights-visibility-filter', 'all');
  const [activeSort, setActiveSort] = usePersistentState('taska.ai-insights-sort', 'priority');
  const [savedViews, setSavedViews] = usePersistentState('taska.ai-insights-saved-views', []);
  const [showAllSavedViews, setShowAllSavedViews] = usePersistentState('taska.ai-insights-show-all-saved-views', false);
  const [viewNameDraft, setViewNameDraft] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm.trim());
  const requestedPresetKey = searchParams.get('preset');
  const requestedFilterKey = searchParams.get('filter');
  const requestedSortKey = searchParams.get('sort');
  const requestedGroupKey = searchParams.get('group') || '';
  const requestedInsightId = searchParams.get('insight') || '';
  const activePreset = GLOBAL_PRESET_OPTIONS.find(
    (preset) => preset.filter === activeVisibilityFilter && preset.sort === activeSort,
  )?.key || 'custom';
  const {
    toast,
    markReadMutation,
    dismissMutation,
    restoreMutation,
    markGroupReadMutation,
    dismissGroupMutation,
  } = useInsightActions();

  const insightsQuery = useQuery({
    queryKey: ['ai-insights', 'grouped'],
    queryFn: () => api.get('/ai/insights?grouped=1').then((response) => response.data),
  });
  const groups = insightsQuery.data || [];
  const isLoading = insightsQuery.isLoading;
  const isError = insightsQuery.isError;
  const error = insightsQuery.error;

  const filteredGroups = getFilteredInsightGroups(groups, {
    searchQuery: deferredSearchTerm,
    activeFilter: activeVisibilityFilter,
  });
  const focusedGroups = getFocusedInsightGroups(filteredGroups, requestedGroupKey);
  const sortedGroups = getSortedInsightGroups(focusedGroups, activeSort);
  const {
    activeGroups,
    unreadCount,
    criticalCount,
    recommendationCount,
    hasSignals,
  } = getInsightGroupsOverview(sortedGroups);
  const { groupCount, insightCount } = getInsightResultSummary(activeGroups);
  const globalFilterCounts = getInsightGlobalFilterCounts(groups, deferredSearchTerm);
  const hasSearch = deferredSearchTerm.length > 0;
  const hasActiveTopLevelFilter = activeVisibilityFilter !== 'all';
  const activeFocusedGroup = groups.find((group) => group.key === requestedGroupKey) || null;
  const errorMessage = error?.response?.data?.message || error?.message || 'Unable to load AI insights right now.';
  const {
    getGroupState,
    setGroupFilter,
    setConfirmReadGroupKey,
    setConfirmDismissGroupKey,
    markGroupRead,
    dismissGroup,
  } = useInsightGroupState({
    activeGroups,
    markGroupReadMutation,
    dismissGroupMutation,
  });

  useEffect(() => {
    if (!requestedPresetKey) {
      return;
    }

    const requestedPreset = GLOBAL_PRESET_OPTIONS.find((preset) => preset.key === requestedPresetKey);

    if (!requestedPreset) {
      return;
    }

    setActiveVisibilityFilter(requestedPreset.filter);
    setActiveSort(requestedPreset.sort);
  }, [requestedPresetKey, setActiveSort, setActiveVisibilityFilter]);

  useEffect(() => {
    if (requestedPresetKey) {
      return;
    }

    if (requestedFilterKey && GLOBAL_FILTER_OPTIONS.some((option) => option.key === requestedFilterKey)) {
      setActiveVisibilityFilter(requestedFilterKey);
    }

    if (requestedSortKey && GLOBAL_SORT_OPTIONS.some((option) => option.key === requestedSortKey)) {
      setActiveSort(requestedSortKey);
    }
  }, [requestedFilterKey, requestedPresetKey, requestedSortKey, setActiveSort, setActiveVisibilityFilter]);

  useEffect(() => {
    if (!requestedInsightId || isLoading) {
      return;
    }

    const target = typeof window !== 'undefined'
      ? window.document.getElementById(`insight-${requestedInsightId}`)
      : null;

    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [requestedInsightId, isLoading, activeGroups]);

  const getInsightFocusClasses = (insight) => {
    if (`${insight.id}` !== requestedInsightId) {
      return '';
    }

    return 'ring-2 ring-sky-400 ring-offset-2 ring-offset-white border-sky-200 shadow-[0_0_0_1px_rgba(56,189,248,0.08)]';
  };

  const currentViewPath = buildInsightViewUrl({
    activePreset,
    activeVisibilityFilter,
    activeSort,
    groupKey: requestedGroupKey,
    insightId: requestedInsightId,
  });
  const currentViewLabelParts = [
    GLOBAL_PRESET_OPTIONS.find((preset) => preset.key === activePreset)?.label || 'Custom view',
    activeFocusedGroup?.label,
    requestedInsightId ? 'Spotlighted signal' : null,
  ].filter(Boolean);
  const currentViewLabel = currentViewLabelParts.join(' - ');
  const currentSavedView = savedViews.find((view) => view.href === currentViewPath) || null;
  const isCurrentViewSaved = Boolean(currentSavedView);
  const isCurrentViewPinned = Boolean(currentSavedView?.pinned);
  const sortedSavedViews = [...savedViews]
    .sort((left, right) => Number(Boolean(right.pinned)) - Number(Boolean(left.pinned)));
  const normalizedViewNameDraft = viewNameDraft.trim();
  const hasUpdatedSavedViewName = Boolean(
    currentSavedView
    && normalizedViewNameDraft
    && normalizedViewNameDraft !== currentSavedView.label,
  );
  const shouldShowSavedViewToggle = shouldCollapseSavedViews(sortedSavedViews);
  const visibleSavedViews = getVisibleSavedViews({
    savedViews: sortedSavedViews,
    showAll: showAllSavedViews,
    currentViewHref: currentViewPath,
  });
  const hiddenSavedViewCount = getHiddenSavedViewCount({
    savedViews: sortedSavedViews,
    visibleSavedViews,
  });
  const activePresetLabel = GLOBAL_PRESET_OPTIONS.find((preset) => preset.key === activePreset)?.label || 'Custom view';
  const activeFilterLabel = GLOBAL_FILTER_OPTIONS.find((option) => option.key === activeVisibilityFilter)?.label || 'All signals';
  const activeSortLabel = GLOBAL_SORT_OPTIONS.find((option) => option.key === activeSort)?.label || 'Most urgent';
  const searchScopeSummary = hasSearch ? `Matches for "${deferredSearchTerm}"` : 'All insight content';
  const focusSummary = activeFocusedGroup
    ? `${activeFocusedGroup.label}${requestedInsightId ? ' with one spotlighted signal' : ''}`
    : requestedInsightId
      ? 'Spotlighting one signal'
      : 'All decision areas';

  const revealSavedViewsIfCollapsed = () => {
    if (shouldShowSavedViewToggle && !showAllSavedViews) {
      setShowAllSavedViews(true);
      return true;
    }

    return false;
  };

  useEffect(() => {
    const nextDraft = currentSavedView?.label || currentViewLabel;

    if (viewNameDraft === nextDraft) {
      return;
    }

    queueMicrotask(() => {
      setViewNameDraft(nextDraft);
    });
  }, [currentSavedView?.label, currentViewLabel, setViewNameDraft, viewNameDraft]);

  const handleCopyViewLink = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const sharePath = buildInsightViewUrl({
      pathname: window.location.pathname,
      activePreset,
      activeVisibilityFilter,
      activeSort,
      groupKey: requestedGroupKey,
      insightId: requestedInsightId,
    });
    const shareUrl = `${window.location.origin}${sharePath}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareToast({
        tone: 'success',
        message: 'Focused insight view link copied.',
      });
    } catch {
      setShareToast({
        tone: 'error',
        message: 'We could not copy that link right now.',
      });
    }
  };

  const handleSaveCurrentView = () => {
    const label = normalizedViewNameDraft || currentViewLabel;

    if (isCurrentViewSaved) {
      if (label !== currentSavedView.label) {
        setSavedViews((current) => current.map((view) => (
          view.href === currentViewPath
            ? { ...view, label }
            : view
        )));
        setShareToast(createAiInsightsSuccessToast('Saved AI view renamed.'));
        return;
      }

      setShareToast(createAiInsightsSuccessToast('This AI view is already saved.'));
      return;
    }

    setSavedViews((current) => [{
      href: currentViewPath,
      label,
    }, ...current].slice(0, 6));
    const didRevealSavedViews = revealSavedViewsIfCollapsed();
    setShareToast(createAiInsightsSavedViewsToast({
      message: 'AI view saved for quick return.',
      didRevealSavedViews,
      onCollapse: () => setShowAllSavedViews(false),
    }));
  };

  const handleToggleSavedViewPin = (href) => {
    let nextPinned = false;

    setSavedViews((current) => current.map((view) => {
      if (view.href !== href) {
        return view;
      }

      nextPinned = !view.pinned;
      return {
        ...view,
        pinned: nextPinned,
      };
    }));
    const didRevealSavedViews = nextPinned ? revealSavedViewsIfCollapsed() : false;
    setShareToast(createAiInsightsSavedViewsToast({
      message: nextPinned ? 'Saved AI view pinned to the top.' : 'Saved AI view unpinned.',
      didRevealSavedViews,
      onCollapse: () => setShowAllSavedViews(false),
    }));
  };

  const handleRemoveSavedView = (href) => {
    setSavedViews((current) => current.filter((view) => view.href !== href));
    setShareToast(createAiInsightsSuccessToast('Saved AI view removed.'));
  };

  const handleApplyPreset = (preset) => {
    if (activeVisibilityFilter === preset.filter && activeSort === preset.sort) {
      return;
    }

    const previousView = captureSortAndFilterState({
      activeVisibilityFilter,
      activeSort,
    });

    setActiveVisibilityFilter(preset.filter);
    setActiveSort(preset.sort);
    setShareToast(createAiInsightsUndoToast({
      message: `${preset.label} is now active.`,
      actionLabel: 'Back to previous view',
      onAction: () => {
        setActiveVisibilityFilter(previousView.filter);
        setActiveSort(previousView.sort);
      },
    }));
  };

  const handleApplyVisibilityFilter = (nextFilter) => {
    if (activeVisibilityFilter === nextFilter) {
      return;
    }

    const previousFilter = activeVisibilityFilter;
    const nextFilterLabel = GLOBAL_FILTER_OPTIONS.find((option) => option.key === nextFilter)?.label || 'Selected filter';

    setActiveVisibilityFilter(nextFilter);
    setShareToast(createAiInsightsUndoToast({
      message: `${nextFilterLabel} is now active.`,
      actionLabel: 'Back to previous filter',
      onAction: () => setActiveVisibilityFilter(previousFilter),
    }));
  };

  const handleApplySort = (nextSort) => {
    if (activeSort === nextSort) {
      return;
    }

    const previousSort = activeSort;
    const nextSortLabel = GLOBAL_SORT_OPTIONS.find((option) => option.key === nextSort)?.label || 'Selected sort';

    setActiveSort(nextSort);
    setShareToast(createAiInsightsUndoToast({
      message: `${nextSortLabel} sorting is now active.`,
      actionLabel: 'Back to previous sort',
      onAction: () => setActiveSort(previousSort),
    }));
  };

  const handleResetFilters = () => {
    const previousState = captureResetFiltersState({
      searchTerm,
      activeVisibilityFilter,
      activeSort,
      requestedGroupKey,
      requestedInsightId,
      preset: searchParams.get('preset'),
    });

    setSearchTerm('');
    setActiveVisibilityFilter('all');
    setActiveSort('priority');
    const next = new URLSearchParams(searchParams);
    next.delete('preset');
    next.delete('group');
    next.delete('insight');
    setSearchParams(next);
    setShareToast(createAiInsightsUndoToast({
      message: 'AI filters reset.',
      actionLabel: 'Restore previous view',
      onAction: () => {
        setSearchTerm(previousState.searchTerm);
        setActiveVisibilityFilter(previousState.activeVisibilityFilter);
        setActiveSort(previousState.activeSort);
        const restoreParams = buildInsightSearchParams({
          preset: previousState.preset,
          groupKey: previousState.groupKey,
          insightId: previousState.insightId,
        });
        setSearchParams(restoreParams);
      },
    }));
  };

  const handleApplyGroupFilter = (group, activeGroupFilter, nextFilter) => {
    if (activeGroupFilter === nextFilter) {
      return;
    }

    const previousFilter = activeGroupFilter;
    const nextFilterLabel = GROUP_FILTER_OPTIONS.find((option) => option.key === nextFilter)?.label || 'Selected filter';

    setGroupFilter(group.key, nextFilter);
    setShareToast(createAiInsightsUndoToast({
      message: `${group.label}: ${nextFilterLabel.toLowerCase()} view is now active.`,
      actionLabel: 'Back to previous group view',
      onAction: () => setGroupFilter(group.key, previousFilter),
    }));
  };

  return (
    <PageShell width="wide" className="page-stack">
      <Toast
        tone={(shareToast || toast)?.tone}
        message={(shareToast || toast)?.message}
        actionLabel={(shareToast || toast)?.actionLabel}
        onAction={(shareToast || toast)?.onAction}
      />
      <PageHero
        eyebrow="Decision Support"
        title="AI Insights"
        description="Explainable recommendations grouped by the business decisions they support, so owners can see what changed, why it matters, and where to act next."
        actions={(
          <>
            {criticalCount > 0 ? (
              <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-700">
                {criticalCount} critical
              </span>
            ) : null}
            {unreadCount > 0 ? (
              <span className="rounded-full bg-violet-600 px-3 py-1 text-sm font-semibold text-white shadow-sm">
                {unreadCount} new
              </span>
            ) : null}
          </>
        )}
      />

      <ResponsiveCardGrid variant="default" className="xl:grid-cols-3">
        <OpsMetricCard
          label="Unread Signals"
          value={unreadCount.toLocaleString()}
          helper="Fresh owner-facing signals waiting for review"
          tone="violet"
        />
        <OpsMetricCard
          label="Critical Alerts"
          value={criticalCount.toLocaleString()}
          helper="High-priority items that need immediate attention"
          tone="rose"
        />
        <OpsMetricCard
          label="Actionable Next Steps"
          value={recommendationCount.toLocaleString()}
          helper="Practical follow-ups already attached to live insights"
          tone="slate"
        />
      </ResponsiveCardGrid>

      {!isLoading && !isError ? (
        <Card className="border-slate-200/80 bg-white/90">
          <CardHeader
            title="Insight filters"
            subtitle="Search across every insight, then narrow to the signal type you want to review first."
            action={hasSearch || hasActiveTopLevelFilter || activeSort !== 'priority' || activeFocusedGroup ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Reset filters
              </button>
            ) : null}
          />

          <div className="space-y-4 px-6 pb-6">
            <div className="relative">
              <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search titles, explanations, recommendations, or business areas"
                aria-label="Search AI insights"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {GLOBAL_PRESET_OPTIONS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  aria-pressed={activePreset === preset.key}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    activePreset === preset.key
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'border border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300 hover:bg-violet-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-violet-100 bg-violet-50/80 px-4 py-3 text-sm text-violet-900">
              {GLOBAL_PRESET_OPTIONS.find((preset) => preset.key === activePreset)?.description
                || 'Custom view: you are combining visibility and sort settings manually.'}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={viewNameDraft}
                onChange={(event) => setViewNameDraft(event.target.value)}
                placeholder="Name this saved view"
                aria-label="Saved AI view name"
                className="h-10 min-w-[220px] rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
              <button
                type="button"
                onClick={handleSaveCurrentView}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  isCurrentViewSaved && !hasUpdatedSavedViewName
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {!isCurrentViewSaved
                  ? 'Save this view'
                  : hasUpdatedSavedViewName
                    ? 'Update saved name'
                    : 'View saved'}
              </button>
              {isCurrentViewSaved ? (
                <button
                  type="button"
                  onClick={() => handleToggleSavedViewPin(currentViewPath)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    isCurrentViewPinned
                      ? 'border border-amber-200 bg-amber-50 text-amber-800'
                      : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  {isCurrentViewPinned ? 'Pinned view' : 'Pin this view'}
                </button>
              ) : null}
              {visibleSavedViews.map((view) => (
                <div
                  key={view.href}
                  className={`flex items-center gap-1 rounded-full pr-2 transition ${
                    view.href === currentViewPath
                      ? 'border border-violet-200 bg-violet-50/90 shadow-sm'
                      : 'border border-slate-200 bg-white'
                  }`}
                >
                  {view.pinned ? (
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700">
                      Pin
                    </span>
                  ) : null}
                  {view.href === currentViewPath ? (
                    <span className="rounded-full bg-violet-600 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                      Current
                    </span>
                  ) : null}
                  <Link
                    to={view.href}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      view.href === currentViewPath
                        ? 'text-violet-900'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    {view.label}
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleToggleSavedViewPin(view.href)}
                    className={`text-xs font-semibold transition ${
                      view.href === currentViewPath
                        ? 'text-violet-500 hover:text-violet-700'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                    aria-label={`${view.pinned ? 'Unpin' : 'Pin'} saved view ${view.label}`}
                  >
                    {view.pinned ? 'unpin' : 'pin'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveSavedView(view.href)}
                    className={`text-xs font-semibold transition ${
                      view.href === currentViewPath
                        ? 'text-violet-500 hover:text-violet-700'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                    aria-label={`Remove saved view ${view.label}`}
                  >
                    x
                  </button>
                </div>
              ))}
              {shouldShowSavedViewToggle ? (
                <button
                  type="button"
                  onClick={() => setShowAllSavedViews((current) => !current)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  {showAllSavedViews
                    ? 'Show fewer saved views'
                    : `Show ${hiddenSavedViewCount} more saved view${hiddenSavedViewCount === 1 ? '' : 's'}`}
                </button>
              ) : null}
            </div>

            {sortedSavedViews.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-violet-50 px-2 py-1 font-semibold text-violet-700">
                  Current
                </span>
                <span>The saved view that matches the page you are looking at now.</span>
                <span className="rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-700">
                  Pin
                </span>
                <span>Pinned views stay at the top of your quick-return list.</span>
              </div>
            ) : null}

            {activeFocusedGroup ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-sky-900">
                <div>
                  Focused on{' '}
                  <span className="font-semibold text-slate-900">{activeFocusedGroup.label}</span>{' '}
                  from the dashboard preview{requestedInsightId ? ', with one signal spotlighted.' : '.'}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to="/dashboard"
                    className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:border-sky-300 hover:text-sky-900"
                  >
                    Back to dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleCopyViewLink}
                    className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:border-sky-300 hover:text-sky-900"
                  >
                    Copy view link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = new URLSearchParams(searchParams);
                      next.delete('group');
                      next.delete('insight');
                      setSearchParams(next);
                    }}
                    className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:border-sky-300 hover:text-sky-900"
                  >
                    Show all groups
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              {GLOBAL_FILTER_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => handleApplyVisibilityFilter(option.key)}
                  aria-pressed={activeVisibilityFilter === option.key}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    activeVisibilityFilter === option.key
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  {option.label} {globalFilterCounts[option.key] ? `(${globalFilterCounts[option.key]})` : ''}
                </button>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:items-start">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Sort groups by</span>
                <select
                  value={activeSort}
                  onChange={(event) => handleApplySort(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                >
                  {GLOBAL_SORT_OPTIONS.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {GLOBAL_SORT_OPTIONS.find((option) => option.key === activeSort)?.description}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Result scope
                </div>
                <div className="text-base font-semibold text-slate-900">
                  {groupCount} group{groupCount === 1 ? '' : 's'}
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {insightCount} insight{insightCount === 1 ? '' : 's'} in the current view.
                </p>
              </div>
              <div className="rounded-2xl border border-violet-100 bg-violet-50/80 px-4 py-3">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600">
                  Preset
                </div>
                <div className="text-base font-semibold text-violet-950">
                  {activePresetLabel}
                </div>
                <p className="mt-1 text-sm text-violet-800">
                  {searchScopeSummary}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Filter and sort
                </div>
                <div className="text-base font-semibold text-slate-900">
                  {activeFilterLabel}
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Ordered by {activeSortLabel.toLowerCase()}.
                </p>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-600">
                  Focus
                </div>
                <div className="text-base font-semibold text-sky-950">
                  {activeFocusedGroup ? 'Focused view' : 'Broad view'}
                </div>
                <p className="mt-1 text-sm text-sky-800">
                  {focusSummary}
                </p>
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      {isLoading ? (
        <InsightLoadingState />
      ) : null}

      {isError && !isLoading ? (
        <QueryErrorPanel
          message={errorMessage}
          onRetry={() => insightsQuery.refetch()}
        />
      ) : null}

      {hasSignals && !isError ? (
        <div className="space-y-6">
          {activeGroups.map((group) => {
            const {
              unreadIds,
              dismissibleIds,
              activeFilter,
              filterCounts,
              visibleItems,
              needsReadConfirmation,
              isConfirmingRead,
              isConfirmingDismiss,
              isMarkingGroupRead,
              isDismissingGroup,
              summary,
            } = getGroupState(group);

            return (
            <section key={group.key} className="space-y-4">
              <Card className="border-slate-200/80 bg-white/90">
                <CardHeader
                  title={group.label}
                  subtitle={`${group.count} active signals, ${group.unread} unread`}
                  action={(
                    <InsightGroupActions
                      group={group}
                      unreadIds={unreadIds}
                      dismissibleIds={dismissibleIds}
                      needsReadConfirmation={needsReadConfirmation}
                      isConfirmingRead={isConfirmingRead}
                      isConfirmingDismiss={isConfirmingDismiss}
                      isMarkingGroupRead={isMarkingGroupRead}
                      isDismissingGroup={isDismissingGroup}
                      isAnyBatchPending={markGroupReadMutation.isPending || dismissGroupMutation.isPending}
                      summary={summary}
                      onStartReadConfirm={() => {
                        if (needsReadConfirmation) {
                          setConfirmReadGroupKey(group.key);
                          return;
                        }

                        markGroupRead(group.key, unreadIds);
                      }}
                      onCancelReadConfirm={() => setConfirmReadGroupKey(null)}
                      onConfirmRead={() => markGroupRead(group.key, unreadIds)}
                      onStartDismissConfirm={() => setConfirmDismissGroupKey(group.key)}
                      onCancelDismissConfirm={() => setConfirmDismissGroupKey(null)}
                      onConfirmDismiss={() => dismissGroup(group.key, dismissibleIds)}
                    />
                  )}
                />
                <InsightGroupFilters
                  activeFilter={activeFilter}
                  counts={filterCounts}
                  onChange={(filterKey) => handleApplyGroupFilter(group, activeFilter, filterKey)}
                />

                <InsightCardList
                  insights={visibleItems}
                  ariaLabel={`${group.label} insights`}
                  getInsightAction={(insight) => getInsightAction(insight, '/dashboard')}
                  getInsightCardPresentationProps={getInsightCardPresentationProps}
                  getInsightFocusClasses={getInsightFocusClasses}
                  getInsightHighlights={extractInsightHighlights}
                  getUpdatedLabel={(insight) => formatShortDate(insight.updated_at || insight.created_at, 'Recently updated')}
                  markReadMutation={markReadMutation}
                  dismissMutation={dismissMutation}
                  restoreMutation={restoreMutation}
                  unreadClasses="ring-2 ring-violet-300 ring-offset-2 ring-offset-white"
                />
                {visibleItems.length === 0 ? (
                  <div className="mx-6 mt-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    No {activeFilter === 'all' ? 'insights' : activeFilter} items are visible in this group right now.
                  </div>
                ) : null}
              </Card>
            </section>
            );
          })}
        </div>
      ) : null}

      {!hasSignals && !isLoading && !isError ? (
        <InsightStatePanel
          title={hasSearch || hasActiveTopLevelFilter ? 'No matching insights' : 'All caught up'}
          description={
            hasSearch || hasActiveTopLevelFilter || activeFocusedGroup || requestedInsightId
              ? 'No insight currently matches this search and visibility combination. Try broadening the search or resetting the top-level filter.'
              : 'No active insights are waiting right now. As your business activity changes, Taska will surface new signals here with clear next actions.'
          }
          tone={hasSearch || hasActiveTopLevelFilter || activeFocusedGroup || requestedInsightId ? 'amber' : 'violet'}
        />
      ) : null}
    </PageShell>
  );
}

