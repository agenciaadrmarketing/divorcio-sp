// Gera o "topo pré-renderizado" da LP e grava em index.html.
//
// Por quê: a página é montada no navegador (React). Sem isso, o hero só aparece depois de baixar e
// executar o JavaScript, o que domina o LCP/FCP no celular. Aqui renderizamos a página uma vez no
// Chrome, copiamos a barra do topo + cabeçalho + hero já prontos e embutimos no HTML. O React assume
// quando termina de montar e adota esses mesmos nós (sem piscar, sem reiniciar animações).
//
// Uso (na raiz do projeto):   cd tools && npm i && node prerender.mjs
// Rode de novo sempre que o hero, o cabeçalho ou a barra do topo mudarem (ou após exportar uma nova
// versão do Claude Design).
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdtempSync, cpSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = join(root, 'index.html');
const START = '<!-- SNAP:START -->';
const END = '<!-- SNAP:END -->';
const CHROME = process.env.CHROME_PATH
  || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium']
    .find((p) => existsSync(p));
if (!CHROME) throw new Error('Defina CHROME_PATH apontando para o Chrome/Chromium.');

let html = readFileSync(indexPath, 'utf8');
// 1) versão sem o topo estático, para o Chrome ver só o que o React renderiza
const semSnap = html.replace(new RegExp(`${START}[\\s\\S]*?${END}\\n?`), '');

// 2) copia temporária servida por file:// (sem rede: o React vem de vendor/)
const tmp = mkdtempSync(join(tmpdir(), 'prerender-'));
for (const f of ['support.js', 'mapa-sp.js', 'vendor', 'uploads']) cpSync(join(root, f), join(tmp, f), { recursive: true });
writeFileSync(join(tmp, 'index.html'), semSnap);

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--allow-file-access-from-files'] });
try {
  const page = await browser.newPage({ viewport: { width: 412, height: 823 } });
  await page.goto(pathToFileURL(join(tmp, 'index.html')).href, { waitUntil: 'load' });
  await page.waitForSelector('#dc-root .sc-host > div > section.hero-sec', { timeout: 15000 });
  await page.waitForTimeout(500);

  const snap = await page.evaluate(() => {
    const wrap = document.querySelector('#dc-root .sc-host > div');
    const hero = wrap.querySelector(':scope > section.hero-sec');
    const partes = [];
    for (const el of wrap.children) { partes.push(el); if (el === hero) break; }
    const limpa = (n) => {
      const c = n.cloneNode(true);
      [c, ...c.querySelectorAll('*')].forEach((e) => {
        [...e.attributes].forEach((a) => { if (/^data-(dc|sc)/.test(a.name)) e.removeAttribute(a.name); });
        e.classList.remove('reveal', 'reveal-solo', 'in');
        if (!e.getAttribute('class')) e.removeAttribute('class');
        e.style.removeProperty('transition-delay');
        e.style.removeProperty('--hero-y');
        if (!e.getAttribute('style')) e.removeAttribute('style');
      });
      return c.outerHTML;
    };
    return {
      wrapStyle: wrap.getAttribute('style') || '',
      html: partes.map(limpa).join('\n'),
    };
  });

  // O React adota estes nós quando monta (ver SNAP-TAKEOVER em componentDidMount, no index.html).
  const bloco = `${START}
<div id="snap"><div class="sc-host"><div style="${snap.wrapStyle.replace(/"/g, '&quot;')}">
${snap.html}
</div></div></div>
${END}
`;
  const ancora = '<x-dc>';
  if (semSnap.split(ancora).length !== 2) throw new Error('Esperava exatamente um <x-dc> no index.html');
  if (!semSnap.includes('/*SNAP-TAKEOVER*/')) {
    throw new Error('index.html não tem o bloco SNAP-TAKEOVER em componentDidMount(); sem ele o topo estático não é adotado pelo React.');
  }
  html = semSnap.replace(ancora, bloco + ancora);
  writeFileSync(indexPath, html);
  console.log(`Topo pré-renderizado: ${(snap.html.length / 1024).toFixed(1)} KB`);
} finally {
  await browser.close();
  rmSync(tmp, { recursive: true, force: true });
}
