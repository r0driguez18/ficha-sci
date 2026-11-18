/**
 * Processamentos do dia vindos do core bancário, de DUAS fontes:
 *  - o registo de ficheiros processados (biblioteca PROMOF0003, objeto $PLOGITF — «Log de ficheiros processados»): tudo
 *    menos os DC (cheques, transferências, SISP…);
 *  - a cópia da tabela das aplicações em curso (GBAPL): só os DC (débitos/créditos por lotes), com o nº de operação, a
 *    empresa e os movimentos. A GBAPL só guarda o dia atual, por isso o worker copia-a de 10 em 10 minutos.
 *
 * Ao contrário da tabela antiga das aplicações (GBAPL, que se esvaziava à meia-noite), este registo guarda o histórico,
 * por isso dá para pedir um dia qualquer. O worker (ou o Excel carregado à mão) entrega as linhas em bruto: `colunas` (os
 * títulos que o ODBC devolve) e `linhas` (uma lista de valores por registo, pela ordem das colunas). Aqui reconhecem-se os
 * processamentos reais e prepara-se o Excel. As colunas identificam-se pelo CÓDIGO de campo ($PLOFILE, $PLODTPR…): o
 * próprio registo inclui uma linha com esses códigos (a 1.ª de dados); se não vier (consulta por data), usa-se a ordem
 * conhecida.
 */

export const CODIGOS_PLOGITF = [
  '$PLOFILE', '$PLOLIB', '$PLOMBR', '$PLOREFT', '$PLOAPLPR', '$PLOUSPR', '$PLODTPR', '$PLODTAPPR', '$PLOHOPR', '$PLOUSAP',
  '$PLODTAP', '$PLODTAPAP', '$PLOHOAP', '$PLOTIPR', '$PLOAPTR', '$PLONORD', '$PLOMOD', '$PLOBUFFER',
] as const;

/** Campos da GBAPL pela ordem em que o core os devolve (é a ordem em que o worker guarda cada registo). */
export const CODIGOS_GBAPL = [
  'ACEMP', 'ACSQAP', 'ACNLOT', 'ACSITU', 'GBACREFEF', 'ACFILI', 'ACFILY', 'ACLIBE', 'ACFILE', 'ACMBR', 'ACTDEB', 'ACTCRE',
  'ACTMVD', 'ACTMVC', 'ACTSER', 'ACCOPD', 'ACCOPC', 'ACHORA', 'ACDTIN', 'ACHORF', 'ACDATF', 'ACSEQF', 'ACREFC', 'ACNMOV',
  'ACTAPL', 'ACTPND', 'ACTDEV', 'ACTTRT', 'ACEXCT', 'ACTLAY', 'ACCODC', 'ACCOAP', 'ACVAUD', 'ACFACT', 'ACDLIM', 'ACCNLE',
  'ACCNLM', 'GBACTPNTE', 'GBACTPNTM', 'ACDSNE', 'ACDSNM', 'ACUSER', 'ACBYPA', 'ACNOPR', 'ACPRCP', 'ACBALM', 'ACCOMS',
  'ACTCST', 'ACSCST', 'ACTIVA', 'ACDMVE', 'ACDMVM', 'ACFRES', 'ACMOED',
] as const;

import { ROTULO_TIPO, tipoDaOperacao } from './cobrancasDc';

export type Celula = string | number | boolean | null;
export type LinhaBruta = Celula[];

/** Um ficheiro processado, com os campos que interessam à ficha. */
export interface OperacaoAplicada {
  /** Data do processamento (AAAA-MM-DD), a do calendário. */
  data: string;
  /** Hora da preparação, HH:MM. */
  hora: string;
  /** Nome do ficheiro (Nome AS400 na ficha, ex.: SACERM11A). Pode vir vazio (ex.: BEN, COM). */
  ficheiro: string;
  /** Referência para tratamento (PS2, RTR, RCT, RCB, ERR…). */
  referencia: string;
  /** Módulo (DC, TE, CD, SP, EC). */
  modulo: string;
  /** Quem processou (ex.: NALVES). */
  utilizador: string;
  /** V = só validado; A = aplicado. */
  tipo: string;
  /** Número de ordem do registo (do log; os DC não o têm). */
  nOrdem: string;
  /** Só nos DC (vêm da cópia da GBAPL): empresa/serviço (ex.: ORD_PS2_01, MSCC, TELECOMP). */
  empresa?: string;
  /** Só nos DC: nº da operação (9 dígitos). */
  nOperacao?: string;
  /** Só nos DC: movimentos e aplicados do lote. */
  movimentos?: number;
  aplicados?: number;
}

