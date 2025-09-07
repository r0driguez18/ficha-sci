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
  tipo: string | null;
  created_at?: string;
}

export const saveFileProcess = async (data: FileProcessData) => {
  try {
    console.log('Tentando salvar processo:', data);
    
    // Prepare data based on what's available
    const processData = {
      time_registered: data.time_registered,
      executed_by: data.executed_by,
      is_salary: data.is_salary || false,
      // Always include task (may be empty string)
      task: data.task || '',
      // Include as400_name only if provided, otherwise explicitly set to null
      as400_name: data.as400_name || null,
      // Set operation_number to null if not provided
      operation_number: data.operation_number && data.operation_number.trim() !== '' 
        ? data.operation_number 
        : null
    };
    
    console.log('Dados a inserir:', processData);
    
    // Only check for duplicate operation number if one is provided
    if (processData.operation_number) {
      const { data: existingProcesses, error: checkError } = await supabase
        .from('file_processes')
        .select('*')
        .eq('operation_number', processData.operation_number);
      
      if (checkError) {
        console.error('Erro ao verificar processos existentes:', checkError);
        return { error: checkError };
      }
      
      if (existingProcesses && existingProcesses.length > 0) {
        console.warn('Número de operação já existe no sistema');
        return { error: { message: 'Este número de operação já existe no sistema' } };
      }
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

// Get all file processes
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

// Get salary processes
export const getSalaryProcesses = async () => {
  try {
    const { data, error } = await supabase
      .from('file_processes')
      .select('*')
      .eq('tipo', 'salario')
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

// Get collections processes
export const getCobrancasProcesses = async () => {
  try {
    const { data, error } = await supabase
      .from('file_processes')
      .select('*')
      .eq('tipo', 'cobrancas')
      .order('date_registered', { ascending: false })
      .order('time_registered', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar processos de cobranças:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar processos de cobranças:', error);
    return [];
  }
};

// Get compensation processes
export const getCompensacaoProcesses = async () => {
  try {
    const { data, error } = await supabase
      .from('file_processes')
      .select('*')
      .eq('tipo', 'compensacao')
      .order('date_registered', { ascending: false })
      .order('time_registered', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar processos de compensação:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar processos de compensação:', error);
    return [];
  }
};

// Function to get processes stats by month with correct categorization and formatting
export const getProcessesStatsByMonth = async () => {
  try {
    // Get all processes
    const { data, error } = await supabase
      .from('file_processes')
      .select('*')
      .order('date_registered', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar estatísticas de processos:', error);
      return [];
    }
    
    // Process data to group by month
    const monthlyStats: Record<string, { 
      month: string; 
      salario: number; 
      cobrancas: number;
      compensacao: number;
      outros: number;
    }> = {};
    
    // Helper function to format date properly
    const formatMonthKey = (date: Date) => {
      // Format as MM/YY for better display
      return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
    };
    
    data?.forEach(process => {
      const date = new Date(process.time_registered);
      const monthKey = formatMonthKey(date);
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = {
          month: monthKey,
          salario: 0,
          cobrancas: 0,
          compensacao: 0,
          outros: 0
        };
      }
      
      // Categorize based on tipo field
      if (process.tipo) {
        switch (process.tipo) {
          case 'salario':
            monthlyStats[monthKey].salario += 1;
            break;
          case 'cobrancas':
            monthlyStats[monthKey].cobrancas += 1;
            break;
          case 'compensacao':
            monthlyStats[monthKey].compensacao += 1;
            break;
          default:
            monthlyStats[monthKey].outros += 1;
            break;
        }
      } else {
        // Process without tipo gets categorized as Others
        monthlyStats[monthKey].outros += 1;
      }
    });
    
    // Convert to array and sort by month/year
    return Object.values(monthlyStats).sort((a, b) => {
      const [aMonth, aYear] = a.month.split('/').map(Number);
      const [bMonth, bYear] = b.month.split('/').map(Number);
      
      if (aYear !== bYear) {
        return aYear - bYear;
      }
      return aMonth - bMonth;
    });
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
