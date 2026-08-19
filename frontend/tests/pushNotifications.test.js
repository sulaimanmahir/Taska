import test from 'node:test';
import assert from 'node:assert/strict';

import { isPushSupported, urlBase64ToUint8Array } from '../src/lib/pushNotifications.js';

test('isPushSupported returns false outside a browser-like environment', () => {
  // Node's test runner has no window/navigator/Notification globals.
  assert.equal(isPushSupported(), false);
});

test('urlBase64ToUint8Array decodes a VAPID-style base64url key into bytes', () => {
  // 'AAECAw' (base64url, no padding) decodes to bytes [0, 1, 2, 3].
  const bytes = urlBase64ToUint8Array('AAECAw');

  assert.ok(bytes instanceof Uint8Array);
  assert.deepEqual([...bytes], [0, 1, 2, 3]);
});

test('urlBase64ToUint8Array handles keys needing padding and URL-safe characters', () => {
  // '-_' are the URL-safe substitutes for '+/' in standard base64.
  const bytes = urlBase64ToUint8Array('--_-');

  assert.ok(bytes instanceof Uint8Array);
  assert.equal(bytes.length, 3);
});
