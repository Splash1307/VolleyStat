// Service worker : l'appli fonctionne hors-ligne (gymnase sans réseau).
// - Page (index.html) : réseau d'abord, sans cache HTTP, pour toujours avoir la dernière version.
// - Fichiers /assets/ (nom unique par version) : cache d'abord.
// Les réponses en erreur (404…) ne sont jamais mises en cache.
const CACHE = 'volleystat-v2';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const save = (req, res) => {
  if (res && res.ok) {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
};

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then((res) => save('./', res))
        .catch(() => caches.match('./')),
    );
    return;
  }

  if (req.url.includes('/assets/')) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => save(req, res))));
    return;
  }

  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((res) => save(req, res))
      .catch(() => caches.match(req)),
  );
});
