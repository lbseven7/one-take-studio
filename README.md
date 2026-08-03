# 🎬 Take Um Studio

Ferramentas gratuitas, em português, para quem **grava e organiza vídeo sozinho** — direto no navegador, sem instalar nada.

> **Site publicado:** https://lbseven7.github.io/one-take-studio/

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
| 🚀 **Publicar** | **Gerador de Capa** (`ferramentas/capa.html`) | Capa 16:9 pronta para baixar em PNG |
| | **Capa Vertical** (`ferramentas/capa-vertical.html`) | Capa 9:16 para Shorts e Reels, com área segura |
| | **Checklist de Divulgação** (`ferramentas/checklist-divulgacao.html`) | O que fazer depois de publicar |
| | **Pack de Publicação** (`ferramentas/pack-publicacao.html`) | Título, descrição, tags e melhor horário — com IA ou sem |
| | **Tracker de Resultados** (`ferramentas/tracker-resultados.html`) | Views, likes e comentários com insights por plataforma |
| 📚 **Aprender & apoiar** | **Equipamentos** (`ferramentas/equipamentos.html`) | Guia de equipamentos com ótimo custo-benefício |
| | **Guia** (`guias/guia.html` + guias de vídeo, microfone e iluminação) | Aprenda na prática a gravar o primeiro vídeo |
| | **Blog** (`blog/`) | Artigos sobre o mercado de criadores e criação de vídeo solo |
| ⚙️ **Ajustes** | **Configuração da IA** (`ferramentas/ia-config.html`) | Cole sua chave do Google Gemini para roteirizar e gerar descrições |

---

## 🔒 Seus dados

- **Local-first:** todos os dados ficam no **IndexedDB** do seu navegador (`OneTakeDB`, versão 6). Nada é enviado para servidores.
- **Backup:** exporte um arquivo `.json` com tudo (roteiros, pautas, takes) e restaure em outro aparelho. Os botões ficam na seção **"Seus dados"** da barra lateral (e na home).
- **IA opcional:** a chave do Gemini fica só no seu navegador e é usada direto na API do Google — não passa por servidor intermediário.

---

## 🛠 Stack

- **100% estático:** HTML + CSS + JavaScript puro, sem frameworks e sem build.
- **PWA:** `manifest.json` + `sw.js` (service worker) para instalar no celular e funcionar offline.
- **Fontes self-hosted** (`fonts.css` + `fonts/*.woff2`): Archivo (variável, pesos 500–900) e IBM Plex Mono — sem dependência de CDN de terceiros.
- **Newsletter:** formulário via FormSubmit (página `newsletter-obrigado.html`).

---

## 🚀 Rodando localmente

Qualquer servidor estático serve. Ex.:

```bash
cd one-take-studio
python -m http.server 8080
# abra http://localhost:8080
```

> O service worker e o `indexedDB` funcionam melhor com `localhost` ou HTTPS (GitHub Pages já é HTTPS).

---

## 📦 Deploy

O deploy é automático via **GitHub Actions** (`.github/workflows/deploy.yml`): todo `push` para `master` (ou `new-feat`) publica o conteúdo de `one-take-studio/` na branch `gh-pages` (pasta `docs`), que serve o site em:

```
https://<seu-usuario>.github.io/one-take-studio/
```

Para publicar:

```bash
git add -A
git commit -m "sua mudança"
git push
```

> **Atenção:** quando mudar `index.html`, `sw.js` ou qualquer asset precacheado, **bump a versão** do cache no topo do `sw.js` (ex.: `const CACHE = 'takeum-v26'`) para os usuários receberem a versão nova.

---

## 📁 Estrutura

```
setup-leob/
├── .github/workflows/deploy.yml   # GitHub Actions → gh-pages
└── one-take-studio/               # o site (PWA)
    ├── index.html                 # shell: sidebar + home
    ├── db.js                      # IndexedDB (OneTakeDB) + backup
    ├── ia.js                      # integração Google Gemini
    ├── sw.js                      # service worker (precache/offline)
    ├── fonts.css + fonts/         # fontes self-hosted
    ├── icons/ + image/            # ícones e imagens do PWA
    ├── blog/                      # artigos de blog
    ├── ferramentas/               # ferramentas (uma página por ferramenta)
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
