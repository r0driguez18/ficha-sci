import { supabase } from "@/integrations/supabase/client";

export interface FileProcess {
  id?: string;
  date_registered?: string;
  time_registered: string;
  task?: string;
  as400_name?: string;
  operation_number?: string;
  executed_by?: string;
  is_salary?: boolean;
}

export const saveFileProcess = async (process: FileProcess): Promise<{ error: any; data: any }> => {
  // Determine process type based on the rules:
  // 1. If AS400 name starts with "SA", it's a salary process
  // 2. If AS400 name is provided but doesn't start with "SA", it's a company process
  // 3. If only task is provided (no AS400 name), it's other type of process
  const isSalary = process.as400_name?.startsWith("SA") || false;
  
  try {
    console.log("Tentando salvar processo:", { ...process, is_salary: isSalary });
    
    // Ensure at least one of task or as400_name is provided
    if (!process.task && !process.as400_name) {
      console.error("Erro: É necessário fornecer pelo menos o nome da tarefa ou o nome do AS400");
      return { 
        data: null, 
        error: { message: "É necessário fornecer pelo menos o nome da tarefa ou o nome do AS400." } 
      };
    }
    
    // Check if a process with this operation number already exists
    if (process.operation_number) {
      const { data: existingProcess } = await supabase
        .from("file_processes")
        .select("*")
        .eq("operation_number", process.operation_number)
        .maybeSingle();
      
      if (existingProcess) {
        console.log("Processo com número de operação já existe:", existingProcess);
        return { 
          data: [existingProcess], 
          error: { message: "Processo com este número de operação já existe." } 
        };
      }
    }
    
    // If no operation number but has task and as400_name, check for duplicate by those
    if (!process.operation_number && process.task && process.as400_name) {
      const { data: existingByTaskAndName } = await supabase
        .from("file_processes")
        .select("*")
        .eq("task", process.task)
        .eq("as400_name", process.as400_name)
        .maybeSingle();
        
      if (existingByTaskAndName) {
        console.log("Processo com mesma tarefa e AS400 já existe:", existingByTaskAndName);
        return { 
          data: [existingByTaskAndName], 
          error: { message: "Processo com mesma tarefa e nome AS400 já existe." } 
        };
      }
    }
    
    const { data, error } = await supabase
      .from("file_processes")
      .insert({
        time_registered: process.time_registered,
        task: process.task || null,
        as400_name: process.as400_name || null,
        operation_number: process.operation_number || null,
        executed_by: process.executed_by || null,
        is_salary: isSalary
      })
      .select();
    
    if (error) {
      console.error("Erro ao salvar processo:", error);
      throw error;
    } else {
      console.log("Processo salvo com sucesso:", data);
    }
    
    return { data, error };
  } catch (error) {
    console.error("Erro ao salvar processo:", error);
    return { data: null, error };
  }
};

export const getFileProcesses = async (): Promise<FileProcess[]> => {
  try {
    console.log("Buscando todos os processos...");
    
    const { data, error } = await supabase
      .from("file_processes")
      .select("*")
      .order("date_registered", { ascending: false });
    
    if (error) {
      console.error("Erro ao buscar processos:", error);
      throw error;
    }
    
    console.log(`Encontrados ${data?.length || 0} processos:`, data);
    return data || [];
  } catch (error) {
    console.error("Erro ao buscar processos:", error);
    return [];
  }
};

export const getSalaryProcesses = async (): Promise<FileProcess[]> => {
  try {
    console.log("Buscando processos de salário...");
    
    const { data, error } = await supabase
      .from("file_processes")
      .select("*")
      .eq("is_salary", true)
      .order("date_registered", { ascending: false });
    
    if (error) {
      console.error("Erro ao buscar salários:", error);
      throw error;
    }
    
    console.log(`Encontrados ${data?.length || 0} processos de salário:`, data);
    return data || [];
  } catch (error) {
    console.error("Erro ao buscar salários:", error);
    return [];
  }
};

