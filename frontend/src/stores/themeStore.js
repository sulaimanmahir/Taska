import { create } from 'zustand';

// Plain string in a dedicated key (not Zustand's `persist` JSON envelope) so
// the inline boot script in index.html - which must run before React or
// this store exists, to avoid a wrong-theme flash - can read it directly.
export const THEME_STORAGE_KEY = 'taska-theme';

function systemPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

function resolveTheme(preference) {
  return preference === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : preference;
}

function applyTheme(resolvedTheme) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }
}

function readStoredPreference() {
  if (typeof localStorage === 'undefined') return 'system';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

const initialPreference = readStoredPreference();

export const useThemeStore = create((set) => ({
  preference: initialPreference,
  resolvedTheme: resolveTheme(initialPreference),

  setPreference: (preference) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    }
    const resolvedTheme = resolveTheme(preference);
    applyTheme(resolvedTheme);
    set({ preference, resolvedTheme });
  },
}));

if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { preference } = useThemeStore.getState();
    if (preference !== 'system') return;

    const resolvedTheme = resolveTheme(preference);
    applyTheme(resolvedTheme);
    useThemeStore.setState({ resolvedTheme });
  });
}
