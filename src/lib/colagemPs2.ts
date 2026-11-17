/**
 * Leitura do texto colado (e deteção de colunas) do gerador PS2.
 */

import { parseTabular } from './colagemTabular';
import { secaoDaLinha } from './oic';

export interface LinhaBruta {
  recebido: string;
  valor: string;
  nome: string;
  /** Descritivo que o cliente pôs nesta linha (vazio = vale o por defeito: prefixo + nome). */
  descritivo?: string;
  /** Nº da linha na folha ou no texto colado (1 = a primeira), para se encontrar a linha no Excel. */
  linha?: number;
}

/** Texto colado (tab, ";" ou ",") → matriz de células. */
export function matrizDeTexto(txt: string): string[][] {
  // As linhas em branco ficam: o nº da linha tem de bater com o do Excel.
  return parseTabular(txt, { manterVazias: true });
}

/**
 * Texto colado do Excel → linhas. As colunas (conta/NIB, valor, nome) detetam-se sozinhas, como
 * ao carregar um ficheiro; com ou sem linha de cabeçalho. Separador: tab (Excel), senão ";" ou ",".
 */
export function parseColagem(txt: string): LinhaBruta[] {
  const rows = parseTabular(txt);
  if (rows.length === 0) return [];
  const det = autodetectar(rows);
  const so = (r: string[], c: number, usadas: number[]) => (usadas.includes(c) ? '' : r[c] ?? '');
  return rows.slice(det.linhaInicial - 1).map((r) => ({
    recebido: r[det.colConta] ?? '',
    valor: so(r, det.colValor, [det.colConta]),
    nome: so(r, det.colNome, [det.colConta, det.colValor]),
    descritivo: det.colDescritivo >= 0 ? so(r, det.colDescritivo, [det.colConta, det.colValor, det.colNome]) : '',
  }));
}

const pareceNib = (v: unknown) => String(v ?? '').replace(/\D/g, '').length >= 8;
const pareceValor = (v: unknown) => {
  const s = String(v ?? '').replace(/[.,\s]/g, '');
  return s.length > 0 && !Number.isNaN(Number(s)) && Number(s) > 0;
};

