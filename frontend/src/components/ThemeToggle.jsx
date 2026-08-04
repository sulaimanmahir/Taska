import { useThemeStore } from '../stores/themeStore';

export default function ThemeToggle({
  className = '',
  getToggleLabel,
  compact = false,
}) {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const toggleLabel = getToggleLabel ? getToggleLabel({ theme, nextTheme }) : `Switch to ${nextTheme} theme`;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle ${compact ? 'theme-toggle-compact' : ''} ${className}`}
      aria-pressed={theme === 'dark'}
      aria-label={toggleLabel}
      title={toggleLabel}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className={`theme-toggle-thumb ${theme === 'dark' ? 'is-dark' : ''}`}>
          {theme === 'dark' ? (
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646a9 9 0 1011.708 11.708z" />
            </svg>
          ) : (
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v2.25M12 18.75V21M4.72 4.72l1.59 1.59M17.69 17.69l1.59 1.59M3 12h2.25M18.75 12H21M4.72 19.28l1.59-1.59M17.69 6.31l1.59-1.59M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          )}
        </span>
      </span>
      <span className="theme-toggle-label">{theme === 'dark' ? 'Dark' : 'Light'}</span>
    </button>
  );
}
