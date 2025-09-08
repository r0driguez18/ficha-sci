import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTaskboardSync } from '@/services/taskboardService';
import type { TurnKey, TasksType, TurnDataType } from '@/types/taskboard';
import type { TaskTableRow } from '@/types/taskTableRow';
import { toast } from 'sonner';

const initialTurnData: TurnDataType = {
  turno1: { operator: '', entrada: '', saida: '', observations: '' },
  turno2: { operator: '', entrada: '', saida: '', observations: '' },
  turno3: { operator: '', entrada: '', saida: '', observations: '' }
};

const initialTasks: TasksType = {
  turno1: {
    datacenter: false,
    sistemas: false,
    servicos: false,
    abrirServidores: false,
    percurso76931: false,
    enviar: false,
    etr: false,
    impostos: false,
    inpsExtrato: false,
    vistoUsa: false,
    ben: false,
    bcta: false,
    verificarDebitos: false,
    enviarReportes: false,
    verificarRecepcaoSisp: false,
    backupsDiferidos: false,
    processarTef: false,
    processarTelecomp: false,
    enviarSegundoEtr: false,
    enviarFicheiroCom: false,
    dia01: false,
    dia08: false,
    dia16: false,
    dia23: false,
    atualizarCentralRisco: false,
    bmjrn: false,
    grjrcv: false,
    aujrn: false,
    mvdia1: false,
    mvdia2: false,
    brjrn: false,
    verificarAsc: false,
    verificarCsv: false,
    verificarEci: false
  },
  turno2: {
    datacenter: false,
    sistemas: false,
    servicos: false,
    verificarReportes: false,
    verificarDebitos: false,
    inpsProcessar: false,
    inpsEnviarRetorno: false,
    processarTef: false,
    processarTelecomp: false,
    enviarEci: false,
    enviarEdv: false,
    confirmarAtualizacaoFicheiros: false,
    validarSaco: false,
    verificarPendentes: false,
    fecharBalcoes: false
  },
  turno3: {
    verificarDebitos: false,
    tratarTapes: false,
    fecharServidores: false,
    fecharImpressoras: false,
    userFecho: false,
    listaRequisicoesCheques: false,
    cancelarCartoesClientes: false,
    prepararEnviarAsc: false,
    adicionarRegistrosBanka: false,
    fecharServidoresBanka: false,
    alterarInternetBanking: false,
    prepararEnviarCsv: false,
    fecharRealTime: false,
    fecharRealTimeHora: '',
    prepararEnviarEtr: false,
    fazerLoggOffAml: false,
    aplicarFicheiroErroEtr: false,
    validarBalcao14: false,
    fecharBalcao14: false,
    arranqueManual: false,
    inicioFecho: false,
    inicioFechoHora: '',
    validarEnvioEmail: false,
    controlarTrabalhos: false,
    saveBmbck: false,
    abrirServidoresInternet: false,
    imprimirCheques: false,
    backupBm: false,
    validarFicheiroCcln: false,
    aplicarFicheirosCompensacao: false,
    validarSaldoConta: false,
    saldoContaValor: '',
    saldoNegativo: false,
    saldoPositivo: false,
    abrirRealTime: false,
    abrirRealTimeHora: '',
    verificarTransacoes: false,
    aplicarFicheiroVisa: false,
    cativarCartoes: false,
    abrirBcaDireto: false,
    abrirServidoresBanka: false,
    atualizarTelefonesOffline: false,
    verificarReplicacao: false,
    enviarFicheiroCsv: false,
    transferirFicheirosLiquidity: false,
    percurso76921: false,
    percurso76922: false,
    percurso76923: false,
    abrirServidoresTesteProducao: false,
    impressaoCheques: false,
    arquivarCheques: false,
    terminoFecho: false,
    terminoFechoHora: '',
    transferirFicheirosDsi: false,
    limpaGbtrlogFimMes: false
  }
};

