import { supabase } from '@/integrations/supabase/client';
import { TurnDataType, TasksType } from '@/types/taskboard';
import { TaskTableRow } from '@/types/taskTableRow';

export interface ExportedTaskboard {
  id: string;
  user_id: string;
  form_type: string;
  date: string;
  exported_at: string;
  turn_data: TurnDataType;
  tasks: TasksType;
  table_rows: TaskTableRow[];
  pdf_signature: {
    signerName: string;
    signedAt: string;
    imageDataUrl: string | null;
  };
  file_name: string;
  created_at: string;
  updated_at: string;
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
  signature: {
    signerName: string;
    signedAt: string;
    imageDataUrl: string | null;
  }
): Promise<{ data: ExportedTaskboard | null; error: any }> {
  const fileName = `Taskboard_${formType}_${date}_${signature.signerName.replace(/\s+/g, '_')}.pdf`;
  
  // Check if already exists for this date and form type
  const { data: existing } = await supabase
    .from('exported_taskboards')
    .select('id')
    .eq('user_id', userId)
    .eq('form_type', formType)
    .eq('date', date)
    .maybeSingle();
    
  if (existing) {
    // Update existing record
    const { data, error } = await supabase
      .from('exported_taskboards')
      .update({
        turn_data: turnData as any,
        tasks: tasks as any,
        table_rows: tableRows as any,
        pdf_signature: signature as any,
        file_name: fileName,
        exported_at: new Date().toISOString()
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
        file_name: fileName
      })
      .select()
      .single();
      
    return { data: data as unknown as ExportedTaskboard, error };
  }
}

/**
 * Get all exported taskboards for a user
 */
export async function getExportedTaskboards(userId: string): Promise<{ data: ExportedTaskboard[] | null; error: any }> {
  const { data, error } = await supabase
    .from('exported_taskboards')
    .select('*')
    .eq('user_id', userId)
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
  
  return newOperations.filter(op => existingOps.has(op.trim()));
}