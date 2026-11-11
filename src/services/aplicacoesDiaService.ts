import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { LinhaBruta } from '@/lib/aplicacoesDia';

export interface AplicacoesDia {
  id: string;
  data: string;
  origem: 'worker' | 'manual';
  colunas: string[];
  linhas: LinhaBruta[];
  n_linhas: number;
  gerado_em: string;
  gerado_por_nome: string | null;
}

export type EstadoPedido = 'pendente' | 'a-correr' | 'concluido' | 'erro';

export interface PedidoAplicacoes {
  id: string;
  data: string;
  estado: EstadoPedido;
  pedido_por_nome: string | null;
  pedido_em: string;
  iniciado_em: string | null;
  concluido_em: string | null;
  erro: string | null;
  aplicacao_id: string | null;
}

/** A entrega mais recente para a data da ficha (o Excel e as operações que se mostram). */
export async function getAplicacoesDia(data: string): Promise<{ data: AplicacoesDia | null; error: PostgrestError | null }> {
  const { data: rows, error } = await supabase
    .from('aplicacoes_dia')
    .select('*')
    .eq('data', data)
    .order('gerado_em', { ascending: false })
    .limit(1);
  if (error) return { data: null, error };
  return { data: ((rows ?? [])[0] as unknown as AplicacoesDia | undefined) ?? null, error: null };
}

/** O pedido mais recente para a data (para mostrar «a gerar…» ou o erro). */
export async function getUltimoPedido(data: string): Promise<{ data: PedidoAplicacoes | null; error: PostgrestError | null }> {
  const { data: rows, error } = await supabase
    .from('pedidos_aplicacoes')
    .select('*')
    .eq('data', data)
    .order('pedido_em', { ascending: false })
    .limit(1);
  if (error) return { data: null, error };
  return { data: ((rows ?? [])[0] as unknown as PedidoAplicacoes | undefined) ?? null, error: null };
}

/** Pede ao worker que vá buscar as aplicações ao core. Um pedido ainda em curso é reaproveitado. */
export async function pedirAplicacoesDia(data: string): Promise<{ data: PedidoAplicacoes | null; error: PostgrestError | null }> {
  const { data: p, error } = await supabase.rpc('pedir_aplicacoes_dia', { p_data: data });
  return { data: (p as unknown as PedidoAplicacoes | null) ?? null, error };
}

/** Alternativa sem worker: carregar à mão o Excel que o script gera. */
export async function registarAplicacoesManual(
  data: string,
  colunas: string[],
  linhas: LinhaBruta[],
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.rpc('registar_aplicacoes_manual', { p_data: data, p_colunas: colunas, p_linhas: linhas });
  return { error };
}
