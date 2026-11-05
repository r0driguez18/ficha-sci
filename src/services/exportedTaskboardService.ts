import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { TurnDataType, TasksType, TapesStatus, TapesEvidenciaFile } from '@/types/taskboard';
import { TaskTableRow } from '@/types/taskTableRow';
import { FichaSignature } from '@/types/signature';

export interface ExportedTaskboard {
  id: string;
  user_id: string;
  form_type: string;
  date: string;
  exported_at: string;
  turn_data: TurnDataType;
  tasks: TasksType;
  table_rows: TaskTableRow[];
  pdf_signature: FichaSignature;
  file_name: string;
  created_at: string;
  updated_at: string;
  /** Estado da prova do display-tape (folha de verificação de tapes). */
  tapes_status: TapesStatus;
  tapes_evidencia: TapesEvidenciaFile[];
  tapes_anexada_at: string | null;
  tapes_anexada_by: string | null;
  /** 1 = como exportada; sobe a cada retificação. */
  versao?: number;
  editada_em?: string | null;
  editada_por_codigo?: string | null;
  /** O aviso "Confirmar data" do Histórico foi resolvido por alguém (quem e quando). */
  data_confirmada_em?: string | null;
  data_confirmada_por?: string | null;
}

/**
 * Save a completed taskboard to the exported history
 */
export async function saveExportedTaskboard(
  userId: string,
  formType: string,
  date: string,
  turnData: TurnDataType,
  tasks: TasksType,
  tableRows: TaskTableRow[],
  signature: FichaSignature,
  /** A ficha tem folha de verificação de tapes (dia não útil ou fim de mês). */
  requiresTapesEvidencia = false
): Promise<{ data: ExportedTaskboard | null; error: any }> {
  const fileName = `Taskboard_${formType}_${date}_${(signature.signerName || 'sem_nome').replace(/\s+/g, '_')}.pdf`;

  // Check if already exists for this date and form type
  const { data: existing } = await supabase
    .from('exported_taskboards')
    .select('id, tapes_status')
    .eq('user_id', userId)
    .eq('form_type', formType)
    .eq('date', date)
    .maybeSingle();

  if (existing) {
    // Update existing record. Não mexemos numa prova já anexada; se a ficha
    // passou a exigir tapes e ainda estava "nao_aplicavel", marca-se pendente.
    const nextTapesStatus =
      !requiresTapesEvidencia
        ? 'nao_aplicavel'
        : existing.tapes_status === 'nao_aplicavel'
          ? 'pendente'
          : existing.tapes_status;

    const { data, error } = await supabase
      .from('exported_taskboards')
      .update({
        turn_data: turnData as any,
        tasks: tasks as any,
        table_rows: tableRows as any,
        pdf_signature: signature as any,
        file_name: fileName,
        exported_at: new Date().toISOString(),
        tapes_status: nextTapesStatus,
        ...(nextTapesStatus === 'nao_aplicavel'
          ? { tapes_evidencia: [], tapes_anexada_at: null, tapes_anexada_by: null }
          : {}),
      })
      .eq('id', existing.id)
      .select()
      .single();

    return { data: data as unknown as ExportedTaskboard, error };
  } else {
    // Create new record
    const { data, error } = await supabase
      .from('exported_taskboards')
      .insert({
        user_id: userId,
        form_type: formType,
        date: date,
        turn_data: turnData as any,
        tasks: tasks as any,
        table_rows: tableRows as any,
        pdf_signature: signature as any,
        file_name: fileName,
        tapes_status: requiresTapesEvidencia ? 'pendente' : 'nao_aplicavel',
      })
      .select()
      .single();

    return { data: data as unknown as ExportedTaskboard, error };
  }
}

/**
 * Já existe (de qualquer operador da equipa) uma ficha exportada para esta
 * data? Usado no Dashboard para o cartão "Ficha de hoje".
 */
export async function existeExportadaNaData(
  date: string,
): Promise<{ exportada: boolean; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('exported_taskboards')
    .select('id')
    .eq('date', date)
    .limit(1);
  return { exportada: !!(data && data.length > 0), error };
}

/**
 * Fichas arquivadas cuja folha de verificação de tapes ainda está sem o
 * print do display-tape anexado.
 */
export async function getPendingTapesEvidencia(): Promise<{
  data: ExportedTaskboard[] | null;
  error: PostgrestError | null;
}> {
  const { data, error } = await supabase
    .from('exported_taskboards')
    .select('*')
    .eq('tapes_status', 'pendente')
    .order('date', { ascending: true });

  return { data: data as unknown as ExportedTaskboard[], error };
}

