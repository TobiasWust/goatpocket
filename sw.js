// Service worker: makes GoatPocket installable and lets the app shell start offline.
// Strategy "network first": new deploys arrive immediately, the cache is only the
// fallback. Calls to the GoatCounter API (another origin) are never touched.
//
// Bump VERSION when the list of files changes.
const VERSION = 'v4';
const CACHE = `goatpocket-${VERSION}`;
const SHELL = [
  './',
  'index.html',
  'assets/landing.css',
  'assets/landing.js',
  'app/',
  'app/index.html',
  'app/style.css',
  'app/manifest.webmanifest',
  'app/js/main.js',
  'app/js/api.js',
  'app/js/config.js',
  'app/js/demo.js',
  'app/js/i18n.js',
  'app/js/period.js',
  'app/js/util.js',
  'icons/icon.svg',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
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
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

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
        // Offline navigation to an unknown URL: fall back to the matching shell page.
        const inApp = url.pathname.includes('/app/');
        return caches.match(inApp ? 'app/index.html' : 'index.html');
      }),
  );
});
