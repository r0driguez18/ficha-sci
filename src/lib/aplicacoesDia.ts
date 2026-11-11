/**
 * Aplicações do dia vindas do core bancário (tabela GBAPL).
 *
 * O worker (ou o Excel carregado à mão) entrega as linhas em bruto: `colunas` (os nomes que o ODBC devolve) e `linhas`
 * (uma lista de valores por registo, pela ordem das colunas). Aqui reconhecem-se as operações reais e prepara-se o
 * Excel. As colunas identificam-se pelo CÓDIGO de campo (ACHORA, ACNOPR…): o próprio core inclui um registo com esses
 * códigos (a 1.ª «linha» de dados); se não vier, usa-se a ordem conhecida.
 */

export const CODIGOS_APLICACAO = [
  'ACEMP', 'ACSQAP', 'ACNLOT', 'ACSITU', 'GBACREFEF', 'ACFILI', 'ACFILY', 'ACLIBE', 'ACFILE', 'ACMBR', 'ACTDEB', 'ACTCRE',
  'ACTMVD', 'ACTMVC', 'ACTSER', 'ACCOPD', 'ACCOPC', 'ACHORA', 'ACDTIN', 'ACHORF', 'ACDATF', 'ACSEQF', 'ACREFC', 'ACNMOV',
  'ACTAPL', 'ACTPND', 'ACTDEV', 'ACTTRT', 'ACEXCT', 'ACTLAY', 'ACCODC', 'ACCOAP', 'ACVAUD', 'ACFACT', 'ACDLIM', 'ACCNLE',
  'ACCNLM', 'GBACTPNTE', 'GBACTPNTM', 'ACDSNE', 'ACDSNM', 'ACUSER', 'ACBYPA', 'ACNOPR', 'ACPRCP', 'ACBALM', 'ACCOMS',
  'ACTCST', 'ACSCST', 'ACTIVA', 'ACDMVE', 'ACDMVM', 'ACFRES', 'ACMOED',
] as const;

export type Celula = string | number | boolean | null;
export type LinhaBruta = Celula[];

/** Uma operação aplicada no dia, com os campos que interessam à ficha. */
export interface OperacaoAplicada {
  /** Empresa/serviço (ex.: ORD_PS2_01, MSCC, TELECOMP). */
  empresa: string;
  seq: number;
  /** T = terminada, P = com pendentes. */
  situacao: string;
  /** Ficheiro externo (Nome AS400 na ficha, ex.: SACERM11A). */
  ficheiro: string;
  /** Hora de início, HH:MM. */
  hora: string;
  /** Data de início (AAAA-MM-DD), '' se não houver. */
  data: string;
  /** Nº da operação (9 dígitos). */
  nOperacao: string;
  /** Quem pediu (ex.: NALVES, SISP). */
  utilizador: string;
  movimentos: number;
  aplicados: number;
  pendentes: number;
  totalDebito: number;
  totalCredito: number;
}

const texto = (v: Celula | undefined) => (v === null || v === undefined ? '' : String(v).trim());
const numero = (v: Celula | undefined) => {
  const n = Number(texto(v));
  return Number.isFinite(n) ? n : 0;
};

/** 103752 -> 10:37 ; 25932 -> 02:59 (o core guarda HHMMSS como número, sem o zero à esquerda). */
export function horaDoCore(v: Celula | undefined): string {
  const n = numero(v);
  if (n <= 0) return '';
  const s = String(Math.trunc(n)).padStart(6, '0');
  return `${s.slice(0, 2)}:${s.slice(2, 4)}`;
}

/** 20261111 -> 2026-11-11 */
export function dataDoCore(v: Celula | undefined): string {
  const s = String(Math.trunc(numero(v)));
  return /^\d{8}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : '';
}

/** Posição de cada campo: pelo registo de códigos que o core inclui, ou pela ordem conhecida. */
export function indicesDosCampos(linhas: LinhaBruta[]): { indices: Record<string, number>; origem: 'registo-de-codigos' | 'ordem-conhecida' } {
  const registo = linhas.find((l) => texto(l[0]) === 'ACEMP' && texto(l[1]) === 'ACSQAP');
  const codigos: readonly string[] = registo ? registo.map((c) => texto(c)) : CODIGOS_APLICACAO;
  const indices: Record<string, number> = {};
  codigos.forEach((c, i) => {
    if (c && !(c in indices)) indices[c] = i;
  });
  return { indices, origem: registo ? 'registo-de-codigos' : 'ordem-conhecida' };
}

