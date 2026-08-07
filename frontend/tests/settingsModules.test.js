import test from 'node:test';
import assert from 'node:assert/strict';

import { humanizeModuleLabel, buildSettingsModuleRows } from '../src/lib/settingsModules.js';

test('humanizeModuleLabel turns snake_case slugs into title case labels', () => {
  assert.equal(humanizeModuleLabel('cashier_shifts'), 'Cashier Shifts');
  assert.equal(humanizeModuleLabel('pos'), 'Pos');
  assert.equal(humanizeModuleLabel('barcode_labels'), 'Barcode Labels');
});

test('buildSettingsModuleRows marks dashboard as core and reflects enabled state', () => {
  const rows = buildSettingsModuleRows(
    ['dashboard', 'pos', 'loyalty', 'refunds'],
    ['dashboard', 'pos', 'loyalty'],
  );

  assert.equal(rows.length, 4);
  assert.deepEqual(rows.find((row) => row.slug === 'dashboard'), {
    slug: 'dashboard',
    label: 'Dashboard',
    isEnabled: true,
    isCore: true,
  });
  assert.deepEqual(rows.find((row) => row.slug === 'refunds'), {
    slug: 'refunds',
    label: 'Refunds',
    isEnabled: false,
    isCore: false,
  });
});
