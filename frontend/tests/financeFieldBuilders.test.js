import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTextField,
  buildNumberField,
  buildDateField,
  buildTextareaField,
  buildSelectField,
} from '../src/lib/financeFieldBuilders.js';

test('buildTextField assembles a text field descriptor with defaults', () => {
  const onChange = () => {};
  const field = buildTextField({
    key: 'name',
    fieldProps: { name: 'name' },
    label: 'Name',
    hint: 'Full name',
    value: 'Ada',
    onChange,
    placeholder: 'Enter name',
  });

  assert.deepEqual(field, {
    key: 'name',
    fieldProps: { name: 'name' },
    label: 'Name',
    hint: 'Full name',
    type: 'text',
    value: 'Ada',
    onChange,
    placeholder: 'Enter name',
    required: false,
    className: undefined,
  });
});

test('buildTextField respects an explicit required flag', () => {
  const field = buildTextField({ key: 'k', value: '', onChange: () => {}, required: true });
  assert.equal(field.required, true);
});

test('buildNumberField assembles a number field descriptor with min/max/step', () => {
  const field = buildNumberField({
    key: 'amount',
    label: 'Amount',
    value: 100,
    onChange: () => {},
    min: 0,
    max: 1000,
    step: 10,
  });

  assert.equal(field.type, 'number');
  assert.equal(field.min, 0);
  assert.equal(field.max, 1000);
  assert.equal(field.step, 10);
  assert.equal(field.required, false);
});

test('buildDateField assembles a date field descriptor', () => {
  const field = buildDateField({
    key: 'date',
    label: 'Date',
    value: '2026-05-25',
    onChange: () => {},
    required: true,
  });

  assert.equal(field.type, 'date');
  assert.equal(field.value, '2026-05-25');
  assert.equal(field.required, true);
});

test('buildTextareaField defaults rows to 2', () => {
  const field = buildTextareaField({
    key: 'notes',
    label: 'Notes',
    value: '',
    onChange: () => {},
  });

  assert.equal(field.element, 'textarea');
  assert.equal(field.rows, 2);
});

test('buildTextareaField accepts a custom rows value', () => {
  const field = buildTextareaField({
    key: 'notes',
    value: '',
    onChange: () => {},
    rows: 5,
  });

  assert.equal(field.rows, 5);
});

test('buildSelectField assembles a select field descriptor with defaults', () => {
  const options = [{ label: 'One', value: '1' }];
  const field = buildSelectField({
    key: 'choice',
    label: 'Choice',
    value: '1',
    onChange: () => {},
    options,
  });

  assert.equal(field.element, 'select');
  assert.equal(field.options, options);
  assert.equal(field.required, false);
  assert.equal(field.disabled, false);
});

test('buildSelectField respects explicit required and disabled flags', () => {
  const field = buildSelectField({
    key: 'choice',
    value: '',
    onChange: () => {},
    options: [],
    required: true,
    disabled: true,
  });

  assert.equal(field.required, true);
  assert.equal(field.disabled, true);
});
