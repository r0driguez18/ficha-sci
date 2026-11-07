import { useEffect, useMemo, useState } from 'react';
import { fatiaDaPagina } from '@/lib/paginacao';

export const TAMANHOS_PAGINA = [25, 50, 100] as const;

export interface Paginacao<T> {
  /** Os itens da página atual. */
  itens: T[];
  /** Página atual (0 = a primeira). */
  pagina: number;
  paginas: number;
  total: number;
  /** Posição (a partir de 1) do primeiro e do último item da página, no total. */
  de: number;
  ate: number;
  tamanho: number;
  setPagina: (p: number) => void;
  setTamanho: (n: number) => void;
}

/**
 * Parte uma lista em páginas (no cliente). A página volta à primeira quando `chave` muda (os filtros, a pesquisa…) e
 * nunca fica numa página que deixou de existir (a lista encolheu).
 */
export function usePaginacao<T>(lista: readonly T[], opcoes: { tamanho?: number; chave?: string } = {}): Paginacao<T> {
  const [tamanho, setTamanho] = useState(opcoes.tamanho ?? 25);
  const [pagina, setPaginaBruta] = useState(0);

  useEffect(() => {
    setPaginaBruta(0);
  }, [opcoes.chave, tamanho]);

  const total = lista.length;
  const f = fatiaDaPagina(total, pagina, tamanho);
  const itens = useMemo(() => lista.slice(f.inicio, f.fim), [lista, f.inicio, f.fim]);

  return {
    itens,
    pagina: f.atual,
    paginas: f.paginas,
    total,
    de: f.de,
    ate: f.ate,
    tamanho,
    setPagina: (p: number) => setPaginaBruta(Math.max(0, Math.min(f.paginas - 1, p))),
    setTamanho,
  };
}
