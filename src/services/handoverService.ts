import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { TurnKey } from '@/types/taskboard';

/** Nota de passagem de turno (F13). */
export interface HandoverNote {
  id: string;
  date: string;
  turno: TurnKey;
  nota: string;
  autor_user_id: string | null;
  autor_nome: string | null;
  lida_por: string | null;
  lida_por_nome: string | null;
  lida_em: string | null;
  created_at: string;
  updated_at: string;
}

export async function getHandoverNotes(
  date: string,
): Promise<{ data: HandoverNote[] | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('handover_notes')
    .select('*')
    .eq('date', date)
    .order('turno');
  return { data: data as unknown as HandoverNote[], error };
}

/**
 * Cria ou atualiza a nota de um turno para uma data (única por date+turno)
 * — via RPC, para que `autor_user_id`/`autor_nome` venham sempre de
 * auth.uid() no servidor (nunca de um parâmetro do cliente, que podia ser
 * forjado). Editar uma nota já lida limpa o selo de leitura no servidor —
 * a confirmação anterior já não descreve o conteúdo novo.
 */
export async function saveHandoverNote(
  date: string,
  turno: TurnKey,
  nota: string,
): Promise<{ data: HandoverNote | null; error: PostgrestError | null }> {
  const { data, error } = await supabase.rpc('guardar_nota_passagem_turno', {
    p_date: date,
    p_turno: turno,
    p_nota: nota,
  });
  return { data: data as unknown as HandoverNote, error };
}

/**
 * Regista a confirmação de leitura — via RPC, para que `lida_por`/
 * `lida_por_nome` venham sempre do operador autenticado que chama, nunca
 * de um parâmetro do cliente.
 */
export async function confirmarLeituraHandover(
  noteId: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.rpc('confirmar_leitura_passagem_turno', {
    p_note_id: noteId,
  });
  return { error };
}
