import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { usePersistentState } from './usePersistentState';

export function computeLedgerPagination({ response, itemCount = 0 }) {
  return {
    currentPage: response?.current_page ?? 1,
    lastPage: response?.last_page ?? 1,
    from: response?.from ?? (itemCount > 0 ? 1 : 0),
    to: response?.to ?? itemCount,
    total: response?.total ?? itemCount,
  };
}

export function useLedgerControls({
  storageKeyPrefix,
  initialView = 'all',
  initialSort = 'priority',
  requestedView = null,
  requestedSort = null,
  response,
  itemCount = 0,
}) {
  const [accountsPage, setAccountsPage] = useState(1);
  const [searchTerm, setSearchTerm] = usePersistentState(`${storageKeyPrefix}-search-term`, '');
  const [activeView, setActiveView] = usePersistentState(`${storageKeyPrefix}-active-view`, initialView);
  const [activeSort, setActiveSort] = usePersistentState(`${storageKeyPrefix}-active-sort`, initialSort);
  const deferredSearchTerm = useDeferredValue(searchTerm.trim());

  useEffect(() => {
    const resetPageTask = setTimeout(() => {
      setAccountsPage(1);
    }, 0);

    return () => {
      clearTimeout(resetPageTask);
    };
  }, [activeSort, activeView, deferredSearchTerm]);

  useEffect(() => {
    if (requestedView && requestedView !== activeView) {
      setActiveView(requestedView);
    }
  }, [activeView, requestedView, setActiveView]);

  useEffect(() => {
    if (requestedSort && requestedSort !== activeSort) {
      setActiveSort(requestedSort);
    }
  }, [activeSort, requestedSort, setActiveSort]);

  const pagination = useMemo(
    () => computeLedgerPagination({ response, itemCount }),
    [itemCount, response]
  );

  return {
    accountsPage,
    setAccountsPage,
    searchTerm,
    setSearchTerm,
    activeView,
    setActiveView,
    activeSort,
    setActiveSort,
    deferredSearchTerm,
    hasSearch: deferredSearchTerm.length > 0,
    pagination,
  };
}
