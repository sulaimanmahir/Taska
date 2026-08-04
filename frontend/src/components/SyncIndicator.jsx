import { useCallback, useEffect, useId, useState } from 'react';
import { useOfflineStore, syncPendingActions } from '../stores/offlineStore';
import api from '../lib/api';
import { flattenPendingActions } from '../lib/offlineContext';

function formatRelativeTime(timestamp) {
  if (!timestamp) return 'never';

  const elapsedMinutes = Math.max(0, Math.round((Date.now() - new Date(timestamp).getTime()) / 60000));

  if (elapsedMinutes < 1) return 'just now';
  if (elapsedMinutes === 1) return '1 min ago';

  return `${elapsedMinutes} mins ago`;
}

export default function SyncIndicator({
  syncButtonLabel = 'Sync',
  syncingButtonLabel = 'Syncing...',
}) {
  const {
    pendingActionsByBusiness,
    conflicts,
    isOnline,
    connectivityState,
    lastSyncAt,
    syncFailedAt,
    setOnline,
    setConnectivityState,
  } = useOfflineStore();
  const statusTitleId = useId();
  const statusDetailId = useId();
  const [syncing, setSyncing] = useState(false);
  const totalPendingActions = flattenPendingActions(pendingActionsByBusiness).length;

  const syncNow = useCallback(async () => {
    if (syncing || !navigator.onLine) return;

    setSyncing(true);
    setConnectivityState('syncing');

    try {
      await syncPendingActions(api);
    } finally {
      setSyncing(false);
    }
  }, [setConnectivityState, syncing]);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);

      if (totalPendingActions > 0) {
        void syncNow();
      }
    };

    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline, syncNow, totalPendingActions]);

  if (totalPendingActions === 0 && conflicts.length === 0 && isOnline && connectivityState === 'online') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <section
        aria-labelledby={statusTitleId}
        aria-describedby={statusDetailId}
        className="rounded-[var(--card-radius)] border border-slate-800/80 bg-slate-900/95 text-white shadow-[var(--shadow-md)] backdrop-blur-sm ring-1 ring-white/10"
      >
        <div className="flex items-start gap-3 px-[var(--card-padding)] py-3.5">
          <div className={`mt-1 h-2.5 w-2.5 rounded-full ${
            connectivityState === 'offline'
              ? 'bg-amber-200'
              : connectivityState === 'sync_failed'
                ? 'bg-rose-200'
                : connectivityState === 'review_required'
                  ? 'bg-orange-200'
                  : connectivityState === 'syncing'
                    ? 'bg-sky-200'
                    : 'bg-emerald-200'
          }`} />

          <div className="flex-1 space-y-1">
            <p id={statusTitleId} className="text-sm font-semibold">
              {connectivityState === 'offline' && 'Offline Mode'}
              {connectivityState === 'syncing' && 'Syncing queued changes'}
              {connectivityState === 'sync_failed' && 'Sync failed'}
              {connectivityState === 'review_required' && 'Conflict review needed'}
              {connectivityState === 'online' && 'Synced'}
            </p>

            <p id={statusDetailId} className="text-xs text-slate-300">
              {connectivityState === 'offline' && `Last sync ${formatRelativeTime(lastSyncAt)}`}
              {connectivityState === 'syncing' && `${totalPendingActions} queued action(s) in progress`}
              {connectivityState === 'sync_failed' && `Last failed attempt ${formatRelativeTime(syncFailedAt)}`}
              {connectivityState === 'review_required' && `${conflicts.length} conflict(s) waiting for review`}
              {connectivityState === 'online' && `Last sync ${formatRelativeTime(lastSyncAt)}`}
            </p>
          </div>

          {(totalPendingActions > 0 || connectivityState === 'sync_failed') && isOnline ? (
            <button
              type="button"
              onClick={syncNow}
              aria-describedby={statusDetailId}
              className="rounded-[var(--field-radius)] border border-white/12 bg-white/6 px-3 py-1.5 text-xs font-medium shadow-[var(--shadow-sm)] transition hover:border-white/20 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200/50"
            >
              {syncing ? syncingButtonLabel : syncButtonLabel}
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
