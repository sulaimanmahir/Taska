import { useState } from 'react';
import { usePersistentState } from './usePersistentState';
import { getStatementDateRangePreset } from '../lib/statementDateRange';

export function useStatementFilters({
  storageKeyPrefix,
  initialView = 'all',
  resetKey,
}) {
  const [statementView, persistStatementView] = usePersistentState(`${storageKeyPrefix}-view`, initialView);
  const [statementDatePreset, setStatementDatePreset] = usePersistentState(`${storageKeyPrefix}-date-preset`, 'all');
  const [statementDateRange, setStatementDateRange] = usePersistentState(`${storageKeyPrefix}-date-range`, {
    start: '',
    end: '',
  });
  const [showAllState, setShowAllState] = useState({ value: false, resetKey });

  const showAllStatement = showAllState.resetKey === resetKey ? showAllState.value : false;

  const setShowAllStatement = (nextValue) => {
    setShowAllState((current) => {
      const currentValue = current.resetKey === resetKey ? current.value : false;
      const resolvedValue = typeof nextValue === 'function' ? nextValue(currentValue) : nextValue;

      return {
        value: resolvedValue,
        resetKey,
      };
    });
  };

  const handleStatementPresetChange = (preset) => {
    setStatementDatePreset(preset);
    setStatementDateRange(getStatementDateRangePreset(preset));
    setShowAllStatement(false);
  };

  const setStatementView = (nextView) => {
    persistStatementView(nextView);
    setShowAllStatement(false);
  };

  const handleStatementDateChange = (field, value) => {
    setStatementDatePreset('custom');
    setStatementDateRange((current) => ({ ...current, [field]: value }));
    setShowAllStatement(false);
  };

  const resetStatementFilters = () => {
    setStatementView(initialView);
    setStatementDatePreset('all');
    setStatementDateRange({ start: '', end: '' });
    setShowAllStatement(false);
  };

  const filtersAreActive = statementView !== initialView || statementDateRange.start || statementDateRange.end;

  return {
    statementView,
    setStatementView,
    statementDatePreset,
    statementDateRange,
    showAllStatement,
    setShowAllStatement,
    handleStatementPresetChange,
    handleStatementDateChange,
    resetStatementFilters,
    filtersAreActive,
  };
}
