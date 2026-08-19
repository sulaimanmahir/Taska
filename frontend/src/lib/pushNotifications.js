// Pure helpers only (no api.js import) - kept testable via `node --test`
// the same way every other lib/ file in this codebase is, following the
// established convention that api-calling orchestration lives in the
// component that uses it, not in lib/.

export function isPushSupported() {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window;
}

// The browser Push API needs the VAPID public key as a raw Uint8Array
// (applicationServerKey), not the base64url string the backend hands back.
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
