
import { supabase } from "@/integrations/supabase/client";

export interface FileProcess {
  id?: string;
  date_registered?: string;
  time_registered: string;
  task: string;
  as400_name: string;
  operation_number: string;
  executed_by: string;
  is_salary?: boolean;
}

export const saveFileProcess = async (process: FileProcess): Promise<{ error: any; data: any }> => {
  // Verificar se o processo é um salário (começa com SA)
  const isSalary = process.as400_name.startsWith("SA");
  
  try {
    console.log("Salvando processo:", { ...process, is_salary: isSalary });
    
    const { data, error } = await supabase
      .from("file_processes")
      .insert({
        time_registered: process.time_registered,
        task: process.task,
        as400_name: process.as400_name,
        operation_number: process.operation_number,
        executed_by: process.executed_by,
        is_salary: isSalary
      })
      .select();
    
    if (error) {
      console.error("Erro ao salvar processo:", error);
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
      return [];
    }
    
    console.log(`Encontrados ${data?.length || 0} processos`);
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
      return [];
    }
    
    console.log(`Encontrados ${data?.length || 0} processos de salário`);
    return data || [];
  } catch (error) {
    console.error("Erro ao buscar salários:", error);
    return [];
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
      return [];
    }
    
    // Agrupar por mês e contar processos normais vs salários
    const statsMap = new Map();
    
    data?.forEach(process => {
      const date = new Date(process.date_registered);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!statsMap.has(monthYear)) {
        statsMap.set(monthYear, { month: monthYear, salary: 0, normal: 0 });
      }
      
      const stats = statsMap.get(monthYear);
      
      if (process.is_salary) {
        stats.salary += 1;
      } else {
        stats.normal += 1;
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
    
    console.log("Estatísticas por mês:", result);
    return result;
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return [];
  }
};
