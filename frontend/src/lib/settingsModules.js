export function humanizeModuleLabel(slug) {
  return slug
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function buildSettingsModuleRows(available = [], enabled = []) {
  const enabledSet = new Set(enabled);

  return available.map((slug) => ({
    slug,
    label: humanizeModuleLabel(slug),
    isEnabled: enabledSet.has(slug),
    isCore: slug === 'dashboard',
  }));
}
