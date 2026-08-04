import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';
import { queryClient } from '../lib/queryClient';
import { ACTIVE_BUSINESS_STORAGE_KEY } from '../lib/businessSession';
import { useOfflineStore } from './offlineStore';

function persistActiveBusiness(business) {
  if (business?.id) {
    localStorage.setItem(ACTIVE_BUSINESS_STORAGE_KEY, String(business.id));
    useOfflineStore.getState().setActiveBusiness(business.id);
    return;
  }

  localStorage.removeItem(ACTIVE_BUSINESS_STORAGE_KEY);
  useOfflineStore.getState().setActiveBusiness(null);
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      business: null,
      businesses: [],
      permissions: [],
      token: null,
      isLoading: false,
      isHydrating: false,
      subscription: null,
      needsBusinessSelection: false,
      needsBusinessOnboarding: false,

      setUser: (user) => set({ user }),
      setBusiness: (business) => set({ business }),
      setBusinesses: (businesses) => set({ businesses }),
      setPermissions: (permissions) => set({ permissions }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          localStorage.setItem('token', data.token);
          const role = data.user?.role || 'admin';
          const activeBusiness = data.requires_business_selection ? null : data.current_business;
          persistActiveBusiness(activeBusiness);
          set({
            user: { ...data.user, role: role },
            business: activeBusiness,
            businesses: data.businesses,
            permissions: data.permissions || [],
            token: data.token,
            isLoading: false,
            needsBusinessSelection: Boolean(data.requires_business_selection),
            needsBusinessOnboarding: Boolean(data.needs_business_onboarding),
          });
          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const payload = {
            name: userData.name,
            email: userData.email,
            password: userData.password,
            phone: userData.phone,
            role: userData.role,
            business_name: userData.business_name,
            business_email: userData.email,
            business_type: userData.business_type,
          };
          const { data } = await api.post('/auth/register', payload);
          localStorage.setItem('token', data.token);
          persistActiveBusiness(data.current_business ?? data.business ?? null);
          const role = data.user?.role || userData.role || 'admin';
          set({
            user: { ...data.user, role: role },
            business: data.current_business ?? data.business,
            businesses: data.businesses ?? [data.business],
            permissions: data.permissions ?? [],
            token: data.token,
            isLoading: false,
            needsBusinessSelection: false,
            needsBusinessOnboarding: false,
          });
          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.warn('Logout request failed; clearing local session anyway.', error);
        }
        localStorage.removeItem('token');
        persistActiveBusiness(null);
        queryClient.clear();
        set({
          user: null,
          business: null,
          businesses: [],
          permissions: [],
          token: null,
          subscription: null,
          needsBusinessSelection: false,
          needsBusinessOnboarding: false,
        });
      },

      switchBusiness: async (businessId) => {
        const { data } = await api.post('/auth/switch-business', { business_id: businessId });
        queryClient.clear();
        persistActiveBusiness(data.business);
        set({
          business: data.business,
          businesses: data.businesses ?? get().businesses,
          permissions: data.permissions,
          needsBusinessSelection: false,
          needsBusinessOnboarding: false,
          user: get().user ? { ...get().user, role: data.active_role ?? get().user.role } : get().user,
        });
        return data;
      },

      createBusiness: async (businessData) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/businesses', businessData);
          queryClient.clear();
          persistActiveBusiness(data.current_business ?? data.business ?? null);
          set({
            user: data.user,
            business: data.current_business ?? data.business,
            businesses: data.businesses ?? [],
            permissions: data.permissions ?? [],
            isLoading: false,
            needsBusinessSelection: false,
            needsBusinessOnboarding: false,
          });
          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      updateProfile: async (profileData) => {
        const { data } = await api.patch('/auth/profile', profileData);
        persistActiveBusiness(data.current_business ?? get().business);
        set({
          user: data.user ?? get().user,
          business: data.current_business ?? get().business,
          businesses: data.businesses ?? get().businesses,
          permissions: data.permissions ?? get().permissions,
          needsBusinessSelection: Boolean(data.requires_business_selection),
          needsBusinessOnboarding: Boolean(data.needs_business_onboarding),
        });
        return data;
      },

      updateCurrentBusiness: async (businessData) => {
        const { data } = await api.patch('/auth/current-business', businessData);
        persistActiveBusiness(data.current_business ?? get().business);
        set({
          business: data.current_business ?? get().business,
          businesses: data.businesses ?? get().businesses,
          permissions: data.permissions ?? get().permissions,
          needsBusinessSelection: Boolean(data.requires_business_selection),
          needsBusinessOnboarding: Boolean(data.needs_business_onboarding),
        });
        return data;
      },

      fetchProfile: async () => {
        try {
          set({ isHydrating: true });
          const { data } = await api.get('/auth/profile');
          let subscription = null;
          try {
            const subRes = await api.get('/billing/subscription');
            subscription = subRes.data.data;
          } catch (error) {
            console.warn('Subscription refresh failed during profile hydration.', error);
          }
          persistActiveBusiness(data.current_business ?? null);
          set({
            user: data.user,
            business: data.current_business,
            businesses: data.businesses,
            permissions: data.permissions,
            subscription,
            needsBusinessSelection: false,
            needsBusinessOnboarding: Boolean(data.needs_business_onboarding),
            isHydrating: false,
          });
        } catch (error) {
          console.warn('Profile hydration failed; logging out of the local session.', error);
          set({ isHydrating: false });
          void get().logout();
        }
      },
    }),
    {
      name: 'taska-auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
