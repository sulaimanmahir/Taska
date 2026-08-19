import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../src/lib/api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '../src/lib/api.js';
import {
  useOfflineStore,
  syncPendingActions,
  forceSyncConflict,
  discardConflict,
} from '../src/stores/offlineStore.js';

function resetStore() {
  useOfflineStore.setState({
    activeBusinessId: 1,
    pendingActions: [],
    pendingActionsByBusiness: {},
    conflicts: [],
    connectivityState: 'offline',
    lastSyncAt: null,
    syncFailedAt: null,
  });
}

beforeEach(() => {
  resetStore();
  api.post.mockReset();
});

afterEach(() => {
  resetStore();
});

describe('offline replay batching', () => {
  test('synced results clear the queue and set connectivity to online', async () => {
    useOfflineStore.getState().queueAction({
      id: 'a1',
      endpoint: '/customers',
      method: 'POST',
      resourceType: 'general',
      payload: { name: 'New Customer' },
      businessId: 1,
    });

    api.post.mockResolvedValueOnce({
      data: { results: [{ id: 'a1', status: 'synced', response: { id: 5 } }] },
    });

    const summary = await syncPendingActions(api);

    expect(summary).toEqual({ synced: 1, failed: 0, conflicts: 0 });
    expect(useOfflineStore.getState().pendingActionsByBusiness[1]).toEqual([]);
    expect(useOfflineStore.getState().connectivityState).toBe('online');
  });

  test('a conflict result populates the conflicts list instead of clearing the action', async () => {
    useOfflineStore.getState().queueAction({
      id: 'a2',
      endpoint: '/customers/9',
      method: 'PATCH',
      resourceType: 'inventory',
      payload: { name: 'Offline Edit' },
      businessId: 1,
    });

    api.post.mockResolvedValueOnce({
      data: {
        results: [{
          id: 'a2',
          status: 'conflict',
          strategy: 'review_queue',
          current: { name: 'Server Name' },
        }],
      },
    });

    const summary = await syncPendingActions(api);

    expect(summary).toEqual({ synced: 0, failed: 0, conflicts: 1 });
    expect(useOfflineStore.getState().pendingActionsByBusiness[1]).toHaveLength(1);
    expect(useOfflineStore.getState().conflicts).toEqual([
      expect.objectContaining({ actionId: 'a2', strategy: 'review_queue' }),
    ]);
    expect(useOfflineStore.getState().connectivityState).toBe('review_required');
  });

  test('forceSyncConflict resolves a conflict by re-replaying with force:true', async () => {
    useOfflineStore.getState().queueAction({
      id: 'a3',
      endpoint: '/customers/9',
      method: 'PATCH',
      resourceType: 'inventory',
      payload: { name: 'Offline Edit' },
      businessId: 1,
    });
    useOfflineStore.getState().resolveConflict({ actionId: 'a3', strategy: 'review_queue' });

    api.post.mockResolvedValueOnce({
      data: { results: [{ id: 'a3', status: 'synced', response: { name: 'Offline Edit' } }] },
    });

    await forceSyncConflict(api, 'a3');

    const [[, requestBody]] = api.post.mock.calls;
    expect(requestBody.actions[0].force).toBe(true);
    expect(useOfflineStore.getState().pendingActionsByBusiness[1]).toEqual([]);
    expect(useOfflineStore.getState().conflicts).toEqual([]);
  });

  test('discardConflict removes both the queued action and the conflict entry', () => {
    useOfflineStore.getState().queueAction({
      id: 'a4',
      endpoint: '/customers/9',
      method: 'PATCH',
      resourceType: 'inventory',
      payload: { name: 'Offline Edit' },
      businessId: 1,
    });
    useOfflineStore.getState().resolveConflict({ actionId: 'a4', strategy: 'review_queue' });

    discardConflict('a4');

    expect(useOfflineStore.getState().pendingActionsByBusiness[1]).toEqual([]);
    expect(useOfflineStore.getState().conflicts).toEqual([]);
  });
});