/** Índice da linha do cabeçalho (-1 se não houver): a 1.ª, nas primeiras linhas, com 2+ textos e sem nenhum NIB/conta. */
function acharCabecalho(rows: readonly (readonly unknown[])[]): number {
  let header = -1;
  let vistas = 0;
  for (let i = 0; i < Math.min(rows.length, 60); i++) {
    if (!(rows[i] ?? []).some((c) => String(c ?? '').trim() !== '')) continue;
    if (++vistas > 12) break;
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
  return header;
}

/**
 * Colunas candidatas à conta, por ordem de prioridade: NIB > conta com natureza > conta simples (só pelo cabeçalho).
 * A coluna «Natureza» sozinha não é lida. As que não têm nenhum número nos dados ficam para o fim.
 */
function colunasDeConta(rows: readonly (readonly unknown[])[], header: number): number[] {
  const heads = (header >= 0 ? rows[header] ?? [] : []).map((c) => String(c ?? '').toLowerCase());
  const candidatas = [
    heads.findIndex((h) => h.includes('nib')),
    heads.findIndex((h) => h.includes('conta') && h.includes('nat')),
    heads.findIndex((h) => h.includes('conta')),
  ].filter((c, i, todas) => c >= 0 && todas.indexOf(c) === i);
  const inicio = header < 0 ? 0 : header + 1;
  const temNumeros = (c: number) => rows.slice(inicio).some((r) => pareceNib((r ?? [])[c]));
  return [...candidatas.filter(temNumeros), ...candidatas.filter((c) => !temNumeros(c))];
}

/** Adivinha as colunas (NIB / valor / nome) e a linha onde começam os dados. */
export function autodetectar(rows: string[][]) {
  const nCols = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const header = acharCabecalho(rows);
  const heads = (header >= 0 ? rows[header] ?? [] : []).map((c) => String(c ?? '').toLowerCase());
  const acha = (...keys: string[]) => heads.findIndex((h) => keys.some((k) => h.includes(k)));
  let cConta = colunasDeConta(rows, header)[0] ?? -1;
  let cValor = acha('valor', 'montante', 'líquido', 'liquido', 'a pagar', 'total');
  let cNome = acha('nome', 'benefici', 'deputado', 'funcion', 'colaborad');
  // Descritivo do cliente: só se o cabeçalho o disser (sem cabeçalho não se adivinha).
  let cDescr = acha('descritivo', 'descrição', 'descricao', 'referência', 'referencia', 'motivo', 'finalidade');
  if (cDescr === cConta || cDescr === cValor || cDescr === cNome) cDescr = -1;

  const dataStart = header < 0 ? 0 : header + 1;
  if (cConta < 0) {
    let best = 0;
    let bestN = -1;
    for (let c = 0; c < nCols; c++) {
      if (c === cDescr) continue;
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
      if (c !== cConta && c !== cDescr && n > 0) {
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
      if (c === cConta || c === cValor || c === cDescr) continue;
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
    colDescritivo: cDescr,
    linhaInicial: li + 1,
  };
}

/**
 * Linhas do PS2 a partir da matriz e das colunas escolhidas. O bloco "Outros Bancos" da folha não é do PS2 (vai pelo
 * OIC): as suas linhas não entram, só se contam. O descritivo é o do cliente (vazio = vale o por defeito).
 */
export function linhasDaMatriz(
  matriz: readonly (readonly unknown[])[],
  cols: { colConta: number; colValor: number; colNome: number; colDescritivo: number; linhaInicial: number },
): { linhas: LinhaBruta[]; nOutrosBlocos: number; ignoradasOutros: LinhaBruta[] } {
  const txt = (v: unknown) => (v ?? '').toString().trim();
  // Se a coluna escolhida é uma das candidatas (NIB, conta com natureza, conta), uma célula vazia cai para a seguinte
  // dessa ordem: um NIB em branco não faz a linha desaparecer quando a conta está preenchida.
  const candidatas = colunasDeConta(matriz, acharCabecalho(matriz));
  const recurso = candidatas.includes(cols.colConta) ? candidatas.filter((c) => c !== cols.colConta) : [];
  const contaDe = (r: readonly unknown[]) => {
    const proprio = txt(r[cols.colConta]);
    if (proprio !== '') return proprio;
    for (const c of recurso) if (txt(r[c]) !== '') return txt(r[c]);
    return '';
  };
  const linhaDe = (r: readonly unknown[], linha: number): LinhaBruta => {
    const { colConta, colValor, colNome, colDescritivo } = cols;
    return {
      recebido: contaDe(r),
      valor: colValor === colConta ? '' : txt(r[colValor]),
      nome: colNome === colConta || colNome === colValor ? '' : txt(r[colNome]),
      descritivo: colDescritivo < 0 || [colConta, colValor, colNome].includes(colDescritivo) ? '' : txt(r[colDescritivo]),
      linha,
    };
  };
  const out: LinhaBruta[] = [];
  const inicio = Math.max(0, cols.linhaInicial - 1);
  let secao: 'bca' | 'outros' | null = null;
  for (let i = 0; i < inicio && i < matriz.length; i++) secao = secaoDaLinha(matriz[i] ?? []) ?? secao;
  const ignoradasOutros: LinhaBruta[] = [];
  for (let i = inicio; i < matriz.length; i++) {
    const r = matriz[i] ?? [];
    const nova = secaoDaLinha(r);
    if (nova) {
      secao = nova;
      continue;
    }
    if (secao === 'outros') {
      // Só se contam os pagamentos (linhas com conta/NIB), não o cabeçalho repetido nem os totais.
      if (pareceNib(contaDe(r))) ignoradasOutros.push(linhaDe(r, i + 1));
      continue;
    }
    out.push(linhaDe(r, i + 1));
  }
  return { linhas: out, nOutrosBlocos: ignoradasOutros.length, ignoradasOutros };
}
