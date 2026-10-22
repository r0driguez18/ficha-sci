import { supabase } from '@/integrations/supabase/client';
import type { FormOcorrencia, Ocorrencia } from '@/lib/ocorrencias';

const COLUNAS =
  'id, data, turno, n_avaria, descricao, hora_inicio, hora_termino, encaminhamento, categoria, sistema, ' +
  'criada_por_codigo, criada_em';

/** As avarias de um dia, pela ordem em que foram registadas (como as linhas da ficha em papel). */
export async function listarOcorrenciasDoDia(data: string): Promise<Ocorrencia[]> {
  const { data: linhas, error } = await supabase
    .from('ocorrencias')
    .select(COLUNAS)
    .eq('data', data)
    .order('criada_em', { ascending: true });
  if (error) throw new Error(error.message);
  return (linhas ?? []) as unknown as Ocorrencia[];
}

/** As mais recentes de todos os dias (histórico e pesquisa). */
export async function listarOcorrencias(limite = 500): Promise<Ocorrencia[]> {
  const { data, error } = await supabase
    .from('ocorrencias')
    .select(COLUNAS)
    .order('data', { ascending: false })
    .order('criada_em', { ascending: false })
    .limit(limite);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Ocorrencia[];
}

/** As que ainda estão em curso (sem hora de término), de qualquer dia. */
export async function listarEmCurso(): Promise<Ocorrencia[]> {
  const { data, error } = await supabase
    .from('ocorrencias')
    .select(COLUNAS)
    .is('hora_termino', null)
    .order('data', { ascending: true })
    .order('criada_em', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Ocorrencia[];
}

/** Quantas estão em curso (para o menu). */
export async function contarEmCurso(): Promise<number> {
  const { count } = await supabase.from('ocorrencias').select('id', { count: 'exact', head: true }).is('hora_termino', null);
  return count ?? 0;
}

export async function obterObservacoesDia(data: string): Promise<string> {
  const { data: linha, error } = await supabase.from('ocorrencias_dia').select('observacoes').eq('data', data).maybeSingle();
  if (error) throw new Error(error.message);
  return linha?.observacoes ?? '';
}

export async function guardarObservacoesDia(data: string, texto: string): Promise<{ erro: string | null }> {
  const { error } = await supabase.rpc('guardar_observacoes_dia', { p_data: data, p_texto: texto });
  return { erro: error ? error.message : null };
}

export async function registarOcorrencia(f: FormOcorrencia): Promise<{ erro: string | null }> {
  const { error } = await supabase.rpc('registar_ocorrencia', {
    p_data: f.data,
    p_turno: f.turno,
    p_n_avaria: f.n_avaria,
    p_descricao: f.descricao,
    p_hora_inicio: f.hora_inicio,
    p_hora_termino: f.hora_termino,
    p_encaminhamento: f.encaminhamento,
    p_categoria: f.categoria,
    p_sistema: f.sistema,
  });
  return { erro: error ? error.message : null };
}

export async function atualizarOcorrencia(id: string, f: FormOcorrencia): Promise<{ erro: string | null }> {
  const { error } = await supabase.rpc('atualizar_ocorrencia', {
    p_id: id,
    p_n_avaria: f.n_avaria,
    p_descricao: f.descricao,
    p_hora_inicio: f.hora_inicio,
    p_hora_termino: f.hora_termino,
    p_encaminhamento: f.encaminhamento,
    p_categoria: f.categoria,
    p_sistema: f.sistema,
  });
  return { erro: error ? error.message : null };
}

export async function terminarOcorrencia(id: string, horaTermino: string): Promise<{ erro: string | null }> {
  const { error } = await supabase.rpc('terminar_ocorrencia', { p_id: id, p_hora_termino: horaTermino });
  return { erro: error ? error.message : null };
}

export async function reabrirOcorrencia(id: string): Promise<{ erro: string | null }> {
  const { error } = await supabase.rpc('reabrir_ocorrencia', { p_id: id });
  return { erro: error ? error.message : null };
}

export interface AnexoOcorrencias {
  data: string;
  linhas: Ocorrencia[];
  observacoes: string;
}

/**
 * O que se anexa ao PDF da ficha desse dia: as avarias e as observações. null se não houver nada
 * (a ficha sai sem o anexo). Nunca lança: uma falha aqui não pode impedir a exportação da ficha.
 */
export async function carregarAnexoOcorrencias(data: string): Promise<AnexoOcorrencias | null> {
  try {
    const [linhas, observacoes] = await Promise.all([listarOcorrenciasDoDia(data), obterObservacoesDia(data)]);
    if (linhas.length === 0 && observacoes.trim() === '') return null;
    return { data, linhas, observacoes };
  } catch (e) {
    console.error('Erro ao carregar as ocorrências do dia:', e);
    return null;
  }
}
