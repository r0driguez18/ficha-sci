/**
 * Convenção dos nomes dos ficheiros PS2: "SA" + 4 ou 5 letras da empresa + mês (3 letras) +
 * uma letra de sequência (A, B, C… — há empresas que pagam mais de uma vez no mês).
 * Ex.: SAEMPRSETA → empresa "EMPR", setembro, 1.º pagamento.
 *
 * Só serve para sugerir o nome da empresa: a pessoa pode corrigir.
 */

const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

export interface NomeFicheiroLido {
  /** Letras da empresa (ex.: "EMPR"). Vazio se o nome não segue a convenção. */
  empresa: string;
  mes: string;
  /** A, B, C… */
  sequencia: string;
}

export function lerNomeFicheiro(nomeBase: string): NomeFicheiroLido | null {
  const n = nomeBase.trim().replace(/\.[A-Za-z0-9]{1,8}$/, '').toUpperCase();
  const m = /^SA([A-Z0-9]{2,8}?)([A-Z]{3})([A-Z])$/.exec(n);
  if (!m) return null;
  const mes = m[2];
  // Só aceita se o meio for um mês: assim não se confunde letras da empresa com o mês.
  if (!MESES.includes(mes)) return null;
  return { empresa: m[1], mes, sequencia: m[3] };
}

/** Sugestão do nome da empresa a partir do nome do ficheiro ("" se não segue a convenção). */
export function empresaSugerida(nomeBase: string): string {
  return lerNomeFicheiro(nomeBase)?.empresa ?? '';
}
