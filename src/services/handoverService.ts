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

/** Cria ou atualiza a nota de um turno para uma data (única por date+turno). */
export async function saveHandoverNote(
  date: string,
  turno: TurnKey,
  nota: string,
  autorUserId: string,
  autorNome: string,
): Promise<{ data: HandoverNote | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('handover_notes')
    .upsert(
      {
        date,
        turno,
        nota,
        autor_user_id: autorUserId,
        autor_nome: autorNome,
      },
      { onConflict: 'date,turno' },
    )
    .select()
    .single();
  return { data: data as unknown as HandoverNote, error };
}

/** Regista a confirmação de leitura com o operador em sessão e a hora. */
export async function confirmarLeituraHandover(
  noteId: string,
  userId: string,
  nome: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('handover_notes')
    .update({
      lida_por: userId,
      lida_por_nome: nome,
      lida_em: new Date().toISOString(),
    })
    .eq('id', noteId);
  return { error };
}
