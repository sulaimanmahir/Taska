export const ACTIVE_BUSINESS_STORAGE_KEY = 'taska-active-business-id';

export function resolvePostLoginPath({
  requiresBusinessSelection,
  needsBusinessOnboarding,
}) {
  if (needsBusinessOnboarding) {
    return '/businesses/new';
  }

  if (requiresBusinessSelection) {
    return '/business-select';
  }

  return '/';
}