const texto = (v: Celula | undefined) => (v === null || v === undefined ? '' : String(v).trim());
const numero = (v: Celula | undefined) => {
  const n = Number(texto(v));
  return Number.isFinite(n) ? n : 0;
};

/** 103752 -> 10:37 ; 332 -> 00:03 (o registo guarda HHMMSS como número, sem o zero à esquerda). */
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
  const registo = linhas.find((l) => texto(l[0]) === '$PLOFILE' && texto(l[1]) === '$PLOLIB');
  const codigos: readonly string[] = registo ? registo.map((c) => texto(c)) : CODIGOS_PLOGITF;
  const indices: Record<string, number> = {};
  codigos.forEach((c, i) => {
    if (c && !(c in indices)) indices[c] = i;
  });
  return { indices, origem: registo ? 'registo-de-codigos' : 'ordem-conhecida' };
}

export interface ResultadoLeitura {
  operacoes: OperacaoAplicada[];
  /** Coisas a ver: estrutura diferente, dados do formato antigo… */
  avisos: string[];
  /** Registos DC que vinham no log e se ignoraram (os DC vêm da cópia da GBAPL, que tem o nº de operação). */
  dcIgnorados?: number;
}

/**
 * Processamentos reais: os que têm data válida e nº de ordem. Ficam de fora o registo de códigos e linhas sem data. A
 * janela da ficha (07:00 → 07:00), os operadores e as validações aplicam-se depois, em `selecionarOperacoes`.
 */
export function lerOperacoes(linhas: LinhaBruta[]): ResultadoLeitura {
  const avisos: string[] = [];
  // Dados da tabela antiga (GBAPL, 54 colunas, códigos AC…): já não se usam.
  if (linhas.some((l) => (texto(l[0]) === 'ACEMP' && texto(l[1]) === 'ACSQAP') || l.length === 54)) {
    return {
      operacoes: [],
      avisos: ['Estes dados são do formato antigo (tabela GBAPL). Gera de novo, ou carrega o Excel do registo de ficheiros processados (PLOGITF).'],
    };
  }
  const { indices, origem } = indicesDosCampos(linhas);
  const falta = ['$PLOFILE', '$PLODTPR', '$PLOHOPR', '$PLOUSPR', '$PLOAPTR', '$PLONORD'].filter((c) => !(c in indices));
  if (falta.length > 0) {
    return { operacoes: [], avisos: [`A estrutura da tabela mudou: faltam as colunas ${falta.join(', ')}.`] };
  }
  if (origem === 'ordem-conhecida') {
    const diferente = linhas.find((l) => l.length !== CODIGOS_PLOGITF.length);
    if (diferente) avisos.push(`O número de colunas (${diferente.length}) não é o esperado (${CODIGOS_PLOGITF.length}): confirma as colunas.`);
  }
  const g = (l: LinhaBruta, c: string) => l[indices[c]];

  const operacoes: OperacaoAplicada[] = [];
  let dcIgnorados = 0;
  for (const l of linhas) {
    const data = dataDoCore(g(l, '$PLODTPR'));
    const nOrdem = texto(g(l, '$PLONORD'));
    // só registos reais: data de 8 dígitos e nº de ordem numérico > 0 (exclui o registo de códigos e linhas vazias)
    if (!data || !/^\d+$/.test(nOrdem) || Number(nOrdem) <= 0) continue;
    // Os DC (módulo DC) vêm da cópia da GBAPL, que tem o nº de operação e a empresa: aqui não entram.
    if (texto(g(l, '$PLOMOD')).toUpperCase() === 'DC') {
      dcIgnorados++;
      continue;
    }
    operacoes.push({
      data,
      hora: horaDoCore(g(l, '$PLOHOPR')),
      ficheiro: texto(g(l, '$PLOFILE')),
      referencia: texto(g(l, '$PLOREFT')),
      modulo: texto(g(l, '$PLOMOD')),
      utilizador: texto(g(l, '$PLOUSPR')),
      tipo: texto(g(l, '$PLOAPTR')).toUpperCase(),
      nOrdem,
    });
  }
  operacoes.sort(
    (a, b) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora) || a.nOrdem.localeCompare(b.nOrdem, undefined, { numeric: true }),
  );

  if (operacoes.length === 0 && dcIgnorados === 0) avisos.push('Não há processamentos com nº de ordem neste ficheiro.');
  return { operacoes, avisos, dcIgnorados };
}

