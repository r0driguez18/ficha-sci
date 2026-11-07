import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TAMANHOS_PAGINA, type Paginacao as PaginacaoEstado } from '@/hooks/usePaginacao';

interface Props {
  p: PaginacaoEstado<unknown>;
  /** Esconde o seletor do nº de linhas por página. */
  semTamanho?: boolean;
  /** Só aparece quando há mais do que uma página (ou, com `sempre`, mesmo com uma só). */
  sempre?: boolean;
  className?: string;
}

/** "26–50 de 130 · Anterior · 2 / 6 · Seguinte" e o nº de linhas por página. */
export function Paginacao({ p, semTamanho, sempre, className = '' }: Props) {
  if (!sempre && p.total <= Math.min(...TAMANHOS_PAGINA) && p.paginas <= 1) return null;
  return (
    <nav aria-label="Paginação" className={`flex flex-wrap items-center justify-between gap-3 pt-3 text-sm ${className}`}>
      <span className="tabular-nums text-muted-foreground">
        {p.de}–{p.ate} de {p.total}
      </span>
      <div className="flex items-center gap-2">
        {!semTamanho && (
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Por página
            <select
              value={p.tamanho}
              onChange={(e) => p.setTamanho(Number(e.target.value))}
              className="h-8 rounded-md border border-input bg-background px-1.5 text-sm text-foreground"
              aria-label="Linhas por página"
            >
              {TAMANHOS_PAGINA.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        <Button variant="outline" size="sm" onClick={() => p.setPagina(p.pagina - 1)} disabled={p.pagina === 0} className="gap-1">
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <span className="tabular-nums text-muted-foreground">
          {p.pagina + 1} / {p.paginas}
        </span>
        <Button variant="outline" size="sm" onClick={() => p.setPagina(p.pagina + 1)} disabled={p.pagina >= p.paginas - 1} className="gap-1">
          Seguinte
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
