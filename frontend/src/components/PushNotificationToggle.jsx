import { useEffect, useState } from 'react';
import api from '../lib/api';
import Card from './Card';
import { isPushSupported, urlBase64ToUint8Array } from '../lib/pushNotifications';

async function getCurrentSubscription() {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export default function PushNotificationToggle() {
  // Lazy initializer runs synchronously during render, not in an effect, so
  // the "unsupported" branch never needs a setState call inside useEffect.
  const [status, setStatus] = useState(() => (isPushSupported() ? 'checking' : 'unsupported'));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status !== 'checking') {
      return;
    }

    getCurrentSubscription()
      .then((subscription) => setStatus(subscription ? 'subscribed' : 'unsubscribed'))
      .catch(() => setStatus('unsubscribed'));
  }, [status]);

  const handleSubscribe = async () => {
    setBusy(true);
    setError('');

    try {
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        throw new Error('Notification permission was not granted.');
      }

      const { data } = await api.get('/push-subscriptions/public-key');

      if (!data.configured || !data.public_key) {
        throw new Error('Push notifications are not configured for this server yet.');
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.public_key),
      });

      await api.post('/push-subscriptions', subscription.toJSON());
      setStatus('subscribed');
    } catch (subscribeError) {
      setError(subscribeError.message || 'We could not enable push notifications right now.');
    } finally {
      setBusy(false);
    }
  };

  const handleUnsubscribe = async () => {
    setBusy(true);
    setError('');

    try {
      const subscription = await getCurrentSubscription();

      if (subscription) {
        await api.delete('/push-subscriptions', { data: { endpoint: subscription.endpoint } });
        await subscription.unsubscribe();
      }

      setStatus('unsubscribed');
    } catch (unsubscribeError) {
      setError(unsubscribeError.message || 'We could not disable push notifications right now.');
    } finally {
      setBusy(false);
    }
  };

  if (status === 'unsupported') {
    return null;
  }

  return (
    <Card className="border-slate-200 bg-slate-50/60">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Push notifications</p>
          <p className="mt-1 text-sm text-slate-600">
            {status === 'subscribed'
              ? 'This device receives a push when a critical AI insight comes up, even when Taska is closed.'
              : 'Get a push on this device for critical alerts (like a cash-flow risk or expiring stock), even when Taska is closed.'}
          </p>
          {error ? <p className="mt-1 text-sm text-rose-600">{error}</p> : null}
        </div>
        {status === 'subscribed' ? (
          <button
            type="button"
            onClick={handleUnsubscribe}
            disabled={busy}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {busy ? 'Disabling...' : 'Disable'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={busy || status === 'checking'}
            className="rounded-xl bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-strong)] disabled:opacity-50"
          >
            {busy ? 'Enabling...' : 'Enable'}
          </button>
        )}
      </div>
    </Card>
  );
}
