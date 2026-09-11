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
 *
 * Idempotente: `UNIQUE (ficheiro_nome, data_aplicacao)` impede duas linhas
 * para o mesmo ficheiro na mesma data (ex.: guardar a mesma linha
 * "Cobranças" duas vezes) — um conflito é tratado como sucesso silencioso
 * (o registo já existe), não como erro.
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
    if (error.code === '23505') {
      // Já existe um retorno para este ficheiro nesta data — não é um erro.
      return { data: null, error: null };
    }
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
 * Marca um ou mais retornos como enviados numa só operação — via RPC, para
 * que `data_retorno_enviado` venha sempre da data do servidor (CURRENT_DATE),
 * não do relógio do dispositivo do operador.
 */
export async function markReturnsAsSent(
  retornoIds: string[],
  observacoes?: string
): Promise<{ error: PostgrestError | null }> {
  if (retornoIds.length === 0) return { error: null };

  const { error } = await supabase.rpc('marcar_retornos_enviados', {
    p_ids: retornoIds,
    p_observacoes: observacoes && observacoes.trim() !== '' ? observacoes.trim() : null,
  });

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
 * Altera manualmente a data de retorno esperada de um registo — via RPC,
 * para que `data_retorno_alterada_por` venha sempre de auth.uid() no
 * servidor (nunca de um parâmetro do cliente, que podia ser forjado).
 */
export async function updateReturnExpectedDate(
  retornoId: string,
  novaDataIso: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.rpc('alterar_prazo_retorno', {
    p_id: retornoId,
    p_nova_data: novaDataIso,
  });

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