/** Uma operação DC guardada pelo worker (a cópia da GBAPL): a data de início e o registo em bruto. */
export interface RegistoDc {
  data: string;
  empresa: string;
  seq: number;
  n_operacao: string;
  linha: LinhaBruta;
}

/**
 * Os DC da cópia da GBAPL, no mesmo formato dos outros processamentos. Cada registo traz a empresa, o nº de operação e os
 * movimentos. Um lote sem nenhum movimento aplicado (0 aplicados) é só uma validação e fica marcado como tal (tipo V).
 */
export function operacoesDeDc(registos: RegistoDc[]): OperacaoAplicada[] {
  const i = (c: (typeof CODIGOS_GBAPL)[number]) => CODIGOS_GBAPL.indexOf(c);
  const out: OperacaoAplicada[] = [];
  for (const r of registos) {
    const l = r.linha;
    if (!Array.isArray(l) || l.length <= i('ACNOPR')) continue;
    const aplicados = numero(l[i('ACTAPL')]);
    out.push({
      data: dataDoCore(l[i('ACDTIN')]) || r.data,
      hora: horaDoCore(l[i('ACHORA')]),
      ficheiro: texto(l[i('ACFILE')]),
      referencia: '',
      modulo: 'DC',
      utilizador: texto(l[i('ACUSER')]),
      tipo: aplicados > 0 ? 'A' : 'V',
      nOrdem: '',
      empresa: texto(l[i('ACEMP')]) || r.empresa,
      nOperacao: texto(l[i('ACNOPR')]) || r.n_operacao,
      movimentos: numero(l[i('ACNMOV')]),
      aplicados,
    });
  }
  return out;
}

/** Chave única de uma operação (para a lista): as do log pelo nº de ordem, os DC pelo nº de operação. */
export function chaveDaOperacao(o: OperacaoAplicada): string {
  return o.nOrdem ? `log-${o.nOrdem}` : `dc-${o.empresa ?? ''}-${o.nOperacao ?? ''}`;
}

/**
 * As duas fontes juntas, por data e hora, SEM duplicados. A tabela das aplicações em curso (GBAPL) também tem ficheiros que
 * não são DC (os de compensação: RTR, RCT, RCB…), e esses já vêm do registo de ficheiros processados: quando o mesmo
 * ficheiro (na mesma data) está nos dois, fica só a linha do registo (com o módulo certo) e passa a levar também a empresa, o
 * nº de operação e os movimentos da GBAPL.
 */
export function juntarOperacoes(log: OperacaoAplicada[], dc: OperacaoAplicada[]): OperacaoAplicada[] {
  const doLog = log.map((o) => ({ ...o }));
  const gemeos = new Map<string, OperacaoAplicada[]>();
  for (const o of doLog) {
    if (!o.ficheiro) continue;
    const k = `${o.data}|${o.ficheiro}`;
    gemeos.set(k, [...(gemeos.get(k) ?? []), o]);
  }
  for (const lista of gemeos.values()) lista.sort((a, b) => Number(a.tipo === 'V') - Number(b.tipo === 'V')); // as aplicações primeiro
  const usados = new Map<string, number>();
  const soDc: OperacaoAplicada[] = [];
  for (const d of dc) {
    const k = `${d.data}|${d.ficheiro}`;
    const lista = d.ficheiro ? gemeos.get(k) : undefined;
    if (!lista) {
      soDc.push(d);
      continue;
    }
    const i = usados.get(k) ?? 0;
    usados.set(k, i + 1);
    const alvo = lista[i];
    if (alvo) Object.assign(alvo, { empresa: d.empresa, nOperacao: d.nOperacao, movimentos: d.movimentos, aplicados: d.aplicados });
  }
  return [...doLog, ...soDc].sort(
    (a, b) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora) || chaveDaOperacao(a).localeCompare(chaveDaOperacao(b), undefined, { numeric: true }),
  );
}

