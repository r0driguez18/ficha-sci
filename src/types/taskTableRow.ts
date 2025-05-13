
import { Json } from '@/integrations/supabase/types';

export interface TaskTableRow {
  id: number;
  hora: string;
  tarefa: string;
  nomeAs: string;
  operacao: string;
  executado: string;
}

// This ensures compatibility with Supabase's Json type
export type TaskTableRowJson = Record<string, any>;