export interface ResultadoLeitura {
  operacoes: OperacaoAplicada[];
  /** Coisas a ver: estrutura diferente, dados de outro dia… */
  avisos: string[];
}

/**
 * Operações reais do dia: as que têm nº de operação. Ficam de fora o registo de códigos, as linhas de documentação e os
 * pendentes a zeros (OUTROS, CAIXAS…). Se `dataFicha` vier, avisa quando os dados são de outro dia.
 */
export function lerOperacoes(linhas: LinhaBruta[], dataFicha?: string): ResultadoLeitura {
  const avisos: string[] = [];
  const { indices, origem } = indicesDosCampos(linhas);
  const falta = ['ACEMP', 'ACHORA', 'ACFILE', 'ACNOPR', 'ACUSER'].filter((c) => !(c in indices));
  if (falta.length > 0) {
    return { operacoes: [], avisos: [`A estrutura da tabela mudou: faltam as colunas ${falta.join(', ')}.`] };
  }
  if (origem === 'ordem-conhecida' && linhas.some((l) => l.length !== CODIGOS_APLICACAO.length)) {
    avisos.push(`O número de colunas (${linhas.find((l) => l.length !== CODIGOS_APLICACAO.length)?.length}) não é o esperado (${CODIGOS_APLICACAO.length}): confirma as colunas.`);
  }
  const g = (l: LinhaBruta, c: string) => l[indices[c]];

  const operacoes: OperacaoAplicada[] = [];
  for (const l of linhas) {
    const nOperacao = texto(g(l, 'ACNOPR'));
    // só registos reais: nº de operação numérico e > 0 (exclui códigos, documentação e pendentes a zeros)
    if (!/^\d+$/.test(nOperacao) || Number(nOperacao) <= 0) continue;
    operacoes.push({
      empresa: texto(g(l, 'ACEMP')),
      seq: numero(g(l, 'ACSQAP')),
      situacao: texto(g(l, 'ACSITU')),
      ficheiro: texto(g(l, 'ACFILE')),
      hora: horaDoCore(g(l, 'ACHORA')),
      data: dataDoCore(g(l, 'ACDTIN')),
      nOperacao,
      utilizador: texto(g(l, 'ACUSER')),
      movimentos: numero(g(l, 'ACNMOV')),
      aplicados: numero(g(l, 'ACTAPL')),
      pendentes: numero(g(l, 'ACTPND')),
      totalDebito: numero(g(l, 'ACTDEB')),
      totalCredito: numero(g(l, 'ACTCRE')),
    });
  }
  operacoes.sort((a, b) => a.hora.localeCompare(b.hora) || a.nOperacao.localeCompare(b.nOperacao));

  if (operacoes.length === 0) avisos.push('Não há operações com número de operação neste ficheiro.');
  const dias = [...new Set(operacoes.map((o) => o.data).filter(Boolean))];
  if (dataFicha && dias.length > 0 && dias.some((d) => d !== dataFicha)) {
    avisos.push(`Os dados do core são de ${dias.sort().join(' e ')} e a ficha é de ${dataFicha}: confirma que é o dia certo.`);
  }
  return { operacoes, avisos };
}

/** Aplicacoes_ddmmaaaa.xlsx (o nome que o script usa). */
export function nomeExcelAplicacoes(dataIso: string): string {
  const [a, m, d] = dataIso.split('-');
  return `Aplicacoes_${d}${m}${a}.xlsx`;
}

/** O Excel como o script o gera: linha de cabeçalho (nomes das colunas) e todos os registos. */
export async function excelDasAplicacoes(colunas: string[], linhas: LinhaBruta[]): Promise<Blob> {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.aoa_to_sheet([colunas, ...linhas]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const bytes: ArrayBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/** Lê um .xlsx (o que o script gera) para colunas + linhas em bruto. */
export async function lerExcelAplicacoes(ficheiro: ArrayBuffer): Promise<{ colunas: string[]; linhas: LinhaBruta[] }> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(ficheiro, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const todas = XLSX.utils.sheet_to_json<LinhaBruta>(ws, { header: 1, raw: true, defval: null });
  if (todas.length < 2) throw new Error('O ficheiro está vazio.');
  const colunas = todas[0].map((c) => texto(c));
  const linhas = todas
    .slice(1)
    .map((l) => l.map((c) => (c === undefined ? null : c)))
    .filter((l) => l.some((c) => texto(c) !== ''));
  return { colunas, linhas };
}
