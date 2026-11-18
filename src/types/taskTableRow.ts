
import { Json } from '@/integrations/supabase/types';

export interface TaskTableRow {
  id: number;
  hora: string;
  tarefa: string;
  nomeAs: string;
  operacao: string;
  executado: string;
  tipo: string;
  /** «core»: acrescentada a partir das aplicações do dia (a «Tarefa» fica vazia). Sem isto, foi escrita à mão. */
  origem?: 'core';
}

// This ensures compatibility with Supabase's Json type
export type TaskTableRowJson = Record<string, any>;

