import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { TurnKey } from '@/types/taskboard';

/** Uma leitura: quem confirmou que leu a nota, e quando. */
export interface HandoverLeitura {
  id: string;
  entry_id: string;
  user_id: string;
  user_nome: string | null;
  lida_em: string;
}

/**
 * Uma nota deixada na passagem de turno. Só cresce: nunca se reescreve nem
 * se apaga — deixar outra nota acrescenta uma entrada nova.
 */
export interface HandoverEntrada {
  id: string;
  date: string;
  turno: TurnKey;
  texto: string;
  autor_user_id: string | null;
  autor_nome: string | null;
  created_at: string;
  arquivada_em: string | null;
  arquivada_por_nome: string | null;
  leituras: HandoverLeitura[];
}

const SELECT_ENTRADA = '*, handover_reads(*)';

function paraEntradas(data: Array<Record<string, unknown>>): HandoverEntrada[] {
  return data.map(({ handover_reads, ...e }) => ({
    ...e,
    leituras: [...((handover_reads as HandoverLeitura[] | null) ?? [])].sort((a: HandoverLeitura, b: HandoverLeitura) =>
      a.lida_em.localeCompare(b.lida_em),
    ),
  })) as HandoverEntrada[];
}

/** Notas ainda não arquivadas (vista atual), das mais recentes para as mais antigas. */
export async function getHandoverAtuais(): Promise<{ data: HandoverEntrada[] | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('handover_entries')
    .select(SELECT_ENTRADA)
    .is('arquivada_em', null)
    .order('created_at', { ascending: false })
    .limit(300);
  if (error || !data) return { data: null, error };
  return { data: paraEntradas(data), error: null };
}

export interface FiltrosHistorico {
  de?: string;
  ate?: string;
  turno?: TurnKey | '';
  texto?: string;
}

export const HISTORICO_POR_PAGINA = 20;

/** Histórico completo (arquivadas incluídas), paginado e com filtros. */
export async function getHandoverHistorico(
  filtros: FiltrosHistorico,
  pagina: number,
): Promise<{ data: HandoverEntrada[] | null; total: number; error: PostgrestError | null }> {
  let q = supabase.from('handover_entries').select(SELECT_ENTRADA, { count: 'exact' });
  if (filtros.de) q = q.gte('date', filtros.de);
  if (filtros.ate) q = q.lte('date', filtros.ate);
  if (filtros.turno) q = q.eq('turno', filtros.turno);
  const termo = (filtros.texto ?? '').trim().replace(/[%_,()]/g, ' ');
  if (termo) q = q.ilike('texto', `%${termo}%`);
  const de = pagina * HISTORICO_POR_PAGINA;
  const { data, error, count } = await q
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(de, de + HISTORICO_POR_PAGINA - 1);
  if (error || !data) return { data: null, total: 0, error };
  return { data: paraEntradas(data), total: count ?? 0, error: null };
}



/** Tira as notas da vista atual (ficam no histórico, com quem arquivou e quando). */
export async function arquivarEntradasHandover(
  ids: string[],
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.rpc('arquivar_entradas_passagem_turno', { p_ids: ids });
  return { error };
}
