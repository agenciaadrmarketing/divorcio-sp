# Como a LP é montada (e como manter a velocidade)

A página nasce de um template (`<x-dc>` + lógica) que o `support.js` + React montam no navegador. Isso é lento no
celular, então o `index.html` de produção tem ajustes que **se perdem** se você exportar uma versão nova do Claude Design.

## O que o `index.html` de produção tem a mais
1. **SEO no `<head>` real**: title, description, canonical, Open Graph, JSON-LD (no export vêm dentro de `<helmet>`).
2. **CSS no `<head>`** (bloco `CSS:START … CSS:END`), não dentro de `<helmet>`.
3. **React/ReactDOM/Lenis/d3 hospedados em `vendor/`** (o export usa o unpkg.com).
4. **Topo pré-renderizado** (bloco `SNAP:START … SNAP:END`): barra, cabeçalho e hero já no HTML; o React adota esses nós
   (`SNAP-TAKEOVER` em `componentDidMount`). É isso que mantém o LCP baixo no celular.
5. Carregador que só monta o React depois da primeira pintura (script inline no `<head>`).
6. Botões direto para o WhatsApp (sem popup/formulário) e `mapa-sp.js` que só baixa o d3/IBGE quando o mapa chega perto da tela.
7. **GTM sob demanda**: o Google Tag Manager (e o que ele carrega: Google Ads, GA4, Pixel do Facebook) pesa ~700 KB e ~1 s de
   CPU. Ele carrega na primeira interação do visitante (rolar/tocar/clicar/teclar) ou 5 s após o carregamento. Constante
   `GTM_ATRASO_MS` no começo do `index.html` (0 = carregar na hora, como antes). Todo clique em botão de WhatsApp também
   vira o evento `whatsapp_click` no `dataLayer` (crie um acionador "Evento personalizado: whatsapp_click" no GTM).
8. **`loading="lazy"` antes do `src`** em todas as imagens do template: com `src` primeiro o Chrome ignora o lazy em
   imagens criadas pelo React e baixa tudo no carregamento.
9. Imagens redimensionadas/comprimidas; fundos decorativos (opacidade 5–7%) usam versões `-bg.webp` minúsculas; logo do
   cabeçalho em `-380.webp`.
10. URLs (canonical, Open Graph, sitemap, robots, schema) apontam para o subdomínio `divorcio-sp.vieiraemarquesadvogados.com`.

## Regerar o topo pré-renderizado
Sempre que mudar o hero, o cabeçalho ou a barra do topo:

    cd tools && npm i && node prerender.mjs

(precisa de Chrome/Chromium; use `CHROME_PATH=/caminho/do/chrome` se não estiver em `/opt/pw-browsers`).

## Ao exportar uma nova versão do Claude Design
Peça para reaplicar os itens 1–10 acima (ou rode a ferramenta e refaça o resto): o export traz de volta o `<helmet>` com
SEO e CSS, o unpkg e o popup.

## Subir na Hostinger
Só estes itens, na pasta do subdomínio `divorcio-sp` (a raiz de `divorcio-sp.vieiraemarquesadvogados.com`): `index.html`, `support.js`, `mapa-sp.js`, `robots.txt`,
`sitemap.xml`, `.htaccess`, `vendor/` e `uploads/`. **Não** subir `docs/`, `tools/` nem `apps-script/`.
