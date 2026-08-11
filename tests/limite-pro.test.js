// Testes da lógica anti-forja do Pro (limite.js) com mocks.
// Roda com `npm test` — sem rede, sem Supabase real.
//
// O que cobre:
//  * record "pro" forjado no IndexedDB NÃO libera Pro sem token do servidor;
//  * revalidadoEm no futuro (o truque de pular a validação) é rejeitado;
//  * token expirado, do aparelho errado ou com exp inflada (clamp) forçam
//    revalidação online;
//  * record legítimo (token + janela 48h) funciona offline, sem rede;
//  * self-heal: validar falha -> ativar re-registra e emite token novo.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const chave = require('../one-take-studio/chave-core.js');

const LIMITE_PATH = path.join(__dirname, '..', 'one-take-studio', 'limite.js');
const DEV = 'dev-test-1';
const AGORA = () => Date.now();
const SEMANA = 7 * 24 * 60 * 60 * 1000;
const TOKEN_OK = { ok: true, token: 'tok-servidor-1', exp: new Date(AGORA() + SEMANA).toISOString() };
const ATIVAR_OK = { status: 'ok', token: 'tok-servidor-1', exp: new Date(AGORA() + SEMANA).toISOString() };

function makeDoc(){
  return {
    readyState: 'complete',
    head: { appendChild: () => {} },
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ setAttribute: () => {}, textContent: '' }),
    addEventListener: () => {}
  };
}

// Cria um ambiente (window/document/OneTakeDB/SupabaseChaves) e carrega o
// limite.js num "browser" isolado. Retorna os handles para as asserções.
function carrega({ dbData, supabase } = {}){
  const db = {
    map: new Map(),
    async get(store, id){ return this.map.has(id) ? Object.assign({}, this.map.get(id)) : null; },
    async put(store, rec){ this.map.set(rec.id, Object.assign({}, rec)); }
  };
  (dbData || []).forEach(r => db.map.set(r.id, Object.assign({}, r)));

  const calls = { validarDispositivo: 0, ativarDispositivo: 0, validarChave: 0 };
  const sbase = supabase || {
    dispositivoId: () => DEV,
    async validarChave(){ calls.validarChave++; return true; },
    async validarDispositivo(){ calls.validarDispositivo++; return Object.assign({}, TOKEN_OK); },
    async ativarDispositivo(){ calls.ativarDispositivo++; return Object.assign({}, ATIVAR_OK); },
    async listarDispositivos(){ return []; },
    async removerDispositivo(){ return true; }
  };

  const windowObj = {};
  globalThis.window = windowObj;
  globalThis.document = makeDoc();
  globalThis.OneTakeDB = db;
  windowObj.OneTakeDB = db;
  windowObj.TakeUmChave = chave;
  windowObj.SupabaseChaves = sbase;

  delete require.cache[require.resolve(LIMITE_PATH)];
  require(LIMITE_PATH);

  return { api: windowObj.TakeUmLimite, db, calls, supabase: sbase };
}

function recPro(over){
  return Object.assign({
    id: 'pro', ativo: true, chave: chave.gerar(),
    revalidadoEm: AGORA(), dispositivo: DEV,
    token: 'tok-servidor-1', tokenExp: AGORA() + SEMANA
  }, over);
}

test('forja sem token: record com checksum válido mas SEM token não é Pro', async () => {
  // Chave forjada no DevTools (checksum público) + record sem token.
  const calls = { validarDispositivo: 0, ativarDispositivo: 0 };
  const { api } = carrega({
    dbData: [{ id: 'pro', ativo: true, chave: chave.gerar(), revalidadoEm: AGORA(), dispositivo: DEV }],
    supabase: {
      dispositivoId: () => DEV,
      async validarDispositivo(){ calls.validarDispositivo++; return { ok: false }; },
      async ativarDispositivo(){ calls.ativarDispositivo++; return { status: 'erro' }; }
    }
  });
  assert.equal(await api.ehPro(), false);
  assert.ok(calls.validarDispositivo + calls.ativarDispositivo > 0, 'record sem token deveria ir à rede');
});

test('forja com revalidadoEm no futuro: não libera Pro offline (truque do timestamp)', async () => {
  const { api } = carrega({
    dbData: [recPro({ revalidadoEm: AGORA() + 1e12, token: undefined, tokenExp: undefined })],
    supabase: {
      dispositivoId: () => DEV,
      async validarDispositivo(){ return { ok: false }; },
      async ativarDispositivo(){ return { status: 'erro' }; }
    }
  });
  assert.equal(await api.ehPro(), false);
});

test('forja completa (checksum + revalidadoEm futuro + token inventado) é rejeitada: token não vem do servidor', async () => {
  // Mesmo inventando um token qualquer no record, ehPro força revalidação
  // online; sem conexão (ok:false) o Pro não libera.
  const calls = { validarDispositivo: 0, ativarDispositivo: 0 };
  const { api } = carrega({
    dbData: [recPro({ revalidadoEm: AGORA() + 1e12, token: 'inventado', tokenExp: AGORA() + 1e12 })],
    supabase: {
      dispositivoId: () => DEV,
      async validarDispositivo(){ calls.validarDispositivo++; return { ok: false }; },
      async ativarDispositivo(){ calls.ativarDispositivo++; return { status: 'erro' }; }
    }
  });
  assert.equal(await api.ehPro(), false);
  assert.equal(calls.validarDispositivo, 1, 'deveria ter ido à rede (revalidadoEm futuro)');
});

