// Injected into the auto-generated Workbox service worker via
// VitePWA's workbox.importScripts option (vite.config.js) - kept as a
// separate plain script rather than switching the whole PWA build to
// the injectManifest strategy, so the existing precaching/runtime-caching
// behaviour (API cache, image cache) doesn't need to be reimplemented by
// hand. This file only adds what generateSW can't: push notifications.

self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  let payload;

  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Taska', body: event.data.text() };
  }

  const title = payload.title || 'Taska';
  const options = {
    body: payload.body || '',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    data: { url: payload.url || '/ai-insights' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'navigate', url: targetUrl });
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    }),
  );
});
