# Bônus incluso no Take Um Pro — Guia de Planejamento (PDF)

O **Guia de Planejamento de 90 dias** virou **bônus incluso na compra do Take Um Studio Pro** —
não é um produto separado na Hotmart e não existe Order Bump.

## Como o comprador recebe o guia

1. **Na entrega da Hotmart** (principal): o PDF vai junto no conteúdo do produto
   *Take Um Studio Pro — Licença Vitalícia* (como arquivo extra do produto, ao lado
   do ZIP `Entrega-TakeUm-Pro.zip`).
2. **No site**: com o Pro ativo, o guia também abre em
   `one-take-studio/guias/guia-planejamento.html` (página com bloqueio: só mostra o
   conteúdo para quem tem chave Pro ativa no navegador).

## Como gerar o PDF (uma vez, e quando atualizar)

1. Abra `one-take-studio/guias/guia-planejamento.html` com o **Pro ativo** no navegador.
2. `Ctrl+P` → Destino **Salvar como PDF** → marque **Imprimir segundo plano** (gráficos) → salve.
3. Na Hotmart → produto Take Um Pro → aba **Conteúdo** → adicione o PDF gerado como
   arquivo de entrega (o ZIP `Entrega-TakeUm-Pro.zip` já tem o `INSTRUCOES.txt` com a
   menção ao bônus).

## Mudanças feitas no site

- `one-take-studio/venda.html` — seção **"Bônus incluso"** abaixo do card de preço
  (sem produto separado, sem Order Bump).
- `one-take-studio/pro.html` — card **"Bônus do Pro"** com link para o guia.
- `one-take-studio/guias/guia.html` — card do guia na listagem (marcado como bônus do Pro).
- `one-take-studio/guias/guia-planejamento.html` — a página do guia (fonte do PDF).
- `one-take-studio/sitemap.xml` — nova URL indexada.
- `venda-hotmart/INSTRUCOES.txt` — menção ao bônus no arquivo do ZIP de entrega.

## Teste rápido

1. Sem Pro ativo: `guia-planejamento.html` mostra o bloqueio + CTA para a venda.
2. Com chave Pro ativada: o guia aparece e imprime em PDF.
3. Compra de teste na Hotmart: o PDF do guia chega na entrega junto do ZIP.
