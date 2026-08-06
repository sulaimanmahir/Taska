import test from 'node:test';
import assert from 'node:assert/strict';

import {
  dashboardVerticalSections,
  getDashboardVerticalSection,
} from '../src/lib/dashboardVerticalSections.js';

test('getDashboardVerticalSection finds the section owning a business type', () => {
  const section = getDashboardVerticalSection('retail');
  assert.equal(section.title, 'Retail Operations');
  assert.ok(section.types.includes('supermarket'));
});

test('getDashboardVerticalSection resolves the ngo_warehouse alias to the warehouse section', () => {
  const section = getDashboardVerticalSection('ngo_warehouse');
  assert.equal(section.title, 'Warehouse Control');
});

test('getDashboardVerticalSection returns null for an unknown business type', () => {
  assert.equal(getDashboardVerticalSection('unknown_type'), null);
  assert.equal(getDashboardVerticalSection(undefined), null);
});

test('every section metrics() function returns an array of label/value/tone entries', () => {
  for (const section of dashboardVerticalSections) {
    const metrics = section.metrics({});
    assert.ok(Array.isArray(metrics), `${section.title} metrics should be an array`);
    assert.ok(metrics.length > 0, `${section.title} should define at least one metric`);

    for (const metric of metrics) {
      assert.equal(typeof metric.label, 'string');
      assert.ok('value' in metric);
      assert.equal(typeof metric.tone, 'string');
    }
  }
});

test('every section metrics() function tolerates a missing dashboard payload', () => {
  for (const section of dashboardVerticalSections) {
    assert.doesNotThrow(() => section.metrics(undefined), `${section.title} metrics should tolerate undefined`);
  }
});

test('every section focusItems() function returns an array of renderable entries', () => {
  for (const section of dashboardVerticalSections) {
    const items = section.focusItems({});
    assert.ok(Array.isArray(items), `${section.title} focusItems should be an array`);
    assert.ok(items.length > 0, `${section.title} should define at least one focus item`);

    for (const item of items) {
      assert.equal(typeof item.title, 'string');
      assert.ok(typeof item.body === 'string' || Array.isArray(item.lines));
    }
  }
});

test('retail metrics reflect provided dashboard figures', () => {
  const section = getDashboardVerticalSection('retail');
  const metrics = section.metrics({
    retail: {
      cash_balance: 15000,
      debtors: 2000,
      open_shifts: 2,
      loyalty_customers: 40,
      petty_cash_today: 500,
      refunds_today: 300,
    },
  });

  assert.equal(metrics[0].value, '₦15,000');
  assert.equal(metrics[1].value, '₦2,000');
  assert.equal(metrics[2].value, 2);
});

test('school section uses a custom metricsClassName', () => {
  const section = getDashboardVerticalSection('school');
  assert.equal(section.metricsClassName, 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4');
});

test('focusItems fall back to generated copy when owner_focus is missing', () => {
  const section = getDashboardVerticalSection('logistics');
  const items = section.focusItems({});
  assert.match(items[0].body, /Trip profitability/);
  assert.deepEqual(items[1].lines, []);
});

test('focusItems use owner_focus data when present', () => {
  const section = getDashboardVerticalSection('logistics');
  const items = section.focusItems({
    owner_focus: {
      profit_driver: 'Custom driver text',
      daily_decisions: ['Decision A', 'Decision B', 'Decision C', 'Decision D', 'Decision E'],
    },
  });

  assert.equal(items[0].body, 'Custom driver text');
  assert.deepEqual(items[1].lines, ['Decision A', 'Decision B', 'Decision C', 'Decision D']);
});
