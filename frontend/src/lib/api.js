import axios from 'axios';
import { useOfflineStore } from '../stores/offlineStore';
import { ACTIVE_BUSINESS_STORAGE_KEY } from './businessSession';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  'Accept': 'application/json',
  },
});

const processOfflineQueue = async () => {
  await import('../stores/offlineStore').then(({ syncPendingActions }) => syncPendingActions(api));
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const activeBusinessId = localStorage.getItem(ACTIVE_BUSINESS_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (activeBusinessId) {
    config.headers['X-Business-Id'] = activeBusinessId;
  }

  if (!navigator.onLine && config.method !== 'get') {
    useOfflineStore.getState().queueAction({
      endpoint: config.url,
      method: config.method?.toUpperCase(),
      resourceType: 'general',
      businessId: activeBusinessId ? Number(activeBusinessId) : null,
      payload: config.data,
    });
    return Promise.reject(new axios.Cancel('Offline - request queued'));
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem(ACTIVE_BUSINESS_STORAGE_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

window.addEventListener('online', () => {
  processOfflineQueue();
  window.dispatchEvent(new CustomEvent('taska:sync-complete'));
});

export { processOfflineQueue };
export default api;
