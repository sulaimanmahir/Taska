export function joinFinanceLensParts(parts) {
  return parts.filter(Boolean).join(' • ');
}

export function buildLedgerScopeLensItem({ value, helper, tone = 'slate' }) {
  return {
    label: 'Ledger scope',
    value,
    helper,
    tone,
  };
}

export function buildActiveViewLensItem({ value, helper, tone = 'emerald' }) {
  return {
    label: 'Active view',
    value,
    helper,
    tone,
  };
}

export function buildOrderingLensItem({ value, helper, tone = 'amber' }) {
  return {
    label: 'Ordering',
    value,
    helper,
    tone,
  };
}

export function buildFocusLensItem({ label = 'Current focus', value, helper, tone = 'slate' }) {
  return {
    label,
    value,
    helper,
    tone,
  };
}
