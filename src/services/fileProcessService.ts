
import { supabase } from '@/integrations/supabase/client';

export interface FileProcessData {
  time_registered: string;
  task?: string;
  as400_name?: string | null;
  operation_number?: string | null;
  executed_by: string;
  is_salary?: boolean;
}

export interface FileProcess {
  id: string;
  date_registered: string;
  time_registered: string;
  task: string;
  as400_name: string | null;
  operation_number: string | null;
  executed_by: string;
  is_salary: boolean;
  created_at?: string;
}

export const saveFileProcess = async (data: FileProcessData) => {
  try {
    console.log('Tentando salvar processo:', data);
    
    // Prepare data based on what's available
    const processData: Record<string, any> = {
      time_registered: data.time_registered,
      executed_by: data.executed_by,
      is_salary: data.is_salary || false,
      // Always include task (may be empty string)
      task: data.task || '',
      // Include as400_name only if provided, otherwise explicitly set to null
      as400_name: data.as400_name || null
    };
    
    // Only include non-empty fields (allow null for as400_name if task exists)
    if (data.operation_number && data.operation_number.trim() !== '') {
      processData.operation_number = data.operation_number;
    } else {
      processData.operation_number = null;
    }
    
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

// Add the missing functions that are imported in other files
export const getFileProcesses = async () => {
  try {
    const { data, error } = await supabase
      .from('file_processes')
      .select('*')
      .order('date_registered', { ascending: false })
      .order('time_registered', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar processos:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar processos:', error);
    return [];
  }
};

export const getSalaryProcesses = async () => {
  try {
    const { data, error } = await supabase
      .from('file_processes')
      .select('*')
      .eq('is_salary', true)
      .order('date_registered', { ascending: false })
      .order('time_registered', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar processos de salário:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar processos de salário:', error);
    return [];
  }
};

export const getDebitCreditProcesses = async () => {
  try {
    const { data, error } = await supabase
      .from('file_processes')
      .select('*')
      .not('as400_name', 'is', null)
      .order('date_registered', { ascending: false })
      .order('time_registered', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar processos de débito/crédito:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar processos de débito/crédito:', error);
    return [];
  }
};

export const getProcessesStatsByMonth = async () => {
  try {
    // Format for querying: Extract year and month from date_registered
    const { data, error } = await supabase
      .from('file_processes')
      .select('*')
      .order('date_registered', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar estatísticas de processos:', error);
      return [];
    }
    
    // Process data to group by month
    const monthlyStats: Record<string, { month: string; total: number; salary: number; other: number }> = {};
    
    data?.forEach(process => {
      const date = new Date(process.date_registered);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = {
          month: monthName,
          total: 0,
          salary: 0,
          other: 0
        };
      }
      
      monthlyStats[monthKey].total += 1;
      
      if (process.is_salary) {
        monthlyStats[monthKey].salary += 1;
      } else {
        monthlyStats[monthKey].other += 1;
      }
    });
    
    // Convert to array and sort by month
    return Object.values(monthlyStats);
  } catch (error) {
    console.error('Erro ao processar estatísticas:', error);
    return [];
  }
};

export const cleanupDuplicateProcesses = async () => {
  try {
    // This function would identify and remove duplicate entries
    // For demonstration, we'll implement a basic version
    const { data, error } = await supabase
      .from('file_processes')
      .select('*');
    
    if (error) {
      console.error('Erro ao buscar processos para limpeza:', error);
      return { removed: 0 };
    }
    
    // In a real implementation, you would identify duplicates and remove them
    // This is a placeholder implementation
    console.log('Limpeza de dados simulada - não foram removidos registros reais');
    return { removed: 0 };
  } catch (error) {
    console.error('Erro ao limpar dados duplicados:', error);
    return { removed: 0 };
  }
};
