import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/** Registo de uma execução de tratamento do CRC (F10). */
export interface CrcTratamento {
  id: string;
  user_id: string;
  tipo: string;
  estado: 'a_correr' | 'concluido' | 'parado' | 'erro';
  parametros: Record<string, unknown>;
  total_registos: number;
  processados: number;
  falhas: number;
  resumo: string | null;
  iniciado_em: string;
  terminado_em: string | null;
  created_at: string;
  updated_at: string;
}

export async function criarCrcTratamento(
  parametros: Record<string, unknown>,
): Promise<{ data: CrcTratamento | null; error: PostgrestError | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: { message: 'Utilizador não autenticado' } as PostgrestError };
  }
  const { data, error } = await supabase
    .from('crc_tratamentos')
    .insert({
      user_id: user.id,
      tipo: 'inconsistencias',
      estado: 'a_correr',
      parametros: parametros as never,
    })
    .select()
    .single();
  return { data: data as unknown as CrcTratamento, error };
}

export async function atualizarCrcTratamento(
  id: string,
  patch: Partial<
    Pick<
      CrcTratamento,
      'estado' | 'total_registos' | 'processados' | 'falhas' | 'resumo' | 'terminado_em'
    >
  >,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.from('crc_tratamentos').update(patch).eq('id', id);
  return { error };
}

export async function listarCrcTratamentos(
  limit = 20,
): Promise<{ data: CrcTratamento[] | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('crc_tratamentos')
    .select('*')
    .order('iniciado_em', { ascending: false })
    .limit(limit);
  return { data: data as unknown as CrcTratamento[], error };
}
