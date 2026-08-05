// Smoke test do backend Supabase: confere que as RPCs de validação estão no ar.
// Uso: node tests/supabase-smoke.js
// Espera: validar_pro_chave e validar_pro_codigo respondendo booleans (false para
// um valor sentinela que nunca foi cadastrado). Se der 404/erro, o backend caiu
// ou o schema não foi aplicado.

const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '..', 'one-take-studio', 'supabase.js'), 'utf8');
const urlMatch = src.match(/SUPA_URL = '([^']+)'/);
const keyMatch = src.match(/SUPA_ANON_KEY = '([^']+)'/);
if (!urlMatch || !keyMatch) {
  console.error('Config não encontrada em one-take-studio/supabase.js');
  process.exit(1);
}
const SUPA_URL = urlMatch[1];
const SUPA_ANON_KEY = keyMatch[1];

// Valor sentinela que nunca será cadastrado: só testa se o endpoint existe e responde.
const SENTINEL = 'ZZZZZZZZZZZZZZZZZZZZZZZZ';

async function rpc(name, body) {
  const res = await fetch(SUPA_URL + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: { apikey: SUPA_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(name + ' HTTP ' + res.status + ': ' + (await res.text()));
  return res.json();
}

async function main() {
  const chave = await rpc('validar_pro_chave', { p_chave: SENTINEL });
  const codigo = await rpc('validar_pro_codigo', { p_codigo: SENTINEL });
  console.log('validar_pro_chave  ->', chave, '(esperado false)');
  console.log('validar_pro_codigo ->', codigo, '(esperado false)');
  if (chave !== false || codigo !== false) {
    console.error('FALHOU: resposta inesperada do backend');
    process.exit(1);
  }
  console.log('Backend Supabase OK: RPCs no ar.');
}

main().catch((e) => {
  console.error('FALHOU:', e.message);
  process.exit(1);
});
