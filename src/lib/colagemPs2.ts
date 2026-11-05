/**
 * Leitura do texto colado (e deteção de colunas) do gerador PS2.
 */

import { parseTabular } from './colagemTabular';

export interface LinhaBruta {
  recebido: string;
  valor: string;
  nome: string;
}

/** Texto colado (tab, ";" ou ",") → matriz de células. */
export function matrizDeTexto(txt: string): string[][] {
  return parseTabular(txt);
}

/**
 * Texto colado do Excel → linhas. As colunas (conta/NIB, valor, nome) detetam-se sozinhas, como
 * ao carregar um ficheiro; com ou sem linha de cabeçalho. Separador: tab (Excel), senão ";" ou ",".
 */
export function parseColagem(txt: string): LinhaBruta[] {
  const rows = matrizDeTexto(txt);
  if (rows.length === 0) return [];
  const det = autodetectar(rows);
  const so = (r: string[], c: number, usadas: number[]) => (usadas.includes(c) ? '' : r[c] ?? '');
  return rows.slice(det.linhaInicial - 1).map((r) => ({
    recebido: r[det.colConta] ?? '',
    valor: so(r, det.colValor, [det.colConta]),
    nome: so(r, det.colNome, [det.colConta, det.colValor]),
  }));
}

const pareceNib = (v: unknown) => String(v ?? '').replace(/\D/g, '').length >= 8;
const pareceValor = (v: unknown) => {
  const s = String(v ?? '').replace(/[.,\s]/g, '');
  return s.length > 0 && !Number.isNaN(Number(s)) && Number(s) > 0;
};

/** Adivinha as colunas (NIB / valor / nome) e a linha onde começam os dados. */
export function autodetectar(rows: string[][]) {
  const nCols = rows.reduce((m, r) => Math.max(m, r.length), 0);
  let header = -1;
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const txt = (rows[i] ?? []).filter(
      (c) => String(c).trim().length > 1 && Number.isNaN(Number(String(c).replace(/[.,\s]/g, ''))),
    ).length;
    // Uma linha com um NIB/conta é uma linha de dados, mesmo que tenha 2 textos (nome + banco).
    const temNib = (rows[i] ?? []).some((c) => pareceNib(c));
    if (txt >= 2 && !temNib) {
      header = i;
      break;
    }
  }
  const heads = (header >= 0 ? rows[header] ?? [] : []).map((c) => String(c ?? '').toLowerCase());
  const acha = (...keys: string[]) => heads.findIndex((h) => keys.some((k) => h.includes(k)));
  let cConta = acha('nib', 'conta');
  let cValor = acha('valor', 'montante', 'líquido', 'liquido', 'a pagar', 'total');
  let cNome = acha('nome', 'benefici', 'deputado', 'funcion', 'colaborad');

  const dataStart = header < 0 ? 0 : header + 1;
  if (cConta < 0) {
    let best = 0;
    let bestN = -1;
    for (let c = 0; c < nCols; c++) {
      let n = 0;
      for (let i = dataStart; i < rows.length; i++) if (pareceNib((rows[i] ?? [])[c])) n++;
      if (n > bestN) {
        bestN = n;
        best = c;
      }
    }
    cConta = best;
  }
  if (cValor < 0) {
    for (let c = nCols - 1; c >= 0; c--) {
      let n = 0;
      for (let i = dataStart; i < rows.length; i++) if (pareceValor((rows[i] ?? [])[c])) n++;
      if (c !== cConta && n > 0) {
        cValor = c;
        break;
      }
    }
    if (cValor < 0) cValor = Math.min(cConta + 1, nCols - 1);
  }
  if (cNome < 0) {
    // A coluna (que não é a conta nem o valor) com mais texto.
    let melhor = -1;
    let melhorN = 0;
    for (let c = 0; c < nCols; c++) {
      if (c === cConta || c === cValor) continue;
      let n = 0;
      for (let i = dataStart; i < rows.length; i++) if (/\p{L}{2,}/u.test(String((rows[i] ?? [])[c] ?? ''))) n++;
      if (n > melhorN) {
        melhorN = n;
        melhor = c;
      }
    }
    cNome = melhor >= 0 ? melhor : cConta > 1 ? cConta - 1 : nCols > 2 ? 2 : 0;
  }

  // Primeira linha de dados: conta com 8+ dígitos, ou (contas curtas, p.ex. 7 dígitos) conta com 6+
  // dígitos e um valor ao lado. Sem isto a primeira linha era saltada quando a conta era mais curta.
  const digitos = (v: unknown) => String(v ?? '').replace(/\D/g, '').length;
  let li = dataStart;
  for (let i = dataStart; i < rows.length; i++) {
    const r = rows[i] ?? [];
    if (pareceNib(r[cConta]) || (digitos(r[cConta]) >= 6 && pareceValor(r[cValor]))) {
      li = i;
      break;
    }
  }
  return {
    colConta: Math.max(0, cConta),
    colValor: Math.max(0, cValor),
    colNome: Math.max(0, cNome),
    linhaInicial: li + 1,
  };
}
