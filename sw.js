/* Never Zero service worker (build 76ea0748).
   App files are cached so the app opens instantly and works offline.
   Pages try the network for up to 2.5 s, then fall back to the cached copy, so updates arrive on the next launch. */
const CACHE = 'nz-76ea0748';
const PRECACHE = ["./","index.html","app.76ea0748.js","manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png","fonts/barlow-latin-500-normal.woff2","fonts/barlow-latin-600-normal.woff2","fonts/barlow-latin-700-normal.woff2","fonts/barlow-condensed-latin-700-normal.woff2","fonts/barlow-condensed-latin-800-normal.woff2","fonts/barlow-condensed-latin-800-italic.woff2"];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.indexOf('nz-') === 0 && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
function pageFromNetworkOrCache(req) {
  return new Promise((resolve) => {
    let done = false;
    const cached = () => caches.match('index.html');
    const timer = setTimeout(() => { cached().then((r) => { if (r && !done) { done = true; resolve(r); } }); }, 2500);
    fetch(req, { cache: 'no-cache' }).then((r) => {
      clearTimeout(timer);
      if (!done) { done = true; resolve(r); }
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put('index.html', copy)); }
    }).catch(() => {
      clearTimeout(timer);
      cached().then((r) => { if (!done) { done = true; resolve(r || Response.error()); } });
    });
  });
}
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (req.mode === 'navigate') { e.respondWith(pageFromNetworkOrCache(req)); return; }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return r;
  })));
});
