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

## Regerar o topo pré-renderizado
Sempre que mudar o hero, o cabeçalho ou a barra do topo:

    cd tools && npm i && node prerender.mjs

(precisa de Chrome/Chromium; use `CHROME_PATH=/caminho/do/chrome` se não estiver em `/opt/pw-browsers`).

## Ao exportar uma nova versão do Claude Design
Peça para reaplicar os itens 1–6 acima (ou rode a ferramenta e refaça o resto): o export traz de volta o `<helmet>` com
SEO e CSS, o unpkg e o popup.

## Subir na Hostinger
Só estes itens, dentro de `public_html/divorcio-sao-paulo/`: `index.html`, `support.js`, `mapa-sp.js`, `robots.txt`,
`sitemap.xml`, `.htaccess`, `vendor/` e `uploads/`. **Não** subir `docs/`, `tools/` nem `apps-script/`.
