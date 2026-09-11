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

/**
 * Lê as linhas brutas da folha a partir das colunas escolhidas, e separa as
 * válidas das inválidas (sem balcão ou sem nº de cartão) — nunca descarta
 * uma linha sem a mostrar, para nunca "perder" um cartão silenciosamente.
 */
export function extrairLinhas(
  rows: string[][],
  colBalcao: number,
  colCartao: number,
  colNome: number,
  linhaInicial: number,
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

    if (!balcao || !numeroCartao || !/^\d+$/.test(cartaoRaw.replace(/\s/g, ''))) {
      invalidas.push({
        linha: i + 1,
        motivo: !balcao ? 'sem balcão' : !numeroCartao ? 'sem nº de cartão' : 'nº de cartão inválido',
      });
      continue;
    }

    validas.push({
      balcao,
      numeroCartao,
      nomeTitular: colNome >= 0 ? (r[colNome] ?? '').toString().trim() : '',
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
