# 🎬 Take Um Studio

Ferramentas gratuitas, em português, para quem **grava e organiza vídeo sozinho** — direto no navegador, sem instalar nada.

> **Site publicado:** https://www.takeumstudio.com.br/

Leia seu roteiro sem decorar, planeje suas pautas, marque seus takes e publique como numa produção de verdade. Tudo roda localmente no seu navegador e **seus dados ficam só com você**.

---

## ✨ O que tem no estúdio

| Etapa | Ferramenta | O que faz |
|---|---|---|
| 🆕 **Novo aqui** | **Primeiro Vídeo** (`ferramentas/jornada.html`) | Trilha guiada da ideia até o primeiro vídeo publicado |
| 🗓 **Planejar** | **Painel de Pauta** (`ferramentas/painel-pauta.html`) | Quadro de ideias por etapas: ideia → roteiro → gravado → editado → postado |
| | **Calendário de Conteúdo** (`ferramentas/calendario.html`) | Planeje o mês e acompanhe as etapas de cada vídeo |
| | **Roteirizador** (`ferramentas/roteirizador.html`) | Roteiro em etapas: gancho, problema, solução com tempos e CTA |
| | **Banco de Ideias** (`ferramentas/banco-ideias.html`) | Capture ideias na hora e envie para o Painel de Pauta |
| 🎥 **Gravar** | **Teleprompter** (`ferramentas/teleprompter.html`) | Roteiro rolando na tela, com câmera e gravação no navegador |
| | **Claquete Digital** (`ferramentas/claquete-digital.html`) | Contagem regressiva, bate-claquete com som e cronômetro de take |
| | **Checklist de Gravação** (`ferramentas/checklist-gravacao.html`) | Bateria, microfone, luz, isolamento — nunca mais esqueça nada |
| 🚀 **Publicar** | **Gerador de Capa** (`ferramentas/capa.html`) | Capa 16:9 (e 9:16 vertical via `?vt=1`) para baixar em PNG/JPG/WebP — texto, emoji, foto do rosto e imagem de fundo arrastáveis, com redimensionar, desfazer/refazer (Ctrl+Z), guias de alinhamento com ímã e safe-zone |
| | **Checklist de Divulgação** (`ferramentas/checklist-divulgacao.html`) | O que fazer depois de publicar |
| | **Pack de Publicação** (`ferramentas/pack-publicacao.html`) | Título, descrição, tags e melhor horário — com IA ou sem |
| | **Tracker de Resultados** (`ferramentas/tracker-resultados.html`) | Views, likes e comentários com insights por plataforma |
| 📚 **Aprender & apoiar** | **Equipamentos** (`ferramentas/equipamentos.html`) | Guia de equipamentos com ótimo custo-benefício |
| | **Guia** (`guias/guia.html` + guias de vídeo, microfone e iluminação) | Aprenda na prática a gravar o primeiro vídeo |
| | **Blog** (`blog/`) | Artigos sobre o mercado de criadores e criação de vídeo solo |
| ⚙️ **Ajustes** | **Configuração da IA** (`ferramentas/ia-config.html`) | Cole sua chave do Google Gemini para roteirizar e gerar descrições |

---

## 🔒 Seus dados

- **Local-first:** todos os dados ficam no **IndexedDB** do seu navegador (`OneTakeDB`, versão 7). Nada é enviado para servidores.
- **Backup:** exporte um arquivo `.json` com tudo (roteiros, pautas, takes) e restaure em outro aparelho. Os botões ficam na seção **"Seus dados"** da barra lateral (e na home).
- **IA opcional:** a chave do Gemini fica só no seu navegador e é usada direto na API do Google — não passa por servidor intermediário.

---

## 🎟 Plano grátis e Take Um Pro

- **Uso grátis:** cada ferramenta paga de IA/geração tem um limite de criações gratuitas (`limite.js`), com contador no topo e aviso de upsell ao atingir o limite.
- **E-mails capturados** no aviso de limite ficam gravados no IndexedDB e, se o backend estiver configurado, também vão para a nuvem — todos os visitantes. Página admin `ferramentas/leads.html` (fora do menu público) mostra os locais e, com login, os da nuvem; exporta CSV.
- **Take Um Pro:** uma chave (válida via `chave-core.js`) desbloqueia criações ilimitadas. A chave é resgatada na página `resgatar.html` e ativada no aviso de upsell ou em `pro.html`.

