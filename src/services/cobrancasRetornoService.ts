import { supabase } from '@/integrations/supabase/client';
import { getNextBusinessDay } from '@/utils/businessDays';

export interface CobrancaRetorno {
  id: string;
  user_id: string;
  data_aplicacao: string;
  ficheiro_nome: string;
  data_retorno_esperada: string;
  retorno_enviado: boolean;
  data_retorno_enviado?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new collection return record
 */
export async function createCobrancaRetorno(
  userId: string,
  dataAplicacao: string,
  ficheiroNome: string
): Promise<{ data: CobrancaRetorno | null; error: any }> {
  const dataRetornoEsperada = getNextBusinessDay(new Date(dataAplicacao));
  
  const { data, error } = await supabase
    .from('cobrancas_retornos')
    .insert({
      user_id: userId,
      data_aplicacao: dataAplicacao,
      ficheiro_nome: ficheiroNome,
      data_retorno_esperada: dataRetornoEsperada.toISOString().split('T')[0],
      retorno_enviado: false
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Erro ao criar retorno de cobrança:', error);
  }

  return { data, error };
}

/**
 * Retornos pendentes de toda a equipa (F1 — o controlo de retornos é
 * responsabilidade partilhada entre turnos).
 */
export async function getPendingReturns(): Promise<{ data: CobrancaRetorno[] | null; error: any }> {
  const { data, error } = await supabase
    .from('cobrancas_retornos')
    .select('*')
    .eq('retorno_enviado', false)
    .order('data_retorno_esperada');

  return { data, error };
}

/**
 * Retornos da equipa que vencem hoje.
 */
export async function getReturnsDueToday(): Promise<{ data: CobrancaRetorno[] | null; error: any }> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('cobrancas_retornos')
    .select('*')
    .eq('retorno_enviado', false)
    .eq('data_retorno_esperada', today)
    .order('created_at');

  return { data, error };
}

/**
 * Retornos da equipa em atraso.
 */
export async function getOverdueReturns(): Promise<{ data: CobrancaRetorno[] | null; error: any }> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('cobrancas_retornos')
    .select('*')
    .eq('retorno_enviado', false)
    .lt('data_retorno_esperada', today)
    .order('data_retorno_esperada');

  return { data, error };
}

/**
 * Mark return as sent
 */
export async function markReturnAsSent(
  retornoId: string,
  observacoes?: string
): Promise<{ error: any }> {
  const today = new Date().toISOString().split('T')[0];
  
  const { error } = await supabase
    .from('cobrancas_retornos')
    .update({
      retorno_enviado: true,
      data_retorno_enviado: today,
      observacoes
    })
    .eq('id', retornoId);

  return { error };
}

/**
 * Todos os retornos da equipa, incluindo os já enviados (F1).
 */
export async function getAllReturns(): Promise<{ data: CobrancaRetorno[] | null; error: any }> {
  const { data, error } = await supabase
    .from('cobrancas_retornos')
    .select('*')
    .order('data_aplicacao', { ascending: false });

  return { data, error };
}