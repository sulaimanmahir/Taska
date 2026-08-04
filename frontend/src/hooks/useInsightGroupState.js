import { useMemo, useState } from 'react';
import {
  buildInsightGroupDismissSummary,
  buildInsightGroupReadSummary,
  getDismissibleInsightIds,
  getInsightGroupFilterCounts,
  getUnreadInsightIds,
  getVisibleInsightGroupItems,
} from '../lib/aiInsights';
import { usePersistentState } from './usePersistentState';

export function useInsightGroupState({
  activeGroups,
  markGroupReadMutation,
  dismissGroupMutation,
}) {
  const [confirmReadGroupKey, setConfirmReadGroupKey] = useState(null);
  const [confirmDismissGroupKey, setConfirmDismissGroupKey] = useState(null);
  const [groupActionSummary, setGroupActionSummary] = useState({});
  const [groupFilters, setGroupFilters] = usePersistentState('taska.ai-insight-group-filters', {});
  const activeGroupKeys = useMemo(() => new Set(activeGroups.map((group) => group.key)), [activeGroups]);

  const visibleGroupActionSummary = useMemo(() => Object.fromEntries(
    Object.entries(groupActionSummary).filter(([groupKey, summary]) => {
      const group = activeGroups.find((item) => item.key === groupKey);

      if (!group || !summary) {
        return false;
      }

      const unreadCountForGroup = getUnreadInsightIds(group).length;
      const dismissibleCountForGroup = getDismissibleInsightIds(group).length;
      const shouldClear =
        (summary.tone === 'violet' && unreadCountForGroup === 0) ||
        (summary.tone === 'rose' && dismissibleCountForGroup === 0);

      return !shouldClear;
    }),
  ), [activeGroups, groupActionSummary]);

  const visibleGroupFilters = useMemo(() => Object.fromEntries(
    Object.entries(groupFilters).filter(([groupKey]) => activeGroupKeys.has(groupKey)),
  ), [activeGroupKeys, groupFilters]);

  const setGroupFilter = (groupKey, filterKey) => {
    setGroupFilters((current) => ({
      ...current,
      [groupKey]: filterKey,
    }));
  };

  const getGroupState = (group) => {
    const unreadIds = getUnreadInsightIds(group);
    const dismissibleIds = getDismissibleInsightIds(group);
    const activeFilter = visibleGroupFilters[group.key] || 'all';
    const filterCounts = getInsightGroupFilterCounts(group);
    const visibleItems = getVisibleInsightGroupItems(group, activeFilter);
    const needsReadConfirmation = unreadIds.length >= 4;

    return {
      unreadIds,
      dismissibleIds,
      activeFilter,
      filterCounts,
      visibleItems,
      needsReadConfirmation,
      isConfirmingRead: confirmReadGroupKey === group.key,
      isConfirmingDismiss: confirmDismissGroupKey === group.key,
      isMarkingGroupRead: markGroupReadMutation.isPending && (!needsReadConfirmation || confirmReadGroupKey === group.key),
      isDismissingGroup: dismissGroupMutation.isPending && confirmDismissGroupKey === group.key,
      summary: visibleGroupActionSummary[group.key],
    };
  };

  const markGroupRead = (groupKey, unreadIds) => {
    markGroupReadMutation.mutate(unreadIds, {
      onSuccess: () => {
        setGroupActionSummary((current) => ({
          ...current,
          [groupKey]: buildInsightGroupReadSummary(unreadIds.length),
        }));
      },
      onSettled: () => {
        setConfirmReadGroupKey(null);
      },
    });
  };

  const dismissGroup = (groupKey, dismissibleIds) => {
    dismissGroupMutation.mutate(dismissibleIds, {
      onSuccess: () => {
        setGroupActionSummary((current) => ({
          ...current,
          [groupKey]: buildInsightGroupDismissSummary(dismissibleIds.length),
        }));
      },
      onSettled: () => {
        setConfirmDismissGroupKey(null);
      },
    });
  };

  return {
    getGroupState,
    setGroupFilter,
    confirmReadGroupKey,
    setConfirmReadGroupKey,
    confirmDismissGroupKey,
    setConfirmDismissGroupKey,
    markGroupRead,
    dismissGroup,
  };
}
