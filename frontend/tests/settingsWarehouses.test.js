import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSettingsWarehouseCreateDefaults,
  buildSettingsWarehouseDrafts,
  buildSettingsWarehouseMetrics,
  buildSettingsWarehouseStatusNote,
  formatSettingsWarehouseBranchLabel,
  hasSettingsWarehouseDraftChanges,
  sortSettingsWarehouses,
} from '../src/lib/settingsWarehouses.js';

test('buildSettingsWarehouseCreateDefaults returns clean defaults', () => {
  const form = buildSettingsWarehouseCreateDefaults();
  assert.equal(form.name, '');
  assert.equal(form.branch_id, '');
  assert.equal(form.is_default, false);
});

test('buildSettingsWarehouseDrafts maps warehouses into editable drafts, coercing branch_id to a string', () => {
  const drafts = buildSettingsWarehouseDrafts([
    { id: 1, name: 'Main', branch_id: 5, is_default: true, is_active: true },
    { id: 2, name: 'Overflow', branch_id: null, is_default: false, is_active: false },
  ]);

  assert.equal(drafts[1].branch_id, '5');
  assert.equal(drafts[2].branch_id, '');
  assert.equal(drafts[2].is_active, false);
});

test('hasSettingsWarehouseDraftChanges detects a branch reassignment', () => {
  const warehouse = { name: 'Main', branch_id: 5, description: '', address: '', is_default: true, is_active: true };
  const unchanged = { name: 'Main', branch_id: '5', description: '', address: '', is_default: true, is_active: true };
  const changed = { ...unchanged, branch_id: '9' };

  assert.equal(hasSettingsWarehouseDraftChanges(warehouse, unchanged), false);
  assert.equal(hasSettingsWarehouseDraftChanges(warehouse, changed), true);
});

test('sortSettingsWarehouses puts the default warehouse first, then active ones, then alphabetical', () => {
  const sorted = sortSettingsWarehouses([
    { name: 'Zebra', is_default: false, is_active: true },
    { name: 'Alpha', is_default: false, is_active: false },
    { name: 'Default One', is_default: true, is_active: true },
  ]);

  assert.deepEqual(sorted.map((w) => w.name), ['Default One', 'Zebra', 'Alpha']);
});

test('buildSettingsWarehouseMetrics flags warehouses not yet assigned to a branch', () => {
  const metrics = buildSettingsWarehouseMetrics([
    { is_active: true, branch_id: 1 },
    { is_active: true, branch_id: null },
    { is_active: false, branch_id: null },
  ]);

  assert.equal(metrics[0].value, '2/3');
  assert.equal(metrics[1].value, '2');
  assert.equal(metrics[1].tone, 'amber');
});

test('buildSettingsWarehouseMetrics reports a fully-assigned fleet cleanly', () => {
  const metrics = buildSettingsWarehouseMetrics([{ is_active: true, branch_id: 1 }]);
  assert.equal(metrics[1].value, '0');
  assert.equal(metrics[1].tone, 'violet');
});

test('formatSettingsWarehouseBranchLabel falls back when no branch is linked', () => {
  assert.equal(formatSettingsWarehouseBranchLabel({ branch: { name: 'Kano' } }), 'Kano');
  assert.equal(formatSettingsWarehouseBranchLabel({}), 'Not assigned to a branch');
});

test('buildSettingsWarehouseStatusNote prioritizes default over unassigned over inactive', () => {
  assert.match(buildSettingsWarehouseStatusNote({ is_default: true }), /default warehouse/);
  assert.match(buildSettingsWarehouseStatusNote({ is_active: false }), /Inactive warehouses/);
  assert.match(buildSettingsWarehouseStatusNote({ branch_id: null, is_active: true }), /Assign this warehouse/);
  assert.match(buildSettingsWarehouseStatusNote({ branch_id: 1, is_active: true }), /promoted to default/);
});
