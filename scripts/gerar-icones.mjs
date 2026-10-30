// Gera os ícones PNG do app instalável a partir do símbolo (SVG) da marca.
// Uso: node scripts/gerar-icones.mjs   (precisa do Microsoft Edge e do playwright-core)
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const SIMBOLO = (cor = null) => {
  const pin = cor ?? 'url(#p)', coroa = cor ?? 'url(#c)', orb = cor ?? 'url(#o)';
  return `<defs>
    <linearGradient id="p" x1=".2" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#ff1f8e"/><stop offset=".45" stop-color="#ff3d6a"/><stop offset=".8" stop-color="#ff7a1f"/><stop offset="1" stop-color="#ffae00"/></linearGradient>
    <linearGradient id="c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe14a"/><stop offset=".6" stop-color="#ffb800"/><stop offset="1" stop-color="#ff8a00"/></linearGradient>
    <linearGradient id="o" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#16d9f5"/><stop offset=".45" stop-color="#1e7bff"/><stop offset=".8" stop-color="#5b3dff"/><stop offset="1" stop-color="#b03dff"/></linearGradient>
  </defs>
  <g transform="translate(0 -16) rotate(-16 100 130)"><path d="M24 128 A76 20 0 0 1 176 128 A76 13 0 0 0 24 128 Z" fill="${orb}"/></g>
  <path d="M100 166 C80 138 60 122 60 96 A40 40 0 0 1 140 96 C140 122 120 138 100 166 Z" fill="${pin}"/>
  <circle cx="100" cy="94" r="15" fill="${cor ? 'transparent' : '#fff'}" ${cor ? `stroke="${cor}"` : ''}/>
  <g transform="rotate(-9 100 34)" fill="none" stroke="${coroa}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><path d="M74 54 L68 20 L87 37 L99 10 L112 36 L132 18 L127 54 Z"/></g>
  <g transform="translate(0 -16) rotate(-16 100 130)"><path d="M12 127 A88 32 0 0 0 188 129 A80 19 0 0 1 12 127 Z" fill="${orb}"/></g>`;
};

// fundo: cor ou null (transparente); escala: quanto do quadro o símbolo ocupa
const svg = ({ fundo, escala, cor = null, raio = 0 }) => {
  const m = (200 - 200 * escala) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
    ${fundo ? `<rect width="200" height="200" rx="${raio}" fill="${fundo}"/>` : ''}
    <g transform="translate(${m} ${m + 6}) scale(${escala})">${SIMBOLO(cor)}</g></svg>`;
};

const ICONES = [
  { arquivo: 'icone-192.png', tam: 192, fundo: '#14123a', escala: 0.9, raio: 0 },
  { arquivo: 'icone-512.png', tam: 512, fundo: '#14123a', escala: 0.9, raio: 0 },
  // maskable: o sistema recorta em círculo/gota; o símbolo fica dentro da zona segura (80%)
  { arquivo: 'icone-maskable-512.png', tam: 512, fundo: '#14123a', escala: 0.68, raio: 0 },
  // iPhone arredonda sozinho; sem transparência
  { arquivo: 'apple-touch-icon.png', tam: 180, fundo: '#14123a', escala: 0.86, raio: 0 },
  // selo da barra de notificações do Android: branco sobre transparente
  { arquivo: 'selo-96.png', tam: 96, fundo: null, escala: 0.95, cor: '#ffffff' },
];

const pasta = new URL('../public/icones/', import.meta.url);
mkdirSync(pasta, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const i of ICONES) {
    const p = await browser.newPage({ viewport: { width: i.tam, height: i.tam }, deviceScaleFactor: 1 });
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg(i)}</body></html>`);
    await p.screenshot({ path: new URL(i.arquivo, pasta).pathname.replace(/^\/([A-Za-z]:)/, '$1'), omitBackground: !i.fundo });
    await p.close();
    console.log('gerado', i.arquivo);
  }
} finally {
  await browser.close();
}
