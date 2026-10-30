// BoraNexus: no offline cache for dynamic pages, JS, or authentication.
const VERSION = 'bora-pwa-2026-10-29';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(k => k.startsWith('bora-pwa-') && k !== VERSION).map(k => caches.delete(k)));
  await self.clients.claim();
})()));
// No fetch interception: always load fresh application content from network.
