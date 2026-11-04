/**
 * A tabela de processamentos da ficha em blocos do tamanho de uma folha A4 (20 linhas): os blocos já
 * cheios minimizam-se e o preenchimento continua no último. Só afeta o ecrã; o PDF não muda.
 */
export const LINHAS_POR_FOLHA = 20;

export interface BlocoTabela<T> {
  indice: number;
  /** Posição (a partir de 1) da primeira e da última linha do bloco. */
  de: number;
  ate: number;
  linhas: T[];
  /** É o bloco onde se está a preencher (o último). */
  atual: boolean;
}

export function blocosDaTabela<T>(linhas: readonly T[], tamanho = LINHAS_POR_FOLHA): BlocoTabela<T>[] {
  const n = Math.max(1, Math.ceil(linhas.length / tamanho));
  return Array.from({ length: n }, (_, i) => {
    const parte = linhas.slice(i * tamanho, (i + 1) * tamanho);
    return { indice: i, de: i * tamanho + 1, ate: i * tamanho + parte.length, linhas: parte, atual: i === n - 1 };
  });
}
