import qrcode
import os
import csv
import re
from PIL import Image

# Pasta base onde os QR Codes são salvos (criada automaticamente)
PASTA_BASE = os.path.join(os.path.dirname(__file__), "qrcodes")


def gerar_qr(url, nome_arquivo, pasta_destino, box_size=14, error_correction=None):
    """Gera um QR Code para uma URL e salva como {nome_arquivo}.png na pasta.

    box_size maior = módulos maiores = mais fácil de ler no celular.
    ERROR_CORRECT_M deixa o QR menos denso que o H (mais legível para URLs longas).
    """
    if error_correction is None:
        error_correction = qrcode.constants.ERROR_CORRECT_M
    qr = qrcode.QRCode(
        version=None,
        error_correction=error_correction,
        box_size=box_size,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    if not os.path.exists(pasta_destino):
        os.makedirs(pasta_destino)

    img = qr.make_image(fill_color="black", back_color="white")
    caminho_completo = os.path.join(pasta_destino, f"{nome_arquivo}.png")
    img.save(caminho_completo)
    print(f"QR gerado: {caminho_completo}")
    return caminho_completo


# ---------------------------------------------------------------------------
# Certificados (funcionalidade original)
# ---------------------------------------------------------------------------
def gerar_qr_obra(token_com_prefixo, pasta_destino):
    """Gera QR Code para um token com prefixo e salva na pasta correta."""
    url = f"https://www.leob.com.br/pages/visualizar-certificado.html?token={token_com_prefixo}"
    gerar_qr(url, token_com_prefixo, pasta_destino)


def gerar_qrs_para_serie(nome_serie, prefixo):
    """Gera QR Codes para uma série completa."""
    pasta_serie = os.path.join(os.path.dirname(__file__), "..", nome_serie)
    pasta_serie = os.path.normpath(pasta_serie)

    print(f"\nGerando QR Codes para a série: {nome_serie}")
    for i in range(1, 31):
        token_com_prefixo = f"{prefixo}_lb-2026-{str(i).zfill(3)}"
        gerar_qr_obra(token_com_prefixo, pasta_serie)


# ---------------------------------------------------------------------------
# Links do projeto (Take Um Studio)
# ---------------------------------------------------------------------------
# "nome" vira o nome do arquivo .png; "url" é o destino do QR; "pasta" é a subpasta.
LINKS = [
    {
        "nome": "site",
        "url": "https://www.takeumstudio.com.br",
        "pasta": "site",
    },
    {
        "nome": "site-venda",
        "url": "https://www.takeumstudio.com.br/venda.html",
        "pasta": "site",
    },
    {
        "nome": "site-pro",
        "url": "https://www.takeumstudio.com.br/pro.html",
        "pasta": "site",
    },
    {
        "nome": "site-resgatar",
        "url": "https://www.takeumstudio.com.br/resgatar.html",
        "pasta": "site",
    },
    {
        "nome": "site-sobre",
        "url": "https://www.takeumstudio.com.br/sobre.html",
        "pasta": "site",
    },
    {
        "nome": "checkout-take-um-pro",
        "url": "https://pay.hotmart.com/R106999212F",
        "pasta": "venda",
    },
    {
        "nome": "checkout-take-um-pro-promo",
        "url": "https://pay.hotmart.com/R106999212F?off=5ge3itbn",
        "pasta": "venda",
    },
    {
        "nome": "afiliado-convite",
        "url": "https://affiliate.hotmart.com/affiliate-recruiting/view/5815T106999233",
        "pasta": "afiliados",
    },
    {
        "nome": "afiliado-convite-utm",
        "url": "https://affiliate.hotmart.com/affiliate-recruiting/view/5815T106999233?utm_source=affiliates&utm_medium=direct&utm_campaign=hotmart_recruiting",
        "pasta": "afiliados",
    },
]


def gerar_qrs_links(links=None, pasta_base=PASTA_BASE):
    """Gera QR Codes para uma lista de {nome, url, pasta}."""
    for link in links or LINKS:
        pasta_destino = os.path.join(pasta_base, link["pasta"])
        gerar_qr(link["url"], link["nome"], pasta_destino)


def gerar_qrs_do_sitemap(caminho_sitemap=None, pasta_destino=os.path.join(PASTA_BASE, "site")):
    """Gera QR Codes para todas as URLs do sitemap.xml (todas as páginas do site)."""
    if caminho_sitemap is None:
        caminho_sitemap = os.path.join(os.path.dirname(__file__), "one-take-studio", "sitemap.xml")
    if not os.path.exists(caminho_sitemap):
        print(f"Sitemap não encontrado: {caminho_sitemap}")
        return

    print(f"\nGerando QR Codes a partir do sitemap: {caminho_sitemap}")
    with open(caminho_sitemap, encoding="utf-8") as f:
        conteudo = f.read()

    urls = re.findall(r"<loc>(https?://[^<]+)</loc>", conteudo)
    for url in urls:
        # nome do arquivo: remove protocolo e transforma em caminho seguro
        nome = url.replace("https://", "").replace("http://", "")
        nome = re.sub(r"[^a-zA-Z0-9_.-]+", "-", nome).strip("-")
        gerar_qr(url, nome, pasta_destino)


def gerar_qrs_afiliados_csv(caminho_csv=None, pasta_destino=os.path.join(PASTA_BASE, "afiliados")):
    """Gera QR Codes para cada afiliado a partir do CSV (AFF_ID, NAME, EMAIL, CHANNEL, PERSONAL_LINK)."""
    if caminho_csv is None:
        caminho_csv = os.path.join(os.path.dirname(__file__), "venda-hotmart", "affiliates-links.csv")
    if not os.path.exists(caminho_csv):
        print(f"CSV de afiliados não encontrado: {caminho_csv}")
        return

    print(f"\nGerando QR Codes para afiliados a partir de: {caminho_csv}")
    with open(caminho_csv, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            nome = row.get("AFF_ID") or f"afiliado-{row.get('NAME', '')}".strip()
            gerar_qr(row["PERSONAL_LINK"], nome, pasta_destino)


if __name__ == "__main__":
    # 1. QR Codes dos links principais (site, venda, checkout, afiliados)
    gerar_qrs_links()

    # 2. QR Codes de todas as páginas do site (via sitemap.xml)
    gerar_qrs_do_sitemap()

    # 3. QR Codes individuais por afiliado (via CSV)
    gerar_qrs_afiliados_csv()

    # 4. Séries de certificados (descomente para reativar)
    # series = [
    #     {
    #         "nome": "MARKETING",
    #         "prefixo": "MAR"
    #     }
    # ]
    # for serie in series:
    #     gerar_qrs_para_serie(serie["nome"], serie["prefixo"])

    print("\nTodos os QR Codes gerados com sucesso!")
