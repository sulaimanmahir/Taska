import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildBusinessSettingsDefaults,
  buildProfileSettingsDefaults,
  businessSettingsSchema,
  getSettingsSubmitError,
  profileSettingsSchema,
} from '../src/lib/settingsForms.js';

test('settings form defaults safely coerce missing values to empty strings', () => {
  assert.deepEqual(buildProfileSettingsDefaults(), {
    name: '',
    email: '',
    phone: '',
  });

  assert.deepEqual(buildBusinessSettingsDefaults(), {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
  });
});

test('settings form schemas accept trimmed valid values', () => {
  assert.deepEqual(profileSettingsSchema.parse({
    name: '  Amina Bello  ',
    email: '  amina@example.com ',
    phone: ' 08030001111 ',
  }), {
    name: 'Amina Bello',
    email: 'amina@example.com',
    phone: '08030001111',
  });

  assert.deepEqual(businessSettingsSchema.parse({
    name: ' Taska Mart ',
    email: ' hello@taskamart.test ',
    phone: ' 08032221111 ',
    address: ' 12 Market Road ',
    city: ' Kano ',
    state: ' Kano ',
    country: ' Nigeria ',
  }), {
    name: 'Taska Mart',
    email: 'hello@taskamart.test',
    phone: '08032221111',
    address: '12 Market Road',
    city: 'Kano',
    state: 'Kano',
    country: 'Nigeria',
  });
});

test('settings submit error prefers validation detail before falling back', () => {
  assert.equal(
    getSettingsSubmitError(
      {
        response: {
          data: {
            errors: {
              email: ['That email address is already in use.'],
            },
          },
        },
      },
      'Fallback message'
    ),
    'That email address is already in use.'
  );

  assert.equal(
    getSettingsSubmitError(
      {
        response: {
          data: {
            message: 'Server says no.',
          },
        },
      },
      'Fallback message'
    ),
    'Server says no.'
  );

  assert.equal(getSettingsSubmitError({}, 'Fallback message'), 'Fallback message');
});
