const ACTION_TYPE_LABELS = {
  expense: 'Expense',
  inventory_adjustment: 'Inventory adjustment',
  order_discount: 'Order discount',
};

export function formatApprovalActionType(actionType) {
  return ACTION_TYPE_LABELS[actionType] ?? actionType;
}

export function buildSettingsApprovalSettingsDefaults(settings = {}) {
  return {
    expense_approval_threshold: settings.expense_approval_threshold != null ? String(settings.expense_approval_threshold) : '',
    discount_approval_threshold: settings.discount_approval_threshold != null ? String(settings.discount_approval_threshold) : '',
    require_inventory_adjustment_approval: Boolean(settings.require_inventory_adjustment_approval),
  };
}

export function hasSettingsApprovalSettingsChanges(saved, draft) {
  if (!saved || !draft) {
    return false;
  }

  const savedDraft = buildSettingsApprovalSettingsDefaults(saved);

  return (
    savedDraft.expense_approval_threshold !== draft.expense_approval_threshold
    || savedDraft.discount_approval_threshold !== draft.discount_approval_threshold
    || savedDraft.require_inventory_adjustment_approval !== draft.require_inventory_adjustment_approval
  );
}

export function buildApprovalSettingsPayload(draft) {
  return {
    expense_approval_threshold: draft.expense_approval_threshold.trim() === '' ? null : Number(draft.expense_approval_threshold),
    discount_approval_threshold: draft.discount_approval_threshold.trim() === '' ? null : Number(draft.discount_approval_threshold),
    require_inventory_adjustment_approval: draft.require_inventory_adjustment_approval,
  };
}

export function buildSettingsApprovalMetrics(approvals = []) {
  const pending = approvals.filter((approval) => approval.status === 'pending').length;
  const approved = approvals.filter((approval) => approval.status === 'approved').length;
  const declined = approvals.filter((approval) => approval.status === 'declined').length;

  return [
    {
      label: 'Pending Review',
      value: pending.toLocaleString(),
      helper: pending > 0 ? 'These are blocked until a business owner decides' : 'Nothing waiting on review right now',
      tone: pending > 0 ? 'amber' : 'emerald',
    },
    {
      label: 'Approved',
      value: approved.toLocaleString(),
      helper: 'Went through only after a business owner signed off',
      tone: 'emerald',
    },
    {
      label: 'Declined',
      value: declined.toLocaleString(),
      helper: 'Never took effect',
      tone: 'slate',
    },
  ];
}
