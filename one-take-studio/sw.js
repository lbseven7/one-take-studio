const CACHE = 'takeum-v10';

const ASSETS = [
  './',
  './index.html',
  './db.js',
  './ia.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './image/prod-1.jpg',
  './image/prod-2.jpg',
  './image/prod-3.jpg',
  './image/prod-4.jpg',
  './image/prod-5.jpg',
  './image/prod-6.jpg',
  './image/prod-7.jpg',
  './newsletter-obrigado.html',
  './guia.html',
  './guia-primeiro-video.html',
  './guia-microfone.html',
  './guia-iluminacao.html',
  './jornada.html',
  './teleprompter.html',
  './capa.html',
  './painel-pauta.html',
  './claquete-digital.html',
  './checklist-gravacao.html',
  './roteirizador.html',
  './banco-ideias.html',
  './equipamentos.html',
  './pack-publicacao.html',
  './ia-config.html',
  './sobre.html'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() => cached);
    })
  );
});
