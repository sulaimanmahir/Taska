import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSupportTicketEntry,
  buildSupportTicketPayload,
  hasValidSupportTicketDraft,
  sortSupportTicketsNewestFirst,
} from '../src/lib/settingsSupport.js';

test('buildSupportTicketEntry maps status to isOpen and formats the created date', () => {
  const openEntry = buildSupportTicketEntry({
    id: 1,
    subject: 'Cannot print receipts',
    message: 'The printer stopped responding.',
    status: 'open',
    created_at: '2026-08-20T10:00:00Z',
  });

  assert.equal(openEntry.isOpen, true);
  assert.match(openEntry.createdAtLabel, /2026/);

  const resolvedEntry = buildSupportTicketEntry({ id: 2, subject: 'x', message: 'y', status: 'resolved' });
  assert.equal(resolvedEntry.isOpen, false);
});

test('sortSupportTicketsNewestFirst orders by created_at descending without mutating the input', () => {
  const tickets = [
    { id: 1, created_at: '2026-01-01T00:00:00Z' },
    { id: 2, created_at: '2026-06-01T00:00:00Z' },
    { id: 3, created_at: '2026-03-01T00:00:00Z' },
  ];

  const sorted = sortSupportTicketsNewestFirst(tickets);

  assert.deepEqual(sorted.map((t) => t.id), [2, 3, 1]);
  assert.deepEqual(tickets.map((t) => t.id), [1, 2, 3]);
});

test('buildSupportTicketPayload trims subject and message', () => {
  const payload = buildSupportTicketPayload({ subject: '  Cannot print  ', message: '  Details here.  ' });
  assert.deepEqual(payload, { subject: 'Cannot print', message: 'Details here.' });
});

test('hasValidSupportTicketDraft requires a non-blank subject and message', () => {
  assert.equal(hasValidSupportTicketDraft({ subject: 'x', message: 'y' }), true);
  assert.equal(hasValidSupportTicketDraft({ subject: '  ', message: 'y' }), false);
  assert.equal(hasValidSupportTicketDraft({ subject: 'x', message: '  ' }), false);
  assert.equal(hasValidSupportTicketDraft({ subject: '', message: '' }), false);
});
