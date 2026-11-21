// Service worker for the app: makes GoatPocket installable and lets the app shell start
// offline. Strategy "network first": new deploys arrive immediately, the cache is only the
// fallback. Calls to the GoatCounter API (another origin) are never touched.
//
// Paths are relative to this file, so it works at app.goatpocket.com/ as well as under
// /app/ (local development, self-hosting). Bump VERSION when the list of files changes.
const VERSION = 'v6';
const CACHE = `goatpocket-app-${VERSION}`;
const SHELL = [
  './',
  'index.html',
  'style.css',
  'manifest.webmanifest',
  'js/main.js',
  'js/api.js',
  'js/config.js',
  'js/demo.js',
  'js/i18n.js',
  'js/period.js',
  'js/util.js',
  '../icons/icon.svg',
  '../icons/icon-180.png',
  '../icons/icon-192.png',
  '../icons/icon-512.png',
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
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith('goatpocket-app-') && k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

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