### Backend de leads (opcional, Supabase)

O site continua 100% estático — quando você configura o Supabase, as chamadas vão direto à REST API (sem SDK). Para ativar:

1. Crie um projeto em supabase.com (plano grátis) e rode `one-take-studio/supabase-schema.sql` no SQL Editor (cria a tabela `leads` com RLS: anon só insere, autenticado lê/exclui).
2. Em **Settings → API**, copie o Project URL e a anon key para `one-take-studio/supabase.js` (`SUPA_URL` / `SUPA_ANON_KEY`).
3. Crie seu usuário admin em **Authentication → Users → Add user** e use-o para entrar em `ferramentas/leads.html` e ver os leads da nuvem.

---

## 🛠 Stack

- **100% estático:** HTML + CSS + JavaScript puro, sem frameworks e sem build.
- **PWA:** `manifest.json` + `sw.js` (service worker) para instalar no celular e funcionar offline.
- **Fontes self-hosted** (`fonts.css` + `fonts/*.woff2`): Archivo (variável, pesos 500–900) e IBM Plex Mono — sem dependência de CDN de terceiros.
- **Captura de e-mails:** FormSubmit (newsletter em `newsletter-obrigado.html` e leads do upsell).

---

## 🚀 Rodando localmente

Qualquer servidor estático serve. Ex.:

```bash
cd one-take-studio
python -m http.server 8080
# abra http://localhost:8080
```

> O service worker e o `indexedDB` funcionam melhor com `localhost` ou HTTPS (Vercel já é HTTPS).

---

## 📦 Deploy

O site é publicado automaticamente na **Vercel** (projeto conectado ao repositório, com root directory `one-take-studio`). Todo `push` para `master` gera um preview e publica em produção em:

```
https://www.takeumstudio.com.br/
```

Para publicar:

```bash
git add -A
git commit -m "sua mudança"
git push
```

> O workflow legado `.github/workflows/deploy.yml` (GitHub Actions → gh-pages) e o script `scripts/deploy.ps1` (`npm run deploy`) ficaram como backup — o deploy atual é pela Vercel.

> **Atenção:** quando mudar `index.html`, `sw.js` ou qualquer asset precacheado, **bump a versão** do cache no topo do `sw.js` (ex.: `const CACHE = 'takeum-v37'`) para os usuários receberem a versão nova.

---

## 📁 Estrutura

```
setup-leob/
├── vercel.json                   # config estática Vercel (headers de cache)
└── one-take-studio/               # o site (PWA) — root directory na Vercel
    ├── index.html                 # shell: sidebar + home
    ├── db.js                      # IndexedDB (OneTakeDB) + backup
    ├── ia.js                      # integração Google Gemini
    ├── limite.js                  # uso grátis, upsell e captura de leads
    ├── supabase.js                # backend de leads (REST, opcional)
    ├── chave-core.js              # validação da chave Take Um Pro
    ├── analytics.js               # rastreio de uso
    ├── sw.js                      # service worker (precache/offline)
    ├── fonts.css + fonts/         # fontes self-hosted
    ├── icons/ + image/            # ícones e imagens do PWA
    ├── blog/                      # artigos de blog
    ├── ferramentas/               # ferramentas (uma página por ferramenta)
    │   └── leads.html             # admin: leads capturados + export CSV
    ├── guias/                     # guias de aprendizado
    ├── sitemap.xml / robots.txt
    └── sobre.html + newsletter-obligado.html
```

---

## ⚡ Performance

O site é otimizado para PageSpeed (score ~99–100 mobile/desktop):

- Fonte Archivo como **variável única** (1 arquivo cobre 500–900, sem duplicatas)
- `preload` das fontes críticas
- `content-visibility` nas seções abaixo da dobra (reduz o trabalho de layout)
- Nav e grid de ferramentas **estáticos no HTML** (zero layout shift / CLS)
- gzip no GitHub Pages + service worker com cache-first
