/**
 * Auditoria de contraste WCAG dos tokens de cor (src/index.css).
 *
 *   node scripts/contrast-audit.mjs
 *
 * Lê os três temas (:root = claro, .dark, .hc), converte cada par
 * primeiro-plano/fundo relevante para o rácio de contraste WCAG e assinala
 * OK (≥ 4.5 texto / ≥ 3 UI), "grande" (≥ 3, só passa para texto grande) ou
 * FALHA. Correr sempre que se mexer numa cor em src/index.css.
 */
import { readFileSync } from 'fs';

const lines = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8').split('\n');
const themes = { light: {}, dark: {}, hc: {} };
let cur = null;
for (const ln of lines) {
  const t = ln.trim();
  if (t.startsWith(':root {')) cur = 'light';
  else if (t.startsWith('.dark {')) cur = 'dark';
  else if (t.startsWith('.hc {')) cur = 'hc';
  else if (t === '}' && cur) cur = null;
  if (cur) {
    const m = t.match(/--([\w-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
    if (m) themes[cur][m[1]] = [parseFloat(m[2]), parseFloat(m[3]), parseFloat(m[4])];
  }
}

const hsl2rgb = (h, s, l) => {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)];
};
const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const cr = (L1, L2) => {
  const [a, b] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (a + 0.05) / (b + 0.05);
};
const ratio = (fg, bg) => cr(lum(hsl2rgb(...fg)), lum(hsl2rgb(...bg)));
const over = (fg, bg, al) => {
  const f = hsl2rgb(...fg);
  const b = hsl2rgb(...bg);
  return f.map((c, i) => c * al + b[i] * (1 - al));
};
const tag = (r, target) => (r >= target ? 'OK  ' : r >= 3 ? 'grande' : 'FALHA');

const textPairs = [
  ['foreground', 'background', 'texto normal / fundo'],
  ['card-foreground', 'card', 'texto / cartão'],
  ['muted-foreground', 'background', '2º plano / fundo'],
  ['muted-foreground', 'card', '2º plano / cartão'],
  ['muted-foreground', 'muted', '2º plano / muted'],
  ['primary-foreground', 'primary', 'botão primário'],
  ['secondary-foreground', 'secondary', 'botão secundário'],
  ['accent-foreground', 'accent', 'accent'],
  ['destructive-foreground', 'destructive', 'botão destrutivo'],
  ['success-foreground', 'success', 'botão success'],
  ['warning-foreground', 'warning', 'botão warning'],
  ['sidebar-foreground', 'sidebar-background', 'texto sidebar'],
  ['sidebar-accent-foreground', 'sidebar-accent', 'item ativo sidebar'],
  ['sidebar-primary-foreground', 'sidebar-primary', 'badge sidebar'],
];
const asText = ['success', 'warning', 'destructive', 'primary'];
const uiPairs = [
  ['border', 'background', 'borda / fundo'],
  ['border', 'card', 'borda / cartão'],
  ['sidebar-border', 'sidebar-background', 'separador sidebar'],
];

for (const th of ['light', 'dark', 'hc']) {
  const v = themes[th];
  console.log('\n═══════════ ' + th.toUpperCase() + ' ═══════════');
  console.log('TEXTO  (AA normal 4.5 · AA grande 3.0)');
  for (const [f, b, label] of textPairs) {
    if (!v[f] || !v[b]) continue;
    const r = ratio(v[f], v[b]);
    console.log(`  ${r.toFixed(2).padStart(6)}  ${tag(r, 4.5)}  ${label}`);
  }
  console.log('text-<token> como COR DE TEXTO');
  for (const k of asText) {
    const rb = ratio(v[k], v.background);
    const rc = ratio(v[k], v.card);
    const rt = cr(lum(hsl2rgb(...v[k])), lum(over(v[k], v.background, 0.15)));
    console.log(
      `  fundo ${rb.toFixed(2).padStart(5)} ${tag(rb, 4.5)}   cartão ${rc.toFixed(2).padStart(5)} ${tag(rc, 4.5)}   tinta/15 ${rt.toFixed(2).padStart(5)} ${tag(rt, 4.5)}   text-${k}`,
    );
  }
  console.log('UI / não-texto  (alvo 3.0)');
  for (const [f, b, label] of uiPairs) {
    if (!v[f] || !v[b]) continue;
    const r = ratio(v[f], v[b]);
    console.log(`  ${r.toFixed(2).padStart(6)}  ${r >= 3 ? 'OK  ' : 'FALHA'}  ${label}`);
  }
}
