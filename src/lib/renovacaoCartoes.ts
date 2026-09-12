/**
 * Renovação de Cartões — lógica pura (deteção de colunas, normalização do
 * nº de cartão, montagem do ficheiro `.prn`).
 *
 * Porte do processo manual em Excel/VBA (Auto Ren.xlsm): o export do banco
 * é dividido em lotes de até 490 cartões (limite do banco é 500; 490 é
 * margem de segurança), por balcão. O `.prn` final é só o nº de cartão a
 * 7 dígitos com zero à esquerda, um por linha, sem cabeçalho — confirmado
 * contra um ficheiro real do processo atual.
 */

export const LIMITE_LOTE = 490;

export interface LinhaBrutaCartao {
  balcao: string;
  numeroCartao: string;
  nomeTitular: string;
  /** Linha completa (todas as colunas do ficheiro do banco), para a folha "Resultado". */
  dados: Record<string, string>;
}

export interface LinhaInvalida {
  linha: number;
  motivo: string;
}

/** "752923" → "0752923". Só dígitos contam; tudo o resto é ruído a limpar. */
export function normalizarNumeroCartao(v: unknown): string {
  const digitos = String(v ?? '').replace(/\D/g, '');
  if (!digitos) return '';
  return digitos.padStart(7, '0');
}

export function normalizarBalcao(v: unknown): string {
  return String(v ?? '').trim().replace(/\.0$/, '');
}

/** Adivinha as colunas Balcão / Nº de Cartão e a linha onde começam os dados. */
export function autodetectarColunas(rows: string[][]) {
  let header = -1;
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const txt = (rows[i] ?? []).filter(
      (c) => String(c).trim().length > 1 && Number.isNaN(Number(String(c).replace(/[.,\s]/g, ''))),
    ).length;
    if (txt >= 2) {
      header = i;
      break;
    }
  }
  const heads = (header >= 0 ? rows[header] ?? [] : []).map((c) => String(c ?? '').toLowerCase());
  const acha = (...keys: string[]) => heads.findIndex((h) => keys.some((k) => h.includes(k)));

  let colBalcao = acha('balcão', 'balcao', 'branch');
  let colCartao = acha('cartão', 'cartao', 'card');
  const colNome = acha('nome', 'titular', 'cliente');

  const dataStart = header < 0 ? 0 : header + 1;
  if (colBalcao < 0) colBalcao = 0;
  if (colCartao < 0) colCartao = colBalcao + 1;

  return {
    colBalcao,
    colCartao,
    colNome: colNome < 0 ? -1 : colNome,
    linhaInicial: dataStart + 1,
  };
}

/** Rótulo de uma coluna para a folha "Resultado": o cabeçalho, se houver, senão "Coluna N". */
function rotuloColuna(headers: string[] | undefined, i: number): string {
  const h = (headers?.[i] ?? '').toString().trim();
  return h || `Coluna ${i + 1}`;
}

/**
 * Lê as linhas brutas da folha a partir das colunas escolhidas, e separa as
 * válidas das inválidas (sem balcão ou sem nº de cartão) — nunca descarta
 * uma linha sem a mostrar, para nunca "perder" um cartão silenciosamente.
 * `headers`, se dado, rotula as colunas de `dados` (a linha completa, tal
 * como a folha "Resultado" do processo manual — todas as colunas do
 * ficheiro do banco, não só balcão/cartão/nome).
 */
