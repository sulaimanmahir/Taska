import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildBusinessScopedKey, flattenPendingActions } from '../lib/offlineContext';

const defaultDeviceId = (() => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `taska-device-${Date.now()}`;
})();

function nowIso() {
  return new Date().toISOString();
}

function withUpdatedActionMap(actionMap, actionId, updater) {
  const nextEntries = Object.entries(actionMap).map(([businessId, actions]) => ([
    businessId,
    actions.map((action) => (action.id === actionId ? updater(action) : action)),
  ]));

  return Object.fromEntries(nextEntries);
}

function removeActionFromMap(actionMap, actionId) {
  return Object.fromEntries(
    Object.entries(actionMap).map(([businessId, actions]) => ([
      businessId,
      actions.filter((action) => action.id !== actionId),
    ]))
  );
}

export const useOfflineStore = create(
  persist(
    (set, get) => ({
      deviceId: defaultDeviceId,
      activeBusinessId: null,
      pendingActions: [],
      pendingActionsByBusiness: {},
      cachedData: {},
      conflicts: [],
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      connectivityState: typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline',
      lastSyncAt: null,
      syncFailedAt: null,

      setOnline: (status) => set({
        isOnline: status,
        connectivityState: status ? 'online' : 'offline',
      }),

      setConnectivityState: (state) => set({ connectivityState: state }),

      setActiveBusiness: (businessId) => set((state) => ({
        activeBusinessId: businessId,
        pendingActions: state.pendingActionsByBusiness[businessId ?? 'global'] ?? [],
      })),

      queueAction: (action) => {
        const { pendingActionsByBusiness, deviceId, activeBusinessId } = get();
        const businessId = action.businessId ?? activeBusinessId ?? action.payload?.business_id ?? 'global';
        const existingActions = pendingActionsByBusiness[businessId] ?? [];
        const queuedAction = {
          id: action.id ?? `${Date.now()}-${existingActions.length + 1}`,
          endpoint: action.endpoint,
          method: action.method ?? 'POST',
          resourceType: action.resourceType ?? 'general',
          business_id: businessId === 'global' ? null : businessId,
          payload: {
            ...(action.payload ?? {}),
            business_id: action.payload?.business_id ?? (businessId === 'global' ? undefined : businessId),
            created_offline: true,
            device_id: deviceId,
            local_timestamp: nowIso(),
          },
          created_offline: true,
          device_id: deviceId,
          local_timestamp: nowIso(),
          synced_at: null,
          sync_status: 'queued',
        };

        set({
          pendingActionsByBusiness: {
            ...pendingActionsByBusiness,
            [businessId]: [...existingActions, queuedAction],
          },
          pendingActions: businessId === (activeBusinessId ?? 'global')
            ? [...existingActions, queuedAction]
            : get().pendingActions,
          connectivityState: 'offline',
        });
      },

      markActionProcessing: (actionId) => set((state) => {
        const pendingActionsByBusiness = withUpdatedActionMap(state.pendingActionsByBusiness, actionId, (action) => ({
          ...action,
          sync_status: 'syncing',
        }));

        return {
          connectivityState: 'syncing',
          pendingActionsByBusiness,
          pendingActions: pendingActionsByBusiness[state.activeBusinessId ?? 'global'] ?? [],
        };
      }),

      markActionFailed: (actionId, error) => set((state) => {
        const pendingActionsByBusiness = withUpdatedActionMap(state.pendingActionsByBusiness, actionId, (action) => ({
          ...action,
          sync_status: 'failed',
          error: error?.message ?? 'Sync failed',
        }));

        return {
          connectivityState: 'sync_failed',
          syncFailedAt: nowIso(),
          pendingActionsByBusiness,
          pendingActions: pendingActionsByBusiness[state.activeBusinessId ?? 'global'] ?? [],
        };
      }),

      resolveConflict: (conflict) => set((state) => ({
        conflicts: [...state.conflicts, conflict],
        connectivityState: 'review_required',
      })),

      dismissConflict: (actionId) => set((state) => ({
        conflicts: state.conflicts.filter((conflict) => conflict.actionId !== actionId),
      })),

      removeAction: (actionId) => set((state) => {
        const pendingActionsByBusiness = removeActionFromMap(state.pendingActionsByBusiness, actionId);

        return {
          pendingActionsByBusiness,
          pendingActions: pendingActionsByBusiness[state.activeBusinessId ?? 'global'] ?? [],
        };
      }),

      clearActions: (businessId = null) => set((state) => {
        const scopedBusinessId = businessId ?? state.activeBusinessId ?? 'global';
        const pendingActionsByBusiness = {
          ...state.pendingActionsByBusiness,
          [scopedBusinessId]: [],
        };

        return {
          pendingActionsByBusiness,
          pendingActions: pendingActionsByBusiness[state.activeBusinessId ?? 'global'] ?? [],
        };
      }),

      registerSyncResult: ({ synced = 0, failed = 0, conflicts = 0 } = {}) => set((state) => ({
        lastSyncAt: synced > 0 ? nowIso() : state.lastSyncAt,
        syncFailedAt: failed > 0 ? nowIso() : state.syncFailedAt,
        connectivityState: failed > 0
          ? 'sync_failed'
          : (conflicts > 0 ? 'review_required' : (state.isOnline ? 'online' : 'offline')),
      })),

      cacheData: (key, data) => {
        const { cachedData, activeBusinessId } = get();
        const scopedKey = buildBusinessScopedKey(activeBusinessId, key);

        set({
          cachedData: {
            ...cachedData,
            [scopedKey]: {
              data,
              timestamp: Date.now(),
            },
          },
        });
      },

      getCachedData: (key, maxAge = 5 * 60 * 1000) => {
        const { cachedData, activeBusinessId } = get();
        const cached = cachedData[buildBusinessScopedKey(activeBusinessId, key)];

        if (!cached) return null;
        if (Date.now() - cached.timestamp > maxAge) return null;

        return cached.data;
      },
    }),
    {
      name: 'taska-offline',
      partialize: (state) => ({
        deviceId: state.deviceId,
        activeBusinessId: state.activeBusinessId,
        pendingActions: state.pendingActions,
        pendingActionsByBusiness: state.pendingActionsByBusiness,
        cachedData: state.cachedData,
        conflicts: state.conflicts,
        lastSyncAt: state.lastSyncAt,
        syncFailedAt: state.syncFailedAt,
      }),
    }
  )
);

