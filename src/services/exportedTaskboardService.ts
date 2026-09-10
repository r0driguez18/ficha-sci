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
export async function checkDuplicateOperations(
  formType: string,
  date: string,
  newOperations: string[]
): Promise<string[]> {
  if (!newOperations || newOperations.length === 0) return [];
  
  // Since operations should be globally unique, we don't filter by user
  const { data, error } = await supabase
    .from('exported_taskboards')
    .select('form_type, date, table_rows');
    
  if (error || !data) {
    console.error('Error fetching exported taskboards to check duplicates', error);
    return [];
  }
  
  const existingOps = new Set<string>();
  data.forEach((board: any) => {
    // skip the form we are currently editing (so they can edit the same form multiple times today)
    if (board.form_type === formType && board.date === date) return;
    
    if (Array.isArray(board.table_rows)) {
      board.table_rows.forEach((row: any) => {
        if (row.operacao && typeof row.operacao === 'string' && row.operacao.trim()) {
          existingOps.add(row.operacao.trim());
        }
      });
    }
  });

  // Test against actual file_processes database as well
  const { data: fileProcesses } = await supabase
    .from('file_processes')
    .select('operation_number, time_registered')
    .in('operation_number', newOperations);

  if (fileProcesses) {
    fileProcesses.forEach((p: any) => {
      // Regra ativada: Qualquer número de operação que já conste no sistema bloqueia a ficha inteira
      if (p.operation_number && typeof p.operation_number === 'string') {
        existingOps.add(p.operation_number.trim());
      }
    });
  }
  
  return newOperations.filter(op => existingOps.has(op.trim()));
}