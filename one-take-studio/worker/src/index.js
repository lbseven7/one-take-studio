/*
 * Take Um Studio Pro — Worker de entrega de chaves de ativação
 *
 * Fluxo:
 *   Stripe (checkout.session.completed)  ->  POST /stripe-webhook  ->  gera chave
 *   TAKEUM-XXXX-XXXX-XXXX, guarda no KV e envia por e-mail via Resend.
 *
 * Endpoints:
 *   POST /stripe-webhook   (webhook do Stripe, assinatura verificada)
 *   GET  /validate?key=K   (retorna se a chave existe e o e-mail dela — para fase 2)
 *
 * Secrets (no Cloudflare):
 *   STRIPE_WEBHOOK_SECRET  -> whsec_... (Stripe > Developers > Webhooks)
 *   RESEND_API_KEY         -> re_... (Resend > API Keys)
 *
 * Variável (pode ficar em [vars] do wrangler.toml ou como secret):
 *   EMAIL_FROM             -> "Take Um Studio <no-reply@seudominio.com.br>"
 */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

/* ---------- geração de chave ---------- */
function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const rand = (n) => {
    const a = new Uint32Array(n);
    crypto.getRandomValues(a);
    return Array.from(a, (x) => chars[x % 36]).join('');
  };
  return 'TAKEUM-' + rand(4) + '-' + rand(4) + '-' + rand(4);
}

/* ---------- verificação de assinatura do Stripe (HMAC-SHA256) ---------- */
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifyStripeSignature(secret, payload, header) {
  if (!secret || !header) return false;
  const parts = {};
  header.split(',').forEach((item) => {
    const idx = item.indexOf('=');
    if (idx > 0) parts[item.slice(0, idx).trim()] = item.slice(idx + 1).trim();
  });
  const timestamp = parts['t'];
  const signature = parts['v1'];
  if (!timestamp || !signature) return false;

  // Proteção contra replay: rejeita assinaturas com mais de 5 minutos
  const t = Number(timestamp);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(t) || Math.abs(now - t) > 300) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(timestamp + '.' + payload)
  );
  const hex = Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, '0')).join('');
  return timingSafeEqual(hex, signature);
}

/* ---------- e-mail via Resend ---------- */
async function sendKeyEmail(env, email, key) {
  const html =
    '<div style="font-family:Arial,Helvetica,sans-serif;background:#0a0a0c;color:#f5f4ef;padding:32px;border-radius:12px;max-width:520px">' +
    '<p style="font-size:16px;margin:0 0 16px">Olá! 🎬</p>' +
    '<p style="font-size:14px;line-height:1.7;color:#b9b9c1;margin:0 0 20px">Sua assinatura do <strong style="color:#f5f4ef">Take Um Studio Pro</strong> está confirmada. ' +
    'Guarde esta chave — é com ela que você ativa o Pro:</p>' +
    '<div style="background:#141417;border:1px solid #ffb020;border-radius:8px;padding:16px;text-align:center;' +
    'font-family:monospace;font-size:20px;letter-spacing:2px;color:#ffb020;margin:0 0 22px">' + key + '</div>' +
    '<p style="font-size:14px;color:#b9b9c1;margin:0 0 8px"><strong style="color:#f5f4ef">Como ativar:</strong></p>' +
    '<ol style="font-size:13px;line-height:1.8;color:#b9b9c1;margin:0 0 24px;padding-left:20px">' +
    '<li>Abra o <a href="https://lbseven7.github.io/one-take-studio/" style="color:#ffb020">Take Um Studio</a> no celular ou computador</li>' +
    '<li>Na barra lateral, encontre o bloco <strong style="color:#f5f4ef">Plano Pro</strong></li>' +
    '<li>Cole a chave acima e toque em <strong style="color:#f5f4ef">Ativar</strong></li>' +
    '</ol>' +
    '<p style="font-size:12px;color:#8a8a92;margin:0">Com o Pro você desbloqueia a gravação no teleprompter e itens ilimitados.</p>' +
    '</div>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + env.RESEND_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: email,
      subject: 'Sua chave de ativação do Take Um Studio Pro',
      html
    })
  });
  return res;
}

/* ---------- pagamento confirmado ---------- */
async function handlePaidSession(session, env) {
  const email = (session.customer_details && session.customer_details.email) || session.customer_email;
  if (!email) return { ok: false, reason: 'sem e-mail' };

  // Idempotência: se este checkout já recebeu chave (e-mail enviado com sucesso), não envia de novo
  const already = await env.KEYS.get('session:' + session.id);
  if (already) return { ok: true, duplicate: true };

  const key = generateKey();

  // Envia o e-mail PRIMEIRO e só persiste depois do sucesso: se o envio falhar,
  // retornamos 500 e o Stripe reenvia o webhook (sem pular por causa do marcador).
  const res = await sendKeyEmail(env, email, key);
  if (!res.ok) {
    return { ok: false, reason: 'email-error', status: res.status, key };
  }

  const record = JSON.stringify({
    key,
    email,
    session: session.id,
    customer: session.customer || null,
    createdAt: new Date().toISOString()
  });
  await env.KEYS.put('key:' + key, record);
  await env.KEYS.put('session:' + session.id, key);

  return { ok: true, email, key };
}

/* ---------- handler principal ---------- */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ---- POST /stripe-webhook ----
    if (url.pathname === '/stripe-webhook') {
      if (request.method !== 'POST') return json({ error: 'metodo invalido' }, 405);

      const payload = await request.text();
      const header = request.headers.get('Stripe-Signature') || '';
      const valid = await verifyStripeSignature(env.STRIPE_WEBHOOK_SECRET, payload, header);
      if (!valid) return json({ error: 'assinatura invalida' }, 400);

      let event;
      try {
        event = JSON.parse(payload);
      } catch (e) {
        return json({ error: 'payload invalido' }, 400);
      }

      // Cartão: checkout.session.completed com payment_status paid.
      // Pix (método assíncrono): checkout.session.async_payment_succeeded quando o
      // pagamento realmente completa (o completed vem antes, com payment_status unpaid).
      const session = event.data.object || {};
      const isPaidCard = event.type === 'checkout.session.completed' && session.payment_status === 'paid';
      const isPixPaid = event.type === 'checkout.session.async_payment_succeeded';

      if (isPaidCard || isPixPaid) {
        const result = await handlePaidSession(session, env);
        // Falha no envio do e-mail -> 500 para o Stripe reenviar o webhook
        if (result && result.reason === 'email-error') {
          return json({ error: 'falha no envio do e-mail', status: result.status }, 500);
        }
      }

      return json({ received: true });
    }

    // ---- GET /validate?key=TAKEUM-... (fase 2: validação no servidor) ----
    if (url.pathname === '/validate' && request.method === 'GET') {
      const key = (url.searchParams.get('key') || '').trim().toUpperCase();
      if (!key) return json({ ok: false, error: 'informe ?key=' }, 400);
      const record = await env.KEYS.get('key:' + key);
      if (!record) return json({ ok: false });
      const data = JSON.parse(record);
      return json({ ok: true, email: data.email, createdAt: data.createdAt });
    }

    return json({ ok: true, service: 'takeum-pro-keys' });
  }
};
