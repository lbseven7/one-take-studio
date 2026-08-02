/*
 * pro.js — Sistema do Plano Pro do Take Um Studio
 *
 * Como funciona (v1, sem backend):
 * - O código de ativação é validado pelo FORMATO TAKEUM-XXXX-XXXX-XXXX.
 * - Fica salvo no localStorage deste navegador (local-first, como todo o app).
 * - Limites do plano grátis: pauta_cards, banco_ideias, roteirizador_scripts, tracker_videos.
 *
 * NOTA: por ser um site 100% estático, a validação é feita no navegador.
 * Para validação à prova de fraude, o próximo passo é um proxy leve
 * (ex: Cloudflare Worker) que valide o código no servidor.
 */
(function () {
  var STORAGE_KEY = 'takeum_pro_code';

  var LIMITS = {
    pauta_cards: 5,
    banco_ideias: 10,
    roteirizador_scripts: 5,
    tracker_videos: 10
  };

  var NAMES = {
    pauta_cards: 'pautas ativas',
    banco_ideias: 'ideias salvas',
    roteirizador_scripts: 'roteiros salvos',
    tracker_videos: 'vídeos no tracker'
  };

  function getCode() {
    try { return localStorage.getItem(STORAGE_KEY) || ''; } catch (e) { return ''; }
  }

  function isValidCode(code) {
    return typeof code === 'string' && /^TAKEUM-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code.trim());
  }

  function isPro() {
    return isValidCode(getCode());
  }

  function activate(code) {
    code = String(code || '').trim().toUpperCase();
    if (!isValidCode(code)) {
      return { ok: false, error: 'Código inválido. Use o formato TAKEUM-XXXX-XXXX-XXXX que você recebeu por e-mail.' };
    }
    try {
      localStorage.setItem(STORAGE_KEY, code);
      return { ok: true, code: code };
    } catch (e) {
      return { ok: false, error: 'Não foi possível salvar o código neste navegador.' };
    }
  }

  function deactivate() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  function getStatus() {
    return { pro: isPro(), code: getCode() };
  }

  // currentCount = quantidade ATUAL de itens (antes de adicionar)
  function checkLimit(store, currentCount) {
    if (isPro()) return { ok: true };
    var limit = LIMITS[store];
    if (!limit) return { ok: true };
    if (currentCount >= limit) {
      return { ok: false, limit: limit, count: currentCount };
    }
    return { ok: true };
  }

  function limitMessage(store, count) {
    var limit = LIMITS[store] || 0;
    var name = NAMES[store] || 'itens';
    return 'Você atingiu o limite de ' + limit + ' ' + name + ' no plano grátis. Assine o Pro para itens ilimitados.';
  }

  // ---------- Toast compartilhado (funciona em qualquer página) ----------
  var toastEl = null;
  var toastTimer = null;

  function toast(msgHtml) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'takeum-pro-toast';
      toastEl.setAttribute('role', 'status');
      toastEl.style.cssText =
        'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:99999;' +
        'max-width:min(92vw,560px);background:#141417;border:1px solid rgba(255,176,32,.5);' +
        'color:#f5f4ef;font-family:\'IBM Plex Mono\',monospace;font-size:12px;line-height:1.7;' +
        'padding:13px 20px;border-radius:8px;box-shadow:0 10px 34px rgba(0,0,0,.55);' +
        'opacity:0;pointer-events:none;transition:opacity .22s ease;text-align:center';
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = msgHtml;
    toastEl.style.opacity = '1';
    toastEl.style.pointerEvents = 'auto';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.style.opacity = '0';
      toastEl.style.pointerEvents = 'none';
    }, 3400);
  }

  function limitToast(store, count) {
    var limit = LIMITS[store] || 0;
    var name = NAMES[store] || 'itens';
    toast('Você atingiu o limite de <strong style="color:#f5f4ef">' + limit + ' ' + name + '</strong> no plano grátis. ' +
      '<a href="vendas.html" style="color:#ffb020;font-weight:700;text-decoration:underline;white-space:nowrap">Assinar Pro →</a>');
  }

  window.TakeUmPro = {
    STORAGE_KEY: STORAGE_KEY,
    LIMITS: LIMITS,
    isPro: isPro,
    activate: activate,
    deactivate: deactivate,
    getStatus: getStatus,
    checkLimit: checkLimit,
    limitMessage: limitMessage,
    limitToast: limitToast,
    toast: toast
  };
})();
