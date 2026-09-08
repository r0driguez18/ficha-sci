import { supabase } from '@/integrations/supabase/client';
import type { Operator } from '@/lib/operators';

export interface OperatorRow extends Operator {
  id: string;
  ativo: boolean;
  papel: 'operador' | 'administrador';
  user_id: string | null;
}

/** Lista de operadores ativos, ordenada por nome. */
export async function listOperators(): Promise<OperatorRow[]> {
  const { data, error } = await supabase
    .from('operators')
    .select('id, value, nome, ativo, papel, user_id')
    .eq('ativo', true)
    .order('nome');

  if (error) {
    console.error('Erro ao carregar operadores:', error);
    return [];
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    value: r.value,
    label: r.nome,
    ativo: r.ativo,
    papel: (r.papel as 'operador' | 'administrador') ?? 'operador',
    user_id: r.user_id,
  }));
}

/** O operador ligado à conta em sessão, ou null se ainda não foi associado. */
export async function getMyOperator(): Promise<OperatorRow | null> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return null;

  const { data, error } = await supabase
    .from('operators')
    .select('id, value, nome, ativo, papel, user_id')
    .eq('user_id', uid)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id,
    value: data.value,
    label: data.nome,
    ativo: data.ativo,
    papel: (data.papel as 'operador' | 'administrador') ?? 'operador',
    user_id: data.user_id,
  };
}

/** Liga a conta em sessão ao código de operador indicado. */
export async function claimOperator(operatorValue: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('claim_operator', { operator_value: operatorValue });
  return { error: error ? error.message : null };
}

export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) return false;
  return data === true;
}
