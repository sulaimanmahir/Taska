import { useEffect, useState } from 'react';
import api from '../lib/api';
import Card, { CardHeader } from './Card';
import EmptyState from './EmptyState';
import { buildAuditLogEntry } from '../lib/accessAuditLog';

export default function SettingsAuditLogPanel({ content }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadEntries = async () => {
      setLoading(true);

      try {
        const response = await api.get('/access-audit-log');

        if (cancelled) {
          return;
        }

        setEntries((response.data ?? []).map(buildAuditLogEntry));
        setLoadError('');
      } catch {
        if (!cancelled) {
          setLoadError('We could not load the activity log right now. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadEntries();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-5">
      {content?.intro ? <p className="text-sm text-slate-600">{content.intro}</p> : null}

      {content?.calloutTitle ? (
        <Card className="border-slate-200 bg-slate-50/60">
          <p className="text-sm font-semibold text-slate-900">{content.calloutTitle}</p>
          <p className="mt-1 text-sm text-slate-600">{content.calloutCopy}</p>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Recent Access Changes" subtitle="Newest first, most recent 100 entries." />

        {loadError ? (
          <p className="text-sm text-rose-600">{loadError}</p>
        ) : loading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            title="No access changes yet"
            description="Team member and branch changes will appear here as they happen."
          />
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{entry.actionLabel}</p>
                    <p className="text-sm text-slate-500">{entry.subjectLabel} · by {entry.actorName}</p>
                  </div>
                  <p className="text-xs text-slate-400">{entry.timeLabel}</p>
                </div>
                {entry.changeSummary.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {entry.changeSummary.map((change) => (
                      <span key={change.field} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                        {change.label}: {change.fromLabel} → {change.toLabel}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
