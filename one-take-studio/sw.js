const CACHE = 'takeum-v67';

const ASSETS = [
  './',
  './index.html',
  './db.js',
  './ia.js',
  './analytics.js',
  './chave-core.js',
  './limite.js',
  './supabase.js',
  './mobile.css',
  './theme.css',
  './back-btn.js',
  './theme.js',
  './fonts.css',
  './fonts/archivo-500.woff2',
  './fonts/plexmono-400.woff2',
  './fonts/plexmono-500.woff2',
  './fonts/plexmono-600.woff2',
  './manifest.json',
  './icons/tu-192.png',
  './icons/tu-512.png',
  './icons/tu-192-maskable.png',
  './icons/tu-512-maskable.png',
  './video/mascote.mp4',
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
  './resgatar.html',
  './aparelhos.html',
  './guias/guia.html',
  './guias/guia-planejamento.html',
  './blog/como-comecar-no-youtube-sozinho.html',
  './blog/mercado-criadores-de-video-solo.html',
  './blog/teleprompter-gratis-online.html',
  './blog/gerador-de-capa-para-youtube-gratis.html',
  './blog/roteirizador-de-video-com-ia.html',
  './blog/dados-criadores-de-conteudo-2026.html',
  './guias/guia-primeiro-video.html',
  './guias/guia-microfone.html',
  './guias/guia-iluminacao.html',
  './ferramentas/jornada.html',
  './ferramentas/teleprompter.html',
  './ferramentas/capa.html',
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
  './ferramentas/leads.html',
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

  // Manifest e ícones nunca vêm do cache antigo: sempre da rede,
  // para o prompt de instalação mostrar a logo atual.
  if (url.pathname.endsWith('/manifest.json') || url.pathname.includes('/icons/')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request))
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
