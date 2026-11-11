import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { TurnKey } from '@/types/taskboard';
import { hojeCaboVerde, ordenarAtivas } from '@/lib/passagemTurno';

/** Uma leitura: quem confirmou que leu a nota, e quando. */
export interface HandoverLeitura {
  id: string;
  entry_id: string;
  user_id: string;
  user_nome: string | null;
  lida_em: string;
}

/**
 * Uma nota deixada na passagem de turno. Só cresce: nunca se reescreve nem
 * se apaga — deixar outra nota acrescenta uma entrada nova.
 */
export interface HandoverEntrada {
  id: string;
  date: string;
  turno: TurnKey;
  texto: string;
  autor_user_id: string | null;
  autor_nome: string | null;
  created_at: string;
  arquivada_em: string | null;
  arquivada_por_nome: string | null;
  /** Instante em que sai das ativas (24 h depois da 2.ª confirmação); null enquanto não houver 2. */
  arquivar_apos: string | null;
  /** Fixada: fica nas ativas (sem prazo de 24 h, sem arquivar) até `fixada_ate` (inclusive) ou até ser desafixada. */
  fixada_em: string | null;
  fixada_por_nome: string | null;
  fixada_ate: string | null;
  /** Preenchidos quando o autor corrige a nota: o texto da 1.ª versão e quando foi editada. */
  texto_original: string | null;
  editada_em: string | null;
  leituras: HandoverLeitura[];
}

const SELECT_ENTRADA = '*, handover_reads(*)';

function paraEntradas(data: Array<Record<string, unknown>>): HandoverEntrada[] {
  return data.map(({ handover_reads, ...e }) => ({
    ...e,
    leituras: [...((handover_reads as HandoverLeitura[] | null) ?? [])].sort((a: HandoverLeitura, b: HandoverLeitura) =>
      a.lida_em.localeCompare(b.lida_em),
    ),
  })) as HandoverEntrada[];
}

/** Notas ainda não arquivadas (vista atual): fixadas primeiro, depois das mais recentes para as mais antigas. */
export async function getHandoverAtuais(): Promise<{ data: HandoverEntrada[] | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('handover_entries')
    .select(SELECT_ENTRADA)
    .is('arquivada_em', null)
    // Com 2 confirmações a nota sai das ativas 24 h depois (fica no histórico) — a não ser que esteja fixada.
    .or(
      `arquivar_apos.is.null,arquivar_apos.gt.${new Date().toISOString()},` +
        `and(fixada_em.not.is.null,or(fixada_ate.is.null,fixada_ate.gte.${hojeCaboVerde()}))`,
    )
    .order('created_at', { ascending: false })
    .limit(300);
  if (error || !data) return { data: null, error };
  return { data: ordenarAtivas(paraEntradas(data)), error: null };
}

/** Notas ativas que a pessoa autenticada ainda não leu (número do menu). */
export async function contarNotasPorLer(): Promise<number> {
  const { data, error } = await supabase.rpc('contar_passagem_turno_por_ler');
  if (error) throw error;
  return Number(data ?? 0);
}

/** O autor corrige o texto da própria nota (o servidor recusa a quem não a deixou). */
export async function editarEntradaHandover(id: string, texto: string): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.rpc('editar_entrada_passagem_turno', { p_id: id, p_texto: texto });
  return { error };
}

/** Fixa a nota; `ate` (AAAA-MM-DD, inclusive) opcional — sem ele fica até ser desafixada. */
export async function fixarEntradaHandover(id: string, ate: string | null): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.rpc('fixar_entrada_passagem_turno', { p_id: id, p_ate: ate });
  return { error };
}

export async function desafixarEntradaHandover(id: string): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.rpc('desafixar_entrada_passagem_turno', { p_id: id });
  return { error };
}

export interface FiltrosHistorico {
  de?: string;
  ate?: string;
  turno?: TurnKey | '';
  texto?: string;
}

export const HISTORICO_POR_PAGINA = 20;

/** Histórico completo (arquivadas incluídas), paginado e com filtros. */
export async function getHandoverHistorico(
  filtros: FiltrosHistorico,
  pagina: number,
): Promise<{ data: HandoverEntrada[] | null; total: number; error: PostgrestError | null }> {
  let q = supabase.from('handover_entries').select(SELECT_ENTRADA, { count: 'exact' });
  if (filtros.de) q = q.gte('date', filtros.de);
  if (filtros.ate) q = q.lte('date', filtros.ate);
  if (filtros.turno) q = q.eq('turno', filtros.turno);
  const termo = (filtros.texto ?? '').trim().replace(/[%_,()]/g, ' ');
  if (termo) q = q.ilike('texto', `%${termo}%`);
  const de = pagina * HISTORICO_POR_PAGINA;
  const { data, error, count } = await q
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(de, de + HISTORICO_POR_PAGINA - 1);
  if (error || !data) return { data: null, total: 0, error };
  return { data: paraEntradas(data), total: count ?? 0, error: null };
}



/**
 * Deixa uma nota nova — via RPC, para que o autor venha sempre de auth.uid()
 * no servidor (nunca de um parâmetro do cliente, que podia ser forjado).
 */
export async function adicionarEntradaHandover(
  date: string,
  turno: TurnKey,
  texto: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.rpc('adicionar_entrada_passagem_turno', {
    p_date: date,
    p_turno: turno,
    p_texto: texto,
  });
  return { error };
}

/**
 * Regista que quem está autenticado leu esta nota — via RPC (identidade do
 * servidor). Repetir não altera a hora da primeira leitura.
 */
export async function confirmarLeituraEntradaHandover(
  entryId: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.rpc('confirmar_leitura_entrada_passagem_turno', {
    p_entry_id: entryId,
  });
  return { error };
}

/** Tira as notas da vista atual (ficam no histórico, com quem arquivou e quando). */
export async function arquivarEntradasHandover(
  ids: string[],
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.rpc('arquivar_entradas_passagem_turno', { p_ids: ids });
  return { error };
}
