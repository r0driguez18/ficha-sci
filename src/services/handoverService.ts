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
  leituras: HandoverLeitura[];
}

/** Todas as notas de um dia (por ordem de criação), cada uma com as suas leituras. */
export async function getHandoverEntradas(
  date: string,
): Promise<{ data: HandoverEntrada[] | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('handover_entries')
    .select('*, handover_reads(*)')
    .eq('date', date)
    .order('created_at', { ascending: true });
  if (error || !data) return { data: null, error };
  const entradas = data.map(({ handover_reads, ...e }) => ({
    ...e,
    leituras: [...(handover_reads ?? [])].sort((a, b) => a.lida_em.localeCompare(b.lida_em)),
  }));
  return { data: entradas as unknown as HandoverEntrada[], error: null };
}

/**
 * Deixa uma nota nova — via RPC, para que o autor venha sempre de auth.uid()
 * no servidor (nunca de um parâmetro do cliente, que podia ser forjado).
 */
export async function adicionarEntradaHandover(
  date: string,
  turno: TurnKey,
  texto: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.rpc('adicionar_entrada_passagem_turno', {
    p_date: date,
    p_turno: turno,
    p_texto: texto,
  });
  return { error };
}

/**
 * Regista que quem está autenticado leu esta nota — via RPC (identidade do
 * servidor). Repetir não altera a hora da primeira leitura.
 */
export async function confirmarLeituraEntradaHandover(
  entryId: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.rpc('confirmar_leitura_entrada_passagem_turno', {
    p_entry_id: entryId,
  });
  return { error };
}
