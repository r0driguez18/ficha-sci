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
 * pendentes a zeros (OUTROS, CAIXAS…). A janela da ficha (07:00 → 07:00) e os operadores aplicam-se depois, em
 * `selecionarOperacoes`.
 */
export function lerOperacoes(linhas: LinhaBruta[]): ResultadoLeitura {
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
  return { operacoes, avisos };
}

/** A ficha do dia D cobre das 07:00 de D às 07:00 de D+1 (manhã, tarde, noite e madrugada): é o que se valida no dia seguinte. */
export const HORA_INICIO_FICHA = 7;

function diaSeguinte(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + 1)).toISOString().slice(0, 10);
}

/** [inicio, fim[ da ficha, em 'AAAA-MM-DD HH:MM' (compara-se como texto). */
export function janelaDaFicha(dataFicha: string): { inicio: string; fim: string } {
  const hh = `${String(HORA_INICIO_FICHA).padStart(2, '0')}:00`;
  return { inicio: `${dataFicha} ${hh}`, fim: `${diaSeguinte(dataFicha)} ${hh}` };
}

export function dentroDaJanela(o: OperacaoAplicada, dataFicha: string): boolean {
  if (!o.data) return true; // sem data não dá para a pôr fora: não se esconde
  const quando = `${o.data} ${o.hora || '00:00'}`;
  const { inicio, fim } = janelaDaFicha(dataFicha);
  return quando >= inicio && quando < fim;
}

export interface OperacoesSelecionadas {
  /** As que entram no Excel e na lista: dentro da janela da ficha e de operadores da app. */
  selecionadas: OperacaoAplicada[];
  /** Dentro da janela mas de outros utilizadores do core (SISP, quem não é operador). */
  deOutros: OperacaoAplicada[];
  /** Fora da janela 07:00 → 07:00 (são de outra ficha). */
  foraDaJanela: OperacaoAplicada[];
  aviso: string | null;
}

/** Janela da ficha primeiro, operadores depois. */
export function selecionarOperacoes(
  operacoes: OperacaoAplicada[],
  dataFicha: string,
  operadores: string[] | undefined,
): OperacoesSelecionadas {
  const dentro = operacoes.filter((o) => dentroDaJanela(o, dataFicha));
  const foraDaJanela = operacoes.filter((o) => !dentroDaJanela(o, dataFicha));
  const { dosOperadores, deOutros } = filtrarPorOperadores(dentro, operadores);
  const { inicio, fim } = janelaDaFicha(dataFicha);
  const aviso =
    dentro.length === 0 && operacoes.length > 0
      ? `Há ${operacoes.length} operações, mas nenhuma entre ${inicio} e ${fim} (a janela desta ficha): confirma que é o dia certo.`
      : null;
  return { selecionadas: dosOperadores, deOutros, foraDaJanela, aviso };
}

/**
 * Só as operações dos operadores da app (o `value` do operador, ex. «nalves», é o mesmo utilizador do core, ex. «NALVES»).
 * Ficam de fora as de outros utilizadores (sistema, SISP, quem não é operador). Sem lista de operadores não se filtra.
 */
export function filtrarPorOperadores(
  operacoes: OperacaoAplicada[],
  operadores: string[] | undefined,
): { dosOperadores: OperacaoAplicada[]; deOutros: OperacaoAplicada[] } {
  const validos = new Set((operadores ?? []).map((o) => o.trim().toUpperCase()).filter(Boolean));
  if (validos.size === 0) return { dosOperadores: operacoes, deOutros: [] };
  const dosOperadores: OperacaoAplicada[] = [];
  const deOutros: OperacaoAplicada[] = [];
  for (const o of operacoes) (validos.has(o.utilizador.trim().toUpperCase()) ? dosOperadores : deOutros).push(o);
  return { dosOperadores, deOutros };
}

/** As colunas que interessam do Excel tratado (as outras ~40 do core não são precisas). */
export const COLUNAS_EXCEL_OPERACOES = [
  'Data', 'Hora', 'Tarefa', 'Ficheiro', 'Nº operação', 'Utilizador', 'Situação',
  'Movimentos', 'Aplicados', 'Pendentes', 'Total débito', 'Total crédito',
] as const;

const SITUACAO: Record<string, string> = { T: 'Terminada', P: 'Com pendentes' };

/** O Excel tratado: só as operações que se passam e só as colunas úteis, por ordem de hora. */
export async function excelDasOperacoes(operacoes: OperacaoAplicada[]): Promise<Blob> {
  const XLSX = await import('xlsx');
  const linhas = operacoes.map((o) => [
    o.data, o.hora, o.empresa, o.ficheiro, o.nOperacao, o.utilizador, SITUACAO[o.situacao] ?? o.situacao,
    o.movimentos, o.aplicados, o.pendentes, o.totalDebito, o.totalCredito,
  ]);
  const ws = XLSX.utils.aoa_to_sheet([[...COLUNAS_EXCEL_OPERACOES], ...linhas]);
  ws['!cols'] = [12, 7, 14, 16, 12, 12, 14, 11, 10, 10, 16, 16].map((wch) => ({ wch }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Aplicações');
  const bytes: ArrayBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
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

/** Quanto tempo se espera pelo worker antes de dar o pedido por perdido (a leitura do core demora segundos). */
export const PRAZO_PEDIDO_MS = 3 * 60 * 1000;

export type SituacaoPedido = 'a-esperar-worker' | 'worker-a-ler' | 'sem-resposta' | 'concluido' | 'erro';

/** Em que ponto está um pedido; um pendente/a-correr há mais de 3 min é «sem resposta» (worker desligado ou sem rede). */
export function situacaoDoPedido(
  p: { estado: 'pendente' | 'a-correr' | 'concluido' | 'erro'; pedido_em: string; iniciado_em: string | null },
  agora: number = Date.now(),
): SituacaoPedido {
  if (p.estado === 'concluido') return 'concluido';
  if (p.estado === 'erro') return 'erro';
  const desde = new Date(p.estado === 'a-correr' ? (p.iniciado_em ?? p.pedido_em) : p.pedido_em).getTime();
  if (agora - desde > PRAZO_PEDIDO_MS) return 'sem-resposta';
  return p.estado === 'a-correr' ? 'worker-a-ler' : 'a-esperar-worker';
}
