/** Contas de paginação (puras, para se poderem testar): quantas páginas, em que página se está e que itens ela mostra. */
export interface Fatia {
  paginas: number;
  /** Página atual (0 = a primeira), nunca fora do que existe. */
  atual: number;
  /** Posição (a partir de 1) do primeiro e do último item da página; 0 e 0 se não há itens. */
  de: number;
  ate: number;
  inicio: number;
  fim: number;
}

export function fatiaDaPagina(total: number, pagina: number, tamanho: number): Fatia {
  const t = Math.max(1, Math.floor(tamanho) || 1);
  const paginas = Math.max(1, Math.ceil(Math.max(0, total) / t));
  const atual = Math.max(0, Math.min(Math.floor(pagina) || 0, paginas - 1));
  const inicio = atual * t;
  const fim = Math.min(total, inicio + t);
  return { paginas, atual, de: total <= 0 ? 0 : inicio + 1, ate: total <= 0 ? 0 : fim, inicio, fim: Math.max(inicio, fim) };
}
