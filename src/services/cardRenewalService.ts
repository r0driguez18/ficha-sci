import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { LinhaBrutaCartao } from '@/lib/renovacaoCartoes';

export interface CardRenewalSession {
  id: string;
  user_id: string;
  nome: string;
  estado: 'em_curso' | 'concluida';
  proximo_lote: number;
  created_at: string;
  updated_at: string;
}

export interface CardRenewalLote {
  id: string;
  session_id: string;
  numero: number;
  balcoes: string[];
  total_cartoes: number;
  ficheiro_nome: string;
  criado_por: string | null;
  created_at: string;
}

export interface BalcaoPendente {
  balcao: string;
  pendentes: number;
}

/** Sessões de renovação ainda em curso, mais recente primeiro. */
export async function listarSessoesEmCurso(): Promise<{
  data: CardRenewalSession[] | null;
  error: PostgrestError | null;
}> {
  const { data, error } = await supabase
    .from('card_renewal_sessions')
    .select('*')
    .eq('estado', 'em_curso')
    .order('created_at', { ascending: false });
  return { data: data as unknown as CardRenewalSession[], error };
}

export async function criarSessaoRenovacao(
  nome: string,
): Promise<{ data: CardRenewalSession | null; error: PostgrestError | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: { message: 'Utilizador não autenticado' } as PostgrestError };
  }
  const { data, error } = await supabase
    .from('card_renewal_sessions')
    .insert({ nome, user_id: user.id })
    .select()
    .single();
  return { data: data as unknown as CardRenewalSession, error };
}

const TAMANHO_LOTE_INSERCAO = 500;

/**
 * Insere os cartões da sessão em blocos, sequencialmente (nunca em
 * paralelo — a ordem original do ficheiro só fica correta se os blocos
 * entrarem pela ordem certa). Idempotente: reenviar o mesmo ficheiro nunca
 * duplica um cartão (`UNIQUE (session_id, numero_cartao)`); uma correção
 * (balcão/nome) só se aplica a cartões ainda pendentes.
 */
export async function inserirCartoes(
  sessionId: string,
  linhas: LinhaBrutaCartao[],
): Promise<{ inseridos: number; error: PostgrestError | null }> {
  let inseridos = 0;
  for (let i = 0; i < linhas.length; i += TAMANHO_LOTE_INSERCAO) {
    const bloco = linhas.slice(i, i + TAMANHO_LOTE_INSERCAO).map((l) => ({
      session_id: sessionId,
      numero_cartao: l.numeroCartao,
      balcao: l.balcao,
      nome_titular: l.nomeTitular || null,
    }));
    const { error } = await supabase
      .from('card_renewal_cards')
      .upsert(bloco, { onConflict: 'session_id,numero_cartao', ignoreDuplicates: false });
    if (error) return { inseridos, error };
    inseridos += bloco.length;
  }
  return { inseridos, error: null };
}

/** Contagem de cartões ainda pendentes (sem lote), por balcão. */
export async function contarPendentesPorBalcao(
  sessionId: string,
): Promise<{ data: BalcaoPendente[] | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('card_renewal_cards')
    .select('balcao')
    .eq('session_id', sessionId)
    .is('lote_numero', null);
  if (error) return { data: null, error };

  const contagem = new Map<string, number>();
  for (const row of data ?? []) {
    contagem.set(row.balcao, (contagem.get(row.balcao) ?? 0) + 1);
  }
  const lista = Array.from(contagem.entries())
    .map(([balcao, pendentes]) => ({ balcao, pendentes }))
    .sort((a, b) => a.balcao.localeCompare(b.balcao, 'pt'));
  return { data: lista, error: null };
}

export async function totaisSessao(
  sessionId: string,
): Promise<{ total: number; pendentes: number; error: PostgrestError | null }> {
  const [totalRes, pendentesRes] = await Promise.all([
    supabase
      .from('card_renewal_cards')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId),
    supabase
      .from('card_renewal_cards')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .is('lote_numero', null),
  ]);
  if (totalRes.error) return { total: 0, pendentes: 0, error: totalRes.error };
  if (pendentesRes.error) return { total: 0, pendentes: 0, error: pendentesRes.error };
  return { total: totalRes.count ?? 0, pendentes: pendentesRes.count ?? 0, error: null };
}

export async function listarLotes(
  sessionId: string,
): Promise<{ data: CardRenewalLote[] | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('card_renewal_lotes')
    .select('*')
    .eq('session_id', sessionId)
    .order('numero');
  return { data: data as unknown as CardRenewalLote[], error };
}

/** Números de cartão de um lote já gerado, pela ordem original — para redescarregar. */
export async function cartoesDoLote(
  sessionId: string,
  loteNumero: number,
): Promise<{ data: string[] | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('card_renewal_cards')
    .select('numero_cartao')
    .eq('session_id', sessionId)
    .eq('lote_numero', loteNumero)
    .order('posicao');
  if (error) return { data: null, error };
  return { data: (data ?? []).map((r) => r.numero_cartao), error: null };
}

export interface CartaoDeLote {
  loteNumero: number;
  numeroCartao: string;
  balcao: string;
}

/**
 * Gera um novo lote (RPC atómica — bloqueia até 490 cartões pendentes dos
 * balcões indicados, pela ordem original, e marca-os com o novo nº de
 * lote). Nunca chamar duas vezes em paralelo para a mesma sessão a partir
 * do cliente — a página desativa o botão enquanto está em curso.
 */
export async function criarLoteRenovacao(
  sessionId: string,
  balcoes: string[],
  nomeBase: string,
  limite = 490,
): Promise<{ data: CartaoDeLote[] | null; error: PostgrestError | null }> {
  const { data, error } = await supabase.rpc('criar_lote_renovacao', {
    p_session_id: sessionId,
    p_balcoes: balcoes,
    p_nome_base: nomeBase,
    p_limite: limite,
  });
  if (error) return { data: null, error };
  const linhas = (data ?? []) as { lote_numero: number; numero_cartao: string; balcao: string }[];
  return {
    data: linhas.map((l) => ({ loteNumero: l.lote_numero, numeroCartao: l.numero_cartao, balcao: l.balcao })),
    error: null,
  };
}

export async function concluirSessaoRenovacao(
  sessionId: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.rpc('concluir_sessao_renovacao', { p_session_id: sessionId });
  return { error };
}
