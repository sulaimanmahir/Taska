import { useCallback, useEffect, useId, useState } from 'react';
import { useOfflineStore, syncPendingActions, forceSyncConflict, discardConflict } from '../stores/offlineStore';
import api from '../lib/api';
import { flattenPendingActions } from '../lib/offlineContext';

function formatRelativeTime(timestamp) {
  if (!timestamp) return 'never';

  const elapsedMinutes = Math.max(0, Math.round((Date.now() - new Date(timestamp).getTime()) / 60000));

  if (elapsedMinutes < 1) return 'just now';
  if (elapsedMinutes === 1) return '1 min ago';

  return `${elapsedMinutes} mins ago`;
}

const STRATEGY_LABEL = {
  review_queue: 'Needs review before it can sync (inventory/stock change)',
  manual_review: 'Needs manual review before it can sync (finance change)',
  last_write_wins: 'The record changed on the server since you edited it offline',
};

function ConflictRow({ conflict, onForce, onDiscard, busy }) {
  const label = STRATEGY_LABEL[conflict.strategy] ?? 'This change conflicts with a newer server change';

  return (
    <li className="rounded-[var(--field-radius)] border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-slate-200">
      <p className="font-semibold text-white">{conflict.resourceType ?? 'Record'} update conflict</p>
      <p className="mt-0.5 text-slate-300">{label}</p>
      {conflict.current?.name ? (
        <p className="mt-1 text-slate-400">Server currently has: <span className="text-slate-200">{conflict.current.name}</span></p>
      ) : null}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => onDiscard(conflict.actionId)}
          className="rounded-[var(--field-radius)] border border-white/12 bg-white/6 px-2.5 py-1 font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10 disabled:opacity-50"
        >
          Discard my change
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onForce(conflict.actionId)}
          className="rounded-[var(--field-radius)] border border-amber-300/30 bg-amber-400/10 px-2.5 py-1 font-medium text-amber-200 transition hover:border-amber-300/50 hover:bg-amber-400/20 disabled:opacity-50"
        >
          Keep my change anyway
        </button>
      </div>
    </li>
  );
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
  const [resolvingActionId, setResolvingActionId] = useState(null);
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

  const handleForceConflict = useCallback(async (actionId) => {
    setResolvingActionId(actionId);

    try {
      await forceSyncConflict(api, actionId);
    } finally {
      setResolvingActionId(null);
    }
  }, []);

  const handleDiscardConflict = useCallback((actionId) => {
    discardConflict(actionId);
  }, []);

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

        {conflicts.length > 0 ? (
          <ul className="space-y-2 border-t border-white/10 px-[var(--card-padding)] py-3">
            {conflicts.map((conflict) => (
              <ConflictRow
                key={conflict.actionId}
                conflict={conflict}
                busy={resolvingActionId === conflict.actionId}
                onForce={handleForceConflict}
                onDiscard={handleDiscardConflict}
              />
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
