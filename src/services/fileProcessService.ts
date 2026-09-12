import { supabase } from '@/integrations/supabase/client';

export interface FileProcessData {
  time_registered: string;
  task?: string;
  as400_name?: string | null;
  operation_number?: string | null;
  executed_by: string;
  is_salary?: boolean;
  tipo?: string | null;
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
        : null,
      // Include tipo for categorization
      tipo: data.tipo || null
    };

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

    return { data: newProcess };
  } catch (error) {
    console.error('Erro ao salvar processo:', error);
    return { error };
  }
};

export const fetchFileProcesses = async (timeframe = 'week') => {
  const today = new Date();
  const startDate = new Date();

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
//
// Pagina em blocos (o PostgREST self-hosted corta silenciosamente qualquer
// select a mais de 1000 linhas — PGRST_DB_MAX_ROWS). O tiebreaker por `id`
// garante uma ordem totalmente determinística entre páginas (sem isto,
// registos com o mesmo date_registered+time_registered podiam ficar
// duplicados ou saltados na fronteira de duas páginas). Lança o erro em vez
// de o engolir, para quem chama poder distinguir "falhou" de "sem dados".
export const getFileProcesses = async (): Promise<FileProcess[]> => {
  const PAGE = 1000;
  const all: FileProcess[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase
      .from('file_processes')
      .select('*')
      .order('date_registered', { ascending: false })
      .order('time_registered', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + PAGE - 1);

    if (error) {
      console.error('Erro ao buscar processos:', error);
      throw error;
    }

    all.push(...((data as FileProcess[] | null) ?? []));
    if (!data || data.length < PAGE) break;
    offset += PAGE;
  }
  return all;
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

// Agregação mensal: agora feita no cliente em `src/lib/processStats.ts`
// (`buildMonthlyStats`), a partir da lista já carregada e com parsing de data
// local. A antiga `getProcessesStatsByMonth` foi removida (sem consumidores e
// agrupava por data em UTC).

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