/**
 * Todas as fichas exportadas da equipa (F1 — o histórico é consultado pela
 * auditoria e pela chefia, independentemente de quem esteve ao serviço).
 */
export async function getExportedTaskboards(): Promise<{ data: ExportedTaskboard[] | null; error: any }> {
  const { data, error } = await supabase
    .from('exported_taskboards')
    .select('*')
    .order('exported_at', { ascending: false });

  return { data: data as unknown as ExportedTaskboard[], error };
}

/**
 * Get exported taskboard by id
 */
export async function getExportedTaskboardById(id: string): Promise<{ data: ExportedTaskboard | null; error: any }> {
  const { data, error } = await supabase
    .from('exported_taskboards')
    .select('*')
    .eq('id', id)
    .single();

  return { data: data as unknown as ExportedTaskboard, error };
}

/**
 * Delete exported taskboard
 */
export async function deleteExportedTaskboard(id: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('exported_taskboards')
    .delete()
    .eq('id', id);

  return { error };
}

/**
 * Check if given operation numbers already exist in previous boards
 * Ignores operations in the currently edited form (same date and form type).
 */
/**
 * Verifica operações duplicadas (mesma regra de sempre: qualquer nº já
 * usado em qualquer data bloqueia, exceto a própria ficha em edição) — a
 * agregação corre no Postgres (`operacoes_duplicadas_ficha`), não busca a
 * tabela inteira para o browser a cada clique em exportar.
 */
export async function checkDuplicateOperations(
  formType: string,
  date: string,
  newOperations: string[]
): Promise<string[]> {
  if (!newOperations || newOperations.length === 0) return [];

  const ops = newOperations.map((op) => op.trim()).filter(Boolean);
  const { data, error } = await supabase.rpc('operacoes_duplicadas_ficha', {
    p_form_type: formType,
    p_date: date,
    p_operacoes: ops,
  });

  if (error) {
    console.error('Error checking duplicate operations', error);
    // Nunca falhar "aberto": se não conseguimos verificar duplicados, a
    // exportação tem de ser bloqueada, não avançar sem aviso.
    throw new Error('Não foi possível verificar operações duplicadas.');
  }

  return data ?? [];
}
// ---------------------------------------------------------------- retificação

export interface EdicaoFicha {
  id: string;
  ficha_id: string;
  versao_anterior: number;
  versao_nova: number;
  editado_por_codigo: string | null;
  editado_em: string;
  motivo: string;
  antes: { date: string; turn_data: Record<string, unknown>; tasks: Record<string, unknown>; table_rows: Array<Record<string, unknown>> };
  depois: { date: string; turn_data: Record<string, unknown>; tasks: Record<string, unknown>; table_rows: Array<Record<string, unknown>> };
}

/** Grava a retificação: o servidor guarda o conteúdo anterior, gasta o token do PIN e sobe a versão. */
export async function editarFichaExportada(args: {
  id: string;
  token: string;
  date: string;
  turnData: unknown;
  tasks: unknown;
  tableRows: unknown;
  assinatura: unknown;
  motivo: string;
}): Promise<{ versao: number | null; error: string | null }> {
  const { data, error } = await (supabase as any).rpc('editar_ficha_exportada', {
    p_id: args.id,
    p_token: args.token,
    p_date: args.date,
    p_turn_data: args.turnData,
    p_tasks: args.tasks,
    p_table_rows: args.tableRows,
    p_assinatura: args.assinatura,
    p_motivo: args.motivo,
  });
  return { versao: (data as number | null) ?? null, error: error ? error.message : null };
}

/** Histórico de retificações de uma ficha . */
export async function listarEdicoesFicha(fichaId: string): Promise<{ data: EdicaoFicha[]; error: string | null }> {
  const { data, error } = await (supabase as any)
    .from('fichas_edicoes')
    .select('*')
    .eq('ficha_id', fichaId)
    .order('editado_em', { ascending: false });
  return { data: (data ?? []) as EdicaoFicha[], error: error ? error.message : null };
}

/** Marca a data da ficha como confirmada (fica quem e quando; o aviso do Histórico desaparece). */
export async function confirmarDataFicha(id: string): Promise<{ error: string | null }> {
  const { error } = await (supabase as any).rpc('confirmar_data_ficha', { p_id: id });
  return { error: error ? error.message : null };
}