/**
 * Só os processamentos dos operadores da app (o `value` do operador, ex. «nalves», é o mesmo utilizador do core, ex.
 * «NALVES»). Ficam de fora os de outros utilizadores. Sem lista de operadores não se filtra.
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

/**
 * As colunas que interessam do Excel tratado (as outras, como biblioteca, membro, aplicação e buffer, não são precisas),
 * com os títulos do registo (sem os espaços de enchimento nem os acentos estragados que o ODBC por vezes devolve).
 */
export const COLUNAS_EXCEL_OPERACOES = [
  'Data processamento', // $PLODTPR
  'Hora Preparação', // $PLOHOPR
  'Ficheiro', // $PLOFILE
  'Referência p/ tratamento', // $PLOREFT
  'Módulo', // $PLOMOD
  'Utilizador processamento', // $PLOUSPR
  'Número ordem', // $PLONORD (só no log)
  'Empresa', // ACEMP (só nos DC)
  'Nº operação', // ACNOPR (só nos DC)
  'Movimentos', // ACNMOV (só nos DC)
  'Aplicados', // ACTAPL (só nos DC)
  'Tipo', // Compensação / Cobranças / Salário
] as const;

/** O Excel tratado: só os processamentos que se passam e só as colunas úteis, por ordem de hora. */
export async function excelDasOperacoes(operacoes: OperacaoAplicada[]): Promise<Blob> {
  const XLSX = await import('xlsx');
  const linhas = operacoes.map((o) => [
    o.data, o.hora, o.ficheiro, o.referencia, o.modulo, o.utilizador,
    o.nOrdem ? Number(o.nOrdem) : null,
    o.empresa ?? null, o.nOperacao ? Number(o.nOperacao) : null, o.movimentos ?? null, o.aplicados ?? null,
    ROTULO_TIPO[tipoDaOperacao(o)],
  ]);
  const ws = XLSX.utils.aoa_to_sheet([[...COLUNAS_EXCEL_OPERACOES], ...linhas]);
  ws['!cols'] = [18, 16, 16, 24, 10, 24, 14, 14, 14, 12, 12, 14].map((wch) => ({ wch }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Processamentos');
  const bytes: ArrayBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/** Aplicacoes_ddmmaaaa.xlsx (o nome que o script usa). */
export function nomeExcelAplicacoes(dataIso: string): string {
  const [a, m, d] = dataIso.split('-');
  return `Aplicacoes_${d}${m}${a}.xlsx`;
}

/** O Excel em bruto, como o core o devolve: linha de cabeçalho (nomes das colunas) e todos os registos. */
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

/** A ficha do dia D cobre das 07:00 de D às 07:00 de D+1 (manhã, tarde, noite e madrugada): é o que se valida no dia seguinte. */
export const HORA_INICIO_FICHA = 7;

export function diaSeguinte(iso: string): string {
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

/**
 * Validação: o ficheiro que só foi validado, sem se aplicar ($PLOAPTR = V). Cada ficheiro costuma aparecer duas vezes —
 * primeiro a validação, depois a aplicação (A) — e só a aplicação conta.
 */
export function ehValidacao(o: OperacaoAplicada): boolean {
  return o.tipo === 'V';
}

export interface OperacoesSelecionadas {
  /** As que entram no Excel e na lista: dentro da janela da ficha, de operadores da app e já aplicadas (não validações). */
  selecionadas: OperacaoAplicada[];
  /** Dentro da janela mas de outros utilizadores do core. */
  deOutros: OperacaoAplicada[];
  /** Dentro da janela e de operadores, mas só validações (não foram aplicadas). */
  validacoes: OperacaoAplicada[];
  /** Fora da janela 07:00 → 07:00 (são de outra ficha). */
  foraDaJanela: OperacaoAplicada[];
  aviso: string | null;
}

/** Janela da ficha primeiro, operadores depois, e por fim as validações ficam de fora. */
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
      ? `Há ${operacoes.length} processamentos, mas nenhum entre ${inicio} e ${fim} (a janela desta ficha): confirma que é o dia certo.`
      : null;
  const validacoes = dosOperadores.filter(ehValidacao);
  const selecionadas = dosOperadores.filter((o) => !ehValidacao(o));
  return { selecionadas, deOutros, validacoes, foraDaJanela, aviso };
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
