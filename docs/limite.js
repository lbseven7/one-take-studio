(function(){
  if(!window.OneTakeDB) return;

  var STORE = 'app_state';
  var LIMIT = 5;
  var PRECO = 'R$ 67';
  var CHECKOUT_URL = 'https://lbseven7.github.io/one-take-studio/venda.html';

  var ACOES = {
    'roteirizador-gerar': 'Reescrever roteiro com IA',
    'roteirizador-desc': 'Gerar descrição com IA',
    'capa-gerar': 'Baixar capa 16:9',
    'pack-gerar': 'Gerar pack de publicação',
    'teleprompter-baixar': 'Baixar gravação do teleprompter',
    'banco-ideias-roteirizar': 'Roteirizar ideia com IA',
    'banco-ideias-sugerir': 'Sugerir ideias com IA'
  };

  async function ehPro(){
    try{
      const rec = await OneTakeDB.get(STORE, 'pro');
      return !!(rec && rec.ativo && window.TakeUmChave && window.TakeUmChave.validar(rec.chave));
    }catch(e){ return false; }
  }

  async function usos(acao){
    try{
      const rec = await OneTakeDB.get(STORE, 'uso-' + acao);
      return rec && rec.count ? rec.count : 0;
    }catch(e){ return 0; }
  }

  async function podeUsar(acao){
    if(await ehPro()) return { ok: true, pro: true, usos: 0, limite: 0, restantes: Infinity, acao: acao };
    const u = await usos(acao);
    return { ok: u < LIMIT, pro: false, usos: u, limite: LIMIT, restantes: Math.max(0, LIMIT - u), acao: acao };
  }

  async function usar(acao){
    if(await ehPro()) return;
    const u = await usos(acao);
    await OneTakeDB.put(STORE, { id: 'uso-' + acao, count: u + 1 });
    pintarContadores();
    flashBadge(acao);
    toastUso(acao, u + 1);
  }

  function flashBadge(acao){
    const els = document.querySelectorAll('[data-tu-count="' + acao + '"]');
    for(let i = 0; i < els.length; i++){
      (function(el){
        el.classList.remove('tu-count-flash');
        void el.offsetWidth;
        el.classList.add('tu-count-flash');
        setTimeout(function(){ el.classList.remove('tu-count-flash'); }, 900);
      })(els[i]);
    }
  }

  function toastUso(acao, count){
    const els = document.querySelectorAll('[data-tu-count="' + acao + '"]');
    if(!els.length) return;
    const el = els[els.length - 1];
    const old = el.parentNode.querySelector('.tu-toast');
    if(old) old.remove();
    const t = document.createElement('span');
    t.className = 'tu-toast';
    const rest = LIMIT - count;
    t.textContent = rest > 0 ? '1 uso gasto • restam ' + rest : 'Usos grátis esgotados!';
    el.parentNode.insertBefore(t, el.nextSibling);
    setTimeout(function(){
      t.classList.add('tu-toast-out');
      setTimeout(function(){ t.remove(); }, 400);
    }, 1800);
  }

  function pintarContadores(){
    const els = document.querySelectorAll('[data-tu-count]');
    for(let i = 0; i < els.length; i++){
      (function(el){
        const acao = el.getAttribute('data-tu-count');
        podeUsar(acao).then(function(r){
          if(r.pro){ el.style.display = 'none'; return; }
          if(r.restantes > 0){
            el.textContent = r.restantes + ' de ' + r.limite + ' grátis';
            el.classList.remove('ex');
          } else {
            el.textContent = 'limite atingido';
            el.classList.add('ex');
          }
        });
      })(els[i]);
    }
  }

  function initContadores(){
    if(!document.querySelector('style[data-tu-count-style]')){
      const s = document.createElement('style');
      s.setAttribute('data-tu-count-style', '1');
      s.textContent = '.tu-count{display:inline-block;font-size:10px;line-height:1;color:inherit;opacity:.55;font-weight:600;margin-left:6px;letter-spacing:.04em;text-transform:uppercase;vertical-align:middle;white-space:nowrap;} .tu-count.ex{opacity:1;color:#ff3b30;} .tu-count.tu-count-flash{animation:tuCountFlash .9s ease;} @keyframes tuCountFlash{0%{transform:scale(1);}35%{transform:scale(1.3);color:#ffb020;}100%{transform:scale(1);}} .tu-toast{display:inline-block;margin-left:8px;font-size:11px;font-weight:700;color:#ffb020;background:rgba(255,176,32,0.12);border:1px solid rgba(255,176,32,0.4);border-radius:999px;padding:3px 8px;animation:tuToastIn .25s ease;vertical-align:middle;white-space:nowrap;} @keyframes tuToastIn{from{opacity:0;transform:translateY(3px);}to{opacity:1;transform:translateY(0);}} .tu-toast.tu-toast-out{opacity:0;transition:opacity .35s;}';
      document.head.appendChild(s);
    }
    pintarContadores();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initContadores);
  } else {
    initContadores();
  }

  async function resgatar(chave){
    if(!window.TakeUmChave || !window.TakeUmChave.validar(chave)){
      return { ok: false, msg: 'Chave inválida. Confira o formato TAKEUM-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX.' };
    }
    await OneTakeDB.put(STORE, {
      id: 'pro',
      ativo: true,
      chave: window.TakeUmChave.normalize(chave),
      compraEm: Date.now()
    });
    return { ok: true, msg: 'Take Um Pro ativado! Criação ilimitada liberada.' };
  }

  // Cash-register "cha-ching" synthesized with the Web Audio API,
  // no external audio file needed.
  function somCash(){
    try{
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return;
      if(!window.__tuAudioCtx) window.__tuAudioCtx = new AC();
      const ctx = window.__tuAudioCtx;
      if(ctx.state === 'suspended') ctx.resume();
      const t0 = ctx.currentTime;

      const master = ctx.createGain();
      master.gain.value = 0.4;
      master.connect(ctx.destination);

      function ding(freq, at, vol){
        const tt = t0 + at;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, tt);
        gain.gain.linearRampToValueAtTime(vol, tt + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, tt + 1.1);
        gain.connect(master);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 1800;
        hp.connect(gain);
        [1, 2.76, 5.4, 8.2].forEach(m => {
          const o = ctx.createOscillator();
          o.type = 'triangle';
          o.frequency.value = freq * m;
          o.connect(hp);
          o.start(tt);
          o.stop(tt + 1.2);
        });
      }

      ding(1174.66, 0, 0.55);
      ding(1567.98, 0.14, 0.55);

      const nb = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.04), ctx.sampleRate);
      const nd = nb.getChannelData(0);
      for(let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nd.length);
      const ns = ctx.createBufferSource();
      ns.buffer = nb;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 4200;
      bp.Q.value = 1.2;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.18, t0);
      ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
      ns.connect(bp); bp.connect(ng); ng.connect(master);
      ns.start(t0);
    }catch(e){}
  }

  // Saves a captured lead email locally (deduped) so it lives in the
  // app's data store even if the remote FormSubmit call fails. When the
  // Supabase backend is configured, it also sends the lead to the cloud.
  async function salvarLead(email, acao){
    try{
      const rec = (await OneTakeDB.get(STORE, 'leads')) || { id: 'leads', lista: [] };
      if(!rec.lista || !Array.isArray(rec.lista)) rec.lista = [];
      if(!rec.lista.some(l => l.email === email)){
        rec.lista.push({ email: email, acao: acao, capturadoEm: new Date().toISOString() });
        await OneTakeDB.put(STORE, rec);
      }
    }catch(e){}
    try{
      if(window.SupabaseLeads && SupabaseLeads.configured()){
        await SupabaseLeads.capture(email, acao);
      }
    }catch(e){}
  }

  function listarLeads(){
    return OneTakeDB.get(STORE, 'leads').then(r => (r && r.lista) || []);
  }

  function mostrarUpsell(acao){
    somCash();
    const nome = ACOES[acao] || 'essa ação';
    const old = document.querySelector('.tu-upsell-overlay');
    if(old) old.remove();

    const overlay = document.createElement('div');
    overlay.className = 'tu-upsell-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.72);display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.innerHTML =
      '<div class="tu-upsell">' +
        '<div class="tu-star">★</div>' +
        '<h3>Limite gratuito atingido</h3>' +
        '<p class="tu-sub">Você usou as <strong>' + LIMIT + ' criações gratuitas</strong> de <em>' + nome + '</em>. Com o <strong>Take Um Pro</strong>, crie sem limites.</p>' +
        '<div class="tu-price">' + PRECO + '<span>pagamento único</span></div>' +
        '<a class="tu-buy" href="' + CHECKOUT_URL + '" target="_blank" rel="noopener">Desbloquear ilimitado</a>' +
        '<form class="tu-emailbox" novalidate>' +
          '<p class="tu-email-title">Não quer comprar agora?</p>' +
          '<p class="tu-email-sub">Deixa seu e-mail: você não perde seu progresso e recebe dicas para gravar melhor.</p>' +
          '<div class="tu-email-row">' +
            '<input type="email" class="tu-email-input" placeholder="Seu melhor e-mail" autocomplete="email" spellcheck="false" required>' +
            '<button type="submit" class="tu-email-send">Salvar</button>' +
          '</div>' +
          '<input type="text" class="tu-honey" tabindex="-1" autocomplete="off" aria-hidden="true">' +
          '<div class="tu-emailmsg"></div>' +
        '</form>' +
        '<button type="button" class="tu-key-btn">Já tenho uma chave Pro</button>' +
        '<div class="tu-keybox" hidden>' +
          '<input type="text" class="tu-key-input" placeholder="TAKEUM-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" autocomplete="off" spellcheck="false">' +
          '<button type="button" class="tu-activate">Ativar chave</button>' +
          '<div class="tu-keymsg"></div>' +
        '</div>' +
        '<button type="button" class="tu-close">Continuar no plano grátis</button>' +
      '</div>';

    const style = document.createElement('style');
    style.textContent =
      '.tu-upsell{background:#141417;border:1px solid #232328;border-radius:12px;max-width:360px;width:100%;padding:24px;text-align:center;color:#f5f4ef;font-family:"Archivo",sans-serif;box-sizing:border-box;max-height:90vh;overflow-y:auto;}' +
      '.tu-upsell .tu-star{color:#ffb020;font-size:26px;}' +
      '.tu-upsell h3{margin:8px 0 6px;font-size:16px;font-family:"Archivo",sans-serif;}' +
      '.tu-upsell .tu-sub{margin:0 0 14px;font-size:13px;line-height:1.6;color:#8a8a92;}' +
      '.tu-upsell .tu-sub strong{color:#ffb020;}' +
      '.tu-upsell .tu-sub em{color:#f5f4ef;font-style:normal;}' +
      '.tu-upsell .tu-price{font-size:30px;font-weight:900;color:#ffb020;margin-bottom:2px;}' +
      '.tu-upsell .tu-price span{display:block;font-size:11px;font-weight:600;color:#8a8a92;letter-spacing:0.05em;text-transform:uppercase;margin-top:2px;}' +
      '.tu-upsell .tu-buy{display:block;background:#ffb020;color:#1a1200;font-weight:700;text-decoration:none;padding:13px;border-radius:6px;margin:14px 0 8px;font-size:13px;}' +
      '.tu-upsell .tu-buy:hover{filter:brightness(1.1);}' +
      '.tu-upsell .tu-emailbox{margin:0 0 10px;padding:12px;border:1px solid #232328;border-radius:8px;background:#1a1a1e;text-align:left;}' +
      '.tu-upsell .tu-email-title{margin:0 0 4px;font-size:13px;font-weight:700;color:#f5f4ef;}' +
      '.tu-upsell .tu-email-sub{margin:0 0 10px;font-size:12px;line-height:1.5;color:#8a8a92;}' +
      '.tu-upsell .tu-email-row{display:flex;gap:8px;}' +
      '.tu-upsell .tu-email-input{flex:1;box-sizing:border-box;background:#141417;border:1px solid #232328;border-radius:6px;color:#f5f4ef;font-family:"IBM Plex Mono",monospace;font-size:12px;padding:10px;outline:none;min-width:0;}' +
      '.tu-upsell .tu-email-input:focus{border-color:#ffb020;}' +
      '.tu-upsell .tu-email-send{background:#ffb020;border:none;color:#1a1200;font-weight:700;padding:10px 14px;border-radius:6px;cursor:pointer;font-size:12px;white-space:nowrap;}' +
      '.tu-upsell .tu-email-send:hover{filter:brightness(1.1);}' +
      '.tu-upsell .tu-email-send:disabled{opacity:.5;cursor:default;}' +
      '.tu-upsell .tu-honey{display:none;}' +
      '.tu-upsell .tu-emailmsg{font-size:12px;margin-top:8px;min-height:16px;}' +
      '.tu-upsell .tu-emailmsg.ok{color:#39ff88;}' +
      '.tu-upsell .tu-emailmsg.err{color:#ff3b30;}' +
      '.tu-upsell .tu-key-btn{background:transparent;border:none;color:#8a8a92;font-size:12px;cursor:pointer;text-decoration:underline;padding:4px;}' +
      '.tu-upsell .tu-keybox{margin-top:12px;}' +
      '.tu-upsell .tu-keybox input{width:100%;box-sizing:border-box;background:#1a1a1e;border:1px solid #232328;border-radius:4px;color:#f5f4ef;font-family:"IBM Plex Mono",monospace;font-size:12px;padding:10px;outline:none;}' +
      '.tu-upsell .tu-keybox input:focus{border-color:#ffb020;}' +
      '.tu-upsell .tu-activate{width:100%;margin-top:8px;background:#39ff88;border:none;color:#062a14;font-weight:700;padding:11px;border-radius:6px;cursor:pointer;font-size:12px;}' +
      '.tu-upsell .tu-activate:hover{filter:brightness(1.1);}' +
      '.tu-upsell .tu-keymsg{font-size:12px;margin-top:8px;min-height:16px;}' +
      '.tu-upsell .tu-keymsg.ok{color:#39ff88;}' +
      '.tu-upsell .tu-keymsg.err{color:#ff3b30;}' +
      '.tu-upsell .tu-close{margin-top:14px;background:transparent;border:1px solid #232328;color:#8a8a92;width:100%;padding:10px;border-radius:6px;cursor:pointer;font-size:12px;}' +
      '.tu-upsell .tu-close:hover{color:#f5f4ef;}';
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    overlay.querySelector('.tu-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if(e.target === overlay) overlay.remove(); });

    overlay.querySelector('.tu-emailbox').addEventListener('submit', async (e) => {
      e.preventDefault();
      const box = overlay.querySelector('.tu-emailbox');
      const input = overlay.querySelector('.tu-email-input');
      const msgEl = overlay.querySelector('.tu-emailmsg');
      const sendBtn = overlay.querySelector('.tu-email-send');
      const email = input.value.trim();
      if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
        msgEl.textContent = 'Digite um e-mail válido.';
        msgEl.className = 'tu-emailmsg err';
        return;
      }
      sendBtn.disabled = true;
      msgEl.textContent = 'Enviando...';
      msgEl.className = 'tu-emailmsg';
      await salvarLead(email, acao);
      try{
        const body = new URLSearchParams();
        body.set('email', email);
        body.set('_subject', 'Lead upsell Take Um Studio — ' + nome);
        body.set('_captcha', 'false');
        body.set('_honey', '');
        body.set('_next', 'https://lbseven7.github.io/one-take-studio/');
        await fetch('https://formsubmit.co/takeumst@gmail.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
          body: body.toString()
        });
        box.querySelector('.tu-email-title').textContent = 'E-mail salvo!';
        box.querySelector('.tu-email-sub').textContent = 'Seu progresso fica salvo neste navegador. Boa gravação!';
        input.style.display = 'none';
        sendBtn.style.display = 'none';
        msgEl.textContent = '';
        if(window.tuTrack){ window.tuTrack('upsell_lead', { tool: acao }); }
      }catch(err){
        msgEl.textContent = 'Não deu pra salvar agora. Tente de novo.';
        msgEl.className = 'tu-emailmsg err';
        sendBtn.disabled = false;
      }
    });

    overlay.querySelector('.tu-key-btn').addEventListener('click', () => {
      overlay.querySelector('.tu-keybox').hidden = false;
    });

    overlay.querySelector('.tu-activate').addEventListener('click', async () => {
      const input = overlay.querySelector('.tu-key-input');
      const msgEl = overlay.querySelector('.tu-keymsg');
      const chave = input.value.trim();
      if(!chave){ msgEl.textContent = 'Cole sua chave primeiro.'; msgEl.className = 'tu-keymsg err'; return; }
      const r = await resgatar(chave);
      msgEl.textContent = r.msg;
      msgEl.className = 'tu-keymsg ' + (r.ok ? 'ok' : 'err');
      if(r.ok){ setTimeout(() => overlay.remove(), 1800); }
    });
  }

  window.TakeUmLimite = {
    LIMIT: LIMIT,
    PRECO: PRECO,
    CHECKOUT_URL: CHECKOUT_URL,
    ACOES: ACOES,
    ehPro: ehPro,
    usos: usos,
    podeUsar: podeUsar,
    usar: usar,
    resgatar: resgatar,
    mostrarUpsell: mostrarUpsell,
    pintarContadores: pintarContadores
  };

  window.TakeUmLeads = {
    listar: listarLeads
  };
})();
