import { useEffect, useState } from 'react';
import api from '../lib/api';
import Button from './Button';
import Card, { CardHeader } from './Card';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';
import { getSettingsSubmitError } from '../lib/settingsForms';
import { buildSettingsModuleRows } from '../lib/settingsModules';

export default function SettingsModulesPanel({ content }) {
  const [available, setAvailable] = useState([]);
  const [savedEnabled, setSavedEnabled] = useState([]);
  const [enabled, setEnabled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast, setToast, clearToast } = useToast();

  useEffect(() => {
    let isActive = true;

    const loadModules = async () => {
      setLoading(true);
      setLoadError('');

      try {
        const { data } = await api.get('/auth/business/modules');

        if (!isActive) {
          return;
        }

        setAvailable(data.available ?? []);
        setSavedEnabled(data.enabled ?? []);
        setEnabled(data.enabled ?? []);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setLoadError(getSettingsSubmitError(error, 'We could not load module controls right now.'));
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadModules();

    return () => {
      isActive = false;
    };
  }, []);

  const rows = buildSettingsModuleRows(available, enabled);
  const hasChanges = savedEnabled.length !== enabled.length
    || savedEnabled.some((slug) => !enabled.includes(slug));

  const toggleModule = (slug) => {
    if (slug === 'dashboard') {
      return;
    }

    setEnabled((current) => (
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug]
    ));
  };

  const handleSave = async () => {
    clearToast();
    setSaving(true);

    try {
      const { data } = await api.patch('/auth/business/modules', { modules: enabled });
      const nextEnabled = data.business?.modules ?? enabled;
      setEnabled(nextEnabled);
      setSavedEnabled(nextEnabled);
      setToast({
        tone: 'success',
        message: data.message || 'Modules updated successfully.',
      });
    } catch (error) {
      setToast({
        tone: 'error',
        message: getSettingsSubmitError(error, 'We could not update modules right now.'),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[18rem] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast tone={toast?.tone} message={toast?.message} groupAriaLabel="Module settings feedback" />

      {loadError ? (
        <Card className="border-rose-200 bg-rose-50/70">
          <CardHeader
            title="Module controls are unavailable"
            subtitle="This settings section only works for active business members right now"
          />
          <p className="text-sm text-rose-900">{loadError}</p>
        </Card>
      ) : (
        <>
          <Card className="border-violet-200 bg-violet-50/60">
            <CardHeader title={content?.calloutTitle} subtitle={content?.calloutSubtitle} />
            <p className="text-sm text-violet-950">{content?.calloutCopy}</p>
          </Card>

          <Card>
            <CardHeader
              title="Feature modules"
              subtitle="Turn optional features on or off for this workspace. Dashboard always stays enabled."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {rows.map((row) => (
                <label
                  key={row.slug}
                  className={`flex items-start gap-3 rounded-2xl border px-4 py-4 text-sm ${
                    row.isCore
                      ? 'border-slate-200 bg-slate-50 text-slate-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-violet-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    checked={row.isEnabled}
                    disabled={row.isCore}
                    onChange={() => toggleModule(row.slug)}
                  />
                  <span>
                    <span className="block font-semibold text-slate-900">{row.label}</span>
                    {row.isCore ? (
                      <span className="mt-1 block text-xs uppercase tracking-[0.14em] text-slate-400">
                        Always on
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Changes here apply only to the current workspace and take effect immediately after saving.
              </p>
              <Button type="button" onClick={() => void handleSave()} disabled={saving || !hasChanges}>
                {saving ? 'Saving modules...' : 'Save modules'}
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
