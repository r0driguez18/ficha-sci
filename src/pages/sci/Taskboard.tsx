import React, { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { saveExportedTaskboard } from '@/services/exportedTaskboardService';

const operatorsList = [
  { value: "nalves", label: "Nelson Alves" },
  { value: "etavares", label: "Evandro Tavares" },
  { value: "edelgado", label: "Emanuel Delgado" },
  { value: "sbarbosa", label: "Silvino Barbosa" },
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
          executed_by: row.executado
        });
        
        if (!result.error) {
          savedCount++;
          
          // If it's a collection process, create a return record
          if (row.tipo === 'cobrancas' && row.tarefa && user?.id) {
            try {
              const { createCobrancaRetorno } = await import('@/services/cobrancasRetornoService');
              await createCobrancaRetorno(user.id, date, row.tarefa);
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
    }
  };

  // Save taskboard data to Supabase (without signature validation)
  const handleSave = async () => {
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
    } catch (error) {
      console.error('Erro ao guardar ficha:', error);
      toast.error('Erro ao guardar ficha. Tente novamente.');
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
    // Verificar se está assinado primeiro
    if (!signerName || !signatureDataUrl) {
      toast.error("Não é possível exportar PDF sem assinatura. Preencha o nome do responsável e assine a ficha.");
      return;
    }

    try {
      setIsLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Utilizador não autenticado");
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
      
      const fileName = `Taskboard_${getFormType()}_${date}_${signerName.replace(/\s+/g, '_')}.pdf`;
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
    <div className="container py-6">
      <Card>
        <CardHeader>
          <CardTitle>Ficha de Procedimentos</CardTitle>
          <CardDescription>Preencha as informações necessárias para cada turno</CardDescription>
          {user && <p className="text-sm text-muted-foreground">Dados sincronizados na nuvem</p>}
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="turno1">Turno 1</TabsTrigger>
              <TabsTrigger value="turno2">Turno 2</TabsTrigger>
              <TabsTrigger value="turno3">Turno 3</TabsTrigger>
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
