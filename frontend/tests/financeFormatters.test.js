import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatCurrencyNGN,
  formatShortDate,
  formatDateTimeLocal,
} from '../src/lib/financeFormatters.js';

test('formatCurrencyNGN formats whole naira amounts with no decimals', () => {
  assert.equal(formatCurrencyNGN(9000), '₦9,000');
  assert.equal(formatCurrencyNGN(1500000), '₦1,500,000');
});

test('formatCurrencyNGN defaults missing amounts to zero', () => {
  assert.equal(formatCurrencyNGN(undefined), '₦0');
  assert.equal(formatCurrencyNGN(null), '₦0');
  assert.equal(formatCurrencyNGN(0), '₦0');
});

test('formatCurrencyNGN coerces numeric strings', () => {
  assert.equal(formatCurrencyNGN('2500'), '₦2,500');
});

test('formatShortDate formats a date value as day month year', () => {
  assert.equal(formatShortDate('2026-05-25'), '25 May 2026');
});

test('formatShortDate returns the fallback when value is missing', () => {
  assert.equal(formatShortDate(null), 'Not set');
  assert.equal(formatShortDate(undefined), 'Not set');
  assert.equal(formatShortDate('', 'Custom fallback'), 'Custom fallback');
});

test('formatDateTimeLocal formats a date-time value', () => {
  const formatted = formatDateTimeLocal('2026-05-25T10:30:00');
  assert.match(formatted, /2026/);
  assert.match(formatted, /10:30|AM|PM/);
});

test('formatDateTimeLocal returns the fallback when value is missing', () => {
  assert.equal(formatDateTimeLocal(null), 'Not scheduled');
  assert.equal(formatDateTimeLocal(undefined, 'Custom fallback'), 'Custom fallback');
});
