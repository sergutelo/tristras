// TrisTras Service Worker — Offline + Auto-Update
// ⚑  Cambia CACHE_VERSION al subir nuevos cambios → dispara notificación de actualización
const CACHE_VERSION = 'v11';
const CACHE = `tristras-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js'
];

// ── INSTALL ──────────────────────────────────────────
// Pre-cachea assets estáticos. NO llama a skipWaiting() aquí:
// el nuevo SW espera en estado "waiting" hasta que el usuario confirme.
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC_ASSETS))
    // Sin skipWaiting() → el SW queda en "waiting", notificamos a la app
  );
});

// ── ACTIVATE ─────────────────────────────────────────
// Limpia cachés viejos y toma control de todos los clientes
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── MESSAGE ──────────────────────────────────────────
// La app envía 'SKIP_WAITING' cuando el usuario toca "Actualizar"
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

// ── FETCH ─────────────────────────────────────────────
// index.html → Network-first  (siempre fresco, offline usa caché)
// resto      → Cache-first    (assets estáticos, rápido)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isNavigation = e.request.mode === 'navigate'
    || url.pathname.endsWith('index.html')
    || url.pathname === '/'
    || url.pathname.endsWith('/');

  if (isNavigation) {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE).then(cache => cache.put(e.request, clone));
          }
          return resp;
        })
        .catch(() => caches.match('./index.html'))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(resp => {
          if (resp && resp.status === 200 && resp.type !== 'opaque') {
            const clone = resp.clone();
            caches.open(CACHE).then(cache => cache.put(e.request, clone));
          }
          return resp;
        });
      })
    );
  }
});