export const useTaskboard = () => {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isEndOfMonth, setIsEndOfMonth] = useState(false);
  const [tableRows, setTableRows] = useState<TaskTableRow[]>([
    { id: 1, hora: '', tarefa: '', nomeAs: '', operacao: '', executado: '', tipo: '' }
  ]);
  const [activeTab, setActiveTab] = useState('turno1');
  const [isLoading, setIsLoading] = useState(true);
  const [signerName, setSignerName] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [turnData, setTurnData] = useState<TurnDataType>(initialTurnData);
  const [tasks, setTasks] = useState<TasksType>(initialTasks);

  const getFormType = useCallback((): string => {
    return 'dia-util';
  }, []);

  const { syncData, loadData, resetData } = useTaskboardSync(
    'dia-util',
    date,
    turnData,
    tasks,
    tableRows,
    activeTab
  );

  // Memoized calculations
  const completedTasksCount = useMemo(() => {
    const turno = activeTab as TurnKey;
    const turnoTasks = tasks[turno];
    return Object.values(turnoTasks).filter(task => 
      typeof task === 'boolean' ? task : task !== ''
    ).length;
  }, [tasks, activeTab]);

  const validTableRowsCount = useMemo(() => {
    return tableRows.filter(row => {
      const hasRequiredCommonFields = 
        row.hora.trim() !== '' && 
        row.executado.trim() !== '';
      
      const taskOnlyOption = 
        hasRequiredCommonFields && 
        row.tarefa.trim() !== '';
                         
      const asWithOperationOption = 
        hasRequiredCommonFields && 
        row.nomeAs.trim() !== '' &&
        row.operacao.trim() !== '';
                         
      return taskOnlyOption || asWithOperationOption;
    }).length;
  }, [tableRows]);

  // Optimized data loading
  const loadTaskboardData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const taskboardData = await loadData();
      if (taskboardData) {
        if (taskboardData.date) setDate(taskboardData.date);
        if (taskboardData.turn_data) {
          const typedTurnData: TurnDataType = {
            turno1: taskboardData.turn_data.turno1 || initialTurnData.turno1,
            turno2: taskboardData.turn_data.turno2 || initialTurnData.turno2,
            turno3: taskboardData.turn_data.turno3 || initialTurnData.turno3
          };
          setTurnData(typedTurnData);
        }
        if (taskboardData.tasks) {
          const typedTasks: TasksType = {
            turno1: taskboardData.tasks.turno1 || initialTasks.turno1,
            turno2: taskboardData.tasks.turno2 || initialTasks.turno2,
            turno3: taskboardData.tasks.turno3 || initialTasks.turno3
          };
          setTasks(typedTasks);
        }
        if (taskboardData.table_rows) setTableRows(taskboardData.table_rows);
        if (taskboardData.active_tab) setActiveTab(taskboardData.active_tab);
      }
    } catch (error) {
      console.error("Error loading taskboard data:", error);
      toast.error("Erro ao carregar dados. Usando configuração padrão.");
    } finally {
      setIsLoading(false);
    }
  }, [user, loadData]);

  // Optimized task change handler
  const handleTaskChange = useCallback((turno: TurnKey, task: string, checked: boolean | string) => {
    setTasks(prevTasks => ({
      ...prevTasks,
      [turno]: {
        ...prevTasks[turno],
        [task]: checked
      }
    }));
  }, []);

  // Optimized turn data change handler
  const handleTurnDataChange = useCallback((turno: TurnKey, field: string, value: string) => {
    setTurnData(prevTurnData => ({
      ...prevTurnData,
      [turno]: {
        ...prevTurnData[turno],
        [field]: value
      }
    }));
  }, []);

  // Table row operations
  const addTableRow = useCallback(() => {
    setTableRows(prevRows => [
      ...prevRows,
      {
        id: prevRows.length + 1,
        hora: '',
        tarefa: '',
        nomeAs: '',
        operacao: '',
        executado: '',
        tipo: ''
      }
    ]);
  }, []);

  const removeTableRow = useCallback(() => {
    setTableRows(prevRows => prevRows.length > 1 ? prevRows.slice(0, -1) : prevRows);
  }, []);

  const handleInputChange = useCallback((id: number, field: keyof TaskTableRow, value: string) => {
    if (field === 'operacao') {
      const numericValue = value.replace(/\D/g, '').slice(0, 9);
      setTableRows(prevRows =>
        prevRows.map(row => 
          row.id === id ? { ...row, [field]: numericValue } : row
        )
      );
      return;
    }
    
    setTableRows(prevRows =>
      prevRows.map(row => 
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  }, []);

  // Reset form
  const resetForm = useCallback(async () => {
    setDate(new Date().toISOString().split('T')[0]);
    setTurnData(initialTurnData);
    setTasks(initialTasks);
    setTableRows([{ id: 1, hora: '', tarefa: '', nomeAs: '', operacao: '', executado: '', tipo: '' }]);
    setActiveTab('turno1');
    setSignerName("");
    setSignatureDataUrl(null);
    
    try {
      await resetData();
      toast.success("Formulário reiniciado com sucesso!");
    } catch (error) {
      console.error("Error resetting form:", error);
      toast.error("Erro ao reiniciar formulário.");
    }
  }, [resetData]);

  // Check if end of month
  useEffect(() => {
    if (date) {
      const currentDate = new Date(date);
      const lastDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      ).getDate();
      
      setIsEndOfMonth(currentDate.getDate() === lastDayOfMonth);
    }
  }, [date]);

  // Auto-sync data
  useEffect(() => {
    if (!isLoading) {
      syncData();
    }
  }, [date, turnData, tasks, tableRows, activeTab, isLoading, syncData]);

  return {
    // State
    date,
    setDate,
    isEndOfMonth,
    tableRows,
    activeTab,
    setActiveTab,
    isLoading,
    signerName,
    setSignerName,
    signatureDataUrl,
    setSignatureDataUrl,
    turnData,
    tasks,
    
    // Computed values
    completedTasksCount,
    validTableRowsCount,
    
    // Methods
    getFormType,
    loadTaskboardData,
    handleTaskChange,
    handleTurnDataChange,
    addTableRow,
    removeTableRow,
    handleInputChange,
    resetForm,
    syncData,
    loadData,
    resetData
  };
};