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

// Get salary processes (starting with "SA")
export const getSalaryProcesses = async () => {
  try {
    const { data, error } = await supabase
      .from('file_processes')
      .select('*')
      .ilike('as400_name', 'SA%')
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

// Get company processes (starting with GA, IM, ENA, INP, BN, FCVT)
export const getDebitCreditProcesses = async () => {
  try {
    const companyPrefixes = ['GA%', 'IM%', 'ENA%', 'INP%', 'BN%', 'FCVT%'];
    
    // Build the filter for company prefixes
    let query = supabase
      .from('file_processes')
      .select('*');
    
    // Add the OR conditions for each prefix
    for (let i = 0; i < companyPrefixes.length; i++) {
      if (i === 0) {
        query = query.ilike('as400_name', companyPrefixes[i]);
      } else {
        query = query.or(`as400_name.ilike.${companyPrefixes[i]}`);
      }
    }
    
    const { data, error } = await query
      .order('date_registered', { ascending: false })
      .order('time_registered', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar processos de empresas:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar processos de empresas:', error);
    return [];
  }
};

// Function to get processes stats by month with correct categorization
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
      salary: number; 
      ga_processes: number;
      im_processes: number;
      ena_processes: number;
      inp_processes: number;
      bn_processes: number;
      fcvt_processes: number;
      other: number;
    }> = {};
    
    data?.forEach(process => {
      const date = new Date(process.date_registered);
      const monthKey = `${date.getMonth() + 1}/${date.getFullYear().toString().substr(2, 2)}`;
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = {
          month: monthKey,
          salary: 0,
          ga_processes: 0,
          im_processes: 0,
          ena_processes: 0,
          inp_processes: 0,
          bn_processes: 0,
          fcvt_processes: 0,
          other: 0
        };
      }
      
      // Check for AS400 name
      if (process.as400_name) {
        // Check for Salary processes (SA)
        if (process.as400_name.toUpperCase().startsWith('SA')) {
          monthlyStats[monthKey].salary += 1;
        } 
        // Check for various company processes by prefix
        else {
          const prefix = process.as400_name.toUpperCase();
          
          if (prefix.startsWith('GA')) {
            monthlyStats[monthKey].ga_processes += 1;
          } else if (prefix.startsWith('IM')) {
            monthlyStats[monthKey].im_processes += 1;
          } else if (prefix.startsWith('ENA')) {
            monthlyStats[monthKey].ena_processes += 1;
          } else if (prefix.startsWith('INP')) {
            monthlyStats[monthKey].inp_processes += 1;
          } else if (prefix.startsWith('BN')) {
            monthlyStats[monthKey].bn_processes += 1;
          } else if (prefix.startsWith('FCVT')) {
            monthlyStats[monthKey].fcvt_processes += 1;
          } else {
            // Any other AS400 process that doesn't match our known prefixes
            monthlyStats[monthKey].other += 1;
          }
        }
      } else {
        // Process with task but no AS400 name gets categorized as Other
        monthlyStats[monthKey].other += 1;
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