export function extrairLinhas(
  rows: string[][],
  colBalcao: number,
  colCartao: number,
  colNome: number,
  linhaInicial: number,
  headers?: string[],
): { validas: LinhaBrutaCartao[]; invalidas: LinhaInvalida[] } {
  const validas: LinhaBrutaCartao[] = [];
  const invalidas: LinhaInvalida[] = [];

  for (let i = Math.max(0, linhaInicial - 1); i < rows.length; i++) {
    const r = rows[i] ?? [];
    const balcaoRaw = (r[colBalcao] ?? '').toString().trim();
    const cartaoRaw = (r[colCartao] ?? '').toString().trim();
    if (balcaoRaw === '' && cartaoRaw === '') continue; // linha em branco, ignora sem avisar

    const numeroCartao = normalizarNumeroCartao(cartaoRaw);
    const balcao = normalizarBalcao(balcaoRaw);
    const digitosCartao = cartaoRaw.replace(/\D/g, '');

    if (
      !balcao ||
      !numeroCartao ||
      !/^\d+$/.test(cartaoRaw.replace(/\s/g, '')) ||
      digitosCartao.length > 7
    ) {
      invalidas.push({
        linha: i + 1,
        motivo: !balcao
          ? 'sem balcão'
          : !numeroCartao
            ? 'sem nº de cartão'
            : digitosCartao.length > 7
              ? 'nº de cartão com mais de 7 dígitos'
              : 'nº de cartão inválido',
      });
      continue;
    }

    const dados: Record<string, string> = {};
    const nCols = Math.max(r.length, headers?.length ?? 0);
    for (let c = 0; c < nCols; c++) {
      dados[rotuloColuna(headers, c)] = (r[c] ?? '').toString().trim();
    }
    // O nº de cartão vai sempre formatado (7 dígitos) na folha "Resultado".
    dados[rotuloColuna(headers, colCartao)] = numeroCartao;

    validas.push({
      balcao,
      numeroCartao,
      nomeTitular: colNome >= 0 ? (r[colNome] ?? '').toString().trim() : '',
      dados,
    });
  }

  return { validas, invalidas };
}

/** Conteúdo do `.prn`: um nº de cartão por linha, sem cabeçalho. */
export function construirPrn(numerosCartao: string[]): string {
  return numerosCartao.join('\r\n') + '\r\n';
}

const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const;

/** Nome base da sessão / dos ficheiros: "Renovações <Mês>" (mês corrente). */
export function nomeBaseRenovacao(d: Date = new Date()): string {
  return `Renovações ${MESES_PT[d.getMonth()]}`;
}

/** Nome do .xlsx de um lote — mesma base e número do .prn, a folha "Resultado". */
export function nomeFicheiroExcelLote(nomeBase: string, numero: number): string {
  return `${nomeBase} ${numero}.xlsx`;
}

/**
 * Colunas (e ordem) da folha "Resultado" final — confirmado contra um
 * ficheiro real do processo atual. As restantes colunas do export do banco
 * (Situação do Cartão, Ano/Mês de Expiração, Nº Vezes Utilizado, Data
 * Última Utilização, Código de Componente, Número da 1ª conta DO
 * associada) não entram no ficheiro.
 */
export const COLUNAS_RESULTADO = [
  'Nº da entidade',
  'Data de Emissão',
  'Balcão',
  'Nº de Cartão',
  'Cliente de Subscrição',
  'Nome no Cartão',
] as const;

function normalizarChaveColuna(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Neutraliza injeção de fórmula: um valor que comece por `=`, `+`, `-`,
 * `@` ou tab/carriage-return é interpretado como fórmula pelo Excel ao
 * abrir o ficheiro — um apóstrofo à frente força-o a texto. O export do
 * banco não devia ter isto, mas mais vale prevenir do que remediar numa
 * folha que pode conter nomes/texto livre de terceiros.
 */
function neutralizarFormula(v: string): string {
  return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
}

/**
 * Reduz a linha completa (`dados`) só às colunas de `COLUNAS_RESULTADO`, na
 * ordem certa — a folha "Resultado" nunca leva as restantes colunas do
 * export do banco. A comparação ignora acentos/maiúsculas, para tolerar
 * pequenas variações no cabeçalho do ficheiro carregado.
 */
export function filtrarColunasResultado(dados: Record<string, string>): Record<string, string> {
  const porChave = new Map<string, string>();
  for (const [k, v] of Object.entries(dados)) {
    porChave.set(normalizarChaveColuna(k), v);
  }
  const saida: Record<string, string> = {};
  for (const col of COLUNAS_RESULTADO) {
    saida[col] = neutralizarFormula(porChave.get(normalizarChaveColuna(col)) ?? '');
  }
  return saida;
}
