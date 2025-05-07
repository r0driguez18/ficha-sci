import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { saveFileProcess } from '@/services/fileProcessService';
import { Turno3TasksComponent } from '@/components/tasks/Turno3Tasks';
import { generateTaskboardPDF } from '@/utils/pdfGenerator';
import { TurnInfoSection } from '@/components/taskboard/TurnInfoSection';
import { TableRowsSection } from '@/components/taskboard/TableRowsSection';
import { FormActions } from '@/components/taskboard/FormActions';
import type { TurnKey, TasksType, TurnDataType, Turno3Tasks } from '@/types/taskboard';
import type { TaskTableRow } from '@/types/taskTableRow';

const operatorsList = [
  { value: "nalves", label: "Nelson Alves" },
  { value: "etavares", label: "Evandro Tavares" },
  { value: "edelgado", label: "Emanuel Delgado" },
  { value: "sbarbosa", label: "Silvino Barbosa" },
  { value: "lspencer", label: "Louis Spencer" }
];

const TaskboardDiaNaoUtil = () => {
  const navigate = useNavigate();
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [tableRows, setTableRows] = useState<TaskTableRow[]>([
    { id: 1, hora: '', tarefa: '', nomeAs: '', operacao: '', executado: '' }
  ]);

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
    transferirFicheirosDsi: false
  });

  // Load data from localStorage if available
  useEffect(() => {
    const savedDate = localStorage.getItem('taskboard-nao-util-date');
    const savedTurnData = localStorage.getItem('taskboard-nao-util-turnData');
    const savedTasks = localStorage.getItem('taskboard-nao-util-tasks');
    const savedTableRows = localStorage.getItem('taskboard-nao-util-tableRows');

    if (savedDate) setDate(savedDate);
    if (savedTurnData) setTurnData(JSON.parse(savedTurnData));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedTableRows) setTableRows(JSON.parse(savedTableRows));
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('taskboard-nao-util-date', date);
    localStorage.setItem('taskboard-nao-util-turnData', JSON.stringify(turnData));
    localStorage.setItem('taskboard-nao-util-tasks', JSON.stringify(tasks));
    localStorage.setItem('taskboard-nao-util-tableRows', JSON.stringify(tableRows));
  }, [date, turnData, tasks, tableRows]);

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

  const resetForm = () => {
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
      transferirFicheirosDsi: false
    });
    setTableRows([{ id: 1, hora: '', tarefa: '', nomeAs: '', operacao: '', executado: '' }]);
    
    localStorage.removeItem('taskboard-nao-util-date');
    localStorage.removeItem('taskboard-nao-util-turnData');
    localStorage.removeItem('taskboard-nao-util-tasks');
    localStorage.removeItem('taskboard-nao-util-tableRows');
    
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
          confirmarAtualizacaoSisp: false,
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

      // Pass isDiaNaoUtil=true to indicate this is a non-working day PDF
      const doc = generateTaskboardPDF(date, completeTurnData, completeTasksData, tableRows, true);
      doc.save(`taskboard_nao_util_${date.replace(/-/g, '')}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    }
  };

  return (
    <div className="container py-6">
      <Card>
        <CardHeader>
          <CardTitle>Ficha de Procedimentos - Dia Não Útil</CardTitle>
          <CardDescription>Preencha as informações necessárias para o dia não útil</CardDescription>
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
          
          <FormActions
            onSave={handleSave}
            onExportPDF={exportToPDF}
            onReset={resetForm}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskboardDiaNaoUtil;
