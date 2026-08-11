// Teste de integração do controle de aparelhos (chaves_ativos) no Supabase real.
// Uso:
//   1. Crie uma chave de teste e cadastre em chaves_pro (SQL Editor):
//        node -e "const c=require('./one-take-studio/chave-core.js'); console.log(c.gerarDeCodigo('TESTE-DISPOSITIVOS'))"
//        insert into public.chaves_pro (codigo, chave) values ('TESTE-DISPOSITIVOS','TAKEUM-...');
//   2. Rode:
//        node tests/test-dispositivos.js --chave=TAKEUM-...
//   3. (Opcional) remova a linha de teste do chaves_pro depois.
//
// O script registra 4 aparelhos de teste para provar a evicção LRU (limite 3),
// valida/remove aparelhos e faz limpeza no final.

const fs = require('node:fs');
const path = require('node:path');

let SUPA_URL = null;
let SUPA_ANON_KEY = null;
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  const urlEnv = env.match(/^\s*SUPA_URL\s*=\s*['"]?([^'"\r\n]+)['"]?/m);
  const keyEnv = env.match(/^\s*SUPA_ANON_KEY\s*=\s*['"]?([^'"\r\n]+)['"]?/m);
  if (urlEnv) SUPA_URL = urlEnv[1];
  if (keyEnv) SUPA_ANON_KEY = keyEnv[1];
}
if (!SUPA_URL || !SUPA_ANON_KEY) {
  const src = fs.readFileSync(path.join(__dirname, '..', 'one-take-studio', 'supabase.js'), 'utf8');
  const urlMatch = src.match(/SUPA_URL\s*=\s*'([^']+)'/);
  const keyMatch = src.match(/SUPA_ANON_KEY\s*=\s*'([^']+)'/);
  if (!urlMatch || !keyMatch) {
    console.error('Config não encontrada em .env nem em one-take-studio/supabase.js');
    process.exit(1);
  }
  if (!SUPA_URL) SUPA_URL = urlMatch[1];
  if (!SUPA_ANON_KEY) SUPA_ANON_KEY = keyMatch[1];
}

const argvChave = process.argv.find(a => a.startsWith('--chave='));
if (!argvChave) {
  console.error('Passe a chave de teste: node tests/dispositivos-check.js --chave=TAKEUM-...');
  process.exit(1);
}
const CHAVE = argvChave.slice('--chave='.length).trim();

