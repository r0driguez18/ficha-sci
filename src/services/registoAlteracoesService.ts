import { supabase } from '@/integrations/supabase/client';

export interface RegistoAlteracao {
  id: number;
  quando: string;
  tabela: string;
  operacao: 'INSERT' | 'UPDATE' | 'DELETE';
  registo_id: string | null;
  operador: string;
  resumo: string;
  /** UPDATE: { campo: { de, para } }. INSERT/DELETE: os campos principais. */
  alteracoes: Record<string, unknown>;
}

export interface FiltroRegisto {
  tabela?: string;
  operador?: string;
  /** AAAA-MM-DD (inclusive) */
  de?: string;
  /** AAAA-MM-DD (inclusive) */
  ate?: string;
}

export const TAMANHO_PAGINA = 50;

/** Nome de cada tabela como se mostra ao administrador. */
export const TABELAS_AUDITADAS: Record<string, string> = {
  exported_taskboards: 'Fichas exportadas',
  ps2_lotes: 'Lotes PS2 / verificação',
  operators: 'Operadores e papéis',
  operator_pins: 'PINs',
  cobrancas_retornos: 'Retornos de cobrança',
  handover_notes: 'Passagem de turno (notas)',
  handover_entries: 'Passagem de turno (registos)',
  card_renewal_sessions: 'Renovação de cartões (sessões)',
  card_renewal_lotes: 'Renovação de cartões (lotes)',
  file_processes: 'Processamentos',
  contas: 'Contas de utilizador',
};

/** Só os administradores leem (RLS). A paginação é por "antes do id X". */
export async function listarRegisto(
  filtro: FiltroRegisto,
  antesDoId?: number,
): Promise<{ registos: RegistoAlteracao[]; erro: string | null }> {
  let q = supabase
    .from('registo_alteracoes')
    .select('id, quando, tabela, operacao, registo_id, operador, resumo, alteracoes')
    .order('id', { ascending: false })
    .limit(TAMANHO_PAGINA);
  if (filtro.tabela) q = q.eq('tabela', filtro.tabela);
  if (filtro.operador) q = q.eq('operador', filtro.operador.trim().toLowerCase());
  if (filtro.de) q = q.gte('quando', `${filtro.de}T00:00:00`);
  if (filtro.ate) q = q.lt('quando', `${proximoDia(filtro.ate)}T00:00:00`);
  if (antesDoId !== undefined) q = q.lt('id', antesDoId);
  const { data, error } = await q;
  if (error) return { registos: [], erro: error.message };
  return { registos: (data ?? []) as unknown as RegistoAlteracao[], erro: null };
}

/** "2026-10-31" → "2026-11-01" (para o limite superior exclusivo do filtro). */
export function proximoDia(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d + 1));
  return dt.toISOString().slice(0, 10);
}

/** Texto curto de um valor para mostrar numa célula. */
export function mostrarValor(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v === '' ? '(vazio)' : v;
  if (typeof v === 'boolean') return v ? 'sim' : 'não';
  return JSON.stringify(v);
}

/** Linhas "campo: de → para" para um UPDATE, ou "campo: valor" para criado/apagado. */
export function descreverAlteracoes(r: Pick<RegistoAlteracao, 'operacao' | 'alteracoes'>): string[] {
  return Object.entries(r.alteracoes ?? {}).map(([campo, v]) => {
    if (r.operacao === 'UPDATE' && v && typeof v === 'object' && 'de' in (v as object) && 'para' in (v as object)) {
      const { de, para } = v as { de: unknown; para: unknown };
      return `${campo}: ${mostrarValor(de)} → ${mostrarValor(para)}`;
    }
    return `${campo}: ${mostrarValor(v)}`;
  });
}
