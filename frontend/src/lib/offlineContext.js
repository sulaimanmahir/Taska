export function buildBusinessScopedKey(businessId, key) {
  return `${businessId ?? 'global'}:${key}`;
}

export function flattenPendingActions(pendingActionsByBusiness) {
  return Object.values(pendingActionsByBusiness).flat();
}
