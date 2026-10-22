import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fichasPorFechar, type FichaPorFechar, type RascunhoBruto } from '@/lib/fichasPorFechar';
import { todayIso } from '@/lib/taskboardDefaults';

export const EVENTO_FICHAS_POR_FECHAR = 'update-fichas-badge';

/** Rascunhos de dias anteriores a hoje que têm trabalho feito e ainda não foram exportados. */
export async function listarFichasPorFechar(): Promise<FichaPorFechar[]> {
  const hoje = todayIso();
  const { data, error } = await supabase
    .from('taskboard_data')
    .select('form_type, date, turn_data, tasks, table_rows, updated_at')
    .lt('date', hoje)
    .order('date', { ascending: true });
  if (error) throw new Error(error.message);
  return fichasPorFechar((data ?? []) as unknown as RascunhoBruto[], hoje);
}

/** Avisa o menu e o painel de que a lista pode ter mudado (depois de exportar ou recomeçar uma ficha). */
export function avisarFichasPorFecharMudaram() {
  window.dispatchEvent(new Event(EVENTO_FICHAS_POR_FECHAR));
}

/** A lista de fichas por fechar, atualizada de minuto a minuto e quando uma ficha é exportada. */
export function useFichasPorFechar(): FichaPorFechar[] {
  const q = useQuery({
    queryKey: ['fichas-por-fechar'],
    queryFn: listarFichasPorFechar,
    refetchInterval: 60_000,
    staleTime: 20_000,
  });
  const { refetch } = q;
  useEffect(() => {
    const aoMudar = () => void refetch();
    window.addEventListener(EVENTO_FICHAS_POR_FECHAR, aoMudar);
    return () => window.removeEventListener(EVENTO_FICHAS_POR_FECHAR, aoMudar);
  }, [refetch]);
  return q.data ?? [];
}
