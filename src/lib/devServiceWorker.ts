/** Vite source modules must always come from the running development server. */
export async function clearDevelopmentServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  const isOurWorker = (url?: string) => Boolean(url && new URL(url).origin === location.origin
    && new URL(url).pathname === '/admin-sw.js');
  const controlled = isOurWorker(navigator.serviceWorker.controller?.scriptURL);
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.filter(registration =>
    isOurWorker(registration.active?.scriptURL)
    || isOurWorker(registration.waiting?.scriptURL)
    || isOurWorker(registration.installing?.scriptURL),
  ).map(registration => registration.unregister()));
  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('doll-work-shell-')).map(name => caches.delete(name)));
  }
  return controlled;
}
