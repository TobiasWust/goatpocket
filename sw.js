// Service worker for the website: lets the landing page start offline.
// Strategy "network first": new deploys arrive immediately, the cache is only the
// fallback. Calls to the GoatCounter API (another origin) are never touched.
//
// Bump VERSION when the list of files changes.
const VERSION = 'v6';
const CACHE = `goatpocket-${VERSION}`;
// The app has its own service worker (app/sw.js) and is served from app.goatpocket.com.
const SHELL = [
  './',
  'index.html',
  'legal.html',
  'assets/landing.css',
  'assets/landing.js',
  'icons/icon.svg',
  'icons/icon-180.png',
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // /app/ belongs to the app (its own service worker, or a redirect to app.goatpocket.com).
  if (new URL(req.url).pathname.startsWith('/app/')) return;

  ev.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(req, { ignoreSearch: true });
        if (hit || req.mode !== 'navigate') return hit || Response.error();
        return caches.match('index.html');
      }),
  );
});
