import { supabase } from '@/integrations/supabase/client';
import type { Sentido } from '@/lib/verificacaoMovimentos';

export interface Ps2Lote {
  id: string;
  created_at: string;
  gerado_por_codigo: string | null;
  nome_ficheiro: string;
  empresa: string;
  conta_empresa: string;
  tipo_operacao: string;
  sentido: Sentido;
  data_processamento: string;
  total: number;
  n_registos: number;
  hash_ficheiro: string;
  estado: 'por_verificar' | 'verificado' | 'problema';
  verificado_por_codigo: string | null;
  verificado_em: string | null;
  contagem: number | null;
  mesma_pessoa: boolean | null;
  observacoes: string | null;
}

/** Só "Diversos (Crédito Empresa)" credita a empresa; os restantes tipos debitam-na. */
export function sentidoPorTipo(tipo: string): Sentido {
  return /cr[eé]dito empresa/i.test(tipo) ? 'credito' : 'debito';
}

/** SHA-256 em hexadecimal do conteúdo do ficheiro. */
export async function sha256Hex(texto: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface RegistoLote {
  nomeFicheiro: string;
  empresa: string;
  contaEmpresa: string;
  tipoOperacao: string;
  sentido: Sentido;
  /** AAAA-MM-DD */
  data: string;
  total: number;
  nRegistos: number;
  hash: string;
}

export async function registarLote(
  r: RegistoLote,
): Promise<{ id: string | null; repetido: boolean; repetidoEm: string | null; erro: string | null }> {
  const { data, error } = await supabase.rpc('registar_lote_ps2', {
    p_nome_ficheiro: r.nomeFicheiro,
    p_empresa: r.empresa,
    p_conta_empresa: r.contaEmpresa,
    p_tipo_operacao: r.tipoOperacao,
    p_sentido: r.sentido,
    p_data: r.data,
    p_total: r.total,
    p_n_registos: r.nRegistos,
    p_hash: r.hash,
  });
  if (error) return { id: null, repetido: false, repetidoEm: null, erro: error.message };
  const j = (data ?? {}) as { id?: string; repetido?: boolean; repetido_em?: string | null };
  return { id: j.id ?? null, repetido: j.repetido === true, repetidoEm: j.repetido_em ?? null, erro: null };
}

const COLUNAS =
  'id, created_at, gerado_por_codigo, nome_ficheiro, empresa, conta_empresa, tipo_operacao, sentido, ' +
  'data_processamento, total, n_registos, hash_ficheiro, estado, verificado_por_codigo, verificado_em, ' +
  'contagem, mesma_pessoa, observacoes';

export async function listarLotes(opcoes: { soPorVerificar?: boolean; limite?: number } = {}): Promise<{
  lotes: Ps2Lote[];
  erro: string | null;
}> {
  let q = supabase
    .from('ps2_lotes')
    .select(COLUNAS)
    .order('created_at', { ascending: false })
    .limit(opcoes.limite ?? 300);
  if (opcoes.soPorVerificar) q = q.eq('estado', 'por_verificar');
  const { data, error } = await q;
  if (error) return { lotes: [], erro: error.message };
  return { lotes: (data ?? []) as unknown as Ps2Lote[], erro: null };
}

export async function editarLote(id: string, empresa: string, sentido: Sentido): Promise<{ erro: string | null }> {
  const { error } = await supabase.rpc('editar_lote_ps2', { p_id: id, p_empresa: empresa, p_sentido: sentido });
  return { erro: error ? error.message : null };
}

export async function verificarLote(
  id: string,
  token: string,
  contagem: number,
  observacoes: string,
): Promise<{ erro: string | null }> {
  const { error } = await supabase.rpc('verificar_lote_ps2', {
    p_id: id,
    p_token: token,
    p_contagem: contagem,
    p_observacoes: observacoes,
  });
  return { erro: error ? error.message : null };
}
