import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { saveFileProcess } from '@/services/fileProcessService';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from '@/components/auth/AuthProvider';
import { Turno1TasksComponent } from '@/components/tasks/Turno1Tasks';
import { Turno2TasksComponent } from '@/components/tasks/Turno2Tasks';
import { Turno3TasksComponent } from '@/components/tasks/Turno3Tasks';
import { generateTaskboardPDF } from '@/utils/pdfGenerator';
import { TurnInfoSection } from '@/components/taskboard/TurnInfoSection';
import { TableRowsSection } from '@/components/taskboard/TableRowsSection';
import { FormActions } from '@/components/taskboard/FormActions';
import { SignatureSection } from '@/components/taskboard/SignatureSection';
import { useTaskboardSync } from '@/services/taskboardService';
import type { TurnKey, TasksType, TurnDataType } from '@/types/taskboard';
import type { TaskTableRow } from '@/types/taskTableRow';
import { sendFechoInicioNotification, sendFechoTerminoNotification } from '@/services/telegramService';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { saveExportedTaskboard, checkDuplicateOperations } from '@/services/exportedTaskboardService';
import { createCobrancaRetorno } from '@/services/cobrancasRetornoService';

const operatorsList = [
  { value: "nalves", label: "Nelson Alves" },
  { value: "etavares", label: "Evandro Tavares" },
  { value: "edelgado", label: "Emanuel Delgado" },
  { value: "ebrito", label: "Elvis Brito" },
  { value: "lspencer", label: "Louis Spencer" }
];

const processFormSchema = z.object({
  operacao: z.string().regex(/^\d{9}$/, {
    message: "O número de operação deve conter exatamente 9 dígitos"
  }),
  executado: z.string({
    required_error: "Por favor selecione um operador"
  })
});

const Taskboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isEndOfMonth, setIsEndOfMonth] = useState<boolean>(false);
  const [tableRows, setTableRows] = useState<TaskTableRow[]>([
    { id: 1, hora: '', tarefa: '', nomeAs: '', operacao: '', executado: '', tipo: '' }
  ]);
  const [activeTab, setActiveTab] = useState('turno1');
