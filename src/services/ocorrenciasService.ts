import { supabase } from '@/integrations/supabase/client';
import type { FormOcorrencia, Ocorrencia } from '@/lib/ocorrencias';

const COLUNAS =
  'id, data, hora, turno, categoria, gravidade, sistema, titulo, descricao, estado, resolucao, ' +
  'criada_por_codigo, criada_em, resolvida_por_codigo, resolvida_em';

export async function listarOcorrencias(limite = 300): Promise<{ ocorrencias: Ocorrencia[]; erro: string | null }> {
  const { data, error } = await supabase
    .from('ocorrencias')
    .select(COLUNAS)
    .order('data', { ascending: false })
    .order('criada_em', { ascending: false })
    .limit(limite);
  if (error) return { ocorrencias: [], erro: error.message };
  return { ocorrencias: (data ?? []) as unknown as Ocorrencia[], erro: null };
}

/** Quantas ocorrências estão abertas (para o menu e o painel). */
export async function contarAbertas(): Promise<number> {
  const { count } = await supabase.from('ocorrencias').select('id', { count: 'exact', head: true }).eq('estado', 'aberta');
  return count ?? 0;
}

export async function registarOcorrencia(f: FormOcorrencia): Promise<{ erro: string | null }> {
  const { error } = await supabase.rpc('registar_ocorrencia', {
    p_data: f.data,
    p_hora: f.hora,
    p_turno: f.turno,
    p_categoria: f.categoria,
    p_gravidade: f.gravidade,
    p_sistema: f.sistema,
    p_titulo: f.titulo,
    p_descricao: f.descricao,
  });
  return { erro: error ? error.message : null };
}

export async function atualizarOcorrencia(id: string, f: FormOcorrencia): Promise<{ erro: string | null }> {
  const { error } = await supabase.rpc('atualizar_ocorrencia', {
    p_id: id,
    p_hora: f.hora,
    p_categoria: f.categoria,
    p_gravidade: f.gravidade,
    p_sistema: f.sistema,
    p_titulo: f.titulo,
    p_descricao: f.descricao,
  });
  return { erro: error ? error.message : null };
}

export async function resolverOcorrencia(id: string, resolucao: string): Promise<{ erro: string | null }> {
  const { error } = await supabase.rpc('resolver_ocorrencia', { p_id: id, p_resolucao: resolucao });
  return { erro: error ? error.message : null };
}

export async function reabrirOcorrencia(id: string): Promise<{ erro: string | null }> {
  const { error } = await supabase.rpc('reabrir_ocorrencia', { p_id: id });
  return { erro: error ? error.message : null };
}
