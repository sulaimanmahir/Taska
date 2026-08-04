import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const THEME_STORAGE_KEY = 'taska-theme';

function applyTheme(theme) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
}

export function initializeTheme() {
  if (typeof window === 'undefined') {
    return;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  const theme = storedTheme === 'dark' ? 'dark' : 'light';
  applyTheme(theme);
}

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () =>
        set((state) => {
          const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
          applyTheme(nextTheme);
          return { theme: nextTheme };
        }),
    }),
    {
      name: THEME_STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        applyTheme(state?.theme === 'dark' ? 'dark' : 'light');
      },
    }
  )
);