const [isLoading, setIsLoading] = useState(true);

  // Assinatura digital
  const [signerName, setSignerName] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const [turnData, setTurnData] = useState<TurnDataType>({
    turno1: { operator: '', entrada: '', saida: '', observations: '' },
    turno2: { operator: '', entrada: '', saida: '', observations: '' },
    turno3: { operator: '', entrada: '', saida: '', observations: '' }
  });

  const [tasks, setTasks] = useState<TasksType>({
    turno1: {
      datacenter: false,
      sistemas: false,
      servicos: false,
      abrirServidores: false,
      percurso76931: false,
      percurso76857: false,
      percurso76857_7h30: false,
      percurso76857_10h: false,
      percurso76857_12h: false,
      validacaoDigitalizacaoFichaDiaria: false,
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
      envioFicheirosVisa12h30: false,
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
      restoreBmBcaCv2: false,
      duptapBmSemBcaCv2: false,
      diferidosBmmes: false,
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
      percurso76857: false,
      percurso76857_14h: false,
      percurso76857_16h: false,
      percurso76857_19h: false,
      inpsProcessar: false,
      inpsEnviarRetorno: false,
      processarTef: false,
      processarTelecomp: false,
      rececaoFicheirosVisaVss: false,
      enviarEciEdv: false,
      confirmarAtualizacaoFicheiros: false,
      envioFicheirosVisaPafCaf: false,
      validarSaco: false,
      verificarPendentes: false,
      fecharBalcoes: false,
      verificarSistemas2: false
    },
    turno3: {
      datacenter: false,
      sistemas: false,
      verificarDebitos: false,
      tratarTapes: false,
      fecharServidores: false,
      fecharImpressoras: false,
      requisicoesCheques: false,
      gerarFicheiroAsc: false,
      fecharBalcao22: false,
      userFecho7624: false,
      userFechoBankaRemota: false,
      userFechoServidoresBanka: false,
      userFechoInternetBanking: false,
      fecharPfs: false,
      prepararCsv: false,
      interromperRealTime: false,
      interromperRealTimeHora: '',
      percurso768989: false,
      prepararFicheiroEtr: false,
      loggOffUtilizadores: false,
      aplicarFicheiroErro: false,
      validarBalcao14: false,
      bloquearNearsoft: false,
      fecharBalcao14: false,
      percurso43: false,
      inicioFecho: false,
      inicioFechoHora: '',
      enviarSmsArranque: false,
      validarEnvioEmail: false,
      controlarTrabalhos: false,
      paragemAberturaServidores: false,
      ativarNearsoft: false,
      saveBmbck: false,
      imprimirCheques: false,
      backupBm: false,
      aplicarFicheirosCompensacao: false,
      tratarPendentesCartoes: false,
      consultarSaldoConta: false,
      saldoNegativo: false,
      saldoPositivo: false,
      abrirRealTime: false,
      abrirRealTimeHora: '',
      verificarEntradaTransacoes: false,
      abrirBcaDireto: false,
      userFechoAbrirServidores: false,
      abrirServidoresPfs: false,
      atualizaTelefones: false,
      efetuarTesteCarregamento: false,
      verificarReplicacao: false,
      enviarFicheiroCsv: false,
      terminoFecho: false,
      terminoFechoHora: '',
      enviarSmsFim: false,
      percurso76921: false,
      percurso76922: false,
      percurso76923: false,
      impressaoCheques: false,
      arquivarCheques: false
    }
  });

  // Helper function to determine form type
  const getFormType = (): string => {
    return 'dia-util'; // For now, always return dia-util. Can be enhanced later.
  };

  const { syncData, loadData, resetData } = useTaskboardSync(
    'dia-util',
    date,
    turnData,
    tasks,
    tableRows,
    activeTab
  );

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        if (user) {
          const taskboardData = await loadData();
          if (taskboardData) {
            if (taskboardData.date) setDate(taskboardData.date);
            if (taskboardData.turn_data) {
              // Ensure we have the correct TurnDataType structure
              const typedTurnData: TurnDataType = {
                turno1: taskboardData.turn_data.turno1 || turnData.turno1,
                turno2: taskboardData.turn_data.turno2 || turnData.turno2,
                turno3: taskboardData.turn_data.turno3 || turnData.turno3
              };
              setTurnData(typedTurnData);
            }
            if (taskboardData.tasks) {
              // Ensure we have the correct TasksType structure
              const typedTasks: TasksType = {
                turno1: taskboardData.tasks.turno1 || tasks.turno1,
                turno2: taskboardData.tasks.turno2 || tasks.turno2,
                turno3: taskboardData.tasks.turno3 || tasks.turno3
              };
              setTasks(typedTasks);
            }
            if (taskboardData.table_rows) setTableRows(taskboardData.table_rows);
            if (taskboardData.active_tab) setActiveTab(taskboardData.active_tab);
          } else {
            // Try to load from localStorage as fallback
            const savedDate = localStorage.getItem('taskboard-date');
            const savedTurnData = localStorage.getItem('taskboard-turnData');
            const savedTasks = localStorage.getItem('taskboard-tasks');
            const savedTableRows = localStorage.getItem('taskboard-tableRows');
            const savedActiveTab = localStorage.getItem('taskboard-activeTab');

            if (savedDate) setDate(savedDate);
            if (savedTurnData) setTurnData(JSON.parse(savedTurnData));
            if (savedTasks) setTasks(JSON.parse(savedTasks));
            if (savedTableRows) setTableRows(JSON.parse(savedTableRows));
            if (savedActiveTab) setActiveTab(savedActiveTab);
          }
        } else {
          // No user, just use localStorage
          const savedDate = localStorage.getItem('taskboard-date');
          const savedTurnData = localStorage.getItem('taskboard-turnData');
          const savedTasks = localStorage.getItem('taskboard-tasks');
          const savedTableRows = localStorage.getItem('taskboard-tableRows');
          const savedActiveTab = localStorage.getItem('taskboard-activeTab');

          if (savedDate) setDate(savedDate);
          if (savedTurnData) setTurnData(JSON.parse(savedTurnData));
          if (savedTasks) setTasks(JSON.parse(savedTasks));
          if (savedTableRows) setTableRows(JSON.parse(savedTableRows));
          if (savedActiveTab) setActiveTab(savedActiveTab);
        }
      } catch (error) {
        console.error("Error loading taskboard data:", error);
        toast.error("Erro ao carregar dados. Usando configuração padrão.");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [user]);

  useEffect(() => {
    if (!isLoading) {
      syncData();
    }
  }, [date, turnData, tasks, tableRows, activeTab, isLoading]);

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

  const handleTaskChange = (turno: TurnKey, task: string, checked: boolean | string) => {
    // Send Telegram Notification ONLY if user is intentionally clicking the checkbox (not on page load)
    if (turno === 'turno3' && checked === true && tasks[turno][task as keyof typeof tasks[typeof turno]] !== true) {
      const operator = operatorsList.find(op => op.value === turnData.turno3.operator);
      const operatorName = operator?.label || 'Operador';
      
      if (task === 'inicioFecho') {
        sendFechoInicioNotification(operatorName);
      } else if (task === 'terminoFecho') {
        sendFechoTerminoNotification(operatorName);
      }
    }

    setTasks({
      ...tasks,
      [turno]: {
        ...tasks[turno],
        [task]: checked
      }
    });
  };

  const handleTurnDataChange = (turno: TurnKey, field: string, value: string) => {
    setTurnData({
      ...turnData,
      [turno]: {
        ...turnData[turno],
        [field]: value
      }
    });
  };

  const addTableRow = () => {
    const newRow = {
      id: tableRows.length + 1,
      hora: '',
      tarefa: '',
      nomeAs: '',
      operacao: '',
      executado: '',
      tipo: ''
    };
    setTableRows([...tableRows, newRow]);
  };

  const removeTableRow = () => {
    if (tableRows.length > 1) {
      setTableRows(tableRows.slice(0, -1));
    }
  };

  const handleInputChange = (id: number, field: keyof TaskTableRow, value: string) => {
    if (field === 'operacao') {
      const numericValue = value.replace(/\D/g, '').slice(0, 9);
      setTableRows(
        tableRows.map(row => 
          row.id === id ? { ...row, [field]: numericValue } : row
        )
      );
      return;
    }
    
    setTableRows(
      tableRows.map(row => 
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  const saveTableRowsToSupabase = async () => {
    try {
      const rowsToSave = tableRows.filter(row => {
        const hasRequiredCommonFields = 
          row.hora.trim() !== '' && 
          row.executado.trim() !== '';
        
        // If tarefa is filled, we don't need nomeAs or operacao
        const taskOnlyOption = 
          hasRequiredCommonFields && 
          row.tarefa.trim() !== '';
                           
        // If nomeAs is filled, then operacao is required
        const asWithOperationOption = 
          hasRequiredCommonFields && 
          row.nomeAs.trim() !== '' &&
          row.operacao.trim() !== '';
                           
        return taskOnlyOption || asWithOperationOption;
      });
      
      if (rowsToSave.length === 0) {
        toast.error("Nenhum dado válido para salvar. Preencha pelo menos Hora, (Tarefa OU (Nome AS400 E Nº Operação)), e Executado Por.");
        return { savedCount: 0, duplicateCount: 0 };
      }
      
      // Verificar se está assinado
      if (!signerName || !signatureDataUrl) {
        toast.error("Não é possível guardar sem assinatura. Preencha o nome do responsável e assine a ficha.");
        return { savedCount: 0, duplicateCount: 0 };
      }
      
      let savedCount = 0;
      let duplicateCount = 0;
      
      for (const row of rowsToSave) {
        console.log("Processando linha:", row);
        const result = await saveFileProcess({
          time_registered: row.hora,
          task: row.tarefa,
          as400_name: row.tarefa.trim() !== '' && row.nomeAs.trim() === '' ? null : row.nomeAs,
          operation_number: row.operacao || null,
          executed_by: row.executado,
          tipo: row.tipo || null
        });
        
        if (!result.error) {
          savedCount++;
          
          // If it's a collection process, create a return record
          if (row.tipo === 'cobrancas' && user?.id) {
            const ficheiroNome = row.nomeAs?.trim() || row.tarefa?.trim() || 'Cobrança sem nome';
            try {
              console.log('Criando retorno para cobrança:', ficheiroNome);
              await createCobrancaRetorno(user.id, date, ficheiroNome);
            } catch (returnErr) {
              console.error('Error creating collection return:', returnErr);
            }
          }
        } else if (result.error.message && result.error.message.includes("já existe")) {
          duplicateCount++;
        }
      }
      
      console.log(`Salvos ${savedCount} registros e ignorados ${duplicateCount} registros duplicados no Supabase`);
      return { savedCount, duplicateCount };
    } catch (error) {
      console.error('Erro ao salvar dados no Supabase:', error);
      return { savedCount: 0, duplicateCount: 0 };
// Save taskboard data to Supabase (without signature validation)
  const handleSave = async () => {
    // Verificar se está validado
    if (!signerName || signerName.trim() === '') {
      toast.error("A ficha não pode ser guardada sem ser validada (Selecione o seu nome na secção 'Validado por').");
      return;
    }

    // Validação Estrutural: Número de Operação deve ter 9 dígitos numéricos
    const invalidFormatOps = tableRows.filter(r => r.operacao && r.operacao.trim() !== '' && !/^\d{9}$/.test(r.operacao.trim()));
    if (invalidFormatOps.length > 0) {
      toast.error("O(s) número(s) de operação deve(m) conter exatamente 9 dígitos. Verifique a tabela.");
      return;
    }

    // Validação de Duplicação de Operações no Sistema
    const opsToCheck = tableRows.map(r => r.operacao?.trim()).filter(Boolean);
    if (opsToCheck.length > 0) {
      const duplicates = await checkDuplicateOperations(getFormType(), date, opsToCheck);
      if (duplicates.length > 0) {
        toast.error(`A(s) seguinte(s) operação(ões) já se encontram no arquivo e não podem ser duplicadas: ${duplicates.join(', ')}`);
        return;
      }
    }
    
    // Validate operator, entrada, saida for all turns
    const turnLabels = { turno1: 'Turno 1', turno2: 'Turno 2', turno3: 'Turno 3' };
    for (const key of ['turno1', 'turno2', 'turno3'] as TurnKey[]) {
      const td = turnData[key];
      if (!td.operator || !td.entrada || !td.saida) {
        toast.error(`Preencha Operador, Entrada e Saída do ${turnLabels[key]} antes de guardar.`);
        return;
      }
    }

    try {
      setIsLoading(true);

      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        toast.error("Utilizador não autenticado");
        return;
      }

      const taskboardData = {
        user_id: user.data.user.id,
        form_type: getFormType(),
        date,
        turn_data: turnData,
        tasks,
        table_rows: tableRows,
        active_tab: activeTab
      };

      // Salvar processamentos da tabela
      const { savedCount, duplicateCount } = await saveTableRowsToSupabase();
      
      toast.success("Ficha guardada com sucesso!");
      
      if (savedCount > 0) {
        toast.success(`${savedCount} processamentos salvos com sucesso!`);
        
        if (duplicateCount > 0) {
          toast.info(`${duplicateCount} processamentos foram ignorados por já existirem no sistema.`);
        }
        
        toast.message(
          "Dados salvos com sucesso!",
          {
            action: {
              label: "Ver Gráficos",
              onClick: () => navigate("/easyvista/dashboards")
            }
          }
        );
      } else if (duplicateCount > 0) {
        toast.info(`Todos os ${duplicateCount} processamentos já existem no sistema.`);
      }
      // Save to exported_taskboards for history
      const signature = {
        signerName: signerName || '',
        signedAt: new Date().toISOString(),
        imageDataUrl: signatureDataUrl
      };
      
      await saveExportedTaskboard(
        user.data.user.id,
        getFormType(),
        date,
        turnData,
        tasks,
        tableRows,
        signature
      );
    } catch (error) {
      console.error('Erro ao guardar ficha:', error);
      toast.error('Erro ao guardar ficha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = async () => {
    setDate(new Date().toISOString().split('T')[0]);
    setTurnData({
      turno1: { operator: '', entrada: '', saida: '', observations: '' },
      turno2: { operator: '', entrada: '', saida: '', observations: '' },
      turno3: { operator: '', entrada: '', saida: '', observations: '' }
    });
    
    setTasks({
      turno1: {
        datacenter: false,
        sistemas: false,
        servicos: false,
        abrirServidores: false,
        percurso76931: false,
        percurso76857: false,
        percurso76857_7h30: false,
        percurso76857_10h: false,
        percurso76857_12h: false,
        validacaoDigitalizacaoFichaDiaria: false,
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
        envioFicheirosVisa12h30: false,
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
        restoreBmBcaCv2: false,
        duptapBmSemBcaCv2: false,
        diferidosBmmes: false,
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
        percurso76857: false,
        percurso76857_14h: false,
        percurso76857_16h: false,
        percurso76857_19h: false,
        inpsProcessar: false,
        inpsEnviarRetorno: false,
        processarTef: false,
        processarTelecomp: false,
        rececaoFicheirosVisaVss: false,
        enviarEciEdv: false,
        confirmarAtualizacaoFicheiros: false,
        envioFicheirosVisaPafCaf: false,
        validarSaco: false,
        verificarPendentes: false,
        fecharBalcoes: false,
        verificarSistemas2: false
      },
      turno3: {
        datacenter: false,
        sistemas: false,
        verificarDebitos: false,
        tratarTapes: false,
        fecharServidores: false,
        fecharImpressoras: false,
        requisicoesCheques: false,
        gerarFicheiroAsc: false,
        fecharBalcao22: false,
        userFecho7624: false,
        userFechoBankaRemota: false,
        userFechoServidoresBanka: false,
        userFechoInternetBanking: false,
        fecharPfs: false,
        prepararCsv: false,
        interromperRealTime: false,
        interromperRealTimeHora: '',
        percurso768989: false,
        prepararFicheiroEtr: false,
        loggOffUtilizadores: false,
        aplicarFicheiroErro: false,
        validarBalcao14: false,
        bloquearNearsoft: false,
        fecharBalcao14: false,
        percurso43: false,
        inicioFecho: false,
        inicioFechoHora: '',
        enviarSmsArranque: false,
        validarEnvioEmail: false,
        controlarTrabalhos: false,
        paragemAberturaServidores: false,
        ativarNearsoft: false,
        saveBmbck: false,
        imprimirCheques: false,
        backupBm: false,
        aplicarFicheirosCompensacao: false,
        tratarPendentesCartoes: false,
        consultarSaldoConta: false,
        saldoNegativo: false,
        saldoPositivo: false,
        abrirRealTime: false,
        abrirRealTimeHora: '',
        verificarEntradaTransacoes: false,
        abrirBcaDireto: false,
        userFechoAbrirServidores: false,
        abrirServidoresPfs: false,
        atualizaTelefones: false,
        efetuarTesteCarregamento: false,
        verificarReplicacao: false,
        enviarFicheiroCsv: false,
        terminoFecho: false,
        terminoFechoHora: '',
        enviarSmsFim: false,
        percurso76921: false,
        percurso76922: false,
        percurso76923: false,
        impressaoCheques: false,
        arquivarCheques: false
      }
    });
    setTableRows([{ id: 1, hora: '', tarefa: '', nomeAs: '', operacao: '', executado: '', tipo: '' }]);
    setActiveTab('turno1');
    setSignerName("");
    setSignatureDataUrl(null);
    
    // Reset both localStorage and Supabase
    await resetData();
    
    toast.success('Formulário reiniciado com sucesso!');
  };

  const exportToPDF = async () => {
    // Verificar se está validado
    if (!signerName || signerName.trim() === '') {
      toast.error("A ficha não pode ser gerada sem ser validada (Selecione o seu nome na secção 'Validado por').");
      return;
    }

    // Validação Estrutural: Número de Operação deve ter 9 dígitos numéricos
    const invalidFormatOps = tableRows.filter(r => r.operacao && r.operacao.trim() !== '' && !/^\\d{9}$/.test(r.operacao.trim()));
    if (invalidFormatOps.length > 0) {
      toast.error("O(s) número(s) de operação deve(m) conter exatamente 9 dígitos. Verifique a tabela.");
      return;
    }

    try {
      setIsLoading(true);
      
      // Validação de Duplicação de Operações no Sistema
      const opsToCheck = tableRows.map(r => r.operacao?.trim()).filter(Boolean);
      if (opsToCheck.length > 0) {
        const duplicates = await checkDuplicateOperations(getFormType(), date, opsToCheck);
        if (duplicates.length > 0) {
          toast.error(`A(s) seguinte(s) operação(ões) já se encontram no arquivo e não podem ser duplicadas: ${duplicates.join(', ')}`);
          setIsLoading(false);
          return;
        }
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Utilizador não autenticado");
        setIsLoading(false);
        return;
      }

      const doc = generateTaskboardPDF(
        date,
        turnData,
        tasks,
        tableRows,
        false,
        isEndOfMonth,
        { imageDataUrl: signatureDataUrl, signerName, signedAt: new Date().toISOString() }
      );
      
      const [yyyy, mm, dd] = date.split('-');
      const yy = yyyy.slice(2);
      const fileName = `FD ${dd}${mm}${yy}.pdf`;
      doc.save(fileName);
      
      // Save to exported taskboards history
      const signatureData = {
        signerName,
        signedAt: new Date().toISOString(),
        imageDataUrl: signatureDataUrl
      };
      
      const { error: saveError } = await saveExportedTaskboard(
        user.id,
        getFormType(),
        date,
        turnData,
        tasks,
        tableRows,
        signatureData
      );
      
      if (saveError) {
        console.error('Erro ao salvar no histórico:', saveError);
        toast.error('PDF gerado mas houve erro ao salvar no histórico');
      } else {
        toast.success(`PDF gerado e salvo no histórico: ${fileName}`);
        
        // Atualizar a data para o dia seguinte após exportação bem-sucedida
        const currentDate = new Date(date);
        currentDate.setDate(currentDate.getDate() + 1);
        const nextDate = currentDate.toISOString().split('T')[0];
        setDate(nextDate);
        toast.info(`Data atualizada para ${nextDate}`);
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>A carregar dados...</p>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-5xl">
      <Card className="shadow-sm border">
        <CardHeader className="pb-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-foreground">Ficha de Procedimentos</CardTitle>
              <CardDescription className="mt-1">Preencha as informações necessárias para cada turno</CardDescription>
            </div>
            {user && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-subtle" />
                Sincronizado
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6">
            <Label htmlFor="date" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="max-w-xs mt-1.5"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 h-11 p-1 bg-muted">
              <TabsTrigger value="turno1" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 font-medium">Turno 1</TabsTrigger>
              <TabsTrigger value="turno2" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 font-medium">Turno 2</TabsTrigger>
              <TabsTrigger value="turno3" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 font-medium">Turno 3</TabsTrigger>
            </TabsList>
            
            <TabsContent value="turno1">
              <div className="space-y-6">
                <TurnInfoSection
                  turnKey="turno1"
                  operator={turnData.turno1.operator}
                  entrada={turnData.turno1.entrada}
                  saida={turnData.turno1.saida}
                  title="Turno 1"
                  operatorsList={operatorsList}
                  onTurnDataChange={handleTurnDataChange}
                />
                
                <div className="mt-6">
                  <Turno1TasksComponent
                    tasks={tasks.turno1}
                    onTaskChange={(task, checked) => handleTaskChange('turno1', task, checked)}
                    observations={turnData.turno1.observations}
                    onObservationsChange={(value) => handleTurnDataChange('turno1', 'observations', value)}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="turno2">
              <div className="space-y-6">
                <TurnInfoSection
                  turnKey="turno2"
                  operator={turnData.turno2.operator}
                  entrada={turnData.turno2.entrada}
                  saida={turnData.turno2.saida}
                  title="Turno 2"
                  operatorsList={operatorsList}
                  onTurnDataChange={handleTurnDataChange}
                />
                
                <div className="mt-6">
                  <Turno2TasksComponent
                    tasks={tasks.turno2}
                    onTaskChange={(task, checked) => handleTaskChange('turno2', task, checked)}
                    observations={turnData.turno2.observations}
                    onObservationsChange={(value) => handleTurnDataChange('turno2', 'observations', value)}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="turno3">
              <div className="space-y-6">
                <TurnInfoSection
                  turnKey="turno3"
                  operator={turnData.turno3.operator}
                  entrada={turnData.turno3.entrada}
                  saida={turnData.turno3.saida}
                  title="Turno 3"
                  operatorsList={operatorsList}
                  onTurnDataChange={handleTurnDataChange}
                />
                
                <div className="mt-6">
                  <Turno3TasksComponent
                    tasks={tasks.turno3}
                    onTaskChange={(task, value) => handleTaskChange('turno3', task, value)}
                    observations={turnData.turno3.observations}
                    onObservationsChange={(value) => handleTurnDataChange('turno3', 'observations', value)}
                    isEndOfMonth={isEndOfMonth}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <TableRowsSection
            tableRows={tableRows}
            operatorsList={operatorsList}
            onAddRow={addTableRow}
            onRemoveRow={removeTableRow}
            onInputChange={handleInputChange}
          />

          <SignatureSection
            signerName={signerName}
            onSignerNameChange={setSignerName}
            signatureDataUrl={signatureDataUrl}
            onSignatureChange={setSignatureDataUrl}
          />
          
          <FormActions
            onSave={handleSave}
            onExportPDF={exportToPDF}
            onReset={resetForm}
            isValidated={!!signerName && !!signatureDataUrl}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Taskboard;
