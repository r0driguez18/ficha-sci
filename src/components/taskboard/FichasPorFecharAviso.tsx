import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFichasPorFechar } from '@/services/fichasPorFecharService';
import { NOME_FICHA, ROTA_FICHA, dataCurta, type FichaPorFechar } from '@/lib/fichasPorFechar';

const detalhe = (f: FichaPorFechar) => {
  const partes: string[] = [];
  if (f.tarefasFeitas > 0) partes.push(`${f.tarefasFeitas} tarefa${f.tarefasFeitas === 1 ? '' : 's'} marcada${f.tarefasFeitas === 1 ? '' : 's'}`);
  if (f.processamentos > 0) partes.push(`${f.processamentos} processamento${f.processamentos === 1 ? '' : 's'}`);
  return partes.join(' · ');
};

/** Linhas "Dia não útil · 18/10/2026 — 12 tarefas marcadas  [Abrir]". */
export const ListaFichasPorFechar: React.FC<{ fichas: FichaPorFechar[]; compacto?: boolean }> = ({ fichas, compacto }) => (
  <ul className={compacto ? 'space-y-1.5' : 'mt-2 space-y-2'}>
    {fichas.map((f) => (
      <li key={`${f.formType}-${f.date}`} className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>
          <strong>{NOME_FICHA[f.formType]}</strong> · {dataCurta(f.date)}
          {detalhe(f) && <span className="text-muted-foreground"> — {detalhe(f)}</span>}
        </span>
        <Button asChild size="sm" variant="outline" className="gap-1">
          <Link to={ROTA_FICHA[f.formType]}>
            Abrir <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </li>
    ))}
  </ul>
);

/**
 * Faixa no topo da ficha: avisa que há outras fichas (por exemplo, de dia não útil) com trabalho
 * feito e por fechar. `atual` é a ficha que está aberta, que não se repete no aviso.
 */
export const FichasPorFecharAviso: React.FC<{ atual?: { formType: string; date: string } }> = ({ atual }) => {
  const todas = useFichasPorFechar();
  const outras = todas.filter((f) => !(atual && f.formType === atual.formType && f.date === atual.date));
  if (outras.length === 0) return null;

  return (
    <div
      role="status"
      className="mb-4 rounded-lg border border-amber-500/50 bg-amber-50 p-3 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"
    >
      <div className="flex items-center gap-2 font-medium">
        <AlertTriangle className="h-4 w-4" />
        {outras.length === 1 ? 'Há uma ficha por fechar' : `Há ${outras.length} fichas por fechar`}
      </div>
      <p className="text-sm opacity-90">Têm trabalho feito e ainda não foram validadas e exportadas.</p>
      <ListaFichasPorFechar fichas={outras} />
    </div>
  );
};
