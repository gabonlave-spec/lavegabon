// Service worker Lavegabon : cache simple (phase 2).
// Les notifications push (relais Cloudflare + FCM) s'ajouteront en phase 6.
const CACHE = 'lav-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/logo.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // Firebase, etc. : jamais en cache
  // Reseau d'abord, cache en secours (utile quand la connexion coupe).
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  );
});

// --- Notifications push (relais Cloudflare + Firebase Cloud Messaging)
self.addEventListener('push', (event) => {
  let p = {}
  try { p = event.data ? event.data.json() : {} } catch (e) { p = {} }
  const d = p.data || p.notification || p
  const title = d.title || 'LaveGabon'
  const icon = self.registration.scope + 'icons/icon-192.png'
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    if (list.some((c) => c.visibilityState === 'visible')) return
    return self.registration.showNotification(title, {
      body: d.body || '', tag: d.tag || undefined, renotify: !!d.tag,
      icon: icon, badge: icon, data: { link: d.link || '' },
    })
  }))
})
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const link = (event.notification.data && event.notification.data.link) || self.registration.scope
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) {
      if ('navigate' in c) return c.navigate(link).then((x) => (x || c).focus()).catch(() => self.clients.openWindow(link))
    }
    return self.clients.openWindow(link)
  }))
})