async function rpc(name, body) {
  const res = await fetch(SUPA_URL + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: { apikey: SUPA_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(name + ' HTTP ' + res.status + ': ' + (await res.text()));
  return res.json();
}

let falhas = 0;
function check(nome, cond, extra) {
  if (cond) {
    console.log('  ok  - ' + nome);
  } else {
    falhas++;
    console.log('  FALHOU - ' + nome + (extra ? ' | ' + extra : ''));
  }
}

async function main() {
  const D1 = 'teste-dev-1';
  const D2 = 'teste-dev-2';
  const D3 = 'teste-dev-3';
  const D4 = 'teste-dev-4';

  console.log('0) limpeza prévia (execuções anteriores)');
  const pre = await rpc('listar_dispositivos', { p_chave: CHAVE });
  for (const d of (pre || [])) {
    if (String(d.dispositivo || '').startsWith('teste-dev-')) {
      await rpc('remover_dispositivo', { p_chave: CHAVE, p_dispositivo: d.dispositivo });
    }
  }
  const preFim = await rpc('listar_dispositivos', { p_chave: CHAVE });
  check('nenhum resíduo de teste ativo', Array.isArray(preFim) && preFim.every(d => !String(d.dispositivo).startsWith('teste-dev-')));

  console.log('1) chave inválida é recusada');
  const inv = await rpc('ativar_dispositivo', { p_chave: 'TAKEUM-AAAAA-AAAAA-AAAAA-AAAAA-AAAAA', p_dispositivo: D1 });
  check('ativar com chave inexistente -> chave_invalida', inv.status === 'chave_invalida', JSON.stringify(inv));

  console.log('2) ativação de 3 aparelhos válidos');
  const a1 = await rpc('ativar_dispositivo', { p_chave: CHAVE, p_dispositivo: D1 });
  check('D1 -> status ok', a1.status === 'ok', JSON.stringify(a1));
  check('D1 -> token emitido (128 bits)', typeof a1.token === 'string' && a1.token.length >= 30);
  check('D1 -> exp ~7 dias no futuro', a1.exp && Date.parse(a1.exp) > Date.now() + 6 * 86400000);

  const a2 = await rpc('ativar_dispositivo', { p_chave: CHAVE, p_dispositivo: D2 });
  check('D2 -> status ok', a2.status === 'ok', JSON.stringify(a2));
  const a3 = await rpc('ativar_dispositivo', { p_chave: CHAVE, p_dispositivo: D3 });
  check('D3 -> status ok', a3.status === 'ok', JSON.stringify(a3));

  const lista3 = await rpc('listar_dispositivos', { p_chave: CHAVE });
  check('lista com 3 aparelhos', Array.isArray(lista3) && lista3.length === 3, JSON.stringify(lista3));

  console.log('3) validação de aparelho registrado renova o token');
  const v1 = await rpc('validar_dispositivo', { p_chave: CHAVE, p_dispositivo: D1 });
  check('D1 -> ok true', v1.ok === true, JSON.stringify(v1));
  check('D1 -> token renovado', typeof v1.token === 'string' && v1.token !== a1.token);
  check('D1 -> exp renovado', v1.exp && Date.parse(v1.exp) > Date.parse(a1.exp));

  const vNao = await rpc('validar_dispositivo', { p_chave: CHAVE, p_dispositivo: 'teste-dev-inexistente' });
  check('aparelho não registrado -> ok false', vNao.ok === false, JSON.stringify(vNao));

  console.log('4) evicção LRU: 4º aparelho expulsa o menos usado');
  // "D1" acabou de ser validado (uso recente). D2 e D3 seguem os mais velhos.
  const a4 = await rpc('ativar_dispositivo', { p_chave: CHAVE, p_dispositivo: D4 });
  check('D4 -> status ok', a4.status === 'ok', JSON.stringify(a4));
  const lista4 = await rpc('listar_dispositivos', { p_chave: CHAVE });
  check('lista com 3 aparelhos (limite)', Array.isArray(lista4) && lista4.length === 3, JSON.stringify(lista4));
  const devs4 = lista4.map(d => d.dispositivo);
  check('D4 está ativo', devs4.indexOf(D4) !== -1);
  check('menos usado (D2 ou D3) foi expulso', devs4.indexOf(D1) !== -1 && devs4.length === 3, devs4.join(', '));

  console.log('5) remoção de aparelho');
  const rmv = await rpc('remover_dispositivo', { p_chave: CHAVE, p_dispositivo: D4 });
  check('remove D4 -> true', rmv === true, JSON.stringify(rmv));
  const vD4 = await rpc('validar_dispositivo', { p_chave: CHAVE, p_dispositivo: D4 });
  check('D4 após remoção -> ok false', vD4.ok === false, JSON.stringify(vD4));

  console.log('6) limpeza');
  await rpc('remover_dispositivo', { p_chave: CHAVE, p_dispositivo: D1 });
  await rpc('remover_dispositivo', { p_chave: CHAVE, p_dispositivo: D2 });
  await rpc('remover_dispositivo', { p_chave: CHAVE, p_dispositivo: D3 });
  const fim = await rpc('listar_dispositivos', { p_chave: CHAVE });
  check('nenhum aparelho de teste sobrou', Array.isArray(fim) && fim.length === 0, JSON.stringify(fim));

  if (falhas > 0) {
    console.error('\nFALHOU com ' + falhas + ' verificação(ões).');
    process.exit(1);
  }
  console.log('\nTodos os testes de aparelhos passaram.');
}

main().catch((e) => {
  console.error('FALHOU:', e.message);
  process.exit(1);
});
