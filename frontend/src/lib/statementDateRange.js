function formatDateInput(value) {
  return value.toISOString().slice(0, 10);
}

export function getStatementDateRangePreset(preset) {
  const today = new Date();
  const end = formatDateInput(today);

  if (preset === 'month') {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      start: formatDateInput(startOfMonth),
      end,
    };
  }

  if (preset === 'last30') {
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 29);
    return {
      start: formatDateInput(startDate),
      end,
    };
  }

  return {
    start: '',
    end: '',
  };
}

export function matchesStatementDateRange(value, range) {
  if (!value) {
    return false;
  }

  const transactionDate = String(value).slice(0, 10);

  if (range.start && transactionDate < range.start) {
    return false;
  }

  if (range.end && transactionDate > range.end) {
    return false;
  }

  return true;
}