export const getDebitCreditProcesses = async (): Promise<FileProcess[]> => {
  try {
    console.log("Buscando processos de débito e crédito...");
    
    const { data, error } = await supabase
      .from("file_processes")
      .select("*")
      .eq("is_salary", false)
      .order("date_registered", { ascending: false });
    
    if (error) {
      console.error("Erro ao buscar débitos e créditos:", error);
      throw error;
    }
    
    console.log(`Encontrados ${data?.length || 0} processos de débito e crédito:`, data);
    return data || [];
  } catch (error) {
    console.error("Erro ao buscar débitos e créditos:", error);
    return [];
  }
};

export const cleanupDuplicateProcesses = async (): Promise<{ removed: number }> => {
  try {
    console.log("Iniciando limpeza de processos duplicados...");
    
    // 1. Primeiro, obter todos os processos
    const { data: allProcesses, error: fetchError } = await supabase
      .from("file_processes")
      .select("*")
      .order("created_at", { ascending: true });
    
    if (fetchError) {
      console.error("Erro ao buscar processos para limpeza:", fetchError);
      throw fetchError;
    }
    
    if (!allProcesses || allProcesses.length === 0) {
      console.log("Nenhum processo encontrado para limpeza");
      return { removed: 0 };
    }
    
    // 2. Identificar duplicados por operation_number
    const seenOperationNumbers = new Set();
    const seenTaskAndName = new Set();
    const duplicateIds: string[] = [];
    
    for (const process of allProcesses) {
      // Verificar duplicados por número de operação
      if (process.operation_number) {
        if (seenOperationNumbers.has(process.operation_number)) {
          if (process.id) duplicateIds.push(process.id);
        } else {
          seenOperationNumbers.add(process.operation_number);
        }
      } 
      // Verificar duplicados por task+as400_name quando não há operation_number
      else if (process.task && process.as400_name) {
        const key = `${process.task}|${process.as400_name}`;
        if (seenTaskAndName.has(key)) {
          if (process.id) duplicateIds.push(process.id);
        } else {
          seenTaskAndName.add(key);
        }
      }
    }
    
    console.log(`Encontrados ${duplicateIds.length} processos duplicados para remoção:`, duplicateIds);
    
    if (duplicateIds.length === 0) {
      return { removed: 0 };
    }
    
    // 3. Remover duplicados
    const { error: deleteError } = await supabase
      .from("file_processes")
      .delete()
      .in("id", duplicateIds);
    
    if (deleteError) {
      console.error("Erro ao excluir processos duplicados:", deleteError);
      throw deleteError;
    }
    
    console.log(`${duplicateIds.length} processos duplicados removidos com sucesso`);
    return { removed: duplicateIds.length };
    
  } catch (error) {
    console.error("Erro ao limpar processos duplicados:", error);
    throw error;
  }
};

export const getProcessesStatsByMonth = async (): Promise<any[]> => {
  try {
    console.log("Buscando estatísticas por mês...");
    
    const { data, error } = await supabase
      .from("file_processes")
      .select("*")
      .order("date_registered", { ascending: false });
    
    if (error) {
      console.error("Erro ao buscar estatísticas:", error);
      throw error;
    }
    
    console.log("Dados recebidos para estatísticas:", data);
    if (!data || data.length === 0) {
      console.warn("Nenhum dado encontrado para gerar estatísticas");
      return [];
    }
    
    // Agrupar por mês e contar processos de salários vs débitos e créditos vs outros
    const statsMap = new Map();
    
    data.forEach(process => {
      const date = new Date(process.date_registered);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!statsMap.has(monthYear)) {
        statsMap.set(monthYear, { 
          month: monthYear, 
          salary: 0, 
          debit_credit: 0,
          other: 0 
        });
      }
      
      const stats = statsMap.get(monthYear);
      
      if (process.as400_name) {
        if (process.as400_name.startsWith("SA")) {
          stats.salary += 1;
        } else {
          stats.debit_credit += 1;
        }
      } else if (process.task) {
        stats.other += 1;
      }
    });
    
    // Converter o Map para array e ordenar por data
    const result = Array.from(statsMap.values())
      .sort((a, b) => {
        const [aMonth, aYear] = a.month.split('/').map(Number);
        const [bMonth, bYear] = b.month.split('/').map(Number);
        
        if (aYear !== bYear) return aYear - bYear;
        return aMonth - bMonth;
      });
    
    console.log("Estatísticas agrupadas por mês:", result);
    return result;
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return [];
  }
};
