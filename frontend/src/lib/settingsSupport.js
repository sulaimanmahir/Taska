export function buildSupportTicketEntry(ticket) {
  return {
    id: ticket.id,
    subject: ticket.subject,
    message: ticket.message,
    status: ticket.status,
    isOpen: ticket.status === 'open',
    createdAtLabel: ticket.created_at
      ? new Date(ticket.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
      : '',
  };
}

export function sortSupportTicketsNewestFirst(tickets = []) {
  return [...tickets].sort((a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0));
}

export function buildSupportTicketPayload({ subject, message }) {
  return {
    subject: subject.trim(),
    message: message.trim(),
  };
}

export function hasValidSupportTicketDraft({ subject, message }) {
  return subject.trim().length > 0 && message.trim().length > 0;
}
