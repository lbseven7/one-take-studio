const CACHE = 'takeum-v29';

const ASSETS = [
  './',
  './index.html',
  './db.js',
  './ia.js',
  './chave-core.js',
  './limite.js',
  './fonts.css',
  './fonts/archivo-500.woff2',
  './fonts/plexmono-400.woff2',
  './fonts/plexmono-500.woff2',
  './fonts/plexmono-600.woff2',
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
  './pro.html',
  './venda.html',
  './guias/guia.html',
  './blog/mercado-criadores-de-video-solo.html',
  './guias/guia-primeiro-video.html',
  './guias/guia-microfone.html',
  './guias/guia-iluminacao.html',
  './ferramentas/jornada.html',
  './ferramentas/teleprompter.html',
  './ferramentas/capa.html',
  './ferramentas/capa-vertical.html',
  './ferramentas/painel-pauta.html',
  './ferramentas/calendario.html',
  './ferramentas/claquete-digital.html',
  './ferramentas/checklist-gravacao.html',
  './ferramentas/checklist-divulgacao.html',
  './ferramentas/roteirizador.html',
  './ferramentas/banco-ideias.html',
  './ferramentas/equipamentos.html',
  './ferramentas/pack-publicacao.html',
  './ferramentas/tracker-resultados.html',
  './ferramentas/ia-config.html',
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
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then(c => c || caches.match('./index.html')))
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