function toReplayPayload(action, extra = {}) {
  return {
    id: action.id,
    endpoint: action.endpoint,
    method: action.method,
    resource_type: action.resourceType,
    payload: action.payload,
    base_updated_at: action.baseUpdatedAt ?? null,
    ...extra,
  };
}

export async function syncPendingActions(api) {
  const {
    pendingActionsByBusiness,
    markActionProcessing,
    markActionFailed,
    removeAction,
    resolveConflict,
    registerSyncResult,
  } = useOfflineStore.getState();

  const pendingActions = flattenPendingActions(pendingActionsByBusiness);

  if (pendingActions.length === 0) {
    return { synced: 0, failed: 0, conflicts: 0 };
  }

  pendingActions.forEach((action) => markActionProcessing(action.id));

  let synced = 0;
  let failed = 0;
  let conflicts = 0;

  try {
    const { data } = await api.post('/offline/replay', {
      actions: pendingActions.map((action) => toReplayPayload(action)),
    });

    for (const result of data?.results ?? []) {
      const action = pendingActions.find((item) => item.id === result.id);

      if (result.status === 'synced') {
        removeAction(result.id);
        synced += 1;
      } else if (result.status === 'conflict') {
        conflicts += 1;
        resolveConflict({
          actionId: result.id,
          resourceType: action?.resourceType,
          endpoint: action?.endpoint,
          method: action?.method,
          payload: action?.payload,
          current: result.current,
          strategy: result.strategy,
        });
      } else {
        failed += 1;
        markActionFailed(result.id, { message: result.message ?? 'Sync failed' });
      }
    }
  } catch (error) {
    pendingActions.forEach((action) => markActionFailed(action.id, error));
    failed = pendingActions.length;
  }

  registerSyncResult({ synced, failed, conflicts });

  return { synced, failed, conflicts };
}

export async function forceSyncConflict(api, actionId) {
  const {
    pendingActionsByBusiness,
    markActionProcessing,
    markActionFailed,
    removeAction,
    dismissConflict,
  } = useOfflineStore.getState();

  const action = flattenPendingActions(pendingActionsByBusiness).find((item) => item.id === actionId);
  if (!action) return { status: 'missing' };

  markActionProcessing(actionId);

  try {
    const { data } = await api.post('/offline/replay', {
      actions: [toReplayPayload(action, { force: true })],
    });

    const result = data?.results?.[0];

    if (result?.status === 'synced') {
      removeAction(actionId);
      dismissConflict(actionId);
      useOfflineStore.getState().registerSyncResult({
        synced: 1,
        conflicts: useOfflineStore.getState().conflicts.length,
      });
      return result;
    }

    markActionFailed(actionId, { message: result?.message ?? 'Force sync failed' });
    return result ?? { status: 'failed' };
  } catch (error) {
    markActionFailed(actionId, error);
    return { status: 'failed' };
  }
}

export function discardConflict(actionId) {
  const { removeAction, dismissConflict, registerSyncResult, conflicts } = useOfflineStore.getState();
  removeAction(actionId);
  dismissConflict(actionId);
  registerSyncResult({ conflicts: conflicts.filter((conflict) => conflict.actionId !== actionId).length });
}
