(function(){
  if(!window.OneTakeDB) return;

  var STORE = 'app_state';
  var LIMIT = 7;
  var PRECO = 'R$ 67';
  var CHECKOUT_URL = 'https://lbseven7.github.io/one-take-studio/venda.html';

  var ACOES = {
    'roteirizador-gerar': 'Reescrever roteiro com IA',
    'roteirizador-desc': 'Gerar descrição com IA',
    'capa-gerar': 'Baixar capa 16:9',
    'capa-vertical-gerar': 'Baixar capa 9:16',
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

  function mostrarUpsell(acao){
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
    mostrarUpsell: mostrarUpsell
  };
})();
