function getGroupItems(group) {
  return group?.items || [];
}

function normalizeInsightText(value) {
  return `${value || ''}`.trim().toLowerCase();
}

function getSeverityRank(severity = '') {
  if (severity === 'critical') {
    return 3;
  }

  if (severity === 'warning') {
    return 2;
  }

  return 1;
}

function getInsightTimestamp(insight) {
  return Date.parse(insight?.updated_at || insight?.created_at || 0) || 0;
}

export function getActiveInsightGroups(groups = []) {
  return groups.filter((group) => (group.count || 0) > 0);
}

export function getInsightGroupMetrics(groups = []) {
  return groups.reduce((summary, group) => ({
    unreadCount: summary.unreadCount + (group.unread || 0),
    criticalCount: summary.criticalCount + (group.critical || 0),
    recommendationCount: summary.recommendationCount + (group.actionable || 0),
  }), {
    unreadCount: 0,
    criticalCount: 0,
    recommendationCount: 0,
  });
}

export function getInsightGroupsOverview(groups = []) {
  const activeGroups = getActiveInsightGroups(groups);
  const metrics = getInsightGroupMetrics(groups);

  return {
    activeGroups,
    ...metrics,
    hasSignals: activeGroups.length > 0,
  };
}

export function getUnreadInsightIds(group) {
  return getGroupItems(group)
    .filter((insight) => !insight.is_read)
    .map((insight) => insight.id);
}

export function getDismissibleInsightIds(group) {
  return getGroupItems(group)
    .filter((insight) => insight.severity !== 'critical')
    .map((insight) => insight.id);
}

export function getInsightGroupFilterCounts(group) {
  const items = getGroupItems(group);

  return {
    all: items.length,
    unread: items.filter((insight) => !insight.is_read).length,
    actionable: items.filter((insight) => Boolean(insight.recommendation)).length,
  };
}

export function getVisibleInsightGroupItems(group, activeFilter = 'all') {
  const items = getGroupItems(group);

  return items.filter((insight) => {
    if (activeFilter === 'unread') {
      return !insight.is_read;
    }

    if (activeFilter === 'actionable') {
      return Boolean(insight.recommendation);
    }

    return true;
  });
}

export function getInsightSearchMatch(insight, query, groupLabel = '') {
  const normalizedQuery = normalizeInsightText(query);

  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    insight?.title,
    insight?.description,
    insight?.recommendation,
    insight?.type,
    insight?.severity,
    groupLabel,
  ]
    .map(normalizeInsightText)
    .join(' ');

  return haystack.includes(normalizedQuery);
}

export function getVisibleInsightsByGlobalFilter(items = [], activeFilter = 'all') {
  return items.filter((insight) => {
    if (activeFilter === 'unread') {
      return !insight.is_read;
    }

    if (activeFilter === 'actionable') {
      return Boolean(insight.recommendation);
    }

    if (activeFilter === 'critical') {
      return insight.severity === 'critical';
    }

    return true;
  });
}

export function getInsightGlobalFilterCounts(groups = [], searchQuery = '') {
  const counts = {
    all: 0,
    unread: 0,
    actionable: 0,
    critical: 0,
  };

  groups.forEach((group) => {
    getGroupItems(group)
      .filter((insight) => getInsightSearchMatch(insight, searchQuery, group.label))
      .forEach((insight) => {
        counts.all += 1;

        if (!insight.is_read) {
          counts.unread += 1;
        }

        if (insight.recommendation) {
          counts.actionable += 1;
        }

        if (insight.severity === 'critical') {
          counts.critical += 1;
        }
      });
  });

  return counts;
}

export function getFilteredInsightGroups(groups = [], { searchQuery = '', activeFilter = 'all' } = {}) {
  return groups
    .map((group) => {
      const matchedItems = getGroupItems(group).filter((insight) => getInsightSearchMatch(insight, searchQuery, group.label));
      const visibleItems = getVisibleInsightsByGlobalFilter(matchedItems, activeFilter);

      if (!visibleItems.length) {
        return null;
      }

      return {
        ...group,
        items: visibleItems,
        count: visibleItems.length,
        unread: visibleItems.filter((insight) => !insight.is_read).length,
        critical: visibleItems.filter((insight) => insight.severity === 'critical').length,
        actionable: visibleItems.filter((insight) => Boolean(insight.recommendation)).length,
      };
    })
    .filter(Boolean);
}

export function getFocusedInsightGroups(groups = [], activeGroupKey = '') {
  if (!activeGroupKey) {
    return groups;
  }

  return groups.filter((group) => group.key === activeGroupKey);
}

export function getSortedInsightGroups(groups = [], activeSort = 'priority') {
  const sortedGroups = [...groups];

  sortedGroups.sort((left, right) => {
    const leftItems = left.items || [];
    const rightItems = right.items || [];
    const leftLatestTimestamp = Math.max(0, ...leftItems.map(getInsightTimestamp));
    const rightLatestTimestamp = Math.max(0, ...rightItems.map(getInsightTimestamp));
    const leftHighestSeverity = Math.max(0, ...leftItems.map((item) => getSeverityRank(item.severity)));
    const rightHighestSeverity = Math.max(0, ...rightItems.map((item) => getSeverityRank(item.severity)));
    const leftActionable = left.actionable || 0;
    const rightActionable = right.actionable || 0;

    if (activeSort === 'newest') {
      return rightLatestTimestamp - leftLatestTimestamp || right.unread - left.unread || right.count - left.count;
    }

    if (activeSort === 'actionable') {
      return rightActionable - leftActionable || right.unread - left.unread || rightLatestTimestamp - leftLatestTimestamp;
    }

    return rightHighestSeverity - leftHighestSeverity
      || right.unread - left.unread
      || rightActionable - leftActionable
      || rightLatestTimestamp - leftLatestTimestamp;
  });

  return sortedGroups;
}

export function getInsightResultSummary(groups = []) {
  return groups.reduce((summary, group) => ({
    groupCount: summary.groupCount + 1,
    insightCount: summary.insightCount + (group.count || 0),
  }), {
    groupCount: 0,
    insightCount: 0,
  });
}
