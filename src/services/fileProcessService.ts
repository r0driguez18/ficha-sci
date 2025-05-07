import { supabase } from '@/integrations/supabase/client';

export interface FileProcessData {
  time_registered: string;
  task?: string;
  as400_name?: string | null;
  operation_number?: string | null;
  executed_by: string;
  is_salary?: boolean;
}

export const saveFileProcess = async (data: FileProcessData) => {
  try {
    console.log('Tentando salvar processo:', data);
    
    // Prepare data based on what's available
    const processData: FileProcessData = {
      time_registered: data.time_registered,
      executed_by: data.executed_by,
      is_salary: data.is_salary || false
    };
    
    // Only include non-empty fields (allow null for as400_name if task exists)
    if (data.operation_number && data.operation_number.trim() !== '') {
      processData.operation_number = data.operation_number;
    } else {
      processData.operation_number = null;
    }
    
    // Always include task (may be empty string)
    processData.task = data.task || '';
    
    // Include as400_name only if provided, otherwise null
    processData.as400_name = data.as400_name || null;
    
    console.log('Dados a inserir:', processData);
    
    // Check for duplicate entries
    const { data: existingProcesses, error: checkError } = await supabase
      .from('file_processes')
      .select('*')
      .eq('time_registered', data.time_registered)
      .eq('task', data.task || '')
      .eq('executed_by', data.executed_by);
    
    if (checkError) {
      console.error('Erro ao verificar processos existentes:', checkError);
      return { error: checkError };
    }
    
    if (existingProcesses && existingProcesses.length > 0) {
      console.warn('Este processo já existe no sistema');
      return { error: { message: 'Este processamento já existe no sistema' } };
    }
    
    // Insert new process
    const { data: newProcess, error } = await supabase
      .from('file_processes')
      .insert(processData);
    
    if (error) {
      console.error('Erro ao salvar processo:', error);
      return { error };
    }
    
    console.log('Processo salvo com sucesso:', newProcess);
    return { data: newProcess };
  } catch (error) {
    console.error('Erro ao salvar processo:', error);
    return { error };
  }
};

export const fetchFileProcesses = async (timeframe = 'week') => {
  const today = new Date();
  let startDate = new Date();

  switch (timeframe) {
    case 'week':
      startDate.setDate(today.getDate() - today.getDay()); // Start of the week (Sunday)
      break;
    case 'month':
      startDate.setDate(1); // Start of the month
      break;
    case 'year':
      startDate.setMonth(0, 1); // Start of the year
      break;
    default:
      startDate.setDate(today.getDate() - today.getDay()); // Default to week
      break;
  }

  const formattedStartDate = startDate.toISOString().split('T')[0];
  const formattedEndDate = today.toISOString().split('T')[0];

  try {
    const { data, error } = await supabase
      .from('file_processes')
      .select('*')
      .gte('time_registered', formattedStartDate)
      .lte('time_registered', formattedEndDate);

    if (error) {
      console.error('Erro ao buscar processos:', error);
      return { error };
    }

    return { data };
  } catch (error) {
    console.error('Erro ao buscar processos:', error);
    return { error };
  }
};
