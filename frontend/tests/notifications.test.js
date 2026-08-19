import test from 'node:test';
import assert from 'node:assert/strict';

import { buildNotificationPreviewItems, severityTone } from '../src/lib/notifications.js';

test('severityTone maps known severities and falls back safely', () => {
  assert.equal(severityTone('critical'), 'rose');
  assert.equal(severityTone('warning'), 'amber');
  assert.equal(severityTone('info'), 'sky');
  assert.equal(severityTone('unknown'), 'slate');
});

test('buildNotificationPreviewItems maps insight fields and limits the list', () => {
  const insights = Array.from({ length: 10 }, (_, index) => ({
    id: index + 1,
    title: `Insight ${index + 1}`,
    description: 'Something happened',
    severity: 'warning',
    created_at: new Date().toISOString(),
  }));

  const items = buildNotificationPreviewItems(insights, 6);

  assert.equal(items.length, 6);
  assert.equal(items[0].title, 'Insight 1');
  assert.equal(items[0].tone, 'amber');
  assert.equal(items[0].timeLabel, 'just now');
});

test('buildNotificationPreviewItems tolerates an empty list', () => {
  assert.deepEqual(buildNotificationPreviewItems(), []);
});

test('buildNotificationPreviewItems formats older timestamps into relative labels', () => {
  const hourAgo = new Date(Date.now() - 65 * 60000).toISOString();
  const dayAgo = new Date(Date.now() - 26 * 60 * 60000).toISOString();

  const items = buildNotificationPreviewItems([
    { id: 1, title: 'A', description: 'x', severity: 'critical', created_at: hourAgo },
    { id: 2, title: 'B', description: 'y', severity: 'info', created_at: dayAgo },
  ]);

  assert.equal(items[0].timeLabel, '1h ago');
  assert.equal(items[1].timeLabel, '1d ago');
});
