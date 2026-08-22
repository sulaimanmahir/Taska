import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useThemeStore, THEME_STORAGE_KEY } from '../src/stores/themeStore.js';

function resetStore() {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  useThemeStore.setState({ preference: 'system', resolvedTheme: 'light' });
}

beforeEach(() => {
  resetStore();
});

afterEach(() => {
  resetStore();
});

describe('themeStore', () => {
  test('setPreference("dark") persists to localStorage and sets data-theme on <html>', () => {
    useThemeStore.getState().setPreference('dark');

    expect(useThemeStore.getState().preference).toBe('dark');
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  test('setPreference("light") persists and sets data-theme accordingly', () => {
    useThemeStore.getState().setPreference('light');

    expect(useThemeStore.getState().resolvedTheme).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  test('setPreference("system") resolves against the OS media query instead of a fixed value', () => {
    const matchMediaMock = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn() });
    vi.stubGlobal('matchMedia', matchMediaMock);

    useThemeStore.getState().setPreference('system');

    expect(useThemeStore.getState().preference).toBe('system');
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    vi.unstubAllGlobals();
  });
});
