# Worker de entrega de chaves do Plano Pro

Quando alguém paga o Take Um Studio Pro, este Worker:
1. Recebe o webhook do Stripe (`checkout.session.completed`)
2. Verifica a assinatura do Stripe (seguro)
3. Gera uma chave única `TAKEUM-XXXX-XXXX-XXXX`
4. Guarda a chave no KV (Cloudflare) — pronta para validação na fase 2
5. Envia a chave por e-mail ao cliente automaticamente (via Resend)

---

## Passo 1 — Criar o Worker na Cloudflare (grátis)

1. Crie a conta em **https://dash.cloudflare.com/sign-up** (grátis, não precisa cartão)
2. Menu **Workers & Pages → Create → Create Worker**
3. Nome: `takeum-pro-keys` → **Deploy** (vem com o "Hello World")
4. **Edit code** → apague o código e cole o conteúdo de `worker/src/index.js` → **Save and deploy**
5. Anote a URL do Worker: `https://takeum-pro-keys.<seu-subdominio>.workers.dev`

## Passo 2 — Criar o KV (guarda as chaves)

1. No Worker criado, aba **Settings → KV Namespace Bindings → Add binding**
2. Nome da variável: `KEYS` (obrigatório ser exatamente `KEYS`)
3. Em "Create a namespace", digite `takeum-keys` → salve
   *(Se preferir pela linha de comando: `npx wrangler kv namespace create KEYS` e coloque o id no `wrangler.toml`)*

## Passo 3 — Variáveis e secrets do Worker

Na aba **Settings → Variables and Secrets**:

| Tipo | Nome | Valor |
|---|---|---|
| Text (variável) | `EMAIL_FROM` | `Take Um Studio <no-reply@seudominio.com.br>` |
| Secret | `RESEND_API_KEY` | `re_...` (do Passo 4) |
| Secret | `STRIPE_WEBHOOK_SECRET` | `whsec_...` (do Passo 5) |

## Passo 4 — Resend (envio de e-mail, grátis)

1. Crie a conta em **https://resend.com** (plano grátis: ~3.000 e-mails/mês)
2. **Domains → Add Domain** → verifique o DNS do seu domínio (SPF/DKIM)
   - *Para testar antes de ter domínio: pode usar `onboarding@resend.dev` no `EMAIL_FROM` (só entrega para o seu próprio e-mail)*
3. **API Keys → Create API Key** → copie o `re_...`

## Passo 5 — Webhook no Stripe

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://takeum-pro-keys.<seu-subdominio>.workers.dev/stripe-webhook`
3. Evento a escutar: **`checkout.session.completed`**
4. **Add endpoint** → abra o endpoint criado → **Signing secret** → copie o `whsec_...`
5. Clique em **"Send test event"** (evento `checkout.session.completed`) para testar de graça

## Passo 6 — Testar de ponta a ponta

1. Envie um **test event** no painel do Stripe (Passo 5) ou pague com cartão de teste `4242 4242 4242 4242`
2. Veja se a chave chega no e-mail
3. Confira no KV (aba KV do Worker) que a chave foi guardada
4. Teste a validação: `GET https://takeum-pro-keys.<subdominio>.workers.dev/validate?key=TAKEUM-XXXX-XXXX-XXXX`

---

## Opcional: deploy pela linha de comando (wrangler)

```bash
cd worker
npm i -g wrangler        # ou: npx wrangler
npx wrangler login
npx wrangler kv namespace create KEYS   # copie o id para o wrangler.toml
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler deploy
```

## Endpoints do Worker

- `POST /stripe-webhook` — webhook do Stripe (assinatura verificada)
- `GET /validate?key=TAKEUM-...` — confirma se a chave existe (fase 2: validação no servidor)
