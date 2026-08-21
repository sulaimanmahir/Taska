import { useEffect, useState } from 'react';
import api from '../lib/api';
import Button from './Button';
import Card, { CardHeader } from './Card';
import EmptyState from './EmptyState';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';
import { getSettingsSubmitError } from '../lib/settingsForms';
import {
  buildSupportTicketEntry,
  buildSupportTicketPayload,
  hasValidSupportTicketDraft,
  sortSupportTicketsNewestFirst,
} from '../lib/settingsSupport';

const EMPTY_DRAFT = { subject: '', message: '' };

export default function SettingsSupportPanel({ content }) {
  const [tickets, setTickets] = useState([]);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast, setToast, clearToast } = useToast();

  const loadTickets = async () => {
    setLoading(true);

    try {
      const { data } = await api.get('/support-tickets');
      setTickets(sortSupportTicketsNewestFirst(data?.data ?? []).map(buildSupportTicketEntry));
      setLoadError('');
    } catch (error) {
      setTickets([]);
      setLoadError(getSettingsSubmitError(error, 'We could not load your support tickets right now.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadOnMount = async () => {
      await loadTickets();
    };

    void loadOnMount();
  }, []);

  const handleDraftChange = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearToast();
    setSubmitting(true);

    try {
      await api.post('/support-tickets', buildSupportTicketPayload(draft));
      setDraft(EMPTY_DRAFT);
      setToast({ tone: 'success', message: 'Ticket sent. The Taska team will review it shortly.' });
      await loadTickets();
    } catch (error) {
      setToast({ tone: 'error', message: getSettingsSubmitError(error, 'We could not send that ticket right now.') });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Support ticket feedback" />

      {content?.intro ? <p className="text-sm text-slate-600">{content.intro}</p> : null}

      {content?.calloutTitle ? (
        <Card className="border-slate-200 bg-slate-50/60">
          <p className="text-sm font-semibold text-slate-900">{content.calloutTitle}</p>
          <p className="mt-1 text-sm text-slate-600">{content.calloutCopy}</p>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Contact Support" subtitle="Describe what's happening - the more detail, the faster it can be resolved." />
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Subject</span>
            <input
              className="input"
              type="text"
              maxLength={255}
              placeholder="e.g. Cannot print receipts"
              value={draft.subject}
              onChange={(event) => handleDraftChange('subject', event.target.value)}
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700">
            <span>Message</span>
            <textarea
              className="input min-h-[7rem]"
              maxLength={5000}
              placeholder="What happened, and what were you trying to do?"
              value={draft.message}
              onChange={(event) => handleDraftChange('message', event.target.value)}
            />
          </label>

          <div className="flex justify-end border-t border-slate-200 pt-4">
            <Button type="submit" disabled={submitting || !hasValidSupportTicketDraft(draft)}>
              {submitting ? 'Sending...' : 'Send ticket'}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title="Your Tickets" subtitle="Newest first." />

        {loadError ? (
          <p className="text-sm text-rose-600">{loadError}</p>
        ) : loading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, index) => (
              <div key={index} className="h-16 skeleton rounded-2xl" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            icon="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            title="No tickets yet"
            description="Anything you send the Taska team will show up here."
          />
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{ticket.subject}</p>
                    <p className="mt-1 text-sm text-slate-500">{ticket.message}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                      ticket.isOpen ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {ticket.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">{ticket.createdAtLabel}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
