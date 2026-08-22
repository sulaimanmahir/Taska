import Card from './Card';
import { useThemeStore } from '../stores/themeStore';

const OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export default function ThemeToggle() {
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);

  return (
    <Card className="border-slate-200 bg-slate-50/60">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Appearance</p>
          <p className="mt-1 text-sm text-slate-600">
            Choose how Taska looks on this device. System follows your operating system's setting.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1" role="radiogroup" aria-label="Appearance">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={preference === option.value}
              onClick={() => setPreference(option.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                preference === option.value
                  ? 'bg-[var(--color-brand)] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
