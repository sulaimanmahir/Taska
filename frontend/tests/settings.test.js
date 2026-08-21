import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSettingsBusinessFields,
  buildSettingsMetrics,
  buildSettingsProfileFields,
  getSettingsTabContent,
  settingsTabs,
} from '../src/lib/settings.js';

test('settings tabs stay aligned with the available workspace sections', () => {
  assert.deepEqual(settingsTabs, [
    { key: 'profile', label: 'Profile' },
    { key: 'business', label: 'Business' },
    { key: 'users', label: 'Users & Roles' },
    { key: 'branches', label: 'Branches' },
    { key: 'warehouses', label: 'Warehouses' },
    { key: 'modules', label: 'Modules' },
    { key: 'approvals', label: 'Approvals' },
    { key: 'activity', label: 'Activity' },
    { key: 'support', label: 'Support' },
  ]);
});

test('settings metrics summarize workspace and identity state clearly', () => {
  assert.deepEqual(buildSettingsMetrics({
    user: { name: 'Amina Bello', email: 'amina@example.com' },
    business: { name: 'Taska Mart' },
    linkedBusinesses: 2,
  }), [
    {
      label: 'Active Workspace',
      value: 'Taska Mart',
      helper: 'This is the tenant currently powering your dashboard and workflows',
      tone: 'violet',
    },
    {
      label: 'Linked Businesses',
      value: '2',
      helper: 'Multiple workspaces can share one secure login',
      tone: 'sky',
    },
    {
      label: 'Signed-in Identity',
      value: 'Amina Bello',
      helper: 'amina@example.com',
      tone: 'emerald',
    },
  ]);
});

test('settings profile and business fields preserve labels and support copy', () => {
  assert.deepEqual(buildSettingsProfileFields({
    name: 'Amina Bello',
    email: 'amina@example.com',
    phone: '08030001111',
    current_business_id: 17,
  }), [
    { label: 'Full name', value: 'Amina Bello' },
    { label: 'Email address', value: 'amina@example.com' },
    {
      label: 'Phone number',
      value: '08030001111',
      helper: 'Optional. Used for support follow-up, recovery, and cleaner account handoff.',
    },
    {
      label: 'Current business ID',
      value: 17,
      helper: 'Useful for support and tenant troubleshooting.',
    },
  ]);

  assert.deepEqual(buildSettingsBusinessFields({
    business_type_label: 'Retail / Shop / Kiosk',
    email: 'hello@taskamart.test',
    phone: '08032221111',
    currency: 'NGN',
    location: '12 Market Road, Kano, Nigeria',
  }), [
    {
      label: 'Business type',
      value: 'Retail / Shop / Kiosk',
      helper: 'This controls industry-aware workflows, navigation, and AI behavior.',
    },
    { label: 'Business email', value: 'hello@taskamart.test' },
    { label: 'Phone', value: '08032221111' },
    { label: 'Currency', value: 'NGN' },
    { label: 'Location', value: '12 Market Road, Kano, Nigeria', fullWidth: true },
  ]);
});

test('settings tab content helpers keep live settings copy aligned', () => {
  assert.equal(getSettingsTabContent('profile')?.asideTitle, 'Profile updates are live');
  assert.equal(getSettingsTabContent('business', { linkedBusinesses: 1 })?.multiBusinessCopy.includes('1 linked business'), true);
  assert.deepEqual(getSettingsTabContent('users')?.roadmapItems, [
    'Email-based invite acceptance instead of owner-set initial passwords',
    'Approval rules for large expenses, inventory adjustments, and order discounts - see the Approvals tab',
  ]);
  assert.equal(getSettingsTabContent('branches')?.calloutTitle, 'Branch operating model');
  assert.deepEqual(getSettingsTabContent('branches')?.roadmapItems, [
    'Approval thresholds can be overridden per branch (see the Approvals tab) instead of only business-wide',
    'AI-led branch comparison alerts for performance, demand, and staffing',
  ]);
  assert.equal(getSettingsTabContent('warehouses')?.calloutTitle, 'What warehouse assignment does today');
  assert.equal(getSettingsTabContent('approvals')?.calloutTitle, 'How this works');
  assert.equal(getSettingsTabContent('modules')?.calloutTitle, 'Feature modules');
  assert.equal(getSettingsTabContent('activity')?.calloutTitle, 'Why this exists');
  assert.equal(getSettingsTabContent('support')?.calloutTitle, 'What happens after you send one');
  assert.equal(getSettingsTabContent('missing'), null);
});