test('token legítimo + janela 48h: Pro offline, SEM tocar a rede', async () => {
  const { api, calls } = carrega({ dbData: [recPro({})] });
  assert.equal(await api.ehPro(), true);
  assert.equal(calls.validarDispositivo, 0, 'não pode consultar o servidor');
  assert.equal(calls.ativarDispositivo, 0);
});

test('tokenExp inflado para o futuro (clamp): força revalidação online', async () => {
  const calls = { validarDispositivo: 0, ativarDispositivo: 0 };
  const { api } = carrega({
    dbData: [recPro({ tokenExp: AGORA() + 1e12 })],
    supabase: {
      dispositivoId: () => DEV,
      async validarDispositivo(){ calls.validarDispositivo++; return { ok: false }; },
      async ativarDispositivo(){ calls.ativarDispositivo++; return { status: 'erro' }; }
    }
  });
  assert.equal(await api.ehPro(), false);
  assert.ok(calls.validarDispositivo + calls.ativarDispositivo > 0, 'deveria revalidar online');
});

test('token do aparelho errado (backup restaurado em outro aparelho): revalida online', async () => {
  const calls = { validarDispositivo: 0 };
  const { api } = carrega({
    dbData: [recPro({ dispositivo: 'dev-outro' })],
    supabase: {
      dispositivoId: () => DEV,
      async validarDispositivo(){ calls.validarDispositivo++; return { ok: false }; },
      async ativarDispositivo(){ return { status: 'erro' }; }
    }
  });
  assert.equal(await api.ehPro(), false);
  assert.equal(calls.validarDispositivo, 1);
});

test('token expirado: revalida online, servidor renova token e volta Pro', async () => {
  const { api, db } = carrega({
    dbData: [recPro({ tokenExp: AGORA() - 1000 })],
    supabase: {
      dispositivoId: () => DEV,
      async validarDispositivo(){ return Object.assign({}, TOKEN_OK); },
      async ativarDispositivo(){ return Object.assign({}, ATIVAR_OK); }
    }
  });
  assert.equal(await api.ehPro(), true);
  const rec = await db.get('app_state', 'pro');
  assert.ok(rec.token, 'token deve ser atualizado');
  assert.ok(rec.tokenExp > AGORA());
  assert.ok(rec.revalidadoEm <= AGORA() + 1000, 'revalidadoEm não pode ficar no futuro');
});

test('self-heal: validar falha (aparelho saiu do LRU) -> ativar re-registra', async () => {
  const { api, db, calls } = carrega({
    dbData: [recPro({ tokenExp: AGORA() - 1000 })],
    supabase: {
      dispositivoId: () => DEV,
      async validarDispositivo(){ calls.validarDispositivo++; return { ok: false }; },
      async ativarDispositivo(){ calls.ativarDispositivo++; return Object.assign({}, ATIVAR_OK); }
    }
  });
  assert.equal(await api.ehPro(), true);
  assert.equal(calls.ativarDispositivo, 1);
  const rec = await db.get('app_state', 'pro');
  assert.equal(rec.token, 'tok-servidor-1');
  assert.equal(rec.dispositivo, DEV);
});

test('sem conexão (validar e ativar falham): não libera Pro', async () => {
  const { api } = carrega({
    dbData: [recPro({ revalidadoEm: AGORA() - SEMANA, tokenExp: AGORA() - 1000 })],
    supabase: {
      dispositivoId: () => DEV,
      async validarDispositivo(){ throw new Error('offline'); },
      async ativarDispositivo(){ throw new Error('offline'); }
    }
  });
  assert.equal(await api.ehPro(), false);
});

test('record sem chave válida (checa o checksum) não é Pro', async () => {
  const { api } = carrega({
    dbData: [recPro({ chave: 'TAKEUM-L68W4-NYELN-3KBB3-KBB3K-JY45A', token: 'x', tokenExp: AGORA() + SEMANA })]
  });
  assert.equal(await api.ehPro(), false);
});

test('resgatar: chave em formato inválido é recusada antes da rede', async () => {
  const { api } = carrega({});
  const r = await api.resgatar('NAO-E-UM-FORMATO');
  assert.equal(r.ok, false);
});

test('resgatar: servidor rejeita (chave não cadastrada em chaves_pro)', async () => {
  const { api } = carrega({
    supabase: {
      dispositivoId: () => DEV,
      async validarChave(){ return false; },
      async ativarDispositivo(){ return { status: 'chave_invalida' }; }
    }
  });
  const r = await api.resgatar(chave.gerar());
  assert.equal(r.ok, false);
});

test('resgatar: sucesso grava token/tokenExp/dispositivo e libera Pro', async () => {
  const { api, db, calls } = carrega({
    supabase: {
      dispositivoId: () => DEV,
      async validarChave(){ calls.validarChave++; return true; },
      async ativarDispositivo(){ calls.ativarDispositivo++; return Object.assign({}, ATIVAR_OK); }
    }
  });
  const r = await api.resgatar(chave.gerar());
  assert.equal(r.ok, true);
  const rec = await db.get('app_state', 'pro');
  assert.equal(rec.ativo, true);
  assert.equal(rec.token, 'tok-servidor-1');
  assert.ok(rec.tokenExp > AGORA());
  assert.equal(rec.dispositivo, DEV);
  assert.ok(rec.revalidadoEm <= AGORA() + 1000);
});
