import { useState, useEffect, useCallback } from 'react';
import { 
  getFileProcesses, 
  getSalaryProcesses, 
  getCobrancasProcesses, 
  getCompensacaoProcesses, 
  getProcessesStatsByMonth,
  FileProcess 
} from '@/services/fileProcessService';
import { toast } from 'sonner';

interface ProcessesData {
  all: FileProcess[];
  salary: FileProcess[];
  cobrancas: FileProcess[];
  compensacao: FileProcess[];
  stats: any[];
}

interface UseProcessesReturn {
  data: ProcessesData;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Cache for processes data
const processesCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key: string) => {
  const cached = processesCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  processesCache.set(key, { data, timestamp: Date.now() });
};

export const useProcesses = (): UseProcessesReturn => {
  const [data, setData] = useState<ProcessesData>({
    all: [],
    salary: [],
    cobrancas: [],
    compensacao: [],
    stats: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProcesses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cachedAll = getCachedData('all-processes');
      const cachedSalary = getCachedData('salary-processes');
      const cachedCobrancas = getCachedData('cobrancas-processes');
      const cachedCompensacao = getCachedData('compensacao-processes');
      const cachedStats = getCachedData('processes-stats');

      if (cachedAll && cachedSalary && cachedCobrancas && cachedCompensacao && cachedStats) {
        setData({
          all: cachedAll,
          salary: cachedSalary,
          cobrancas: cachedCobrancas,
          compensacao: cachedCompensacao,
          stats: cachedStats
        });
        setLoading(false);
        return;
      }

      // Load data in parallel for better performance
      const [allProcesses, salaryProcesses, cobrancasProcesses, compensacaoProcesses, statsData] = 
        await Promise.all([
          getFileProcesses(),
          getSalaryProcesses(),
          getCobrancasProcesses(),
          getCompensacaoProcesses(),
          getProcessesStatsByMonth()
        ]);

      // Cache the results
      setCachedData('all-processes', allProcesses);
      setCachedData('salary-processes', salaryProcesses);
      setCachedData('cobrancas-processes', cobrancasProcesses);
      setCachedData('compensacao-processes', compensacaoProcesses);
      setCachedData('processes-stats', statsData);

      setData({
        all: allProcesses,
        salary: salaryProcesses,
        cobrancas: cobrancasProcesses,
        compensacao: compensacaoProcesses,
        stats: statsData
      });

      if (allProcesses.length === 0 && salaryProcesses.length === 0) {
        toast.info("Nenhum dado de processamento disponível. Adicione alguns processos para visualizá-los aqui.");
      }
    } catch (err) {
      console.error("Erro ao carregar dados de processos:", err);
      setError("Erro ao carregar dados. Por favor, tente novamente.");
      toast.error("Erro ao carregar dados. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    // Clear cache on manual refresh
    processesCache.clear();
    await loadProcesses();
    toast.success("Dados atualizados com sucesso!");
  }, [loadProcesses]);

  useEffect(() => {
    loadProcesses();
  }, [loadProcesses]);

  return {
    data,
    loading,
    error,
    refresh
  };
};