import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { nextBusinessDay, parseLocalDate, toIsoDate } from '@/lib/cobrancasSla';

export interface CobrancaRetorno {
  id: string;
  user_id: string;
  data_aplicacao: string;
  ficheiro_nome: string;
  data_retorno_esperada: string;
  retorno_enviado: boolean;
  data_retorno_enviado?: string;
  data_retorno_alterada_por?: string | null;
  data_retorno_alterada_em?: string | null;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Cria um registo de retorno de cobrança. O prazo é sempre o dia útil
 * seguinte ao da aplicação (ver `src/lib/cobrancasSla.ts`).
 */
export async function createCobrancaRetorno(
  userId: string,
  dataAplicacao: string,
  ficheiroNome: string
): Promise<{ data: CobrancaRetorno | null; error: PostgrestError | null }> {
  const dataRetornoEsperada = toIsoDate(nextBusinessDay(parseLocalDate(dataAplicacao)));

  const { data, error } = await supabase
    .from('cobrancas_retornos')
    .insert({
      user_id: userId,
      data_aplicacao: dataAplicacao,
      ficheiro_nome: ficheiroNome,
      data_retorno_esperada: dataRetornoEsperada,
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
 * responsabilidade partilhada entre turnos). A severidade (pendente / vence
 * hoje / atrasado / urgente) é calculada no cliente, em fuso local.
 */
export async function getPendingReturns(): Promise<{
  data: CobrancaRetorno[] | null;
  error: PostgrestError | null;
}> {
  const { data, error } = await supabase
    .from('cobrancas_retornos')
    .select('*')
    .eq('retorno_enviado', false)
    .order('data_retorno_esperada');

  return { data, error };
}

/**
 * Marca um ou mais retornos como enviados numa só operação.
 */
export async function markReturnsAsSent(
  retornoIds: string[],
  observacoes?: string
): Promise<{ error: PostgrestError | null }> {
  if (retornoIds.length === 0) return { error: null };

  const patch: Record<string, unknown> = {
    retorno_enviado: true,
    data_retorno_enviado: toIsoDate(new Date()),
  };
  if (observacoes && observacoes.trim() !== '') {
    patch.observacoes = observacoes.trim();
  }

  const { error } = await supabase
    .from('cobrancas_retornos')
    .update(patch)
    .in('id', retornoIds);

  return { error };
}

/** Retrocompatível: marca um único retorno como enviado. */
export async function markReturnAsSent(
  retornoId: string,
  observacoes?: string
): Promise<{ error: PostgrestError | null }> {
  return markReturnsAsSent([retornoId], observacoes);
}

/**
 * Altera manualmente a data de retorno esperada de um registo, guardando
 * quem alterou e quando.
 */
export async function updateReturnExpectedDate(
  retornoId: string,
  novaDataIso: string,
  userId: string
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('cobrancas_retornos')
    .update({
      data_retorno_esperada: novaDataIso,
      data_retorno_alterada_por: userId,
      data_retorno_alterada_em: new Date().toISOString(),
    })
    .eq('id', retornoId);

  return { error };
}

/**
 * Todos os retornos da equipa, incluindo os já enviados (F1).
 */
export async function getAllReturns(): Promise<{
  data: CobrancaRetorno[] | null;
  error: PostgrestError | null;
}> {
  const { data, error } = await supabase
    .from('cobrancas_retornos')
    .select('*')
    .order('data_aplicacao', { ascending: false });

  return { data, error };
}
