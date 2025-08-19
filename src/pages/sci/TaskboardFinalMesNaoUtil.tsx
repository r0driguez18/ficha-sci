import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { saveFileProcess } from '@/services/fileProcessService';
import { useAuth } from '@/components/auth/AuthProvider';
import { Turno3TasksComponent } from '@/components/tasks/Turno3Tasks';
import { generateTaskboardPDF } from '@/utils/pdfGenerator';
import { TurnInfoSection } from '@/components/taskboard/TurnInfoSection';
import { TableRowsSection } from '@/components/taskboard/TableRowsSection';
import { FormActions } from '@/components/taskboard/FormActions';
import { SignatureSection } from '@/components/taskboard/SignatureSection';

import type { TurnKey, TasksType, TurnDataType, Turno3Tasks } from '@/types/taskboard';
import type { TaskTableRow } from '@/types/taskTableRow';
import { Loader2 } from 'lucide-react';

const operatorsList = [
  { value: "nalves", label: "Nelson Alves" },
  { value: "etavares", label: "Evandro Tavares" },
  { value: "edelgado", label: "Emanuel Delgado" },
  { value: "sbarbosa", label: "Silvino Barbosa" },
  { value: "lspencer", label: "Louis Spencer" }
];

const TaskboardFinalMesNaoUtil = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [tableRows, setTableRows] = useState<TaskTableRow[]>([
    { id: 1, hora: '', tarefa: '', nomeAs: '', operacao: '', executado: '' }
  ]);
  const [isLoading, setIsLoading] = useState(true);

  // Assinatura digital
  const [signerName, setSignerName] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // For non-working days, we only have one turn (Turn 3)
  const [turnData, setTurnData] = useState<{
    operator: string;
    entrada: string;
    saida: string;
    observations: string;
  }>({
    operator: '',
    entrada: '',
    saida: '',
    observations: ''
  });

  const [tasks, setTasks] = useState<Turno3Tasks>({
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
    limpaGbtrlogFimMes: false // Ensure this is in the initial state
  });

  // Load data from Supabase or localStorage on component mount
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        if (user) {
          // Direct async calls without the problematic hook
          const { loadTaskboardData } = await import('@/services/taskboardService');
          const { data: taskboardData } = await loadTaskboardData(user.id, 'final-mes-nao-util', date);
          
          if (taskboardData) {
            if (taskboardData.date) setDate(taskboardData.date);
            if (taskboardData.turn_data?.turno3) setTurnData(taskboardData.turn_data.turno3);
            if (taskboardData.tasks?.turno3) setTasks(taskboardData.tasks.turno3);
            if (taskboardData.table_rows) setTableRows(taskboardData.table_rows);
          } else {
            // Try to load from localStorage as fallback
            const savedDate = localStorage.getItem('taskboard-final-mes-nao-util-date');
            const savedTurnData = localStorage.getItem('taskboard-final-mes-nao-util-turnData');
            const savedTasks = localStorage.getItem('taskboard-final-mes-nao-util-tasks');
            const savedTableRows = localStorage.getItem('taskboard-final-mes-nao-util-tableRows');

            if (savedDate) setDate(savedDate);
            if (savedTurnData) setTurnData(JSON.parse(savedTurnData));
            if (savedTasks) setTasks(JSON.parse(savedTasks));
            if (savedTableRows) setTableRows(JSON.parse(savedTableRows));
          }
        } else {
          // No user, just use localStorage
          const savedDate = localStorage.getItem('taskboard-final-mes-nao-util-date');
          const savedTurnData = localStorage.getItem('taskboard-final-mes-nao-util-turnData');
          const savedTasks = localStorage.getItem('taskboard-final-mes-nao-util-tasks');
          const savedTableRows = localStorage.getItem('taskboard-final-mes-nao-util-tableRows');

          if (savedDate) setDate(savedDate);
          if (savedTurnData) setTurnData(JSON.parse(savedTurnData));
          if (savedTasks) setTasks(JSON.parse(savedTasks));
          if (savedTableRows) setTableRows(JSON.parse(savedTableRows));
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

  // Save data to localStorage and Supabase whenever it changes - with debounce
  React.useEffect(() => {
    if (!isLoading && user) {
      const timeoutId = setTimeout(async () => {
        try {
          const { saveTaskboardData } = await import('@/services/taskboardService');
          await saveTaskboardData({
            user_id: user.id,
            form_type: 'final-mes-nao-util',
            date,
            turn_data: { turno3: turnData },
            tasks: { turno3: tasks },
            table_rows: tableRows
          });
          
          // Also save to localStorage as backup
          localStorage.setItem('taskboard-final-mes-nao-util-date', date);
          localStorage.setItem('taskboard-final-mes-nao-util-turnData', JSON.stringify(turnData));
          localStorage.setItem('taskboard-final-mes-nao-util-tasks', JSON.stringify(tasks));
          localStorage.setItem('taskboard-final-mes-nao-util-tableRows', JSON.stringify(tableRows));
        } catch (error) {
          console.error('Error syncing data:', error);
        }
      }, 500); // Debounce for 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [date, turnData, tasks, tableRows, isLoading, user]);

  const handleTaskChange = (task: keyof Turno3Tasks, checked: boolean | string) => {
    setTasks({
      ...tasks,
      [task]: checked
    });
  };

  const handleTurnDataChange = (field: string, value: string) => {
    setTurnData({
      ...turnData,
      [field]: value
    });
  };

  const addTableRow = () => {
    const newRow = {
      id: tableRows.length + 1,
      hora: '',
      tarefa: '',
      nomeAs: '',
      operacao: '',
      executado: ''
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

  const handleSave = async () => {
    const { savedCount, duplicateCount } = await saveTableRowsToSupabase();
    
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
    } else {
      toast.error('Nenhum processamento foi salvo. Verifique os dados.');
    }
  };

  const resetForm = async () => {
    setDate(new Date().toISOString().split('T')[0]);
    setTurnData({
      operator: '',
      entrada: '',
      saida: '',
      observations: ''
    });
    
    setTasks({
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
      limpaGbtrlogFimMes: false // Ensure this is included in the reset state
    });
    
    setTableRows([{ id: 1, hora: '', tarefa: '', nomeAs: '', operacao: '', executado: '' }]);
    
    // clear signature
    setSignerName("");
    setSignatureDataUrl(null);
    
    // Reset localStorage and Supabase
    if (user) {
      try {
        const { deleteTaskboardData } = await import('@/services/taskboardService');
        await deleteTaskboardData(user.id, 'final-mes-nao-util', date);
        
        // Clear localStorage
        localStorage.removeItem('taskboard-final-mes-nao-util-date');
        localStorage.removeItem('taskboard-final-mes-nao-util-turnData');
        localStorage.removeItem('taskboard-final-mes-nao-util-tasks');
        localStorage.removeItem('taskboard-final-mes-nao-util-tableRows');
      } catch (error) {
        console.error('Error resetting data:', error);
      }
    }
    
    toast.success('Formulário reiniciado com sucesso!');
  };

  const exportToPDF = () => {
    try {
      // Create the complete data structure needed for PDF generation
      const completeTasksData: TasksType = {
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
        turno3: tasks
      };

      const completeTurnData: TurnDataType = {
        turno1: { operator: '', entrada: '', saida: '', observations: '' },
        turno2: { operator: '', entrada: '', saida: '', observations: '' },
        turno3: {
          operator: turnData.operator,
          entrada: turnData.entrada,
          saida: turnData.saida,
          observations: turnData.observations
        }
      };

      // Pass isDiaNaoUtil=true AND isEndOfMonth=true to indicate this is a non-working end-of-month day PDF
      const doc = generateTaskboardPDF(
        date,
        completeTurnData,
        completeTasksData,
        tableRows,
        true,
        true,
        { imageDataUrl: signatureDataUrl, signerName, signedAt: new Date().toLocaleString('pt-PT') }
      );
      doc.save(`taskboard_final_mes_nao_util_${date.replace(/-/g, '')}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
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
          <CardTitle>Ficha de Procedimentos - Final do Mês Dia Não Útil</CardTitle>
          <CardDescription>Preencha as informações necessárias para o dia não útil de final de mês</CardDescription>
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

          <div className="space-y-6">
            <TurnInfoSection
              turnKey="turno3"
              operator={turnData.operator}
              entrada={turnData.entrada}
              saida={turnData.saida}
              title="Operador"
              operatorsList={operatorsList}
              onTurnDataChange={handleTurnDataChange}
            />
            
            <div className="mt-6">
              <Turno3TasksComponent
                tasks={tasks}
                onTaskChange={handleTaskChange}
                observations={turnData.observations}
                onObservationsChange={(value) => handleTurnDataChange('observations', value)}
                isEndOfMonth={true} // Always show the end-of-month task for this component
              />
            </div>
          </div>

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

export default TaskboardFinalMesNaoUtil;
